import React, { useState, useEffect, useRef } from 'react'
import { Search, Clock, Bookmark, Shield, Zap, Globe, Plus, X, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBrowserStore } from '../store/browserStore'
import { HistoryEntry } from '@shared/types'
import clsx from 'clsx'

const SEARCH_ENGINES: Record<string, { url: string; placeholder: string }> = {
  duckduckgo: { url: 'https://duckduckgo.com/?q=', placeholder: 'Search with DuckDuckGo...' },
  google:     { url: 'https://www.google.com/search?q=', placeholder: 'Search with Google...' },
  bing:       { url: 'https://www.bing.com/search?q=', placeholder: 'Search with Bing...' },
  brave:      { url: 'https://search.brave.com/search?q=', placeholder: 'Search with Brave...' },
}

const DEFAULT_SHORTCUTS = [
  { title: 'GitHub',    url: 'https://github.com',    icon: '🐙' },
  { title: 'YouTube',   url: 'https://youtube.com',   icon: '▶️' },
  { title: 'Wikipedia', url: 'https://wikipedia.org', icon: '📚' },
  { title: 'Twitter',   url: 'https://twitter.com',   icon: '🐦' },
  { title: 'Gmail',     url: 'https://mail.google.com', icon: '📧' },
  { title: 'Reddit',    url: 'https://reddit.com',    icon: '🤖' },
]

function useGreeting() {
  const hour = new Date().getHours()
  if (hour < 5)  return 'Good Night'
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  if (hour < 21) return 'Good Evening'
  return 'Good Night'
}

export default function NewTabPage() {
  const { settings, stats } = useBrowserStore()
  const [query, setQuery] = useState('')
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([])
  const [time, setTime] = useState(new Date())
  const inputRef = useRef<HTMLInputElement>(null)
  const greeting = useGreeting()

  const engine = settings.search_engine || 'duckduckgo'
  const engineConfig = SEARCH_ENGINES[engine] || SEARCH_ENGINES.duckduckgo

  useEffect(() => {
    inputRef.current?.focus()
    window.rihadx?.history.recent(6).then(setRecentHistory)
    const tick = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    const tabId = useBrowserStore.getState().activeTabId
    let url = query.trim()
    if (!url.startsWith('http')) {
      if (url.includes('.') && !url.includes(' ')) url = `https://${url}`
      else url = `${engineConfig.url}${encodeURIComponent(url)}`
    }
    window.rihadx?.tab.navigate(url, tabId || undefined)
  }

  function navigate(url: string) {
    const tabId = useBrowserStore.getState().activeTabId
    window.rihadx?.tab.navigate(url, tabId || undefined)
  }

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const totalBlocked = stats.adsBlocked + stats.trackersBlocked

  return (
    <div className="w-full h-full overflow-y-auto scroll-panel bg-surface-950 relative">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-600/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-accent-cyan/5 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-accent-violet/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Clock */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center mb-8"
        >
          <div className="text-7xl font-display font-bold text-white tracking-tight mb-1"
               style={{ fontVariantNumeric: 'tabular-nums' }}>
            {timeStr}
          </div>
          <div className="text-surface-400 text-sm">{dateStr}</div>
          <div className="mt-2 text-surface-500 text-sm">{greeting}</div>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="mb-10"
        >
          <div className="relative">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={engineConfig.placeholder}
              className="w-full h-14 bg-surface-800/80 border border-surface-700/60 rounded-2xl pl-14 pr-6
                         text-white text-base placeholder-surface-500 outline-none
                         focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40
                         backdrop-blur-sm transition-all duration-200 shadow-card"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </motion.form>

        {/* Quick Shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <div className="grid grid-cols-6 gap-3">
            {DEFAULT_SHORTCUTS.map((s, i) => (
              <motion.button
                key={s.url}
                onClick={() => navigate(s.url)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-800/60 hover:bg-surface-800
                           border border-surface-700/40 hover:border-surface-600 transition-all group"
                title={s.title}
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-[10px] text-surface-400 group-hover:text-white transition-colors truncate w-full text-center">
                  {s.title}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Security Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-10"
        >
          {[
            {
              icon: <Shield size={18} className="text-emerald-400" />,
              value: totalBlocked.toLocaleString(),
              label: 'Threats Blocked',
              color: 'emerald',
            },
            {
              icon: <Zap size={18} className="text-brand-400" />,
              value: `${(stats.bandwidthSaved / (1024 * 1024)).toFixed(1)} MB`,
              label: 'Bandwidth Saved',
              color: 'brand',
            },
            {
              icon: <Globe size={18} className="text-cyan-400" />,
              value: settings.https_only ? 'On' : 'Off',
              label: 'HTTPS-Only Mode',
              color: 'cyan',
            },
          ].map(card => (
            <div
              key={card.label}
              className="glass rounded-xl p-4 flex items-center gap-3 border border-surface-700/30"
            >
              <div className={`w-9 h-9 rounded-lg bg-${card.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
              <div>
                <div className="text-base font-bold text-white">{card.value}</div>
                <div className="text-[10px] text-surface-500">{card.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Recent History */}
        {recentHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} className="text-surface-500" />
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Recent</h3>
            </div>
            <div className="space-y-1">
              {recentHistory.slice(0, 5).map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.url)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-800/60 transition-colors group text-left"
                >
                  {item.favicon_url
                    ? <img src={item.favicon_url} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
                    : <Globe size={13} className="text-surface-600 flex-shrink-0" />
                  }
                  <span className="flex-1 text-sm text-surface-300 group-hover:text-white truncate transition-colors">
                    {item.title || item.url}
                  </span>
                  <span className="text-[10px] text-surface-600 truncate max-w-[180px] hidden group-hover:block">
                    {item.url}
                  </span>
                  <ExternalLink size={11} className="text-surface-600 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Brand footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 text-surface-700 text-xs">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-500 to-accent-cyan opacity-60" />
            <span>RihadX Browser · Fast · Private · Secure</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
