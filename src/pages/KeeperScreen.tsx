import { useState, useRef } from 'react'
import { Eye, Trash2, ChevronDown, ChevronUp, Dice6 } from 'lucide-react'
import { checkSkill, rollD100 } from '../lib/dice'
import { SessionPanel } from '../components/session/SessionPanel'
import { AmbientPlayer } from '../components/sounds/AmbientPlayer'
import { NpcGenerator } from '../components/keeper/NpcGenerator'
import { MultiPlayerView } from '../components/keeper/MultiPlayerView'

// ── NPC ──────────────────────────────────────────────────────
interface Npc {
  id: string
  name: string
  hp: number
  hpMax: number
  san: number
  notes: string
  initiative: number
}


type KeeperTab = 'combat' | 'npcs' | 'refs' | 'timer' | 'session' | 'ambiances'

export function KeeperScreen() {
  const [tab, setTab] = useState<KeeperTab>('combat')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid #3d1a08', background: '#1a0a00' }}>
        <Eye size={18} style={{ color: '#c8972a' }} />
        <span className="text-sm font-semibold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>Écran du Gardien</span>
      </div>

      <div className="shrink-0 flex overflow-x-auto" style={{ borderBottom: '1px solid #3d1a08' }}>
        {([
          { id: 'combat', label: '⚔️ Combat' },
          { id: 'session', label: '📡 Session' },
          { id: 'npcs', label: '👥 PNJs' },
          { id: 'ambiances', label: '🎵 Ambiances' },
          { id: 'refs', label: '📋 Références' },
          { id: 'timer', label: '⏱️ Minuteur' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-xs shrink-0 transition-all"
            style={{
              color: tab === t.id ? '#c8972a' : '#5a4535',
              borderBottom: `2px solid ${tab === t.id ? '#c8972a' : 'transparent'}`,
              background: tab === t.id ? '#231008' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'combat' && <CombatTab />}
        {tab === 'session' && <SessionPanel />}
        {tab === 'npcs' && <NpcsAndGeneratorTab />}
        {tab === 'ambiances' && <AmbientPlayer />}
        {tab === 'refs' && <RefsTab />}
        {tab === 'timer' && <TimerTab />}
      </div>
    </div>
  )
}

// ── NPCs + Generator Tab ──────────────────────────────────────
function NpcsAndGeneratorTab() {
  const [subtab, setSubtab] = useState<'manage' | 'generate' | 'players'>('manage')
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex border-b" style={{ borderColor: '#231008' }}>
        {([
          { id: 'manage', label: 'Gérer PNJs' },
          { id: 'generate', label: '✨ Générer' },
          { id: 'players', label: '👥 Vue joueurs' },
        ] as const).map(s => (
          <button key={s.id} onClick={() => setSubtab(s.id)}
            className="px-4 py-1.5 text-xs transition-all"
            style={{
              color: subtab === s.id ? '#c8972a' : '#5a4535',
              borderBottom: `2px solid ${subtab === s.id ? '#c8972a' : 'transparent'}`,
            }}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {subtab === 'manage' && <NpcsTab />}
        {subtab === 'generate' && <NpcGenerator />}
        {subtab === 'players' && <MultiPlayerView />}
      </div>
    </div>
  )
}

// ── Combat Tab ──────────────────────────────────────────────
interface Combatant { id: string; name: string; dex: number; roll?: number; initiative?: number; hp: number; hpMax: number; isNpc: boolean }

function CombatTab() {
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [round, setRound] = useState(1)
  const [addName, setAddName] = useState('')
  const [addDex, setAddDex] = useState(50)
  const [addHp, setAddHp] = useState(10)
  const [isNpc, setIsNpc] = useState(false)

  function addCombatant() {
    const name = addName.trim() || 'Combattant'
    setCombatants(prev => [...prev, { id: crypto.randomUUID(), name, dex: addDex, hp: addHp, hpMax: addHp, isNpc }])
    setAddName('')
  }

  function rollInitiatives() {
    setCombatants(prev => prev
      .map(c => {
        const roll = rollD100()
        const success = checkSkill(roll, c.dex)
        const speed = ['critical_success', 'extreme_success'].includes(success.level) ? 3
          : success.level === 'hard_success' ? 2
          : success.level === 'success' ? 1
          : 0
        return { ...c, roll, initiative: speed * 100 + c.dex }
      })
      .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))
    )
  }

  function updateHp(id: string, delta: number) {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, hp: Math.max(0, Math.min(c.hpMax, c.hp + delta)) } : c))
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Add form */}
      <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: '#231008', border: '1px solid #3d1a08' }}>
        <div className="text-xs font-semibold" style={{ color: '#c8972a' }}>Ajouter combattant</div>
        <div className="flex gap-2 flex-wrap">
          <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Nom"
            className="flex-1 min-w-24 px-2 py-1 rounded text-sm outline-none"
            style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: '#5a4535' }}>DEX</span>
            <input type="number" value={addDex} onChange={e => setAddDex(parseInt(e.target.value) || 50)} min={1} max={99}
              className="w-14 text-center px-2 py-1 rounded text-sm outline-none"
              style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: '#5a4535' }}>PV</span>
            <input type="number" value={addHp} onChange={e => setAddHp(parseInt(e.target.value) || 10)} min={1}
              className="w-14 text-center px-2 py-1 rounded text-sm outline-none"
              style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
          </div>
          <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#8a7055' }}>
            <input type="checkbox" checked={isNpc} onChange={e => setIsNpc(e.target.checked)} className="accent-amber-600" />
            PNJ
          </label>
          <button onClick={addCombatant} className="px-3 py-1 rounded text-sm"
            style={{ background: '#3d1a08', color: '#c8972a' }}>
            + Ajouter
          </button>
        </div>
      </div>

      {/* Controls */}
      {combatants.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={rollInitiatives} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm"
            style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}>
            <Dice6 size={14} /> Lancer initiatives
          </button>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#8a7055' }}>
            Round
            <button onClick={() => setRound(r => Math.max(1, r - 1))} className="px-2 rounded" style={{ background: '#231008', color: '#c8972a' }}>−</button>
            <span className="font-bold text-base" style={{ color: '#c8972a' }}>{round}</span>
            <button onClick={() => setRound(r => r + 1)} className="px-2 rounded" style={{ background: '#231008', color: '#c8972a' }}>+</button>
          </div>
          <button onClick={() => { setCombatants([]); setRound(1) }} className="ml-auto px-2 py-1.5 rounded text-xs"
            style={{ color: '#5a4535' }}>
            Réinitialiser
          </button>
        </div>
      )}

      {/* Combatants list */}
      <div className="flex flex-col gap-1.5">
        {combatants.map((c, idx) => (
          <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded"
            style={{ background: '#1a0a00', border: `1px solid ${c.hp <= 0 ? '#8b1a1a' : '#3d1a08'}`, opacity: c.hp <= 0 ? 0.5 : 1 }}>
            <span className="text-xs font-bold w-6 text-center" style={{ color: '#3d1a08' }}>#{idx + 1}</span>
            <span className="flex-1 text-sm" style={{ color: c.isNpc ? '#8a7055' : '#e8d5b0' }}>{c.name}</span>
            {c.initiative !== undefined && (
              <span className="text-xs px-1.5 rounded" style={{ background: '#231008', color: '#c8972a' }}>
                Init: {c.initiative > 200 ? '⭐' : c.initiative > 100 ? '✓' : '✗'}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button onClick={() => updateHp(c.id, -1)} className="w-6 h-6 rounded text-sm font-bold" style={{ background: '#3d1a08', color: '#c0392b' }}>−</button>
              <span className="text-sm font-bold w-12 text-center" style={{ color: c.hp <= Math.floor(c.hpMax / 2) ? '#c0392b' : '#c8972a' }}>
                {c.hp}/{c.hpMax}
              </span>
              <button onClick={() => updateHp(c.id, 1)} className="w-6 h-6 rounded text-sm font-bold" style={{ background: '#3d1a08', color: '#27ae60' }}>+</button>
            </div>
            <button onClick={() => setCombatants(prev => prev.filter(x => x.id !== c.id))} className="p-1" style={{ color: '#3d1a08' }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── NPCs Tab ──────────────────────────────────────────────────
function NpcsTab() {
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [addName, setAddName] = useState('')

  function addNpc() {
    const name = addName.trim() || 'PNJ'
    setNpcs(prev => [...prev, { id: crypto.randomUUID(), name, hp: 10, hpMax: 10, san: 50, notes: '', initiative: 0 }])
    setAddName('')
  }

  function updateNpc(id: string, updates: Partial<Npc>) {
    setNpcs(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="flex gap-2">
        <input value={addName} onChange={e => setAddName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNpc()}
          placeholder="Nom du PNJ…"
          className="flex-1 px-3 py-1.5 rounded text-sm outline-none"
          style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
        <button onClick={addNpc} className="px-3 py-1.5 rounded text-sm" style={{ background: '#3d1a08', color: '#c8972a' }}>+ PNJ</button>
      </div>

      <div className="flex flex-col gap-2">
        {npcs.map(npc => (
          <div key={npc.id} className="rounded-lg p-3 flex flex-col gap-2" style={{ background: '#1a0a00', border: '1px solid #3d1a08' }}>
            <div className="flex items-center gap-2">
              <input value={npc.name} onChange={e => updateNpc(npc.id, { name: e.target.value })}
                className="flex-1 font-semibold bg-transparent outline-none text-sm"
                style={{ color: '#c8972a' }} />
              <button onClick={() => setNpcs(prev => prev.filter(n => n.id !== npc.id))} style={{ color: '#3d1a08' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex gap-3">
              <label className="flex flex-col gap-0.5 text-xs" style={{ color: '#5a4535' }}>
                PV
                <div className="flex items-center gap-1">
                  <button onClick={() => updateNpc(npc.id, { hp: Math.max(0, npc.hp - 1) })} className="w-5 h-5 rounded text-xs" style={{ background: '#231008', color: '#c0392b' }}>−</button>
                  <span className="font-bold text-sm" style={{ color: npc.hp <= Math.floor(npc.hpMax / 2) ? '#c0392b' : '#c8972a' }}>{npc.hp}/{npc.hpMax}</span>
                  <button onClick={() => updateNpc(npc.id, { hp: Math.min(npc.hpMax, npc.hp + 1) })} className="w-5 h-5 rounded text-xs" style={{ background: '#231008', color: '#27ae60' }}>+</button>
                </div>
              </label>
              <label className="flex flex-col gap-0.5 text-xs" style={{ color: '#5a4535' }}>
                SAN
                <div className="flex items-center gap-1">
                  <button onClick={() => updateNpc(npc.id, { san: Math.max(0, npc.san - 1) })} className="w-5 h-5 rounded text-xs" style={{ background: '#231008', color: '#c0392b' }}>−</button>
                  <span className="font-bold text-sm" style={{ color: '#2ecc71' }}>{npc.san}</span>
                  <button onClick={() => updateNpc(npc.id, { san: Math.min(99, npc.san + 1) })} className="w-5 h-5 rounded text-xs" style={{ background: '#231008', color: '#27ae60' }}>+</button>
                </div>
              </label>
            </div>
            <textarea value={npc.notes} onChange={e => updateNpc(npc.id, { notes: e.target.value })}
              placeholder="Notes…" rows={2}
              className="w-full px-2 py-1 rounded text-xs outline-none resize-none"
              style={{ background: '#231008', border: '1px solid #3d1a08', color: '#8a7055' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── References Tab ──────────────────────────────────────────
function RefsTab() {
  const refs = [
    {
      title: 'Niveaux de réussite',
      content: [
        { label: 'Réussite Critique', value: 'Jet de 01' },
        { label: 'Réussite Extrême', value: '≤ 1/5 de la valeur' },
        { label: 'Réussite Difficile', value: '≤ 1/2 de la valeur' },
        { label: 'Réussite Normale', value: '≤ valeur' },
        { label: 'Échec', value: '> valeur' },
        { label: 'Fumble', value: '≥ 96 (ou ≥ 100 si valeur < 50)' },
      ]
    },
    {
      title: 'Bonus de dégâts',
      content: [
        { label: 'FOR+TAI 2-64', value: '-2' },
        { label: 'FOR+TAI 65-84', value: '-1' },
        { label: 'FOR+TAI 85-124', value: '0' },
        { label: 'FOR+TAI 125-164', value: '+1d4' },
        { label: 'FOR+TAI 165-204', value: '+1d6' },
        { label: 'FOR+TAI 205+', value: '+2d6' },
      ]
    },
    {
      title: 'Folie temporaire (1d10 rounds)',
      content: [
        { label: '01-20', value: 'Amnésie' },
        { label: '21-30', value: 'Fuite panique' },
        { label: '31-40', value: 'Violence (inoffensive)' },
        { label: '41-50', value: 'Catatonie' },
        { label: '51-60', value: 'Attaque d\'hystérie' },
        { label: '61-70', value: 'Peur irrationnelle / phobie' },
        { label: '71-75', value: 'Comportement maniaques' },
        { label: '76-85', value: 'Hallucinations' },
        { label: '86-90', value: 'Dissociation / autre personnalité' },
        { label: '91-99', value: 'Trouble psychosomatique' },
        { label: '100', value: 'Folie permanente — jet sur table étendue' },
      ]
    },
    {
      title: 'Poursuite — Mouvement',
      content: [
        { label: 'Humain (jeune)', value: 'MOV 8' },
        { label: 'Humain (adulte)', value: 'MOV 7' },
        { label: 'Humain (vieux)', value: 'MOV 5' },
        { label: 'Chien', value: 'MOV 10' },
        { label: 'Cheval (galop)', value: 'MOV 16' },
        { label: 'Auto (ville)', value: 'MOV 16-24' },
      ]
    },
    {
      title: 'Soins',
      content: [
        { label: 'Premiers secours (réussite)', value: '+1 PV' },
        { label: 'Médecine (réussite)', value: '+1d3 PV' },
        { label: 'Repos complet (1 semaine)', value: '+1 PV' },
        { label: 'Psychanalyse (réussite)', value: '+1d3 SAN' },
        { label: 'Repos (1 mois stable)', value: '+1d10 SAN (max ½ SAN départ)' },
      ]
    },
  ]

  return (
    <div className="p-3 flex flex-col gap-3">
      {refs.map(ref => (
        <RefSection key={ref.title} title={ref.title} items={ref.content} />
      ))}
    </div>
  )
}

function RefSection({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #3d1a08' }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2.5"
        style={{ background: '#231008' }}>
        <span className="text-sm font-semibold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>{title}</span>
        {open ? <ChevronUp size={14} style={{ color: '#5a4535' }} /> : <ChevronDown size={14} style={{ color: '#5a4535' }} />}
      </button>
      {open && (
        <div className="divide-y" style={{ borderColor: '#3d1a08' }}>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center px-3 py-1.5 text-sm">
              <span style={{ color: '#8a7055' }}>{item.label}</span>
              <span className="font-semibold text-right ml-4" style={{ color: '#e8d5b0' }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Timer Tab ──────────────────────────────────────────────
function TimerTab() {
  const [seconds, setSeconds] = useState(60)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<any>(null)

  function start() {
    setRemaining(seconds)
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r === null || r <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
  }

  function stop() {
    clearInterval(intervalRef.current)
    setRunning(false)
    setRemaining(null)
  }

  const pct = remaining !== null ? remaining / seconds : 1
  const critical = (remaining ?? 1) <= 10 && running

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <div className={`text-7xl font-bold text-center ${critical ? 'sanity-critical' : ''}`}
        style={{ color: critical ? '#c0392b' : '#c8972a', fontFamily: 'Georgia,serif' }}>
        {remaining !== null ? `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`
          : `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`}
      </div>

      {/* Progress ring */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#3d1a08" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none"
            stroke={critical ? '#c0392b' : '#c8972a'} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: '#5a4535' }}>
          {running ? 'EN COURS' : 'PRÊT'}
        </div>
      </div>

      {/* Presets */}
      {!running && (
        <div className="flex flex-wrap gap-2 justify-center">
          {[15, 30, 60, 120, 180, 300].map(s => (
            <button key={s} onClick={() => setSeconds(s)}
              className="px-3 py-1.5 rounded text-sm transition-all"
              style={{ background: seconds === s ? '#3d1a08' : '#231008', color: seconds === s ? '#c8972a' : '#5a4535', border: `1px solid ${seconds === s ? '#c8972a' : '#3d1a08'}` }}>
              {s < 60 ? `${s}s` : `${s / 60}min`}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {!running ? (
          <button onClick={start} className="px-8 py-3 rounded-lg text-lg font-semibold"
            style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}>
            Lancer
          </button>
        ) : (
          <button onClick={stop} className="px-8 py-3 rounded-lg text-lg font-semibold"
            style={{ background: '#8b1a1a', color: '#fff' }}>
            Arrêter
          </button>
        )}
      </div>
    </div>
  )
}

