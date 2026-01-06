export type LanguageDirection = 'en-zh' | 'zh-en'

export type TranslationTone = 'general' | 'spoken' | 'professional' | 'friendly'

export type AiSettings = {
  baseURL?: string
  model: string
  apiKey: string
}

export type AiSettingsStored = Omit<AiSettings, 'apiKey'> & {
  apiKeyEncrypted?: string
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

export type LanguageMode = 'auto' | 'en-zh' | 'zh-en'
