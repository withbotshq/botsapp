import {BrowserWindow, Menu} from 'electron'
import {UIAPI} from '../../api/ui'
import {createAPI} from '../api'
import {deleteChat} from '../db/db'

export function createUIAPI() {
  return createAPI<UIAPI>({
    handlers: {},

    listeners: {
      'ui:chats:show-context': (event, chatId) => {
        const template = [
          {
            label: 'Rename chat',
            click: () => {
              BrowserWindow.getFocusedWindow()?.webContents.send(
                'chat:rename',
                chatId
              )
            }
          },
          {
            label: 'Delete chat',
            click: () => {
              deleteChat(chatId)

              BrowserWindow.getAllWindows().forEach(window =>
                window.webContents.send('chat:delete', chatId)
              )
            }
          }
        ]

        const menu = Menu.buildFromTemplate(template)

        menu.popup({
          window: BrowserWindow.fromWebContents(event.sender) ?? undefined
        })
      }
    }
  })
}
