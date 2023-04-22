// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {IpcRendererEvent, contextBridge, ipcRenderer} from 'electron'
import {
  Event,
  EventChannel,
  Handler,
  HandlerChannel,
  Listener,
  ListenerChannel,
  SpecificEvent,
  SpecificHandler,
  SpecificListener
} from './api'

function invoke<
  C extends HandlerChannel,
  H extends SpecificHandler<C>,
  A extends H extends Handler<infer Args, unknown> ? Args : never,
  R extends H extends Handler<unknown[], infer Result> ? Result : never
>(channel: C, ...args: A): Promise<R> {
  return ipcRenderer.invoke(channel, ...args)
}

function send<
  C extends ListenerChannel,
  L extends SpecificListener<C>,
  A extends L extends Listener<infer Args> ? Args : never
>(channel: C, ...args: A): void {
  return ipcRenderer.send(channel, ...args)
}

function on<
  C extends EventChannel,
  E extends SpecificEvent<C>,
  P extends E extends Event<infer Payload> ? Payload : never
>(
  channel: C,
  callback: (event: IpcRendererEvent, ...args: P) => void
): () => void
function on(
  channel: string,
  callback: (event: IpcRendererEvent, ...args: unknown[]) => void
): () => void {
  ipcRenderer.on(channel, callback)
  return () => ipcRenderer.removeListener(channel, callback)
}

export const API = {invoke, send, on}

contextBridge.exposeInMainWorld('api', API)
