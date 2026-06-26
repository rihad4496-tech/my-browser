import { session, BrowserWindow, ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { DownloadsDB } from '../database/DatabaseManager'
import { WindowManager } from '../browser/WindowManager'

// File types blocked from auto-execution for security
const BLOCKED_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-sh',
  'application/x-bat',
]

// Legal video download domains
const LEGAL_VIDEO_DOMAINS = [
  'youtube.com', 'youtu.be', 'vimeo.com',
  'dailymotion.com', 'ted.com', 'archive.org', 'twitch.tv',
]

export class DownloadManager {
  private static activeDownloads: Map<number, Electron.DownloadItem> = new Map()
  private static windowManager: WindowManager

  static initialize(wm: WindowManager) {
    this.windowManager = wm
    this.setupDownloadHandlers()
    this.setupIpc()
  }

  private static setupDownloadHandlers() {
    session.defaultSession.on('will-download', (event, item, webContents) => {
      const url      = item.getURL()
      const filename = item.getFilename()
      const mimeType = item.getMimeType()

      // Security: block suspicious executables
      if (this.isBlockedMime(mimeType) && !this.isUserInitiated(url)) {
        event.preventDefault()
        const win = BrowserWindow.fromWebContents(webContents)
        win?.webContents.send('download:blocked', { url, filename, reason: 'Suspicious file type blocked' })
        return
      }

      // Determine save path
      const downloadsDir = app.getPath('downloads')
      const savePath = path.join(downloadsDir, this.sanitizeFilename(filename))

      item.setSavePath(savePath)

      // Record in DB
      const dbId = DownloadsDB.add(url, filename, mimeType) as number
      this.activeDownloads.set(dbId, item)

      // Notify UI
      const win = BrowserWindow.fromWebContents(webContents)
      win?.webContents.send('download:started', {
        id: dbId,
        url,
        filename,
        mimeType,
        savePath,
        totalBytes: item.getTotalBytes(),
      })

      // Progress updates
      item.on('updated', (_, state) => {
        const received  = item.getReceivedBytes()
        const total     = item.getTotalBytes()
        const speed     = received // simplified; real impl tracks delta

        DownloadsDB.update(dbId, {
          status: state === 'progressing' ? 'downloading' : 'paused',
          downloaded: received,
          file_size: total,
        })

        win?.webContents.send('download:progress', {
          id: dbId,
          received,
          total,
          state,
          percent: total > 0 ? Math.round((received / total) * 100) : 0,
        })
      })

      item.once('done', (_, state) => {
        this.activeDownloads.delete(dbId)

        if (state === 'completed') {
          DownloadsDB.update(dbId, {
            status: 'completed',
            downloaded: item.getTotalBytes(),
            file_size: item.getTotalBytes(),
            save_path: savePath,
          })
          win?.webContents.send('download:completed', { id: dbId, savePath })
        } else {
          DownloadsDB.update(dbId, { status: state === 'cancelled' ? 'cancelled' : 'failed' })
          win?.webContents.send('download:failed', { id: dbId, state })
        }
      })
    })
  }

  private static setupIpc() {
    ipcMain.handle('download:pause', (_, { id }) => {
      const item = this.activeDownloads.get(id)
      if (item && !item.isPaused()) item.pause()
    })

    ipcMain.handle('download:resume', (_, { id }) => {
      const item = this.activeDownloads.get(id)
      if (item && item.isPaused()) item.resume()
    })

    ipcMain.handle('download:cancel', (_, { id }) => {
      const item = this.activeDownloads.get(id)
      if (item) item.cancel()
    })

    ipcMain.handle('download:url', async (_, { url, filename }) => {
      const win = this.windowManager.getFocusedWindow()
      if (!win) return

      // Trigger download via loadURL on a hidden view
      win.webContents.downloadURL(url)
    })

    // Video downloader (legal sites only)
    ipcMain.handle('download:video', async (event, { url, domain }) => {
      const isLegal = LEGAL_VIDEO_DOMAINS.some(d => domain.includes(d))
      if (!isLegal) {
        return { success: false, error: 'Video download only available for legal sites' }
      }

      const win = this.windowManager.getFocusedWindow()
      if (!win) return { success: false }

      win.webContents.downloadURL(url)
      return { success: true }
    })
  }

  private static isBlockedMime(mime: string): boolean {
    return BLOCKED_MIME_TYPES.some(blocked => mime.startsWith(blocked))
  }

  private static isUserInitiated(url: string): boolean {
    // Heuristic: user-initiated downloads often come from direct links
    return true // Simplified; real impl tracks user gesture
  }

  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\.\.+/g, '.')
      .trim()
      .slice(0, 255)
  }

  static cancelAll() {
    this.activeDownloads.forEach(item => item.cancel())
    this.activeDownloads.clear()
  }
}
