import { app, shell, BrowserWindow, ipcMain, Tray, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as path from 'path'
import { autoUpdater } from 'electron-updater'
import handleNotifications from './notifications'

let mainWindow: BrowserWindow

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: is.dev ? true : false
    },
    frame: false,
    title: 'Pomodoro'
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    checkForUpdates()
  }
}

function checkForUpdates(): void {
  autoUpdater.checkForUpdates()
  autoUpdater.downloadUpdate()
}

// Eventos do autoUpdater

autoUpdater.on('update-downloaded', (v) => {
  mainWindow.webContents.send("update-downloaded")
})

ipcMain.on('confirm-update', () => {
  autoUpdater.quitAndInstall()
})

// Inicialização do app
app.whenReady().then(() => {
  electronApp.setAppUserModelId('Pomodoro')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const tray = new Tray(path.join(__dirname, '../../resources/icon.png'))
  const menu = Menu.buildFromTemplate([
    {
      label: 'Ações rápidas',
      submenu: [
        { label: 'Iniciar pomodoro' },
        { label: 'Parar pomodoro' },
        { label: 'Iniciar descanso' },
        { label: 'Parar descanso' }
      ]
    },
    {
      label: 'Fechar app',
      click: () => mainWindow.close()
    }
  ])
  tray.setContextMenu(menu)

  createWindow()
  handleNotifications()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
