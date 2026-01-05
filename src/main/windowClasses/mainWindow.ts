import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

class MainWindow {
  public window: BrowserWindow | null = null

  public createWindow(): void {
    this.window = new BrowserWindow({
      width: 500,
      height: 300,
      show: false,
      frame: false,
      titleBarStyle: 'hidden',
      maximizable: false,
      ...(process.platform === 'linux' ? { icon } : {}),
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
