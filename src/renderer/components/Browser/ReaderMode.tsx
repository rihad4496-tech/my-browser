import React, { useState, useEffect } from 'react'
import { X, Type, Sun, Moon, AlignLeft, AlignJustify, Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'
import clsx from 'clsx'

interface ReaderContent {
  title: string
  author: string
  content: string
  url: string
  readTime: number
}

export default function ReaderMode() {
  const { setReaderMode } = useBrowserStore()
  const activeTab = useActiveTab()
  const [content, setContent] = useState<ReaderContent | null>(null)
  const [fontSize, setFontSize] = useState(18)
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark')
  const [lineWidth, setLineWidth] = useState<'narrow' | 'medium' | 'wide'>('medium')

  useEffect(() => {
    // In real implementation, this comes from the webview preload
    // via IPC after extracting the article content
    setContent({
      title:    activeTab?.title || 'Article',
      author:   '',
      content:  '<p>Reader mode extracts the main article content from the page, removing ads, sidebars, and distractions for a clean reading experience.</p>',
      url:      activeTab?.url || '',
      readTime: 3,
    })
  }, [activeTab?.url])

  const themes = {
    dark:  { bg: '#0f172a', text: '#e2e8f0', name: 'Dark' },
    sepia: { bg: '#f5e6d3', text: '#4a3728', name: 'Sepia' },
    light: { bg: '#ffffff', text: '#1a1a1a', name: 'Light' },
  }

  const widths = {
    narrow: '480px',
    medium: '680px',
    wide:   '860px',
  }

  const t = themes[theme]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 overflow-y-auto scroll-panel"
      style={{ backgroundColor: t.bg, color: t.text }}
    >
      {/* Toolbar */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3 border-b backdrop-blur-sm"
        style={{ borderColor: `${t.text}20`, backgroundColor: `${t.bg}cc` }}
      >
        {/* Theme buttons */}
        <div className="flex items-center gap-1 rounded-lg overflow-hidden border" style={{ borderColor: `${t.text}20` }}>
          {(Object.keys(themes) as Array<keyof typeof themes>).map(k => (
            <button
              key={k}
              onClick={() => setTheme(k)}
              className={clsx(
                'px-2.5 py-1.5 text-xs font-medium transition-colors',
                theme === k ? 'opacity-100' : 'opacity-40 hover:opacity-70'
              )}
              style={{ color: t.text, backgroundColor: theme === k ? `${t.text}15` : 'transparent' }}
            >
              {themes[k].name}
            </button>
          ))}
        </div>

        {/* Font size */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFontSize(f => Math.max(12, f - 2))}
            className="btn-icon w-7 h-7 opacity-60 hover:opacity-100"
            style={{ color: t.text }}
          >
            <Minus size={13} />
          </button>
          <span className="text-xs w-8 text-center opacity-60" style={{ color: t.text }}>
            {fontSize}
          </span>
          <button
            onClick={() => setFontSize(f => Math.min(28, f + 2))}
            className="btn-icon w-7 h-7 opacity-60 hover:opacity-100"
            style={{ color: t.text }}
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Width */}
        <div className="flex items-center gap-1">
          {(['narrow', 'medium', 'wide'] as const).map(w => (
            <button
              key={w}
              onClick={() => setLineWidth(w)}
              className={clsx('px-2 py-1 text-[10px] rounded transition-colors', lineWidth === w ? 'opacity-100' : 'opacity-40')}
              style={{ color: t.text, backgroundColor: lineWidth === w ? `${t.text}15` : 'transparent' }}
            >
              {w[0].toUpperCase() + w.slice(1)}
            </button>
          ))}
        </div>

        {/* Read time */}
        {content?.readTime && (
          <span className="text-xs opacity-40 ml-auto" style={{ color: t.text }}>
            {content.readTime} min read
          </span>
        )}

        {/* Close */}
        <button
          onClick={() => setReaderMode(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: t.text }}
        >
          <X size={13} /> Exit Reader
        </button>
      </div>

      {/* Content */}
      <div className="mx-auto px-6 py-12 transition-all" style={{ maxWidth: widths[lineWidth] }}>
        {content ? (
          <>
            <h1
              className="font-bold mb-4 leading-tight"
              style={{ fontSize: fontSize * 1.8, color: t.text }}
            >
              {content.title}
            </h1>

            {content.author && (
              <p className="mb-6 opacity-50 text-sm" style={{ color: t.text }}>
                By {content.author}
              </p>
            )}

            <a
              href={content.url}
              className="text-xs opacity-30 hover:opacity-60 transition-opacity block mb-8 truncate"
              style={{ color: t.text }}
              onClick={e => { e.preventDefault(); useBrowserStore.getState().setReaderMode(false) }}
            >
              {content.url}
            </a>

            <div
              className="leading-relaxed prose max-w-none"
              style={{ fontSize, color: t.text, lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          </>
        ) : (
          <div className="text-center opacity-40 mt-20">
            <Type size={40} className="mx-auto mb-4" />
            <p>Loading article content…</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
