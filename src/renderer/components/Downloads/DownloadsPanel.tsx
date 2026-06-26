import React, { useEffect } from 'react'
import { Download, X, FolderOpen, ExternalLink, Trash2, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBrowserStore } from '../../store/browserStore'
import { Download as DL } from '@shared/types'
import clsx from 'clsx'

export default function DownloadsPanel() {
  const { downloads, setDownloads, updateDownload } = useBrowserStore()

  useEffect(() => {
    window.rihadx?.downloads.list().then(setDownloads)
  }, [])

  function formatSize(bytes?: number) {
    if (!bytes) return '–'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  }

  function formatTime(ts: number) {
    return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  async function deleteDownload(id: number) {
    await window.rihadx?.downloads.delete(id)
    setDownloads(downloads.filter(d => d.id !== id))
  }

  const statusColor: Record<string, string> = {
    completed:   'text-emerald-400',
    downloading: 'text-brand-400',
    failed:      'text-rose-400',
    cancelled:   'text-surface-500',
    pending:     'text-amber-400',
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 280, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-surface-800/60 bg-surface-900 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-surface-800/40">
        <Download size={14} className="text-brand-400 mr-2" />
        <h3 className="text-sm font-semibold text-white">Downloads</h3>
        <span className="ml-2 text-xs text-surface-500">({downloads.length})</span>
        <button
          onClick={() => useBrowserStore.getState().setDownloads([])}
          className="ml-auto text-xs text-surface-500 hover:text-rose-400 transition-colors flex items-center gap-1"
        >
          <Trash2 size={11} /> Clear all
        </button>
        <button
          onClick={() => useBrowserStore.setState({ downloadsOpen: false })}
          className="ml-3 btn-icon w-6 h-6"
        >
          <ChevronDown size={13} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scroll-panel px-3 py-2 space-y-1.5">
        {downloads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-surface-600">
            <Download size={24} />
            <p className="text-xs mt-2">No downloads</p>
          </div>
        )}

        {downloads.map(dl => (
          <DownloadRow
            key={dl.id}
            dl={dl}
            onDelete={() => deleteDownload(dl.id)}
            onOpen={() => dl.save_path && window.rihadx?.downloads.open(dl.save_path)}
            onShow={() => dl.save_path && window.rihadx?.downloads.show(dl.save_path)}
            formatSize={formatSize}
            formatTime={formatTime}
            statusColor={statusColor}
          />
        ))}
      </div>
    </motion.div>
  )
}

function DownloadRow({ dl, onDelete, onOpen, onShow, formatSize, formatTime, statusColor }: {
  dl: DL
  onDelete: () => void
  onOpen: () => void
  onShow: () => void
  formatSize: (n?: number) => string
  formatTime: (n: number) => string
  statusColor: Record<string, string>
}) {
  const progress = dl.file_size ? Math.round((dl.downloaded / dl.file_size) * 100) : 0

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/20 group">
      {/* File icon */}
      <div className="w-9 h-9 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
        <Download size={16} className={statusColor[dl.status] || 'text-surface-400'} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-surface-200 truncate">{dl.filename}</span>
          <span className={clsx('text-[10px]', statusColor[dl.status])}>{dl.status}</span>
        </div>

        {dl.status === 'downloading' ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-700 rounded-full h-1">
              <div
                className="bg-brand-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-surface-500 flex-shrink-0">
              {formatSize(dl.downloaded)} / {formatSize(dl.file_size)} · {progress}%
            </span>
          </div>
        ) : (
          <div className="text-[10px] text-surface-500">
            {formatSize(dl.file_size)} · {formatTime(dl.started_at)}
            {dl.error && <span className="text-rose-400 ml-2">{dl.error}</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {dl.status === 'completed' && dl.save_path && (
          <>
            <button onClick={onOpen} className="btn-icon w-7 h-7" title="Open file">
              <ExternalLink size={12} />
            </button>
            <button onClick={onShow} className="btn-icon w-7 h-7" title="Show in folder">
              <FolderOpen size={12} />
            </button>
          </>
        )}
        <button onClick={onDelete} className="btn-icon w-7 h-7 text-rose-400 hover:bg-rose-500/10" title="Remove">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
