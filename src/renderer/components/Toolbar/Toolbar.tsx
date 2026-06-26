import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, RotateCw, X, Shield, ShieldOff,
  Lock, Unlock, Star, StarOff, Download, BookOpen,
  SplitSquareHorizontal, Bot, Camera, Columns,
  Bookmark, BookmarkCheck, Globe, Search, Loader2
} from 'lucide-react'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'
import { motion, AnimatePresence } from 'framer-motion'
import OmniBar from './OmniBar'
import clsx from 'clsx'

export default function Toolbar() {
  const activeTab = useActiveTab()
  const {
    tabs, settings, stats,
    setSidebarPanel, sidebarPanel,
    setModalOpen, modalOpen,
    setSplitScreen, splitScreenActive,
    setReaderMode, readerModeActive,
  } = useBrowserStore()

  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showScreenshotFlash, setShowScreenshotFlash] = useState(false)

  // Check bookmark status on URL change
  useEffect(() => {
    if (!activeTab?.url || !window.rihadx) return
    window.rihadx.bookmarks.exists(activeTab.url).then(setIsBookmarked)
  }, [activeTab?.url])

  const isSecure = activeTab?.url?.startsWith('https://') || activeTab?.url?.startsWith('rihadx://')

  async function handleBookmark() {
    if (!activeTab || !window.rihadx) return
    if (isBookmarked) {
      // Would need to get bookmark id first in a real impl
      setIsBookmarked(false)
    } else {
      await window.rihadx.bookmarks.add(activeTab.url, activeTab.title || activeTab.url)
      setIsBookmarked(true)
    }
  }

  async function handleScreenshot() {
    if (!window.rihadx) return
    const path = await window.rihadx.screenshot.capture()
    if (path) {
      setShowScreenshotFlash(true)
      setTimeout(() => setShowScreenshotFlash(false), 600)
    }
  }

  return (
    <div className="flex items-center h-11 px-2 gap-1.5 bg-surface-900/80 border-b border-surface-800/60 flex-shrink-0 relative">
      {/* Screenshot flash overlay */}
      <AnimatePresence>
        {showScreenshotFlash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-0.5">
        <NavButton
          icon={<ChevronLeft size={16} />}
          label="Back"
          disabled={!activeTab?.canGoBack}
          onClick={() => activeTab && window.rihadx?.tab.back(activeTab.id)}
        />
        <NavButton
          icon={<ChevronRight size={16} />}
          label="Forward"
          disabled={!activeTab?.canGoForward}
          onClick={() => activeTab && window.rihadx?.tab.forward(activeTab.id)}
        />
        <NavButton
          icon={activeTab?.isLoading
            ? <X size={14} />
            : <RotateCw size={14} />
          }
          label={activeTab?.isLoading ? 'Stop' : 'Reload'}
          onClick={() => {
            if (!activeTab) return
            if (activeTab.isLoading) window.rihadx?.tab.stop(activeTab.id)
            else window.rihadx?.tab.reload(activeTab.id)
          }}
        />
      </div>

      {/* Security Badge */}
      <button
        className={clsx(
          'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
          isSecure
            ? 'text-emerald-400 hover:bg-emerald-500/10'
            : 'text-amber-400 hover:bg-amber-500/10'
        )}
        title={isSecure ? 'Connection is secure' : 'Connection is not secure'}
      >
        {isSecure ? <Lock size={13} /> : <Unlock size={13} />}
      </button>

      {/* Omni Bar (address + search) */}
      <OmniBar />

      {/* Right Actions */}
      <div className="flex items-center gap-0.5">
        {/* Bookmark */}
        <ToolbarButton
          icon={isBookmarked ? <BookmarkCheck size={15} className="text-brand-400" /> : <Bookmark size={15} />}
          label={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
          onClick={handleBookmark}
          active={isBookmarked}
        />

        {/* Reader Mode */}
        <ToolbarButton
          icon={<BookOpen size={15} />}
          label="Reader Mode"
          onClick={() => setReaderMode(!readerModeActive)}
          active={readerModeActive}
        />

        {/* Split Screen */}
        <ToolbarButton
          icon={<Columns size={15} />}
          label="Split Screen"
          onClick={() => setSplitScreen(!splitScreenActive)}
          active={splitScreenActive}
        />

        {/* Screenshot */}
        <ToolbarButton
          icon={<Camera size={15} />}
          label="Screenshot"
          onClick={handleScreenshot}
        />

        {/* AI Assistant */}
        <ToolbarButton
          icon={<Bot size={15} />}
          label="AI Assistant"
          onClick={() => setModalOpen(modalOpen === 'ai-assistant' ? null : 'ai-assistant')}
          active={modalOpen === 'ai-assistant'}
        />

        {/* Downloads */}
        <ToolbarButton
          icon={<Download size={15} />}
          label="Downloads"
          onClick={() => setSidebarPanel(sidebarPanel === 'downloads' ? null : 'downloads')}
          active={sidebarPanel === 'downloads'}
        />

        {/* Security Shield */}
        <button
          onClick={() => setSidebarPanel(sidebarPanel === null ? 'history' : null)}
          className={clsx(
            'flex-shrink-0 flex items-center gap-1 px-2 h-7 rounded-lg transition-all text-xs font-medium',
            stats.adsBlocked > 0 || stats.trackersBlocked > 0
              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shield-active'
              : 'text-surface-500 hover:bg-surface-800'
          )}
          title="Security Status"
        >
          <Shield size={13} />
          {(stats.adsBlocked + stats.trackersBlocked) > 0 && (
            <span>{(stats.adsBlocked + stats.trackersBlocked).toLocaleString()}</span>
          )}
        </button>
      </div>
    </div>
  )
}

function NavButton({ icon, label, disabled, onClick }: {
  icon: React.ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={clsx(
        'w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90',
        disabled
          ? 'text-surface-700 cursor-not-allowed'
          : 'text-surface-400 hover:text-white hover:bg-surface-700 cursor-pointer'
      )}
    >
      {icon}
    </button>
  )
}

function ToolbarButton({ icon, label, onClick, active }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        'w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90',
        active
          ? 'text-brand-400 bg-brand-500/10'
          : 'text-surface-400 hover:text-white hover:bg-surface-700'
      )}
    >
      {icon}
    </button>
  )
}
