import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettingsStore } from '../store/useSettingsStore'
import { streamAiResponse, searchInText, type AiMessage } from '../lib/ai'
import { Send, Bot, User, BookOpen, Trash2, AlertCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

export function AiAssistant() {
  const { aiProvider, openaiKey, anthropicKey, openaiModel, anthropicModel } = useSettingsStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [searchPdfs, setSearchPdfs] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const pdfs = useLiveQuery(() => db.pdfs.toArray(), [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    setError(null)

    const userMsg: Message = { role: 'user', content: text }
    const assistantMsg: Message = { role: 'assistant', content: '', loading: true }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    try {
      // Build context from PDFs
      let context: string | null = null
      if (searchPdfs && pdfs?.length) {
        const snippets = pdfs
          .map(p => p.textContent ? searchInText(p.textContent, text) : '')
          .filter(Boolean)
          .join('\n\n')
        if (snippets) context = snippets
      }

      const history: AiMessage[] = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ]

      let fullText = ''
      await streamAiResponse(
        aiProvider, openaiKey, anthropicKey, openaiModel, anthropicModel,
        history, context,
        ({ text, done }) => {
          if (!done) {
            fullText += text
            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, content: fullText, loading: false }]
              }
              return prev
            })
          }
        }
      )
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setStreaming(false)
    }
  }

  const configured = aiProvider !== 'none' && (
    (aiProvider === 'openai' && openaiKey) || (aiProvider === 'anthropic' && anthropicKey)
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #3d1a08', background: '#1a0a00' }}>
        <div className="flex items-center gap-2">
          <Bot size={18} style={{ color: '#c8972a' }} />
          <span className="text-sm font-semibold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
            Assistant Cthulhu
          </span>
          {configured && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a4a2e', color: '#27ae60' }}>
              {aiProvider === 'openai' ? 'GPT' : 'Claude'} actif
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: '#8a7055' }}>
            <input
              type="checkbox"
              checked={searchPdfs}
              onChange={e => setSearchPdfs(e.target.checked)}
              className="accent-amber-600"
            />
            <BookOpen size={12} />
            Recherche PDFs
          </label>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="p-1 rounded" style={{ color: '#5a4535' }} title="Effacer la conversation">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {!configured && (
        <div className="shrink-0 m-4 rounded-lg p-3 flex items-start gap-2" style={{ background: '#231008', border: '1px solid #8b3a0a' }}>
          <AlertCircle size={16} style={{ color: '#c8972a', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: '#c8972a' }}>IA non configurée</div>
            <div className="text-xs mt-0.5" style={{ color: '#8a7055' }}>
              Rends-toi dans <strong>Paramètres</strong> pour ajouter une clé API OpenAI ou Anthropic.
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Bot size={48} style={{ color: '#3d1a08' }} />
            <div className="text-center text-sm" style={{ color: '#8a7055' }}>
              <div className="font-semibold mb-1">Que cherches-tu, Gardien ?</div>
              <div className="text-xs">Règles de poursuite, jets opposés, sorts, créatures, conseils de scénario…</div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#3d1a08' }}>
                <Bot size={14} style={{ color: '#c8972a' }} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2.5 text-sm ${msg.loading ? 'opacity-60' : ''}`}
              style={{
                background: msg.role === 'user' ? '#3d1a08' : '#231008',
                color: '#e8d5b0',
                border: `1px solid ${msg.role === 'user' ? '#c8972a44' : '#3d1a08'}`,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.loading && !msg.content ? (
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                </span>
              ) : msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#231008' }}>
                <User size={14} style={{ color: '#8a7055' }} />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="rounded-lg p-3 text-sm flex items-start gap-2" style={{ background: '#2a0505', border: '1px solid #8b1a1a', color: '#c0392b' }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length === 0 && configured && (
        <div className="shrink-0 flex gap-2 px-4 pb-2 overflow-x-auto">
          {[
            'Comment fonctionne la poursuite ?',
            'Règles de folie temporaire',
            'Jets opposés : comment ça marche ?',
            'Créer un PNJ rapidement',
            'Expérience et montée en compétences',
          ].map(s => (
            <button
              key={s}
              onClick={() => { setInput(s) }}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs transition-all"
              style={{ background: '#231008', border: '1px solid #3d1a08', color: '#8a7055' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-3 py-3 flex gap-2" style={{ borderTop: '1px solid #3d1a08' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Pose ta question sur L'Appel de Cthulhu V7…"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
          style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}
          disabled={!configured}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || streaming || !configured}
          className="px-4 rounded-lg transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
