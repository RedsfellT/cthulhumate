import { useState } from 'react'
import { checkSkill, rollD100 } from '../../lib/dice'
import { type Character } from '../../db/database'
import { AlertTriangle } from 'lucide-react'

interface Props {
  character: Character
  onApply: (sanLoss: number, newSan: number) => void
  onClose: () => void
}

export function SanRoll({ character, onApply, onClose }: Props) {
  const [successLoss, setSuccessLoss] = useState('0')
  const [failLoss, setFailLoss] = useState('1d6')
  const [result, setResult] = useState<{
    roll: number
    success: boolean
    loss: number
    newSan: number
    folie: boolean
    folieType: string
  } | null>(null)

  function parseLoss(formula: string): number {
    formula = formula.trim().toLowerCase()
    if (!formula || formula === '0') return 0
    const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/)
    if (match) {
      const count = parseInt(match[1])
      const sides = parseInt(match[2])
      const mod = parseInt(match[3] || '0')
      let total = 0
      for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1
      return Math.max(0, total + mod)
    }
    return parseInt(formula) || 0
  }

  const FOLIE_TABLE: [number, number, string][] = [
    [1, 20, 'Amnésie (perd souvenir des dernières heures)'],
    [21, 30, 'Fuite panique (s\'enfuit en hurlant)'],
    [31, 40, 'Violence incontrôlée (attaque chose la plus proche)'],
    [41, 50, 'Catatonie (incapable d\'agir)'],
    [51, 60, 'Crise d\'hystérie incontrôlable'],
    [61, 70, 'Phobie irrationnelle (roll 1d10 pour type)'],
    [71, 75, 'Comportement maniaque'],
    [76, 85, 'Hallucinations vivides'],
    [86, 90, 'Changement de personnalité / dissociation'],
    [91, 99, 'Trouble psychosomatique'],
    [100, 100, 'Folie permanente — jet sur table étendue'],
  ]

  function getFollie(): string {
    const r = Math.floor(Math.random() * 100) + 1
    for (const [min, max, desc] of FOLIE_TABLE) {
      if (r >= min && r <= max) return `${r} — ${desc}`
    }
    return `${r} — Folie temporaire`
  }

  function doRoll() {
    const roll = rollD100()
    const currentSan = character.sanInitial - character.sanCrossed.length
    const check = checkSkill(roll, currentSan)
    const success = ['critical_success', 'extreme_success', 'hard_success', 'success'].includes(check.level)

    const loss = parseLoss(success ? successLoss : failLoss)
    const newSan = Math.max(0, currentSan - loss)
    const folie = loss >= 5 || newSan === 0
    const folieType = folie ? getFollie() : ''

    setResult({ roll, success, loss, newSan, folie, folieType })
  }

  function apply() {
    if (!result) return
    onApply(result.loss, result.newSan)
    onClose()
  }

  const currentSan = character.sanInitial - character.sanCrossed.length

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Current SAN */}
      <div className="text-center">
        <div className="text-sm" style={{ color: '#8a7055' }}>SAN actuelle de {character.name}</div>
        <div className="text-3xl font-bold" style={{ color: '#27ae60', fontFamily: 'Georgia,serif' }}>
          {currentSan}
        </div>
        <div className="text-xs" style={{ color: '#5a4535' }}>/ {character.sanInitial} initial · max {character.sanMax}</div>
      </div>

      {/* Loss inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: '#27ae60' }}>Perte si RÉUSSITE</label>
          <input value={successLoss} onChange={e => setSuccessLoss(e.target.value)}
            placeholder="0 ou 1d3…"
            className="px-3 py-2 rounded text-sm text-center outline-none"
            style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: '#c0392b' }}>Perte si ÉCHEC</label>
          <input value={failLoss} onChange={e => setFailLoss(e.target.value)}
            placeholder="1d6…"
            className="px-3 py-2 rounded text-sm text-center outline-none"
            style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
        </div>
      </div>

      {/* Roll button */}
      <button onClick={doRoll}
        className="w-full py-3 rounded-lg font-semibold text-lg"
        style={{ background: 'linear-gradient(135deg, #1a4a2e, #27ae60)', color: '#fff' }}>
        🧠 Jet de Santé Mentale
      </button>

      {/* Result */}
      {result && (
        <div className="rounded-lg p-4 fade-in flex flex-col gap-3"
          style={{ background: '#0d0500', border: `2px solid ${result.success ? '#27ae60' : '#c0392b'}` }}>
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color: result.success ? '#27ae60' : '#c0392b' }}>
              {result.roll}
            </div>
            <div className="text-sm font-semibold mt-1" style={{ color: result.success ? '#27ae60' : '#c0392b' }}>
              {result.success ? '✓ Réussite' : '✗ Échec'}
            </div>
            <div className="text-xs mt-1" style={{ color: '#5a4535' }}>
              sur {currentSan}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-center">
            <div>
              <div className="text-xs" style={{ color: '#5a4535' }}>Perte SAN</div>
              <div className="text-2xl font-bold" style={{ color: '#c0392b' }}>−{result.loss}</div>
            </div>
            <div className="text-2xl" style={{ color: '#3d1a08' }}>→</div>
            <div>
              <div className="text-xs" style={{ color: '#5a4535' }}>Nouvelle SAN</div>
              <div className="text-2xl font-bold" style={{ color: result.newSan <= 10 ? '#c0392b' : '#27ae60' }}>
                {result.newSan}
              </div>
            </div>
          </div>

          {result.folie && (
            <div className="rounded p-3" style={{ background: '#2a0505', border: '1px solid #8b1a1a' }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} style={{ color: '#c0392b' }} />
                <span className="text-sm font-bold" style={{ color: '#c0392b' }}>
                  {result.newSan === 0 ? 'FOLIE PERMANENTE !' : 'FOLIE TEMPORAIRE !'}
                </span>
              </div>
              <div className="text-xs" style={{ color: '#8a7055' }}>{result.folieType}</div>
            </div>
          )}

          <button onClick={apply}
            className="w-full py-2.5 rounded-lg font-semibold"
            style={{ background: '#1a4a2e', color: '#27ae60', border: '1px solid #27ae60' }}>
            Appliquer la perte
          </button>
        </div>
      )}
    </div>
  )
}
