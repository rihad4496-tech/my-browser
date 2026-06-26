import React, { useState } from 'react'
import { Languages, ArrowRight, Copy, Check, RotateCw } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const LANGUAGES: Record<string, string> = {
  'auto': 'Detect Language', 'en': 'English', 'bn': 'Bengali',
  'es': 'Spanish', 'fr': 'French', 'de': 'German', 'zh': 'Chinese',
  'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'ru': 'Russian',
  'pt': 'Portuguese', 'hi': 'Hindi', 'it': 'Italian', 'tr': 'Turkish',
}

export default function TranslatorPanel() {
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('en')
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [translatePage, setTranslatePage] = useState(false)

  async function translate() {
    if (!inputText.trim()) return
    setLoading(true)
    // Real: window.rihadx?.translate(inputText, targetLang, sourceLang)
    await new Promise(r => setTimeout(r, 800))
    setOutputText(`[Translated to ${LANGUAGES[targetLang] || targetLang}]: ${inputText}`)
    setLoading(false)
  }

  function swapLanguages() {
    if (sourceLang === 'auto') return
    const tmp = sourceLang
    setSourceLang(targetLang)
    setTargetLang(tmp)
    setInputText(outputText)
    setOutputText(inputText)
  }

  async function copyOutput() {
    navigator.clipboard.writeText(outputText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-800/60 flex items-center gap-2">
        <Languages size={16} className="text-brand-400" />
        <h3 className="text-sm font-semibold text-white">Translator</h3>
      </div>

      {/* Lang selectors */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-surface-800/40">
        <select
          value={sourceLang}
          onChange={e => setSourceLang(e.target.value)}
          className="input-base h-8 text-xs flex-1"
        >
          {Object.entries(LANGUAGES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <button
          onClick={swapLanguages}
          disabled={sourceLang === 'auto'}
          className={clsx('btn-icon w-8 h-8 flex-shrink-0', sourceLang === 'auto' && 'opacity-30')}
        >
          <ArrowRight size={14} />
        </button>

        <select
          value={targetLang}
          onChange={e => setTargetLang(e.target.value)}
          className="input-base h-8 text-xs flex-1"
        >
          {Object.entries(LANGUAGES).filter(([k]) => k !== 'auto').map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Translate page button */}
      <div className="px-3 py-2 border-b border-surface-800/40">
        <button
          onClick={() => setTranslatePage(!translatePage)}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-colors',
            translatePage
              ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
              : 'bg-surface-800/60 text-surface-300 hover:bg-surface-800 border border-surface-700/40'
          )}
        >
          <Languages size={12} />
          {translatePage ? 'Page Translation Active' : 'Translate Entire Page'}
        </button>
      </div>

      {/* Text areas */}
      <div className="flex-1 flex flex-col p-3 gap-2">
        <div className="flex-1 relative">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.ctrlKey && translate()}
            placeholder="Enter text to translate..."
            className="w-full h-full resize-none input-base text-xs leading-relaxed p-3 min-h-[100px]"
          />
          {inputText && (
            <div className="absolute bottom-2 right-2 text-[10px] text-surface-600">
              {inputText.length} chars · Ctrl+Enter to translate
            </div>
          )}
        </div>

        <button
          onClick={translate}
          disabled={loading || !inputText.trim()}
          className={clsx(
            'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95',
            inputText.trim() && !loading
              ? 'btn-primary'
              : 'bg-surface-800 text-surface-600 cursor-not-allowed'
          )}
        >
          {loading ? <RotateCw size={14} className="animate-spin" /> : <Languages size={14} />}
          {loading ? 'Translating…' : 'Translate'}
        </button>

        {outputText && (
          <div className="flex-1 relative bg-surface-800/60 rounded-xl border border-surface-700/40 p-3 min-h-[100px]">
            <p className="text-xs text-surface-200 leading-relaxed whitespace-pre-wrap">{outputText}</p>
            <button
              onClick={copyOutput}
              className="absolute bottom-2 right-2 btn-icon w-6 h-6"
              title="Copy translation"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          </div>
        )}
      </div>

      <div className="px-3 pb-3 text-center">
        <p className="text-[10px] text-surface-700">Powered by LibreTranslate · Privacy-first translation</p>
      </div>
    </div>
  )
}
