# RihadX Browser 🌐

> **Fast as Chrome. Private as Brave. Customizable as Firefox. The world's most secure browser.**

Built with Electron, Chromium, React, TypeScript, and SQLite by **Rihad**.

---

## ✨ Features

| Category        | Features |
|-----------------|----------|
| **Security**    | HTTPS-Only, Malware Protection, Phishing Protection, Certificate Verification |
| **Privacy**     | Ad Blocker, Tracker Blocker, Anti-Fingerprinting, DNS-over-HTTPS, Incognito Mode |
| **Productivity**| Tab Groups, Vertical Tabs, Split Screen, Reader Mode, AI Assistant |
| **Tools**       | Password Manager, Download Manager, Screenshot Tool, Extension Support |
| **Performance** | RAM Saver, Battery Saver, Hardware Acceleration |
| **Sync**        | Bookmarks, History, Passwords sync across devices |

---

## 🗂️ Project Structure

```
rihadx-browser/
├── src/
│   ├── main/                    # Electron main process (Node.js)
│   │   ├── index.ts             # App entry point
│   │   ├── browser/
│   │   │   ├── WindowManager.ts # BrowserWindow + BrowserView management
│   │   │   └── AppMenu.ts       # Native application menu
│   │   ├── security/
│   │   │   ├── SecurityManager.ts  # HTTPS, malware, cert verification
│   │   │   ├── AdBlocker.ts        # Ad & tracker blocking
│   │   │   └── PrivacyManager.ts   # Anti-fingerprinting, cookie control
│   │   ├── database/
│   │   │   └── DatabaseManager.ts  # SQLite schema + query helpers
│   │   └── ipc/
│   │       └── IpcHandlers.ts      # All IPC channel handlers
│   │
│   ├── preload/
│   │   └── index.ts             # Secure contextBridge API for renderer
│   │
│   ├── renderer/                # React UI (Vite + Tailwind)
│   │   ├── App.tsx              # Root component + router
│   │   ├── main.tsx             # ReactDOM entry
│   │   ├── store/
│   │   │   └── browserStore.ts  # Zustand global state
│   │   ├── components/
│   │   │   ├── Browser/         # Layout, FindBar, SplitView, UpdateBanner
│   │   │   ├── TabBar/          # TitleBar, TabBar (horizontal), VerticalTabBar
│   │   │   ├── Toolbar/         # Toolbar, OmniBar (address bar)
│   │   │   ├── Sidebar/         # History, Bookmarks, Downloads, Extensions, Passwords
│   │   │   ├── StatusBar/       # Bottom status bar
│   │   │   ├── Downloads/       # Downloads panel
│   │   │   ├── PasswordManager/ # Password prompt modal
│   │   │   └── AIAssistant/     # Claude-powered AI chat
│   │   ├── pages/
│   │   │   ├── NewTabPage.tsx   # Beautiful new tab home page
│   │   │   └── SettingsPage.tsx # Full settings UI
│   │   └── styles/
│   │       └── globals.css      # Tailwind + custom design system
│   │
│   └── shared/
│       └── types.ts             # Shared TypeScript interfaces
│
├── assets/icons/                # App icons (icon.ico, icon.icns, icon.png)
├── package.json                 # Dependencies + electron-builder config
├── tsconfig.json                # Renderer TypeScript config
├── tsconfig.main.json           # Main process TypeScript config
├── vite.config.ts               # Vite bundler config
├── tailwind.config.js           # Tailwind CSS config
└── postcss.config.js            # PostCSS config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/rihadx/rihadx-browser.git
cd rihadx-browser
npm install
```

### 2. Rebuild native modules for Electron

```bash
npx electron-rebuild
```

### 3. Development Mode

```bash
npm start
```
This starts both the Vite dev server (port 5173) and Electron simultaneously.

### 4. Production Build

```bash
npm run build
```

---

## 📦 Creating Installers

### Windows (.exe installer + portable)

```bash
npm run dist:win
```
Output: `release/RihadX Browser Setup 1.0.0.exe` + portable `.exe`

**Requirements:**
- Run on Windows, or use Wine on Linux/macOS
- For code signing: set `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD` env vars

### macOS (.dmg)

```bash
npm run dist:mac
```
Output: `release/RihadX Browser-1.0.0.dmg`

**Requirements:**
- Must run on macOS
- For notarization: set `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_APP_SPECIFIC_PASSWORD`

### Linux (.AppImage + .deb + .rpm)

```bash
npm run dist:linux
```
Output: `release/RihadX Browser-1.0.0.AppImage`, `.deb`, `.rpm`

---

## 🔒 Security Architecture

### Defense in Depth

```
User Request
    │
    ▼
┌─────────────────────────────────────────────┐
│  PhishingProtection (URL pattern matching)  │
├─────────────────────────────────────────────┤
│  MalwareDomainBlocklist (known bad domains) │
├─────────────────────────────────────────────┤
│  AdBlocker (tracker + ad domain blocking)   │
├─────────────────────────────────────────────┤
│  HTTPS Upgrade (http:// → https://)         │
├─────────────────────────────────────────────┤
│  Certificate Verification (TLS validation)  │
├─────────────────────────────────────────────┤
│  DNS-over-HTTPS (encrypted DNS resolution)  │
├─────────────────────────────────────────────┤
│  Anti-Fingerprinting (canvas, audio, WebGL) │
├─────────────────────────────────────────────┤
│  Content-Security-Policy (XSS prevention)   │
├─────────────────────────────────────────────┤
│  Sandbox (renderer process isolation)       │
└─────────────────────────────────────────────┘
    │
    ▼
  Page Loaded ✓
```

### IPC Security

- All IPC via `contextBridge` — renderer has **zero Node.js access**
- `nodeIntegration: false` + `sandbox: true` on all BrowserViews
- `contextIsolation: true` on all webContents
- Only whitelisted channels exposed via preload

### Data Security

- Passwords encrypted with **AES-256-CBC** before SQLite storage
- Separate encryption key derived with `scrypt`
- Incognito sessions use isolated partitions with no disk persistence

---

## 🎨 Design System

The UI uses a custom dark design system with:

- **Color palette**: surface-950 background, brand indigo accent, cyan/violet secondary
- **Glass morphism**: `backdrop-filter: blur` cards with subtle borders
- **Typography**: Inter (UI) + Plus Jakarta Sans (headings) + JetBrains Mono (code)
- **Animations**: Framer Motion for all transitions
- **Icons**: Lucide React icon library

---

## ⚙️ Configuration

All settings are persisted in SQLite at:
- **Windows**: `%APPDATA%\rihadx-browser\rihadx.db`
- **macOS**: `~/Library/Application Support/rihadx-browser/rihadx.db`
- **Linux**: `~/.config/rihadx-browser/rihadx.db`

---

## 🤖 AI Assistant Setup

The built-in AI assistant uses the Anthropic Claude API. To enable it:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. The API is called directly from the renderer — for production, proxy through your backend to protect the key.

---

## 🔄 Auto-Update System

Updates are delivered via `electron-updater` + GitHub Releases:

1. Bump version in `package.json`
2. Build & publish: `npm run dist -- --publish always`
3. Users receive update notification automatically
4. One-click "Restart & Update" installs it

Configure in `package.json` under `build.publish`.

---

## 🛠️ Tech Stack

| Layer       | Technology |
|-------------|------------|
| Shell       | Electron 29 |
| Engine      | Chromium (via Electron's BrowserView) |
| UI          | React 18 + TypeScript |
| Bundler     | Vite 5 |
| Styling     | Tailwind CSS 3 |
| State       | Zustand |
| Animation   | Framer Motion |
| Database    | better-sqlite3 |
| Icons       | Lucide React |
| Updates     | electron-updater |
| Build       | electron-builder |

---

## 📄 License

MIT © 2024 Rihad (RihadX)

---

*Built with ❤️ in Dhaka, Bangladesh*
