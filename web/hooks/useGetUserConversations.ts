import { Conversation, ConversationState } from '@models/Conversation'
import { useSetAtom } from 'jotai'
import { executeSerial } from '@services/pluginService'
import { DataService } from '@janhq/core'
import {
  conversationStatesAtom,
  userConversationsAtom,
} from '@helpers/atoms/Conversation.atom'

const useGetUserConversations = () => {
  const setConversationStates = useSetAtom(conversationStatesAtom)
  const setConversations = useSetAtom(userConversationsAtom)

  const getUserConversations = async () => {
    try {
      const convos: Conversation[] | undefined = await executeSerial(
        DataService.GetConversations
      )
      const convoStates: Record<string, ConversationState> = {}
      convos?.forEach((convo) => {
        convoStates[convo._id ?? ''] = {
          hasMore: true,
          waitingForResponse: false,
        }
      })
      setConversationStates(convoStates)
      setConversations(convos ?? [])
    } catch (ex) {
      console.log(ex)
    }
  }

  return {
    getUserConversations,
  }
}

export default useGetUserConversations
