import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Globe, Clock, Bookmark, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'
import { SearchSuggestion } from '@shared/types'
import clsx from 'clsx'

const SEARCH_ENGINES: Record<string, string> = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google:     'https://www.google.com/search?q=',
  bing:       'https://www.bing.com/search?q=',
  brave:      'https://search.brave.com/search?q=',
}

export default function OmniBar() {
  const activeTab = useActiveTab()
  const { settings } = useBrowserStore()

  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Sync value with active tab URL
  useEffect(() => {
    if (!focused) {
      setValue(activeTab?.url === 'rihadx://newtab' ? '' : (activeTab?.url ?? ''))
    }
  }, [activeTab?.url, focused])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || !window.rihadx) {
      setSuggestions([])
      return
    }
    setLoading(true)
    const results: SearchSuggestion[] = []

    // History suggestions
    const history = await window.rihadx.history.search(query)
    history.slice(0, 3).forEach((h: any) => {
      results.push({ type: 'history', text: h.title || h.url, url: h.url, favicon: h.favicon_url })
    })

    // Bookmark suggestions
    const bookmarks = await window.rihadx.bookmarks.search(query)
    bookmarks.slice(0, 2).forEach((b: any) => {
      results.push({ type: 'bookmark', text: b.title || b.url, url: b.url, favicon: b.favicon_url })
    })

    // Direct URL suggestion
    if (query.includes('.') && !query.includes(' ')) {
      results.unshift({
        type: 'url',
        text: query.startsWith('http') ? query : `https://${query}`,
        url: query.startsWith('http') ? query : `https://${query}`,
      })
    }

    // Search suggestion
    const engine = settings.search_engine || 'duckduckgo'
    results.push({
      type: 'search',
      text: `Search for "${query}"`,
      url: `${SEARCH_ENGINES[engine] || SEARCH_ENGINES.duckduckgo}${encodeURIComponent(query)}`,
      description: engine,
    })

    setSuggestions(results)
    setSelectedIdx(-1)
    setLoading(false)
  }, [settings.search_engine])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setValue(v)
    clearTimeout(suggestionTimeout.current)
    suggestionTimeout.current = setTimeout(() => fetchSuggestions(v), 120)
  }

  function handleNavigate(url: string) {
    if (!url.trim()) return
    let target = url.trim()
    if (!target.startsWith('http') && !target.startsWith('rihadx://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = `https://${target}`
      } else {
        const engine = settings.search_engine || 'duckduckgo'
        target = `${SEARCH_ENGINES[engine]}${encodeURIComponent(target)}`
      }
    }
    const activeTabId = useBrowserStore.getState().activeTabId
    window.rihadx?.tab.navigate(target, activeTabId || undefined)
    setValue(target)
    setFocused(false)
    setSuggestions([])
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        handleNavigate(suggestions[selectedIdx].url)
      } else {
        handleNavigate(value)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setFocused(false)
      setSuggestions([])
      setValue(activeTab?.url === 'rihadx://newtab' ? '' : (activeTab?.url ?? ''))
      inputRef.current?.blur()
    }
  }

  function handleFocus() {
    setFocused(true)
    inputRef.current?.select()
    if (value) fetchSuggestions(value)
  }

  const displayValue = focused
    ? value
    : (activeTab?.url === 'rihadx://newtab' ? '' : activeTab?.url ?? '')

  const isSecure = activeTab?.url?.startsWith('https://')
  const isRihadx = activeTab?.url?.startsWith('rihadx://')

  return (
    <div className="relative flex-1 mx-1">
      <div
        className={clsx(
          'flex items-center gap-2 h-8 rounded-xl px-3 transition-all duration-200',
          focused
            ? 'bg-surface-800 ring-2 ring-brand-500/50 border border-brand-500/30'
            : 'bg-surface-800/60 border border-surface-700/50 hover:border-surface-600'
        )}
      >
        {/* Left icon */}
        <div className="flex-shrink-0 text-surface-500">
          {loading ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-600 border-t-brand-500 animate-spin" />
          ) : focused ? (
            <Search size={13} className="text-surface-400" />
          ) : isRihadx ? (
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-brand-500 to-accent-cyan opacity-80" />
          ) : (
            <Globe size={13} className={isSecure ? 'text-emerald-400' : 'text-surface-500'} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={focused ? value : displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={() => { setTimeout(() => { setFocused(false); setSuggestions([]) }, 150) }}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter URL"
          className="flex-1 bg-transparent text-sm text-surface-100 placeholder-surface-600 outline-none min-w-0"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />

        {/* Clear button */}
        {focused && value && (
          <button
            onMouseDown={e => { e.preventDefault(); setValue(''); setSuggestions([]) }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-surface-600 hover:bg-surface-500 text-surface-300 transition-colors"
          >
            <X size={9} />
          </button>
        )}

        {/* Loading bar */}
        {activeTab?.isLoading && !focused && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-brand-500 via-accent-cyan to-brand-500 rounded-full animate-pulse"
            style={{ width: '60%' }}
          />
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1.5 glass rounded-xl shadow-card border border-surface-700/50 overflow-hidden z-[9999]"
          >
            {suggestions.map((s, i) => (
              <SuggestionItem
                key={i}
                suggestion={s}
                isSelected={i === selectedIdx}
                onMouseDown={() => handleNavigate(s.url)}
                onMouseEnter={() => setSelectedIdx(i)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SuggestionItem({ suggestion, isSelected, onMouseDown, onMouseEnter }: {
  suggestion: SearchSuggestion
  isSelected: boolean
  onMouseDown: () => void
  onMouseEnter: () => void
}) {
  const icons: Record<string, React.ReactNode> = {
    url:      <Globe size={13} className="text-brand-400" />,
    search:   <Search size={13} className="text-surface-400" />,
    history:  <Clock size={13} className="text-surface-500" />,
    bookmark: <Bookmark size={13} className="text-amber-400" />,
  }

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={clsx(
        'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
        isSelected ? 'bg-brand-500/10' : 'hover:bg-surface-700/50'
      )}
    >
      <div className="flex-shrink-0">
        {suggestion.favicon ? (
          <img src={suggestion.favicon} alt="" className="w-4 h-4 rounded-sm" />
        ) : (
          icons[suggestion.type]
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-surface-200 truncate">{suggestion.text}</div>
        {suggestion.description && (
          <div className="text-xs text-surface-500 truncate">{suggestion.description}</div>
        )}
      </div>
      {isSelected && (
        <ChevronRight size={12} className="text-surface-500 flex-shrink-0" />
      )}
    </div>
  )
}
