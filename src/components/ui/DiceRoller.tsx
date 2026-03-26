import { useState } from 'react'
import { checkSkill, rollD100, parseDiceFormula, type DiceResult } from '../../lib/dice'
import { useSessionStore } from '../../store/useSessionStore'
import { Modal } from './Modal'
import { OpposedRoll } from './OpposedRoll'

interface SkillRollProps {
  skillName: string
  value: number
  onClose?: () => void
}

export function SkillRollButton({ skillName, value, onClose }: SkillRollProps) {
  const [result, setResult] = useState<DiceResult | null>(null)
  const [rolling, setRolling] = useState(false)
  const [mode, setMode] = useState<'normal' | 'bonus' | 'penalty'>('normal')
  const broadcastDice = useSessionStore(s => s.broadcastDice)
  const connected = useSessionStore(s => s.connected)

  function doRoll() {
    setRolling(true)
    setTimeout(() => {
      let roll: number
      if (mode === 'bonus') {
        const r1 = rollD100(), r2 = rollD100()
        roll = Math.min(r1, r2)
      } else if (mode === 'penalty') {
        const r1 = rollD100(), r2 = rollD100()
        roll = Math.max(r1, r2)
      } else {
        roll = rollD100()
      }
      const res = checkSkill(roll, value)
      setResult(res)
      setRolling(false)
      if (connected) broadcastDice({ skill: skillName, roll, result: res.label, color: res.color })
    }, 580)
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-center">
        <div className="text-xs mb-1" style={{ color: '#8a7055' }}>{skillName}</div>
        <div className="text-2xl font-bold" style={{ color: '#c8972a' }}>{value}%</div>
        <div className="text-xs mt-1" style={{ color: '#5a4535' }}>
          Difficile: {Math.floor(value / 2)}% · Extrême: {Math.floor(value / 5)}%
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        {(['normal', 'bonus', 'penalty'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-3 py-1 rounded text-xs transition-all"
            style={{
              background: mode === m ? '#3d1a08' : 'transparent',
              border: `1px solid ${mode === m ? '#c8972a' : '#3d1a08'}`,
              color: mode === m ? '#c8972a' : '#8a7055',
            }}
          >
            {m === 'normal' ? 'Normal' : m === 'bonus' ? 'Bonus 🎲' : 'Pénalité 🎲'}
          </button>
        ))}
      </div>

      <button
        onClick={doRoll}
        disabled={rolling}
        className="w-full py-3 rounded-lg font-semibold text-white transition-all"
        style={{ background: rolling ? '#3d1a08' : 'linear-gradient(135deg, #8b3a0a, #c8972a)', fontSize: '1.1rem' }}
      >
        <span className={rolling ? 'dice-rolling inline-block' : 'inline-block'}>
          {rolling ? '🎲' : '🎲 Lancer'}
        </span>
      </button>

      {result && !rolling && (
        <div
          className="rounded-lg p-3 text-center fade-in"
          style={{ background: '#0d0500', border: `2px solid ${result.color}` }}
        >
          <div className="text-3xl font-bold" style={{ color: result.color }}>{result.roll}</div>
          <div className="text-sm font-semibold mt-1" style={{ color: result.color }}>{result.label}</div>
          <div className="text-xs mt-1" style={{ color: '#5a4535' }}>
            sur {result.target} · Diff. {Math.floor(result.target / 2)} · Ext. {Math.floor(result.target / 5)}
          </div>
        </div>
      )}

      {onClose && (
        <button onClick={onClose} className="text-xs text-center" style={{ color: '#5a4535' }}>Fermer</button>
      )}
    </div>
  )
}

export function QuickDicePanel() {
  const [lastRolls, setLastRolls] = useState<{ formula: string; result: number; time: string }[]>([])
  const [opposedOpen, setOpposedOpen] = useState(false)

  function roll(formula: string) {
    const result = parseDiceFormula(formula)
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLastRolls(prev => [{ formula, result, time }, ...prev.slice(0, 9)])
  }

  const PRESETS = ['1d3', '1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100', '2d6', '1d6+1', '1d6+2', '2d6+6']

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map(f => (
          <button
            key={f}
            onClick={() => roll(f)}
            className="py-2 rounded text-sm font-semibold transition-all"
            style={{ background: '#231008', border: '1px solid #3d1a08', color: '#c8972a' }}
          >
            {f}
          </button>
        ))}
      </div>

      <button
        onClick={() => setOpposedOpen(true)}
        className="w-full py-2 rounded text-sm font-semibold"
        style={{ background: '#231008', border: '1px solid #3d1a08', color: '#8a7055' }}
      >
        ⚔️ Jet opposé
      </button>

      {lastRolls.length > 0 && (
        <div>
          <div className="text-xs mb-2" style={{ color: '#5a4535' }}>Historique</div>
          <div className="flex flex-col gap-1">
            {lastRolls.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-sm px-2 py-1 rounded" style={{ background: '#1a0a00' }}>
                <span style={{ color: '#8a7055' }}>{r.formula}</span>
                <span className="font-bold" style={{ color: i === 0 ? '#c8972a' : '#e8d5b0' }}>{r.result}</span>
                <span className="text-xs" style={{ color: '#3d1a08' }}>{r.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={opposedOpen} onClose={() => setOpposedOpen(false)} title="Jet opposé">
        <OpposedRoll />
      </Modal>
    </div>
  )
}
