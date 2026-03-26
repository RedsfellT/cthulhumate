import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSessionStore, generateRoomCode } from '../../store/useSessionStore'
import { db } from '../../db/database'
import type { Handout } from '../../db/database'
import { Upload, X, Send, Wifi, WifiOff, Eye, Trash2, Copy, Check } from 'lucide-react'
import { MapWithPins } from './MapWithPins'

export function SessionPanel() {
  const session = useSessionStore()
  const handouts = useLiveQuery(() => db.handouts.orderBy('createdAt').toArray(), []) ?? []
  const [atmosphere, setAtmosphere] = useState('')
  const [mapHandout, setMapHandout] = useState<Handout | null>(null)
  const [tab, setTab] = useState<'handouts' | 'map' | 'players'>('handouts')
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mapFileRef = useRef<HTMLInputElement>(null)

  const isConnected = session.connected && session.role === 'keeper'

  async function uploadHandout(file: File, type: 'image' | 'text' = 'image') {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = e.target?.result as string
      const title = file.name.replace(/\.[^.]+$/, '')
      await db.handouts.add({ id: crypto.randomUUID(), title, type, data, createdAt: new Date() })
    }
    if (type === 'image') reader.readAsDataURL(file)
    else reader.readAsText(file)
  }

  async function deleteHandout(id: string) {
    await db.handouts.delete(id)
    if (session.currentHandoutId === id) session.clearHandout()
    if (mapHandout?.id === id) setMapHandout(null)
  }

  function sendAtmosphere() {
    if (atmosphere.trim()) {
      session.sendAtmosphere(atmosphere)
      setAtmosphere('')
    }
  }

  function startSession() {
    const code = generateRoomCode()
    session.setRoomCode(code)
    session.connect('Gardien', 'keeper', code)
  }

  function copyCode() {
    navigator.clipboard.writeText(session.roomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex flex-col gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid #3d1a08' }}>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isConnected
              ? <Wifi size={14} style={{ color: '#27ae60' }} />
              : <WifiOff size={14} style={{ color: '#5a4535' }} />}
            <span className="text-xs font-semibold" style={{ color: isConnected ? '#27ae60' : '#5a4535' }}>
              {isConnected
                ? `Session active · ${session.players.filter(p => p.role === 'player').length} joueur(s)`
                : 'Session inactive'}
            </span>
          </div>

          {!isConnected && (
            <button
              onClick={startSession}
              className="text-xs px-3 py-1.5 rounded font-semibold"
              style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}>
              Créer session
            </button>
          )}
          {isConnected && (
            <button onClick={session.disconnect} className="text-xs px-2 py-1 rounded"
              style={{ background: '#3d1a08', color: '#8a7055' }}>
              Terminer
            </button>
          )}
        </div>

        {/* Room code display */}
        {isConnected && session.roomCode && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: '#231008', border: '1px solid #3d1a08' }}>
            <div className="flex-1">
              <div className="text-xs mb-0.5" style={{ color: '#5a4535' }}>Code de salle — à donner aux joueurs</div>
              <div className="font-mono text-xl font-bold tracking-widest" style={{ color: '#c8972a' }}>
                {session.roomCode}
              </div>
            </div>
            <button onClick={copyCode} className="p-2 rounded"
              style={{ background: copied ? '#27ae60' : '#3d1a08', color: '#fff' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
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
                    {h.type === 'image' && (
                      <div className="h-16 overflow-hidden relative">
                        <img src={h.data} alt={h.title} className="w-full h-full object-cover opacity-80" />
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
                      <button
                        onClick={() => active
                          ? session.clearHandout()
                          : session.showHandout({ id: h.id, data: h.data, title: h.title, type: h.type })}
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
                  const all = await db.handouts.orderBy('createdAt').toArray()
                  if (all.length) {
                    const last = all[all.length - 1]
                    setMapHandout(last)
                    session.showMap(last.id, last.data, session.mapPins)
                  }
                }} />
            </div>

            {/* Map selector */}
            {handouts.filter(h => h.type === 'image').length > 0 && (
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#5a4535' }}>Choisir une carte</label>
                <select
                  value={mapHandout?.id ?? ''}
                  onChange={(e) => {
                    const h = handouts.find(x => x.id === e.target.value)
                    if (h) { setMapHandout(h); session.showMap(h.id, h.data, []) }
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
                imageData={mapHandout.data}
                pins={session.mapPins}
                onPinsChange={(pins) => {
                  session.updatePins(pins)
                  session.showMap(mapHandout.id, mapHandout.data, pins)
                }}
                isKeeper
              />
            )}
          </div>
        )}

        {/* Players tab */}
        {tab === 'players' && (
          <div className="p-3 flex flex-col gap-3">
            <div className="rounded-lg p-3 text-center" style={{ background: '#231008', border: '1px solid #3d1a08' }}>
              <div className="text-xs mb-1" style={{ color: '#5a4535' }}>
                Les joueurs rejoignent via l'onglet <strong style={{ color: '#8a7055' }}>Session</strong> de leur app
              </div>
              {session.roomCode ? (
                <div className="font-mono text-2xl font-bold tracking-widest mt-1" style={{ color: '#c8972a' }}>
                  {session.roomCode}
                </div>
              ) : (
                <div className="text-sm mt-1" style={{ color: '#3d1a08' }}>Créez d'abord une session</div>
              )}
            </div>

            {session.players.filter(p => p.role === 'player').length === 0 ? (
              <div className="text-center text-xs py-4" style={{ color: '#3d1a08' }}>En attente de joueurs…</div>
            ) : (
              <div className="flex flex-col gap-2">
                {session.players.filter(p => p.role === 'player').map(p => (
                  <div key={p.peerId} className="flex items-center gap-3 p-2 rounded"
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
                      <span style={{ color: entry.color }}>{entry.result}</span>
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
