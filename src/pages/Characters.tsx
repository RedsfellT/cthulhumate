import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newCharacter, type Character, type Period } from '../db/database'
import { Plus, User, Trash2, BookOpen, Download, Upload } from 'lucide-react'
import { CharacterSheet } from '../components/character/CharacterSheet'
import { Modal } from '../components/ui/Modal'
import { exportAllData, importData } from '../lib/export'

export function Characters() {
  const characters = useLiveQuery(() => db.characters.orderBy('updatedAt').reverse().toArray(), [])
  const [selected, setSelected] = useState<Character | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  async function createCharacter(period: Period) {
    setCreateModal(false)
    const id = await db.characters.add(newCharacter(period) as Character)
    const char = await db.characters.get(id)
    setSelected(char ?? null)
  }

  async function deleteCharacter(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm('Supprimer ce personnage ?')) {
      await db.characters.delete(id)
      if (selected?.id === id) setSelected(null)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importData(file)
      alert('Import réussi !')
    } catch {
      alert('Erreur lors de l\'import.')
    }
    e.target.value = ''
  }

  if (selected) {
    return (
      <CharacterSheet
        character={selected}
        onBack={() => setSelected(null)}
        onUpdate={async (updates) => {
          if (selected.id) {
            await db.characters.update(selected.id, { ...updates, updatedAt: new Date() })
            setSelected(prev => prev ? { ...prev, ...updates } : null)
          }
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #3d1a08' }}>
        <h1 className="text-base font-semibold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
          Investigateurs
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => exportAllData()}
            className="p-1.5 rounded" style={{ color: '#5a4535' }} title="Exporter">
            <Download size={16} />
          </button>
          <button onClick={() => importRef.current?.click()}
            className="p-1.5 rounded" style={{ color: '#5a4535' }} title="Importer">
            <Upload size={16} />
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}
          >
            <Plus size={14} /> Nouvel investigateur
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {(characters?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
            <User size={48} style={{ color: '#3d1a08' }} />
            <div className="text-center">
              <div style={{ color: '#8a7055' }}>Aucun investigateur</div>
              <div className="text-sm mt-1" style={{ color: '#5a4535' }}>Créez votre premier personnage</div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {characters?.map(char => (
              <CharacterCard
                key={char.id}
                char={char}
                onSelect={() => setSelected(char)}
                onDelete={(e) => deleteCharacter(char.id!, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Créer un investigateur" size="sm">
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm" style={{ color: '#8a7055' }}>Choisissez la période de jeu :</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => createCharacter('classique')}
              className="flex items-center gap-3 p-4 rounded-lg text-left transition-all"
              style={{ background: '#231008', border: '1px solid #3d1a08' }}
            >
              <BookOpen size={24} style={{ color: '#c8972a', flexShrink: 0 }} />
              <div>
                <div className="font-semibold" style={{ color: '#c8972a' }}>Période Classique</div>
                <div className="text-xs mt-0.5" style={{ color: '#5a4535' }}>Années 1920 — Lovecraft, Chaosium</div>
              </div>
            </button>
            <button
              onClick={() => createCharacter('moderne')}
              className="flex items-center gap-3 p-4 rounded-lg text-left transition-all"
              style={{ background: '#231008', border: '1px solid #3d1a08' }}
            >
              <BookOpen size={24} style={{ color: '#8a7055', flexShrink: 0 }} />
              <div>
                <div className="font-semibold" style={{ color: '#e8d5b0' }}>Période Moderne</div>
                <div className="text-xs mt-0.5" style={{ color: '#5a4535' }}>Époque contemporaine — Électronique, Informatique</div>
              </div>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function CharacterCard({ char, onSelect, onDelete }: {
  char: Character
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div
      onClick={onSelect}
      className="rounded-lg p-4 cursor-pointer transition-all group"
      style={{ background: '#231008', border: '1px solid #3d1a08' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: '#e8d5b0' }}>{char.name}</div>
          {char.player && <div className="text-xs truncate" style={{ color: '#8a7055' }}>{char.player}</div>}
          {char.occupation && <div className="text-xs truncate" style={{ color: '#5a4535' }}>{char.occupation}</div>}
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all ml-2 shrink-0"
          style={{ color: '#8b1a1a' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Period badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{
          background: char.period === 'classique' ? '#231008' : '#1a0a00',
          border: `1px solid ${char.period === 'classique' ? '#c8972a44' : '#3d1a08'}`,
          color: char.period === 'classique' ? '#c8972a' : '#5a4535',
        }}>
          {char.period === 'classique' ? '⚙️ Classique' : '💻 Moderne'}
        </span>
        {char.campaign && (
          <span className="text-xs truncate" style={{ color: '#3d1a08' }}>📜 {char.campaign}</span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <MiniStat label="PV" value={char.pvMax - char.pvCrossed.length} max={char.pvMax} color="#c8972a" />
        <MiniStat label="SAN" value={char.sanInitial - char.sanCrossed.length} max={char.sanInitial} color="#27ae60" />
        <MiniStat label="PM" value={char.pmMax - char.pmCrossed.length} max={char.pmMax} color="#3498db" />
      </div>

      {/* Characteristics preview */}
      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'FOR', value: char.str },
          { label: 'DEX', value: char.dex },
          { label: 'INT', value: char.int },
          { label: 'ÉDU', value: char.edu },
        ].map(({ label, value }) => (
          <div key={label} className="rounded px-1 py-0.5" style={{ background: '#1a0a00' }}>
            <div style={{ color: '#3d1a08', fontSize: '0.55rem' }}>{label}</div>
            <div className="text-xs font-bold" style={{ color: '#8a7055' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, value) / max : 0
  const critical = pct <= 0.25
  return (
    <div className="rounded p-1 text-center" style={{ background: '#1a0a00' }}>
      <div className="text-xs font-bold" style={{ color: critical ? '#c0392b' : color }}>{Math.max(0, value)}/{max}</div>
      <div style={{ color: '#3d1a08', fontSize: '0.6rem' }}>{label}</div>
      <div className="h-1 rounded-full mt-0.5 overflow-hidden" style={{ background: '#0d0500' }}>
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: critical ? '#c0392b' : color }} />
      </div>
    </div>
  )
}
