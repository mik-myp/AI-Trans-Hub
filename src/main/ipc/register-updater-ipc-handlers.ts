import { BrowserWindow, app, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IpcChannel } from '@src/types/ipc-channels'
import type { AppInfo, UpdaterEvent } from '@src/types/app'

function broadcastUpdaterEvent(event: UpdaterEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IpcChannel.UPDATER_EVENT, event)
    }
  }
}

let updaterInitialized = false

function initAutoUpdater(): void {
  if (updaterInitialized) return
  updaterInitialized = true

  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    broadcastUpdaterEvent({ status: 'checking-for-update' })
  })

  autoUpdater.on('update-available', (info) => {
    broadcastUpdaterEvent({ status: 'update-available', version: info.version })
  })

  autoUpdater.on('update-not-available', (info) => {
    broadcastUpdaterEvent({ status: 'update-not-available', version: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent = Number.isFinite(progress.percent) ? progress.percent : 0
    broadcastUpdaterEvent({ status: 'download-progress', percent })
  })

  autoUpdater.on('update-downloaded', (info) => {
    broadcastUpdaterEvent({ status: 'update-downloaded', version: info.version })
  })

  autoUpdater.on('error', (error) => {
    broadcastUpdaterEvent({ status: 'error', message: error?.message || '更新失败' })
  })
}

export default function registerUpdaterIpcHandlers(): void {
  initAutoUpdater()

  ipcMain.handle(IpcChannel.GET_APP_INFO, async (): Promise<AppInfo> => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      isPackaged: app.isPackaged
    }
  })

  ipcMain.handle(IpcChannel.CHECK_FOR_UPDATES, async () => {
    try {
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : '检查更新失败'
      broadcastUpdaterEvent({ status: 'error', message })
      return { ok: false, message }
    }
  })

  ipcMain.handle(IpcChannel.INSTALL_UPDATE, async () => {
    try {
      autoUpdater.quitAndInstall()
      return { ok: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : '安装更新失败'
      broadcastUpdaterEvent({ status: 'error', message })
      return { ok: false, message }
    }
  })
}
