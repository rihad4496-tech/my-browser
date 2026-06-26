import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, RotateCw, Copy, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrowserStore, useActiveTab } from '../../store/browserStore'
import clsx from 'clsx'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const SYSTEM_PROMPT = `You are the RihadX Browser AI Assistant, a helpful, concise assistant built into the RihadX web browser. You help users with:
- Summarizing web pages
- Answering questions about page content
- Web research help
- Browser tips and shortcuts
- Privacy and security advice
- General questions

Current browser: RihadX Browser v1.0.0
Be helpful, brief, and friendly. Use markdown formatting when appropriate.`

export default function AIAssistant() {
  const { setModalOpen } = useBrowserStore()
  const activeTab = useActiveTab()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi! I'm your RihadX AI Assistant. I can help you summarize pages, answer questions, or assist with anything you need. What can I do for you?`,
      timestamp: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const apiMessages = [
        ...messages.slice(1).map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: input.trim() }
      ]

      // Add page context if available
      if (activeTab?.url && activeTab.url !== 'rihadx://newtab') {
        apiMessages[apiMessages.length - 1].content =
          `[Current page: ${activeTab.title} (${activeTab.url})]\n\n${input.trim()}`
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        })
      })

      const data = await response.json()
      const text = data.content?.map((b: any) => b.text || '').join('') || 'Sorry, I could not process that.'

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const QUICK_PROMPTS = [
    'Summarize this page',
    'What are the key points?',
    'Is this site safe?',
    'Translate to English',
  ]

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-800/60">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center">
          <Bot size={13} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
          <p className="text-[10px] text-surface-500">Powered by Claude</p>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="btn-icon w-6 h-6"
          title="Clear chat"
        >
          <RotateCw size={12} />
        </button>
        <button
          onClick={() => setModalOpen(null)}
          className="btn-icon w-6 h-6"
        >
          <X size={13} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-panel px-3 py-3 space-y-3">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Quick prompts after first message */}
        {messages.length === 1 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-surface-600 px-1">Quick actions:</p>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => { setInput(p); setTimeout(sendMessage, 10) }}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface-800/60 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors border border-surface-700/40 flex items-center gap-2"
              >
                <Sparkles size={10} className="text-brand-400 flex-shrink-0" />
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-brand-400" />
            </div>
            <div className="bg-surface-800 rounded-xl px-3 py-2.5">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-surface-800/60">
        <div className="flex items-end gap-2 bg-surface-800 rounded-xl border border-surface-700/50 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500/40 transition-all px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-surface-100 placeholder-surface-600 outline-none resize-none max-h-24"
            style={{ fieldSizing: 'content' } as any}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={clsx(
              'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90',
              input.trim() && !loading
                ? 'bg-brand-600 hover:bg-brand-500 text-white'
                : 'bg-surface-700 text-surface-600 cursor-not-allowed'
            )}
          >
            <Send size={12} />
          </button>
        </div>
        <p className="text-[10px] text-surface-700 text-center mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  function copyText() {
    navigator.clipboard.writeText(message.content)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex items-start gap-2 group', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={clsx(
        'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
        isUser ? 'bg-brand-600 text-white' : 'bg-surface-700 text-surface-300'
      )}>
        {isUser ? 'U' : <Bot size={12} />}
      </div>

      {/* Bubble */}
      <div className={clsx(
        'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed relative',
        isUser
          ? 'bg-brand-600/20 text-surface-100 border border-brand-500/20'
          : 'bg-surface-800 text-surface-200 border border-surface-700/40'
      )}>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <button
          onClick={copyText}
          className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded bg-surface-700 flex items-center justify-center"
          title="Copy"
        >
          <Copy size={9} className="text-surface-400" />
        </button>
      </div>
    </motion.div>
  )
}
