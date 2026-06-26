import React from 'react'
import { Shield, Wifi, WifiOff, Zap, Battery, BatteryLow } from 'lucide-react'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'
import clsx from 'clsx'

export default function StatusBar() {
  const { stats, vpnConnected, settings } = useBrowserStore()
  const activeTab = useActiveTab()

  const isSecure = activeTab?.url?.startsWith('https://')

  return (
    <div className="flex items-center h-5 px-3 bg-surface-950/80 border-t border-surface-800/40 flex-shrink-0">
      {/* Left: URL on hover */}
      <div className="flex-1 flex items-center gap-3">
        {activeTab?.url && activeTab.url !== 'rihadx://newtab' && (
          <span className="text-[10px] text-surface-600 truncate max-w-[300px]">
            {activeTab.url}
          </span>
        )}
      </div>

      {/* Center: security indicators */}
      <div className="flex items-center gap-3">
        {/* Shield status */}
        <div className={clsx(
          'flex items-center gap-1',
          settings.ad_blocker ? 'text-emerald-500' : 'text-surface-600'
        )}>
          <Shield size={9} />
          <span className="text-[10px]">
            {settings.ad_blocker ? 'Protected' : 'Unprotected'}
          </span>
        </div>

        {/* Blocks today */}
        {(stats.adsBlocked + stats.trackersBlocked) > 0 && (
          <span className="text-[10px] text-emerald-500/70">
            {stats.adsBlocked + stats.trackersBlocked} blocked
          </span>
        )}

        {/* VPN */}
        {vpnConnected && (
          <div className="flex items-center gap-1 text-brand-400">
            <Wifi size={9} />
            <span className="text-[10px]">VPN Active</span>
          </div>
        )}

        {/* RAM Saver */}
        {settings.ram_saver && (
          <div className="flex items-center gap-1 text-amber-500/70">
            <Zap size={9} />
            <span className="text-[10px]">RAM Saver</span>
          </div>
        )}

        {/* Battery Saver */}
        {settings.battery_saver && (
          <div className="flex items-center gap-1 text-emerald-500/70">
            <Battery size={9} />
            <span className="text-[10px]">Battery Saver</span>
          </div>
        )}
      </div>

      {/* Right: connection & HTTPS */}
      <div className="flex items-center gap-2 ml-3">
        {isSecure && (
          <span className="text-[10px] text-emerald-500/60">HTTPS</span>
        )}
        {settings.doh_enabled && (
          <span className="text-[10px] text-surface-600">DoH</span>
        )}
        <span className="text-[10px] text-surface-700">RihadX Browser</span>
      </div>
    </div>
  )
}
