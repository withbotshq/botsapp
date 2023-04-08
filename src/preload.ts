// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from 'electron'
import {Message} from './db/schema'

const api = {
  listMessages: (): Promise<Message[]> => ipcRenderer.invoke('messages:list')
}

export type API = typeof api

contextBridge.exposeInMainWorld('api', api)
