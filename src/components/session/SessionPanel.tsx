import { useState, useEffect, useRef } from 'react'
import { useSessionStore } from '../../store/useSessionStore'
import { Upload, X, Send, Wifi, WifiOff, Eye, Trash2 } from 'lucide-react'
import { MapWithPins } from './MapWithPins'

interface Handout {
  id: string
  title: string
  type: 'image' | 'text'
  thumb?: string
}

export function SessionPanel() {
  const session = useSessionStore()
  const [handouts, setHandouts] = useState<Handout[]>([])
  const [atmosphere, setAtmosphere] = useState('')
  const [mapHandout, setMapHandout] = useState<Handout | null>(null)
  const [tab, setTab] = useState<'handouts' | 'map' | 'sound' | 'players'>('handouts')
  const fileRef = useRef<HTMLInputElement>(null)
  const mapFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadHandouts() }, [session.lanHost])

  async function loadHandouts() {
    if (!serverBase) return
    try {
      const res = await fetch(`${serverBase}/api/handouts`)
      setHandouts(await res.json())
    } catch {}
  }

  async function uploadHandout(file: File, type: 'image' | 'text' = 'image') {
    if (!serverBase) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = e.target?.result as string
      const title = file.name.replace(/\.[^.]+$/, '')
      await fetch(`${serverBase}/api/handout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, data, thumb: type === 'image' ? data : undefined })
      })
      loadHandouts()
    }
    if (type === 'image') reader.readAsDataURL(file)
    else reader.readAsText(file)
  }

  async function deleteHandout(id: string) {
    await fetch(`${serverBase}/api/handout/${id}`, { method: 'DELETE' })
    if (session.currentHandoutId === id) session.clearHandout()
    loadHandouts()
  }

  function sendAtmosphere() {
    if (atmosphere.trim()) {
      session.sendAtmosphere(atmosphere)
      setAtmosphere('')
    }
  }

  const isConnected = session.connected && session.role === 'keeper'
  const serverBase = session.lanHost ? `https://${session.lanHost}` : ''

  // Détecte si on est sur le serveur local (session LAN possible)
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  function startSession() {
    const host = isLocal ? window.location.host : `${session.lanHost}`
    session.connect('Gardien', 'keeper', host)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex flex-col gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid #3d1a08' }}>

        {/* Saisie IP si on est sur GitHub Pages (pas en local) */}
        {!isLocal && !isConnected && (
          <div className="flex flex-col gap-1.5">
            <div className="text-xs" style={{ color: '#8a7055' }}>
              IP du serveur LAN (ex: 192.168.1.42:3000)
            </div>
            <div className="flex gap-2">
              <input
                value={session.lanHost}
                onChange={e => session.setLanHost(e.target.value)}
                placeholder="192.168.1.42:3000"
                className="flex-1 px-2 py-1.5 rounded text-sm outline-none font-mono"
                style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}
              />
            </div>
            <div className="text-xs opacity-60" style={{ color: '#5a4535' }}>
              Démarrez <code>start.bat</code> sur le PC du Gardien, copiez l'IP affichée.
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected
              ? <Wifi size={14} style={{ color: '#27ae60' }} />
              : <WifiOff size={14} style={{ color: '#5a4535' }} />}
            <span className="text-xs font-semibold" style={{ color: isConnected ? '#27ae60' : '#5a4535' }}>
              {isConnected
                ? `Session active · ${session.players.filter(p => p.role === 'player').length} joueur(s)`
                : isLocal ? 'Serveur local prêt' : 'Non connecté'}
            </span>
          </div>
          {!isConnected && (
            <button
              onClick={startSession}
              disabled={!isLocal && !session.lanHost.trim()}
              className="text-xs px-3 py-1.5 rounded font-semibold disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}>
              {isLocal ? 'Démarrer session' : 'Se connecter'}
            </button>
          )}
          {isConnected && (
            <button onClick={session.disconnect} className="text-xs px-2 py-1 rounded"
              style={{ background: '#3d1a08', color: '#8a7055' }}>
              Terminer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex" style={{ borderBottom: '1px solid #3d1a08' }}>
        {([
          { id: 'handouts', label: '🖼️ Handouts' },
          { id: 'map', label: '🗺️ Carte' },
          { id: 'players', label: `👥 Joueurs (${session.players.filter(p => p.role === 'player').length})` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-1.5 text-xs transition-all"
            style={{
              color: tab === t.id ? '#c8972a' : '#5a4535',
              borderBottom: `2px solid ${tab === t.id ? '#c8972a' : 'transparent'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Handouts tab */}
        {tab === 'handouts' && (
          <div className="p-3 flex flex-col gap-3">
            {/* Atmosphere */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: '#8a7055' }}>Message d'ambiance</label>
              <div className="flex gap-2">
                <input value={atmosphere} onChange={e => setAtmosphere(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendAtmosphere()}
                  placeholder="Un texte qui s'affiche sur les écrans des joueurs…"
                  className="flex-1 px-3 py-2 rounded text-sm outline-none"
                  style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
                <button onClick={sendAtmosphere} disabled={!atmosphere.trim()}
                  className="px-3 rounded" style={{ background: '#3d1a08', color: '#c8972a' }}>
                  <Send size={14} />
                </button>
              </div>
              {session.currentHandoutId && (
                <button onClick={session.clearHandout}
                  className="flex items-center gap-1 text-xs self-start px-2 py-1 rounded"
                  style={{ background: '#3d1a08', color: '#c0392b' }}>
                  <X size={10} /> Masquer handout actuel
                </button>
              )}
            </div>

            {/* Upload */}
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs"
                style={{ background: '#231008', border: '1px solid #3d1a08', color: '#c8972a' }}>
                <Upload size={12} /> Image
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadHandout(e.target.files[0], 'image')} />
            </div>

            {/* Handouts grid */}
            <div className="grid grid-cols-3 gap-2">
              {handouts.map(h => {
                const active = session.currentHandoutId === h.id
                return (
                  <div key={h.id} className="rounded overflow-hidden flex flex-col"
                    style={{ background: '#231008', border: `1px solid ${active ? '#c8972a' : '#3d1a08'}` }}>
                    {h.type === 'image' && h.thumb && (
                      <div className="h-16 overflow-hidden relative">
                        <img src={h.thumb} alt={h.title} className="w-full h-full object-cover opacity-80" />
                        {active && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(200,151,42,0.3)' }}>
                            <Eye size={16} style={{ color: '#c8972a' }} />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-1 flex items-center gap-1">
                      <span className="flex-1 text-xs truncate" style={{ color: '#8a7055' }}>{h.title}</span>
                      <button onClick={() => active ? session.clearHandout() : session.showHandout(h.id)}
                        className="p-1 rounded" style={{ color: active ? '#c8972a' : '#5a4535' }}>
                        <Eye size={10} />
                      </button>
                      <button onClick={() => deleteHandout(h.id)}
                        className="p-1 rounded" style={{ color: '#8b1a1a' }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {handouts.length === 0 && (
                <div className="col-span-3 text-center py-6 text-xs" style={{ color: '#3d1a08' }}>
                  Aucun handout. Uploadez des images.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map tab */}
        {tab === 'map' && (
          <div className="p-3 flex flex-col gap-3">
            <div className="flex gap-2">
              <button onClick={() => mapFileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs"
                style={{ background: '#231008', border: '1px solid #3d1a08', color: '#c8972a' }}>
                <Upload size={12} /> Uploader carte
              </button>
              <input ref={mapFileRef} type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  if (!e.target.files?.[0]) return
                  await uploadHandout(e.target.files[0], 'image')
                  const res = await fetch(`${serverBase}/api/handouts`)
                  const hs = await res.json()
                  if (hs.length) {
                    const last = hs[hs.length - 1]
                    setMapHandout(last)
                    session.showMap(last.id)
                  }
                  loadHandouts()
                }} />
            </div>
            {/* Map selector */}
            {handouts.filter(h => h.type === 'image').length > 0 && (
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#5a4535' }}>Choisir une carte</label>
                <select
                  onChange={async (e) => {
                    const h = handouts.find(x => x.id === e.target.value)
                    if (h) { setMapHandout(h); session.showMap(h.id) }
                  }}
                  className="w-full px-2 py-1.5 rounded text-sm outline-none"
                  style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}>
                  <option value="">— Choisir —</option>
                  {handouts.filter(h => h.type === 'image').map(h => (
                    <option key={h.id} value={h.id}>{h.title}</option>
                  ))}
                </select>
              </div>
            )}
            {mapHandout && (
              <MapWithPins
                handoutId={mapHandout.id}
                pins={session.mapPins}
                onPinsChange={session.updatePins}
                isKeeper
              />
            )}
          </div>
        )}

        {/* Players tab */}
        {tab === 'players' && (
          <div className="p-3 flex flex-col gap-3">
            {/* QR Code info */}
            <div className="rounded-lg p-3 text-center" style={{ background: '#231008', border: '1px solid #3d1a08' }}>
              <div className="text-xs mb-1" style={{ color: '#5a4535' }}>Joueurs : connectez-vous sur</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#c8972a' }}>
                {session.lanHost ? `https://${session.lanHost}` : '—'}
              </div>
              <div className="text-xs mt-1" style={{ color: '#3d1a08' }}>
                (même réseau WiFi)
              </div>
            </div>

            {session.players.filter(p => p.role === 'player').length === 0 ? (
              <div className="text-center text-xs py-4" style={{ color: '#3d1a08' }}>En attente de joueurs…</div>
            ) : (
              <div className="flex flex-col gap-2">
                {session.players.filter(p => p.role === 'player').map(p => (
                  <div key={p.name} className="flex items-center gap-3 p-2 rounded"
                    style={{ background: '#1a0a00', border: '1px solid #3d1a08' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: '#27ae60' }} />
                    <span className="text-sm" style={{ color: '#e8d5b0' }}>{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Dice log */}
            {session.diceLog.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#8a7055' }}>Derniers jets</div>
                <div className="flex flex-col gap-1">
                  {session.diceLog.slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded"
                      style={{ background: '#1a0a00' }}>
                      <span style={{ color: '#5a4535' }}>{entry.roller}</span>
                      <span style={{ color: '#3d1a08' }}>—</span>
                      <span style={{ color: '#8a7055' }}>{entry.skill}</span>
                      <span className="font-bold ml-auto" style={{ color: entry.color }}>{entry.roll}</span>
                      <span className="text-xs" style={{ color: entry.color }}>{entry.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
