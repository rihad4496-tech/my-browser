import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2, Shield, Wifi, WifiOff } from 'lucide-react'
import { useBrowserStore } from '../../store/browserStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function TitleBar() {
  const { stats, vpnConnected, updateAvailable, setSettingsPage, settings } = useBrowserStore()
  const [isMaximized, setIsMaximized] = useState(false)
  const isMac = navigator.userAgent.includes('Mac')

  useEffect(() => {
    window.rihadx?.window.isMaximized().then(setIsMaximized)
  }, [])

  const totalBlocked = stats.adsBlocked + stats.trackersBlocked

  return (
    <div
      className="titlebar-drag flex items-center h-10 bg-surface-950 border-b border-surface-800/60 flex-shrink-0 relative z-50"
      style={{ minHeight: 40 }}
    >
      {/* macOS traffic lights space */}
      {isMac && <div className="w-20 flex-shrink-0" />}

      {/* App Logo + Name */}
      <div className="no-drag flex items-center gap-2 px-3">
        <div className="w-5 h-5 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-accent-cyan opacity-90" />
          <div className="absolute inset-1 rounded-full bg-surface-950/60" />
          <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-brand-400 to-accent-cyan" />
        </div>
        <span className="text-xs font-semibold text-surface-300 tracking-wide">RihadX</span>
      </div>

      {/* Center spacer - draggable */}
      <div className="flex-1" />

      {/* Security Indicators */}
      <div className="no-drag flex items-center gap-1 px-2">
        {/* Blocks counter */}
        {totalBlocked > 0 && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setSettingsPage('privacy')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            title="Threats blocked"
          >
            <Shield size={10} className="text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-medium">
              {totalBlocked.toLocaleString()}
            </span>
          </motion.button>
        )}

        {/* VPN indicator */}
        {vpnConnected && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10">
            <Wifi size={10} className="text-brand-400" />
            <span className="text-brand-400 text-[10px] font-medium">VPN</span>
          </div>
        )}

        {/* Update dot */}
        {updateAvailable && (
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Update available" />
        )}

        {/* Settings */}
        <button
          onClick={() => setSettingsPage('general')}
          className="no-drag btn-icon w-6 h-6"
          title="Settings"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 10.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0-1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6.348-5.031a.75.75 0 0 1 .386.91l-.877 2.566a.75.75 0 0 1-.386.455l-.877.438a5.503 5.503 0 0 1 0 .324l.877.438a.75.75 0 0 1 .386.455l.877 2.566a.75.75 0 0 1-.386.91l-2.5 1a.75.75 0 0 1-.91-.386l-.438-.877a5.503 5.503 0 0 1-.324 0l-.438.877a.75.75 0 0 1-.91.386l-2.5-1a.75.75 0 0 1-.386-.91l.877-2.566a.75.75 0 0 1 .386-.455l.877-.438a5.503 5.503 0 0 1 0-.324l-.877-.438a.75.75 0 0 1-.386-.455L1.266 4.47a.75.75 0 0 1 .386-.91l2.5-1a.75.75 0 0 1 .91.386l.438.877c.107-.01.215-.016.324-.016s.217.005.324.016l.438-.877a.75.75 0 0 1 .91-.386l2.5 1z"/>
          </svg>
        </button>
      </div>

      {/* Windows/Linux window controls */}
      {!isMac && (
        <div className="no-drag flex items-center h-full">
          <button
            onClick={() => window.rihadx?.window.minimize()}
            className="flex items-center justify-center w-12 h-full text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={async () => {
              await window.rihadx?.window.maximize()
              setIsMaximized(!isMaximized)
            }}
            className="flex items-center justify-center w-12 h-full text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
          >
            {isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
          </button>
          <button
            onClick={() => window.rihadx?.window.close()}
            className="flex items-center justify-center w-12 h-full text-surface-400 hover:text-white hover:bg-rose-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
