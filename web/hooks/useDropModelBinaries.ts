import { useCallback } from 'react'

import { ImportingModel } from '@janhq/core'
import { useSetAtom } from 'jotai'

import { snackbar } from '@/containers/Toast'

import { getFileInfoFromFile } from '@/utils/file'

import { setImportModelStageAtom } from './useImportModel'

import { importingModelsAtom } from '@/helpers/atoms/Model.atom'

export default function useDropModelBinaries() {
  const setImportingModels = useSetAtom(importingModelsAtom)
  const setImportModelStage = useSetAtom(setImportModelStageAtom)

  const onDropModels = useCallback(
    async (acceptedFiles: File[]) => {
      const files = await getFileInfoFromFile(acceptedFiles)

      const unsupportedFiles = files.filter(
        (file) => !file.path.endsWith('.gguf')
      )
      const supportedFiles = files.filter((file) => file.path.endsWith('.gguf'))

      const importingModels: ImportingModel[] = supportedFiles.map((file) => {
        const normalizedPath = isWindows
          ? file.path.replace(/\\/g, '/')
          : file.path

        return {
          importId: normalizedPath,
          modelId: undefined,
          name: normalizedPath.replace('.gguf', ''),
          description: '',
          path: file.path,
          tags: [],
          size: file.size,
          status: 'PREPARING',
          format: 'gguf',
        }
      })
      if (unsupportedFiles.length > 0) {
        snackbar({
          description: `Only files with .gguf extension can be imported.`,
          type: 'error',
        })
      }
      if (importingModels.length === 0) return

      setImportingModels(importingModels)
      setImportModelStage('MODEL_SELECTED')
    },
    [setImportModelStage, setImportingModels]
  )

  return { onDropModels }
}
