import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import type { AppInfo, UpdaterEvent } from '@src/types/app'
import { IpcChannel } from '@src/types/ipc-channels'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { toUserErrorMessage } from '@renderer/lib/ipc'

export default function About(): React.JSX.Element {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [updateEvent, setUpdateEvent] = useState<UpdaterEvent | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const info = (await window.electronAPI.ipcRenderer.invoke(
          IpcChannel.GET_APP_INFO
        )) as AppInfo
        setAppInfo(info)
      } catch (error) {
        toast.error(toUserErrorMessage(error) ?? '获取版本信息失败')
      }
    }
    void load()
  }, [])

  useEffect(() => {
    const listener = (_event: unknown, payload: UpdaterEvent): void => {
      setUpdateEvent(payload)
      if (payload.status === 'error') {
        toast.error(payload.message)
      }
    }

    window.electronAPI.ipcRenderer.on(IpcChannel.UPDATER_EVENT, listener)
    return () => {
      window.electronAPI.ipcRenderer.removeListener(IpcChannel.UPDATER_EVENT, listener)
    }
  }, [])

  const updateStatusText = useMemo(() => {
    if (!updateEvent) return '未检查更新'
    switch (updateEvent.status) {
      case 'checking-for-update':
        return '正在检查更新…'
      case 'update-available':
        return `发现新版本：v${updateEvent.version}，正在下载…`
      case 'download-progress':
        return `正在下载更新：${Math.round(updateEvent.percent)}%`
      case 'update-downloaded':
        return `更新已下载：v${updateEvent.version}`
      case 'update-not-available':
        return `已是最新版本（v${updateEvent.version}）`
      case 'error':
        return `更新失败：${updateEvent.message}`
      default:
        return '未知状态'
    }
  }, [updateEvent])

  const canInstall = updateEvent?.status === 'update-downloaded'

  const handleCheckUpdates = async (): Promise<void> => {
    setIsChecking(true)
    try {
      const result = (await window.electronAPI.ipcRenderer.invoke(
        IpcChannel.CHECK_FOR_UPDATES
      )) as {
        ok: boolean
        message?: string
      }
      if (!result.ok) {
        toast.error(result.message || '检查更新失败')
      }
    } catch (error) {
      toast.error(toUserErrorMessage(error) ?? '检查更新失败')
    } finally {
      setIsChecking(false)
    }
  }

  const handleInstallUpdate = async (): Promise<void> => {
    try {
      await window.electronAPI.ipcRenderer.invoke(IpcChannel.INSTALL_UPDATE)
    } catch (error) {
      toast.error(toUserErrorMessage(error) ?? '安装更新失败')
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>应用信息</CardTitle>
          <CardDescription>当前版本与更新状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <div className="text-muted-foreground">版本</div>
            <div className="mt-1 font-medium text-foreground">
              {appInfo ? `${appInfo.name} v${appInfo.version}` : '加载中…'}
            </div>
          </div>

          <div className="text-sm">
            <div className="text-muted-foreground">更新</div>
            <div className="mt-1 text-foreground">{updateStatusText}</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => void (canInstall ? handleInstallUpdate() : handleCheckUpdates())}
              disabled={isChecking}
            >
              {canInstall ? '重启安装' : '检查更新'}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            提示：需要在 `electron-builder.yml` / `dev-app-update.yml` 配置正确的 `publish`
            才能正常检查更新。
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
