import type { LanguageDirection, TranslationTone } from '@src/types/ai'
import translationSystemPromptTemplate from '@src/prompts/translation/system.md?raw'
import { generateText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { readAiSettings } from './ai-settings-store'

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
    throw new Error('请先在设置中配置 AI Gateway API Key')
  }
  if (!settings.model?.trim()) {
    throw new Error('请先在设置中配置模型')
  }

  const { systemPrompt, userPrompt } = buildTranslationPrompts({ text, direction, tone })
  const gateway = createGateway({ apiKey: settings.apiKey })

  const result = await generateText({
    model: gateway(settings.model),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.1
  })

  return result.text.trim()
}
