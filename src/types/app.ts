export interface AppInfo {
  name: string
  version: string
  isPackaged: boolean
}

export type UpdaterEvent =
  | { status: 'checking-for-update' }
  | { status: 'update-available'; version: string }
  | { status: 'update-not-available'; version: string }
  | { status: 'download-progress'; percent: number }
  | { status: 'update-downloaded'; version: string }
  | { status: 'error'; message: string }
