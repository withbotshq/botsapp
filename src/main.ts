import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  app,
  globalShortcut,
  ipcMain,
  shell
} from 'electron'
import path from 'path'
import updateElectron from 'update-electron-app'
import {ChatController} from './main/chat/controller'
import {config, setModel, setOpenAIAPIKey} from './main/config/config'
import {
  createChat,
  createMessage,
  deleteChat,
  listChats,
  listMessages,
  renameChat,
  runMigrations
} from './main/db/db'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
declare const MAIN_WINDOW_VITE_NAME: string

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
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: {x: 14, y: 14},
    vibrancy: 'sidebar'
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    window.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Register the window.
  chatController.addBrowserWindow(window)

  return window
}

const menuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'Chat',
    role: 'appMenu'
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
            'chat:created',
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
          BrowserWindow.getFocusedWindow()?.webContents.send('focus:prev-chat')
        }
      },
      {
        label: 'Focus Next Chat',
        accelerator: 'CmdOrCtrl+Shift+]',
        click() {
          BrowserWindow.getFocusedWindow()?.webContents.send('focus:next-chat')
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
  ipcMain.handle('config:getOpenAIAPIKey', () => config.openAIAPIKey)
  ipcMain.on('config:setOpenAIAPIKey', (event, key) => setOpenAIAPIKey(key))
  ipcMain.handle('config:getModel', () => config.model)
  ipcMain.on('config:setModel', (event, model) => setModel(model))
  ipcMain.handle('chats:create', createChat)
  ipcMain.handle('chats:list', listChats)
  ipcMain.handle('chats:rename', (event, chatId, name) =>
    renameChat(chatId, name)
  )
  ipcMain.handle('messages:create', (event, chatId, role, content) => {
    const message = createMessage(chatId, role, content)
    chatController.sendMessage(message)
  })
  ipcMain.handle('messages:get-partial', (event, chatId) => {
    return chatController.getPartialMessage(chatId)
  })
  ipcMain.handle('messages:list', (event, chatId) => listMessages(chatId))
  ipcMain.on('chat-list:show-context-menu', (event, chatId) => {
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
            window.webContents.send('chat:deleted', chatId)
          )
        }
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    menu.popup({
      window: BrowserWindow.fromWebContents(event.sender) ?? undefined
    })
  })

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
