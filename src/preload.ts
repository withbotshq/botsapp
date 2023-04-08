// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from 'electron'
import {Chat, Message} from './db/schema'

const api = {
  createChat: (): Promise<Chat> => ipcRenderer.invoke('chats:create'),
  listChats: (): Promise<Chat[]> => ipcRenderer.invoke('chats:list'),

  createMessage: (chatId: number, text: string): Promise<Message> =>
    ipcRenderer.invoke('messages:create', chatId, text),
  listMessages: (chatId: number): Promise<Message[]> =>
    ipcRenderer.invoke('messages:list', chatId)
}

export type API = typeof api

contextBridge.exposeInMainWorld('api', api)
