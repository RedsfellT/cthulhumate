import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import type { MapPin as Pin } from '../../store/useSessionStore'
import { useSessionStore } from '../../store/useSessionStore'

interface Props {
  handoutId: string
  pins: Pin[]
  onPinsChange: (pins: Pin[]) => void
  isKeeper?: boolean
}

const PIN_COLORS = ['#c8972a', '#c0392b', '#27ae60', '#3498db', '#9b59b6', '#e67e22']

export function MapWithPins({ handoutId, pins, onPinsChange, isKeeper }: Props) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [newPinLabel, setNewPinLabel] = useState('')
  const [newPinColor, setNewPinColor] = useState(PIN_COLORS[0])
  const imgRef = useRef<HTMLDivElement>(null)
  const lanHost = useSessionStore(s => s.lanHost)
  const serverBase = lanHost ? `https://${lanHost}` : ''

  useEffect(() => {
    fetch(`${serverBase}/api/handout/${handoutId}`)
      .then(r => r.json())
      .then(h => setImageData(h.data))
      .catch(() => {})
  }, [handoutId, serverBase])

  function handleMapClick(e: React.MouseEvent) {
    if (!isKeeper || !addMode) return
    const rect = imgRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const newPin: Pin = {
      id: crypto.randomUUID(),
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      label: newPinLabel || 'Point',
      color: newPinColor,
    }
    onPinsChange([...pins, newPin])
    setAddMode(false)
    setNewPinLabel('')
  }

  function removePin(id: string) {
    onPinsChange(pins.filter(p => p.id !== id))
  }

  if (!imageData) return (
    <div className="flex items-center justify-center h-32 text-xs" style={{ color: '#5a4535' }}>
      Chargement de la carte…
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {isKeeper && (
        <div className="flex gap-2 items-center flex-wrap">
          <input value={newPinLabel} onChange={e => setNewPinLabel(e.target.value)}
            placeholder="Label du marqueur…"
            className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
            style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
          <div className="flex gap-1">
            {PIN_COLORS.map(c => (
              <button key={c} onClick={() => setNewPinColor(c)}
                className="w-5 h-5 rounded-full transition-all"
                style={{ background: c, border: `2px solid ${newPinColor === c ? '#fff' : 'transparent'}` }} />
            ))}
          </div>
          <button
            onClick={() => setAddMode(a => !a)}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs"
            style={{ background: addMode ? '#c8972a' : '#231008', color: addMode ? '#0d0500' : '#8a7055', border: '1px solid #3d1a08' }}>
            <Plus size={12} /> {addMode ? 'Cliquer sur la carte…' : 'Ajouter marqueur'}
          </button>
        </div>
      )}

      {/* Map container */}
      <div
        ref={imgRef}
        className="relative rounded overflow-hidden select-none"
        style={{ cursor: addMode ? 'crosshair' : 'default' }}
        onClick={handleMapClick}
      >
        <img src={imageData} alt="Carte" className="w-full h-auto block" draggable={false} />

        {/* Pins */}
        {pins.map(pin => (
          <div
            key={pin.id}
            className="absolute flex items-center gap-1 group"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: 10,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="px-1.5 py-0.5 rounded text-xs font-bold whitespace-nowrap"
                style={{ background: pin.color, color: '#000', fontSize: '0.6rem', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pin.label}
              </div>
              <div className="w-2 h-2 rounded-full" style={{ background: pin.color }} />
            </div>
            {isKeeper && (
              <button
                onClick={() => removePin(pin.id)}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full flex items-center justify-center ml-1 transition-all"
                style={{ background: '#8b1a1a', color: '#fff' }}>
                <X size={8} />
              </button>
            )}
          </div>
        ))}
      </div>

      {pins.length > 0 && (
        <div className="text-xs" style={{ color: '#3d1a08' }}>{pins.length} marqueur(s)</div>
      )}
    </div>
  )
}
