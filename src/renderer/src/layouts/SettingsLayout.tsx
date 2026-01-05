import { IpcChannel } from '@src/types/ipc-channels'
import { X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { Outlet, useLocation, useNavigate } from 'react-router'

const menus = [
  {
    key: '/windows/settings',
    label: '设置'
  },
  {
    key: '/windows/settings/about',
    label: '关于'
  }
] as const

export default function SettingsLayout(): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const handleClose = (): void => {
    window.electronAPI.ipcRenderer.send(IpcChannel.CLOSE_SETTINGS)
  }

  return (
    <div className="flex flex-row h-full">
      <div className="w-36 bg-[#F6F7FA]">
        <div className="h-9 [app-region:drag]"></div>
        <div className="p-4 flex flex-col gap-4">
          {menus.map((menu) => {
            return (
              <div
                key={menu.key}
                className={cn(
                  'py-2 px-3 text-sm text-[#626469] rounded-sm cursor-pointer',
                  location.pathname === menu.key && 'bg-[#F7EEF0] text-[#FB4A3E]',
                  location.pathname !== menu.key && 'hover:bg-[#EFF1FA]'
                )}
                onClick={() => navigate(menu.key)}
              >
                {menu.label}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex-1 bg-white flex flex-col">
        <div className="h-9 mx-2 [app-region:drag] flex justify-between items-center">
          <div></div>
          <div
            className="[app-region:no-drag] p-0.5 cursor-pointer rounded-2xl text-center hover:bg-[#E41122] hover:text-white"
            onClick={handleClose}
          >
            <X size={16} />
          </div>
        </div>
        <main className="flex-1 px-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
