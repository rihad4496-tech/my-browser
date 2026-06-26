import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import crypto from 'crypto'

let db: Database.Database

const DB_PATH = path.join(app.getPath('userData'), 'rihadx.db')

const SCHEMA = `
  -- Browser History
  CREATE TABLE IF NOT EXISTS history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    url         TEXT NOT NULL,
    title       TEXT,
    visit_count INTEGER DEFAULT 1,
    last_visit  INTEGER DEFAULT (strftime('%s', 'now')),
    favicon_url TEXT,
    is_incognito INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
  CREATE INDEX IF NOT EXISTS idx_history_last_visit ON history(last_visit);

  -- Bookmarks
  CREATE TABLE IF NOT EXISTS bookmarks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    url         TEXT NOT NULL,
    title       TEXT,
    folder_id   INTEGER,
    favicon_url TEXT,
    created_at  INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at  INTEGER DEFAULT (strftime('%s', 'now')),
    tags        TEXT DEFAULT '[]'
  );

  -- Bookmark Folders
  CREATE TABLE IF NOT EXISTS bookmark_folders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    parent_id   INTEGER,
    created_at  INTEGER DEFAULT (strftime('%s', 'now'))
  );

  -- Passwords (encrypted)
  CREATE TABLE IF NOT EXISTS passwords (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    domain      TEXT NOT NULL,
    username    TEXT NOT NULL,
    password    TEXT NOT NULL, -- AES-256 encrypted
    created_at  INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at  INTEGER DEFAULT (strftime('%s', 'now')),
    last_used   INTEGER,
    strength    TEXT DEFAULT 'unknown'
  );
  CREATE INDEX IF NOT EXISTS idx_passwords_domain ON passwords(domain);

  -- Downloads
  CREATE TABLE IF NOT EXISTS downloads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    url         TEXT NOT NULL,
    filename    TEXT NOT NULL,
    save_path   TEXT,
    file_size   INTEGER,
    downloaded  INTEGER DEFAULT 0,
    status      TEXT DEFAULT 'pending',
    started_at  INTEGER DEFAULT (strftime('%s', 'now')),
    completed_at INTEGER,
    mime_type   TEXT,
    error       TEXT
  );

  -- Tab Sessions (for restore)
  CREATE TABLE IF NOT EXISTS tab_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL,
    tab_data    TEXT NOT NULL, -- JSON
    created_at  INTEGER DEFAULT (strftime('%s', 'now'))
  );

  -- Extensions
  CREATE TABLE IF NOT EXISTS extensions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ext_id      TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    version     TEXT,
    description TEXT,
    icon_url    TEXT,
    enabled     INTEGER DEFAULT 1,
    installed_at INTEGER DEFAULT (strftime('%s', 'now')),
    permissions TEXT DEFAULT '[]',
    settings    TEXT DEFAULT '{}'
  );

  -- Settings
  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  INTEGER DEFAULT (strftime('%s', 'now'))
  );

  -- Tab Groups
  CREATE TABLE IF NOT EXISTS tab_groups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    color       TEXT DEFAULT '#6366f1',
    collapsed   INTEGER DEFAULT 0,
    created_at  INTEGER DEFAULT (strftime('%s', 'now'))
  );

  -- Block Stats
  CREATE TABLE IF NOT EXISTS block_stats (
    date        TEXT PRIMARY KEY,
    ads_blocked INTEGER DEFAULT 0,
    trackers_blocked INTEGER DEFAULT 0,
    bandwidth_saved INTEGER DEFAULT 0
  );
`

export function setupDatabase() {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  db.exec(SCHEMA)
  seedDefaultSettings()
}

function seedDefaultSettings() {
  const defaults: Record<string, string> = {
    'theme':                  'dark',
    'homepage':               'rihadx://newtab',
    'search_engine':          'duckduckgo',
    'https_only':             'true',
    'ad_blocker':             'true',
    'tracker_blocker':        'true',
    'anti_fingerprinting':    'true',
    'doh_enabled':            'true',
    'doh_server':             'https://cloudflare-dns.com/dns-query',
    'malware_protection':     'true',
    'phishing_protection':    'true',
    'vpn_enabled':            'false',
    'tab_layout':             'horizontal',
    'reader_mode_auto':       'false',
    'dark_mode':              'true',
    'ram_saver':              'false',
    'battery_saver':          'false',
    'sync_enabled':           'false',
    'notifications_enabled':  'true',
    'font_size':              '16',
    'zoom_level':             '1.0',
    'language':               'en',
    'download_path':          'default',
    'ask_before_download':    'true',
    'password_manager':       'true',
    'ai_assistant':           'true',
  }

  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  const insertMany = db.transaction((settings: Record<string, string>) => {
    for (const [key, value] of Object.entries(settings)) {
      insert.run(key, value)
    }
  })
  insertMany(defaults)
}

export function getDb(): Database.Database { return db }

// ─── Query Helpers ─────────────────────────────────────────────────────────

export const HistoryDB = {
  add(url: string, title: string, favicon?: string) {
    const existing = db.prepare('SELECT id, visit_count FROM history WHERE url = ?').get(url) as any
    if (existing) {
      db.prepare('UPDATE history SET visit_count = ?, last_visit = ?, title = ? WHERE id = ?')
        .run(existing.visit_count + 1, Math.floor(Date.now() / 1000), title, existing.id)
    } else {
      db.prepare('INSERT INTO history (url, title, favicon_url) VALUES (?, ?, ?)').run(url, title, favicon || null)
    }
  },
  search(query: string, limit = 20) {
    return db.prepare(
      'SELECT * FROM history WHERE url LIKE ? OR title LIKE ? ORDER BY last_visit DESC LIMIT ?'
    ).all(`%${query}%`, `%${query}%`, limit)
  },
  getRecent(limit = 50) {
    return db.prepare('SELECT * FROM history ORDER BY last_visit DESC LIMIT ?').all(limit)
  },
  clear() { db.prepare('DELETE FROM history').run() },
  delete(id: number) { db.prepare('DELETE FROM history WHERE id = ?').run(id) },
}

export const BookmarksDB = {
  add(url: string, title: string, folderId?: number) {
    const stmt = db.prepare('INSERT INTO bookmarks (url, title, folder_id) VALUES (?, ?, ?)')
    return (stmt.run(url, title, folderId || null) as any).lastInsertRowid
  },
  getAll() { return db.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC').all() },
  delete(id: number) { db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id) },
  search(query: string) {
    return db.prepare('SELECT * FROM bookmarks WHERE url LIKE ? OR title LIKE ?')
      .all(`%${query}%`, `%${query}%`)
  },
  exists(url: string): boolean {
    return !!(db.prepare('SELECT id FROM bookmarks WHERE url = ?').get(url))
  },
}

export const PasswordDB = {
  save(domain: string, username: string, encryptedPassword: string) {
    const stmt = db.prepare(`
      INSERT INTO passwords (domain, username, password)
      VALUES (?, ?, ?)
      ON CONFLICT (rowid) DO UPDATE SET password = excluded.password, updated_at = strftime('%s', 'now')
    `)
    return stmt.run(domain, username, encryptedPassword)
  },
  getForDomain(domain: string) {
    return db.prepare('SELECT id, domain, username, password FROM passwords WHERE domain = ?').all(domain)
  },
  delete(id: number) { db.prepare('DELETE FROM passwords WHERE id = ?').run(id) },
  getAll() { return db.prepare('SELECT id, domain, username, strength FROM passwords').all() },
}

export const SettingsDB = {
  get(key: string): string | null {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any
    return row?.value ?? null
  },
  set(key: string, value: string) {
    db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = strftime('%s', 'now')`)
      .run(key, value)
  },
  getAll(): Record<string, string> {
    const rows = db.prepare('SELECT key, value FROM settings').all() as any[]
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  },
}

export const DownloadsDB = {
  add(url: string, filename: string, mimeType?: string) {
    return (db.prepare('INSERT INTO downloads (url, filename, mime_type) VALUES (?, ?, ?)')
      .run(url, filename, mimeType || null) as any).lastInsertRowid
  },
  update(id: number, fields: Partial<{ status: string; downloaded: number; file_size: number; save_path: string; error: string }>) {
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
    if (!entries.length) return
    const set = entries.map(([k]) => `${k} = ?`).join(', ')
    const values = entries.map(([, v]) => v)
    db.prepare(`UPDATE downloads SET ${set} WHERE id = ?`).run(...values, id)
  },
  getAll() { return db.prepare('SELECT * FROM downloads ORDER BY started_at DESC').all() },
  delete(id: number) { db.prepare('DELETE FROM downloads WHERE id = ?').run(id) },
}
