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

  return (
    <div className="flex flex-row h-full">
      <div className="w-36 bg-sidebar">
        <div className="h-9 [app-region:drag]"></div>
        <div className="p-4 flex flex-col gap-4">
          {menus.map((menu) => {
            return (
              <div
                key={menu.key}
                className={cn(
                  'py-2 px-3 text-sm rounded-sm cursor-pointer text-sidebar-accent-foreground hover:bg-sidebar-accent font-normal',
                  location.pathname === menu.key && 'bg-sidebar-accent font-medium'
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
        <div className="h-9 mx-2 [app-region:drag] flex justify-between items-center"></div>
        <main className="flex-1 px-9 py-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
