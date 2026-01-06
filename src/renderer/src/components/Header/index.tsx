import { Pin, Settings } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { IpcChannel } from '@src/types/ipc-channels'
import classnames from 'classnames'

export default function Header(): React.JSX.Element {
  const [isOnTop, setIsOnTop] = useState(false)

  const handleSetAlwaysOnTop = (): void => {
    window.electronAPI.ipcRenderer.send(IpcChannel.SET_ALWAYS_ON_TOP_MAIN)
    setIsOnTop((prev) => !prev)
  }

  const handleOpenSettings = (): void => {
    window.electronAPI.ipcRenderer.send(IpcChannel.OPEN_SETTINGS)
  }

  return (
    <div
      className={classnames(
        'flex flex-row items-center justify-between px-3 py-2 [app-region:drag]',
        { 'mr-24': window.electronAPI.process.platform === 'win32' }
      )}
    >
      <div></div>
      <div className="flex flex-row gap-3 items-center [app-region:no-drag]">
        <div className="flex gap-2 items-center">
          <Pin
            size={16}
            onClick={handleSetAlwaysOnTop}
            className={cn('cursor-pointer', isOnTop && 'text-blue-500')}
          />
          <Settings size={16} className="cursor-pointer" onClick={handleOpenSettings} />
        </div>
      </div>
    </div>
  )
}
