import React, { useState } from 'react'
import { X, Plus, ChevronLeft, ChevronRight, Pin, Volume2, VolumeX } from 'lucide-react'
import { Tab } from '@shared/types'
import { useBrowserStore } from '../../store/browserStore'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

interface Props {
  tabs: Tab[]
  activeTabId: string | null
  onNewTab: () => void
  onCloseTab: (id: string) => void
  onActivateTab: (id: string) => void
}

export default function VerticalTabBar({ tabs, activeTabId, onNewTab, onCloseTab, onActivateTab }: Props) {
  const { pinTab, muteTab } = useBrowserStore()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.div
      animate={{ width: collapsed ? 48 : 220 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-full bg-surface-950 border-r border-surface-800/60 flex-shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-surface-800/40">
        {!collapsed && (
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider px-1">
            Tabs ({tabs.length})
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-icon w-6 h-6 ml-auto"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* New Tab Button */}
      <div className="px-2 py-1.5">
        <button
          onClick={onNewTab}
          className={clsx(
            'flex items-center gap-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-all w-full',
            collapsed ? 'justify-center p-2' : 'px-3 py-2'
          )}
          title="New Tab"
        >
          <Plus size={14} />
          {!collapsed && <span className="text-xs font-medium">New Tab</span>}
        </button>
      </div>

      <div className="divider mx-2" />

      {/* Tab List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-panel px-1.5 py-1 space-y-0.5">
        <AnimatePresence initial={false}>
          {tabs.map(tab => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <VerticalTabItem
                tab={tab}
                isActive={tab.id === activeTabId}
                collapsed={collapsed}
                onActivate={() => onActivateTab(tab.id)}
                onClose={() => onCloseTab(tab.id)}
                onPin={() => pinTab(tab.id)}
                onMute={() => muteTab(tab.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function VerticalTabItem({ tab, isActive, collapsed, onActivate, onClose, onPin, onMute }: any) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onActivate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={clsx(
        'relative flex items-center rounded-xl cursor-pointer select-none transition-all duration-150 group',
        collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-2',
        isActive
          ? 'bg-brand-950 border border-brand-500/25 text-white'
          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/70'
      )}
      title={collapsed ? (tab.title || tab.url) : undefined}
    >
      {/* Active accent */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-brand-500" />
      )}

      {/* Favicon / Spinner */}
      <div className="flex-shrink-0 w-4 h-4 relative">
        {tab.isLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
        ) : tab.favicon ? (
          <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm" />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-surface-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-surface-400" />
          </div>
        )}
      </div>

      {/* Title + Controls */}
      {!collapsed && (
        <>
          <span className="flex-1 text-xs truncate font-medium">
            {tab.title || 'New Tab'}
          </span>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {tab.isPinned && <Pin size={9} className="text-brand-400" />}
            {tab.isAudioMuted && <VolumeX size={9} className="text-surface-500" />}
            <button
              onClick={e => { e.stopPropagation(); onClose() }}
              className="w-4 h-4 rounded flex items-center justify-center hover:bg-surface-600 text-surface-400 hover:text-white transition-colors"
            >
              <X size={9} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
