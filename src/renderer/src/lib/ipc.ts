const ELECTRON_INVOKE_ERROR_PREFIX = /^Error invoking remote method '.*?':\s*/i

export function cleanElectronInvokeErrorMessage(message: string): string {
  let cleaned = message.trim()
  cleaned = cleaned.replace(ELECTRON_INVOKE_ERROR_PREFIX, '')
  cleaned = cleaned.replace(/^(Error:\s*)+/i, '')
  return cleaned.trim() || message
}

export function toUserErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return cleanElectronInvokeErrorMessage(error.message)
  if (typeof error === 'string') return cleanElectronInvokeErrorMessage(error)
  return undefined
}
