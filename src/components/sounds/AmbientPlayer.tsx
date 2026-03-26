import { useState } from 'react'
import { Volume2, VolumeX, Music } from 'lucide-react'
import { startSound, stopSound, setVolume, stopAll, type AmbientType } from '../../lib/audio'

const SOUNDS: { type: AmbientType; label: string; icon: string; desc: string }[] = [
  { type: 'rain',      label: 'Pluie',          icon: '🌧️', desc: 'Pluie douce' },
  { type: 'storm',     label: 'Orage',          icon: '⛈️', desc: 'Orage + tonnerre' },
  { type: 'wind',      label: 'Vent',           icon: '💨', desc: 'Vent lugubre' },
  { type: 'fire',      label: 'Feu',            icon: '🔥', desc: 'Crépitement' },
  { type: 'ocean',     label: 'Océan',          icon: '🌊', desc: 'Vagues lentes' },
  { type: 'heartbeat', label: 'Battement',      icon: '💗', desc: 'Cœur qui bat' },
  { type: 'horror',    label: 'Cordes',         icon: '🎻', desc: 'Nappes horrifiques' },
  { type: 'asylum',    label: 'Asile',          icon: '🏚️', desc: 'Murmures distants' },
]

export function AmbientPlayer() {
  const [volumes, setVolumes] = useState<Record<AmbientType, number>>(
    Object.fromEntries(SOUNDS.map(s => [s.type, 0.5])) as Record<AmbientType, number>
  )
  const [playing, setPlaying] = useState<Set<AmbientType>>(new Set())

  function toggle(type: AmbientType) {
    if (playing.has(type)) {
      stopSound(type)
      setPlaying(prev => { const s = new Set(prev); s.delete(type); return s })
    } else {
      startSound(type, volumes[type])
      setPlaying(prev => new Set([...prev, type]))
    }
  }

  function handleVolume(type: AmbientType, vol: number) {
    setVolumes(prev => ({ ...prev, [type]: vol }))
    if (playing.has(type)) setVolume(type, vol)
  }

  function handleStopAll() {
    stopAll()
    setPlaying(new Set())
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs" style={{ color: '#c8972a' }}>
          <Music size={14} />
          <span className="font-semibold">Ambiances sonores</span>
        </div>
        {playing.size > 0 && (
          <button onClick={handleStopAll} className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ background: '#3d1a08', color: '#8a7055' }}>
            <VolumeX size={12} /> Tout couper
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SOUNDS.map(({ type, label, icon, desc }) => {
          const active = playing.has(type)
          return (
            <div key={type} className="rounded-lg p-2 flex flex-col gap-1.5 transition-all"
              style={{
                background: active ? '#231008' : '#1a0a00',
                border: `1px solid ${active ? '#c8972a' : '#3d1a08'}`,
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span>{icon}</span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: active ? '#c8972a' : '#8a7055' }}>{label}</div>
                    <div style={{ color: '#3d1a08', fontSize: '0.6rem' }}>{desc}</div>
                  </div>
                </div>
                <button onClick={() => toggle(type)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: active ? '#c8972a' : '#3d1a08', color: active ? '#0d0500' : '#5a4535' }}>
                  {active ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={volumes[type]}
                onChange={e => handleVolume(type, parseFloat(e.target.value))}
                className="w-full h-1 rounded appearance-none cursor-pointer"
                style={{ accentColor: '#c8972a' }}
                disabled={!active}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
