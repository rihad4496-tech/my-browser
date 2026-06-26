import React, { useEffect, useCallback } from 'react'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'
import TitleBar from '../TabBar/TitleBar'
import TabBar from '../TabBar/TabBar'
import Toolbar from '../Toolbar/Toolbar'
import Sidebar from '../Sidebar/Sidebar'
import VerticalTabBar from '../TabBar/VerticalTabBar'
import StatusBar from '../StatusBar/StatusBar'
import FindBar from '../Browser/FindBar'
import NewTabPage from '../../pages/NewTabPage'
import DownloadsPanel from '../Downloads/DownloadsPanel'
import { AnimatePresence, motion } from 'framer-motion'
import UpdateBanner from './UpdateBanner'
import SplitView from './SplitView'
import PasswordPrompt from '../PasswordManager/PasswordPrompt'
import AIAssistant from '../AIAssistant/AIAssistant'

export default function BrowserLayout() {
  const {
    tabs, activeTabId, tabLayout, sidebarOpen, sidebarPanel,
    findBarOpen, splitScreenActive, downloadsOpen,
    updateAvailable, modalOpen,
    addTab, updateTab, removeTab, setActiveTab,
    setModalOpen,
  } = useBrowserStore()

  const activeTab = useActiveTab()

  // Create first tab on mount
  useEffect(() => {
    if (tabs.length === 0) {
      handleNewTab()
    }
  }, [])

  // Listen for IPC events from menu
  useEffect(() => {
    if (!window.rihadx) return
    const cleanups = [
      window.rihadx.onMenu('new-tab',   () => handleNewTab()),
      window.rihadx.onMenu('close-tab', () => activeTabId && handleCloseTab(activeTabId)),
      window.rihadx.onMenu('reload',    () => activeTabId && window.rihadx.tab.reload(activeTabId)),
      window.rihadx.onMenu('back',      () => activeTabId && window.rihadx.tab.back(activeTabId)),
      window.rihadx.onMenu('forward',   () => activeTabId && window.rihadx.tab.forward(activeTabId)),
      window.rihadx.onMenu('find',      () => useBrowserStore.getState().setFindBarOpen(true)),
      window.rihadx.onMenu('settings',  () => useBrowserStore.getState().setSettingsPage('general')),
      window.rihadx.onMenu('downloads', () => useBrowserStore.getState().setSidebarPanel('downloads')),
      window.rihadx.onMenu('bookmarks', () => useBrowserStore.getState().setSidebarPanel('bookmarks')),
      window.rihadx.onMenu('history',   () => useBrowserStore.getState().setSidebarPanel('history')),
      window.rihadx.onMenu('passwords', () => useBrowserStore.getState().setSidebarPanel('passwords')),
    ]
    return () => cleanups.forEach(fn => typeof fn === 'function' && fn())
  }, [activeTabId])

  // Listen for tab events from main process
  useEffect(() => {
    if (!window.rihadx) return
    const cleanup = window.rihadx.tab.onUpdate((data: any) => {
      const { event, tabId, ...rest } = data
      if (!tabId) return
      switch (event) {
        case 'tab:title-updated':
          updateTab(tabId, { title: rest.title }); break
        case 'tab:favicon-updated':
          updateTab(tabId, { favicon: rest.favicon }); break
        case 'tab:loading':
          updateTab(tabId, {
            isLoading: rest.isLoading,
            canGoBack: rest.canGoBack,
            canGoForward: rest.canGoForward,
            url: rest.url ?? activeTab?.url,
          }); break
        case 'tab:navigated':
          updateTab(tabId, {
            url: rest.url,
            canGoBack: rest.canGoBack,
            canGoForward: rest.canGoForward,
          })
          // Log to history
          if (window.rihadx && rest.url && !rest.url.startsWith('rihadx://')) {
            window.rihadx.history.add(rest.url, '')
          }
          break
        case 'tab:cert-error':
          updateTab(tabId, { error: { code: -1, description: rest.error, url: rest.url } }); break
      }
    })
    return cleanup
  }, [])

  const handleNewTab = useCallback(async () => {
    const homepage = useBrowserStore.getState().settings.homepage || 'rihadx://newtab'
    const tabId = await window.rihadx?.tab.create({ url: homepage })
    if (tabId) {
      addTab({
        id: tabId,
        url: homepage,
        title: 'New Tab',
        favicon: '',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        isIncognito: false,
        isPinned: false,
        isAudioMuted: false,
      })
    } else {
      // Fallback for dev without Electron
      const fakeId = `tab-${Date.now()}`
      addTab({
        id: fakeId,
        url: 'rihadx://newtab',
        title: 'New Tab',
        favicon: '',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        isIncognito: false,
        isPinned: false,
        isAudioMuted: false,
      })
    }
  }, [addTab])

  const handleCloseTab = useCallback((id: string) => {
    window.rihadx?.tab.close(id)
    removeTab(id)
  }, [removeTab])

  const handleActivateTab = useCallback((id: string) => {
    window.rihadx?.tab.activate(id)
    setActiveTab(id)
  }, [setActiveTab])

  const isVertical = tabLayout === 'vertical'

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-surface-950">
      {/* Title Bar (frameless window chrome) */}
      <TitleBar />

      {/* Update Banner */}
      <AnimatePresence>
        {updateAvailable && <UpdateBanner />}
      </AnimatePresence>

      {/* Horizontal Tab Bar */}
      {!isVertical && (
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onNewTab={handleNewTab}
          onCloseTab={handleCloseTab}
          onActivateTab={handleActivateTab}
        />
      )}

      {/* Toolbar (address bar + controls) */}
      <Toolbar />

      {/* Find Bar */}
      <AnimatePresence>
        {findBarOpen && <FindBar />}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Vertical Tab Bar */}
        {isVertical && (
          <VerticalTabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onNewTab={handleNewTab}
            onCloseTab={handleCloseTab}
            onActivateTab={handleActivateTab}
          />
        )}

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && sidebarPanel && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden flex-shrink-0"
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Browser Content */}
        <div className="flex-1 relative overflow-hidden">
          {splitScreenActive ? (
            <SplitView />
          ) : (
            <BrowserContent activeTab={activeTab} />
          )}
        </div>

        {/* AI Assistant */}
        <AnimatePresence>
          {modalOpen === 'ai-assistant' && (
            <motion.div
              key="ai"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden flex-shrink-0 border-l border-surface-800"
            >
              <AIAssistant />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Downloads Panel (bottom sheet) */}
      <AnimatePresence>
        {downloadsOpen && <DownloadsPanel />}
      </AnimatePresence>

      {/* Status Bar */}
      <StatusBar />

      {/* Password Prompt Modal */}
      <AnimatePresence>
        {modalOpen === 'password-prompt' && <PasswordPrompt />}
      </AnimatePresence>
    </div>
  )
}

function BrowserContent({ activeTab }: { activeTab: ReturnType<typeof useActiveTab> }) {
  const { readerModeActive } = useBrowserStore()

  if (!activeTab) {
    return <NewTabPage />
  }

  if (activeTab.url === 'rihadx://newtab' || !activeTab.url) {
    return <NewTabPage />
  }

  // The actual web content is rendered by BrowserView in main process
  // We show an overlay here for loading/error states
  return (
    <div className="w-full h-full relative bg-white">
      {/* Loading indicator */}
      {activeTab.isLoading && (
        <div className="absolute top-0 left-0 right-0 z-10 loading-bar" />
      )}

      {/* Error page */}
      {activeTab.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-950 z-20">
          <div className="text-center max-w-md p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Connection Error</h1>
            <p className="text-surface-400 mb-2">{activeTab.error.description}</p>
            <p className="text-surface-500 text-sm mb-6 break-all">{activeTab.error.url}</p>
            <button
              onClick={() => window.rihadx?.tab.reload(activeTab.id)}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
