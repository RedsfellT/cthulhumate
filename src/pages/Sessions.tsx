import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SessionNote } from '../db/database'
import { Plus, Trash2, BookOpen, ChevronLeft } from 'lucide-react'

export function Sessions() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('date').reverse().toArray(), [])
  const campaigns = useLiveQuery(async () => {
    const all = await db.sessions.toArray()
    return [...new Set(all.map(s => s.campaign).filter(Boolean))]
  }, [])

  const [selected, setSelected] = useState<SessionNote | null>(null)
  const [filterCampaign, setFilterCampaign] = useState('all')

  async function createSession() {
    const id = await db.sessions.add({
      campaign: 'Campagne',
      sessionNumber: (sessions?.length ?? 0) + 1,
      date: new Date(),
      title: 'Nouvelle session',
      content: '',
      tags: [],
      createdAt: new Date(),
    })
    const session = await db.sessions.get(id)
    setSelected(session ?? null)
  }

  async function updateSession(updates: Partial<SessionNote>) {
    if (!selected?.id) return
    await db.sessions.update(selected.id, updates)
    setSelected(prev => prev ? { ...prev, ...updates } : null)
  }

  async function deleteSession(id: number) {
    if (confirm('Supprimer cette session ?')) {
      await db.sessions.delete(id)
      if (selected?.id === id) setSelected(null)
    }
  }

  const filtered = (sessions ?? []).filter(s => filterCampaign === 'all' || s.campaign === filterCampaign)

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 flex items-center gap-3 px-3 py-2" style={{ borderBottom: '1px solid #3d1a08', background: '#1a0a00' }}>
          <button onClick={() => setSelected(null)} className="p-1.5 rounded" style={{ color: '#8a7055' }}>
            <ChevronLeft size={18} />
          </button>
          <input
            value={selected.title}
            onChange={e => updateSession({ title: e.target.value })}
            className="flex-1 bg-transparent outline-none font-semibold"
            style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-xs" style={{ color: '#5a4535' }}>Campagne</label>
              <input value={selected.campaign} onChange={e => updateSession({ campaign: e.target.value })}
                className="px-2 py-1 rounded text-sm outline-none"
                style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs" style={{ color: '#5a4535' }}>Session n°</label>
              <input type="number" value={selected.sessionNumber}
                onChange={e => updateSession({ sessionNumber: parseInt(e.target.value) || 1 })}
                className="px-2 py-1 rounded text-sm outline-none"
                style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }} />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-xs" style={{ color: '#5a4535' }}>Tags (séparés par des virgules)</label>
            <input
              value={selected.tags.join(', ')}
              onChange={e => updateSession({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="pnj-mort, révélation, combat…"
              className="px-2 py-1 rounded text-sm outline-none"
              style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }}
            />
          </div>

          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-xs" style={{ color: '#5a4535' }}>Notes de session</label>
            <textarea
              value={selected.content}
              onChange={e => updateSession({ content: e.target.value })}
              placeholder="Ce qui s'est passé durant cette session…"
              className="px-3 py-2 rounded text-sm outline-none resize-none flex-1"
              style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0', minHeight: '300px' }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #3d1a08' }}>
        <h1 className="text-base font-semibold" style={{ color: '#c8972a', fontFamily: 'Georgia,serif' }}>
          Journal de campagne
        </h1>
        <button onClick={createSession} className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}>
          <Plus size={14} /> Nouvelle session
        </button>
      </div>

      {(campaigns?.length ?? 0) > 1 && (
        <div className="shrink-0 flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: '1px solid #3d1a08' }}>
          {['all', ...(campaigns ?? [])].map(c => (
            <button key={c} onClick={() => setFilterCampaign(c)}
              className="px-3 py-1 rounded-full text-xs shrink-0 transition-all"
              style={{
                background: filterCampaign === c ? '#3d1a08' : 'transparent',
                color: filterCampaign === c ? '#c8972a' : '#5a4535',
                border: `1px solid ${filterCampaign === c ? '#c8972a' : '#3d1a08'}`,
              }}>
              {c === 'all' ? 'Tout' : c}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
            <BookOpen size={48} style={{ color: '#3d1a08' }} />
            <div className="text-center">
              <div style={{ color: '#8a7055' }}>Aucune session</div>
              <div className="text-sm mt-1" style={{ color: '#5a4535' }}>Commencez à noter vos aventures</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(session => (
              <div key={session.id} onClick={() => setSelected(session)}
                className="rounded-lg p-3 cursor-pointer transition-all group"
                style={{ background: '#231008', border: '1px solid #3d1a08' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#e8d5b0' }}>
                      {session.campaign} — Session {session.sessionNumber}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#c8972a' }}>{session.title}</div>
                    <div className="text-xs mt-1" style={{ color: '#5a4535' }}>
                      {new Date(session.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteSession(session.id!) }}
                    className="opacity-0 group-hover:opacity-100 p-1" style={{ color: '#8b1a1a' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                {session.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {session.tags.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#1a0a00', color: '#5a4535' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
