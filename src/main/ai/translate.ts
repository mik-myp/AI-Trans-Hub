import type { LanguageDirection, TranslationTone } from '@src/types/ai'
import translationSystemPromptTemplate from '@src/prompts/translation/system.md?raw'
import { generateText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { readAiSettings } from './ai-settings-store'

function getErrorStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined

  const candidates = [
    (error as { statusCode?: unknown }).statusCode,
    (error as { status?: unknown }).status,
    (error as { response?: { status?: unknown } }).response?.status,
    (error as { cause?: { statusCode?: unknown; status?: unknown } }).cause?.statusCode,
    (error as { cause?: { statusCode?: unknown; status?: unknown } }).cause?.status
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
    if (typeof candidate === 'string') {
      const parsed = Number(candidate)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const code =
    (error as { code?: unknown }).code ?? (error as { cause?: { code?: unknown } }).cause?.code
  return typeof code === 'string' ? code : undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return ''
}

function toChineseTranslateErrorMessage(error: unknown): string {
  const statusCode = getErrorStatusCode(error)
  const code = getErrorCode(error)
  const message = getErrorMessage(error)
  const messageLower = message.toLowerCase()

  const statusSuffix = typeof statusCode === 'number' ? `（${statusCode}）` : ''

  const looksLikeAuthError =
    statusCode === 401 ||
    statusCode === 403 ||
    messageLower.includes('unauthorized') ||
    messageLower.includes('forbidden') ||
    messageLower.includes('invalid api key') ||
    messageLower.includes('invalid_api_key') ||
    (messageLower.includes('api') &&
      messageLower.includes('key') &&
      messageLower.includes('invalid'))

  if (looksLikeAuthError) {
    return `AI Gateway 鉴权失败${statusSuffix}。API Key 可能不正确、已过期或无权限，请在设置中更新后重试。`
  }

  const looksLikeModelError =
    statusCode === 404 ||
    messageLower.includes('model not found') ||
    messageLower.includes('unknown model') ||
    (messageLower.includes('model') && messageLower.includes('not found'))

  if (looksLikeModelError) {
    return `模型不可用或不存在${statusSuffix}。请在设置中检查 模型（AI Gateway model id，例如 openai/gpt-5）。`
  }

  if (statusCode === 400) {
    return `请求参数错误${statusSuffix}。请检查 模型 是否填写正确（格式通常为 provider/model，例如 openai/gpt-5）。`
  }

  if (
    statusCode === 429 ||
    messageLower.includes('rate limit') ||
    messageLower.includes('too many requests')
  ) {
    return `请求过于频繁或已触发限流${statusSuffix}。请稍后重试，或检查你的账号额度/限流设置。`
  }

  if (statusCode === 408 || statusCode === 504) {
    return `请求超时${statusSuffix}。请检查网络连接后重试。`
  }

  const looksLikeNetworkError =
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'EAI_AGAIN' ||
    messageLower.includes('fetch failed') ||
    messageLower.includes('network') ||
    messageLower.includes('getaddrinfo') ||
    messageLower.includes('timed out')

  if (looksLikeNetworkError) {
    return `网络连接失败。请检查网络、代理或防火墙设置后重试。`
  }

  if (typeof statusCode === 'number' && statusCode >= 500) {
    return `AI Gateway 服务暂时不可用${statusSuffix}。请稍后重试。`
  }

  return `翻译失败${statusSuffix}。请检查设置中的 API Key 和 模型，然后重试。`
}

function toneLabel(tone?: TranslationTone): string {
  switch (tone) {
    case 'spoken':
      return '口语化'
    case 'professional':
      return '专业的'
    case 'friendly':
      return '友好的'
    default:
      return '通用'
  }
}

function temperatureForTone(tone?: TranslationTone): number {
  switch (tone) {
    case 'spoken':
      return 0.3
    case 'friendly':
      return 0.25
    case 'professional':
      return 0.1
    default:
      return 0.15
  }
}

function languageLabel(direction: LanguageDirection): { source: string; target: string } {
  return direction === 'en-zh'
    ? { source: '英文', target: '简体中文' }
    : { source: '简体中文', target: '英文' }
}

function renderPromptTemplate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, value)
  }, template)
}

function buildTranslationPrompts(options: {
  text: string
  direction: LanguageDirection
  tone?: TranslationTone
}): { systemPrompt: string; userPrompt: string } {
  const lang = languageLabel(options.direction)
  const style = toneLabel(options.tone)

  const systemPrompt = renderPromptTemplate(translationSystemPromptTemplate, {
    sourceLanguage: lang.source,
    targetLanguage: lang.target,
    tone: style
  })

  const userPrompt = [
    `源语言：${lang.source}`,
    `目标语言：${lang.target}`,
    `风格：${style}`,
    '',
    '原文：',
    options.text
  ].join('\n')

  return { systemPrompt, userPrompt }
}

export async function translateText(
  text: string,
  direction: LanguageDirection,
  tone?: TranslationTone
): Promise<string> {
  const settings = await readAiSettings()

  if (!settings.apiKey) {
    throw new Error('请先在设置中配置 apiKey')
  }
  if (!settings.model?.trim()) {
    throw new Error('请先在设置中配置模型')
  }

  const { systemPrompt, userPrompt } = buildTranslationPrompts({ text, direction, tone })

  const gateway = createGateway({ apiKey: settings.apiKey, baseURL: settings.baseURL })

  let result: Awaited<ReturnType<typeof generateText>>
  try {
    result = await generateText({
      model: gateway(settings.model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: temperatureForTone(tone)
    })
  } catch (error) {
    throw new Error(toChineseTranslateErrorMessage(error))
  }

  return result.text.trim()
}
