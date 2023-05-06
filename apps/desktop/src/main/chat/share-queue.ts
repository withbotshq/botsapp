import {assert} from '@jclem/assert'
import {Chat, Message} from '@withbotshq/shared/schema'
import * as api from '../api'

type UpdateChatAction = {
  type: 'update-chat'
  chat: Chat
}

type DeleteChatAction = {
  type: 'delete-chat'
  chat: Chat
}

type CreateMessageAction = {
  type: 'create-message'
  chat: Chat
  message: Message
}

type DeleteMessageAction = {
  type: 'delete-message'
  chat: Chat
  message: Message
}

type Action =
  | UpdateChatAction
  | DeleteChatAction
  | CreateMessageAction
  | DeleteMessageAction

export class ShareQueue {
  readonly #queues: Map<number, Action[]> = new Map()

  enqueueUpdateChat(chat: Chat): void {
    this.#enqueue(chat.id, {type: 'update-chat', chat})
  }

  enqueueDisableSharing(chat: Chat): void {
    this.#enqueue(chat.id, {type: 'delete-chat', chat})
  }

  enqueueShareMessage(chat: Chat, message: Message): void {
    this.#enqueue(chat.id, {type: 'create-message', chat, message})
  }

  enqueueUnshareMessage(chat: Chat, message: Message): void {
    this.#enqueue(chat.id, {type: 'delete-message', chat, message})
  }

  #enqueue(chatID: number, action: Action): void {
    const existingQueue = this.#queues.get(chatID)

    if (existingQueue) {
      existingQueue.push(action)
      return
    }

    const newQueue = [action]
    this.#queues.set(chatID, newQueue)
    this.#workQueue(chatID)
  }

  #workQueue = async (chatID: number): Promise<void> => {
    const queue = assert(this.#queues.get(chatID))
    const action = queue.shift()

    if (!action) {
      this.#queues.delete(chatID)
      return
    }

    switch (action.type) {
      case 'update-chat':
        await api.updateChat(action.chat)
        break
      case 'delete-chat':
        await api.disableChatSharing(action.chat)
        break
      case 'create-message':
        await api.createMessage(action.chat, action.message)
        break
      case 'delete-message':
        await api.deleteMessage(action.chat, action.message)
        break
    }

    this.#workQueue(chatID)
  }
}
