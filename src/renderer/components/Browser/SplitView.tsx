import React from 'react'
import { PanelResizeHandle, Panel, PanelGroup } from 'react-resizable-panels'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'
import { X } from 'lucide-react'

export default function SplitView() {
  const { splitTabId, setSplitScreen, tabs } = useBrowserStore()
  const activeTab = useActiveTab()
  const splitTab = tabs.find(t => t.id === splitTabId)

  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Primary panel */}
      <Panel defaultSize={50} minSize={25}>
        <div className="h-full relative bg-surface-950">
          <div className="absolute top-2 right-2 z-10">
            <div className="glass rounded-lg px-2 py-1 text-[10px] text-surface-400 border border-surface-700/40">
              {activeTab?.title || 'Primary'}
            </div>
          </div>
          {/* BrowserView renders here via Electron */}
        </div>
      </Panel>

      {/* Resize handle */}
      <PanelResizeHandle className="w-1 bg-surface-800 hover:bg-brand-500/50 transition-colors cursor-col-resize group relative">
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-brand-500/10 transition-colors" />
      </PanelResizeHandle>

      {/* Secondary panel */}
      <Panel defaultSize={50} minSize={25}>
        <div className="h-full relative bg-surface-950">
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            <div className="glass rounded-lg px-2 py-1 text-[10px] text-surface-400 border border-surface-700/40">
              {splitTab?.title || 'Secondary'}
            </div>
            <button
              onClick={() => setSplitScreen(false)}
              className="glass border border-surface-700/40 rounded-lg w-5 h-5 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
            >
              <X size={10} />
            </button>
          </div>
          {/* Second BrowserView renders here via Electron */}
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-surface-600">
              <p className="text-sm">Split Screen</p>
              <p className="text-xs mt-1">Drag a tab here or open a new tab</p>
            </div>
          </div>
        </div>
      </Panel>
    </PanelGroup>
  )
}
