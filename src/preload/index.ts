import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const customElectronAPI = {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
    contextBridge.exposeInMainWorld('customElectronAPI', customElectronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = electronAPI
  // @ts-ignore (define in dts)
  window.customElectronAPI = customElectronAPI
}
