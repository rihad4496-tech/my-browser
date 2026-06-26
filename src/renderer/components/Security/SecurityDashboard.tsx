import React from 'react'
import {
  Shield, ShieldCheck, ShieldAlert, Lock, Eye, Fingerprint,
  Globe, Wifi, Activity, BarChart2, Zap, AlertTriangle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'
import clsx from 'clsx'

export default function SecurityDashboard() {
  const { stats, settings, vpnConnected } = useBrowserStore()
  const activeTab = useActiveTab()

  const isSecure = activeTab?.url?.startsWith('https://')
  const totalBlocked = stats.adsBlocked + stats.trackersBlocked
  const bandwidthMB = (stats.bandwidthSaved / (1024 * 1024)).toFixed(1)

  const protections = [
    {
      id: 'adblock',
      label: 'Ad Blocker',
      active: !!settings.ad_blocker,
      icon: Shield,
      description: `${stats.adsBlocked.toLocaleString()} ads blocked`,
    },
    {
      id: 'tracker',
      label: 'Tracker Blocker',
      active: !!settings.tracker_blocker,
      icon: Eye,
      description: `${stats.trackersBlocked.toLocaleString()} trackers blocked`,
    },
    {
      id: 'fingerprint',
      label: 'Anti-Fingerprinting',
      active: !!settings.anti_fingerprinting,
      icon: Fingerprint,
      description: 'Canvas & audio noise active',
    },
    {
      id: 'https',
      label: 'HTTPS-Only',
      active: !!settings.https_only,
      icon: Lock,
      description: isSecure ? 'Connection encrypted' : 'HTTP detected',
    },
    {
      id: 'doh',
      label: 'DNS-over-HTTPS',
      active: !!settings.doh_enabled,
      icon: Globe,
      description: 'DNS queries encrypted',
    },
    {
      id: 'vpn',
      label: 'VPN',
      active: vpnConnected,
      icon: Wifi,
      description: vpnConnected ? 'IP address hidden' : 'Real IP visible',
    },
    {
      id: 'malware',
      label: 'Malware Protection',
      active: !!settings.malware_protection,
      icon: ShieldAlert,
      description: 'Malicious sites blocked',
    },
    {
      id: 'phishing',
      label: 'Phishing Guard',
      active: !!settings.phishing_protection,
      icon: AlertTriangle,
      description: 'Deceptive sites blocked',
    },
  ]

  const activeCount = protections.filter(p => p.active).length
  const securityScore = Math.round((activeCount / protections.length) * 100)

  function scoreColor(score: number) {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-rose-400'
  }

  function scoreBg(score: number) {
    if (score >= 80) return 'from-emerald-500 to-emerald-400'
    if (score >= 60) return 'from-amber-500 to-amber-400'
    return 'from-rose-500 to-rose-400'
  }

  function scoreLabel(score: number) {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'At Risk'
  }

  return (
    <div className="flex flex-col h-full bg-surface-900 overflow-y-auto scroll-panel">
      {/* Score header */}
      <div className="p-5 border-b border-surface-800/60 bg-surface-950/50">
        <div className="flex items-center gap-4">
          {/* Score ring */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke={securityScore >= 80 ? '#10b981' : securityScore >= 60 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="6"
                strokeDasharray={`${securityScore * 1.759} 175.9`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={clsx('text-base font-bold', scoreColor(securityScore))}>
                {securityScore}
              </span>
            </div>
          </div>

          <div>
            <div className={clsx('text-lg font-bold', scoreColor(securityScore))}>
              {scoreLabel(securityScore)}
            </div>
            <div className="text-xs text-surface-400 mb-1">Security Score</div>
            <div className="text-[10px] text-surface-500">
              {activeCount}/{protections.length} protections active
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 p-3 border-b border-surface-800/40">
        {[
          { label: 'Ads Blocked',  value: stats.adsBlocked.toLocaleString(),      color: 'text-rose-400' },
          { label: 'Trackers',     value: stats.trackersBlocked.toLocaleString(), color: 'text-amber-400' },
          { label: 'Saved',        value: `${bandwidthMB}MB`,                     color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="text-center p-2 rounded-lg bg-surface-800/40 border border-surface-700/20">
            <div className={clsx('text-sm font-bold', stat.color)}>{stat.value}</div>
            <div className="text-[9px] text-surface-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Current page security */}
      {activeTab?.url && activeTab.url !== 'rihadx://newtab' && (
        <div className="px-3 py-2.5 border-b border-surface-800/40">
          <div className="text-[10px] text-surface-600 uppercase tracking-wider mb-1.5 font-semibold">Current Page</div>
          <div className={clsx(
            'flex items-center gap-2 p-2.5 rounded-xl border',
            isSecure
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-amber-500/5 border-amber-500/20'
          )}>
            {isSecure
              ? <Lock size={14} className="text-emerald-400 flex-shrink-0" />
              : <Zap size={14} className="text-amber-400 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className={clsx('text-xs font-medium', isSecure ? 'text-emerald-400' : 'text-amber-400')}>
                {isSecure ? 'Secure Connection' : 'Insecure Connection'}
              </div>
              <div className="text-[10px] text-surface-500 truncate">{activeTab.url}</div>
            </div>
          </div>
        </div>
      )}

      {/* Protection list */}
      <div className="p-3 space-y-1.5">
        <div className="text-[10px] text-surface-600 uppercase tracking-wider mb-2 font-semibold px-1">
          Protection Status
        </div>
        {protections.map((p, i) => {
          const Icon = p.icon
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={clsx(
                'flex items-center gap-3 p-2.5 rounded-xl border transition-colors',
                p.active
                  ? 'bg-emerald-500/5 border-emerald-500/10'
                  : 'bg-surface-800/30 border-surface-700/20 opacity-60'
              )}
            >
              <Icon size={14} className={p.active ? 'text-emerald-400' : 'text-surface-500'} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-surface-200">{p.label}</div>
                <div className="text-[10px] text-surface-500">{p.description}</div>
              </div>
              <div className={clsx(
                'w-2 h-2 rounded-full flex-shrink-0',
                p.active ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-surface-600'
              )} />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
