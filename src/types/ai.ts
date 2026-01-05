export type LanguageDirection = 'en-zh' | 'zh-en'

export type TranslationTone = 'general' | 'spoken' | 'professional' | 'friendly'

export interface AiSettingsStored {
  version: 2
  model: string
  apiKey?: string
  apiKeyEncrypted?: string
}

export interface AiSettingsPublic {
  version: 2
  model: string
  hasApiKey: boolean
}

export interface AiSettingsUpdate {
  model: string
  apiKey?: string
}

export interface TranslateRequest {
  text: string
  direction: LanguageDirection
  tone?: TranslationTone
}

export interface TranslateResponse {
  translation: string
}
