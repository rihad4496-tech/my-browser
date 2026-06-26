import React, { useState, useEffect } from 'react'
import {
  History, Bookmark, Download, Puzzle, Key, X,
  Search, Trash2, ExternalLink, Clock, Globe, Star
} from 'lucide-react'
import { useBrowserStore } from '../../store/browserStore'
import { HistoryEntry, Bookmark as BookmarkType, Download as DownloadType } from '@shared/types'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const PANELS = [
  { id: 'history',    icon: History,    label: 'History' },
  { id: 'bookmarks',  icon: Bookmark,   label: 'Bookmarks' },
  { id: 'downloads',  icon: Download,   label: 'Downloads' },
  { id: 'extensions', icon: Puzzle,     label: 'Extensions' },
  { id: 'passwords',  icon: Key,        label: 'Passwords' },
] as const

export default function Sidebar() {
  const { sidebarPanel, setSidebarPanel, setSidebarOpen } = useBrowserStore()

  function close() { setSidebarOpen(false); setSidebarPanel(null) }

  return (
    <div className="flex flex-col h-full w-full bg-surface-900 border-r border-surface-800/60">
      {/* Panel Tabs */}
      <div className="flex items-center border-b border-surface-800/60 px-1 pt-1 gap-0.5">
        {PANELS.map(panel => {
          const Icon = panel.icon
          return (
            <button
              key={panel.id}
              onClick={() => setSidebarPanel(panel.id as any)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-2 text-xs rounded-t-lg transition-colors relative',
                sidebarPanel === panel.id
                  ? 'text-brand-400 bg-surface-800'
                  : 'text-surface-500 hover:text-surface-300'
              )}
              title={panel.label}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{panel.label}</span>
              {sidebarPanel === panel.id && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          )
        })}
        <button onClick={close} className="ml-auto btn-icon w-6 h-6 mb-1">
          <X size={13} />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {sidebarPanel === 'history'    && <HistoryPanel />}
        {sidebarPanel === 'bookmarks'  && <BookmarksPanel />}
        {sidebarPanel === 'downloads'  && <DownloadsSidePanel />}
        {sidebarPanel === 'extensions' && <ExtensionsPanel />}
        {sidebarPanel === 'passwords'  && <PasswordsPanel />}
      </div>
    </div>
  )
}

// ─── History Panel ─────────────────────────────────────────────────────────
function HistoryPanel() {
  const [items, setItems] = useState<HistoryEntry[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => { loadHistory() }, [])

  async function loadHistory(q = '') {
    if (!window.rihadx) return
    const data = q ? await window.rihadx.history.search(q) : await window.rihadx.history.recent(100)
    setItems(data)
  }

  async function deleteItem(id: number) {
    await window.rihadx?.history.delete(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function clearAll() {
    await window.rihadx?.history.clear()
    setItems([])
  }

  function navigate(url: string) {
    const tabId = useBrowserStore.getState().activeTabId
    window.rihadx?.tab.navigate(url, tabId || undefined)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); loadHistory(e.target.value) }}
              placeholder="Search history..."
              className="input-base pl-8 h-8 text-xs"
            />
          </div>
          <button onClick={clearAll} title="Clear all" className="btn-icon w-8 h-8 text-rose-400 hover:bg-rose-500/10">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex-1 scroll-panel px-2 pb-2 space-y-0.5">
        {items.length === 0 && (
          <EmptyState icon={<History size={28} />} message="No history yet" />
        )}
        {items.map(item => (
          <div
            key={item.id}
            className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-800 cursor-pointer"
            onClick={() => navigate(item.url)}
          >
            {item.favicon_url
              ? <img src={item.favicon_url} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
              : <Globe size={13} className="text-surface-500 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className="text-xs text-surface-200 truncate">{item.title || item.url}</div>
              <div className="text-[10px] text-surface-500 truncate">{item.url}</div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-surface-600 whitespace-nowrap">
                {formatDistanceToNow(item.last_visit * 1000, { addSuffix: true })}
              </span>
              <button
                onClick={e => { e.stopPropagation(); deleteItem(item.id) }}
                className="btn-icon w-5 h-5 text-rose-400"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bookmarks Panel ───────────────────────────────────────────────────────
function BookmarksPanel() {
  const [items, setItems] = useState<BookmarkType[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => { loadBookmarks() }, [])

  async function loadBookmarks(q = '') {
    if (!window.rihadx) return
    const data = q ? await window.rihadx.bookmarks.search(q) : await window.rihadx.bookmarks.get()
    setItems(data)
  }

  async function deleteItem(id: number) {
    await window.rihadx?.bookmarks.delete(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function navigate(url: string) {
    const tabId = useBrowserStore.getState().activeTabId
    window.rihadx?.tab.navigate(url, tabId || undefined)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); loadBookmarks(e.target.value) }}
            placeholder="Search bookmarks..."
            className="input-base pl-8 h-8 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 scroll-panel px-2 pb-2 space-y-0.5">
        {items.length === 0 && (
          <EmptyState icon={<Bookmark size={28} />} message="No bookmarks yet" />
        )}
        {items.map(item => (
          <div
            key={item.id}
            className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-800 cursor-pointer"
            onClick={() => navigate(item.url)}
          >
            {item.favicon_url
              ? <img src={item.favicon_url} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
              : <Star size={13} className="text-amber-400 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className="text-xs text-surface-200 truncate">{item.title || item.url}</div>
              <div className="text-[10px] text-surface-500 truncate">{item.url}</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); deleteItem(item.id) }}
              className="btn-icon w-5 h-5 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Downloads Side Panel ──────────────────────────────────────────────────
function DownloadsSidePanel() {
  const { downloads, setDownloads } = useBrowserStore()

  useEffect(() => {
    window.rihadx?.downloads.list().then(setDownloads)
  }, [])

  function formatSize(bytes?: number) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const statusColors: Record<string, string> = {
    completed:   'badge-green',
    downloading: 'badge-blue',
    failed:      'badge-red',
    cancelled:   'badge-gray',
    pending:     'badge-amber',
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-surface-800/40">
        <span className="text-xs text-surface-500">{downloads.length} downloads</span>
      </div>
      <div className="flex-1 scroll-panel px-2 py-2 space-y-1.5">
        {downloads.length === 0 && (
          <EmptyState icon={<Download size={28} />} message="No downloads yet" />
        )}
        {downloads.map(dl => (
          <div key={dl.id} className="p-2.5 rounded-xl bg-surface-800/50 border border-surface-700/30">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-xs text-surface-200 truncate flex-1">{dl.filename}</span>
              <span className={`badge ${statusColors[dl.status] || 'badge-gray'} flex-shrink-0 text-[10px]`}>
                {dl.status}
              </span>
            </div>
            {dl.status === 'downloading' && dl.file_size && (
              <div className="w-full bg-surface-700 rounded-full h-1 mb-1.5">
                <div
                  className="bg-brand-500 h-1 rounded-full transition-all"
                  style={{ width: `${(dl.downloaded / dl.file_size) * 100}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-surface-500">
                {formatSize(dl.downloaded)}{dl.file_size ? ` / ${formatSize(dl.file_size)}` : ''}
              </span>
              <div className="flex gap-1">
                {dl.save_path && dl.status === 'completed' && (
                  <button
                    onClick={() => window.rihadx?.downloads.open(dl.save_path!)}
                    className="text-[10px] text-brand-400 hover:text-brand-300"
                  >
                    Open
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Extensions Panel ──────────────────────────────────────────────────────
function ExtensionsPanel() {
  const mockExtensions = [
    { id: '1', name: 'uBlock Origin', version: '1.57.0', enabled: true, icon: '🛡️' },
    { id: '2', name: 'LastPass',      version: '4.120.0', enabled: false, icon: '🔑' },
    { id: '3', name: 'Grammarly',     version: '14.1127.0', enabled: true, icon: '✍️' },
  ]
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-surface-800/40">
        <button className="btn-primary w-full text-xs py-2">
          <Puzzle size={13} className="inline mr-1" /> Browse Extensions
        </button>
      </div>
      <div className="flex-1 scroll-panel px-2 py-2 space-y-1.5">
        {mockExtensions.map(ext => (
          <div key={ext.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-800/50 border border-surface-700/30">
            <span className="text-xl flex-shrink-0">{ext.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-surface-200">{ext.name}</div>
              <div className="text-[10px] text-surface-500">v{ext.version}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" defaultChecked={ext.enabled} className="sr-only peer" />
              <div className="w-8 h-4 bg-surface-700 peer-focus:ring-2 peer-focus:ring-brand-500/30 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600" />
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Passwords Panel ───────────────────────────────────────────────────────
function PasswordsPanel() {
  const [passwords, setPasswords] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    window.rihadx?.passwords.all().then(setPasswords)
  }, [])

  const filtered = passwords.filter(p =>
    p.domain.includes(search) || p.username.includes(search)
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search passwords..."
            className="input-base pl-8 h-8 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 scroll-panel px-2 pb-2 space-y-1.5">
        {filtered.length === 0 && (
          <EmptyState icon={<Key size={28} />} message="No saved passwords" />
        )}
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-800/50 border border-surface-700/30">
            <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
              <Globe size={14} className="text-surface-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-surface-200 truncate">{p.domain}</div>
              <div className="text-[10px] text-surface-500 truncate">{p.username}</div>
            </div>
            <span className={clsx('badge text-[10px]',
              p.strength === 'strong' ? 'badge-green' :
              p.strength === 'good'   ? 'badge-blue'  :
              p.strength === 'fair'   ? 'badge-amber' : 'badge-red'
            )}>
              {p.strength}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-surface-600">
      {icon}
      <p className="text-xs mt-2">{message}</p>
    </div>
  )
}
