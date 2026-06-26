import { ipcMain } from 'electron'
import { BookmarksDB, HistoryDB, SettingsDB } from '../database/DatabaseManager'
import crypto from 'crypto'

// ── RihadX Sync Protocol ──────────────────────────────────────────────────
// Uses end-to-end encryption so the server never sees plaintext data.
// Sync key is derived from user's passphrase using PBKDF2.

const SYNC_API = 'https://sync.rihadx.com/v1'

interface SyncPayload {
  bookmarks?: any[]
  history?:   any[]
  settings?:  Record<string, string>
  timestamp:  number
  deviceId:   string
}

export class SyncManager {
  private static syncKey: Buffer | null = null
  private static deviceId: string = crypto.randomUUID()
  private static syncEnabled = false
  private static lastSync: number | null = null
  private static syncInterval: ReturnType<typeof setInterval> | null = null

  static initialize() {
    this.setupIpc()
    const syncEnabled = SettingsDB.get('sync_enabled')
    if (syncEnabled === 'true') this.startAutoSync()
  }

  private static setupIpc() {
    ipcMain.handle('sync:setup', (_, { passphrase, email }) =>
      this.setupSync(passphrase, email))
    ipcMain.handle('sync:status', () => ({
      enabled: this.syncEnabled,
      lastSync: this.lastSync,
      deviceId: this.deviceId,
    }))
    ipcMain.handle('sync:now',    () => this.syncNow())
    ipcMain.handle('sync:disable', () => this.disableSync())
  }

  static async setupSync(passphrase: string, email: string) {
    try {
      // Derive encryption key from passphrase
      this.syncKey = await this.deriveKey(passphrase, email)
      this.syncEnabled = true
      SettingsDB.set('sync_enabled', 'true')
      this.startAutoSync()

      // Initial sync
      await this.syncNow()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  private static async deriveKey(passphrase: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(passphrase, salt, 100000, 32, 'sha256', (err, key) => {
        if (err) reject(err); else resolve(key)
      })
    })
  }

  private static encrypt(data: string): string {
    if (!this.syncKey) throw new Error('Sync not initialized')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', this.syncKey, iv)
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
  }

  private static decrypt(data: string): string {
    if (!this.syncKey) throw new Error('Sync not initialized')
    const [ivHex, tagHex, encHex] = data.split(':')
    const iv  = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const enc = Buffer.from(encHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.syncKey, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  }

  static async syncNow(): Promise<{ success: boolean; error?: string }> {
    if (!this.syncEnabled || !this.syncKey) {
      return { success: false, error: 'Sync not enabled' }
    }

    try {
      // Gather local data
      const payload: SyncPayload = {
        bookmarks: BookmarksDB.getAll(),
        settings:  SettingsDB.getAll(),
        timestamp: Date.now(),
        deviceId:  this.deviceId,
      }

      // Encrypt payload
      const encrypted = this.encrypt(JSON.stringify(payload))

      // Upload to sync server
      const response = await fetch(`${SYNC_API}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': this.deviceId,
        },
        body: JSON.stringify({ data: encrypted }),
      })

      if (!response.ok) throw new Error(`Sync failed: ${response.status}`)

      // Fetch remote changes
      const remoteRes = await fetch(`${SYNC_API}/sync?deviceId=${this.deviceId}`)
      if (remoteRes.ok) {
        const remoteData = await remoteRes.json()
        if (remoteData.data) {
          const decrypted = this.decrypt(remoteData.data)
          const remote: SyncPayload = JSON.parse(decrypted)
          await this.mergeRemoteData(remote)
        }
      }

      this.lastSync = Date.now()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  private static async mergeRemoteData(remote: SyncPayload) {
    // Last-write-wins merge strategy
    // In production: use CRDTs for proper conflict resolution
    if (remote.bookmarks?.length) {
      remote.bookmarks.forEach(b => BookmarksDB.add(b.url, b.title, b.folder_id))
    }
    if (remote.settings) {
      Object.entries(remote.settings).forEach(([k, v]) => SettingsDB.set(k, v as string))
    }
  }

  static startAutoSync() {
    if (this.syncInterval) clearInterval(this.syncInterval)
    // Sync every 15 minutes
    this.syncInterval = setInterval(() => this.syncNow(), 15 * 60 * 1000)
  }

  static disableSync() {
    this.syncEnabled = false
    this.syncKey = null
    SettingsDB.set('sync_enabled', 'false')
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}
