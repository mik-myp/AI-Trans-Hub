import { toast } from 'sonner'
import { LanguageMode } from '../types/ai'

/**
 * 检查文本中是否包含中文字符
 * @param text 要检查的文本字符串
 * @returns 如果文本中包含中文字符则返回 true，否则返回 false
 */
export function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text)
}

/**
 * 根据模式和文本内容解析翻译方向
 * 当模式为 'auto' 时，根据文本内容自动判断翻译方向；否则直接返回指定的模式
 * @param mode 语言翻译模式，'auto' 表示自动检测，其他值为指定方向
 * @param text 需要翻译的文本内容
 * @returns 排除自动模式的翻译方向，'zh-en' 表示中译英，'en-zh' 表示英译中
 */
export function resolveDirection(mode: LanguageMode, text: string): Exclude<LanguageMode, 'auto'> {
  if (mode !== 'auto') return mode
  return hasChinese(text) ? 'zh-en' : 'en-zh'
}

/**
 * 计算文本的权重值，基于去除空格后的字符长度和行数
 * 权重计算公式：字符长度 + (行数 - 1) * 24
 * @param text 输入的文本字符串
 * @returns 返回计算后的权重值，空文本返回0
 */
export function textWeight(text: string): number {
  // 去除首尾空白字符
  const trimmed = text.trim()
  if (!trimmed) return 0

  // 计算去除所有空格后的字符长度
  const compactLength = trimmed.replace(/\s/g, '').length

  // 计算文本行数
  const lineCount = trimmed.split(/\r?\n/).length

  // 返回权重值：字符长度 + 行数带来的额外权重
  return compactLength + Math.max(0, lineCount - 1) * 24
}

/**
 * 根据文本内容自适应计算字体大小（像素单位）
 *
 * 该函数通过计算文本的权重值，并根据预设的断点来确定合适的字体大小
 * 字体大小会根据文本长度在最大值和最小值之间调整
 *
 * @param text 需要计算字体大小的文本内容
 * @param options 配置选项
 * @param options.max 字体大小的最大值
 * @param options.min 字体大小的最小值
 * @param options.empty 当文本为空时的默认字体大小，默认为max和18中的较小值
 * @param options.breakpoints 字体大小调整的断点数组，默认为[24, 60, 120, 200, 300]
 * @returns 计算后的字体大小值
 */
export function adaptiveFontSizePx(
  text: string,
  options: { max: number; min: number; empty?: number; breakpoints?: number[] }
): number {
  // 如果文本为空或只包含空白字符，返回空文本的字体大小或默认值
  if (!text.trim()) return options.empty ?? Math.min(options.max, 18)

  // 计算文本的权重值
  const weight = textWeight(text)
  // 解构断点数组，用于确定字体大小调整的阈值
  const [b0, b1, b2, b3, b4] = options.breakpoints ?? [24, 60, 120, 200, 300]

  // 根据文本权重与断点的比较，逐步减小字体大小
  if (weight <= b0) return options.max
  if (weight <= b1) return Math.max(options.min, options.max - 4)
  if (weight <= b2) return Math.max(options.min, options.max - 8)
  if (weight <= b3) return Math.max(options.min, options.max - 10)
  if (weight <= b4) return Math.max(options.min, options.max - 12)
  return options.min
}

/**
 * 将文本复制到剪贴板
 * 首先尝试使用现代浏览器支持的 navigator.clipboard API
 * 如果不支持，则使用 document.execCommand 方法作为降级方案
 *
 * @param text - 要复制到剪贴板的文本内容
 * @returns Promise<void> - 异步操作，无返回值
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!text.trim()) {
    toast.info('没有可复制的内容')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    toast.success('已复制')
    return
  } catch {
    // fallthrough
  }

  try {
    // 创建一个临时文本区域元素用于复制操作
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    toast.success('已复制')
  } catch {
    toast.error('复制失败')
  }
}

/**
 * 从系统剪贴板读取文本内容
 *
 * @returns 一个Promise，解析为剪贴板中的文本字符串，如果读取失败则返回null
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText()
  } catch {
    toast.error('读取剪贴板失败')
    return null
  }
}
