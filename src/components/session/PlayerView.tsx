import { useState } from 'react'
import { useSessionStore } from '../../store/useSessionStore'
import { Wifi, Dice6 } from 'lucide-react'
import { MapWithPins } from './MapWithPins'

export function PlayerView() {
  const session = useSessionStore()
  const [name, setName] = useState('')
  const [code, setCode] = useState(session.roomCode)

  function join() {
    const n = name.trim() || 'Joueur'
    const roomCode = code.trim().toUpperCase()
    if (!roomCode) return
    session.setRoomCode(roomCode)
    session.connect(n, 'player', roomCode)
  }

  if (!session.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-6"
        style={{ background: '#0d0500' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🐙</div>
          <div className="text-xl font-bold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
            CthulhuMate V7
          </div>
          <div className="text-sm mt-1" style={{ color: '#5a4535' }}>Rejoindre la session</div>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && join()}
            placeholder="Votre nom de joueur"
            className="w-full px-4 py-3 rounded-lg text-center text-base outline-none"
            style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}
            autoFocus
          />
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && join()}
            placeholder="Code de salle (ex: ABC123)"
            className="w-full px-4 py-2 rounded-lg text-center text-base outline-none font-mono tracking-widest"
            style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#c8972a', letterSpacing: '0.2em' }}
            maxLength={8}
          />
          <div className="text-xs text-center" style={{ color: '#3d1a08' }}>
            Le code est affiché dans l'écran du Gardien
          </div>
          <button onClick={join}
            disabled={!code.trim()}
            className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)' }}>
            Rejoindre
          </button>
        </div>
      </div>
    )
  }

  const handout = session.currentHandoutData
  const mapData = session.currentMapData

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0500' }}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ background: '#1a0a00', borderBottom: '1px solid #3d1a08' }}>
        <div className="flex items-center gap-2">
          <Wifi size={14} style={{ color: '#27ae60' }} />
          <span className="text-sm" style={{ color: '#e8d5b0' }}>{session.playerName}</span>
          <span className="text-xs" style={{ color: '#5a4535' }}>
            · {session.players.filter(p => p.role === 'player').length} joueur(s)
          </span>
        </div>
        <button onClick={() => session.disconnect()}
          className="text-xs px-2 py-1 rounded"
          style={{ background: '#231008', color: '#5a4535', border: '1px solid #3d1a08' }}>
          Quitter
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Atmosphere */}
        {session.atmosphere && (
          <div className="m-4 p-4 rounded-lg text-center italic"
            style={{ background: '#231008', border: '1px solid #c8972a44', color: '#e8d5b0' }}>
            <div className="text-sm" style={{ color: '#8a7055', marginBottom: 4 }}>Le Gardien dit…</div>
            <div className="text-base" style={{ fontFamily: 'Georgia,serif', color: '#c8972a' }}>
              "{session.atmosphere}"
            </div>
          </div>
        )}

        {/* Handout display */}
        {handout && (
          <div className="m-4 fade-in">
            <div className="text-xs mb-2 text-center" style={{ color: '#5a4535' }}>{handout.title}</div>
            {handout.type === 'image' && (
              <img src={handout.data} alt={handout.title}
                className="w-full rounded-lg" style={{ maxHeight: '60vh', objectFit: 'contain' }} />
            )}
            {handout.type === 'text' && (
              <div className="p-4 rounded-lg text-sm whitespace-pre-wrap"
                style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0', fontFamily: 'Georgia,serif' }}>
                {handout.data}
              </div>
            )}
          </div>
        )}

        {/* Map */}
        {mapData && (
          <div className="m-4 fade-in">
            <MapWithPins
              imageData={mapData}
              pins={session.mapPins}
              onPinsChange={() => {}}
              isKeeper={false}
            />
          </div>
        )}

        {/* Dice log */}
        {session.diceLog.length > 0 && (
          <div className="m-4">
            <div className="text-xs font-semibold mb-2" style={{ color: '#8a7055' }}>
              <Dice6 size={12} className="inline mr-1" />Derniers jets
            </div>
            <div className="flex flex-col gap-1">
              {session.diceLog.slice(0, 8).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded text-sm"
                  style={{ background: '#1a0a00', border: '1px solid #231008' }}>
                  <span className="font-semibold" style={{ color: '#8a7055' }}>{entry.roller}</span>
                  <span style={{ color: '#3d1a08' }}>·</span>
                  <span style={{ color: '#5a4535' }}>{entry.skill}</span>
                  <span className="font-bold ml-auto text-lg" style={{ color: entry.color }}>{entry.roll}</span>
                  <span className="text-xs" style={{ color: entry.color }}>{entry.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!handout && !mapData && session.diceLog.length === 0 && !session.atmosphere && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
            <div className="text-5xl">🐙</div>
            <div className="text-sm" style={{ color: '#8a7055' }}>En attente du Gardien…</div>
          </div>
        )}
      </div>
    </div>
  )
}
