import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      on: (channel: string, callback: (...args: unknown[]) => void) => void
      send: (channel: string, data?: unknown) => void
      removeListener: (channel: string, callback: (...args: unknown[]) => void) => void
    }
  }
}
