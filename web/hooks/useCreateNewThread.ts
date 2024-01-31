import {
  Assistant,
  ConversationalExtension,
  ExtensionTypeEnum,
  Thread,
  ThreadAssistantInfo,
  ThreadState,
  Model,
} from '@janhq/core'
import { atom, useAtomValue, useSetAtom } from 'jotai'

import { fileUploadAtom } from '@/containers/Providers/Jotai'

import { generateThreadId } from '@/utils/thread'

import useRecommendedModel from './useRecommendedModel'

import { extensionManager } from '@/extension'
import {
  threadsAtom,
  setActiveThreadIdAtom,
  threadStatesAtom,
  updateThreadAtom,
} from '@/helpers/atoms/Thread.atom'

const createNewThreadAtom = atom(null, (get, set, newThread: Thread) => {
  // create thread state for this new thread
  const currentState = { ...get(threadStatesAtom) }

  const threadState: ThreadState = {
    hasMore: false,
    waitingForResponse: false,
    lastMessage: undefined,
  }
  currentState[newThread.id] = threadState
  set(threadStatesAtom, currentState)

  // add the new thread on top of the thread list to the state
  const threads = get(threadsAtom)
  set(threadsAtom, [newThread, ...threads])
})

export const useCreateNewThread = () => {
  const createNewThread = useSetAtom(createNewThreadAtom)
  const setActiveThreadId = useSetAtom(setActiveThreadIdAtom)
  const updateThread = useSetAtom(updateThreadAtom)
  const setFileUpload = useSetAtom(fileUploadAtom)
  const { recommendedModel, downloadedModels } = useRecommendedModel()
  const { deleteThread } = useDeleteThread()

  const requestCreateNewThread = async (
    assistant: Assistant,
    model?: Model | undefined
  ) => {
    const defaultModel = model ?? recommendedModel ?? downloadedModels[0]
    const createdAt = Date.now()
    const assistantInfo: ThreadAssistantInfo = {
      assistant_id: assistant.id,
      assistant_name: assistant.name,
      tools: assistant.tools,
      model: {
        id: defaultModel?.id ?? '*',
        settings: defaultModel?.settings ?? {},
        parameters: defaultModel?.parameters ?? {},
        engine: defaultModel?.engine,
      },
      instructions: assistant.instructions,
    }
    const threadId = generateThreadId(assistant.id)
    const thread: Thread = {
      id: threadId,
      object: 'thread',
      title: 'New Thread',
      assistants: [assistantInfo],
      created: createdAt,
      updated: createdAt,
    }

    // add the new thread on top of the thread list to the state
    createNewThread(thread)
    setActiveThreadId(thread.id)

    // Delete the file upload state
    setFileUpload([])
    updateThreadMetadata(thread)
  }

  function updateThreadMetadata(thread: Thread) {
    updateThread(thread)

    extensionManager
      .get<ConversationalExtension>(ExtensionTypeEnum.Conversational)
      ?.saveThread(thread)
  }

  return {
    requestCreateNewThread,
    updateThreadMetadata,
  }
}
