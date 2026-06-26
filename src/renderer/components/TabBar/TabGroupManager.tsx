import React, { useState } from 'react'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrowserStore } from '../../store/browserStore'
import { TabGroup } from '@shared/types'
import clsx from 'clsx'

const GROUP_COLORS = [
  '#6366f1', '#06b6d4', '#10b981',
  '#f59e0b', '#f43f5e', '#8b5cf6',
  '#ec4899', '#14b8a6',
]

export default function TabGroupManager() {
  const { tabGroups, tabs, assignTabToGroup, activeTabId } = useBrowserStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(GROUP_COLORS[0])

  function createGroup() {
    if (!newName.trim()) return
    const group: TabGroup = {
      id: `group-${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      tabIds: activeTabId ? [activeTabId] : [],
      collapsed: false,
    }
    useBrowserStore.setState(s => ({ tabGroups: [...s.tabGroups, group] }))
    setCreating(false)
    setNewName('')
  }

  function deleteGroup(id: string) {
    useBrowserStore.setState(s => ({ tabGroups: s.tabGroups.filter(g => g.id !== id) }))
  }

  function toggleCollapse(id: string) {
    useBrowserStore.setState(s => ({
      tabGroups: s.tabGroups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g)
    }))
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Tab Groups</span>
        <button
          onClick={() => setCreating(!creating)}
          className="btn-icon w-6 h-6"
          title="New group"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Create group form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-surface-800/60 border border-surface-700/40 space-y-2 mb-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createGroup()}
                placeholder="Group name..."
                className="input-base h-8 text-xs"
                autoFocus
              />
              <div className="flex items-center gap-1.5">
                {GROUP_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={clsx(
                      'w-5 h-5 rounded-full transition-transform',
                      newColor === c ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCreating(false)} className="flex-1 btn-ghost text-xs py-1.5">Cancel</button>
                <button onClick={createGroup} className="flex-1 btn-primary text-xs py-1.5">Create</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing groups */}
      {tabGroups.length === 0 && !creating && (
        <p className="text-xs text-surface-600 text-center py-4">No groups yet. Create one to organize your tabs.</p>
      )}

      {tabGroups.map(group => {
        const groupTabs = tabs.filter(t => t.groupId === group.id)
        return (
          <div key={group.id} className="rounded-xl bg-surface-800/40 border border-surface-700/30 overflow-hidden">
            {/* Group header */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-800/60 transition-colors"
              onClick={() => toggleCollapse(group.id)}
              style={{ borderLeft: `3px solid ${group.color}` }}
            >
              <span className="text-xs">{group.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}</span>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
              <span className="text-xs font-medium text-surface-200 flex-1">{group.name}</span>
              <span className="text-[10px] text-surface-500">{groupTabs.length} tabs</span>
              <button
                onClick={e => { e.stopPropagation(); deleteGroup(group.id) }}
                className="btn-icon w-5 h-5 opacity-0 group-hover:opacity-100 text-rose-400"
              >
                <X size={10} />
              </button>
            </div>

            {/* Tabs in group */}
            {!group.collapsed && (
              <div className="px-2 pb-2">
                {groupTabs.map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => {
                      window.rihadx?.tab.activate(tab.id)
                      useBrowserStore.getState().setActiveTab(tab.id)
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-700/50 cursor-pointer"
                  >
                    {tab.favicon
                      ? <img src={tab.favicon} alt="" className="w-3.5 h-3.5 rounded-sm flex-shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-sm bg-surface-600 flex-shrink-0" />
                    }
                    <span className="text-xs text-surface-300 truncate">{tab.title || 'New Tab'}</span>
                  </div>
                ))}
                {groupTabs.length === 0 && (
                  <p className="text-[10px] text-surface-600 px-2 py-1">No tabs in this group yet.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
