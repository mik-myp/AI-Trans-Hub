import { app, safeStorage } from 'electron'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import type { AiSettings, AiSettingsStored } from '@src/types/ai'

const defaultSettings: AiSettingsStored = {
  baseURL: undefined,
  model: 'openai/gpt-5.2',
  apiKey: undefined,
  apiKeyEncrypted: undefined
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'ai-settings.json')
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

export async function readAiSettings(): Promise<AiSettingsStored> {
  try {
    const raw = await readFile(getSettingsPath(), 'utf8')

    const jsonRaw = JSON.parse(raw) as AiSettings
    const apiKey = readApiKeyFromStored(jsonRaw)

    return {
      ...jsonRaw,
      apiKey
    }
  } catch {
    return { ...defaultSettings }
  }
}

export async function writeAiSettings(update: AiSettingsStored): Promise<AiSettingsStored> {
  const current = await readAiSettings()

  const nextApiKey = update.apiKey === undefined ? current.apiKey : update.apiKey.trim()

  const diskPayload: AiSettingsStored = {
    ...update,
    ...toDiskApiKeyPayload(nextApiKey)
  }

  const filepath = getSettingsPath()

  await mkdir(dirname(filepath), { recursive: true })
  await writeFile(filepath, JSON.stringify(diskPayload, null, 2), 'utf8')
  return diskPayload
}
