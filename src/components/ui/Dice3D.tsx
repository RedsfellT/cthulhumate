import { useState, useEffect } from 'react'

interface Props {
  value: number | null   // null = encore en train de calculer
  label?: string         // "Réussite Critique", "Fumble", etc.
  color?: string
  onDismiss: () => void
}

const S = 100   // taille d'une face (px)
const H = S / 2 // demi-taille = translateZ

const baseface: React.CSSProperties = {
  position: 'absolute',
  width: S,
  height: S,
  background: 'linear-gradient(145deg, #2a1208 0%, #0d0500 100%)',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
}

interface FaceProps {
  transform: string
  children: React.ReactNode
  glow?: boolean
  resultColor?: string
}

function Face({ transform, children, glow, resultColor }: FaceProps) {
  return (
    <div style={{
      ...baseface,
      transform,
      border: glow
        ? `2px solid ${resultColor || '#c8972a'}`
        : '1.5px solid rgba(200,151,42,0.28)',
      animation: glow ? 'dice3d-glow-pulse 1.8s ease-in-out infinite' : 'none',
      transition: 'border-color 0.5s ease',
    }}>
      {children}
    </div>
  )
}

export function Dice3DOverlay({ value, label, color, onDismiss }: Props) {
  const [settled, setSettled] = useState(false)
  const rc = color || '#c8972a'

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 960)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 36,
        background: 'rgba(4, 1, 0, 0.93)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: 'pointer',
      }}
    >
      {/* Dé */}
      <div style={{
        animation: 'dice3d-drop 0.55s cubic-bezier(0.22, 1.3, 0.5, 1) both',
        filter: `drop-shadow(0 12px 32px rgba(0,0,0,0.9)) drop-shadow(0 0 ${settled ? 28 : 8}px rgba(200,151,42,${settled ? 0.4 : 0.1}))`,
        transition: 'filter 0.5s ease',
      }}>
        <div style={{ perspective: '700px', width: S, height: S }}>
          <div style={{
            position: 'relative', width: S, height: S,
            transformStyle: 'preserve-3d',
            animation: 'dice3d-spin 0.96s ease-out both',
          }}>

            {/* AVANT — face résultat */}
            <Face transform={`translateZ(${H}px)`} glow={settled} resultColor={rc}>
              {value !== null
                ? <span style={{
                    fontSize: value > 99 ? 22 : value > 9 ? 30 : 38,
                    fontWeight: 900,
                    color: rc,
                    fontFamily: 'Georgia,serif',
                    lineHeight: 1,
                    textShadow: settled ? `0 0 16px ${rc}` : 'none',
                    transition: 'text-shadow 0.5s ease',
                  }}>{value}</span>
                : <span style={{ color: '#3d1a08', fontSize: 16 }}>…</span>
              }
            </Face>

            {/* ARRIÈRE */}
            <Face transform={`rotateY(180deg) translateZ(${H}px)`}>
              <span style={{ color: '#3d1a08', fontSize: 22, opacity: 0.9 }}>✦</span>
            </Face>

            {/* DROITE */}
            <Face transform={`rotateY(90deg) translateZ(${H}px)`}>
              <span style={{ fontSize: 28, opacity: 0.75 }}>🐙</span>
            </Face>

            {/* GAUCHE */}
            <Face transform={`rotateY(-90deg) translateZ(${H}px)`}>
              <span style={{ color: '#3d1a08', fontSize: 22, opacity: 0.9 }}>✦</span>
            </Face>

            {/* DESSUS */}
            <Face transform={`rotateX(-90deg) translateZ(${H}px)`}>
              <span style={{ color: '#3d2010', fontSize: 20 }}>◈</span>
            </Face>

            {/* DESSOUS */}
            <Face transform={`rotateX(90deg) translateZ(${H}px)`}>
              <span style={{ color: '#2a1408', fontSize: 20 }}>◈</span>
            </Face>

          </div>
        </div>
      </div>

      {/* Résultat sous le dé */}
      <div style={{ textAlign: 'center', minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {settled && label && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: rc,
              fontFamily: 'Georgia,serif',
              letterSpacing: '0.04em',
              textShadow: `0 0 24px ${rc}66`,
            }}>
              {label}
            </div>
          </div>
        )}
        <div style={{
          fontSize: 11, letterSpacing: '0.1em',
          color: settled ? '#3d1a08' : 'transparent',
          transition: 'color 0.8s ease',
        }}>
          TOUCHER POUR FERMER
        </div>
      </div>
    </div>
  )
}
