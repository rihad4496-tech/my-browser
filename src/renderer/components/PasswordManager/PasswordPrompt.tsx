import React, { useState } from 'react'
import { Key, Eye, EyeOff, X, Shield, Copy } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'

export default function PasswordPrompt() {
  const { setModalOpen } = useBrowserStore()
  const activeTab = useActiveTab()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generated, setGenerated] = useState('')

  const domain = activeTab?.url ? new URL(activeTab.url).hostname : 'unknown'

  async function save() {
    if (!username || !password) return
    setSaving(true)
    await window.rihadx?.passwords.save(domain, username, password)
    setSaving(false)
    setModalOpen(null)
  }

  async function generate() {
    const pwd = await window.rihadx?.passwords.generate()
    if (pwd) { setGenerated(pwd); setPassword(pwd) }
  }

  function getStrength(pwd: string): { label: string; color: string; pct: number } {
    if (pwd.length === 0) return { label: '', color: '', pct: 0 }
    let score = 0
    if (pwd.length >= 12) score++
    if (pwd.length >= 20) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    const levels = [
      { label: 'Weak',   color: 'bg-rose-500',   pct: 20  },
      { label: 'Fair',   color: 'bg-amber-500',   pct: 40  },
      { label: 'Good',   color: 'bg-brand-500',   pct: 60  },
      { label: 'Strong', color: 'bg-emerald-500', pct: 80  },
      { label: 'Very Strong', color: 'bg-emerald-400', pct: 100 },
    ]
    return levels[Math.min(score, 4)]
  }

  const strength = getStrength(password)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setModalOpen(null)}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="glass rounded-2xl p-6 w-full max-w-md mx-4 shadow-card"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <Key size={18} className="text-brand-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Save Password</h2>
            <p className="text-xs text-surface-400">{domain}</p>
          </div>
          <button onClick={() => setModalOpen(null)} className="ml-auto btn-icon w-8 h-8">
            <X size={14} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-surface-400 mb-1 block">Username / Email</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              className="input-base"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-surface-400 mb-1 block">Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                className="input-base pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {password && (
                  <button
                    onClick={() => navigator.clipboard.writeText(password)}
                    className="btn-icon w-6 h-6"
                    title="Copy"
                  >
                    <Copy size={11} />
                  </button>
                )}
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="btn-icon w-6 h-6"
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Strength bar */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-surface-500">Strength</span>
                  <span className="text-[10px] font-medium text-surface-300">{strength.label}</span>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white text-sm transition-colors mb-4 border border-surface-700/50"
        >
          <Shield size={14} className="text-emerald-400" />
          Generate Strong Password
        </button>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setModalOpen(null)}
            className="flex-1 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!username || !password || saving}
            className="flex-1 btn-primary"
          >
            {saving ? 'Saving…' : 'Save Password'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
