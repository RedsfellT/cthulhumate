import { useState } from 'react'
import { checkSkill, rollD100 } from '../../lib/dice'
import { Swords } from 'lucide-react'

interface Combatant {
  name: string
  skill: string
  value: number
}

export function OpposedRoll() {
  const [a, setA] = useState<Combatant>({ name: 'Personnage A', skill: 'Compétence', value: 50 })
  const [b, setB] = useState<Combatant>({ name: 'Personnage B', skill: 'Compétence', value: 50 })
  const [result, setResult] = useState<null | {
    rollA: number; rollB: number
    levelA: string; levelB: string
    colorA: string; colorB: string
    winner: string; winnerColor: string
  }>(null)

  const LEVEL_ORDER = ['critical_success', 'extreme_success', 'hard_success', 'success', 'fail', 'fumble']

  function roll() {
    const rollA = rollD100()
    const rollB = rollD100()
    const resA = checkSkill(rollA, a.value)
    const resB = checkSkill(rollB, b.value)

    const idxA = LEVEL_ORDER.indexOf(resA.level)
    const idxB = LEVEL_ORDER.indexOf(resB.level)

    let winner: string
    let winnerColor: string
    if (idxA < idxB) {
      winner = `${a.name} l'emporte !`
      winnerColor = resA.color
    } else if (idxB < idxA) {
      winner = `${b.name} l'emporte !`
      winnerColor = resB.color
    } else if (rollA <= a.value && rollB > b.value) {
      winner = `${a.name} l'emporte (réussite vs échec) !`
      winnerColor = resA.color
    } else if (rollB <= b.value && rollA > a.value) {
      winner = `${b.name} l'emporte (réussite vs échec) !`
      winnerColor = resB.color
    } else if (rollA <= a.value && rollB <= b.value) {
      // Both succeed — compare rolls
      winner = rollA <= rollB ? `${a.name} l'emporte (jet plus bas) !` : `${b.name} l'emporte (jet plus bas) !`
      winnerColor = rollA <= rollB ? resA.color : resB.color
    } else {
      winner = 'Égalité — relancez !'
      winnerColor = '#c8972a'
    }

    setResult({ rollA, rollB, levelA: resA.label, levelB: resB.label, colorA: resA.color, colorB: resB.color, winner, winnerColor })
  }

  function CombatantInput({ c, onChange }: { c: Combatant; onChange: (u: Partial<Combatant>) => void }) {
    return (
      <div className="flex flex-col gap-2 flex-1">
        <input value={c.name} onChange={e => onChange({ name: e.target.value })}
          className="px-2 py-1.5 rounded text-sm outline-none font-semibold text-center"
          style={{ background: '#231008', border: '1px solid #3d1a08', color: '#c8972a' }} />
        <input value={c.skill} onChange={e => onChange({ skill: e.target.value })}
          placeholder="Compétence"
          className="px-2 py-1.5 rounded text-sm outline-none text-center"
          style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
        <div className="flex items-center gap-2">
          <input type="number" value={c.value} min={1} max={99}
            onChange={e => onChange({ value: parseInt(e.target.value) || 1 })}
            className="flex-1 px-2 py-1.5 rounded text-sm text-center outline-none font-bold"
            style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#c8972a' }} />
          <span className="text-xs" style={{ color: '#5a4535' }}>%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <CombatantInput c={a} onChange={u => setA(prev => ({ ...prev, ...u }))} />
        <div className="shrink-0">
          <Swords size={24} style={{ color: '#3d1a08' }} />
        </div>
        <CombatantInput c={b} onChange={u => setB(prev => ({ ...prev, ...u }))} />
      </div>

      <button onClick={roll}
        className="w-full py-3 rounded-lg font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)' }}>
        ⚔️ Jet opposé
      </button>

      {result && (
        <div className="rounded-lg p-4 fade-in flex flex-col gap-3"
          style={{ background: '#0d0500', border: `2px solid ${result.winnerColor}` }}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: a.name, skill: a.skill, roll: result.rollA, level: result.levelA, color: result.colorA },
              { name: b.name, skill: b.skill, roll: result.rollB, level: result.levelB, color: result.colorB },
            ].map((side, i) => (
              <div key={i} className="text-center rounded p-2" style={{ background: '#1a0a00' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: '#8a7055' }}>{side.name}</div>
                <div className="text-3xl font-bold" style={{ color: side.color }}>{side.roll}</div>
                <div className="text-xs mt-1" style={{ color: side.color }}>{side.level}</div>
                <div className="text-xs" style={{ color: '#3d1a08' }}>{side.skill}</div>
              </div>
            ))}
          </div>
          <div className="text-center font-bold text-base rounded py-2"
            style={{ background: result.winnerColor + '22', color: result.winnerColor, border: `1px solid ${result.winnerColor}44` }}>
            {result.winner}
          </div>
        </div>
      )}
    </div>
  )
}
