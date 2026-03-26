import type { AiProvider } from '../store/useSettingsStore'

export interface AiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AiStreamChunk {
  text: string
  done: boolean
}

const SYSTEM_PROMPT = `Tu es l'assistant de jeu pour L'Appel de Cthulhu V7 (édition Sans Détour).
Tu aides les Gardiens et les joueurs avec les règles, les conseils de jeu, et les informations sur l'univers.
Tu parles français. Sois précis, concis, et mets en avant les références aux règles quand c'est pertinent.
Quand tu cites des règles, indique le contexte (page ou section si connu).
Tu peux aussi suggérer des ambiances, des PNJs, des éléments de scénario si on te le demande.`

async function callOpenAI(
  key: string,
  model: string,
  messages: AiMessage[],
  onChunk: (chunk: AiStreamChunk) => void
): Promise<void> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `OpenAI error ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') { onChunk({ text: '', done: true }); return }
      try {
        const json = JSON.parse(data)
        const text = json.choices?.[0]?.delta?.content ?? ''
        if (text) onChunk({ text, done: false })
      } catch { /* skip */ }
    }
  }
  onChunk({ text: '', done: true })
}

async function callAnthropic(
  key: string,
  model: string,
  messages: AiMessage[],
  onChunk: (chunk: AiStreamChunk) => void
): Promise<void> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      messages: messages.filter(m => m.role !== 'system'),
      stream: true,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Anthropic error ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      try {
        const json = JSON.parse(data)
        if (json.type === 'content_block_delta') {
          const text = json.delta?.text ?? ''
          if (text) onChunk({ text, done: false })
        } else if (json.type === 'message_stop') {
          onChunk({ text: '', done: true })
          return
        }
      } catch { /* skip */ }
    }
  }
  onChunk({ text: '', done: true })
}

export async function streamAiResponse(
  provider: AiProvider,
  openaiKey: string,
  anthropicKey: string,
  openaiModel: string,
  anthropicModel: string,
  messages: AiMessage[],
  context: string | null,
  onChunk: (chunk: AiStreamChunk) => void
): Promise<void> {
  const enriched = context
    ? [
        ...messages.slice(0, -1),
        {
          ...messages[messages.length - 1],
          content: `${messages[messages.length - 1].content}\n\n[Contexte extrait des PDFs]\n${context.slice(0, 3000)}`,
        },
      ]
    : messages

  if (provider === 'openai') {
    await callOpenAI(openaiKey, openaiModel, enriched, onChunk)
  } else if (provider === 'anthropic') {
    await callAnthropic(anthropicKey, anthropicModel, enriched, onChunk)
  } else {
    throw new Error('Aucune IA configurée. Va dans Paramètres pour ajouter une clé API.')
  }
}

export function searchInText(text: string, query: string): string {
  if (!text || !query) return ''
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const lines = text.split('\n')
  const results: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    if (words.some(w => line.includes(w))) {
      const start = Math.max(0, i - 1)
      const end = Math.min(lines.length - 1, i + 2)
      const snippet = lines.slice(start, end + 1).join('\n').trim()
      if (snippet && !results.includes(snippet)) {
        results.push(snippet)
      }
    }
    if (results.length >= 8) break
  }
  return results.join('\n---\n')
}
