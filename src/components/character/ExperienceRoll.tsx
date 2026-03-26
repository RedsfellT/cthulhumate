import { useState } from 'react'
import { rollD100 } from '../../lib/dice'
import { type Character } from '../../db/database'
import { TrendingUp, Check } from 'lucide-react'

interface Props {
  character: Character
  onApply: (updates: Record<string, number>) => void
  onClose: () => void
}

interface SkillResult {
  key: string
  name: string
  oldValue: number
  roll: number
  success: boolean
  gain: number
  newValue: number
}

export function ExperienceRoll({ character, onApply, onClose }: Props) {
  const [results, setResults] = useState<SkillResult[]>([])
  const [done, setDone] = useState(false)

  const checkedSkills = Object.entries(character.skills)
    .filter(([_, s]) => s.checked && s.value > 0)

  function rollAll() {
    const res: SkillResult[] = []
    for (const [key, skill] of checkedSkills) {
      const roll = rollD100()
      const success = roll > skill.value
      const gain = success ? Math.floor(Math.random() * 10) + 1 : 0
      const newValue = Math.min(99, skill.value + gain)
      // Find display name
      const name = key.replace(/_/g, ' ')
      res.push({ key, name, oldValue: skill.value, roll, success, gain, newValue })
    }
    setResults(res)
    setDone(true)
  }

  function apply() {
    const updates: Record<string, number> = {}
    for (const r of results) {
      if (r.success) updates[r.key] = r.newValue
    }
    onApply(updates)
    onClose()
  }

  const improved = results.filter(r => r.success).length

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="text-center">
        <TrendingUp size={32} style={{ color: '#c8972a', margin: '0 auto 8px' }} />
        <div className="text-sm font-semibold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
          Jets d'expérience — Fin de session
        </div>
        <div className="text-xs mt-1" style={{ color: '#5a4535' }}>
          {checkedSkills.length} compétence(s) cochée(s)
        </div>
      </div>

      {checkedSkills.length === 0 ? (
        <div className="text-center text-sm py-4" style={{ color: '#8a7055' }}>
          Aucune compétence cochée (○) cette session.
        </div>
      ) : !done ? (
        <button onClick={rollAll}
          className="w-full py-3 rounded-lg font-semibold"
          style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}>
          🎲 Lancer tous les jets ({checkedSkills.length})
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-center mb-1" style={{ color: '#8a7055' }}>
            {improved} amélioration(s) sur {results.length}
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {results.map(r => (
              <div key={r.key} className="flex items-center gap-2 px-3 py-2 rounded text-xs"
                style={{ background: r.success ? '#1a2a1a' : '#1a0a00', border: `1px solid ${r.success ? '#27ae60' : '#3d1a08'}` }}>
                <span className="flex-1" style={{ color: '#e8d5b0' }}>{r.name}</span>
                <span style={{ color: '#5a4535' }}>jet {r.roll} / {r.oldValue}</span>
                {r.success ? (
                  <span className="font-bold" style={{ color: '#27ae60' }}>
                    {r.oldValue} → {r.newValue} (+{r.gain})
                  </span>
                ) : (
                  <span style={{ color: '#5a4535' }}>pas d'amélioration</span>
                )}
              </div>
            ))}
          </div>
          <button onClick={apply}
            className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2"
            style={{ background: '#1a4a2e', color: '#27ae60', border: '1px solid #27ae60' }}>
            <Check size={16} /> Appliquer et décocher les cercles
          </button>
        </div>
      )}
    </div>
  )
}
