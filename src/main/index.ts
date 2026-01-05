import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { mainWindow } from './windows/main-window'
import registerWindowIpcHandlers from './ipc/register-window-ipc-handlers'
import registerAiIpcHandlers from './ipc/register-ai-ipc-handlers'
import registerUpdaterIpcHandlers from './ipc/register-updater-ipc-handlers'

function createWindow(): void {
  mainWindow.createWindow()
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.hub.trans.ai')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  registerWindowIpcHandlers()
  registerAiIpcHandlers()
  registerUpdaterIpcHandlers()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
