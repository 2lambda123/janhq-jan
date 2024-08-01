import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { ImportingModel, SelectFileOption } from '@janhq/core'
import { Modal } from '@janhq/joi'
import { useAtomValue, useSetAtom } from 'jotai'

import { UploadCloudIcon } from 'lucide-react'

import { snackbar } from '@/containers/Toast'

import useDropModelBinaries from '@/hooks/useDropModelBinaries'
import {
  getImportModelStageAtom,
  setImportModelStageAtom,
} from '@/hooks/useImportModel'

import { importingModelsAtom } from '@/helpers/atoms/Model.atom'

const SelectingModelModal: React.FC = () => {
  const setImportModelStage = useSetAtom(setImportModelStageAtom)
  const setImportingModels = useSetAtom(importingModelsAtom)
  const importModelStage = useAtomValue(getImportModelStageAtom)
  const { onDropModels } = useDropModelBinaries()

  const onImportFileWindowsClick = useCallback(async () => {
    const options: SelectFileOption = {
      title: 'Select model files',
      buttonLabel: 'Select',
      allowMultiple: true,
      filters: [
        { name: 'GGUF Files', extensions: ['gguf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    }
    const filePaths: string[] = await window.core?.api?.selectFiles(options)
    if (!filePaths || filePaths.length === 0) return

    const importingModels: ImportingModel[] = filePaths
      .filter((path) => path.endsWith('.gguf'))
      .map((path) => {
        const normalizedPath = isWindows ? path.replace(/\\/g, '/') : path

        return {
          importId: normalizedPath,
          modelId: undefined,
          name: normalizedPath.replace('.gguf', ''),
          description: '',
          path: path,
          tags: [],
          size: 0,
          status: 'PREPARING',
          format: 'gguf',
        }
      })
    if (importingModels.length < 1) {
      snackbar({
        description: `Only files with .gguf extension can be imported.`,
        type: 'error',
      })
      return
    }
    setImportingModels(importingModels)
    setImportModelStage('MODEL_SELECTED')
  }, [setImportingModels, setImportModelStage])

  const onSelectFileClick = useCallback(async () => {
    if (isWindows) {
      return onImportFileWindowsClick()
    }
    const options: SelectFileOption = {
      title: 'Select model folders',
      buttonLabel: 'Select',
      allowMultiple: true,
      selectDirectory: true,
    }
    const filePaths: string[] = await window.core?.api?.selectFiles(options)
    if (!filePaths || filePaths.length === 0) return

    const importingModels: ImportingModel[] = filePaths
      .filter((path) => path.endsWith('.gguf'))
      .map((path) => {
        const normalizedPath = isWindows ? path.replace(/\\/g, '/') : path

        return {
          importId: normalizedPath,
          modelId: undefined,
          name: normalizedPath.replace('.gguf', ''),
          description: '',
          path: path,
          tags: [],
          size: 0,
          status: 'PREPARING',
          format: 'gguf',
        }
      })
    if (importingModels.length < 1) {
      snackbar({
        description: `Only files with .gguf extension can be imported.`,
        type: 'error',
      })
      return
    }
    setImportingModels(importingModels)
    setImportModelStage('MODEL_SELECTED')
  }, [setImportModelStage, setImportingModels, onImportFileWindowsClick])

  const { isDragActive, getRootProps } = useDropzone({
    noClick: true,
    multiple: true,
    onDrop: onDropModels,
  })

  const borderColor = isDragActive
    ? 'border-[hsla(var(--primary-bg))]'
    : 'border-[hsla(var(--app-border))]'
  const textColor = isDragActive
    ? 'text-[hsla(var(--primary-bg)]'
    : 'text-[hsla(var(--text-secondary))]'
  const dragAndDropBgColor = isDragActive && 'bg-[hsla(var(--primary-bg-soft))]'

  return (
    <Modal
      open={importModelStage === 'SELECTING_MODEL'}
      onOpenChange={() => setImportModelStage('NONE')}
      title="Import Model"
      content={
        <div>
          <p className="font-medium text-[hsla(var(--text-secondary))]">
            Import any model file (GGUF) or folder. Your imported model will be
            private to you.
          </p>
          <div
            className={`mt-4 flex h-[172px] w-full cursor-pointer items-center justify-center rounded-md border ${borderColor} ${dragAndDropBgColor}`}
            {...getRootProps()}
            onClick={onSelectFileClick}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full">
                <UploadCloudIcon
                  size={24}
                  className="text-[hsla(var(--primary-bg))]"
                />
              </div>
              <div className="mt-4">
                <span className="text-primary font-bold">
                  Click to upload &nbsp;
                </span>
                <span className={`${textColor} font-medium`}>
                  or drag and drop (GGUF)
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    />
  )
}

export default SelectingModelModal
