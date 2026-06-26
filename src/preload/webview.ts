// This script runs in every BrowserView (web page) context
// It bridges security features from the main process into web content

;(function () {
  'use strict'

  // ── Anti-Fingerprinting (injected dynamically from PrivacyManager) ────────
  // Main process sends the script via IPC after page load

  // ── Cosmetic Ad Removal ───────────────────────────────────────────────────
  function injectAdStyles(css: string) {
    if (document.getElementById('rihadx-cosmetic')) return
    const style = document.createElement('style')
    style.id = 'rihadx-cosmetic'
    style.textContent = css
    document.head.appendChild(style)
  }

  // ── Remove common tracking pixels ────────────────────────────────────────
  function removeTrackingPixels() {
    const selectors = [
      'img[src*="track"]', 'img[src*="pixel"]', 'img[src*="beacon"]',
      'img[width="1"][height="1"]', 'img[width="0"][height="0"]',
    ]
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove())
    })
  }

  // ── Block autoplaying media ───────────────────────────────────────────────
  function setupAutoplayBlock(blocked: boolean) {
    if (!blocked) return
    document.addEventListener('play', e => {
      const el = e.target as HTMLMediaElement
      if (!el.hasAttribute('data-rihadx-allowed')) {
        el.pause()
      }
    }, true)
  }

  // ── Reader Mode extraction ────────────────────────────────────────────────
  function extractReadableContent() {
    const article = document.querySelector('article, main, [role="main"], .post-content, .article-body')
    if (!article) return null

    const title  = document.title || document.querySelector('h1')?.textContent || ''
    const author = (document.querySelector('[rel="author"], .author, .byline') as any)?.textContent || ''
    const content = article.innerHTML

    return { title, author, content, url: location.href }
  }

  // ── Password detection ────────────────────────────────────────────────────
  function detectPasswordForm() {
    const passwordInputs = document.querySelectorAll('input[type="password"]')
    if (passwordInputs.length === 0) return

    // Find associated username field
    passwordInputs.forEach(pwInput => {
      const form = pwInput.closest('form')
      if (!form) return

      const usernameInput = form.querySelector(
        'input[type="email"], input[type="text"], input[name*="user"], input[name*="email"], input[autocomplete="username"]'
      ) as HTMLInputElement

      form.addEventListener('submit', () => {
        const username = usernameInput?.value || ''
        const password = (pwInput as HTMLInputElement).value
        if (username && password) {
          // Signal to main process that a password was submitted
          // Main process decides whether to offer to save
          ;(window as any).__rihadxPasswordSubmit?.({ username, password, domain: location.hostname })
        }
      }, { once: true })
    })
  }

  // ── Video Downloader (legal sites only) ──────────────────────────────────
  const LEGAL_VIDEO_SITES = [
    'youtube.com', 'vimeo.com', 'dailymotion.com',
    'twitch.tv', 'ted.com', 'archive.org',
  ]

  function injectVideoDownloadButton() {
    const domain = location.hostname.replace('www.', '')
    if (!LEGAL_VIDEO_SITES.some(site => domain.includes(site))) return

    // Find video elements
    const observer = new MutationObserver(() => {
      document.querySelectorAll('video:not([data-rihadx-btn])').forEach(video => {
        video.setAttribute('data-rihadx-btn', 'true')
        const src = video.getAttribute('src') || (video.querySelector('source') as any)?.src
        if (src) {
          // Signal available download to UI
          ;(window as any).__rihadxVideoFound?.({ src, domain })
        }
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }

  // ── Smooth scroll polyfill ────────────────────────────────────────────────
  document.documentElement.style.scrollBehavior = 'smooth'

  // ── Run on DOM ready ─────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  function init() {
    removeTrackingPixels()
    detectPasswordForm()
    injectVideoDownloadButton()

    // Re-run on dynamic content
    const obs = new MutationObserver(() => {
      removeTrackingPixels()
    })
    obs.observe(document.body, { childList: true, subtree: true })
  }
})()
