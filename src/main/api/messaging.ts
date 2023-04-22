import {MessagingAPI} from '../../api/messaging'
import {createAPI} from '../api'
import {ChatController} from '../chat/controller'
import {createMessage, listMessages} from '../db/db'

export function createMessagingAPI(chatCon: ChatController) {
  return createAPI<MessagingAPI>({
    handlers: {
      'messaging:list': (event, chatId) => listMessages(chatId),
      'messaging:read:partial': (event, chatId) =>
        chatCon.getPartialMessage(chatId),
      'messaging:send': (event, chatId, role, content) => {
        const message = createMessage(chatId, role, content)
        chatCon.sendMessage(message)
        return message
      }
    },

    listeners: {}
  })
}
