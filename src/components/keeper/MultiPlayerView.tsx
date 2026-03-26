import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { useSessionStore } from '../../store/useSessionStore'
import { Brain, Heart, Zap } from 'lucide-react'

export function MultiPlayerView() {
  const characters = useLiveQuery(() => db.characters.toArray(), [])
  const sessionPlayers = useSessionStore(s => s.players.filter(p => p.role === 'player'))
  const diceLog = useSessionStore(s => s.diceLog)

  if (!characters?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-40">
        <div className="text-3xl">👥</div>
        <div className="text-sm" style={{ color: '#8a7055' }}>Aucun personnage enregistré</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Connected players indicator */}
      {sessionPlayers.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded"
          style={{ background: '#1a2a1a', border: '1px solid #27ae6044' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#27ae60' }} />
          <span className="text-xs" style={{ color: '#27ae60' }}>
            {sessionPlayers.length} joueur(s) connecté(s) : {sessionPlayers.map(p => p.name).join(', ')}
          </span>
        </div>
      )}

      {/* Character cards grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {characters.map(char => {
          const pv = char.pvMax - char.pvCrossed.length
          const san = char.sanInitial - char.sanCrossed.length
          const pm = char.pmMax - char.pmCrossed.length
          const pvPct = char.pvMax > 0 ? pv / char.pvMax : 0
          const sanPct = char.sanInitial > 0 ? san / char.sanInitial : 0
          const pmPct = char.pmMax > 0 ? pm / char.pmMax : 0
          const critical = pvPct <= 0.25 || sanPct <= 0.25

          return (
            <div key={char.id}
              className={`rounded-lg p-3 ${critical ? 'glow-red' : ''}`}
              style={{ background: '#231008', border: `1px solid ${critical ? '#8b1a1a' : '#3d1a08'}` }}>
              {/* Name */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#e8d5b0' }}>{char.name}</div>
                  <div className="text-xs" style={{ color: '#5a4535' }}>
                    {char.player || 'Joueur'} · {char.occupation || char.period}
                  </div>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: '#1a0a00', color: '#3d1a08' }}>
                  {char.period === 'classique' ? '⚙️' : '💻'}
                </span>
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-3 gap-2">
                <VitalBar label="PV" value={pv} max={char.pvMax} pct={pvPct} color="#c8972a" icon={<Heart size={10} />} />
                <VitalBar label="SAN" value={san} max={char.sanInitial} pct={sanPct} color="#27ae60" icon={<Brain size={10} />} />
                <VitalBar label="PM" value={pm} max={char.pmMax} pct={pmPct} color="#3498db" icon={<Zap size={10} />} />
              </div>

              {/* Characteristics row */}
              <div className="mt-2 flex gap-1 justify-between">
                {[
                  { l: 'FOR', v: char.str }, { l: 'DEX', v: char.dex },
                  { l: 'INT', v: char.int }, { l: 'POU', v: char.pow },
                  { l: 'ÉDU', v: char.edu },
                ].map(({ l, v }) => (
                  <div key={l} className="text-center flex-1">
                    <div style={{ color: '#3d1a08', fontSize: '0.55rem' }}>{l}</div>
                    <div className="text-xs font-bold" style={{ color: '#5a4535' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* SAN folie indicators */}
              {(char.sanFolieTemp > 0 || char.sanFoliePercist > 0) && (
                <div className="mt-2 flex gap-2 text-xs">
                  {char.sanFolieTemp > 0 && (
                    <span className="px-1.5 py-0.5 rounded" style={{ background: '#2a1a00', color: '#e67e22' }}>
                      Folie temp.
                    </span>
                  )}
                  {char.sanFoliePercist > 0 && (
                    <span className="px-1.5 py-0.5 rounded" style={{ background: '#2a0505', color: '#c0392b' }}>
                      Folie persist.
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Live dice log */}
      {diceLog.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-semibold mb-1.5" style={{ color: '#8a7055' }}>Jets en direct</div>
          <div className="flex flex-col gap-1">
            {diceLog.slice(0, 6).map((entry, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                style={{ background: '#1a0a00' }}>
                <span className="font-semibold" style={{ color: '#8a7055' }}>{entry.roller}</span>
                <span style={{ color: '#3d1a08' }}>—</span>
                <span style={{ color: '#5a4535' }}>{entry.skill}</span>
                <span className="font-bold ml-auto text-sm" style={{ color: entry.color }}>{entry.roll}</span>
                <span style={{ color: entry.color }}>{entry.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VitalBar({ label, value, max, pct, color, icon }: {
  label: string; value: number; max: number; pct: number; color: string; icon: React.ReactNode
}) {
  const critical = pct <= 0.25
  return (
    <div className="rounded p-1.5 text-center" style={{ background: '#1a0a00' }}>
      <div className="flex items-center justify-center gap-0.5 mb-0.5" style={{ color: critical ? '#c0392b' : color }}>
        {icon}
        <span style={{ fontSize: '0.6rem' }}>{label}</span>
      </div>
      <div className="text-xs font-bold" style={{ color: critical ? '#c0392b' : color }}>
        {value}/{max}
      </div>
      <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: '#0d0500' }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(0, pct) * 100}%`, background: critical ? '#c0392b' : color }} />
      </div>
    </div>
  )
}
