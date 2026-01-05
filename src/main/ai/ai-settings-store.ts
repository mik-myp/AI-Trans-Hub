import { app, safeStorage } from 'electron'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import type { AiSettingsPublic, AiSettingsStored, AiSettingsUpdate } from '@src/types/ai'

const defaultSettings: AiSettingsStored = {
  version: 2,
  model: 'openai/gpt-4o-mini',
  apiKey: undefined,
  apiKeyEncrypted: undefined
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'ai-settings.json')
}

type LegacyAiSettingsV1 = {
  version?: number
  provider?: string
  model?: string
  baseUrl?: string
  apiKey?: string
  apiKeyEncrypted?: string
}

function tryDecryptApiKey(encryptedBase64: string): string | undefined {
  if (!encryptedBase64.trim()) return undefined
  if (!safeStorage.isEncryptionAvailable()) return undefined
  try {
    const decrypted = safeStorage.decryptString(Buffer.from(encryptedBase64, 'base64'))
    return decrypted.trim() ? decrypted : undefined
  } catch {
    return undefined
  }
}

function readApiKeyFromStored(obj: {
  apiKey?: unknown
  apiKeyEncrypted?: unknown
}): string | undefined {
  const plain = typeof obj.apiKey === 'string' ? obj.apiKey.trim() : ''
  if (plain) return plain
  const encrypted = typeof obj.apiKeyEncrypted === 'string' ? obj.apiKeyEncrypted : ''
  return encrypted ? tryDecryptApiKey(encrypted) : undefined
}

function toDiskApiKeyPayload(
  apiKey: string | undefined
): Pick<AiSettingsStored, 'apiKey' | 'apiKeyEncrypted'> {
  if (!apiKey) return { apiKey: undefined, apiKeyEncrypted: undefined }
  if (!safeStorage.isEncryptionAvailable()) return { apiKey, apiKeyEncrypted: undefined }
  try {
    const apiKeyEncrypted = safeStorage.encryptString(apiKey).toString('base64')
    return { apiKey: undefined, apiKeyEncrypted }
  } catch {
    return { apiKey, apiKeyEncrypted: undefined }
  }
}

function toGatewayModelId(provider: string | undefined, model: string | undefined): string {
  const modelTrimmed = model?.trim() ?? ''
  if (!modelTrimmed) return defaultSettings.model
  if (modelTrimmed.includes('/')) return modelTrimmed

  const providerTrimmed = provider?.trim() ?? ''
  if (!providerTrimmed) return `openai/${modelTrimmed}`

  if (providerTrimmed === 'qwen') return `alibaba/${modelTrimmed}`
  if (providerTrimmed === 'deepseek') return `deepseek/${modelTrimmed}`
  if (providerTrimmed === 'ollama' || providerTrimmed === 'custom') return defaultSettings.model

  return `${providerTrimmed}/${modelTrimmed}`
}

function sanitizeGatewayModelId(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return defaultSettings.model
  return trimmed.includes('/') ? trimmed : `openai/${trimmed}`
}

function sanitizeStoredSettings(value: unknown): AiSettingsStored {
  if (!value || typeof value !== 'object') return { ...defaultSettings }
  const obj = value as LegacyAiSettingsV1

  const version = typeof obj.version === 'number' ? obj.version : 1
  const apiKey = readApiKeyFromStored(obj)

  if (version >= 2) {
    return {
      version: 2,
      model: sanitizeGatewayModelId(obj.model),
      apiKey
    }
  }

  return {
    version: 2,
    model: sanitizeGatewayModelId(toGatewayModelId(obj.provider, obj.model)),
    apiKey
  }
}

export async function readAiSettings(): Promise<AiSettingsStored> {
  try {
    const raw = await readFile(getSettingsPath(), 'utf8')
    return sanitizeStoredSettings(JSON.parse(raw) as unknown)
  } catch {
    return { ...defaultSettings }
  }
}

export function toPublicAiSettings(settings: AiSettingsStored): AiSettingsPublic {
  return {
    version: 2,
    model: settings.model,
    hasApiKey: Boolean(settings.apiKey)
  }
}

export async function writeAiSettings(update: AiSettingsUpdate): Promise<AiSettingsStored> {
  const current = await readAiSettings()

  const nextModel = sanitizeGatewayModelId(update.model)
  const nextApiKey =
    update.apiKey === undefined
      ? current.apiKey
      : update.apiKey.trim()
        ? update.apiKey.trim()
        : undefined

  const diskPayload: AiSettingsStored = {
    version: 2,
    model: nextModel,
    ...toDiskApiKeyPayload(nextApiKey)
  }

  const filepath = getSettingsPath()
  await mkdir(dirname(filepath), { recursive: true })
  await writeFile(filepath, JSON.stringify(diskPayload, null, 2), 'utf8')

  return {
    version: 2,
    model: diskPayload.model,
    apiKey: nextApiKey
  }
}
