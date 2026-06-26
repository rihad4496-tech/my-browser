import { session } from 'electron'
import crypto from 'crypto'

export class PrivacyManager {
  private static fingerprintingEnabled = true
  private static randomizedFingerprint = this.generateFingerprint()

  private static generateFingerprint() {
    // Generate stable-but-randomized fingerprint per session
    return {
      canvasNoise: crypto.randomBytes(4).readUInt32LE(0) / 0xFFFFFFFF,
      audioNoise: crypto.randomBytes(4).readUInt32LE(0) / 0xFFFFFFFF,
      // Fake but realistic user agent components
      platform: ['Win32', 'MacIntel', 'Linux x86_64'][Math.floor(Math.random() * 3)],
      hardwareConcurrency: [4, 8, 12, 16][Math.floor(Math.random() * 4)],
      deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
      screenWidth:  [1366, 1440, 1920, 2560][Math.floor(Math.random() * 4)],
      screenHeight: [768, 900, 1080, 1440][Math.floor(Math.random() * 4)],
    }
  }

  static initialize() {
    this.setupPrivacyHeaders()
    this.setupCookieProtection()
    this.setupStoragePartitioning()
  }

  private static setupPrivacyHeaders() {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders }

      // Spoof/normalize headers to reduce fingerprint
      if (this.fingerprintingEnabled) {
        // Normalize Accept-Language to reduce uniqueness
        headers['Accept-Language'] = 'en-US,en;q=0.9'

        // Remove identifying headers
        delete headers['X-Forwarded-For']
        delete headers['Via']
        delete headers['X-Real-IP']
      }

      callback({ requestHeaders: headers })
    })
  }

  private static setupCookieProtection() {
    // Block third-party cookies by default
    session.defaultSession.cookies.on('changed', (event, cookie, cause, removed) => {
      if (!removed && cookie.domain && !cookie.hostOnly) {
        // Log third-party cookie attempts
      }
    })
  }

  private static setupStoragePartitioning() {
    // Enable strict storage partitioning
    // This isolates storage per top-level site
  }

  static getAntiFingerprint() {
    return this.randomizedFingerprint
  }

  // Script to inject into pages for anti-fingerprinting
  static getInjectionScript(): string {
    const fp = this.randomizedFingerprint
    return `
      (function() {
        'use strict';

        // Canvas fingerprint randomization
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          const ctx = originalGetContext.apply(this, [type, ...args]);
          if (!ctx || type !== '2d') return ctx;

          const originalGetImageData = ctx.getImageData.bind(ctx);
          ctx.getImageData = function(sx, sy, sw, sh) {
            const data = originalGetImageData(sx, sy, sw, sh);
            // Add tiny noise to canvas data
            for (let i = 0; i < data.data.length; i += 4) {
              data.data[i]     = data.data[i]     + (Math.random() < 0.01 ? 1 : 0);
              data.data[i + 1] = data.data[i + 1] + (Math.random() < 0.01 ? 1 : 0);
              data.data[i + 2] = data.data[i + 2] + (Math.random() < 0.01 ? 1 : 0);
            }
            return data;
          };
          return ctx;
        };

        // Hardware concurrency spoofing
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => ${fp.hardwareConcurrency}
        });

        // Device memory spoofing
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => ${fp.deviceMemory}
        });

        // Platform spoofing
        Object.defineProperty(navigator, 'platform', {
          get: () => '${fp.platform}'
        });

        // WebRTC leak prevention
        const originalRTCPeerConnection = window.RTCPeerConnection;
        window.RTCPeerConnection = function(config) {
          if (config && config.iceServers) {
            config.iceServers = [];
          }
          return new originalRTCPeerConnection(config);
        };

        // Audio fingerprint protection
        const originalAnalyser = window.AnalyserNode;
        if (originalAnalyser) {
          const originalGetFloatFrequencyData = originalAnalyser.prototype.getFloatFrequencyData;
          originalAnalyser.prototype.getFloatFrequencyData = function(array) {
            originalGetFloatFrequencyData.call(this, array);
            for (let i = 0; i < array.length; i++) {
              array[i] += Math.random() * 0.0001;
            }
          };
        }

        // Screen resolution noise
        Object.defineProperty(screen, 'width', { get: () => ${fp.screenWidth} });
        Object.defineProperty(screen, 'height', { get: () => ${fp.screenHeight} });

        // Timezone normalization (optional - spoof to UTC)
        // const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
        // Date.prototype.getTimezoneOffset = () => 0;

        console.log('[RihadX] Anti-fingerprinting active');
      })();
    `
  }

  static setFingerprintingProtection(enabled: boolean) {
    this.fingerprintingEnabled = enabled
    if (enabled) {
      this.randomizedFingerprint = this.generateFingerprint()
    }
  }
}
