// ─── Tab Types ────────────────────────────────────────────────────────────
export interface Tab {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  isIncognito: boolean
  isPinned: boolean
  isAudioMuted: boolean
  groupId?: string
  scrollY?: number
  zoom?: number
  error?: TabError
}

export interface TabError {
  code: number
  description: string
  url: string
}

export interface TabGroup {
  id: string
  name: string
  color: string
  tabIds: string[]
  collapsed: boolean
}

// ─── History ──────────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: number
  url: string
  title: string
  visit_count: number
  last_visit: number
  favicon_url?: string
}

// ─── Bookmarks ────────────────────────────────────────────────────────────
export interface Bookmark {
  id: number
  url: string
  title: string
  folder_id?: number
  favicon_url?: string
  created_at: number
  tags: string[]
}

export interface BookmarkFolder {
  id: number
  name: string
  parent_id?: number
  created_at: number
}

// ─── Passwords ────────────────────────────────────────────────────────────
export interface SavedPassword {
  id: number
  domain: string
  username: string
  password?: string // Only present when explicitly fetched
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'unknown'
  created_at: number
  last_used?: number
}

// ─── Downloads ────────────────────────────────────────────────────────────
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled' | 'paused'

export interface Download {
  id: number
  url: string
  filename: string
  save_path?: string
  file_size?: number
  downloaded: number
  status: DownloadStatus
  started_at: number
  completed_at?: number
  mime_type?: string
  error?: string
}

// ─── Settings ─────────────────────────────────────────────────────────────
export interface BrowserSettings {
  theme: 'dark' | 'light' | 'system'
  homepage: string
  search_engine: 'duckduckgo' | 'google' | 'bing' | 'brave' | 'custom'
  https_only: boolean
  ad_blocker: boolean
  tracker_blocker: boolean
  anti_fingerprinting: boolean
  doh_enabled: boolean
  doh_server: string
  malware_protection: boolean
  phishing_protection: boolean
  vpn_enabled: boolean
  tab_layout: 'horizontal' | 'vertical'
  reader_mode_auto: boolean
  dark_mode: boolean
  ram_saver: boolean
  battery_saver: boolean
  sync_enabled: boolean
  notifications_enabled: boolean
  font_size: number
  zoom_level: number
  language: string
  download_path: string
  ask_before_download: boolean
  password_manager: boolean
  ai_assistant: boolean
}

// ─── Extensions ───────────────────────────────────────────────────────────
export interface Extension {
  id: number
  ext_id: string
  name: string
  version: string
  description: string
  icon_url?: string
  enabled: boolean
  installed_at: number
  permissions: string[]
  settings: Record<string, any>
}

// ─── Security Stats ───────────────────────────────────────────────────────
export interface SecurityStats {
  adsBlocked: number
  trackersBlocked: number
  bandwidthSaved: number
}

// ─── Search ───────────────────────────────────────────────────────────────
export interface SearchSuggestion {
  type: 'url' | 'search' | 'history' | 'bookmark'
  text: string
  url: string
  favicon?: string
  description?: string
}

// ─── VPN ──────────────────────────────────────────────────────────────────
export type VpnStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface VpnServer {
  id: string
  name: string
  country: string
  flag: string
  ping?: number
  load?: number
}
