import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Shield, Globe, Zap, ChevronRight, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrowserStore } from '../../store/browserStore'
import { VpnServer } from '@shared/types'
import clsx from 'clsx'

export default function VPNPanel() {
  const { vpnConnected, setVpnConnected } = useBrowserStore()
  const [servers, setServers] = useState<VpnServer[]>([])
  const [selectedServer, setSelectedServer] = useState<VpnServer | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectedServer, setConnectedServer] = useState<VpnServer | null>(null)
  const [connectedAt, setConnectedAt] = useState<number | null>(null)
  const [pings, setPings] = useState<Record<string, number>>({})

  // Mock server list (real list comes from VpnManager via IPC)
  const mockServers: VpnServer[] = [
    { id: 'us-1', name: 'New York',   country: 'United States', flag: '🇺🇸', ping: 45,  load: 32 },
    { id: 'de-1', name: 'Frankfurt',  country: 'Germany',       flag: '🇩🇪', ping: 88,  load: 45 },
    { id: 'sg-1', name: 'Singapore',  country: 'Singapore',     flag: '🇸🇬', ping: 130, load: 28 },
    { id: 'bd-1', name: 'Dhaka',      country: 'Bangladesh',    flag: '🇧🇩', ping: 12,  load: 15 },
    { id: 'nl-1', name: 'Amsterdam',  country: 'Netherlands',   flag: '🇳🇱', ping: 92,  load: 38 },
    { id: 'uk-1', name: 'London',     country: 'United Kingdom',flag: '🇬🇧', ping: 78,  load: 55 },
  ] as any

  useEffect(() => {
    setServers(mockServers)
    if (!selectedServer) setSelectedServer(mockServers[0])
  }, [])

  async function connect() {
    if (!selectedServer || connecting) return
    setConnecting(true)
    await new Promise(r => setTimeout(r, 1800)) // Simulate connection time
    setConnecting(false)
    setConnectedServer(selectedServer)
    setConnectedAt(Date.now())
    setVpnConnected(true)
    useBrowserStore.getState().setSetting('vpn_enabled', true)
  }

  async function disconnect() {
    setConnectedServer(null)
    setConnectedAt(null)
    setVpnConnected(false)
    useBrowserStore.getState().setSetting('vpn_enabled', false)
  }

  function getElapsedTime() {
    if (!connectedAt) return '0:00'
    const secs = Math.floor((Date.now() - connectedAt) / 1000)
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${m}:${String(s).padStart(2,'0')}`
  }

  function pingColor(ping?: number) {
    if (!ping) return 'text-surface-500'
    if (ping < 60)  return 'text-emerald-400'
    if (ping < 120) return 'text-amber-400'
    return 'text-rose-400'
  }

  function pingLabel(ping?: number) {
    if (!ping) return '—'
    if (ping < 60)  return 'Excellent'
    if (ping < 120) return 'Good'
    return 'Fair'
  }

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Status Header */}
      <div className={clsx(
        'p-5 transition-colors duration-500',
        vpnConnected ? 'bg-emerald-500/10' : 'bg-surface-800/50'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
              vpnConnected ? 'bg-emerald-500/20' : 'bg-surface-700'
            )}>
              {connecting
                ? <Loader2 size={20} className="text-brand-400 animate-spin" />
                : vpnConnected
                  ? <Shield size={20} className="text-emerald-400 shield-active" />
                  : <WifiOff size={20} className="text-surface-400" />
              }
            </div>
            <div>
              <div className={clsx('text-sm font-semibold', vpnConnected ? 'text-emerald-400' : 'text-surface-300')}>
                {connecting ? 'Connecting...' : vpnConnected ? 'Protected' : 'Not Protected'}
              </div>
              <div className="text-xs text-surface-500">
                {vpnConnected && connectedServer
                  ? `${connectedServer.flag} ${connectedServer.name} · ${getElapsedTime()}`
                  : 'Your IP is visible'
                }
              </div>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={vpnConnected ? disconnect : connect}
            disabled={connecting}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95',
              vpnConnected
                ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand',
              connecting && 'opacity-60 cursor-not-allowed'
            )}
          >
            {vpnConnected ? 'Disconnect' : connecting ? 'Connecting…' : 'Connect'}
          </button>
        </div>

        {/* Stats row */}
        {vpnConnected && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              { label: 'Protocol', value: 'WireGuard' },
              { label: 'Encryption', value: 'AES-256' },
              { label: 'DNS Leak', value: 'Protected' },
            ].map(stat => (
              <div key={stat.label} className="bg-emerald-500/5 rounded-lg px-2 py-1.5 text-center border border-emerald-500/10">
                <div className="text-[10px] text-surface-500">{stat.label}</div>
                <div className="text-xs text-emerald-400 font-medium">{stat.value}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto scroll-panel p-3">
        <div className="text-[10px] text-surface-600 uppercase tracking-wider px-1 mb-2 font-semibold">
          Select Server
        </div>
        <div className="space-y-1">
          {servers.map(server => {
            const isSelected  = selectedServer?.id === server.id
            const isConnected = connectedServer?.id === server.id

            return (
              <motion.button
                key={server.id}
                onClick={() => setSelectedServer(server)}
                whileHover={{ x: 2 }}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                  isSelected
                    ? 'bg-brand-500/10 border border-brand-500/20'
                    : 'hover:bg-surface-800/70 border border-transparent'
                )}
              >
                {/* Flag */}
                <span className="text-xl flex-shrink-0">{(server as any).flag}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-surface-200 truncate">{server.name}</span>
                    {isConnected && (
                      <span className="badge badge-green text-[9px]">Active</span>
                    )}
                  </div>
                  <div className="text-[10px] text-surface-500">{server.country}</div>
                </div>

                {/* Ping */}
                <div className="text-right flex-shrink-0">
                  <div className={clsx('text-xs font-medium', pingColor((server as any).ping))}>
                    {(server as any).ping}ms
                  </div>
                  <div className="text-[9px] text-surface-600">
                    {(server as any).load}% load
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <Check size={14} className="text-brand-400" />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Privacy note */}
        <div className="mt-4 p-3 rounded-xl bg-surface-800/40 border border-surface-700/30">
          <div className="flex items-start gap-2">
            <Shield size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-surface-500 leading-relaxed">
              RihadX VPN uses WireGuard protocol with AES-256 encryption. No logs are kept. Your real IP is hidden from websites you visit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
