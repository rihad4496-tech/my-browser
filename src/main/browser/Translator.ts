import { ipcMain } from 'electron'

// Supported languages
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'en': 'English',    'bn': 'Bengali',   'es': 'Spanish',
  'fr': 'French',     'de': 'German',    'zh': 'Chinese',
  'ja': 'Japanese',   'ko': 'Korean',    'ar': 'Arabic',
  'ru': 'Russian',    'pt': 'Portuguese','hi': 'Hindi',
  'it': 'Italian',    'tr': 'Turkish',   'pl': 'Polish',
  'nl': 'Dutch',      'sv': 'Swedish',   'fa': 'Persian',
  'uk': 'Ukrainian',  'id': 'Indonesian','vi': 'Vietnamese',
}

// Uses LibreTranslate (open source, self-hostable) as primary
// Falls back to MyMemory API (free tier) if unavailable
const LIBRE_TRANSLATE  = 'https://translate.rihadx.com/translate'   // Self-hosted
const MYMEMORY_API     = 'https://api.mymemory.translated.net/get'  // Free fallback

export class Translator {
  static initialize() {
    this.setupIpc()
  }

  private static setupIpc() {
    ipcMain.handle('translate:text', async (_, { text, targetLang, sourceLang = 'auto' }) =>
      this.translateText(text, targetLang, sourceLang))

    ipcMain.handle('translate:detect', async (_, { text }) =>
      this.detectLanguage(text))

    ipcMain.handle('translate:languages', () => SUPPORTED_LANGUAGES)
  }

  static async translateText(
    text: string,
    targetLang: string,
    sourceLang = 'auto'
  ): Promise<{ translated: string; detectedLang?: string; error?: string }> {
    if (!text?.trim()) return { translated: '' }

    // Try LibreTranslate first
    try {
      const result = await this.libreTranslate(text, targetLang, sourceLang)
      if (result) return result
    } catch {}

    // Fallback: MyMemory
    try {
      const result = await this.myMemoryTranslate(text, targetLang, sourceLang)
      if (result) return result
    } catch (err: any) {
      return { translated: text, error: err.message }
    }

    return { translated: text, error: 'Translation unavailable' }
  }

  private static async libreTranslate(
    text: string,
    target: string,
    source: string
  ): Promise<{ translated: string; detectedLang?: string } | null> {
    const response = await fetch(LIBRE_TRANSLATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' }),
    })
    if (!response.ok) return null
    const data: any = await response.json()
    return {
      translated:   data.translatedText,
      detectedLang: data.detectedLanguage?.language,
    }
  }

  private static async myMemoryTranslate(
    text: string,
    target: string,
    source: string
  ): Promise<{ translated: string } | null> {
    const langPair = source === 'auto' ? `|${target}` : `${source}|${target}`
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${langPair}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data: any = await response.json()
    return { translated: data.responseData?.translatedText || text }
  }

  static async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(LIBRE_TRANSLATE.replace('/translate', '/detect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text }),
      })
      if (!response.ok) return 'en'
      const data: any = await response.json()
      return data[0]?.language || 'en'
    } catch {
      return 'en'
    }
  }
}
