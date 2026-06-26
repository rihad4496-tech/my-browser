import { create } from 'zustand'
import { Tab, TabGroup, BrowserSettings, SecurityStats, Download } from '@shared/types'

interface BrowserState {
  // Tabs
  tabs: Tab[]
  activeTabId: string | null
  tabGroups: TabGroup[]
  tabLayout: 'horizontal' | 'vertical'

  // UI
  sidebarOpen: boolean
  sidebarPanel: 'bookmarks' | 'history' | 'downloads' | 'extensions' | 'passwords' | null
  modalOpen: string | null
  findBarOpen: boolean
  findText: string
  settingsPage: string | null
  readerModeActive: boolean
  splitScreenActive: boolean
  splitTabId: string | null

  // Security
  stats: SecurityStats
  vpnConnected: boolean
  httpsOnly: boolean
  adBlockEnabled: boolean
  trackerBlockEnabled: boolean

  // Downloads
  downloads: Download[]
  downloadsOpen: boolean

  // Settings
  settings: Partial<BrowserSettings>

  // Update
  updateAvailable: boolean
  updateInfo: any

  // Actions
  addTab: (tab: Tab) => void
  updateTab: (id: string, data: Partial<Tab>) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  setTabLayout: (layout: 'horizontal' | 'vertical') => void
  moveTab: (fromId: string, toId: string) => void
  pinTab: (id: string) => void
  muteTab: (id: string) => void
  assignTabToGroup: (tabId: string, groupId: string) => void

  setSidebarOpen: (open: boolean) => void
  setSidebarPanel: (panel: BrowserState['sidebarPanel']) => void
  setModalOpen: (modal: string | null) => void
  setFindBarOpen: (open: boolean) => void
  setFindText: (text: string) => void
  setSettingsPage: (page: string | null) => void
  setReaderMode: (active: boolean) => void
  setSplitScreen: (active: boolean, splitTabId?: string) => void

  setStats: (stats: SecurityStats) => void
  setVpnConnected: (connected: boolean) => void

  setDownloads: (downloads: Download[]) => void
  updateDownload: (id: number, data: Partial<Download>) => void

  setSettings: (settings: Partial<BrowserSettings>) => void
  setSetting: (key: keyof BrowserSettings, value: any) => void

  setUpdateAvailable: (available: boolean, info?: any) => void
}

export const useBrowserStore = create<BrowserState>((set, get) => ({
  // Initial state
  tabs: [],
  activeTabId: null,
  tabGroups: [],
  tabLayout: 'horizontal',

  sidebarOpen: false,
  sidebarPanel: null,
  modalOpen: null,
  findBarOpen: false,
  findText: '',
  settingsPage: null,
  readerModeActive: false,
  splitScreenActive: false,
  splitTabId: null,

  stats: { adsBlocked: 0, trackersBlocked: 0, bandwidthSaved: 0 },
  vpnConnected: false,
  httpsOnly: true,
  adBlockEnabled: true,
  trackerBlockEnabled: true,

  downloads: [],
  downloadsOpen: false,

  settings: {},
  updateAvailable: false,
  updateInfo: null,

  // Tab actions
  addTab: (tab) => set(s => ({ tabs: [...s.tabs, tab], activeTabId: tab.id })),

  updateTab: (id, data) => set(s => ({
    tabs: s.tabs.map(t => t.id === id ? { ...t, ...data } : t)
  })),

  removeTab: (id) => set(s => {
    const tabs = s.tabs.filter(t => t.id !== id)
    let activeTabId = s.activeTabId
    if (activeTabId === id) {
      const idx = s.tabs.findIndex(t => t.id === id)
      activeTabId = tabs[idx]?.id ?? tabs[idx - 1]?.id ?? tabs[0]?.id ?? null
    }
    return { tabs, activeTabId }
  }),

  setActiveTab: (id) => set({ activeTabId: id }),
  setTabLayout: (layout) => set({ tabLayout: layout }),

  moveTab: (fromId, toId) => set(s => {
    const tabs = [...s.tabs]
    const fromIdx = tabs.findIndex(t => t.id === fromId)
    const toIdx   = tabs.findIndex(t => t.id === toId)
    if (fromIdx === -1 || toIdx === -1) return {}
    const [moved] = tabs.splice(fromIdx, 1)
    tabs.splice(toIdx, 0, moved)
    return { tabs }
  }),

  pinTab: (id) => set(s => ({
    tabs: s.tabs.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t)
  })),

  muteTab: (id) => set(s => ({
    tabs: s.tabs.map(t => t.id === id ? { ...t, isAudioMuted: !t.isAudioMuted } : t)
  })),

  assignTabToGroup: (tabId, groupId) => set(s => ({
    tabs: s.tabs.map(t => t.id === tabId ? { ...t, groupId } : t)
  })),

  // UI actions
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarPanel: (panel) => set(s => ({
    sidebarPanel: panel,
    sidebarOpen: panel !== null || s.sidebarOpen,
  })),
  setModalOpen: (modal) => set({ modalOpen: modal }),
  setFindBarOpen: (open) => set({ findBarOpen: open, findText: open ? get().findText : '' }),
  setFindText: (text) => set({ findText: text }),
  setSettingsPage: (page) => set({ settingsPage: page }),
  setReaderMode: (active) => set({ readerModeActive: active }),
  setSplitScreen: (active, splitTabId) => set({ splitScreenActive: active, splitTabId: splitTabId ?? null }),

  // Security
  setStats: (stats) => set({ stats }),
  setVpnConnected: (connected) => set({ vpnConnected: connected }),

  // Downloads
  setDownloads: (downloads) => set({ downloads }),
  updateDownload: (id, data) => set(s => ({
    downloads: s.downloads.map(d => d.id === id ? { ...d, ...data } : d)
  })),

  // Settings
  setSettings: (settings) => set(s => ({ settings: { ...s.settings, ...settings } })),
  setSetting: (key, value) => set(s => ({ settings: { ...s.settings, [key]: value } })),

  // Update
  setUpdateAvailable: (available, info) => set({ updateAvailable: available, updateInfo: info }),
}))

// Selectors
export const useActiveTab = () => {
  const { tabs, activeTabId } = useBrowserStore()
  return tabs.find(t => t.id === activeTabId) ?? null
}

export const usePinnedTabs = () => useBrowserStore(s => s.tabs.filter(t => t.isPinned))
export const useUnpinnedTabs = () => useBrowserStore(s => s.tabs.filter(t => !t.isPinned))
