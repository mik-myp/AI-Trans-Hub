import Header from '@renderer/components/Header'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Textarea } from '@renderer/components/ui/textarea'
import { cn } from '@renderer/lib/utils'
import type { LanguageMode, TranslationTone } from '@src/types/ai'
import { IpcChannel } from '@src/types/ipc-channels'
import {
  resolveDirection,
  adaptiveFontSizePx,
  copyToClipboard,
  readFromClipboard
} from '@src/utils'
import { ClipboardPaste, Copy, Loader2, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDebounceFn } from 'ahooks'
import { toUserErrorMessage } from '@renderer/lib/ipc'

const toneOptions = [
  { key: 'general', label: '通用' },
  { key: 'spoken', label: '口语化' },
  { key: 'professional', label: '专业的' },
  { key: 'friendly', label: '友好的' }
] as const satisfies ReadonlyArray<{ key: TranslationTone; label: string }>

function Home(): React.JSX.Element {
  const [languageMode, setLanguageMode] = useState<LanguageMode>('auto')
  const [tone, setTone] = useState<TranslationTone>('general')
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)

  const resolvedDirection = useMemo(
    () => resolveDirection(languageMode, sourceText),
    [languageMode, sourceText]
  )

  const sourceFontSizePx = useMemo(
    () =>
      adaptiveFontSizePx(sourceText, {
        max: 24,
        min: 14,
        empty: 18,
        breakpoints: [40, 100, 180, 260, 360]
      }),
    [sourceText]
  )

  const targetFontSizePx = useMemo(
    () =>
      adaptiveFontSizePx(targetText, {
        max: 28,
        min: 14,
        empty: 18,
        breakpoints: [24, 60, 120, 200, 300]
      }),
    [targetText]
  )

  const handleClear = (): void => {
    setSourceText('')
    setTargetText('')
  }

  const handlePaste = async (): Promise<void> => {
    const text = await readFromClipboard()
    if (text == null) return
    setSourceText(text)
  }

  const handleTranslate = async (): Promise<void> => {
    if (!sourceText.trim()) {
      toast.info('请输入要翻译的内容')
      return
    }

    setIsTranslating(true)
    try {
      const result = (await window.electronAPI.ipcRenderer.invoke(IpcChannel.TRANSLATE, {
        text: sourceText,
        direction: resolvedDirection,
        tone
      })) as { translation: string }
      setTargetText(result.translation ?? '')
    } catch (error) {
      toast.error(toUserErrorMessage(error) ?? '翻译失败')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // 阻止默认的换行行为
      if (!isTranslating) {
        void handleTranslate()
      }
    }
  }

  const handleChangeTone = (value: TranslationTone): void => {
    setTone(value)
    if (isTranslating || !sourceText.trim() || tone === value) return
    void handleTranslate()
  }

  const { run } = useDebounceFn(
    () => {
      void handleTranslate()
    },
    {
      wait: 500
    }
  )

  return (
    <div className="h-full bg-[#FAFCFE] flex flex-col">
      <Header />
      <div className="flex-1 min-h-0 px-4 pb-4">
        <div className="h-full rounded-2xl bg-white/70 border border-[#E9EEF5] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 flex-2 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <div className="relative">
                <Select
                  value={languageMode}
                  onValueChange={(value) => setLanguageMode(value as LanguageMode)}
                >
                  <SelectTrigger id="languageMode" className="h-8 w-30 bg-white text-[#2D2E31]">
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem key={'auto'} value={'auto'}>
                      英汉互译
                    </SelectItem>
                    <SelectItem key={'en-zh'} value={'en-zh'}>
                      英译汉
                    </SelectItem>
                    <SelectItem key={'zh-en'} value={'zh-en'}>
                      汉译英
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-[#626469] hover:bg-[#EEF1FA]"
                  onClick={() => void handlePaste()}
                  title="粘贴"
                >
                  <ClipboardPaste className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-[#626469] hover:bg-[#EEF1FA]"
                  onClick={handleClear}
                  title="清空"
                >
                  <X className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-[#626469] hover:bg-[#EEF1FA]"
                  onClick={() => void handleTranslate()}
                  disabled={isTranslating}
                  title="翻译"
                >
                  {isTranslating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <Textarea
              value={sourceText}
              onChange={(e) => {
                setSourceText(e.target.value)
                if (!e.target.value.trim()) {
                  handleClear()
                  return
                }
                run()
              }}
              placeholder="请输入要翻译的内容"
              className="flex-1 mt-3 resize-none"
              style={{
                fontSize: `${sourceFontSizePx}px`,
                lineHeight: sourceFontSizePx >= 20 ? '1.25' : '1.35'
              }}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-[#626469] hover:bg-[#EEF1FA]"
                  onClick={() => void copyToClipboard(sourceText)}
                  disabled={!sourceText.trim()}
                  title="复制原文"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="text-xs text-[#8D9199]">
                方向：{resolvedDirection === 'en-zh' ? '英译汉' : '汉译英'}
              </div>
            </div>
          </div>

          <div className="flex-3 flex flex-col">
            <div className="px-4">
              <div className="flex items-center gap-5 text-sm text-[#6B6E75]">
                {toneOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleChangeTone(item.key)}
                    className={cn(
                      'pb-2 transition-colors',
                      tone === item.key
                        ? 'text-[#141415] border-b-2 border-[#FB4A3E]'
                        : 'hover:text-[#141415]'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-[#EEF1FA]" />

            <div className="flex-1 px-6 pt-6 pb-4 overflow-auto">
              {isTranslating ? (
                <div className="space-y-2 h-full">
                  <Skeleton className="h-1/6" />
                  <Skeleton className="h-1/6" />
                  <Skeleton className="h-1/6" />
                  <Skeleton className="h-1/6" />
                </div>
              ) : targetText.trim() ? (
                <div
                  className="whitespace-pre-wrap text-[#141415]"
                  style={{
                    fontSize: `${targetFontSizePx}px`,
                    lineHeight: targetFontSizePx >= 22 ? '1.35' : '1.45'
                  }}
                >
                  {targetText}
                </div>
              ) : (
                <div className="text-[#8D9199] text-sm">译文将显示在这里</div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-[#EEF1FA] bg-white flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-[#626469] hover:bg-[#EEF1FA]"
                  onClick={() => void copyToClipboard(targetText)}
                  disabled={!targetText.trim()}
                  title="复制译文"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="text-xs text-[#8D9199]">提示：切换风格后可重新点击翻译</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
