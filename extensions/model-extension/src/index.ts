import {
  fs,
  downloadFile,
  abortDownload,
  InferenceEngine,
  joinPath,
  ModelExtension,
  Model,
  getJanDataFolderPath,
  events,
  DownloadEvent,
  DownloadRoute,
  DownloadState,
  OptionType,
  ImportingModel,
  LocalImportModelEvent,
  baseName,
  GpuSetting,
  DownloadRequest,
  executeOnMain,
  HuggingFaceRepoData,
  Quantization,
  log,
  getFileSize,
  AllQuantizations,
  ModelEvent,
} from '@janhq/core'

import { extractFileName } from './helpers/path'
import { GGUFMetadata, gguf } from '@huggingface/gguf'
import { NotSupportedModelError } from './@types/NotSupportModelError'
import { InvalidHostError } from './@types/InvalidHostError'

/**
 * A extension for models
 */
export default class JanModelExtension extends ModelExtension {
  private static readonly _homeDir = 'file://models'
  private static readonly _modelMetadataFileName = 'model.json'
  private static readonly _supportedModelFormat = '.gguf'
  private static readonly _incompletedModelFileName = '.download'
  private static readonly _offlineInferenceEngine = [
    InferenceEngine.nitro,
    InferenceEngine.nitro_tensorrt_llm,
  ]
  private static readonly _tensorRtEngineFormat = '.engine'
  private static readonly _supportedGpuArch = ['ampere', 'ada']
  private static readonly _safetensorsRegexs = [
    /model\.safetensors$/,
    /model-[0-9]+-of-[0-9]+\.safetensors$/,
  ]
  private static readonly _pytorchRegexs = [
    /pytorch_model\.bin$/,
    /consolidated\.[0-9]+\.pth$/,
    /pytorch_model-[0-9]+-of-[0-9]+\.bin$/,
    /.*\.pt$/,
  ]
  interrupted = false

  /**
   * Called when the extension is loaded.
   * @override
   */
  async onLoad() {
    // Handle Desktop Events
    this.handleDesktopEvents()
  }

  /**
   * Called when the extension is unloaded.
   * @override
   */
  async onUnload() {}

  /**
   * Downloads a machine learning model.
   * @param model - The model to download.
   * @param network - Optional object to specify proxy/whether to ignore SSL certificates.
   * @returns A Promise that resolves when the model is downloaded.
   */
  async downloadModel(
    model: Model,
    gpuSettings?: GpuSetting,
    network?: { ignoreSSL?: boolean; proxy?: string }
  ): Promise<void> {
    // create corresponding directory
    const modelDirPath = await joinPath([JanModelExtension._homeDir, model.id])
    if (!(await fs.existsSync(modelDirPath))) await fs.mkdir(modelDirPath)
    const modelJsonPath = await joinPath([modelDirPath, 'model.json'])
    if (!(await fs.existsSync(modelJsonPath))) {
      await fs.writeFileSync(modelJsonPath, JSON.stringify(model, null, 2))
      events.emit(ModelEvent.OnModelsUpdate, {})
    }
    if (model.engine === InferenceEngine.nitro_tensorrt_llm) {
      if (!gpuSettings || gpuSettings.gpus.length === 0) {
        console.error('No GPU found. Please check your GPU setting.')
        return
      }
      const firstGpu = gpuSettings.gpus[0]
      if (!firstGpu.name.toLowerCase().includes('nvidia')) {
        console.error('No Nvidia GPU found. Please check your GPU setting.')
        return
      }
      const gpuArch = firstGpu.arch
      if (gpuArch === undefined) {
        console.error(
          'No GPU architecture found. Please check your GPU setting.'
        )
        return
      }

      if (!JanModelExtension._supportedGpuArch.includes(gpuArch)) {
        console.debug(
          `Your GPU: ${JSON.stringify(firstGpu)} is not supported. Only 30xx, 40xx series are supported.`
        )
        return
      }

      const os = 'windows' // TODO: remove this hard coded value

      const newSources = model.sources.map((source) => {
        const newSource = { ...source }
        newSource.url = newSource.url
          .replace(/<os>/g, os)
          .replace(/<gpuarch>/g, gpuArch)
        return newSource
      })
      model.sources = newSources
    }

    console.debug(`Download sources: ${JSON.stringify(model.sources)}`)

    if (model.sources.length > 1) {
      // path to model binaries
      for (const source of model.sources) {
        let path = extractFileName(
          source.url,
          JanModelExtension._supportedModelFormat
        )
        if (source.filename) {
          path = await joinPath([modelDirPath, source.filename])
        }
        const downloadRequest: DownloadRequest = {
          url: source.url,
          localPath: path,
        }
        downloadFile(downloadRequest, network)
      }
      // TODO: handle multiple binaries for web later
    } else {
      const fileName = extractFileName(
        model.sources[0]?.url,
        JanModelExtension._supportedModelFormat
      )
      const path = await joinPath([modelDirPath, fileName])
      const downloadRequest: DownloadRequest = {
        url: model.sources[0]?.url,
        localPath: path,
      }
      downloadFile(downloadRequest, network)

      if (window && window.core?.api && window.core.api.baseApiUrl) {
        this.startPollingDownloadProgress(model.id)
      }
    }
  }

  private toHuggingFaceUrl(repoId: string): string {
    try {
      const url = new URL(repoId)
      if (url.host !== 'huggingface.co') {
        throw new InvalidHostError(`Invalid Hugging Face repo URL: ${repoId}`)
      }

      const paths = url.pathname.split('/').filter((e) => e.trim().length > 0)
      if (paths.length < 2) {
        throw new InvalidHostError(`Invalid Hugging Face repo URL: ${repoId}`)
      }

      return `${url.origin}/api/models/${paths[0]}/${paths[1]}`
    } catch (err) {
      if (err instanceof InvalidHostError) {
        throw err
      }

      if (repoId.startsWith('https')) {
        throw new Error(`Cannot parse url: ${repoId}`)
      }

      return `https://huggingface.co/api/models/${repoId}`
    }
  }

  async fetchHuggingFaceRepoData(repoId: string): Promise<HuggingFaceRepoData> {
    const sanitizedUrl = this.toHuggingFaceUrl(repoId)
    console.debug('sanitizedUrl', sanitizedUrl)

    const res = await fetch(sanitizedUrl)
    const response = await res.json()
    if (response['error'] != null) {
      throw new Error(response['error'])
    }

    const data = response as HuggingFaceRepoData

    if (data.tags.indexOf('gguf') === -1) {
      throw new NotSupportedModelError(
        `${repoId} is not supported. Only GGUF models are supported.`
      )
    }

    const promises: Promise<number>[] = []

    // fetching file sizes
    const url = new URL(sanitizedUrl)
    const paths = url.pathname.split('/').filter((e) => e.trim().length > 0)

    for (const sibling of data.siblings) {
      const downloadUrl = `https://huggingface.co/${paths[2]}/${paths[3]}/resolve/main/${sibling.rfilename}`
      sibling.downloadUrl = downloadUrl
      promises.push(getFileSize(downloadUrl))
    }

    const result = await Promise.all(promises)
    for (let i = 0; i < data.siblings.length; i++) {
      data.siblings[i].fileSize = result[i]
    }

    AllQuantizations.forEach((quantization) => {
      data.siblings.forEach((sibling) => {
        if (!sibling.quantization && sibling.rfilename.includes(quantization)) {
          sibling.quantization = quantization
        }
      })
    })

    data.modelUrl = `https://huggingface.co/${paths[2]}/${paths[3]}`
    return data
  }

  async fetchModelMetadata(url: string): Promise<GGUFMetadata> {
    const { metadata } = await gguf(url)
    return metadata
  }

  /**
   * Specifically for Jan server.
   */
  private async startPollingDownloadProgress(modelId: string): Promise<void> {
    // wait for some seconds before polling
    await new Promise((resolve) => setTimeout(resolve, 3000))

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        fetch(
          `${window.core.api.baseApiUrl}/v1/download/${DownloadRoute.getDownloadProgress}/${modelId}`,
          {
            method: 'GET',
            headers: { contentType: 'application/json' },
          }
        ).then(async (res) => {
          const state: DownloadState = await res.json()
          if (state.downloadState === 'end') {
            events.emit(DownloadEvent.onFileDownloadSuccess, state)
            clearInterval(interval)
            resolve()
            return
          }

          if (state.downloadState === 'error') {
            events.emit(DownloadEvent.onFileDownloadError, state)
            clearInterval(interval)
            resolve()
            return
          }

          events.emit(DownloadEvent.onFileDownloadUpdate, state)
        })
      }, 1000)
    })
  }

  /**
   * Cancels the download of a specific machine learning model.
   *
   * @param {string} modelId - The ID of the model whose download is to be cancelled.
   * @returns {Promise<void>} A promise that resolves when the download has been cancelled.
   */
  async cancelModelDownload(modelId: string): Promise<void> {
    const path = await joinPath([JanModelExtension._homeDir, modelId, modelId])
    try {
      await abortDownload(path)
      await fs.unlinkSync(path)
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * Deletes a machine learning model.
   * @param filePath - The path to the model file to delete.
   * @returns A Promise that resolves when the model is deleted.
   */
  async deleteModel(modelId: string): Promise<void> {
    try {
      const dirPath = await joinPath([JanModelExtension._homeDir, modelId])
      const jsonFilePath = await joinPath([
        dirPath,
        JanModelExtension._modelMetadataFileName,
      ])
      const modelInfo = JSON.parse(
        await this.readModelMetadata(jsonFilePath)
      ) as Model

      const isUserImportModel =
        modelInfo.metadata?.author?.toLowerCase() === 'user'
      if (isUserImportModel) {
        // just delete the folder
        return fs.rm(dirPath)
      }

      // remove all files under dirPath except model.json
      const files = await fs.readdirSync(dirPath)
      const deletePromises = files.map(async (fileName: string) => {
        if (fileName !== JanModelExtension._modelMetadataFileName) {
          return fs.unlinkSync(await joinPath([dirPath, fileName]))
        }
      })
      await Promise.allSettled(deletePromises)
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * Saves a machine learning model.
   * @param model - The model to save.
   * @returns A Promise that resolves when the model is saved.
   */
  async saveModel(model: Model): Promise<void> {
    const jsonFilePath = await joinPath([
      JanModelExtension._homeDir,
      model.id,
      JanModelExtension._modelMetadataFileName,
    ])

    try {
      await fs.writeFileSync(jsonFilePath, JSON.stringify(model, null, 2))
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * Gets all downloaded models.
   * @returns A Promise that resolves with an array of all models.
   */
  async getDownloadedModels(): Promise<Model[]> {
    return await this.getModelsMetadata(
      async (modelDir: string, model: Model) => {
        if (!JanModelExtension._offlineInferenceEngine.includes(model.engine))
          return true

        // model binaries (sources) are absolute path & exist
        const existFiles = await Promise.all(
          model.sources.map((source) => fs.existsSync(source.url))
        )
        if (existFiles.every((exist) => exist)) return true

        const result = await fs
          .readdirSync(await joinPath([JanModelExtension._homeDir, modelDir]))
          .then((files: string[]) => {
            // Model binary exists in the directory
            // Model binary name can match model ID or be a .gguf file and not be an incompleted model file
            return (
              files.includes(modelDir) ||
              files.filter((file) => {
                if (
                  file.endsWith(JanModelExtension._incompletedModelFileName)
                ) {
                  return false
                }
                return (
                  file
                    .toLowerCase()
                    .includes(JanModelExtension._supportedModelFormat) ||
                  file
                    .toLowerCase()
                    .includes(JanModelExtension._tensorRtEngineFormat)
                )
              })?.length > 0 // TODO: find better way (can use basename to check the file name with source url)
            )
          })

        return result
      }
    )
  }

  private async getModelsMetadata(
    selector?: (path: string, model: Model) => Promise<boolean>
  ): Promise<Model[]> {
    try {
      if (!(await fs.existsSync(JanModelExtension._homeDir))) {
        console.debug('Model folder not found')
        return []
      }

      const files: string[] = await fs.readdirSync(JanModelExtension._homeDir)

      const allDirectories: string[] = []
      for (const file of files) {
        if (file === '.DS_Store') continue
        if (file === 'config') continue
        allDirectories.push(file)
      }

      const readJsonPromises = allDirectories.map(async (dirName) => {
        // filter out directories that don't match the selector
        // read model.json
        const jsonPath = await joinPath([
          JanModelExtension._homeDir,
          dirName,
          JanModelExtension._modelMetadataFileName,
        ])

        if (await fs.existsSync(jsonPath)) {
          // if we have the model.json file, read it
          let model = await this.readModelMetadata(jsonPath)

          model = typeof model === 'object' ? model : JSON.parse(model)

          // This to ensure backward compatibility with `model.json` with `source_url`
          if (model['source_url'] != null) {
            model['sources'] = [
              {
                filename: model.id,
                url: model['source_url'],
              },
            ]
          }

          if (selector && !(await selector?.(dirName, model))) {
            return
          }
          return model
        } else {
          // otherwise, we generate our own model file
          // TODO: we might have more than one binary file here. This will be addressed with new version of Model file
          //  which is the PR from Hiro on branch Jan can see
          return this.generateModelMetadata(dirName)
        }
      })
      const results = await Promise.allSettled(readJsonPromises)
      const modelData = results.map((result) => {
        if (result.status === 'fulfilled' && result.value) {
          try {
            const model =
              typeof result.value === 'object'
                ? result.value
                : JSON.parse(result.value)
            return model as Model
          } catch {
            console.debug(`Unable to parse model metadata: ${result.value}`)
          }
        }
        return undefined
      })

      return modelData.filter((e) => !!e)
    } catch (err) {
      console.error(err)
      return []
    }
  }

  private readModelMetadata(path: string) {
    return fs.readFileSync(path, 'utf-8')
  }

  /**
   * Handle the case where we have the model directory but we don't have the corresponding
   * model.json file associated with it.
   *
   * This function will create a model.json file for the model.
   * It works only with single binary file model.
   *
   * @param dirName the director which reside in ~/jan/models but does not have model.json file.
   */
  private async generateModelMetadata(dirName: string): Promise<Model> {
    const files: string[] = await fs.readdirSync(
      await joinPath([JanModelExtension._homeDir, dirName])
    )

    // sort files by name
    files.sort()

    // find the first file which is not a directory
    let binaryFileName: string | undefined = undefined
    let binaryFileSize: number | undefined = undefined

    for (const file of files) {
      if (file.endsWith(JanModelExtension._supportedModelFormat)) {
        const path = await joinPath([JanModelExtension._homeDir, dirName, file])
        const fileStats = await fs.fileStat(path)
        if (fileStats.isDirectory) continue
        binaryFileSize = fileStats.size
        binaryFileName = file
        break
      }
    }

    if (!binaryFileName) {
      console.warn(`Unable to find binary file for model ${dirName}`)
      return
    }

    const defaultModel = (await this.getDefaultModel()) as Model
    if (!defaultModel) {
      console.error('Unable to find default model')
      return
    }

    const model: Model = {
      ...defaultModel,
      // Overwrite default N/A fields
      id: dirName,
      name: dirName,
      sources: [
        {
          url: binaryFileName,
          filename: binaryFileName,
        },
      ],
      settings: {
        ...defaultModel.settings,
        llama_model_path: binaryFileName,
      },
      created: Date.now(),
      description: '',
      metadata: {
        size: binaryFileSize,
        author: 'User',
        tags: [],
      },
    }

    const modelFilePath = await joinPath([
      JanModelExtension._homeDir,
      dirName,
      JanModelExtension._modelMetadataFileName,
    ])

    await fs.writeFileSync(modelFilePath, JSON.stringify(model, null, 2))

    return model
  }

  override async getDefaultModel(): Promise<Model> {
    const defaultModel = DEFAULT_MODEL as Model
    return defaultModel
  }

  /**
   * Gets all available models.
   * @returns A Promise that resolves with an array of all models.
   */
  async getConfiguredModels(): Promise<Model[]> {
    return this.getModelsMetadata()
  }

  handleDesktopEvents() {
    if (window && window.electronAPI) {
      window.electronAPI.onFileDownloadUpdate(
        async (_event: string, state: DownloadState | undefined) => {
          if (!state) return
          state.downloadState = 'downloading'
          events.emit(DownloadEvent.onFileDownloadUpdate, state)
        }
      )
      window.electronAPI.onFileDownloadError(
        async (_event: string, state: DownloadState) => {
          state.downloadState = 'error'
          events.emit(DownloadEvent.onFileDownloadError, state)
        }
      )
      window.electronAPI.onFileDownloadSuccess(
        async (_event: string, state: DownloadState) => {
          state.downloadState = 'end'
          events.emit(DownloadEvent.onFileDownloadSuccess, state)
        }
      )
    }
  }

  private async importModelSymlink(
    modelBinaryPath: string,
    modelFolderName: string,
    modelFolderPath: string
  ): Promise<Model> {
    const fileStats = await fs.fileStat(modelBinaryPath, true)
    const binaryFileSize = fileStats.size

    // Just need to generate model.json there
    const defaultModel = (await this.getDefaultModel()) as Model
    if (!defaultModel) {
      console.error('Unable to find default model')
      return
    }

    const binaryFileName = await baseName(modelBinaryPath)

    const model: Model = {
      ...defaultModel,
      id: modelFolderName,
      name: modelFolderName,
      sources: [
        {
          url: modelBinaryPath,
          filename: binaryFileName,
        },
      ],
      settings: {
        ...defaultModel.settings,
        llama_model_path: binaryFileName,
      },
      created: Date.now(),
      description: '',
      metadata: {
        size: binaryFileSize,
        author: 'User',
        tags: [],
      },
    }

    const modelFilePath = await joinPath([
      modelFolderPath,
      JanModelExtension._modelMetadataFileName,
    ])

    await fs.writeFileSync(modelFilePath, JSON.stringify(model, null, 2))

    return model
  }

  async updateModelInfo(modelInfo: Partial<Model>): Promise<Model> {
    const modelId = modelInfo.id
    if (modelInfo.id == null) throw new Error('Model ID is required')

    const janDataFolderPath = await getJanDataFolderPath()
    const jsonFilePath = await joinPath([
      janDataFolderPath,
      'models',
      modelId,
      JanModelExtension._modelMetadataFileName,
    ])
    const model = JSON.parse(
      await this.readModelMetadata(jsonFilePath)
    ) as Model

    const updatedModel: Model = {
      ...model,
      ...modelInfo,
      metadata: {
        ...model.metadata,
        tags: modelInfo.metadata?.tags ?? [],
      },
    }

    await fs.writeFileSync(jsonFilePath, JSON.stringify(updatedModel, null, 2))
    return updatedModel
  }

  private async importModel(
    model: ImportingModel,
    optionType: OptionType
  ): Promise<Model> {
    const binaryName = (await baseName(model.path)).replace(/\s/g, '')

    let modelFolderName = binaryName
    if (binaryName.endsWith(JanModelExtension._supportedModelFormat)) {
      modelFolderName = binaryName.replace(
        JanModelExtension._supportedModelFormat,
        ''
      )
    }

    const modelFolderPath = await this.getModelFolderName(modelFolderName)
    await fs.mkdir(modelFolderPath)

    const uniqueFolderName = await baseName(modelFolderPath)
    const modelBinaryFile = binaryName.endsWith(
      JanModelExtension._supportedModelFormat
    )
      ? binaryName
      : `${binaryName}${JanModelExtension._supportedModelFormat}`

    const binaryPath = await joinPath([modelFolderPath, modelBinaryFile])

    if (optionType === 'SYMLINK') {
      return this.importModelSymlink(
        model.path,
        uniqueFolderName,
        modelFolderPath
      )
    }

    const srcStat = await fs.fileStat(model.path, true)

    // interval getting the file size to calculate the percentage
    const interval = setInterval(async () => {
      const destStats = await fs.fileStat(binaryPath, true)
      const percentage = destStats.size / srcStat.size
      events.emit(LocalImportModelEvent.onLocalImportModelUpdate, {
        ...model,
        percentage,
      })
    }, 1000)

    await fs.copyFile(model.path, binaryPath)

    clearInterval(interval)

    // generate model json
    return this.generateModelMetadata(uniqueFolderName)
  }

  private async getModelFolderName(
    modelFolderName: string,
    count?: number
  ): Promise<string> {
    const newModelFolderName = count
      ? `${modelFolderName}-${count}`
      : modelFolderName

    const janDataFolderPath = await getJanDataFolderPath()
    const modelFolderPath = await joinPath([
      janDataFolderPath,
      'models',
      newModelFolderName,
    ])

    const isFolderExist = await fs.existsSync(modelFolderPath)
    if (!isFolderExist) {
      return modelFolderPath
    } else {
      const newCount = (count ?? 0) + 1
      return this.getModelFolderName(modelFolderName, newCount)
    }
  }

  async importModels(
    models: ImportingModel[],
    optionType: OptionType
  ): Promise<void> {
    const importedModels: Model[] = []

    for (const model of models) {
      events.emit(LocalImportModelEvent.onLocalImportModelUpdate, model)
      try {
        const importedModel = await this.importModel(model, optionType)
        events.emit(LocalImportModelEvent.onLocalImportModelSuccess, {
          ...model,
          modelId: importedModel.id,
        })
        importedModels.push(importedModel)
      } catch (err) {
        events.emit(LocalImportModelEvent.onLocalImportModelFailed, {
          ...model,
          error: err,
        })
      }
    }

    events.emit(
      LocalImportModelEvent.onLocalImportModelFinished,
      importedModels
    )
  }

  private getGgufFileList(
    repoData: HuggingFaceRepoData,
    selectedQuantization: Quantization
  ): string[] {
    return repoData.siblings
      .map((file) => file.rfilename)
      .filter((file) => file.indexOf(selectedQuantization) !== -1)
      .filter((file) => file.endsWith('.gguf'))
  }

  private getFileList(repoData: HuggingFaceRepoData): string[] {
    // SafeTensors first, if not, then PyTorch
    const modelFiles = repoData.siblings
      .map((file) => file.rfilename)
      .filter((file) =>
        JanModelExtension._safetensorsRegexs.some((regex) => regex.test(file))
      )
    if (modelFiles.length === 0) {
      repoData.siblings.forEach((file) => {
        if (
          JanModelExtension._pytorchRegexs.some((regex) =>
            regex.test(file.rfilename)
          )
        ) {
          modelFiles.push(file.rfilename)
        }
      })
    }

    const vocabFiles = [
      'tokenizer.model',
      'vocab.json',
      'tokenizer.json',
    ].filter((file) =>
      repoData.siblings.some((sibling) => sibling.rfilename === file)
    )

    const etcFiles = repoData.siblings
      .map((file) => file.rfilename)
      .filter(
        (file) =>
          (file.endsWith('.json') && !vocabFiles.includes(file)) ||
          file.endsWith('.txt') ||
          file.endsWith('.py') ||
          file.endsWith('.tiktoken')
      )

    return [...modelFiles, ...vocabFiles, ...etcFiles]
  }

  private async getModelDirPath(repoID: string): Promise<string> {
    const modelName = repoID.split('/').slice(1).join('/')
    return joinPath([await getJanDataFolderPath(), 'models', modelName])
  }

  private async getConvertedModelPath(repoID: string): Promise<string> {
    const modelName = repoID.split('/').slice(1).join('/')
    const modelDirPath = await this.getModelDirPath(repoID)
    return joinPath([modelDirPath, modelName + '.gguf'])
  }

  private async getQuantizedModelPath(
    repoID: string,
    quantization: Quantization
  ): Promise<string> {
    const modelName = repoID.split('/').slice(1).join('/')
    const modelDirPath = await this.getModelDirPath(repoID)
    return joinPath([
      modelDirPath,
      modelName + `-${quantization.toLowerCase()}.gguf`,
    ])
  }
  private getCtxLength(config: {
    max_sequence_length?: number
    max_position_embeddings?: number
    n_ctx?: number
  }): number {
    if (config.max_sequence_length) return config.max_sequence_length
    if (config.max_position_embeddings) return config.max_position_embeddings
    if (config.n_ctx) return config.n_ctx
    return 4096
  }

  /**
   * Converts a Hugging Face model to GGUF.
   * @param repoID - The repo ID of the model to convert.
   * @returns A promise that resolves when the conversion is complete.
   */
  async convert(repoID: string): Promise<void> {
    if (this.interrupted) return
    const modelDirPath = await this.getModelDirPath(repoID)
    const modelOutPath = await this.getConvertedModelPath(repoID)
    if (!(await fs.existsSync(modelDirPath))) {
      throw new Error('Model dir not found')
    }
    if (await fs.existsSync(modelOutPath)) return

    await executeOnMain(NODE, 'installDeps')
    if (this.interrupted) return

    try {
      await executeOnMain(
        NODE,
        'convertHf',
        modelDirPath,
        modelOutPath + '.temp'
      )
    } catch (err) {
      log(`[Conversion]::Debug: Error using hf-to-gguf.py, trying convert.py`)

      let ctx = 4096
      try {
        const config = await fs.readFileSync(
          await joinPath([modelDirPath, 'config.json']),
          'utf8'
        )
        const configParsed = JSON.parse(config)
        ctx = this.getCtxLength(configParsed)
        configParsed.max_sequence_length = ctx
        await fs.writeFileSync(
          await joinPath([modelDirPath, 'config.json']),
          JSON.stringify(configParsed, null, 2)
        )
      } catch (err) {
        log(`${err}`)
        // ignore missing config.json
      }

      const bpe = await fs.existsSync(
        await joinPath([modelDirPath, 'vocab.json'])
      )

      await executeOnMain(
        NODE,
        'convert',
        modelDirPath,
        modelOutPath + '.temp',
        {
          ctx,
          bpe,
        }
      )
    }
    await executeOnMain(
      NODE,
      'renameSync',
      modelOutPath + '.temp',
      modelOutPath
    )

    for (const file of await fs.readdirSync(modelDirPath)) {
      if (
        modelOutPath.endsWith(file) ||
        (file.endsWith('config.json') && !file.endsWith('_config.json'))
      )
        continue
      await fs.unlinkSync(await joinPath([modelDirPath, file]))
    }
  }

  /**
   * Quantizes a GGUF model.
   * @param repoID - The repo ID of the model to quantize.
   * @param quantization - The quantization to use.
   * @returns A promise that resolves when the quantization is complete.
   */
  async quantize(repoID: string, quantization: Quantization): Promise<void> {
    if (this.interrupted) return
    const modelDirPath = await this.getModelDirPath(repoID)
    const modelOutPath = await this.getQuantizedModelPath(repoID, quantization)
    if (!(await fs.existsSync(modelDirPath))) {
      throw new Error('Model dir not found')
    }
    if (await fs.existsSync(modelOutPath)) return

    await executeOnMain(
      NODE,
      'quantize',
      await this.getConvertedModelPath(repoID),
      modelOutPath + '.temp',
      quantization
    )
    await executeOnMain(
      NODE,
      'renameSync',
      modelOutPath + '.temp',
      modelOutPath
    )

    await fs.unlinkSync(await this.getConvertedModelPath(repoID))
  }

  /**
   * Cancels the convert of current Hugging Face model.
   * @param repoID - The repository ID to cancel.
   * @param repoData - The repository data to cancel.
   * @returns {Promise<void>} A promise that resolves when the download has been cancelled.
   */
  async cancelConvert(
    repoID: string,
    repoData: HuggingFaceRepoData
  ): Promise<void> {
    this.interrupted = true
    const modelDirPath = await this.getModelDirPath(repoID)
    const files = this.getFileList(repoData)
    for (const file of files) {
      const filePath = file
      const localPath = await joinPath([modelDirPath, filePath])
      await abortDownload(localPath)
    }

    executeOnMain(NODE, 'killProcesses')
  }
}
