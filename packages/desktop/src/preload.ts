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

  getModel: (): Promise<{key: string; title: string}> =>
    ipcRenderer.invoke('config:getModel'),
  setModel: (model: string): void => ipcRenderer.send('config:setModel', model),

  // Database
  createChat: (): Promise<Chat> => ipcRenderer.invoke('chats:create'),
  renameChat: (chatId: number, name: string | null): Promise<void> =>
    ipcRenderer.invoke('chats:rename', chatId, name),
  listChats: (): Promise<Chat[]> => ipcRenderer.invoke('chats:list'),

  onChatRename: (
    callback: (event: IpcRendererEvent, chatId: number) => void
  ): (() => void) => {
    ipcRenderer.on('chat:rename', callback)
    return () => ipcRenderer.removeListener('chat:rename', callback)
  },

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
  ): (() => void) => {
    ipcRenderer.on('chat:message-chunk', callback)
    return () => ipcRenderer.removeListener('chat:message-chunk', callback)
  },

  onMessage: (
    callback: (event: IpcRendererEvent, message: Message) => void
  ): (() => void) => {
    ipcRenderer.on('chat:message', callback)
    return () => ipcRenderer.removeListener('chat:message', callback)
  },

  onStopChat: (callback: (event: IpcRendererEvent) => void): (() => void) => {
    ipcRenderer.on('chat:stop', callback)
    return () => ipcRenderer.removeListener('chat:stop', callback)
  },

  stopChat: (chatId: number): void => {
    ipcRenderer.send('chat:stop', chatId)
  },

  // Context menus
  showChatListContextMenu: (chatId: number): void => {
    ipcRenderer.send('chat-list:show-context-menu', chatId)
  },

  // Other events
  onChatCreated: (
    callback: (event: IpcRendererEvent, chat: Chat) => void
  ): (() => void) => {
    ipcRenderer.on('chat:created', callback)
    return () => ipcRenderer.removeListener('chat:created', callback)
  },

  onChatDeleted: (
    callback: (event: IpcRendererEvent, chatId: number) => void
  ): (() => void) => {
    ipcRenderer.on('chat:deleted', callback)
    return () => ipcRenderer.removeListener('chat:deleted', callback)
  },

  onFocusNextChat: (
    callback: (event: IpcRendererEvent, chat: Chat) => void
  ): (() => void) => {
    ipcRenderer.on('focus:next-chat', callback)
    return () => ipcRenderer.removeListener('focus:next-chat', callback)
  },

  onFocusPrevChat: (
    callback: (event: IpcRendererEvent, chat: Chat) => void
  ): (() => void) => {
    ipcRenderer.on('focus:prev-chat', callback)
    return () => ipcRenderer.removeListener('focus:prev-chat', callback)
  }
}

export type API = typeof api

contextBridge.exposeInMainWorld('api', api)
