import React, { useState, useEffect } from 'react'
import {
  ArrowLeft, Shield, Globe, Palette, Download, Key, Zap,
  Battery, Bell, Languages, Wifi, Bot, Puzzle, RefreshCw,
  Info, ChevronRight, ToggleLeft, ToggleRight, Lock, Eye
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useBrowserStore } from '../store/browserStore'
import clsx from 'clsx'

const SECTIONS = [
  { id: 'general',    icon: Globe,     label: 'General' },
  { id: 'privacy',    icon: Shield,    label: 'Privacy & Security' },
  { id: 'appearance', icon: Palette,   label: 'Appearance' },
  { id: 'downloads',  icon: Download,  label: 'Downloads' },
  { id: 'passwords',  icon: Key,       label: 'Passwords' },
  { id: 'performance',icon: Zap,       label: 'Performance' },
  { id: 'ai',         icon: Bot,       label: 'AI Assistant' },
  { id: 'extensions', icon: Puzzle,    label: 'Extensions' },
  { id: 'updates',    icon: RefreshCw, label: 'Updates' },
  { id: 'about',      icon: Info,      label: 'About' },
]

export default function SettingsPage() {
  const { settingsPage, setSettingsPage, settings, setSetting, setSettings } = useBrowserStore()
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    window.rihadx?.app.version().then(setVersion).catch(() => {})
    window.rihadx?.settings.all().then((all: any) => {
      setSettings({
        theme:               all.theme,
        homepage:            all.homepage,
        search_engine:       all.search_engine,
        https_only:          all.https_only === 'true',
        ad_blocker:          all.ad_blocker === 'true',
        tracker_blocker:     all.tracker_blocker === 'true',
        anti_fingerprinting: all.anti_fingerprinting === 'true',
        doh_enabled:         all.doh_enabled === 'true',
        doh_server:          all.doh_server,
        malware_protection:  all.malware_protection === 'true',
        phishing_protection: all.phishing_protection === 'true',
        vpn_enabled:         all.vpn_enabled === 'true',
        tab_layout:          all.tab_layout,
        dark_mode:           all.dark_mode === 'true',
        ram_saver:           all.ram_saver === 'true',
        battery_saver:       all.battery_saver === 'true',
        font_size:           Number(all.font_size) || 16,
        download_path:       all.download_path,
        ask_before_download: all.ask_before_download === 'true',
        password_manager:    all.password_manager === 'true',
        ai_assistant:        all.ai_assistant === 'true',
      })
    }).catch(() => {})
  }, [])

  async function update(key: string, value: any) {
    setSetting(key as any, value)
    await window.rihadx?.settings.set(key, String(value))
  }

  const currentSection = settingsPage || 'general'

  return (
    <div className="flex h-full bg-surface-950 text-surface-100">
      {/* Sidebar Navigation */}
      <div className="w-56 flex-shrink-0 border-r border-surface-800/60 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-surface-800/60">
          <button
            onClick={() => setSettingsPage(null)}
            className="btn-icon w-7 h-7"
            title="Back to browser"
          >
            <ArrowLeft size={15} />
          </button>
          <h1 className="font-semibold text-white">Settings</h1>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scroll-panel">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setSettingsPage(s.id)}
                className={clsx('sidebar-item w-full', currentSection === s.id && 'active')}
              >
                <Icon size={15} />
                <span className="text-sm">{s.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Version */}
        <div className="p-4 border-t border-surface-800/60">
          <p className="text-[10px] text-surface-600">RihadX Browser v{version}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-panel">
        <div className="max-w-2xl mx-auto p-8">
          {currentSection === 'general'    && <GeneralSettings settings={settings} update={update} />}
          {currentSection === 'privacy'    && <PrivacySettings settings={settings} update={update} />}
          {currentSection === 'appearance' && <AppearanceSettings settings={settings} update={update} />}
          {currentSection === 'downloads'  && <DownloadSettings settings={settings} update={update} />}
          {currentSection === 'passwords'  && <PasswordSettings settings={settings} />}
          {currentSection === 'performance'&& <PerformanceSettings settings={settings} update={update} />}
          {currentSection === 'ai'         && <AISettings settings={settings} update={update} />}
          {currentSection === 'extensions' && <ExtensionSettings />}
          {currentSection === 'updates'    && <UpdateSettings version={version} />}
          {currentSection === 'about'      && <AboutPage version={version} />}
        </div>
      </div>
    </div>
  )
}

// ─── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={clsx(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        value ? 'bg-brand-600' : 'bg-surface-700'
      )}
    >
      <div className={clsx(
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
        value ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  )
}

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-surface-800/40 last:border-0">
      <div className="flex-1 mr-4">
        <div className="text-sm font-medium text-surface-200">{label}</div>
        {description && <div className="text-xs text-surface-500 mt-0.5">{description}</div>}
      </div>
      {children}
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      {description && <p className="text-sm text-surface-400">{description}</p>}
      <div className="h-px bg-surface-800 mt-4" />
    </div>
  )
}

// ─── General Settings ──────────────────────────────────────────────────────
function GeneralSettings({ settings, update }: any) {
  return (
    <div>
      <SectionHeader title="General" description="Basic browser preferences" />
      <SettingRow label="Homepage" description="Page shown when opening a new tab">
        <input
          value={settings.homepage || ''}
          onChange={e => update('homepage', e.target.value)}
          className="input-base w-64 text-xs"
          placeholder="https://..."
        />
      </SettingRow>
      <SettingRow label="Search Engine" description="Default search engine for address bar">
        <select
          value={settings.search_engine || 'duckduckgo'}
          onChange={e => update('search_engine', e.target.value)}
          className="input-base w-40 text-xs"
        >
          <option value="duckduckgo">DuckDuckGo</option>
          <option value="google">Google</option>
          <option value="bing">Bing</option>
          <option value="brave">Brave Search</option>
        </select>
      </SettingRow>
      <SettingRow label="Tab Layout" description="Horizontal or vertical tab bar">
        <select
          value={settings.tab_layout || 'horizontal'}
          onChange={e => update('tab_layout', e.target.value)}
          className="input-base w-40 text-xs"
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </SettingRow>
      <SettingRow label="Language" description="Browser interface language">
        <select className="input-base w-40 text-xs" defaultValue="en">
          <option value="en">English</option>
          <option value="bn">বাংলা</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </SettingRow>
    </div>
  )
}

// ─── Privacy Settings ──────────────────────────────────────────────────────
function PrivacySettings({ settings, update }: any) {
  return (
    <div>
      <SectionHeader title="Privacy & Security" description="Control your digital footprint" />
      <SettingRow label="Ad Blocker" description="Block intrusive advertisements">
        <Toggle value={!!settings.ad_blocker} onChange={v => update('ad_blocker', v)} />
      </SettingRow>
      <SettingRow label="Tracker Blocker" description="Block cross-site tracking scripts">
        <Toggle value={!!settings.tracker_blocker} onChange={v => update('tracker_blocker', v)} />
      </SettingRow>
      <SettingRow label="Anti-Fingerprinting" description="Prevent browser fingerprinting">
        <Toggle value={!!settings.anti_fingerprinting} onChange={v => update('anti_fingerprinting', v)} />
      </SettingRow>
      <SettingRow label="HTTPS-Only Mode" description="Automatically upgrade connections to HTTPS">
        <Toggle value={!!settings.https_only} onChange={v => update('https_only', v)} />
      </SettingRow>
      <SettingRow label="DNS-over-HTTPS" description="Encrypt DNS queries">
        <Toggle value={!!settings.doh_enabled} onChange={v => update('doh_enabled', v)} />
      </SettingRow>
      {settings.doh_enabled && (
        <SettingRow label="DoH Server" description="HTTPS endpoint for encrypted DNS">
          <input
            value={settings.doh_server || ''}
            onChange={e => update('doh_server', e.target.value)}
            className="input-base w-64 text-xs"
            placeholder="https://cloudflare-dns.com/dns-query"
          />
        </SettingRow>
      )}
      <SettingRow label="Malware Protection" description="Block known malicious websites">
        <Toggle value={!!settings.malware_protection} onChange={v => update('malware_protection', v)} />
      </SettingRow>
      <SettingRow label="Phishing Protection" description="Warn about deceptive sites">
        <Toggle value={!!settings.phishing_protection} onChange={v => update('phishing_protection', v)} />
      </SettingRow>

      {/* Clear Data */}
      <div className="mt-6 pt-6 border-t border-surface-800/40">
        <h3 className="text-sm font-semibold text-white mb-3">Clear Browsing Data</h3>
        <div className="space-y-2">
          {[
            { key: 'cache', label: 'Cached images and files' },
            { key: 'cookies', label: 'Cookies and site data' },
            { key: 'history', label: 'Browsing history' },
            { key: 'localStorage', label: 'Local storage' },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-brand-500 w-3.5 h-3.5" />
              <span className="text-sm text-surface-300">{item.label}</span>
            </label>
          ))}
          <button
            onClick={() => window.rihadx?.security.clearData(['cache','cookies','history','localStorage'])}
            className="mt-3 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
          >
            Clear Data
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Appearance Settings ───────────────────────────────────────────────────
function AppearanceSettings({ settings, update }: any) {
  return (
    <div>
      <SectionHeader title="Appearance" description="Customize how RihadX looks" />
      <SettingRow label="Theme" description="Browser color scheme">
        <select
          value={settings.theme || 'dark'}
          onChange={e => update('theme', e.target.value)}
          className="input-base w-32 text-xs"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </SettingRow>
      <SettingRow label="Font Size" description="Base font size for web pages">
        <div className="flex items-center gap-2">
          <input
            type="range" min="12" max="24"
            value={settings.font_size || 16}
            onChange={e => update('font_size', Number(e.target.value))}
            className="w-24 accent-brand-500"
          />
          <span className="text-sm text-surface-300 w-8">{settings.font_size || 16}px</span>
        </div>
      </SettingRow>
      <SettingRow label="Reader Mode" description="Auto-enable simplified reading view">
        <Toggle value={!!settings.reader_mode_auto} onChange={v => update('reader_mode_auto', v)} />
      </SettingRow>
    </div>
  )
}

// ─── Download Settings ─────────────────────────────────────────────────────
function DownloadSettings({ settings, update }: any) {
  return (
    <div>
      <SectionHeader title="Downloads" description="Configure download behavior" />
      <SettingRow label="Ask Before Downloading" description="Show dialog to choose save location">
        <Toggle value={!!settings.ask_before_download} onChange={v => update('ask_before_download', v)} />
      </SettingRow>
      <SettingRow label="Download Location" description="Default folder for downloaded files">
        <div className="flex gap-2">
          <input value={settings.download_path || 'default'} readOnly className="input-base w-48 text-xs" />
          <button
            onClick={async () => {
              const path = await window.rihadx?.downloads.saveDialog()
              if (path) update('download_path', path)
            }}
            className="btn-ghost text-xs px-3"
          >
            Browse
          </button>
        </div>
      </SettingRow>
    </div>
  )
}

// ─── Password Settings ─────────────────────────────────────────────────────
function PasswordSettings({ settings }: any) {
  const [passwords, setPasswords] = useState<any[]>([])
  useEffect(() => { window.rihadx?.passwords.all().then(setPasswords) }, [])

  return (
    <div>
      <SectionHeader title="Password Manager" description="Securely stored passwords" />
      <p className="text-sm text-surface-400 mb-4">
        {passwords.length} saved password{passwords.length !== 1 ? 's' : ''}
      </p>
      <div className="space-y-2">
        {passwords.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/60 border border-surface-700/30">
            <Globe size={15} className="text-surface-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-surface-200 truncate">{p.domain}</div>
              <div className="text-xs text-surface-500">{p.username}</div>
            </div>
            <button
              onClick={() => { window.rihadx?.passwords.delete(p.id); setPasswords(prev => prev.filter(x => x.id !== p.id)) }}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
        {passwords.length === 0 && (
          <p className="text-sm text-surface-600 text-center py-8">No saved passwords yet.</p>
        )}
      </div>
    </div>
  )
}

// ─── Performance Settings ──────────────────────────────────────────────────
function PerformanceSettings({ settings, update }: any) {
  return (
    <div>
      <SectionHeader title="Performance" description="Optimize browser speed and resources" />
      <SettingRow label="RAM Saver" description="Suspend inactive tabs to free memory">
        <Toggle value={!!settings.ram_saver} onChange={v => update('ram_saver', v)} />
      </SettingRow>
      <SettingRow label="Battery Saver" description="Reduce background activity on battery power">
        <Toggle value={!!settings.battery_saver} onChange={v => update('battery_saver', v)} />
      </SettingRow>
      <SettingRow label="Hardware Acceleration" description="Use GPU for faster rendering">
        <Toggle value={true} onChange={() => {}} />
      </SettingRow>
    </div>
  )
}

// ─── AI Settings ───────────────────────────────────────────────────────────
function AISettings({ settings, update }: any) {
  return (
    <div>
      <SectionHeader title="AI Assistant" description="Configure the built-in AI" />
      <SettingRow label="Enable AI Assistant" description="Show AI chat sidebar panel">
        <Toggle value={!!settings.ai_assistant} onChange={v => update('ai_assistant', v)} />
      </SettingRow>
      <div className="mt-4 p-4 rounded-xl bg-surface-800/60 border border-surface-700/30">
        <div className="flex items-center gap-2 mb-2">
          <Bot size={15} className="text-brand-400" />
          <span className="text-sm font-medium text-white">Powered by Claude</span>
        </div>
        <p className="text-xs text-surface-400">
          The AI assistant is powered by Anthropic's Claude model. Conversations are not stored
          and are only used to provide responses within your current session.
        </p>
      </div>
    </div>
  )
}

// ─── Extension Settings ────────────────────────────────────────────────────
function ExtensionSettings() {
  return (
    <div>
      <SectionHeader title="Extensions" description="Manage browser extensions" />
      <div className="p-8 text-center text-surface-500">
        <Puzzle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">Extension marketplace coming soon.</p>
        <p className="text-xs mt-1">Chrome extensions will be supported via Electron's extension API.</p>
      </div>
    </div>
  )
}

// ─── Update Settings ───────────────────────────────────────────────────────
function UpdateSettings({ version }: { version: string }) {
  const { updateAvailable } = useBrowserStore()
  return (
    <div>
      <SectionHeader title="Updates" description="Keep RihadX Browser up to date" />
      <div className="p-4 rounded-xl bg-surface-800/60 border border-surface-700/30 mb-4">
        <div className="text-sm text-surface-200 mb-1">Current version: <strong>v{version}</strong></div>
        {updateAvailable
          ? <p className="text-sm text-amber-400">⚡ An update is ready to install.</p>
          : <p className="text-sm text-emerald-400">✓ You're on the latest version.</p>
        }
      </div>
      {updateAvailable && (
        <button
          onClick={() => window.rihadx?.installUpdate()}
          className="btn-primary"
        >
          Restart & Install Update
        </button>
      )}
    </div>
  )
}

// ─── About Page ────────────────────────────────────────────────────────────
function AboutPage({ version }: { version: string }) {
  return (
    <div>
      <SectionHeader title="About RihadX Browser" />
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center shadow-glow-brand">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Globe size={22} className="text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold gradient-text">RihadX Browser</h2>
          <p className="text-surface-400 text-sm">Version {version}</p>
          <p className="text-surface-500 text-xs mt-0.5">Built by Rihad · Powered by Chromium & Electron</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-surface-400">
        {[
          ['Engine', 'Chromium (via Electron)'],
          ['Framework', 'React + TypeScript'],
          ['Database', 'SQLite (better-sqlite3)'],
          ['Platform', navigator.platform],
          ['License', 'MIT'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-2 border-b border-surface-800/40">
            <span className="text-surface-500">{label}</span>
            <span className="text-surface-200">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => window.rihadx?.shell.openExternal('https://rihadx.com')}
          className="btn-ghost text-sm"
        >
          🌐 Website
        </button>
        <button
          onClick={() => window.rihadx?.shell.openExternal('https://github.com/rihadx/browser')}
          className="btn-ghost text-sm"
        >
          🐙 GitHub
        </button>
        <button
          onClick={() => window.rihadx?.shell.openExternal('https://rihadx.com/privacy')}
          className="btn-ghost text-sm"
        >
          🔒 Privacy Policy
        </button>
      </div>
    </div>
  )
}
