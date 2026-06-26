import React, { useEffect, useRef } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useBrowserStore } from '../../store/browserStore'
import { motion } from 'framer-motion'

export default function FindBar() {
  const { findText, setFindText, setFindBarOpen } = useBrowserStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function close() { setFindBarOpen(false); setFindText('') }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') close()
    if (e.key === 'Enter') {
      // Trigger next match
    }
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 40, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2 px-3 bg-surface-900 border-b border-surface-800/60 overflow-hidden flex-shrink-0"
    >
      <Search size={13} className="text-surface-500 flex-shrink-0" />
      <input
        ref={inputRef}
        value={findText}
        onChange={e => setFindText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in page..."
        className="flex-1 bg-transparent text-sm text-surface-100 placeholder-surface-600 outline-none"
      />
      <div className="flex items-center gap-1">
        <span className="text-xs text-surface-500">0 / 0</span>
        <button className="btn-icon w-6 h-6"><ChevronUp size={12} /></button>
        <button className="btn-icon w-6 h-6"><ChevronDown size={12} /></button>
        <button onClick={close} className="btn-icon w-6 h-6 text-surface-500">
          <X size={12} />
        </button>
      </div>
    </motion.div>
  )
}
