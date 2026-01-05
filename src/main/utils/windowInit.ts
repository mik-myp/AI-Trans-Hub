import { ipcMain } from 'electron'
import { SendEnum } from '@src/types/ipc-constants'
import { mainWindow } from '../windowClasses/mainWindow'

export default function windowInit(): void {
  // 关闭主窗口
  ipcMain.on(SendEnum.CLOSE, () => {
    console.log(mainWindow.window)

    mainWindow.window?.close()
  })
  // 最小化主窗口
  ipcMain.on(SendEnum.MINIMIZE, () => {
    mainWindow.window?.minimize()
  })
  // 设置主窗口置顶
  ipcMain.on(SendEnum.SET_ALWAYS_ON_TOP, () => {
    mainWindow.window?.setAlwaysOnTop(!mainWindow.window?.isAlwaysOnTop())
  })
}
