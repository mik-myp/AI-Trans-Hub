import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

class SettingsWindow {
  public window: BrowserWindow | null = null

  public createWindow(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show()
      this.window.focus()
      return
    }
    this.window = new BrowserWindow({
      minWidth: 750,
      minHeight: 500,
      show: false,
      title: '设置',
      titleBarStyle: 'hidden',
      maximizable: false,
      titleBarOverlay: {
        height: 32,
        color: '#FAFCFE',
        symbolColor: '#0a0a0a'
      },
      icon,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true
      }
    })
    this.window.on('ready-to-show', () => {
      if (this.window) {
        this.window.show()
      }
    })
    this.window.on('closed', () => {
      this.window = null
    })

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/windows/settings`)
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/windows/settings' })
    }
  }
}

const settingsWindow = new SettingsWindow()
export { settingsWindow }
