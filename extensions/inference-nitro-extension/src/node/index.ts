import fs from 'fs'
import path from 'path'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import tcpPortUsed from 'tcp-port-used'
import fetchRT from 'fetch-retry'
import {
  log,
  getSystemResourceInfo,
  InferenceEngine,
  ModelSettingParams,
  PromptTemplate,
  SystemInformation,
  getJanDataFolderPath,
  ModelFile,
} from '@janhq/core/node'
import { executableNitroFile } from './execute'
import terminate from 'terminate'
import decompress from 'decompress'

// Polyfill fetch with retry
const fetchRetry = fetchRT(fetch)

/**
 * The response object for model init operation.
 */
interface ModelInitOptions {
  modelFolder: string
  model: ModelFile
}
// The PORT to use for the Nitro subprocess
const PORT = 3928
// The HOST address to use for the Nitro subprocess
const LOCAL_HOST = '127.0.0.1'
// The URL for the Nitro subprocess
const NITRO_HTTP_SERVER_URL = `http://${LOCAL_HOST}:${PORT}`
// The URL for the Nitro subprocess to load a model
const NITRO_HTTP_LOAD_MODEL_URL = `${NITRO_HTTP_SERVER_URL}/inferences/server/loadmodel`
// The URL for the Nitro subprocess to validate a model
const NITRO_HTTP_VALIDATE_MODEL_URL = `${NITRO_HTTP_SERVER_URL}/inferences/server/modelstatus`
// The URL for the Nitro subprocess to kill itself
const NITRO_HTTP_KILL_URL = `${NITRO_HTTP_SERVER_URL}/processmanager/destroy`

const NITRO_PORT_FREE_CHECK_INTERVAL = 100

// The supported model format
// TODO: Should be an array to support more models
const SUPPORTED_MODEL_FORMAT = '.gguf'

// The subprocess instance for Nitro
let subprocess: ChildProcessWithoutNullStreams | undefined = undefined

// The current model settings
let currentSettings: (ModelSettingParams & { model?: string }) | undefined =
  undefined

/**
 * Stops a Nitro subprocess.
 * @param wrapper - The model wrapper.
 * @returns A Promise that resolves when the subprocess is terminated successfully, or rejects with an error message if the subprocess fails to terminate.
 */
function unloadModel(): Promise<void> {
  return killSubprocess()
}

/**
 * Initializes a Nitro subprocess to load a machine learning model.
 * @param wrapper - The model wrapper.
 * @returns A Promise that resolves when the model is loaded successfully, or rejects with an error message if the model is not found or fails to load.
 * TODO: Should pass absolute of the model file instead of just the name - So we can modurize the module.ts to npm package
 */
async function loadModel(
  params: ModelInitOptions,
  systemInfo?: SystemInformation
): Promise<ModelOperationResponse | void> {
  if (params.model.engine !== InferenceEngine.nitro) {
    // Not a nitro model
    return Promise.resolve()
  }

  if (params.model.engine !== InferenceEngine.nitro) {
    return Promise.reject('Not a cortex model')
  } else {
    const nitroResourceProbe = await getSystemResourceInfo()
    // Convert settings.prompt_template to system_prompt, user_prompt, ai_prompt
    if (params.model.settings.prompt_template) {
      const promptTemplate = params.model.settings.prompt_template
      const prompt = promptTemplateConverter(promptTemplate)
      if (prompt?.error) {
        return Promise.reject(prompt.error)
      }
      params.model.settings.system_prompt = prompt.system_prompt
      params.model.settings.user_prompt = prompt.user_prompt
      params.model.settings.ai_prompt = prompt.ai_prompt
    }

    // modelFolder is the absolute path to the running model folder
    // e.g. ~/jan/models/llama-2
    let modelFolder = params.modelFolder

    let llama_model_path = params.model.settings.llama_model_path

    // Absolute model path support
    if (
      params.model?.sources.length &&
      params.model.sources.every((e) => fs.existsSync(e.url))
    ) {
      llama_model_path =
        params.model.sources.length === 1
          ? params.model.sources[0].url
          : params.model.sources.find((e) =>
              e.url.includes(llama_model_path ?? params.model.id)
            )?.url
    }

    if (!llama_model_path || !path.isAbsolute(llama_model_path)) {
      // Look for GGUF model file
      const modelFiles: string[] = fs.readdirSync(modelFolder)
      const ggufBinFile = modelFiles.find(
        (file) =>
          // 1. Prioritize llama_model_path (predefined)
          (llama_model_path && file === llama_model_path) ||
          // 2. Prioritize GGUF File (manual import)
          file.toLowerCase().includes(SUPPORTED_MODEL_FORMAT) ||
          // 3. Fallback Model ID (for backward compatibility)
          file === params.model.id
      )
      if (ggufBinFile) llama_model_path = path.join(modelFolder, ggufBinFile)
    }

    // Look for absolute source path for single model

    if (!llama_model_path) return Promise.reject('No GGUF model file found')

    currentSettings = {
      cpu_threads: Math.max(1, nitroResourceProbe.numCpuPhysicalCore),
      // model.settings can override the default settings
      ...params.model.settings,
      llama_model_path,
      model: params.model.id,
      // This is critical and requires real CPU physical core count (or performance core)
      ...(params.model.settings.mmproj && {
        mmproj: path.isAbsolute(params.model.settings.mmproj)
          ? params.model.settings.mmproj
          : path.join(modelFolder, params.model.settings.mmproj),
      }),
    }
    return runNitroAndLoadModel(params.model.id, systemInfo)
  }
}

/**
 * 1. Spawn Nitro process
 * 2. Load model into Nitro subprocess
 * 3. Validate model status
 * @returns
 */
async function runNitroAndLoadModel(
  modelId: string,
  systemInfo?: SystemInformation
) {
  // Gather system information for CPU physical cores and memory
  return killSubprocess()
    .then(() =>
      tcpPortUsed.waitUntilFree(PORT, NITRO_PORT_FREE_CHECK_INTERVAL, 5000)
    )
    .then(() => spawnNitroProcess(systemInfo))
    .then(() => loadLLMModel(currentSettings))
    .then(() => validateModelStatus(modelId))
    .catch((err) => {
      // TODO: Broadcast error so app could display proper error message
      log(`[CORTEX]::Error: ${err}`)
      return { error: err }
    })
}

/**
 * Parse prompt template into agrs settings
 * @param promptTemplate Template as string
 * @returns
 */
function promptTemplateConverter(promptTemplate: string): PromptTemplate {
  // Split the string using the markers
  const systemMarker = '{system_message}'
  const promptMarker = '{prompt}'

  if (
    promptTemplate.includes(systemMarker) &&
    promptTemplate.includes(promptMarker)
  ) {
    // Find the indices of the markers
    const systemIndex = promptTemplate.indexOf(systemMarker)
    const promptIndex = promptTemplate.indexOf(promptMarker)

    // Extract the parts of the string
    const system_prompt = promptTemplate.substring(0, systemIndex)
    const user_prompt = promptTemplate.substring(
      systemIndex + systemMarker.length,
      promptIndex
    )
    const ai_prompt = promptTemplate.substring(
      promptIndex + promptMarker.length
    )

    // Return the split parts
    return { system_prompt, user_prompt, ai_prompt }
  } else if (promptTemplate.includes(promptMarker)) {
    // Extract the parts of the string for the case where only promptMarker is present
    const promptIndex = promptTemplate.indexOf(promptMarker)
    const user_prompt = promptTemplate.substring(0, promptIndex)
    const ai_prompt = promptTemplate.substring(
      promptIndex + promptMarker.length
    )

    // Return the split parts
    return { user_prompt, ai_prompt }
  }

  // Return an error if none of the conditions are met
  return { error: 'Cannot split prompt template' }
}

/**
 * Loads a LLM model into the Nitro subprocess by sending a HTTP POST request.
 * @returns A Promise that resolves when the model is loaded successfully, or rejects with an error message if the model is not found or fails to load.
 */
function loadLLMModel(settings: any): Promise<Response> {
  if (!settings?.ngl) {
    settings.ngl = 100
  }
  log(`[CORTEX]:: Loading model with params ${JSON.stringify(settings)}`)
  return fetchRetry(NITRO_HTTP_LOAD_MODEL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
    retries: 3,
    retryDelay: 300,
  })
    .then((res) => {
      log(
        `[CORTEX]:: Load model success with response ${JSON.stringify(
          res
        )}`
      )
      return Promise.resolve(res)
    })
    .catch((err) => {
      log(`[CORTEX]::Error: Load model failed with error ${err}`)
      return Promise.reject(err)
    })
}

/**
 * Validates the status of a model.
 * @returns {Promise<ModelOperationResponse>} A promise that resolves to an object.
 * If the model is loaded successfully, the object is empty.
 * If the model is not loaded successfully, the object contains an error message.
 */
async function validateModelStatus(modelId: string): Promise<void> {
  // Send a GET request to the validation URL.
  // Retry the request up to 3 times if it fails, with a delay of 500 milliseconds between retries.
  log(`[CORTEX]:: Validating model ${modelId}`)
  return fetchRetry(NITRO_HTTP_VALIDATE_MODEL_URL, {
    method: 'POST',
    body: JSON.stringify({
      model: modelId,
      // TODO: force to use cortex llamacpp by default
      engine: 'cortex.llamacpp',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    retries: 5,
    retryDelay: 300,
  }).then(async (res: Response) => {
    log(
      `[CORTEX]:: Validate model state with response ${JSON.stringify(
        res.status
      )}`
    )
    // If the response is OK, check model_loaded status.
    if (res.ok) {
      const body = await res.json()
      // If the model is loaded, return an empty object.
      // Otherwise, return an object with an error message.
      if (body.model_loaded) {
        log(
          `[CORTEX]:: Validate model state success with response ${JSON.stringify(
            body
          )}`
        )
        return Promise.resolve()
      }
    }
    const errorBody = await res.text()
    log(
      `[CORTEX]:: Validate model state failed with response ${errorBody} and status is ${JSON.stringify(
        res.statusText
      )}`
    )
    return Promise.reject('Validate model status failed')
  })
}

/**
 * Terminates the Nitro subprocess.
 * @returns A Promise that resolves when the subprocess is terminated successfully, or rejects with an error message if the subprocess fails to terminate.
 */
async function killSubprocess(): Promise<void> {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), 5000)
  log(`[CORTEX]:: Request to kill cortex`)

  const killRequest = () => {
    return fetch(NITRO_HTTP_KILL_URL, {
      method: 'DELETE',
      signal: controller.signal,
    })
      .catch(() => {}) // Do nothing with this attempt
      .then(() =>
        tcpPortUsed.waitUntilFree(PORT, NITRO_PORT_FREE_CHECK_INTERVAL, 5000)
      )
      .then(() => log(`[CORTEX]:: cortex process is terminated`))
      .catch((err) => {
        log(
          `[CORTEX]:: Could not kill running process on port ${PORT}. Might be another process running on the same port? ${err}`
        )
        throw 'PORT_NOT_AVAILABLE'
      })
  }

  if (subprocess?.pid && process.platform !== 'darwin') {
    log(`[CORTEX]:: Killing PID ${subprocess.pid}`)
    const pid = subprocess.pid
    return new Promise((resolve, reject) => {
      terminate(pid, function (err) {
        if (err) {
          log('[CORTEX]::Failed to kill PID - sending request to kill')
          killRequest().then(resolve).catch(reject)
        } else {
          tcpPortUsed
            .waitUntilFree(PORT, NITRO_PORT_FREE_CHECK_INTERVAL, 5000)
            .then(() => log(`[CORTEX]:: cortex process is terminated`))
            .then(() => resolve())
            .catch(() => {
              log(
                '[CORTEX]::Failed to kill PID (Port check timeout) - sending request to kill'
              )
              killRequest().then(resolve).catch(reject)
            })
        }
      })
    })
  } else {
    return killRequest()
  }
}

/**
 * Spawns a Nitro subprocess.
 * @returns A promise that resolves when the Nitro subprocess is started.
 */
function spawnNitroProcess(systemInfo?: SystemInformation): Promise<any> {
  log(`[CORTEX]:: Spawning cortex subprocess...`)

  return new Promise<void>(async (resolve, reject) => {
    let executableOptions = executableNitroFile(
      // If ngl is not set or equal to 0, run on CPU with correct instructions
      systemInfo?.gpuSetting
        ? {
            ...systemInfo.gpuSetting,
            run_mode:
              currentSettings?.ngl === undefined || currentSettings.ngl === 0
                ? 'cpu'
                : systemInfo.gpuSetting.run_mode,
          }
        : undefined
    )

    const args: string[] = ['1', LOCAL_HOST, PORT.toString()]
    // Execute the binary
    log(
      `[CORTEX]:: Spawn cortex at path: ${executableOptions.executablePath}, and args: ${args}`
    )
    log(`[CORTEX]::Debug: Cortex engine path: ${executableOptions.enginePath}`)

    // Add engine path to the PATH and LD_LIBRARY_PATH
    process.env.PATH = (process.env.PATH || '').concat(
      path.delimiter,
      executableOptions.enginePath
    )
    log(`[CORTEX] PATH: ${process.env.PATH}`)
    process.env.LD_LIBRARY_PATH = (process.env.LD_LIBRARY_PATH || '').concat(
      path.delimiter,
      executableOptions.enginePath
    )

    subprocess = spawn(
      executableOptions.executablePath,
      ['1', LOCAL_HOST, PORT.toString()],
      {
        cwd: path.join(path.parse(executableOptions.executablePath).dir),
        env: {
          ...process.env,
          ENGINE_PATH: executableOptions.enginePath,
          CUDA_VISIBLE_DEVICES: executableOptions.cudaVisibleDevices,
          // Vulkan - Support 1 device at a time for now
          ...(executableOptions.vkVisibleDevices?.length > 0 && {
            GGML_VULKAN_DEVICE: executableOptions.vkVisibleDevices[0],
          }),
        },
      }
    )

    // Handle subprocess output
    subprocess.stdout.on('data', (data: any) => {
      log(`[CORTEX]:: ${data}`)
    })

    subprocess.stderr.on('data', (data: any) => {
      log(`[CORTEX]::Error: ${data}`)
    })

    subprocess.on('close', (code: any) => {
      log(`[CORTEX]:: cortex exited with code: ${code}`)
      subprocess = undefined
      reject(`child process exited with code ${code}`)
    })

    tcpPortUsed
      .waitUntilUsed(PORT, NITRO_PORT_FREE_CHECK_INTERVAL, 30000)
      .then(() => {
        log(`[CORTEX]:: cortex is ready`)
        resolve()
      })
  })
}

/**
 * Every module should have a dispose function
 * This will be called when the extension is unloaded and should clean up any resources
 * Also called when app is closed
 */
function dispose() {
  // clean other registered resources here
  killSubprocess()
}

/**
 * Nitro process info
 */
export interface NitroProcessInfo {
  isRunning: boolean
}

/**
 * Retrieve current nitro process
 */
const getCurrentNitroProcessInfo = (): NitroProcessInfo => {
  return {
    isRunning: subprocess != null,
  }
}

const addAdditionalDependencies = (data: { name: string; version: string }) => {
  log(
    `[CORTEX]::Debug: Adding additional dependencies for ${data.name} ${data.version}`
  )
  const additionalPath = path.delimiter.concat(
    path.join(getJanDataFolderPath(), 'engines', data.name, data.version)
  )
  // Set the updated PATH
  process.env.PATH = (process.env.PATH || '').concat(
    path.delimiter,
    additionalPath
  )
  process.env.LD_LIBRARY_PATH = (process.env.LD_LIBRARY_PATH || '').concat(
    path.delimiter,
    additionalPath
  )
}

const decompressRunner = async (zipPath: string, output: string) => {
  console.debug(`Decompressing ${zipPath} to ${output}...`)
  try {
    const files = await decompress(zipPath, output)
    console.debug('Decompress finished!', files)
  } catch (err) {
    console.error(`Decompress ${zipPath} failed: ${err}`)
  }
}

export default {
  loadModel,
  unloadModel,
  dispose,
  getCurrentNitroProcessInfo,
  addAdditionalDependencies,
  decompressRunner,
}
