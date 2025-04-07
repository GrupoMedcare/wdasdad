import { app, shell, BrowserWindow, ipcMain, Tray, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as path from 'path'
import { autoUpdater } from 'electron-updater'
import handleNotifications from './notifications'
let mainWindow: BrowserWindow
const server = 'https://github.com/GrupoMedcare/wdasdad/tags'
const feedUrl = `${server}/${app.getVersion()}`
function createWindow(): void {
  // Create the browser window.
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

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    checkForUpdates()
  }
}

function checkForUpdates():void {
  autoUpdater.setFeedURL({ provider: 'github', releaseType: 'release', repo: 'wdasdad', owner: "GrupoMedcare", publishAutoUpdate: true, protocol: "https", })

  // Checar por atualizações
  autoUpdater.checkForUpdatesAndNotify()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('Pomodoro')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const tray = new Tray(path.join(__dirname, '../../resources/icon.png'))
  const menu = Menu.buildFromTemplate([
    {
      label: 'Ações rápidas',
      submenu: [
        {
          label: 'Iniciar pomodoro'
        },
        {
          label: 'Parar pomodoro'
        },
        {
          label: 'Iniciar descanso'
        },
        {
          label: 'Parar descanso'
        }
      ]
    },
    {
      label: 'Fechar app',
      click: (): void => {
        mainWindow.close()
      }
    }
  ])

  tray.setContextMenu(menu)
  // IPC test

  createWindow()
  handleNotifications()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

autoUpdater.on('checking-for-update', () => {
  ipcMain.emit("update")
});

autoUpdater.on('update-available', () => {
  ipcMain.emit("update")
});

autoUpdater.on('update-not-available', () => {
  ipcMain.emit("update")
});

autoUpdater.on('error', (err) => {
  console.error('Erro ao verificar ou aplicar atualizações:', err);
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  ipcMain.emit("update")
  // Quando a atualização é baixada, você pode optar por reiniciar automaticamente ou pedir para o usuário reiniciar
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Atualização pronta!',
    message: `Uma nova versão foi baixada. Reinicie o aplicativo para aplicar.`,
    buttons: ['Reiniciar agora', 'Mais tarde']
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
