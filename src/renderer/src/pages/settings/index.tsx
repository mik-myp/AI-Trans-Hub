import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import type { AiSettings } from '@src/types/ai'
import { IpcChannel } from '@src/types/ipc-channels'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { toUserErrorMessage } from '@renderer/lib/ipc'

export default function Settings(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const [baseURL, setBaseURL] = useState('')
  const [model, setModel] = useState('openai/gpt-5')
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)

  const [includeApiKeyInExport, setIncludeApiKeyInExport] = useState(false)
  const [applyApiKeyOnImport, setApplyApiKeyOnImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = (await window.electronAPI.ipcRenderer.invoke(
          IpcChannel.GET_AI_SETTINGS
        )) as AiSettings

        setBaseURL(data.baseURL || '')
        setModel(data.model)
        setHasApiKey(Boolean(data.apiKey))
      } catch (error) {
        toast.error(toUserErrorMessage(error) ?? '加载设置失败')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const handleSave = async (): Promise<void> => {
    const modelTrimmed = model.trim()
    if (!modelTrimmed) {
      toast.info('请填写模型（例如：openai/gpt-5）')
      return
    }
    if (!hasApiKey && !apiKey.trim()) {
      toast.info('请填写 apiKey ')
      return
    }

    setIsSaving(true)
    try {
      await window.electronAPI.ipcRenderer.invoke(IpcChannel.SET_AI_SETTINGS, {
        baseURL: baseURL.trim() ? baseURL.trim() : undefined,
        model: modelTrimmed,
        apiKey: apiKey.trim() ? apiKey.trim() : undefined
      })
      setHasApiKey(Boolean(apiKey.trim()) || hasApiKey)
      setApiKey('')
      toast.success('已保存')
    } catch (error) {
      toast.error(toUserErrorMessage(error) ?? '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async (): Promise<void> => {
    if (includeApiKeyInExport) {
      const ok = window.confirm('导出将包含 API Key，可能造成泄露风险。确定继续吗？')
      if (!ok) return
    }

    setIsExporting(true)
    try {
      const result = (await window.electronAPI.ipcRenderer.invoke(IpcChannel.EXPORT_AI_SETTINGS, {
        includeApiKey: includeApiKeyInExport
      })) as { fileName: string; json: string }

      const blob = new Blob([result.json], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.fileName || 'ai-trans-hub-settings.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('已导出')
    } catch (error) {
      toast.error(toUserErrorMessage(error) ?? '导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (file: File): Promise<void> => {
    setIsImporting(true)
    try {
      const text = await file.text()
      const data = (await window.electronAPI.ipcRenderer.invoke(IpcChannel.IMPORT_AI_SETTINGS, {
        json: text,
        applyApiKey: applyApiKeyOnImport
      })) as AiSettings

      setModel(data.model)
      setHasApiKey(Boolean(data.apiKey))
      setApiKey('')
      toast.success('已导入')
    } catch (error) {
      toast.error(toUserErrorMessage(error) ?? '导入失败')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="ai-gateway">
        <TabsList>
          <TabsTrigger value="ai-gateway">AI Gateway 配置</TabsTrigger>
          <TabsTrigger value="import/export">导入 / 导出</TabsTrigger>
        </TabsList>
        <TabsContent value="ai-gateway">
          <Card>
            <CardHeader>
              <CardTitle>AI Gateway 配置</CardTitle>
              <CardDescription>应用翻译统一通过 Vercel AI SDK 的 AI Gateway 调用</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="model">自定义基础URL（可选）</Label>
                <Input
                  id="baseURL"
                  value={baseURL}
                  onChange={(e) => setBaseURL(e.target.value)}
                  placeholder="请输入自定义基础URL"
                  disabled={isLoading}
                />
                <div className="text-xs text-muted-foreground">
                  格式示例：`https://api.example.com/v1`。
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">模型</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="openai/gpt-5"
                  disabled={isLoading}
                />
                <div className="text-xs text-muted-foreground">
                  格式示例：`openai/gpt-5`、`deepseek/deepseek-v3`、`google/gemini-2.0-flash`。
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="apiKey">apiKey</Label>
                  <span className="text-xs text-muted-foreground">
                    {hasApiKey ? '已设置（留空则不修改）' : '未设置'}
                  </span>
                </div>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasApiKey ? '********' : '请输入 apiKey'}
                  disabled={isLoading}
                />
                <div className="text-xs text-muted-foreground">
                  API Key 会优先使用系统安全存储加密保存（若系统不支持则明文保存于本地 JSON）。
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={isLoading || isSaving}
              >
                保存
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="import/export">
          <Card>
            <CardHeader>
              <CardTitle>导入 / 导出</CardTitle>
              <CardDescription>配置以 JSON 格式导入导出，便于不同设备间迁移。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="exportApiKey"
                    className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                    checked={includeApiKeyInExport}
                    onCheckedChange={(checked) => setIncludeApiKeyInExport(checked as boolean)}
                  />
                  <Label htmlFor="exportApiKey">导出时包含 API Key（不推荐）</Label>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="importApiKey"
                    className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                    checked={applyApiKeyOnImport}
                    onCheckedChange={(checked) => setApplyApiKeyOnImport(checked as boolean)}
                  />
                  <Label htmlFor="importApiKey">导入时应用文件中的 API Key（如果存在）</Label>
                </div>
                <div className="text-xs text-muted-foreground">
                  建议导出/导入时不包含 API Key，在新设备上手动粘贴更安全。
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleExport()}
                  disabled={isExporting}
                >
                  {isExporting ? '导出中…' : '导出配置'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImportClick}
                  disabled={isImporting}
                >
                  {isImporting ? '导入中…' : '导入配置'}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  void handleImportFile(file)
                }}
              />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
