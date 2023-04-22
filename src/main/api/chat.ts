import {ChatAPI} from '../../api/chat'
import {createAPI} from '../api'
import {ChatController} from '../chat/controller'
import {createChat, listChats, renameChat} from '../db/db'

export function createChatAPI(chatCon: ChatController) {
  return createAPI<ChatAPI>({
    handlers: {
      'chat:create': () => createChat(),
      'chat:list': () => listChats(),
      'chat:rename': (event, chatId, name) => renameChat(chatId, name)
    },

    listeners: {
      'chat:stop': (event, chatId) => chatCon.abortMessageForChat(chatId)
    }
  })
}
