import { memo, useCallback, useMemo, useState } from 'react'

import {
  EngineStatus,
  LocalEngines,
  Model,
  RemoteEngine,
  RemoteEngines,
} from '@janhq/core'
import { Badge, Button, useClickOutside } from '@janhq/joi'

import { useAtomValue, useSetAtom } from 'jotai'
import {
  MoreVerticalIcon,
  PlayIcon,
  StopCircleIcon,
  Trash2Icon,
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'

import { toaster } from '@/containers/Toast'

import useAssistantQuery from '@/hooks/useAssistantQuery'
import useEngineInit from '@/hooks/useEngineInit'
import useEngineQuery from '@/hooks/useEngineQuery'
import useModelStart from '@/hooks/useModelStart'
import useModelStop from '@/hooks/useModelStop'
import useModels from '@/hooks/useModels'

import useThreadCreateMutation from '@/hooks/useThreadCreateMutation'

import { showWarningMultipleModelModalAtom } from '@/screens/HubScreen2/components/WarningMultipleModelModal'

import { MainViewState, mainViewStateAtom } from '@/helpers/atoms/App.atom'
import { activeModelsAtom } from '@/helpers/atoms/Model.atom'

type Props = {
  model: Model
}

// If more than this number of models are running, show a warning modal.
export const concurrentModelWarningThreshold = 2

const ModelItem: React.FC<Props> = ({ model }) => {
  const activeModels = useAtomValue(activeModelsAtom)
  const startModel = useModelStart()
  const stopModel = useModelStop()
  const [more, setMore] = useState(false)
  const { deleteModel } = useModels()
  const { data: engineData } = useEngineQuery()
  const createThreadMutation = useThreadCreateMutation()
  const { data: assistants } = useAssistantQuery()
  const setMainViewState = useSetAtom(mainViewStateAtom)
  const isRemoteEngine = RemoteEngines.includes(model.engine as RemoteEngine)
  const isEngineReady =
    engineData?.find((e) => e.name === model.engine)?.status ===
    EngineStatus.Ready
  const initializeEngine = useEngineInit()

  const [menu, setMenu] = useState<HTMLDivElement | null>(null)
  const [toggle, setToggle] = useState<HTMLDivElement | null>(null)
  const setShowWarningMultipleModelModal = useSetAtom(
    showWarningMultipleModelModalAtom
  )
  useClickOutside(() => setMore(false), null, [menu, toggle])

  const isActive = useMemo(
    () => activeModels.map((m) => m.model).includes(model.model),
    [activeModels, model.model]
  )

  const onModelActionClick = useCallback(
    (modelId: string) => {
      if (isActive) {
        // if model already active, stop it
        stopModel.mutate(modelId)
        return
      }
      const modelEngine = model.engine
      if (!modelEngine) {
        toaster({
          title: 'Failed to start model',
          description: `Engine for model ${model.model} is undefined`,
          type: 'error',
        })
        return
      }
      if (!engineData) {
        toaster({
          title: 'Failed to start model',
          description: `Engine data is not available. Please try again!`,
          type: 'error',
        })
        return
      }
      const engineStatus = engineData.find((e) => e.name === modelEngine)
      if (!engineStatus) {
        toaster({
          title: 'Failed to start model',
          description: `Engine ${modelEngine} is not available`,
          type: 'error',
        })
        console.error(`Engine ${modelEngine} is not available`)
        return
      }

      if (
        LocalEngines.find((e) => e === modelEngine) != null &&
        engineStatus.status === 'not_initialized'
      ) {
        toaster({
          title: 'Please wait for engine to initialize',
          description: `Please retry after engine ${engineStatus.name} is installed.`,
          type: 'default',
        })
        initializeEngine.mutate(modelEngine)
        return
      }

      if (activeModels.length >= concurrentModelWarningThreshold) {
        // if max concurrent models reached, stop the first model
        // display popup
        setShowWarningMultipleModelModal(true)
      }
      startModel.mutate(modelId)
    },
    [
      isActive,
      startModel,
      stopModel,
      activeModels.length,
      setShowWarningMultipleModelModal,
      engineData,
      initializeEngine,
      model,
    ]
  )

  const onDeleteModelClicked = useCallback(
    async (modelId: string) => {
      await stopModel.mutateAsync(modelId)
      await deleteModel(modelId)
    },
    [stopModel, deleteModel]
  )

  const isLocalModel = LocalEngines.find(
    (e) => model.engine != null && e === model.engine
  )

  const onClickCloudModel = useCallback(async () => {
    if (!isRemoteEngine) return null
    if (!model || !engineData) return
    if (!assistants || !assistants.length) {
      toaster({
        title: 'No assistant available.',
        description: `Could not create a new thread. Please add an assistant.`,
        type: 'error',
      })
      return
    }

    await createThreadMutation.mutateAsync({
      modelId: model.model,
      assistant: assistants[0],
    })

    setMainViewState(MainViewState.Thread)
  }, [
    assistants,
    createThreadMutation,
    engineData,
    isRemoteEngine,
    model,
    setMainViewState,
  ])

  return (
    <div className="border border-b-0 border-[hsla(var(--app-border))] bg-[hsla(var(--tertiary-bg))] p-4 first:rounded-t-lg last:rounded-b-lg last:border-b">
      <div className="flex flex-col items-start justify-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-1/2 gap-x-8">
          <div className="flex w-full items-center justify-between">
            <h6
              className={twMerge(
                'line-clamp-1 font-medium text-[hsla(var(--text-secondary))]',
                isLocalModel && 'max-w-[200px]',
                isRemoteEngine && !isEngineReady
                  ? 'cursor-not-allowed text-[hsla(var(--text-tertiary))]'
                  : 'cursor-pointer'
              )}
              title={model.model}
              onClick={onClickCloudModel}
            >
              {model.model}
            </h6>
            {model.engine === 'cortex.llamacpp' && (
              <div className="flex gap-x-8">
                <p
                  className="line-clamp-1 max-w-[120px] text-[hsla(var(--text-secondary))] xl:max-w-none"
                  title={model.model}
                >
                  {model.model}
                </p>
              </div>
            )}
          </div>
        </div>

        {isLocalModel && (
          <div className="flex gap-x-4">
            <Badge theme="secondary" className="sm:mr-16">
              {model.version != null ? `v${model.version}` : '-'}
            </Badge>

            <div className="relative flex items-center gap-x-4">
              {isActive ? (
                <Badge
                  theme="success"
                  variant="soft"
                  className="inline-flex items-center space-x-2"
                >
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Active</span>
                </Badge>
              ) : (
                <Badge
                  theme="secondary"
                  className="inline-flex items-center space-x-2"
                >
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  <span>Inactive</span>
                </Badge>
              )}
              <div
                className="inline-flex cursor-pointer"
                ref={setToggle}
                onClick={() => {
                  setMore(!more)
                }}
              >
                <Button theme="icon">
                  <MoreVerticalIcon />
                </Button>
                {more && (
                  <div
                    className="shadow-lg absolute right-8 top-0 z-20 w-52 overflow-hidden rounded-lg border border-[hsla(var(--app-border))] bg-[hsla(var(--app-bg))]"
                    ref={setMenu}
                  >
                    <div
                      className={twMerge(
                        'flex items-center space-x-2 px-4 py-2 hover:bg-[hsla(var(--dropdown-menu-hover-bg))]'
                      )}
                      onClick={() => {
                        onModelActionClick(model.model)
                        setMore(false)
                      }}
                    >
                      {isActive ? (
                        <StopCircleIcon
                          size={16}
                          className="text-[hsla(var(--text-secondary))]"
                        />
                      ) : (
                        <PlayIcon
                          size={16}
                          className="text-[hsla(var(--text-secondary))]"
                        />
                      )}
                      <span className="text-bold capitalize">
                        {isActive ? 'Stop' : 'Start'}
                        &nbsp;Model
                      </span>
                    </div>
                    <div
                      className={twMerge(
                        'flex cursor-pointer items-center space-x-2 px-4 py-2 hover:bg-[hsla(var(--dropdown-menu-hover-bg))]'
                      )}
                      onClick={() => onDeleteModelClicked(model.model)}
                    >
                      <Trash2Icon
                        size={16}
                        className="text-[hsla(var(--destructive-bg))]"
                      />
                      <span className="text-bold text-[hsla(var(--destructive-bg))]">
                        Delete Model
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ModelItem)
