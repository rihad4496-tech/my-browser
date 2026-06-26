import React, { useRef, useState } from 'react'
import { X, Plus, Volume2, VolumeX, Pin, Lock } from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Tab } from '@shared/types'
import { useBrowserStore } from '../../store/browserStore'
import clsx from 'clsx'

interface Props {
  tabs: Tab[]
  activeTabId: string | null
  onNewTab: () => void
  onCloseTab: (id: string) => void
  onActivateTab: (id: string) => void
}

export default function TabBar({ tabs, activeTabId, onNewTab, onCloseTab, onActivateTab }: Props) {
  const { moveTab, pinTab, muteTab } = useBrowserStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null)

  const pinnedTabs   = tabs.filter(t => t.isPinned)
  const unpinnedTabs = tabs.filter(t => !t.isPinned)

  function handleContextMenu(e: React.MouseEvent, tabId: string) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }

  function closeContext() { setContextMenu(null) }

  return (
    <div
      className="flex items-center h-9 bg-surface-950 border-b border-surface-800/50 flex-shrink-0 overflow-hidden"
      onClick={closeContext}
    >
      {/* Pinned tabs */}
      {pinnedTabs.map(tab => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          isPinned
          onActivate={() => onActivateTab(tab.id)}
          onClose={() => onCloseTab(tab.id)}
          onContextMenu={e => handleContextMenu(e, tab.id)}
        />
      ))}

      {pinnedTabs.length > 0 && (
        <div className="w-px h-5 bg-surface-700 mx-1 flex-shrink-0" />
      )}

      {/* Scrollable unpinned tabs */}
      <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden scroll-panel min-w-0"
           style={{ scrollbarWidth: 'none' }}>
        <Reorder.Group
          axis="x"
          values={unpinnedTabs}
          onReorder={reordered => {
            if (reordered.length >= 2) {
              moveTab(reordered[0].id, reordered[1].id)
            }
          }}
          className="flex items-center gap-0.5 px-1"
        >
          <AnimatePresence initial={false}>
            {unpinnedTabs.map(tab => (
              <Reorder.Item
                key={tab.id}
                value={tab}
                initial={{ opacity: 0, scaleX: 0.8, width: 0 }}
                animate={{ opacity: 1, scaleX: 1, width: 'auto' }}
                exit={{ opacity: 0, scaleX: 0.8, width: 0 }}
                transition={{ duration: 0.18 }}
              >
                <TabItem
                  tab={tab}
                  isActive={tab.id === activeTabId}
                  onActivate={() => onActivateTab(tab.id)}
                  onClose={() => onCloseTab(tab.id)}
                  onContextMenu={e => handleContextMenu(e, tab.id)}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      {/* New Tab button */}
      <button
        onClick={onNewTab}
        className="flex-shrink-0 btn-icon w-7 h-7 mx-1"
        title="New Tab (Ctrl+T)"
      >
        <Plus size={14} />
      </button>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <TabContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            tabId={contextMenu.tabId}
            onPin={() => { pinTab(contextMenu.tabId); closeContext() }}
            onMute={() => { muteTab(contextMenu.tabId); closeContext() }}
            onClose={() => { onCloseTab(contextMenu.tabId); closeContext() }}
            onNewTab={() => { onNewTab(); closeContext() }}
            onCloseOthers={() => {
              tabs.filter(t => t.id !== contextMenu.tabId).forEach(t => onCloseTab(t.id))
              closeContext()
            }}
            onDuplicate={() => {
              const tab = tabs.find(t => t.id === contextMenu.tabId)
              if (tab) window.rihadx?.tab.create({ url: tab.url })
              closeContext()
            }}
            tab={tabs.find(t => t.id === contextMenu.tabId)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface TabItemProps {
  tab: Tab
  isActive: boolean
  isPinned?: boolean
  onActivate: () => void
  onClose: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function TabItem({ tab, isActive, isPinned, onActivate, onClose, onContextMenu }: TabItemProps) {
  const [hovered, setHovered] = useState(false)

  const groupColors: Record<string, string> = {
    '#6366f1': 'border-t-brand-500',
    '#06b6d4': 'border-t-cyan-500',
    '#10b981': 'border-t-emerald-500',
    '#f59e0b': 'border-t-amber-500',
    '#f43f5e': 'border-t-rose-500',
    '#8b5cf6': 'border-t-violet-500',
  }

  return (
    <div
      onClick={onActivate}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={clsx(
        'relative flex items-center gap-1.5 rounded-t-lg cursor-pointer select-none transition-all duration-150 flex-shrink-0',
        isPinned ? 'w-9 h-8 justify-center px-2' : 'h-8 px-3 min-w-[120px] max-w-[200px]',
        isActive
          ? 'bg-surface-850 text-white border-t-2 border-t-brand-500'
          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60 border-t-2 border-t-transparent',
      )}
      title={tab.title || tab.url}
    >
      {/* Loading spinner or favicon */}
      <div className="flex-shrink-0 w-4 h-4 relative">
        {tab.isLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
        ) : tab.favicon ? (
          <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-surface-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-surface-400" />
          </div>
        )}
        {tab.isIncognito && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500" />
        )}
      </div>

      {/* Title */}
      {!isPinned && (
        <span className="flex-1 text-xs truncate font-medium">
          {tab.title || tab.url || 'New Tab'}
        </span>
      )}

      {/* Audio icon */}
      {!isPinned && tab.isAudioMuted && (
        <VolumeX size={10} className="flex-shrink-0 text-surface-500" />
      )}

      {/* Pin icon */}
      {isPinned && (
        <Pin size={10} className="text-surface-400" />
      )}

      {/* Close button */}
      {!isPinned && (hovered || isActive) && (
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center hover:bg-surface-600 text-surface-400 hover:text-white transition-colors"
        >
          <X size={10} />
        </button>
      )}

      {/* Active indicator bottom line */}
      {isActive && (
        <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand-500/40" />
      )}
    </div>
  )
}

function TabContextMenu({
  x, y, tabId, tab,
  onPin, onMute, onClose, onNewTab, onCloseOthers, onDuplicate
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[9999] glass rounded-xl shadow-card border border-surface-700/50 py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {[
        { label: tab?.isPinned ? 'Unpin Tab' : 'Pin Tab', action: onPin, icon: '📌' },
        { label: tab?.isAudioMuted ? 'Unmute Tab' : 'Mute Tab', action: onMute, icon: '🔇' },
        { label: 'Duplicate Tab', action: onDuplicate, icon: '📋' },
        { label: 'New Tab', action: onNewTab, icon: '➕' },
        null,
        { label: 'Close Other Tabs', action: onCloseOthers, icon: '✖' },
        { label: 'Close Tab', action: onClose, icon: '🗑', danger: true },
      ].map((item, i) =>
        item === null ? (
          <div key={i} className="divider mx-2 my-1" />
        ) : (
          <button
            key={i}
            onClick={item.action}
            className={clsx(
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left',
              item.danger
                ? 'text-rose-400 hover:bg-rose-500/10'
                : 'text-surface-300 hover:bg-surface-700 hover:text-white'
            )}
          >
            <span className="text-xs">{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </motion.div>
  )
}
