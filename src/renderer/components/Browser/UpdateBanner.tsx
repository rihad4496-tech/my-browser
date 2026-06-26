import React from 'react'
import { Download, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBrowserStore } from '../../store/browserStore'

export default function UpdateBanner() {
  const { updateInfo, setUpdateAvailable } = useBrowserStore()

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 36, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="flex items-center justify-between px-4 bg-brand-600/20 border-b border-brand-500/30 text-xs overflow-hidden flex-shrink-0"
    >
      <div className="flex items-center gap-2 text-brand-300">
        <Download size={12} />
        <span>
          {updateInfo?.version
            ? `RihadX Browser v${updateInfo.version} is ready to install`
            : 'An update is available for RihadX Browser'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.rihadx?.installUpdate()}
          className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
        >
          Restart & Update
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="btn-icon w-5 h-5 text-brand-400"
        >
          <X size={11} />
        </button>
      </div>
    </motion.div>
  )
}
