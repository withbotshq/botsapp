import {assert} from '@jclem/assert'
import {botfileFromPath} from '@withbotshq/shared/botsfile'
import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  app,
  dialog,
  globalShortcut,
  ipcMain,
  shell
} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import updateElectron from 'update-electron-app'
import {ChatController} from './main/chat/controller'
import {FunctionController} from './main/chat/function-controller'
import {
  config,
  setModel,
  setOpenAIAPIKey,
  setTemperature
} from './main/config/config'
import {
  clearChatHistory,
  createChat,
  createMessage,
  dataPath,
  deleteChat,
  deleteMessage,
  listChats,
  listMessages,
  listVisibleMessages,
  renameChat,
  runMigrations,
  setChatModel,
  setChatSystemMessage,
  setChatTemperature,
  toggleChatFunction
} from './main/db/db'

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const fnPath = path.join(app.getPath('userData'), 'functions')

if (!fs.existsSync(fnPath)) {
  fs.mkdirSync(fnPath)
}

const chatController = new ChatController()
const fnController = new FunctionController(fnPath)

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

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

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
            'chat:created',
            chat
          )
        }
      },
      {
        label: 'Open Bots File',
        accelerator: 'CmdOrCtrl+O',
        async click() {
          const {
            canceled,
            filePaths: [filePath]
          } = await dialog.showOpenDialog({
            title: 'Open Bots File',
            filters: [{name: 'Bots File', extensions: ['bot']}],
            properties: ['openFile']
          })

          if (canceled) {
            return
          }

          await openBotfile(assert(filePath))
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
  ipcMain.handle('config:getOpenAIAPIKey', () => config.openAIAPIKey)
  ipcMain.on('config:setOpenAIAPIKey', (event, key) => setOpenAIAPIKey(key))
  ipcMain.handle('config:getModel', () => config.model)
  ipcMain.on('config:setModel', (event, model) => setModel(model))
  ipcMain.handle('config:getTemperature', () => config.temperature)
  ipcMain.on('config:setTemperature', (event, temperature) =>
    setTemperature(temperature)
  )
  ipcMain.on('chat:stop', (event, chatId) =>
    chatController.abortMessageForChat(chatId)
  )
  ipcMain.handle('chats:create', () => createChat())
  ipcMain.handle('chats:list', listChats)
  ipcMain.handle('chats:rename', (event, chatId, name) =>
    renameChat(chatId, name)
  )
  ipcMain.handle('chats:setModel', (event, chatId, model) =>
    setChatModel(chatId, model)
  )
  ipcMain.handle('chats:setSystemMessage', (event, chatId, content) =>
    setChatSystemMessage(chatId, content)
  )
  ipcMain.handle('chats:setTemperature', (event, chatId, temperature) =>
    setChatTemperature(chatId, temperature)
  )
  ipcMain.handle('chats:toggleFunction', (event, chatId, dir, enabled) =>
    toggleChatFunction(chatId, dir, enabled)
  )
  ipcMain.handle('messages:create', async (event, chatId, role, content) => {
    const message = createMessage(chatId, role, content)
    chatController.sendMessage(message, fnController)
  })
  ipcMain.handle('messages:get-partial', (event, chatId) => {
    return chatController.getPartialMessage(chatId)
  })
  ipcMain.handle('messages:list', (event, chatId) => listMessages(chatId))
  ipcMain.handle('messages:listVisible', (event, chatId) =>
    listVisibleMessages(chatId)
  )

  ipcMain.handle('functions:list', () => fnController.loadFunctions())

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
        label: 'Clear chat history',
        click: () => {
          chatController.abortMessageForChat(chatId)
          clearChatHistory(chatId)
          BrowserWindow.getAllWindows().forEach(window =>
            window.webContents.send('message:deleted', chatId)
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

  ipcMain.on(
    'message:show-context-menu',
    (event, chatId, messageId, isPartialMessage) => {
      const template: MenuItemConstructorOptions[] = []

      if (isPartialMessage) {
        template.push({
          label: 'Stop output',
          click: () => {
            chatController.abortMessageForChat(chatId)
          }
        })
      } else {
        template.push({
          label: 'Delete message',
          click: () => {
            deleteMessage(chatId, messageId)
            BrowserWindow.getAllWindows().forEach(window =>
              window.webContents.send('message:deleted', chatId, messageId)
            )
          }
        })
      }

      const menu = Menu.buildFromTemplate(template)
      menu.popup({
        window: BrowserWindow.fromWebContents(event.sender) ?? undefined
      })
    }
  )

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

app.on('open-file', (event, path) => {
  if (path.endsWith('.bot')) {
    event.preventDefault()
    openBotfile(path)
  }
})

updateElectron()

async function openBotfile(filePath: string) {
  const botFile = await botfileFromPath(filePath)
  const chat = createChat({config: botFile})

  BrowserWindow.getFocusedWindow()?.webContents.send('chat:created', chat)
}
