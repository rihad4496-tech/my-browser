import { ipcMain, net } from 'electron'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

const execAsync = promisify(exec)

export type VpnStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface VpnServer {
  id: string
  name: string
  country: string
  countryCode: string
  flag: string
  host: string
  port: number
  protocol: 'wireguard' | 'openvpn'
  ping?: number
  load?: number
  isFree: boolean
}

// Built-in free server list (replace with real endpoints in production)
export const VPN_SERVERS: VpnServer[] = [
  { id: 'us-1',   name: 'New York',   country: 'United States', countryCode: 'us', flag: '🇺🇸', host: 'us1.rihadx-vpn.com',  port: 51820, protocol: 'wireguard', isFree: true },
  { id: 'de-1',   name: 'Frankfurt',  country: 'Germany',       countryCode: 'de', flag: '🇩🇪', host: 'de1.rihadx-vpn.com',  port: 51820, protocol: 'wireguard', isFree: true },
  { id: 'sg-1',   name: 'Singapore',  country: 'Singapore',     countryCode: 'sg', flag: '🇸🇬', host: 'sg1.rihadx-vpn.com',  port: 51820, protocol: 'wireguard', isFree: true },
  { id: 'jp-1',   name: 'Tokyo',      country: 'Japan',         countryCode: 'jp', flag: '🇯🇵', host: 'jp1.rihadx-vpn.com',  port: 51820, protocol: 'wireguard', isFree: false },
  { id: 'uk-1',   name: 'London',     country: 'United Kingdom',countryCode: 'gb', flag: '🇬🇧', host: 'uk1.rihadx-vpn.com',  port: 51820, protocol: 'wireguard', isFree: false },
  { id: 'bd-1',   name: 'Dhaka',      country: 'Bangladesh',    countryCode: 'bd', flag: '🇧🇩', host: 'bd1.rihadx-vpn.com',  port: 51820, protocol: 'wireguard', isFree: true },
  { id: 'ca-1',   name: 'Toronto',    country: 'Canada',        countryCode: 'ca', flag: '🇨🇦', host: 'ca1.rihadx-vpn.com',  port: 51820, protocol: 'wireguard', isFree: false },
  { id: 'nl-1',   name: 'Amsterdam',  country: 'Netherlands',   countryCode: 'nl', flag: '🇳🇱', host: 'nl1.rihadx-vpn.com',  port: 51820, protocol: 'wireguard', isFree: true },
]

export class VpnManager {
  private static status: VpnStatus = 'disconnected'
  private static currentServer: VpnServer | null = null
  private static connectedAt: number | null = null
  private static wireguardProcess: any = null
  private static configPath = path.join(app.getPath('userData'), 'vpn')

  static initialize() {
    this.setupIpc()
    this.ensureConfigDir()
  }

  private static ensureConfigDir() {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true })
    }
  }

  private static setupIpc() {
    ipcMain.handle('vpn:servers',    () => VPN_SERVERS)
    ipcMain.handle('vpn:status',     () => ({
      status: this.status,
      server: this.currentServer,
      connectedAt: this.connectedAt,
    }))
    ipcMain.handle('vpn:connect',    (_, { serverId }) => this.connect(serverId))
    ipcMain.handle('vpn:disconnect', () => this.disconnect())
    ipcMain.handle('vpn:ping',       (_, { host }) => this.pingServer(host))
  }

  static async connect(serverId: string): Promise<{ success: boolean; error?: string }> {
    const server = VPN_SERVERS.find(s => s.id === serverId)
    if (!server) return { success: false, error: 'Server not found' }

    this.status = 'connecting'
    this.currentServer = server

    try {
      if (server.protocol === 'wireguard') {
        await this.connectWireGuard(server)
      }
      this.status = 'connected'
      this.connectedAt = Date.now()
      return { success: true }
    } catch (err: any) {
      this.status = 'error'
      return { success: false, error: err.message }
    }
  }

  private static async connectWireGuard(server: VpnServer) {
    // Generate WireGuard config
    const config = this.generateWireGuardConfig(server)
    const configFile = path.join(this.configPath, 'rihadx-vpn.conf')
    fs.writeFileSync(configFile, config, { mode: 0o600 })

    const platform = process.platform

    if (platform === 'win32') {
      // Windows: use wireguard.exe
      await execAsync(`wireguard.exe /installtunnelservice "${configFile}"`)
    } else if (platform === 'darwin') {
      // macOS: use wg-quick
      await execAsync(`sudo wg-quick up "${configFile}"`)
    } else {
      // Linux
      await execAsync(`sudo wg-quick up "${configFile}"`)
    }
  }

  private static generateWireGuardConfig(server: VpnServer): string {
    // In production, these keys come from your VPN backend after user auth
    // This is a template showing the structure
    return `[Interface]
PrivateKey = <YOUR_PRIVATE_KEY>
Address = 10.0.0.2/32
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${server.host}:${server.port}
PersistentKeepalive = 25
`
  }

  static async disconnect(): Promise<{ success: boolean }> {
    try {
      const configFile = path.join(this.configPath, 'rihadx-vpn.conf')
      const platform = process.platform

      if (platform === 'win32') {
        await execAsync('wireguard.exe /uninstalltunnelservice rihadx-vpn')
      } else {
        await execAsync(`sudo wg-quick down "${configFile}"`)
      }
    } catch {}

    this.status = 'disconnected'
    this.currentServer = null
    this.connectedAt = null
    return { success: true }
  }

  static async pingServer(host: string): Promise<number> {
    const start = Date.now()
    return new Promise(resolve => {
      const req = net.request({ method: 'HEAD', url: `https://${host}`, timeout: 3000 })
      req.on('response', () => resolve(Date.now() - start))
      req.on('error', () => resolve(9999))
      req.end()
    })
  }

  static getStatus() {
    return {
      status: this.status,
      server: this.currentServer,
      connectedAt: this.connectedAt,
    }
  }
}
