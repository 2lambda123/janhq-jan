import { useCallback } from 'react'

import { ImportingModel, Model, OptionType } from '@janhq/core'

import { atom } from 'jotai'

export type ImportModelStage =
  | 'NONE'
  | 'SELECTING_MODEL'
  | 'CHOOSE_WHAT_TO_IMPORT'
  | 'MODEL_SELECTED'
  | 'IMPORTING_MODEL'
  | 'EDIT_MODEL_INFO'
  | 'CONFIRM_CANCEL'

const importModelStageAtom = atom<ImportModelStage>('NONE')

export const getImportModelStageAtom = atom((get) => get(importModelStageAtom))

export const setImportModelStageAtom = atom(
  null,
  (_get, set, stage: ImportModelStage) => {
    set(importModelStageAtom, stage)
  }
)

export type ModelUpdate = {
  name: string
  description: string
  tags: string[]
}

const useImportModel = () => {
  // const setImportModelStage = useSetAtom(setImportModelStageAtom)
  // const setImportingModels = useSetAtom(importingModelsAtom)

  const importModels = useCallback(
    (models: ImportingModel[], optionType: OptionType) => {
      console.log('importModels', models, optionType)
      // return localImportModels(models, optionType)
    },
    []
  )

  const updateModelInfo = useCallback(async (modelInfo: Partial<Model>) => {
    console.log('updateModelInfo', modelInfo)
    // localUpdateModelInfo(modelInfo)
  }, [])

  const sanitizeFilePaths = useCallback(async (filePaths: string[]) => {
    console.log('sanitizeFilePaths', filePaths)
    //   if (!filePaths || filePaths.length === 0) return
    //   const sanitizedFilePaths: FilePathWithSize[] = []
    //   for (const filePath of filePaths) {
    //     const fileStats = await fs.fileStat(filePath, true)
    //     if (!fileStats) continue
    //     if (!fileStats.isDirectory) {
    //       const fileName = await baseName(filePath)
    //       sanitizedFilePaths.push({
    //         path: filePath,
    //         name: fileName,
    //         size: fileStats.size,
    //       })
    //     } else {
    //       // allowing only one level of directory
    //       const files = await fs.readdirSync(filePath)
    //       for (const file of files) {
    //         const fullPath = await joinPath([filePath, file])
    //         const fileStats = await fs.fileStat(fullPath, true)
    //         if (!fileStats || fileStats.isDirectory) continue
    //         sanitizedFilePaths.push({
    //           path: fullPath,
    //           name: file,
    //           size: fileStats.size,
    //         })
    //       }
    //     }
    //   }
    //   const unsupportedFiles = sanitizedFilePaths.filter(
    //     (file) => !file.path.endsWith('.gguf')
    //   )
    //   const supportedFiles = sanitizedFilePaths.filter((file) =>
    //     file.path.endsWith('.gguf')
    //   )
    //   const importingModels: ImportingModel[] = supportedFiles.map(
    //     ({ path, name, size }: FilePathWithSize) => ({
    //       importId: uuidv4(),
    //       modelId: undefined,
    //       name: name.replace('.gguf', ''),
    //       description: '',
    //       path: path,
    //       tags: [],
    //       size: size,
    //       status: 'PREPARING',
    //       format: 'gguf',
    //     })
    //   )
    //   if (unsupportedFiles.length > 0) {
    //     snackbar({
    //       description: `Only files with .gguf extension can be imported.`,
    //       type: 'error',
    //     })
    //   }
    //   if (importingModels.length === 0) return
    //   setImportingModels(importingModels)
    //   setImportModelStage('MODEL_SELECTED')
  }, [])

  return { importModels, updateModelInfo, sanitizeFilePaths }
}

export default useImportModel
