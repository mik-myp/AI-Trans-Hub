import { ipcMain } from 'electron'
import { IpcChannel } from '@src/types/ipc-channels'
import { mainWindow } from '../windows/main-window'
import { settingsWindow } from '../windows/settings-window'

export default function registerWindowIpcHandlers(): void {
  // 设置主窗口置顶
  ipcMain.on(IpcChannel.SET_ALWAYS_ON_TOP_MAIN, () => {
    const window = mainWindow.window
    if (!window) return
    window.setAlwaysOnTop(!window.isAlwaysOnTop())
  })
  // 打开设置窗口
  ipcMain.on(IpcChannel.OPEN_SETTINGS, () => {
    settingsWindow.createWindow()
  })
}
