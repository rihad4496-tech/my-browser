#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# RihadX Browser - Build & Installer Script
# Usage: chmod +x scripts/build.sh && ./scripts/build.sh [platform]
# Platforms: all | win | mac | linux
# ═══════════════════════════════════════════════════════════════

set -e

PLATFORM=${1:-all}
VERSION=$(node -p "require('./package.json').version")
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       RihadX Browser Build System       ║"
echo "║           Version: $VERSION             ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Clean ──────────────────────────────────────────────
echo "🧹 Cleaning previous builds..."
rm -rf dist release
mkdir -p dist release

# ── Step 2: Install dependencies ──────────────────────────────
echo "📦 Installing dependencies..."
npm ci

# ── Step 3: Rebuild native modules ────────────────────────────
echo "🔧 Rebuilding native modules for Electron..."
npx electron-rebuild --force

# ── Step 4: Build renderer (Vite) ─────────────────────────────
echo "⚡ Building renderer (React/Vite)..."
npm run build:renderer

# ── Step 5: Build main process (TypeScript) ───────────────────
echo "🔨 Compiling main process (TypeScript)..."
npm run build:main

# ── Step 6: Copy assets ───────────────────────────────────────
echo "🎨 Copying assets..."
cp -r assets dist/ 2>/dev/null || true

# ── Step 7: Package ───────────────────────────────────────────
echo ""
echo "📦 Packaging for: $PLATFORM"
echo ""

case $PLATFORM in
  win)
    echo "🪟 Building Windows installer..."
    npm run dist:win
    echo "✅ Windows build complete: release/"
    ;;
  mac)
    echo "🍎 Building macOS DMG..."
    npm run dist:mac
    echo "✅ macOS build complete: release/"
    ;;
  linux)
    echo "🐧 Building Linux packages (.AppImage, .deb, .rpm)..."
    npm run dist:linux
    echo "✅ Linux build complete: release/"
    ;;
  all)
    echo "🌍 Building for all platforms..."
    npm run dist:linux   # Linux can be built on any OS
    echo "✅ All builds complete: release/"
    echo ""
    echo "ℹ️  Windows/macOS builds require their respective OS."
    echo "   For cross-platform builds, use Docker or CI/CD."
    ;;
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "   Usage: ./scripts/build.sh [all|win|mac|linux]"
    exit 1
    ;;
esac

# ── Output summary ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "  Build complete! 🎉"
echo "  Output directory: ./release/"
echo ""
ls -lh release/ 2>/dev/null || echo "  (Run dist command to generate installers)"
echo "═══════════════════════════════════════════"
