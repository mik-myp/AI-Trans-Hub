import { ipcMain } from 'electron'
import type { AiSettingsUpdate, TranslateRequest, TranslateResponse } from '@src/types/ai'
import { IpcChannel } from '@src/types/ipc-channels'
import { readAiSettings, toPublicAiSettings, writeAiSettings } from '../ai/ai-settings-store'
import { translateText } from '../ai/translate'

function assertNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} 不能为空`)
}

function toGatewayModelIdFromLegacy(provider: string | undefined, model: string | undefined): string {
  const modelTrimmed = model?.trim() ?? ''
  if (!modelTrimmed) return ''
  if (modelTrimmed.includes('/')) return modelTrimmed

  const providerTrimmed = provider?.trim() ?? ''
  if (!providerTrimmed) return `openai/${modelTrimmed}`

  if (providerTrimmed === 'qwen') return `alibaba/${modelTrimmed}`
  if (providerTrimmed === 'deepseek') return `deepseek/${modelTrimmed}`
  if (providerTrimmed === 'ollama' || providerTrimmed === 'custom') return `openai/${modelTrimmed}`
  return `${providerTrimmed}/${modelTrimmed}`
}

function sanitizeImportedSettings(value: unknown): { model: string; apiKey?: string } {
  if (!value || typeof value !== 'object') throw new Error('导入文件格式错误')
  const obj = value as Record<string, unknown>

  const version = typeof obj.version === 'number' ? obj.version : 1
  const apiKey = typeof obj.apiKey === 'string' ? obj.apiKey.trim() : ''

  if (version >= 2) {
    const model = typeof obj.model === 'string' ? obj.model.trim() : ''
    if (!model) throw new Error('导入文件缺少 model')
    return { model, apiKey: apiKey || undefined }
  }

  const provider = typeof obj.provider === 'string' ? obj.provider : undefined
  const legacyModel = typeof obj.model === 'string' ? obj.model : undefined
  const model = toGatewayModelIdFromLegacy(provider, legacyModel)
  if (!model.trim()) throw new Error('导入文件缺少 model')

  return { model, apiKey: apiKey || undefined }
}

export default function registerAiIpcHandlers(): void {
  ipcMain.handle(IpcChannel.GET_AI_SETTINGS, async () => {
    const settings = await readAiSettings()
    return toPublicAiSettings(settings)
  })

  ipcMain.handle(IpcChannel.SET_AI_SETTINGS, async (_event, update: AiSettingsUpdate) => {
    if (!update || typeof update !== 'object') throw new Error('参数错误')
    assertNonEmpty(update.model, '模型')

    const next = await writeAiSettings(update)
    return toPublicAiSettings(next)
  })

  ipcMain.handle(IpcChannel.EXPORT_AI_SETTINGS, async (_event, payload?: { includeApiKey?: boolean }) => {
    const includeApiKey = Boolean(payload?.includeApiKey)
    const settings = await readAiSettings()
    const exported = {
      version: 2 as const,
      model: settings.model,
      ...(includeApiKey && settings.apiKey ? { apiKey: settings.apiKey } : {})
    }
    return {
      fileName: 'ai-settings.json',
      json: JSON.stringify(exported, null, 2)
    }
  })

  ipcMain.handle(
    IpcChannel.IMPORT_AI_SETTINGS,
    async (_event, payload: { json: string; applyApiKey?: boolean }) => {
      if (!payload || typeof payload !== 'object') throw new Error('参数错误')
      if (typeof payload.json !== 'string' || !payload.json.trim()) throw new Error('导入内容为空')

      const imported = sanitizeImportedSettings(JSON.parse(payload.json) as unknown)
      const update: AiSettingsUpdate = {
        model: imported.model,
        apiKey: payload.applyApiKey ? imported.apiKey : undefined
      }

      const next = await writeAiSettings(update)
      return toPublicAiSettings(next)
    }
  )

  ipcMain.handle(
    IpcChannel.TRANSLATE,
    async (_event, payload: TranslateRequest): Promise<TranslateResponse> => {
      if (!payload || typeof payload !== 'object') throw new Error('参数错误')
      assertNonEmpty(payload.text, '原文')

      const translation = await translateText(payload.text, payload.direction, payload.tone)
      return { translation }
    }
  )
}

