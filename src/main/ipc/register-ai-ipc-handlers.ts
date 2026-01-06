import { ipcMain } from 'electron'
import type { AiSettings, TranslateRequest, TranslateResponse } from '@src/types/ai'
import { IpcChannel } from '@src/types/ipc-channels'
import { readAiSettings, writeAiSettings } from '../ai/ai-settings-store'
import { translateText } from '../ai/translate'

export default function registerAiIpcHandlers(): void {
  ipcMain.handle(IpcChannel.GET_AI_SETTINGS, async () => {
    return await readAiSettings()
  })

  ipcMain.handle(IpcChannel.SET_AI_SETTINGS, async (_event, update: AiSettings) => {
    if (!update || typeof update !== 'object') throw new Error('参数错误')
    await writeAiSettings(update)
  })

  ipcMain.handle(
    IpcChannel.EXPORT_AI_SETTINGS,
    async (_event, payload?: { includeApiKey?: boolean }) => {
      const includeApiKey = Boolean(payload?.includeApiKey)
      const settings = await readAiSettings()
      const exported = {
        baseURL: settings.baseURL,
        model: settings.model,
        ...(includeApiKey && settings.apiKey ? { apiKey: settings.apiKey } : {})
      }
      return {
        fileName: 'ai-trans-hub-settings.json',
        json: JSON.stringify(exported, null, 2)
      }
    }
  )

  ipcMain.handle(
    IpcChannel.IMPORT_AI_SETTINGS,
    async (_event, payload: { json: string; applyApiKey?: boolean }) => {
      if (!payload || typeof payload !== 'object') throw new Error('参数错误')
      if (typeof payload.json !== 'string' || !payload.json.trim()) throw new Error('导入内容为空')
      const settingJson = JSON.parse(payload.json)

      if (!settingJson || typeof settingJson !== 'object') throw new Error('导入文件格式错误')

      const obj = settingJson as Record<string, unknown>

      const baseURL = typeof obj.baseURL === 'string' ? obj.baseURL.trim() : ''
      const model = typeof obj.model === 'string' ? obj.model.trim() : ''
      const apiKey = typeof obj.apiKey === 'string' ? obj.apiKey.trim() : ''

      return await writeAiSettings({
        baseURL,
        model,
        apiKey: payload.applyApiKey ? apiKey : ''
      })
    }
  )

  ipcMain.handle(
    IpcChannel.TRANSLATE,
    async (_event, payload: TranslateRequest): Promise<TranslateResponse> => {
      if (!payload || typeof payload !== 'object') throw new Error('参数错误')
      const translation = await translateText(payload.text, payload.direction, payload.tone)
      return { translation }
    }
  )
}
