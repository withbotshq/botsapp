// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {IpcRendererEvent, contextBridge, ipcRenderer} from 'electron'
import {Chat, Message} from './main/db/schema'

const api = {
  // Configuration
  getOpenAIAPIKey: (): Promise<string> =>
    ipcRenderer.invoke('config:getOpenAIAPIKey'),

  setOpenAIAPIKey: (key: string): void =>
    ipcRenderer.send('config:setOpenAIAPIKey', key),

  // Database
  createChat: (): Promise<Chat> => ipcRenderer.invoke('chats:create'),
  listChats: (): Promise<Chat[]> => ipcRenderer.invoke('chats:list'),

  createMessage: (
    chatId: number,
    role: string,
    content: string
  ): Promise<Message> =>
    ipcRenderer.invoke('messages:create', chatId, role, content),
  listMessages: (chatId: number): Promise<Message[]> =>
    ipcRenderer.invoke('messages:list', chatId),

  // Chat coordination
  getPartialMessage: (chatId: number): Promise<string[] | null> =>
    ipcRenderer.invoke('messages:get-partial', chatId),

  onMessageChunk: (
    callback: (event: IpcRendererEvent, chatId: number, chunk: string) => void
  ): void => {
    ipcRenderer.on('chat:message-chunk', callback)
  },

  offMessageChunk: (
    callback: (event: IpcRendererEvent, chatId: number, chunk: string) => void
  ): void => {
    ipcRenderer.off('chat:message-chunk', callback)
  },

  onMessage: (
    callback: (event: IpcRendererEvent, message: Message) => void
  ): void => {
    ipcRenderer.on('chat:message', callback)
  },

  offMessage: (
    callback: (event: IpcRendererEvent, message: Message) => void
  ): void => {
    ipcRenderer.off('chat:message', callback)
  }
}

export type API = typeof api

contextBridge.exposeInMainWorld('api', api)
