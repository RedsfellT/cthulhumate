import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { Settings as SettingsIcon, Key, Eye, EyeOff, Check, Info, RefreshCw } from 'lucide-react'

export function Settings() {
  const store = useSettingsStore()
  const [saved, setSaved] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [showAnthropic, setShowAnthropic] = useState(false)

  useEffect(() => { if (!store.loaded) store.load() }, [])

  async function handleSave() {
    await store.save()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid #3d1a08', background: '#1a0a00' }}>
        <SettingsIcon size={18} style={{ color: '#c8972a' }} />
        <span className="text-sm font-semibold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>Paramètres</span>
      </div>

      <div className="p-4 flex flex-col gap-6 max-w-lg">
        {/* AI section */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
            <Key size={16} /> Intelligence Artificielle
          </h2>

          <div className="flex flex-col gap-4">
            {/* Provider */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: '#8a7055' }}>Fournisseur IA</label>
              <div className="flex gap-2">
                {(['none', 'openai', 'anthropic'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => store.setAiProvider(p)}
                    className="flex-1 py-2 rounded text-sm transition-all"
                    style={{
                      background: store.aiProvider === p ? '#3d1a08' : '#231008',
                      color: store.aiProvider === p ? '#c8972a' : '#5a4535',
                      border: `1px solid ${store.aiProvider === p ? '#c8972a' : '#3d1a08'}`,
                    }}
                  >
                    {p === 'none' ? 'Aucun' : p === 'openai' ? 'OpenAI' : 'Anthropic'}
                  </button>
                ))}
              </div>
            </div>

            {/* OpenAI */}
            <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: '#1a0a00', border: '1px solid #3d1a08', opacity: store.aiProvider === 'openai' ? 1 : 0.5 }}>
              <div className="text-xs font-semibold" style={{ color: '#c8972a' }}>OpenAI</div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#5a4535' }}>Clé API</label>
                <div className="flex gap-2">
                  <input
                    type={showOpenai ? 'text' : 'password'}
                    value={store.openaiKey}
                    onChange={e => store.setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 px-3 py-1.5 rounded text-sm outline-none font-mono"
                    style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}
                  />
                  <button onClick={() => setShowOpenai(s => !s)} className="px-2 rounded" style={{ background: '#231008', color: '#5a4535' }}>
                    {showOpenai ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#5a4535' }}>Modèle</label>
                <select value={store.openaiModel} onChange={e => store.setOpenaiModel(e.target.value)}
                  className="px-2 py-1.5 rounded text-sm outline-none"
                  style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>
            </div>

            {/* Anthropic */}
            <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: '#1a0a00', border: '1px solid #3d1a08', opacity: store.aiProvider === 'anthropic' ? 1 : 0.5 }}>
              <div className="text-xs font-semibold" style={{ color: '#c8972a' }}>Anthropic (Claude)</div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#5a4535' }}>Clé API</label>
                <div className="flex gap-2">
                  <input
                    type={showAnthropic ? 'text' : 'password'}
                    value={store.anthropicKey}
                    onChange={e => store.setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="flex-1 px-3 py-1.5 rounded text-sm outline-none font-mono"
                    style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}
                  />
                  <button onClick={() => setShowAnthropic(s => !s)} className="px-2 rounded" style={{ background: '#231008', color: '#5a4535' }}>
                    {showAnthropic ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#5a4535' }}>Modèle</label>
                <select value={store.anthropicModel} onChange={e => store.setAnthropicModel(e.target.value)}
                  className="px-2 py-1.5 rounded text-sm outline-none"
                  style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}>
                  <option value="claude-opus-4-6">Claude Opus 4.6</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                </select>
              </div>
            </div>

            {/* Info box */}
            <div className="flex gap-2 p-3 rounded-lg text-xs" style={{ background: '#231008', border: '1px solid #3d1a08', color: '#5a4535' }}>
              <Info size={14} style={{ flexShrink: 0, color: '#8a7055', marginTop: 1 }} />
              <div>
                Ta clé API est stockée <strong style={{ color: '#8a7055' }}>uniquement sur cet appareil</strong> dans IndexedDB.
                Elle n'est jamais envoyée ailleurs que directement aux API officielles.
              </div>
            </div>
          </div>
        </section>

        {/* Role */}
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
            Mon rôle
          </h2>
          <div className="rounded-lg p-4 flex items-center justify-between"
            style={{ background: '#1a0a00', border: '1px solid #3d1a08' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{store.appRole === 'gardien' ? '👁️' : '🔍'}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#e8d5b0' }}>
                  {store.appRole === 'gardien' ? 'Gardien des Arcanes' : 'Investigateur'}
                </div>
                <div className="text-xs" style={{ color: '#5a4535' }}>
                  Rôle actuel sur cet appareil
                </div>
              </div>
            </div>
            <button
              onClick={() => store.setAppRole(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
              style={{ background: '#231008', border: '1px solid #3d1a08', color: '#8a7055' }}>
              <RefreshCw size={12} /> Changer
            </button>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>À propos</h2>
          <div className="rounded-lg p-4 text-xs flex flex-col gap-2" style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#5a4535' }}>
            <div className="text-lg text-center mb-1">🐙</div>
            <div className="text-center font-semibold text-sm" style={{ color: '#c8972a' }}>CthulhuMate V7</div>
            <div className="text-center">Aide de jeu numérique pour L'Appel de Cthulhu V7</div>
            <div className="text-center">Éditions Sans Détour</div>
            <div className="text-center mt-2 opacity-60">Stockage 100% local · PWA installable</div>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all"
          style={{ background: saved ? '#1a4a2e' : 'linear-gradient(135deg, #8b3a0a, #c8972a)' }}
        >
          {saved ? <><Check size={16} /> Sauvegardé !</> : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
