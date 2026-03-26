import { useState, useCallback } from 'react'
import { ArrowLeft, Dice6, ChevronDown, ChevronUp, Plus, Trash2, Brain, Star } from 'lucide-react'
import type { Character, SkillData, Weapon, AmiInvestigateur } from '../../db/database'
import { getSkillDefs } from '../../db/database'
import { Modal } from '../ui/Modal'
import { SkillRollButton } from '../ui/DiceRoller'
import { SanRoll } from './SanRoll'
import { ExperienceRoll } from './ExperienceRoll'

// ── Palette ──────────────────────────────────────────────────
const C = {
  bg: '#0d0500', surface: '#1a0a00', card: '#231008', border: '#3d1a08',
  gold: '#c8972a', goldLight: '#e8b84b', text: '#e8d5b0', muted: '#8a7055',
  dim: '#5a4535', red: '#c0392b', green: '#27ae60',
}

interface Props {
  character: Character
  onBack: () => void
  onUpdate: (updates: Partial<Character>) => void
}

type Tab = 'fiche' | 'profil' | 'aide'

export function CharacterSheet({ character: char, onBack, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>('fiche')
  const [rollSkill, setRollSkill] = useState<{ name: string; value: number } | null>(null)
  const [sanModal, setSanModal] = useState(false)
  const [xpModal, setXpModal] = useState(false)

  const up = useCallback((u: Partial<Character>) => onUpdate(u), [onUpdate])

  function updateSkill(key: string, data: Partial<SkillData>) {
    up({ skills: { ...char.skills, [key]: { ...char.skills[key], ...data } } })
  }

  function toggleCrossed(field: 'pvCrossed' | 'pmCrossed' | 'sanCrossed' | 'chanceCrossed', num: number) {
    const arr = char[field] as number[]
    const next = arr.includes(num) ? arr.filter(n => n !== num) : [...arr, num]
    up({ [field]: next })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'fiche', label: 'Fiche' },
    { id: 'profil', label: 'Profil & Équip.' },
    { id: 'aide', label: 'Aide-mémoire' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: C.bg }}>
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} className="p-1.5 rounded" style={{ color: C.muted }}><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <input
            value={char.name}
            onChange={e => up({ name: e.target.value })}
            className="bg-transparent outline-none font-semibold text-base w-full"
            style={{ color: C.gold, fontFamily: 'Georgia,serif' }}
          />
          <div className="flex items-center gap-2 text-xs" style={{ color: C.dim }}>
            <input value={char.occupation} onChange={e => up({ occupation: e.target.value })}
              placeholder="Occupation" className="bg-transparent outline-none flex-1" style={{ color: C.muted }} />
            <span>·</span>
            <select value={char.period} onChange={e => up({ period: e.target.value as any })}
              className="bg-transparent outline-none" style={{ color: C.dim }}>
              <option value="classique">Période Classique</option>
              <option value="moderne">Période Moderne</option>
            </select>
          </div>
        </div>
        <button onClick={() => setSanModal(true)} className="p-1.5 rounded flex items-center gap-1 text-xs"
          style={{ background: C.card, color: '#27ae60', border: `1px solid #27ae6044` }} title="Jet SAN">
          <Brain size={14} />
        </button>
        <button onClick={() => setXpModal(true)} className="p-1.5 rounded flex items-center gap-1 text-xs"
          style={{ background: C.card, color: C.gold, border: `1px solid ${C.border}` }} title="Fin de session">
          <Star size={14} />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="shrink-0 flex" style={{ borderBottom: `1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 text-xs transition-all"
            style={{
              color: tab === t.id ? C.gold : C.dim,
              borderBottom: `2px solid ${tab === t.id ? C.gold : 'transparent'}`,
              background: tab === t.id ? C.card : 'transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'fiche' && (
          <FichePage char={char} onUpdate={up} updateSkill={updateSkill}
            toggleCrossed={toggleCrossed} onRoll={setRollSkill} />
        )}
        {tab === 'profil' && <ProfilPage char={char} onUpdate={up} />}
        {tab === 'aide' && <AidePage />}
      </div>

      {/* ── Roll modal ── */}
      <Modal open={!!rollSkill} onClose={() => setRollSkill(null)}
        title={rollSkill ? `Jet — ${rollSkill.name}` : ''} size="sm">
        {rollSkill && <SkillRollButton skillName={rollSkill.name} value={rollSkill.value} onClose={() => setRollSkill(null)} />}
      </Modal>

      {/* ── SAN Roll modal ── */}
      <Modal open={sanModal} onClose={() => setSanModal(false)} title="Jet de Santé Mentale" size="sm">
        <SanRoll
          character={char}
          onApply={(_loss, newSan) => {
            const newCrossed = Array.from({ length: Math.max(0, char.sanInitial - newSan) }, (_, i) => i + 1)
            up({ sanCrossed: newCrossed })
            setSanModal(false)
          }}
          onClose={() => setSanModal(false)}
        />
      </Modal>

      {/* ── Experience Roll modal ── */}
      <Modal open={xpModal} onClose={() => setXpModal(false)} title="Jet d'expérience — Fin de session">
        <ExperienceRoll
          character={char}
          onApply={(updates) => {
            const newSkills = { ...char.skills }
            for (const key of Object.keys(newSkills)) {
              if (newSkills[key].checked) newSkills[key] = { ...newSkills[key], checked: false }
              if (key in updates) newSkills[key] = { ...newSkills[key], value: updates[key] }
            }
            up({ skills: newSkills })
            setXpModal(false)
          }}
          onClose={() => setXpModal(false)}
        />
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE 1 — FICHE
// ════════════════════════════════════════════════════════════
function FichePage({ char, onUpdate, updateSkill, toggleCrossed, onRoll }: {
  char: Character
  onUpdate: (u: Partial<Character>) => void
  updateSkill: (key: string, d: Partial<SkillData>) => void
  toggleCrossed: (f: any, n: number) => void
  onRoll: (s: { name: string; value: number }) => void
}) {
  return (
    <div className="p-3 flex flex-col gap-4">
      {/* État civil + Caractéristiques */}
      <EtatCivil char={char} onUpdate={onUpdate} />
      {/* PV / PM / SAN / Chance */}
      <PointsSection char={char} onUpdate={onUpdate} toggleCrossed={toggleCrossed} />
      {/* Compétences */}
      <CompetencesSection char={char} updateSkill={updateSkill} onRoll={onRoll} />
      {/* Armes + Combat */}
      <ArmesSection char={char} onUpdate={onUpdate} />
    </div>
  )
}

// ── État civil + Caractéristiques ────────────────────────────
function EtatCivil({ char, onUpdate }: { char: Character; onUpdate: (u: Partial<Character>) => void }) {
  // Auto-recalculate derived stats when a characteristic changes
  function setChar(key: keyof Character, val: number) {
    const updates: Partial<Character> = { [key]: val }
    // Auto-update esquive when DEX changes
    if (key === 'dex') updates.esquiveBase = Math.floor(val / 2)
    // Auto-update PV max when CON or SIZ changes
    if (key === 'con' || key === 'siz') {
      const con = key === 'con' ? val : char.con
      const siz = key === 'siz' ? val : char.siz
      const pvMax = Math.floor((con + siz) / 10)
      updates.pvMax = pvMax
      updates.pvBlessureGrave = Math.floor(pvMax / 2)
    }
    // Auto-update PM max when POW changes
    if (key === 'pow') updates.pmMax = Math.floor(val / 5)
    // Auto-update langue maternelle base when EDU changes
    if (key === 'edu') {
      const skills = { ...char.skills }
      if (skills.langue_maternelle) skills.langue_maternelle = { ...skills.langue_maternelle, base: val, value: Math.max(skills.langue_maternelle.value, val) }
      updates.skills = skills
    }
    onUpdate(updates)
  }

  const CHARS_LEFT = [
    { key: 'str', label: 'FOR' }, { key: 'dex', label: 'DEX' },
    { key: 'pow', label: 'POU' }, { key: 'con', label: 'CON' },
    { key: 'app', label: 'APP' },
  ] as const
  const CHARS_RIGHT = [
    { key: 'edu', label: 'ÉDU' }, { key: 'siz', label: 'TAI' },
    { key: 'int', label: 'INT' },
  ] as const

  return (
    <Section title="État civil & Caractéristiques" defaultOpen>
      <div className="flex gap-3">
        {/* État civil */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {[
            { key: 'name', label: 'Nom' }, { key: 'player', label: 'Joueur' },
            { key: 'occupation', label: 'Occupation' },
          ].map(({ key, label }) => (
            <FieldLine key={key} label={label}>
              <input value={(char as any)[key] ?? ''} onChange={e => onUpdate({ [key]: e.target.value })}
                className="field-input w-full" />
            </FieldLine>
          ))}
          <div className="flex gap-2">
            <FieldLine label="Âge" className="flex-1">
              <input type="number" value={char.age} onChange={e => onUpdate({ age: parseInt(e.target.value) || 0 })}
                className="field-input w-full" />
            </FieldLine>
            <FieldLine label="Sexe" className="flex-1">
              <input value={char.sex} onChange={e => onUpdate({ sex: e.target.value })} className="field-input w-full" />
            </FieldLine>
          </div>
          <FieldLine label="Résidence">
            <input value={char.residence} onChange={e => onUpdate({ residence: e.target.value })} className="field-input w-full" />
          </FieldLine>
          <FieldLine label="Lieu de naissance">
            <input value={char.birthplace} onChange={e => onUpdate({ birthplace: e.target.value })} className="field-input w-full" />
          </FieldLine>
          <FieldLine label="Campagne">
            <input value={char.campaign} onChange={e => onUpdate({ campaign: e.target.value })} className="field-input w-full" />
          </FieldLine>
        </div>

        {/* Caractéristiques */}
        <div className="flex gap-2 shrink-0">
          <div className="flex flex-col gap-1">
            {CHARS_LEFT.map(({ key, label }) => (
              <CharBox key={key} label={label} value={(char as any)[key]}
                onChange={v => setChar(key as keyof Character, v)} />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {CHARS_RIGHT.map(({ key, label }) => (
              <CharBox key={key} label={label} value={(char as any)[key]}
                onChange={v => setChar(key as keyof Character, v)} />
            ))}
            {/* MVT */}
            <div className="flex flex-col items-center rounded px-1 py-0.5 gap-0.5"
              style={{ background: C.surface, border: `1px solid ${C.border}`, minWidth: 62 }}>
              <span className="text-xs font-bold" style={{ color: C.gold }}>MVT</span>
              <div className="flex items-center gap-0.5">
                <button onClick={() => onUpdate({ mov: Math.max(1, char.mov - 1) })}
                  className="w-4 h-4 rounded text-xs leading-none" style={{ background: C.border, color: C.muted }}>−</button>
                <span className="text-base font-bold w-6 text-center" style={{ color: C.text }}>{char.mov}</span>
                <button onClick={() => onUpdate({ mov: char.mov + 1 })}
                  className="w-4 h-4 rounded text-xs leading-none" style={{ background: C.border, color: C.muted }}>+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function CharBox({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const half = Math.floor(value / 2)
  const fifth = Math.floor(value / 5)
  return (
    <div className="flex items-center gap-0.5 rounded px-1 py-0.5"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <span className="text-xs font-bold w-9" style={{ color: C.gold }}>{label}</span>
      <input
        type="number" value={value} min={1} max={99}
        onChange={e => onChange(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
        className="w-8 text-center text-sm font-bold bg-transparent outline-none rounded"
        style={{ color: C.text, border: `1px solid ${C.border}`, background: C.card }}
      />
      <div className="flex flex-col gap-0 ml-0.5">
        <span className="text-xs leading-none px-1 rounded" style={{ background: C.border, color: C.muted, fontSize: '0.6rem' }}>½{half}</span>
        <span className="text-xs leading-none px-1 rounded mt-0.5" style={{ background: C.border, color: C.dim, fontSize: '0.6rem' }}>⅕{fifth}</span>
      </div>
    </div>
  )
}

// ── Points section ───────────────────────────────────────────
function PointsSection({ char, onUpdate, toggleCrossed }: {
  char: Character
  onUpdate: (u: Partial<Character>) => void
  toggleCrossed: (f: any, n: number) => void
}) {
  return (
    <Section title="Points de vie · Magie · Santé mentale · Chance" defaultOpen>
      <div className="flex flex-col gap-3">
        {/* PV + PM row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold" style={{ color: C.gold }}>POINTS DE VIE</span>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                <span>Blessure grave</span>
                <NumInput value={char.pvBlessureGrave} onChange={v => onUpdate({ pvBlessureGrave: v })} />
                <span>PV max</span>
                <NumInput value={char.pvMax} onChange={v => onUpdate({ pvMax: v, pvBlessureGrave: Math.floor(v / 2) })} />
              </div>
            </div>
            <div className="text-xs mb-1" style={{ color: C.dim }}>Mourant / Inconscient</div>
            <NumberGrid
              numbers={Array.from({ length: 21 }, (_, i) => i)} // 00-20
              crossed={char.pvCrossed}
              onToggle={n => toggleCrossed('pvCrossed', n)}
              crossColor={C.red}
              cols={7}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold" style={{ color: '#3498db' }}>POINTS DE MAGIE</span>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                <span>PM max</span>
                <NumInput value={char.pmMax} onChange={v => onUpdate({ pmMax: v })} />
              </div>
            </div>
            <NumberGrid
              numbers={Array.from({ length: 25 }, (_, i) => i)} // 00-24
              crossed={char.pmCrossed}
              onToggle={n => toggleCrossed('pmCrossed', n)}
              crossColor='#3498db'
              cols={5}
            />
          </div>
        </div>

        {/* SAN */}
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="text-xs font-bold" style={{ color: C.green }}>SANTÉ MENTALE</span>
            <span className="text-xs" style={{ color: C.dim }}>Folie</span>
            <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: C.muted }}>
              <span>Temp.</span><NumInput value={char.sanFolieTemp} onChange={v => onUpdate({ sanFolieTemp: v })} />
              <span>Persist.</span><NumInput value={char.sanFoliePercist} onChange={v => onUpdate({ sanFoliePercist: v })} />
              <span>Initial</span><NumInput value={char.sanInitial} onChange={v => onUpdate({ sanInitial: v })} />
              <span>Max.</span><NumInput value={char.sanMax} onChange={v => onUpdate({ sanMax: v })} />
            </div>
          </div>
          <NumberGrid
            numbers={Array.from({ length: 100 }, (_, i) => i + 1)} // 01-100
            crossed={char.sanCrossed}
            onToggle={n => toggleCrossed('sanCrossed', n)}
            crossColor={C.green}
            cols={13}
          />
        </div>

        {/* Chance */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold" style={{ color: C.gold }}>CHANCE</span>
            <span className="text-xs" style={{ color: C.dim }}>Pas de chance</span>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
              <span>Valeur actuelle</span>
              <NumInput value={char.chance} onChange={v => onUpdate({ chance: v })} />
            </div>
          </div>
          <NumberGrid
            numbers={Array.from({ length: 100 }, (_, i) => i + 1)} // 01-100
            crossed={char.chanceCrossed}
            onToggle={n => toggleCrossed('chanceCrossed', n)}
            crossColor={C.gold}
            cols={14}
          />
        </div>
      </div>
    </Section>
  )
}

// ── Number Grid ──────────────────────────────────────────────
function NumberGrid({ numbers, crossed, onToggle, crossColor, cols }: {
  numbers: number[]
  crossed: number[]
  onToggle: (n: number) => void
  crossColor: string
  cols: number
}) {
  const crossedSet = new Set(crossed)
  return (
    <div className="flex flex-wrap gap-px">
      {numbers.map(n => {
        const isCrossed = crossedSet.has(n)
        return (
          <button
            key={n}
            onClick={() => onToggle(n)}
            className="rounded transition-all"
            style={{
              width: `${Math.floor(100 / cols) - 0.5}%`,
              aspectRatio: '1',
              maxWidth: 28,
              minWidth: 18,
              fontSize: '0.6rem',
              background: isCrossed ? crossColor + '33' : C.surface,
              border: `1px solid ${isCrossed ? crossColor : C.border}`,
              color: isCrossed ? crossColor : C.dim,
              textDecoration: isCrossed ? 'line-through' : 'none',
              fontWeight: isCrossed ? 'bold' : 'normal',
            }}
          >
            {String(n).padStart(2, '0')}
          </button>
        )
      })}
    </div>
  )
}

// ── Compétences ──────────────────────────────────────────────
function CompetencesSection({ char, updateSkill, onRoll }: {
  char: Character
  updateSkill: (key: string, d: Partial<SkillData>) => void
  onRoll: (s: { name: string; value: number }) => void
}) {
  const [search, setSearch] = useState('')
  const defs = getSkillDefs(char.period)

  const visible = defs.filter(def => {
    if (!search) return true
    const label = def.special === 'custom'
      ? (char.skills[def.key]?.custom ? '' : def.label)
      : def.label
    const skillLabel = char.skills[def.key] ? label || def.key : def.label
    return skillLabel.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <Section title="Compétences de l'Investigateur" defaultOpen={false}>
      <div className="mb-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filtrer les compétences…"
          className="field-input w-full text-sm" />
      </div>

      <div className="flex flex-col gap-0.5">
        {visible.map(def => {
          const skill = char.skills[def.key]
          if (!skill) return null
          const isCustomSlot = def.special === 'custom'
          const displayLabel = isCustomSlot ? (skill as any).label || '' : def.label
          const baseDisplay = def.special === 'DEX/2' ? 'DEX/2' : def.special === 'ÉDU' ? 'ÉDU' : `${skill.base}%`

          return (
            <SkillRowOfficial
              key={def.key}
              label={displayLabel}
              baseDisplay={baseDisplay}
              isCustom={isCustomSlot}
              skill={skill}
              onCheck={() => updateSkill(def.key, { checked: !skill.checked })}
              onLabelChange={isCustomSlot ? (v) => updateSkill(def.key, { label: v } as any) : undefined}
              onValueChange={(v) => updateSkill(def.key, { value: v })}
              onRoll={() => onRoll({ name: displayLabel || def.key, value: skill.value })}
            />
          )
        })}
      </div>
    </Section>
  )
}

function SkillRowOfficial({ label, baseDisplay, isCustom, skill, onCheck, onLabelChange, onValueChange, onRoll }: {
  label: string; baseDisplay: string; isCustom: boolean
  skill: SkillData
  onCheck: () => void
  onLabelChange?: (v: string) => void
  onValueChange: (v: number) => void
  onRoll: () => void
}) {
  const half = Math.floor(skill.value / 2)
  const fifth = Math.floor(skill.value / 5)
  const isSubSkill = label.startsWith('(')

  return (
    <div className={`flex items-center gap-1.5 px-1.5 py-1 rounded ${isSubSkill ? 'pl-5' : ''}`}
      style={{ background: skill.checked ? C.card : 'transparent', borderBottom: `1px solid ${C.border}22` }}>
      {/* Experience circle */}
      <button onClick={onCheck} className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all"
        style={{ borderColor: skill.checked ? C.gold : C.border, background: skill.checked ? C.gold + '33' : 'transparent' }}>
        {skill.checked && <span style={{ color: C.gold, fontSize: '0.55rem' }}>✓</span>}
      </button>

      {/* Name */}
      {isCustom && onLabelChange ? (
        <input value={label} onChange={e => onLabelChange(e.target.value)}
          placeholder="Compétence…"
          className="flex-1 bg-transparent outline-none text-xs border-b"
          style={{ color: C.text, borderColor: C.border + '88', minWidth: 60 }} />
      ) : (
        <span className="flex-1 text-xs" style={{ color: C.text, minWidth: 60 }}>{label}</span>
      )}

      {/* Base */}
      <span className="text-xs shrink-0" style={{ color: C.dim, fontSize: '0.6rem' }}>({baseDisplay})</span>

      {/* Half/Fifth */}
      <span className="text-xs shrink-0 w-8 text-right" style={{ color: C.dim, fontSize: '0.6rem' }}>½{half}</span>
      <span className="text-xs shrink-0 w-8 text-right" style={{ color: C.dim, fontSize: '0.6rem' }}>⅕{fifth}</span>

      {/* Value */}
      <input
        type="number" value={skill.value} min={0} max={99}
        onChange={e => onValueChange(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
        className="w-10 text-center text-xs font-bold rounded outline-none"
        style={{ background: C.card, border: `1px solid ${C.border}`, color: C.gold }}
      />
      <span className="text-xs" style={{ color: C.dim }}>%</span>

      {/* Roll button */}
      <button onClick={onRoll} className="p-1 rounded transition-all"
        style={{ background: C.card, color: C.gold }} title={`Lancer ${label}`}>
        <Dice6 size={12} />
      </button>
    </div>
  )
}

// ── Armes + Combat ───────────────────────────────────────────
function ArmesSection({ char, onUpdate }: { char: Character; onUpdate: (u: Partial<Character>) => void }) {
  function addWeapon() {
    onUpdate({ weapons: [...char.weapons, { name: '', ord: '', maj: '', ext: '', degats: '', portee: '', cad: '', cap: '', panne: '' }] })
  }
  function removeWeapon(i: number) {
    onUpdate({ weapons: char.weapons.filter((_, idx) => idx !== i) })
  }
  function updateWeapon(i: number, key: keyof Weapon, val: string) {
    onUpdate({ weapons: char.weapons.map((w, idx) => idx === i ? { ...w, [key]: val } : w) })
  }

  const COL_HEADERS = ['ARME', 'ORD.', 'MAJ.', 'EXT.', 'DÉGÂTS', 'PORTÉE', 'CAD.', 'CAP.', 'PANNE']
  const COL_KEYS: (keyof Weapon)[] = ['name', 'ord', 'maj', 'ext', 'degats', 'portee', 'cad', 'cap', 'panne']
  const COL_WIDTHS = ['flex-1', 'w-10', 'w-10', 'w-10', 'w-16', 'w-14', 'w-8', 'w-10', 'w-14']

  return (
    <div className="flex gap-3">
      {/* Armes table */}
      <Section title="Armes" className="flex-1" defaultOpen={false}>
        {/* Headers */}
        <div className="flex gap-1 mb-1 px-1">
          {COL_HEADERS.map((h, i) => (
            <span key={h} className={`${COL_WIDTHS[i]} text-xs font-bold shrink-0`} style={{ color: C.muted, fontSize: '0.6rem' }}>{h}</span>
          ))}
          <div className="w-5 shrink-0" />
        </div>

        {/* Weapon rows */}
        <div className="flex flex-col gap-1">
          {char.weapons.map((w, i) => (
            <div key={i} className="flex items-center gap-1 px-1 py-1 rounded" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              {COL_KEYS.map((key, ci) => (
                <input
                  key={key}
                  value={w[key] as string}
                  onChange={e => updateWeapon(i, key, e.target.value)}
                  className={`${COL_WIDTHS[ci]} bg-transparent outline-none text-xs shrink-0`}
                  style={{ color: ci === 0 ? C.gold : C.text, borderBottom: `1px solid ${C.border}44`, minWidth: 0 }}
                  placeholder={ci === 0 ? 'Arme…' : '…'}
                />
              ))}
              <button onClick={() => removeWeapon(i)} className="w-5 h-5 shrink-0 rounded flex items-center justify-center"
                style={{ color: C.red + '88' }}>
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addWeapon} className="mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted }}>
          <Plus size={10} /> Ajouter
        </button>
      </Section>

      {/* Combat */}
      <Section title="Combat" className="w-36 shrink-0" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          {[
            { key: 'impact', label: 'IMPACT' },
            { key: 'carrure', label: 'CARRURE' },
            { key: 'esquiveBase', label: 'ESQUIVE' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <label className="text-xs font-bold" style={{ color: C.gold, fontSize: '0.65rem' }}>{label}</label>
              <input
                value={(char as any)[key] ?? ''}
                onChange={e => {
                  const v = e.target.value
                  onUpdate({ [key]: isNaN(Number(v)) ? v : Number(v) })
                }}
                className="px-2 py-1 rounded text-sm text-center font-bold outline-none"
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE 2 — PROFIL
// ════════════════════════════════════════════════════════════
function ProfilPage({ char, onUpdate }: { char: Character; onUpdate: (u: Partial<Character>) => void }) {
  function updateEquip(i: number, val: string) {
    const lines = [...char.equipmentLines]
    lines[i] = val
    onUpdate({ equipmentLines: lines })
  }
  function updateAmi(i: number, field: keyof AmiInvestigateur, val: string) {
    const amis = char.amis.map((a, idx) => idx === i ? { ...a, [field]: val } : a)
    onUpdate({ amis })
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      {/* Profil */}
      <Section title="Profil" defaultOpen>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            { key: 'description', label: 'Description' },
            { key: 'traits', label: 'Traits' },
            { key: 'ideologie', label: 'Idéologie et croyances' },
            { key: 'sequellesCicatrices', label: 'Séquelles et cicatrices' },
            { key: 'personnesImportantes', label: 'Personnes importantes' },
            { key: 'phobiesManies', label: 'Phobies et manies' },
            { key: 'lieuxSignificatifs', label: 'Lieux significatifs' },
            { key: 'ouvragesOccultes', label: 'Ouvrages occultes, sorts et artefacts' },
            { key: 'biensPrecieux', label: 'Biens précieux' },
            { key: 'rencontresEntites', label: 'Rencontres avec des entités étranges' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <label className="text-xs" style={{ color: C.muted }}>{label}</label>
              <textarea
                value={(char as any)[key] ?? ''}
                onChange={e => onUpdate({ [key]: e.target.value })}
                rows={2} className="field-input text-xs resize-none"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Équipement + Richesse */}
      <div className="flex gap-3">
        <Section title="Équipement et possessions" className="flex-1" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-1">
            {char.equipmentLines.map((line, i) => (
              <input key={i} value={line} onChange={e => updateEquip(i, e.target.value)}
                className="field-input text-xs" placeholder="…" />
            ))}
          </div>
        </Section>

        <Section title="Richesse" className="w-44 shrink-0" defaultOpen={false}>
          <div className="flex flex-col gap-2">
            {[
              { key: 'depensesCourantes', label: 'Dépenses courantes' },
              { key: 'especes', label: 'Espèces' },
              { key: 'capital', label: 'Capital' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <label className="text-xs" style={{ color: C.muted }}>{label}</label>
                <input value={(char as any)[key] ?? ''} onChange={e => onUpdate({ [key]: e.target.value })}
                  className="field-input text-xs" />
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Amis + Notes */}
      <div className="flex gap-3">
        <Section title="Amis investigateurs" className="flex-1" defaultOpen={false}>
          <div className="flex flex-col gap-3">
            {char.amis.map((ami, i) => (
              <div key={i} className="flex flex-col gap-1 pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <input value={ami.nom} onChange={e => updateAmi(i, 'nom', e.target.value)}
                  placeholder="NOM" className="field-input text-xs font-semibold" style={{ color: C.gold }} />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="text-xs" style={{ color: C.dim }}>Joueur : </span>
                    <input value={ami.joueur} onChange={e => updateAmi(i, 'joueur', e.target.value)}
                      className="bg-transparent outline-none text-xs border-b w-24" style={{ color: C.text, borderColor: C.border }} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs" style={{ color: C.dim }}>Scénario : </span>
                    <input value={ami.scenario} onChange={e => updateAmi(i, 'scenario', e.target.value)}
                      className="bg-transparent outline-none text-xs border-b w-24" style={{ color: C.text, borderColor: C.border }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Notes" className="flex-1" defaultOpen={false}>
          <textarea
            value={char.notes} onChange={e => onUpdate({ notes: e.target.value })}
            placeholder="Notes libres…" rows={10}
            className="field-input w-full text-xs resize-none"
          />
        </Section>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE 3 — AIDE-MÉMOIRE
// ════════════════════════════════════════════════════════════
function AidePage() {
  return (
    <div className="p-3 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Tests */}
        <Section title="Tests de compétence" defaultOpen>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'Maladresse', value: '100 / 96+', color: C.red },
              { label: 'Échec', value: '> valeur', color: '#e67e22' },
              { label: 'Ordinaire', value: '≤ valeur', color: C.text },
              { label: 'Majeur', value: '≤ ½ valeur', color: '#2ecc71' },
              { label: 'Extrême', value: '≤ ⅕ valeur', color: '#27ae60' },
              { label: 'Critique', value: '01', color: C.gold },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center text-xs py-1 px-2 rounded"
                style={{ background: C.surface }}>
                <span style={{ color: C.muted }}>{label}</span>
                <span className="font-bold" style={{ color }}>{value}</span>
              </div>
            ))}
            <div className="mt-2 text-xs p-2 rounded" style={{ background: C.surface, color: C.dim }}>
              <strong style={{ color: C.muted }}>Redoubler un test :</strong> Justification nécessaire ; impossible en combat ou pour la SAN.
            </div>
          </div>
        </Section>

        {/* Blessures */}
        <Section title="Blessures et soins" defaultOpen>
          <div className="flex flex-col gap-1.5 text-xs">
            {[
              { t: 'Premiers soins', v: 'soigne 1 PV' },
              { t: 'Médecine', v: 'soigne 1D3 PV' },
              { t: 'Blessure grave', v: 'perte ½ PV max en 1 attaque' },
              { t: '0 PV sans blessure grave', v: 'Inconscient' },
              { t: '0 PV avec blessure grave', v: 'Mourant' },
              { t: 'Mourant', v: 'Premiers soins pour stabiliser, puis Médecine' },
              { t: 'Guérison (sans bless. grave)', v: '1 PV / jour' },
              { t: 'Guérison (avec bless. grave)', v: '1 test / semaine' },
            ].map(({ t, v }) => (
              <div key={t} className="flex flex-col px-2 py-1 rounded" style={{ background: C.surface }}>
                <span className="font-semibold" style={{ color: C.muted }}>{t}</span>
                <span style={{ color: C.dim }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Folie */}
        <Section title="Folie temporaire (1d10 rounds)" defaultOpen={false}>
          <div className="flex flex-col gap-0.5 text-xs">
            {[
              ['01–20', 'Amnésie'],
              ['21–30', 'Fuite panique'],
              ['31–40', 'Violence (inoffensive)'],
              ['41–50', 'Catatonie'],
              ['51–60', 'Crise d\'hystérie'],
              ['61–70', 'Peur irrationnelle / phobie'],
              ['71–75', 'Comportement maniaque'],
              ['76–85', 'Hallucinations'],
              ['86–90', 'Autre personnalité'],
              ['91–99', 'Trouble psychosomatique'],
              ['100', 'Folie permanente'],
            ].map(([range, desc]) => (
              <div key={range} className="flex gap-2 px-2 py-0.5 rounded" style={{ background: C.surface }}>
                <span className="font-bold shrink-0 w-14" style={{ color: C.gold }}>{range}</span>
                <span style={{ color: C.muted }}>{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Bonus dégâts */}
        <Section title="Bonus de dégâts (FOR + TAI)" defaultOpen={false}>
          <div className="flex flex-col gap-0.5 text-xs">
            {[
              ['2–64', '−2'],
              ['65–84', '−1'],
              ['85–124', '0'],
              ['125–164', '+1D4'],
              ['165–204', '+1D6'],
              ['205–284', '+2D6'],
              ['285–364', '+3D6'],
            ].map(([range, bonus]) => (
              <div key={range} className="flex justify-between px-2 py-0.5 rounded" style={{ background: C.surface }}>
                <span style={{ color: C.muted }}>{range}</span>
                <span className="font-bold" style={{ color: C.gold }}>{bonus}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* SAN */}
        <Section title="Santé mentale — soins" defaultOpen={false}>
          <div className="flex flex-col gap-1 text-xs">
            {[
              { t: 'Psychanalyse réussie', v: '+1D3 SAN' },
              { t: '1 mois traitement réussi', v: '+1D3 SAN' },
              { t: 'Repos 1 mois (stable)', v: '+1D10 SAN (max ½ initial)' },
              { t: 'Folie temporaire', v: 'perte 1D6+ SAN en 1 round' },
              { t: 'Folie permanente', v: 'perdu entre séances de jeu' },
              { t: 'Mythe +5 pts', v: '−1 SAN max permanent' },
            ].map(({ t, v }) => (
              <div key={t} className="flex flex-col px-2 py-1 rounded" style={{ background: C.surface }}>
                <span className="font-semibold" style={{ color: C.muted }}>{t}</span>
                <span style={{ color: C.green }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════════════════════
function Section({ title, children, defaultOpen = true, className = '' }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ border: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2"
        style={{ background: C.card }}>
        <span className="text-xs font-bold tracking-wide" style={{ color: C.gold, fontFamily: 'Georgia,serif' }}>{title}</span>
        {open ? <ChevronUp size={12} style={{ color: C.dim }} /> : <ChevronDown size={12} style={{ color: C.dim }} />}
      </button>
      {open && <div className="p-2">{children}</div>}
    </div>
  )
}

function FieldLine({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-xs" style={{ color: C.dim }}>{label}</label>
      {children}
    </div>
  )
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input type="number" value={value} min={0} max={999}
      onChange={e => onChange(parseInt(e.target.value) || 0)}
      className="w-10 text-center text-xs font-bold rounded outline-none"
      style={{ background: C.card, border: `1px solid ${C.border}`, color: C.gold }}
    />
  )
}

// Inject global styles for reuse
const style = document.createElement('style')
style.textContent = `.field-input { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text}; border-radius: 0.25rem; padding: 0.25rem 0.5rem; outline: none; width: 100%; font-size: 0.75rem; } .field-input:focus { border-color: ${C.gold}; }`
document.head.appendChild(style)
