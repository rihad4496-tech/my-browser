import { contextBridge, ipcRenderer } from 'electron'

// ─── Expose safe API to renderer ──────────────────────────────────────────
contextBridge.exposeInMainWorld('rihadx', {

  // Tab Management
  tab: {
    create:   (opts: { url?: string; incognito?: boolean }) => ipcRenderer.invoke('tab:create', opts),
    close:    (tabId: string) => ipcRenderer.invoke('tab:close', { tabId }),
    activate: (tabId: string) => ipcRenderer.invoke('tab:activate', { tabId }),
    navigate: (url: string, tabId?: string) => ipcRenderer.invoke('tab:navigate', { url, tabId }),
    back:     (tabId: string) => ipcRenderer.invoke('tab:back', { tabId }),
    forward:  (tabId: string) => ipcRenderer.invoke('tab:forward', { tabId }),
    reload:   (tabId: string) => ipcRenderer.invoke('tab:reload', { tabId }),
    stop:     (tabId: string) => ipcRenderer.invoke('tab:stop', { tabId }),
    onUpdate: (cb: (data: any) => void) => {
      const events = [
        'tab:title-updated', 'tab:favicon-updated', 'tab:loading',
        'tab:navigated', 'tab:load-error', 'tab:cert-error',
      ]
      events.forEach(e => ipcRenderer.on(e, (_, data) => cb({ event: e, ...data })))
      return () => events.forEach(e => ipcRenderer.removeAllListeners(e))
    },
  },

  // Window Controls
  window: {
    minimize:    () => ipcRenderer.send('window:minimize'),
    maximize:    () => ipcRenderer.send('window:maximize'),
    close:       () => ipcRenderer.send('window:close'),
    fullscreen:  () => ipcRenderer.send('window:fullscreen'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    newWindow:   (opts?: { incognito?: boolean }) => ipcRenderer.invoke('window:new', opts),
  },

  // History
  history: {
    add:    (url: string, title: string, favicon?: string) => ipcRenderer.invoke('history:add', { url, title, favicon }),
    search: (query: string) => ipcRenderer.invoke('history:search', { query }),
    recent: (limit?: number) => ipcRenderer.invoke('history:recent', { limit }),
    clear:  () => ipcRenderer.invoke('history:clear'),
    delete: (id: number) => ipcRenderer.invoke('history:delete', { id }),
  },

  // Bookmarks
  bookmarks: {
    add:    (url: string, title: string, folderId?: number) => ipcRenderer.invoke('bookmarks:add', { url, title, folderId }),
    get:    () => ipcRenderer.invoke('bookmarks:get'),
    delete: (id: number) => ipcRenderer.invoke('bookmarks:delete', { id }),
    search: (query: string) => ipcRenderer.invoke('bookmarks:search', { query }),
    exists: (url: string) => ipcRenderer.invoke('bookmarks:exists', { url }),
  },

  // Passwords
  passwords: {
    save:     (domain: string, username: string, password: string) =>
              ipcRenderer.invoke('passwords:save', { domain, username, password }),
    get:      (domain: string) => ipcRenderer.invoke('passwords:get', { domain }),
    all:      () => ipcRenderer.invoke('passwords:all'),
    delete:   (id: number) => ipcRenderer.invoke('passwords:delete', { id }),
    generate: () => ipcRenderer.invoke('passwords:generate'),
  },

  // Settings
  settings: {
    get:  (key: string) => ipcRenderer.invoke('settings:get', { key }),
    set:  (key: string, value: string) => ipcRenderer.invoke('settings:set', { key, value }),
    all:  () => ipcRenderer.invoke('settings:all'),
  },

  // Downloads
  downloads: {
    list:       () => ipcRenderer.invoke('downloads:list'),
    open:       (path: string) => ipcRenderer.invoke('downloads:open', { path }),
    show:       (path: string) => ipcRenderer.invoke('downloads:show', { path }),
    delete:     (id: number) => ipcRenderer.invoke('downloads:delete', { id }),
    saveDialog: () => ipcRenderer.invoke('downloads:save-dialog'),
  },

  // Security & Privacy
  security: {
    stats:           () => ipcRenderer.invoke('security:stats'),
    resetStats:      () => ipcRenderer.invoke('security:reset-stats'),
    cosmeticCss:     () => ipcRenderer.invoke('security:cosmetic-css'),
    antiFpScript:    () => ipcRenderer.invoke('security:anti-fp-script'),
    clearData:       (types: string[]) => ipcRenderer.invoke('privacy:clear-data', { types }),
  },

  // Screenshots
  screenshot: {
    capture: (opts?: { tabId?: string; fullPage?: boolean }) =>
             ipcRenderer.invoke('screenshot:capture', opts || {}),
  },

  // Clipboard
  clipboard: {
    write: (text: string) => ipcRenderer.invoke('clipboard:write', { text }),
    read:  () => ipcRenderer.invoke('clipboard:read'),
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', { url }),
    openPath:     (path: string) => ipcRenderer.invoke('shell:open-path', { path }),
  },

  // App Info
  app: {
    version:     () => ipcRenderer.invoke('app:version'),
    platform:    () => ipcRenderer.invoke('app:platform'),
    getPath:     (name: string) => ipcRenderer.invoke('app:path', { name }),
    memoryUsage: () => ipcRenderer.invoke('app:memory-usage'),
  },

  // Theme
  theme: {
    get:    () => ipcRenderer.invoke('theme:get'),
    set:    (theme: 'dark' | 'light' | 'system') => ipcRenderer.invoke('theme:set', { theme }),
    isDark: () => ipcRenderer.invoke('theme:is-dark'),
  },

  // Zoom
  zoom: {
    get:   () => ipcRenderer.invoke('zoom:get'),
    set:   (factor: number) => ipcRenderer.invoke('zoom:set', { factor }),
    reset: () => ipcRenderer.invoke('zoom:reset'),
  },

  // Menu Events
  onMenu: (event: string, cb: () => void) => {
    ipcRenderer.on(`menu:${event}`, cb)
    return () => ipcRenderer.removeListener(`menu:${event}`, cb)
  },

  // Update Events
  onUpdate: (cb: (data: { event: string; info: any }) => void) => {
    ipcRenderer.on('update:available', (_, info) => cb({ event: 'available', info }))
    ipcRenderer.on('update:downloaded', (_, info) => cb({ event: 'downloaded', info }))
  },
  installUpdate: () => ipcRenderer.invoke('update:install'),
})

// TypeScript types for renderer
export type RihadXAPI = typeof import('./index')
