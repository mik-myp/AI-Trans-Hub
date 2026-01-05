import classNames from 'classnames'
import { Minus, Pin, Settings, X } from 'lucide-react'
import React, { useState } from 'react'
import { Separator } from '@renderer/components/ui/separator'
import { SendEnum } from '@src/types/ipc-constants'

export default function Header(): React.JSX.Element {
  const [isOnTop, setIsOnTop] = useState(false)

  const handleClose = (): void => {
    window.electronAPI.ipcRenderer.send(SendEnum.CLOSE)
  }
  const handleMinimize = (): void => {
    window.electronAPI.ipcRenderer.send(SendEnum.MINIMIZE)
  }

  const handleSetAlwaysOnTop = (): void => {
    window.electronAPI.ipcRenderer.send(SendEnum.SET_ALWAYS_ON_TOP)
    setIsOnTop(!isOnTop)
  }

  return (
    <div className="bg-[#DDE3E9] flex flex-row items-center justify-between p-2 [app-region:drag]">
      <div></div>
      <div className="flex flex-row gap-3 items-center [app-region:no-drag]">
        <div className="flex gap-2 items-center">
          <Pin
            size={16}
            onClick={handleSetAlwaysOnTop}
            className={classNames('cursor-pointer', {
              'text-blue-500': isOnTop
            })}
          />
          <Settings size={16} className="cursor-pointer" />
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
