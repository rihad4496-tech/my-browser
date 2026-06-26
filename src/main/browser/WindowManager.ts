import { BrowserWindow, BrowserView, session, nativeTheme, screen } from 'electron'
import path from 'path'

export interface TabInfo {
  id: string
  title: string
  url: string
  favicon: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  isIncognito: boolean
  groupId?: string
  isPinned: boolean
  isAudioMuted: boolean
}

export class WindowManager {
  private windows: Map<number, BrowserWindow> = new Map()
  private tabViews: Map<string, BrowserView> = new Map()
  private activeTabId: Map<number, string> = new Map()
  private rendererUrl: string
  private isDev: boolean

  constructor(rendererUrl: string, isDev: boolean) {
    this.rendererUrl = rendererUrl
    this.isDev = isDev
  }

  createWindow(options: { incognito?: boolean } = {}): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    const win = new BrowserWindow({
      width: Math.min(1400, width),
      height: Math.min(900, height),
      minWidth: 800,
      minHeight: 600,
      frame: false,           // Custom title bar
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 16, y: 16 },
      backgroundColor: '#0f172a',
      show: false,
      icon: path.join(__dirname, '../../assets/icons/icon.png'),
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        spellcheck: true,
        partition: options.incognito ? 'incognito' : undefined,
      },
    })

    // Apply security headers to shell
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
          ],
          'X-Frame-Options': ['SAMEORIGIN'],
          'X-Content-Type-Options': ['nosniff'],
          'Referrer-Policy': ['strict-origin-when-cross-origin'],
        }
      })
    })

    win.loadURL(this.rendererUrl)

    win.once('ready-to-show', () => {
      win.show()
      if (this.isDev) win.webContents.openDevTools({ mode: 'detach' })
    })

    win.on('closed', () => {
      this.windows.delete(win.id)
      this.activeTabId.delete(win.id)
    })

    this.windows.set(win.id, win)
    return win
  }

  createTabView(windowId: number, url: string, incognito = false): string {
    const win = this.windows.get(windowId)
    if (!win) throw new Error('Window not found')

    const tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const partition = incognito ? `persist:incognito-${windowId}` : `persist:default`

    const view = new BrowserView({
      webPreferences: {
        preload: path.join(__dirname, '../preload/webview.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        partition,
        allowRunningInsecureContent: false,
        webSecurity: true,
        spellcheck: true,
      }
    })

    this.tabViews.set(tabId, view)
    this.attachViewEvents(view, tabId, windowId, win)
    this.setActiveTab(windowId, tabId, win, view)

    const targetUrl = this.normalizeUrl(url)
    view.webContents.loadURL(targetUrl)

    return tabId
  }

  private attachViewEvents(view: BrowserView, tabId: string, windowId: number, win: BrowserWindow) {
    const wc = view.webContents

    wc.on('page-title-updated', (_, title) => {
      win.webContents.send('tab:title-updated', { tabId, title })
    })

    wc.on('page-favicon-updated', (_, favicons) => {
      win.webContents.send('tab:favicon-updated', { tabId, favicon: favicons[0] || '' })
    })

    wc.on('did-start-loading', () => {
      win.webContents.send('tab:loading', { tabId, isLoading: true })
    })

    wc.on('did-stop-loading', () => {
      win.webContents.send('tab:loading', {
        tabId,
        isLoading: false,
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward(),
        url: wc.getURL(),
      })
    })

    wc.on('did-navigate', (_, url) => {
      win.webContents.send('tab:navigated', {
        tabId,
        url,
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward(),
      })
    })

    wc.on('did-fail-load', (_, errorCode, errorDescription, url) => {
      win.webContents.send('tab:load-error', { tabId, errorCode, errorDescription, url })
    })

    wc.on('certificate-error', (event, url, error, certificate, callback) => {
      event.preventDefault()
      win.webContents.send('tab:cert-error', { tabId, url, error })
      callback(false)
    })

    wc.on('new-window', (event, url) => {
      event.preventDefault()
      this.createTabView(windowId, url)
    })
  }

  setActiveTab(windowId: number, tabId: string, win?: BrowserWindow, view?: BrowserView) {
    const w = win || this.windows.get(windowId)
    if (!w) return

    // Remove current view
    const currentTabId = this.activeTabId.get(windowId)
    if (currentTabId) {
      const currentView = this.tabViews.get(currentTabId)
      if (currentView) w.removeBrowserView(currentView)
    }

    // Add new view
    const v = view || this.tabViews.get(tabId)
    if (!v) return

    w.addBrowserView(v)
    this.activeTabId.set(windowId, tabId)

    // Position the view (below toolbar)
    const bounds = w.getBounds()
    v.setBounds({
      x: 0,
      y: 120, // Height of toolbar + tabs
      width: bounds.width,
      height: bounds.height - 120,
    })
    v.setAutoResize({ width: true, height: true })
  }

  closeTab(windowId: number, tabId: string) {
    const view = this.tabViews.get(tabId)
    const win = this.windows.get(windowId)
    if (view && win) {
      win.removeBrowserView(view)
      ;(view.webContents as any).destroy()
      this.tabViews.delete(tabId)
    }
  }

  navigateTo(url: string, tabId?: string, windowId?: number) {
    const targetTabId = tabId || (windowId ? this.activeTabId.get(windowId) : undefined)
    if (!targetTabId) return
    const view = this.tabViews.get(targetTabId)
    if (view) view.webContents.loadURL(this.normalizeUrl(url))
  }

  goBack(tabId: string) {
    const view = this.tabViews.get(tabId)
    if (view?.webContents.canGoBack()) view.webContents.goBack()
  }

  goForward(tabId: string) {
    const view = this.tabViews.get(tabId)
    if (view?.webContents.canGoForward()) view.webContents.goForward()
  }

  reload(tabId: string) {
    this.tabViews.get(tabId)?.webContents.reload()
  }

  stopLoading(tabId: string) {
    this.tabViews.get(tabId)?.webContents.stop()
  }

  getFocusedWindow(): BrowserWindow | null {
    return BrowserWindow.getFocusedWindow()
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values())
  }

  private normalizeUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('rihadx://')) {
      return url
    }
    if (url.includes('.') && !url.includes(' ')) {
      return `https://${url}`
    }
    return `https://search.rihadx.com/search?q=${encodeURIComponent(url)}`
  }
}
