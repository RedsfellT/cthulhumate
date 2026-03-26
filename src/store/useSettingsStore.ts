import { create } from 'zustand'
import { getSetting, setSetting } from '../db/database'

export type AiProvider = 'openai' | 'anthropic' | 'none'
export type AppRole = 'gardien' | 'investigateur' | null

interface SettingsState {
  appRole: AppRole
  aiProvider: AiProvider
  openaiKey: string
  anthropicKey: string
  openaiModel: string
  anthropicModel: string
  loaded: boolean
  load: () => Promise<void>
  setAppRole: (r: AppRole) => Promise<void>
  setAiProvider: (p: AiProvider) => void
  setOpenaiKey: (k: string) => void
  setAnthropicKey: (k: string) => void
  setOpenaiModel: (m: string) => void
  setAnthropicModel: (m: string) => void
  save: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  appRole: null,
  aiProvider: 'none',
  openaiKey: '',
  anthropicKey: '',
  openaiModel: 'gpt-4o',
  anthropicModel: 'claude-opus-4-6',
  loaded: false,

  load: async () => {
    const [role, provider, oKey, aKey, oModel, aModel] = await Promise.all([
      getSetting('appRole'),
      getSetting('aiProvider'),
      getSetting('openaiKey'),
      getSetting('anthropicKey'),
      getSetting('openaiModel'),
      getSetting('anthropicModel'),
    ])
    set({
      appRole: (role as AppRole) ?? null,
      aiProvider: (provider as AiProvider) ?? 'none',
      openaiKey: oKey ?? '',
      anthropicKey: aKey ?? '',
      openaiModel: oModel ?? 'gpt-4o',
      anthropicModel: aModel ?? 'claude-opus-4-6',
      loaded: true,
    })
  },

  setAppRole: async (r) => {
    set({ appRole: r })
    if (r) await setSetting('appRole', r)
    else await setSetting('appRole', '')
  },

  setAiProvider: (p) => set({ aiProvider: p }),
  setOpenaiKey: (k) => set({ openaiKey: k }),
  setAnthropicKey: (k) => set({ anthropicKey: k }),
  setOpenaiModel: (m) => set({ openaiModel: m }),
  setAnthropicModel: (m) => set({ anthropicModel: m }),

  save: async () => {
    const s = get()
    await Promise.all([
      setSetting('aiProvider', s.aiProvider),
      setSetting('openaiKey', s.openaiKey),
      setSetting('anthropicKey', s.anthropicKey),
      setSetting('openaiModel', s.openaiModel),
      setSetting('anthropicModel', s.anthropicModel),
    ])
  },
}))
