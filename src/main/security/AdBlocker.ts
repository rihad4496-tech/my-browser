import { session } from 'electron'
import path from 'path'
import fs from 'fs'

// Comprehensive tracker and ad domain blocklist
const TRACKER_DOMAINS = new Set([
  // Google Analytics & Ads
  'google-analytics.com', 'googletagmanager.com', 'doubleclick.net',
  'googlesyndication.com', 'googleadservices.com', 'ads.google.com',
  // Facebook
  'connect.facebook.net', 'graph.facebook.com', 'pixel.facebook.com',
  // Twitter/X
  'ads-twitter.com', 'analytics.twitter.com', 't.co',
  // Amazon
  'amazon-adsystem.com', 'assoc-amazon.com',
  // Microsoft
  'bat.bing.com', 'clarity.ms',
  // Other major trackers
  'scorecardresearch.com', 'quantserve.com', 'outbrain.com',
  'taboola.com', 'revcontent.com', 'zemanta.com',
  'hotjar.com', 'fullstory.com', 'mouseflow.com',
  'optimizely.com', 'mixpanel.com', 'segment.com', 'amplitude.com',
  'intercom.io', 'crisp.chat',
  'adroll.com', 'criteo.com', 'adsrvr.org',
  'rubiconproject.com', 'openx.net', 'pubmatic.com',
  'casalemedia.com', 'yieldmo.com', 'adsystem.com',
])

const AD_URL_PATTERNS = [
  /\/ads\//i, /\/advertisement/i, /\/banner\//i,
  /adserver/i, /ad\.doubleclick/i, /\/advert/i,
  /tracking\./i, /tracker\./i, /analytics\./i,
  /telemetry\./i, /pixel\./i, /beacon\./i,
]

interface BlockStats {
  adsBlocked: number
  trackersBlocked: number
  bandwidthSaved: number // bytes
}

export class AdBlocker {
  private static stats: BlockStats = { adsBlocked: 0, trackersBlocked: 0, bandwidthSaved: 0 }
  private static enabled = true
  private static trackersEnabled = true
  private static customRules: string[] = []

  static initialize() {
    this.setupRequestBlocking()
    this.setupCosmeticFiltering()
  }

  private static setupRequestBlocking() {
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      if (!this.enabled) {
        callback({})
        return
      }

      const url = details.url
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.replace('www.', '')

      // Check tracker domains
      if (this.trackersEnabled && TRACKER_DOMAINS.has(hostname)) {
        this.stats.trackersBlocked++
        this.stats.bandwidthSaved += 50000 // Estimate 50kb per blocked request
        callback({ cancel: true })
        return
      }

      // Check ad URL patterns
      if (this.matchesAdPattern(url)) {
        this.stats.adsBlocked++
        this.stats.bandwidthSaved += 80000
        callback({ cancel: true })
        return
      }

      // Check custom user rules
      if (this.matchesCustomRule(url)) {
        this.stats.adsBlocked++
        callback({ cancel: true })
        return
      }

      callback({})
    })
  }

  private static setupCosmeticFiltering() {
    // Inject CSS to hide ad elements
    session.defaultSession.on('will-create-window', () => {})

    // We'd inject this via preload for DOM manipulation
    // This removes common ad containers
  }

  static getCosmeticCSS(): string {
    return `
      /* RihadX AdBlocker - Cosmetic Filters */
      [id*="ad-"], [id*="-ad"], [id*="ads-"], [id*="-ads"],
      [class*="ad-banner"], [class*="ad-container"], [class*="advertisement"],
      [class*="google-ad"], [class*="adsense"], [class*="adsbygoogle"],
      .ad-wrapper, .ads-wrapper, .banner-ad, .display-ad,
      #google_ads_iframe_wrapper, .outbrain-widget, .taboola-widget,
      iframe[src*="doubleclick"], iframe[src*="googlesyndication"],
      img[src*="doubleclick"], img[src*="googleadservices"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }
    `
  }

  private static matchesAdPattern(url: string): boolean {
    return AD_URL_PATTERNS.some(pattern => pattern.test(url))
  }

  private static matchesCustomRule(url: string): boolean {
    return this.customRules.some(rule => {
      if (rule.startsWith('/') && rule.endsWith('/')) {
        const regex = new RegExp(rule.slice(1, -1))
        return regex.test(url)
      }
      return url.includes(rule)
    })
  }

  static getStats(): BlockStats { return { ...this.stats } }
  static resetStats() { this.stats = { adsBlocked: 0, trackersBlocked: 0, bandwidthSaved: 0 } }
  static setEnabled(enabled: boolean) { this.enabled = enabled }
  static setTrackersEnabled(enabled: boolean) { this.trackersEnabled = enabled }
  static addCustomRule(rule: string) { this.customRules.push(rule) }
  static removeCustomRule(rule: string) {
    this.customRules = this.customRules.filter(r => r !== rule)
  }
}

export async function setupAdBlocker() {
  AdBlocker.initialize()
}
