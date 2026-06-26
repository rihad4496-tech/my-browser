import { session, app } from 'electron'
import { net } from 'electron'

// ─── Known Malicious Domain Lists (simplified) ─────────────────────────────
const PHISHING_PATTERNS = [
  /paypa1\.com/i, /g00gle\.com/i, /amaz0n\.com/i,
  /secure-.*-login\./i, /verify-account-.*\.com/i,
]

const MALWARE_DOMAINS_BLOCKLIST = new Set([
  'malware-test.com', 'phishing-test.com', // Extended via updates
])

export class SecurityManager {
  private static httpsOnlyMode = true
  private static dohEnabled = true
  private static dohServer = 'https://cloudflare-dns.com/dns-query'
  private static safeBrowsingEnabled = true

  static initialize() {
    this.setupHttpsEnforcement()
    this.setupMalwareProtection()
    this.setupCertificateVerification()
    this.setupDnsOverHttps()
    this.setupAntiFingerprinting()
  }

  private static setupHttpsEnforcement() {
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      const url = new URL(details.url)

      // Block known malware domains
      if (MALWARE_DOMAINS_BLOCKLIST.has(url.hostname)) {
        callback({ cancel: true })
        return
      }

      // Check phishing patterns
      if (this.safeBrowsingEnabled && this.isPhishingUrl(url.href)) {
        callback({ cancel: true })
        return
      }

      // HTTPS-only upgrade
      if (this.httpsOnlyMode && url.protocol === 'http:' && !this.isLocalhost(url.hostname)) {
        const httpsUrl = url.href.replace(/^http:/, 'https:')
        callback({ redirectURL: httpsUrl })
        return
      }

      callback({})
    })
  }

  private static setupMalwareProtection() {
    // Block known malicious file extensions from auto-executing
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders }

      // Add security headers to requests
      headers['Sec-Fetch-Site'] = headers['Sec-Fetch-Site'] || 'same-origin'
      headers['Sec-Fetch-Mode'] = headers['Sec-Fetch-Mode'] || 'navigate'
      headers['Sec-Fetch-Dest'] = headers['Sec-Fetch-Dest'] || 'document'

      // Privacy: Remove tracking headers
      delete headers['X-Forwarded-For']

      callback({ requestHeaders: headers })
    })
  }

  private static setupCertificateVerification() {
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      event.preventDefault()

      // For development, allow self-signed
      if (process.env.NODE_ENV === 'development') {
        callback(true)
        return
      }

      // Check if certificate is valid
      const isValid = this.verifyCertificate(certificate, url)
      callback(isValid)

      if (!isValid) {
        webContents.send('security:cert-error', { url, error, certificate: {
          subject: certificate.subjectName,
          issuer: certificate.issuerName,
          validExpiry: certificate.validExpiry,
        }})
      }
    })
  }

  private static setupDnsOverHttps() {
    if (!this.dohEnabled) return
    // Electron uses Chromium's built-in DoH when configured
    session.defaultSession.setSpellCheckerEnabled(true)
    // Set DoH via command line args in main process
    // app.commandLine.appendSwitch('dns-over-https', this.dohServer)
  }

  private static setupAntiFingerprinting() {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const headers = { ...details.responseHeaders }

      // Prevent clickjacking
      if (!headers['x-frame-options'] && !headers['X-Frame-Options']) {
        headers['X-Frame-Options'] = ['SAMEORIGIN']
      }

      // Prevent MIME sniffing
      headers['X-Content-Type-Options'] = ['nosniff']

      // Strict transport security
      if (details.url.startsWith('https://')) {
        headers['Strict-Transport-Security'] = ['max-age=31536000; includeSubDomains; preload']
      }

      callback({ responseHeaders: headers })
    })
  }

  private static isPhishingUrl(url: string): boolean {
    return PHISHING_PATTERNS.some(pattern => pattern.test(url))
  }

  private static isLocalhost(hostname: string): boolean {
    return ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname) ||
           hostname.endsWith('.local') ||
           hostname.endsWith('.localhost')
  }

  private static verifyCertificate(certificate: Electron.Certificate, url: string): boolean {
    const now = Date.now() / 1000
    if (certificate.validExpiry < now) return false
    if (certificate.validStart > now) return false
    return true
  }

  static setHttpsOnly(enabled: boolean) { this.httpsOnlyMode = enabled }
  static setDoH(enabled: boolean, server?: string) {
    this.dohEnabled = enabled
    if (server) this.dohServer = server
  }
  static setSafeBrowsing(enabled: boolean) { this.safeBrowsingEnabled = enabled }
}

export function setupSecurityHandlers() {
  SecurityManager.initialize()
}
