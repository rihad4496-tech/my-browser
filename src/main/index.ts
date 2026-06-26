import { app, BrowserWindow, session, ipcMain, Menu, dialog, shell, protocol, nativeTheme } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import { setupSecurityHandlers } from './security/SecurityManager'
import { setupDatabase } from './database/DatabaseManager'
import { setupAdBlocker } from './security/AdBlocker'
import { setupIpcHandlers } from './ipc/IpcHandlers'
import { WindowManager } from './browser/WindowManager'
import { createApplicationMenu } from './browser/AppMenu'
import { PrivacyManager } from './security/PrivacyManager'

const isDev = process.env.NODE_ENV === 'development'
const RENDERER_URL = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../renderer/index.html')}`

// ─── Security: Prevent protocol spoofing ───────────────────────────────────
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WaylandWindowDecorations')
app.commandLine.appendSwitch('disable-http-cache', 'false')
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512')

// ─── Single Instance Lock ──────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

let windowManager: WindowManager

// ─── App Ready ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Initialize core systems
  await setupDatabase()
  await setupAdBlocker()

  // Create window manager
  windowManager = new WindowManager(RENDERER_URL, isDev)

  // Setup security
  setupSecurityHandlers()
  PrivacyManager.initialize()

  // Setup IPC
  setupIpcHandlers(windowManager)

  // Create application menu
  const menu = createApplicationMenu(windowManager)
  Menu.setApplicationMenu(menu)

  // Setup auto updater
  if (!isDev) {
    setupAutoUpdater()
  }

  // Create initial window
  windowManager.createWindow()

  // macOS dock re-open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow()
    }
  })

  // Handle second instance
  app.on('second-instance', (_, commandLine) => {
    const win = windowManager.getFocusedWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
      const url = commandLine.find(arg => arg.startsWith('http') || arg.startsWith('rihadx://'))
      if (url) windowManager.navigateTo(url)
    }
  })
})

// ─── Auto Updater ─────────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-available', (info) => {
    const win = windowManager.getFocusedWindow()
    win?.webContents.send('update:available', info)
  })

  autoUpdater.on('update-downloaded', (info) => {
    const win = windowManager.getFocusedWindow()
    win?.webContents.send('update:downloaded', info)
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
  })

  // Check every 4 hours
  setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 4 * 60 * 60 * 1000)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  // Cleanup sessions
  await session.defaultSession.clearStorageData({ storages: ['cookies'] }).catch(() => {})
})
