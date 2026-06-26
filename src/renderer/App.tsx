import React, { useEffect } from 'react'
import { useBrowserStore } from './store/browserStore'
import BrowserLayout from './components/Browser/BrowserLayout'
import SettingsPage from './pages/SettingsPage'
import { AnimatePresence, motion } from 'framer-motion'

declare global {
  interface Window {
    rihadx: any
  }
}

export default function App() {
  const { settingsPage, setSettings, setStats, setUpdateAvailable } = useBrowserStore()

  // Load settings on startup
  useEffect(() => {
    async function init() {
      if (!window.rihadx) return
      const all = await window.rihadx.settings.all()
      setSettings({
        theme:                 all.theme,
        homepage:              all.homepage,
        search_engine:         all.search_engine,
        https_only:            all.https_only === 'true',
        ad_blocker:            all.ad_blocker === 'true',
        tracker_blocker:       all.tracker_blocker === 'true',
        anti_fingerprinting:   all.anti_fingerprinting === 'true',
        doh_enabled:           all.doh_enabled === 'true',
        vpn_enabled:           all.vpn_enabled === 'true',
        tab_layout:            all.tab_layout,
        dark_mode:             all.dark_mode === 'true',
        ram_saver:             all.ram_saver === 'true',
        battery_saver:         all.battery_saver === 'true',
        font_size:             Number(all.font_size) || 16,
        zoom_level:            Number(all.zoom_level) || 1,
        password_manager:      all.password_manager === 'true',
        ai_assistant:          all.ai_assistant === 'true',
      })

      // Poll security stats every 5s
      const statsInterval = setInterval(async () => {
        const stats = await window.rihadx.security.stats()
        setStats(stats)
      }, 5000)

      // Auto-updater events
      window.rihadx.onUpdate(({ event, info }: any) => {
        if (event === 'available') setUpdateAvailable(true, info)
        if (event === 'downloaded') setUpdateAvailable(true, info)
      })

      return () => clearInterval(statsInterval)
    }
    init()
  }, [])

  return (
    <div className="w-full h-screen flex flex-col bg-surface-950 text-surface-100 overflow-hidden">
      <AnimatePresence mode="wait">
        {settingsPage ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <SettingsPage />
          </motion.div>
        ) : (
          <motion.div
            key="browser"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full"
          >
            <BrowserLayout />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
