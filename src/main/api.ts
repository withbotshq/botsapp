import {IpcMainEvent, IpcMainInvokeEvent, ipcMain} from 'electron'
import {APIDefinition, Handler, Listener} from '../api'

type APIDefinitionImpl<A extends APIDefinition> = {
  handlers: {
    [K in keyof A['handlers']]: (
      event: IpcMainInvokeEvent,
      ...args: A['handlers'][K] extends Handler<infer A, infer R> ? A : never
    ) => A['handlers'][K] extends Handler<infer A, infer R> ? R : never
  }
}

export function createAPI<A extends APIDefinition>({
  handlers,
  listeners
}: {
  handlers: {
    [K in keyof A['handlers']]: (
      event: IpcMainInvokeEvent,
      ...args: A['handlers'][K] extends Handler<infer A, infer R> ? A : never
    ) => A['handlers'][K] extends Handler<infer A, infer R> ? R : never
  }

  listeners: {
    [K in keyof A['listeners']]: (
      event: IpcMainEvent,
      ...args: A['listeners'][K] extends Listener<infer A> ? A : never
    ) => void
  }
}): void {
  for (const [key, handler] of Object.entries(handlers)) {
    ipcMain.handle(key, handler)
  }

  for (const [key, listener] of Object.entries(listeners)) {
    ipcMain.on(key, listener)
  }
}
