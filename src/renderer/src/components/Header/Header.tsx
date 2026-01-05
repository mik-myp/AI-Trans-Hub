import { Minus, Pin, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { Separator } from '@renderer/components/ui/separator'
import { cn } from '@renderer/lib/utils'
import { IpcChannel } from '@src/types/ipc-channels'

export default function Header(): React.JSX.Element {
  const [isOnTop, setIsOnTop] = useState(false)

  const handleClose = (): void => {
    window.electronAPI.ipcRenderer.send(IpcChannel.CLOSE_MAIN)
  }
  const handleMinimize = (): void => {
    window.electronAPI.ipcRenderer.send(IpcChannel.MINIMIZE_MAIN)
  }

  const handleSetAlwaysOnTop = (): void => {
    window.electronAPI.ipcRenderer.send(IpcChannel.SET_ALWAYS_ON_TOP_MAIN)
    setIsOnTop((prev) => !prev)
  }

  const handleOpenSettings = (): void => {
    window.electronAPI.ipcRenderer.send(IpcChannel.OPEN_SETTINGS)
  }

  return (
    <div className="flex flex-row items-center justify-between p-2 [app-region:drag]">
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
        <Separator orientation="vertical" className="bg-[#C7C7C7]! h-5! w-0.5!" />
        <div className="text-black flex gap-2 items-center">
          <div
            className="p-0.5 cursor-pointer rounded-2xl hover:bg-[#C6CCD1] hover:text-black"
            onClick={handleMinimize}
          >
            <Minus size={16} />
          </div>
          <div
            className="p-0.5 cursor-pointer rounded-2xl text-center hover:bg-[#E41122] hover:text-white"
            onClick={handleClose}
          >
            <X size={16} />
          </div>
        </div>
      </div>
    </div>
  )
}
