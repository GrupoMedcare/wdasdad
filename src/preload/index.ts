import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args))
  },
  send: (channel, data) => {
    ipcRenderer.send(channel, data)
  },
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback)
  }
}

// Expor ipcRenderer manualmente dentro do electronAPI
const customElectronAPI = {
  ...electronAPI,
  ipcRenderer // <- adiciona o ipcRenderer aqui!
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', customElectronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // fallback sem context isolation
  // @ts-ignore
  window.electron = customElectronAPI
  // @ts-ignore
  window.api = api
}
