import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import type { AiSettingsPublic } from '@src/types/ai'
import { IpcChannel } from '@src/types/ipc-channels'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const commonModels = [
  { value: 'openai/gpt-4o-mini', label: 'OpenAI · gpt-4o-mini' },
  { value: 'openai/gpt-4o', label: 'OpenAI · gpt-4o' },
  { value: 'deepseek/deepseek-v3', label: 'DeepSeek · deepseek-v3' },
  { value: 'deepseek/deepseek-r1', label: 'DeepSeek · deepseek-r1' },
  { value: 'google/gemini-2.0-flash', label: 'Google · gemini-2.0-flash' },
  { value: 'google/gemini-2.5-flash', label: 'Google · gemini-2.5-flash' }
] as const

export default function Settings(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const [model, setModel] = useState('openai/gpt-4o-mini')
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)

  const [includeApiKeyInExport, setIncludeApiKeyInExport] = useState(false)
  const [applyApiKeyOnImport, setApplyApiKeyOnImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedCommonModel = useMemo(() => {
    return commonModels.some((m) => m.value === model) ? model : undefined
  }, [model])

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = (await window.electronAPI.ipcRenderer.invoke(
          IpcChannel.GET_AI_SETTINGS
        )) as AiSettingsPublic

        setModel(data.model)
        setHasApiKey(Boolean(data.hasApiKey))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '加载设置失败')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const handleSave = async (): Promise<void> => {
    const modelTrimmed = model.trim()
    if (!modelTrimmed) {
      toast.info('请填写模型（例如：openai/gpt-4o-mini）')
      return
    }
    if (!hasApiKey && !apiKey.trim()) {
      toast.info('请填写 AI Gateway API Key')
      return
    }

    setIsSaving(true)
    try {
      await window.electronAPI.ipcRenderer.invoke(IpcChannel.SET_AI_SETTINGS, {
        model: modelTrimmed,
        apiKey: apiKey.trim() ? apiKey.trim() : undefined
      })
      setHasApiKey(Boolean(apiKey.trim()) || hasApiKey)
      setApiKey('')
      toast.success('已保存')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
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
      a.download = result.fileName || 'ai-settings.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('已导出')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导出失败')
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
      })) as AiSettingsPublic

      setModel(data.model)
      setHasApiKey(Boolean(data.hasApiKey))
      setApiKey('')
      toast.success('已导入')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Gateway 配置</CardTitle>
          <CardDescription>
            应用翻译统一通过 Vercel AI SDK 的 AI Gateway 调用；你只需要配置模型与 API Key。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>常用模型（可选）</Label>
            <Select value={selectedCommonModel} onValueChange={setModel} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择一个常用模型（或手动填写下方模型）" />
              </SelectTrigger>
              <SelectContent>
                {commonModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">模型（AI Gateway model）</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="openai/gpt-4o-mini"
              disabled={isLoading}
            />
            <div className="text-xs text-muted-foreground">
              格式示例：`openai/gpt-4o-mini`、`deepseek/deepseek-v3`、`google/gemini-2.0-flash`。
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="apiKey">AI Gateway API Key</Label>
              <span className="text-xs text-muted-foreground">
                {hasApiKey ? '已设置（留空则不修改）' : '未设置'}
              </span>
            </div>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? '********' : '请输入 AI Gateway API Key'}
              disabled={isLoading}
            />
            <div className="text-xs text-muted-foreground">
              API Key 会优先使用系统安全存储加密保存（若系统不支持则明文保存于本地 JSON）。
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleSave()} disabled={isLoading || isSaving}>
              保存
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>导入 / 导出</CardTitle>
          <CardDescription>配置以 JSON 格式导入导出，便于不同设备间迁移。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#FB4A3E]"
                checked={includeApiKeyInExport}
                onChange={(e) => setIncludeApiKeyInExport(e.target.checked)}
              />
              导出时包含 API Key（不推荐）
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#FB4A3E]"
                checked={applyApiKeyOnImport}
                onChange={(e) => setApplyApiKeyOnImport(e.target.checked)}
              />
              导入时应用文件中的 API Key（如果存在）
            </label>
            <div className="text-xs text-muted-foreground">
              建议导出/导入时不包含 API Key，在新设备上手动粘贴更安全。
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void handleExport()} disabled={isExporting}>
              {isExporting ? '导出中…' : '导出配置'}
            </Button>
            <Button type="button" variant="outline" onClick={handleImportClick} disabled={isImporting}>
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
        </CardContent>
      </Card>
    </div>
  )
}

