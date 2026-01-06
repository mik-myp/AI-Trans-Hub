import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

class MainWindow {
  public window: BrowserWindow | null = null

  public createWindow(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus()
      return
    }
    this.window = new BrowserWindow({
      minWidth: 800,
      minHeight: 540,
      show: false,
      title: 'AI-Trans-Hub',
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
      this.window.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }
}

const mainWindow = new MainWindow()
export { mainWindow }
