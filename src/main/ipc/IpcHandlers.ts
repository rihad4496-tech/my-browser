import { ipcMain, shell, dialog, clipboard, nativeTheme, app, session } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { WindowManager } from '../browser/WindowManager'
import { AdBlocker } from '../security/AdBlocker'
import { SecurityManager } from '../security/SecurityManager'
import { PrivacyManager } from '../security/PrivacyManager'
import {
  HistoryDB, BookmarksDB, PasswordDB, SettingsDB, DownloadsDB
} from '../database/DatabaseManager'

const ENCRYPTION_KEY = crypto.scryptSync('rihadx-master-key', 'rihadx-salt-v1', 32)

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(data: string): string {
  const [ivHex, encryptedHex] = data.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export function setupIpcHandlers(windowManager: WindowManager) {

  // ── Tab Management ────────────────────────────────────────────────────────
  ipcMain.handle('tab:create', (event, { url, incognito }) => {
    const win = windowManager.getFocusedWindow()
    if (!win) return null
    return windowManager.createTabView(win.id, url || 'rihadx://newtab', incognito)
  })

  ipcMain.handle('tab:close', (event, { tabId }) => {
    const win = windowManager.getFocusedWindow()
    if (win) windowManager.closeTab(win.id, tabId)
  })

  ipcMain.handle('tab:activate', (event, { tabId }) => {
    const win = windowManager.getFocusedWindow()
    if (win) windowManager.setActiveTab(win.id, tabId)
  })

  ipcMain.handle('tab:navigate', (event, { url, tabId }) => {
    const win = windowManager.getFocusedWindow()
    windowManager.navigateTo(url, tabId, win?.id)
  })

  ipcMain.handle('tab:back', (event, { tabId }) => windowManager.goBack(tabId))
  ipcMain.handle('tab:forward', (event, { tabId }) => windowManager.goForward(tabId))
  ipcMain.handle('tab:reload', (event, { tabId }) => windowManager.reload(tabId))
  ipcMain.handle('tab:stop', (event, { tabId }) => windowManager.stopLoading(tabId))

  // ── Window Controls ───────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => windowManager.getFocusedWindow()?.minimize())
  ipcMain.on('window:maximize', () => {
    const win = windowManager.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize(); else win?.maximize()
  })
  ipcMain.on('window:close', () => windowManager.getFocusedWindow()?.close())
  ipcMain.on('window:fullscreen', () => {
    const win = windowManager.getFocusedWindow()
    win?.setFullScreen(!win.isFullScreen())
  })
  ipcMain.handle('window:is-maximized', () => windowManager.getFocusedWindow()?.isMaximized() ?? false)
  ipcMain.handle('window:new', (_, opts) => { windowManager.createWindow(opts); return true })

  // ── History ───────────────────────────────────────────────────────────────
  ipcMain.handle('history:add', (_, { url, title, favicon }) => HistoryDB.add(url, title, favicon))
  ipcMain.handle('history:search', (_, { query }) => HistoryDB.search(query))
  ipcMain.handle('history:recent', (_, { limit }) => HistoryDB.getRecent(limit))
  ipcMain.handle('history:clear', () => HistoryDB.clear())
  ipcMain.handle('history:delete', (_, { id }) => HistoryDB.delete(id))

  // ── Bookmarks ─────────────────────────────────────────────────────────────
  ipcMain.handle('bookmarks:add', (_, { url, title, folderId }) =>
    BookmarksDB.add(url, title, folderId))
  ipcMain.handle('bookmarks:get', () => BookmarksDB.getAll())
  ipcMain.handle('bookmarks:delete', (_, { id }) => BookmarksDB.delete(id))
  ipcMain.handle('bookmarks:search', (_, { query }) => BookmarksDB.search(query))
  ipcMain.handle('bookmarks:exists', (_, { url }) => BookmarksDB.exists(url))

  // ── Password Manager ──────────────────────────────────────────────────────
  ipcMain.handle('passwords:save', (_, { domain, username, password }) => {
    const encrypted = encrypt(password)
    return PasswordDB.save(domain, username, encrypted)
  })
  ipcMain.handle('passwords:get', (_, { domain }) => {
    const rows = PasswordDB.getForDomain(domain) as any[]
    return rows.map(r => ({ ...r, password: decrypt(r.password) }))
  })
  ipcMain.handle('passwords:all', () => PasswordDB.getAll())
  ipcMain.handle('passwords:delete', (_, { id }) => PasswordDB.delete(id))
  ipcMain.handle('passwords:generate', () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    const len = 20
    const arr = new Uint32Array(len)
    crypto.getRandomValues(arr as any)
    return Array.from(arr).map(v => chars[v % chars.length]).join('')
  })

  // ── Settings ──────────────────────────────────────────────────────────────
  ipcMain.handle('settings:get', (_, { key }) => SettingsDB.get(key))
  ipcMain.handle('settings:set', (_, { key, value }) => {
    SettingsDB.set(key, value)
    // Apply settings live
    if (key === 'ad_blocker') AdBlocker.setEnabled(value === 'true')
    if (key === 'tracker_blocker') AdBlocker.setTrackersEnabled(value === 'true')
    if (key === 'https_only') SecurityManager.setHttpsOnly(value === 'true')
    if (key === 'anti_fingerprinting') PrivacyManager.setFingerprintingProtection(value === 'true')
    if (key === 'theme') nativeTheme.themeSource = value as any
  })
  ipcMain.handle('settings:all', () => SettingsDB.getAll())

  // ── Downloads ─────────────────────────────────────────────────────────────
  ipcMain.handle('downloads:list', () => DownloadsDB.getAll())
  ipcMain.handle('downloads:open', (_, { path: filePath }) => shell.openPath(filePath))
  ipcMain.handle('downloads:show', (_, { path: filePath }) => shell.showItemInFolder(filePath))
  ipcMain.handle('downloads:delete', (_, { id }) => DownloadsDB.delete(id))

  ipcMain.handle('downloads:save-dialog', async () => {
    const win = windowManager.getFocusedWindow()
    const result = await dialog.showSaveDialog(win!, {
      title: 'Save File',
      defaultPath: app.getPath('downloads'),
    })
    return result.filePath
  })

  // ── Security Stats ────────────────────────────────────────────────────────
  ipcMain.handle('security:stats', () => AdBlocker.getStats())
  ipcMain.handle('security:reset-stats', () => AdBlocker.resetStats())
  ipcMain.handle('security:cosmetic-css', () => AdBlocker.getCosmeticCSS())
  ipcMain.handle('security:anti-fp-script', () => PrivacyManager.getInjectionScript())

  // ── Screenshots ───────────────────────────────────────────────────────────
  ipcMain.handle('screenshot:capture', async (_, { tabId, fullPage }) => {
    // Capture via BrowserView
    const win = windowManager.getFocusedWindow()
    if (!win) return null
    const image = await win.webContents.capturePage()
    const pngBuffer = image.toPNG()
    const savePath = path.join(
      app.getPath('pictures'),
      `RihadX-${Date.now()}.png`
    )
    fs.writeFileSync(savePath, pngBuffer)
    return savePath
  })

  // ── Clipboard ─────────────────────────────────────────────────────────────
  ipcMain.handle('clipboard:write', (_, { text }) => clipboard.writeText(text))
  ipcMain.handle('clipboard:read', () => clipboard.readText())

  // ── External Links ────────────────────────────────────────────────────────
  ipcMain.handle('shell:open-external', (_, { url }) => shell.openExternal(url))
  ipcMain.handle('shell:open-path', (_, { path: p }) => shell.openPath(p))

  // ── App Info ──────────────────────────────────────────────────────────────
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:platform', () => process.platform)
  ipcMain.handle('app:path', (_, { name }) => app.getPath(name as any))
  ipcMain.handle('app:memory-usage', () => process.memoryUsage())

  // ── Clear Browsing Data ───────────────────────────────────────────────────
  ipcMain.handle('privacy:clear-data', async (_, { types }) => {
    const storages: any[] = []
    if (types.includes('cookies'))    storages.push('cookies')
    if (types.includes('cache'))      storages.push('cachestorage')
    if (types.includes('localStorage')) storages.push('localstorage')
    if (types.includes('sessionStorage')) storages.push('sessionstorage')
    if (types.includes('indexedDB')) storages.push('indexdb')

    await session.defaultSession.clearStorageData({ storages })
    if (types.includes('history')) HistoryDB.clear()
    return true
  })

  // ── Theme ─────────────────────────────────────────────────────────────────
  ipcMain.handle('theme:get', () => nativeTheme.themeSource)
  ipcMain.handle('theme:set', (_, { theme }) => { nativeTheme.themeSource = theme })
  ipcMain.handle('theme:is-dark', () => nativeTheme.shouldUseDarkColors)

  // ── Auto-update ───────────────────────────────────────────────────────────
  ipcMain.handle('update:install', () => {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.quitAndInstall()
  })

  // ── Find in Page ──────────────────────────────────────────────────────────
  ipcMain.handle('find:start', (_, { text, tabId }) => {
    // Find-in-page via BrowserView
    return { matches: 0, activeMatch: 0 }
  })
  ipcMain.handle('find:stop', (_, { tabId }) => { /* stop find */ })

  // ── Zoom ──────────────────────────────────────────────────────────────────
  ipcMain.handle('zoom:get', () => windowManager.getFocusedWindow()?.webContents.getZoomFactor() ?? 1)
  ipcMain.handle('zoom:set', (_, { factor }) => {
    windowManager.getFocusedWindow()?.webContents.setZoomFactor(factor)
  })
  ipcMain.handle('zoom:reset', () => {
    windowManager.getFocusedWindow()?.webContents.setZoomFactor(1)
  })
}
