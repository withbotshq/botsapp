import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  app,
  globalShortcut,
  shell
} from 'electron'
import updateElectron from 'update-electron-app'
import {createChatAPI} from './main/api/chat'
import {createConfigAPI} from './main/api/config'
import {createMessagingAPI} from './main/api/messaging'
import {createUIAPI} from './main/api/ui'
import {ChatController} from './main/chat/controller'
import {createChat, dataPath, runMigrations} from './main/db/db'

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const chatController = new ChatController()

const createWindow = () => {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 1024,
    height: 768,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: {x: 14, y: 14},
    vibrancy: 'sidebar'
  })

  window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

  // Register the window.
  chatController.addBrowserWindow(window)

  window.webContents.on('will-navigate', (event, url) => {
    if (url === MAIN_WINDOW_WEBPACK_ENTRY) {
      return
    }

    event.preventDefault()
    shell.openExternal(url)
  })

  return window
}

const menuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'Bots',
    role: 'appMenu'
  },
  {
    label: 'Chat',
    submenu: [
      {
        label: 'Stop output',
        accelerator: 'CmdOrCtrl+.',
        click() {
          BrowserWindow.getFocusedWindow()?.webContents.send('chat:stop')
        }
      }
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'New Chat',
        accelerator: 'CmdOrCtrl+N',
        click() {
          const chat = createChat()
          BrowserWindow.getFocusedWindow()?.webContents.send(
            'chat:create',
            chat
          )
        }
      },
      {type: 'separator'},
      {
        label: 'New Window',
        accelerator: 'CmdOrCtrl+Shift+N',
        click() {
          createWindow()
        }
      },
      {role: 'close'}
    ]
  },
  {role: 'editMenu'},
  {
    role: 'viewMenu',
    submenu: [
      {
        label: 'Focus Previous Chat',
        accelerator: 'CmdOrCtrl+Shift+[',
        click() {
          BrowserWindow.getFocusedWindow()?.webContents.send(
            'ui:chats:focus-previous'
          )
        }
      },
      {
        label: 'Focus Next Chat',
        accelerator: 'CmdOrCtrl+Shift+]',
        click() {
          BrowserWindow.getFocusedWindow()?.webContents.send(
            'ui:chats:focus-next'
          )
        }
      },
      {type: 'separator'},
      {role: 'reload'},
      {role: 'forceReload'},
      {role: 'toggleDevTools'},
      {type: 'separator'},
      {role: 'resetZoom'},
      {role: 'zoomIn'},
      {role: 'zoomOut'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {role: 'windowMenu'},
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'Open on GitHub',
        click() {
          shell.openExternal('https://github.com/withexec/chat')
        }
      },
      {
        label: 'Open User Data Folder',
        click() {
          shell.openPath(dataPath)
        }
      }
    ]
  }
]

Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  runMigrations()

  createConfigAPI()
  createChatAPI(chatController)
  createMessagingAPI(chatController)
  createUIAPI()

  globalShortcut.register('Control+Command+B', () => {
    const window = BrowserWindow.getAllWindows().at(0)

    if (window) {
      window?.show()
    } else {
      createWindow()
    }
  })

  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

updateElectron()
