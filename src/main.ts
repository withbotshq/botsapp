import {app, BrowserWindow, ipcMain} from 'electron'
import path from 'path'
import {
  createChat,
  createMessage,
  listChats,
  listMessages,
  runMigrations
} from './db/db'
import {ChatController} from './main/chat/controller'
import {config, setOpenAIAPIKey} from './main/config/config'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
declare const MAIN_WINDOW_VITE_NAME: string

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const chatController = new ChatController()

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: {x: 14, y: 14}
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  runMigrations()
  ipcMain.on('config:setOpenAIAPIKey', (event, key) => setOpenAIAPIKey(key))
  ipcMain.handle('config:getOpenAIAPIKey', () => config.openAIAPIKey)
  ipcMain.handle('chats:create', createChat)
  ipcMain.handle('chats:list', listChats)
  ipcMain.handle('messages:create', (event, chatId, role, content) => {
    const message = createMessage(chatId, role, content)
    chatController.sendMessage(message)
  })
  ipcMain.handle('messages:get-partial', (event, chatId) => {
    return chatController.getPartialMessage(chatId)
  })
  ipcMain.handle('messages:list', (event, chatId) => listMessages(chatId))
  chatController.addBrowserWindow(createWindow())
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
    chatController.addBrowserWindow(createWindow())
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
