import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type PdfDocument, type PdfCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '../db/database'
import { extractTextFromPdf, generatePdfThumbnail } from '../lib/pdfExtract'
import { Upload, Search, FileText, Trash2, ExternalLink } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { PdfViewer } from '../components/pdf/PdfViewer'

const CATEGORIES: PdfCategory[] = ['regles', 'scenarios', 'aides-de-jeu', 'cartes', 'campagnes', 'bestiaire', 'personnages', 'autre']

export function Library() {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<PdfCategory | 'all'>('all')
  const [filterCampaign, setFilterCampaign] = useState<string>('all')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [viewPdf, setViewPdf] = useState<PdfDocument | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const pdfs = useLiveQuery(() => db.pdfs.orderBy('addedAt').reverse().toArray(), [])
  const campaigns = useLiveQuery(async () => {
    const all = await db.pdfs.toArray()
    return [...new Set(all.map(p => p.campaign).filter(Boolean))] as string[]
  }, [])

  const filtered = (pdfs ?? []).filter(p => {
    if (filterCat !== 'all' && p.category !== filterCat) return false
    if (filterCampaign !== 'all' && p.campaign !== filterCampaign) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
    }
    return true
  })

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.name.endsWith('.pdf')) continue
      setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' })
      const { text, pageCount } = await extractTextFromPdf(blob)
      const thumbnail = await generatePdfThumbnail(blob)
      await db.pdfs.add({
        name: file.name.replace(/\.pdf$/i, ''),
        category: 'autre',
        tags: [],
        blob,
        size: file.size,
        pageCount,
        textContent: text,
        addedAt: new Date(),
        thumbnail: thumbnail ?? undefined,
      })
    }
    setUploading(false)
    setUploadProgress(0)
  }

  async function deletePdf(id: number) {
    if (confirm('Supprimer ce PDF ?')) await db.pdfs.delete(id)
  }

  async function openPdf(pdf: PdfDocument) {
    if (pdf.id) await db.pdfs.update(pdf.id, { lastOpenedAt: new Date() })
    setViewPdf(pdf)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 px-3 py-2 flex gap-2 flex-wrap" style={{ borderBottom: '1px solid #3d1a08' }}>
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-40 px-3 py-1.5 rounded" style={{ background: '#231008', border: '1px solid #3d1a08' }}>
          <Search size={14} style={{ color: '#5a4535' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="bg-transparent outline-none flex-1 text-sm"
            style={{ color: '#e8d5b0' }}
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value as PdfCategory | 'all')}
          className="px-2 py-1.5 rounded text-sm outline-none"
          style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        {/* Campaign filter */}
        {(campaigns?.length ?? 0) > 0 && (
          <select
            value={filterCampaign}
            onChange={e => setFilterCampaign(e.target.value)}
            className="px-2 py-1.5 rounded text-sm outline-none"
            style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}
          >
            <option value="all">Toutes campagnes</option>
            {campaigns?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Upload */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #8b3a0a, #c8972a)', color: '#fff' }}
        >
          <Upload size={14} />
          <span>Ajouter PDF</span>
        </button>
        <input ref={fileRef} type="file" accept=".pdf" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="shrink-0 px-4 py-2" style={{ background: '#1a0a00', borderBottom: '1px solid #3d1a08' }}>
          <div className="flex items-center gap-3">
            <div className="text-sm" style={{ color: '#c8972a' }}>Traitement des PDFs… {uploadProgress}%</div>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: '#3d1a08' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: '#c8972a' }} />
            </div>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="shrink-0 flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: '1px solid #3d1a08' }}>
        {[{ id: 'all', label: 'Tout', icon: '📚' }, ...CATEGORIES.map(c => ({ id: c, label: CATEGORY_LABELS[c], icon: CATEGORY_ICONS[c] }))].map(cat => {
          const count = cat.id === 'all' ? (pdfs?.length ?? 0) : (pdfs?.filter(p => p.category === cat.id).length ?? 0)
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id as PdfCategory | 'all')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs shrink-0 transition-all"
              style={{
                background: filterCat === cat.id ? '#3d1a08' : 'transparent',
                color: filterCat === cat.id ? '#c8972a' : '#5a4535',
                border: `1px solid ${filterCat === cat.id ? '#c8972a' : '#3d1a08'}`,
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
            <FileText size={48} style={{ color: '#3d1a08' }} />
            <div className="text-center">
              <div style={{ color: '#8a7055' }}>Aucun PDF</div>
              <div className="text-sm mt-1" style={{ color: '#5a4535' }}>
                {search ? 'Aucun résultat pour cette recherche' : 'Ajoutez des PDFs avec le bouton ci-dessus'}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {filtered.map(pdf => (
              <PdfCard key={pdf.id} pdf={pdf} onOpen={openPdf} onDelete={deletePdf} />
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <Modal open={!!viewPdf} onClose={() => setViewPdf(null)} size="full" title={viewPdf?.name}>
        {viewPdf && <PdfViewer pdf={viewPdf} />}
      </Modal>
    </div>
  )
}

function PdfCard({ pdf, onOpen, onDelete }: { pdf: PdfDocument; onOpen: (p: PdfDocument) => void; onDelete: (id: number) => void }) {
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState(pdf.name)
  const [category, setCategory] = useState<PdfCategory>(pdf.category)
  const [campaign, setCampaign] = useState(pdf.campaign ?? '')

  async function saveEdit() {
    if (pdf.id) await db.pdfs.update(pdf.id, { name, category, campaign: campaign || undefined })
    setEditMode(false)
  }

  if (editMode) {
    return (
      <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: '#231008', border: '1px solid #c8972a' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="text-xs px-2 py-1 rounded w-full outline-none"
          style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value as PdfCategory)}
          className="text-xs px-2 py-1 rounded w-full outline-none"
          style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <input
          value={campaign}
          onChange={e => setCampaign(e.target.value)}
          placeholder="Campagne (optionnel)"
          className="text-xs px-2 py-1 rounded w-full outline-none"
          style={{ background: '#1a0a00', border: '1px solid #3d1a08', color: '#e8d5b0' }}
        />
        <div className="flex gap-2">
          <button onClick={saveEdit} className="flex-1 py-1 rounded text-xs" style={{ background: '#c8972a', color: '#fff' }}>Sauver</button>
          <button onClick={() => setEditMode(false)} className="flex-1 py-1 rounded text-xs" style={{ background: '#3d1a08', color: '#8a7055' }}>Annuler</button>
        </div>
      </div>
    )
  }

  const thumbUrl = pdf.thumbnail ? URL.createObjectURL(pdf.thumbnail) : null

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all hover:glow-gold group"
      style={{ background: '#231008', border: '1px solid #3d1a08' }}
    >
      {/* Thumbnail */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: '120px', background: '#1a0a00' }}
        onClick={() => onOpen(pdf)}
      >
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover opacity-80" />
        ) : (
          <FileText size={40} style={{ color: '#3d1a08' }} />
        )}
        <div className="absolute top-1 left-1 text-lg">{CATEGORY_ICONS[pdf.category]}</div>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <ExternalLink size={24} style={{ color: '#c8972a' }} />
        </div>
      </div>

      {/* Info */}
      <div className="p-2 flex-1 flex flex-col gap-1">
        <div
          className="text-xs font-medium line-clamp-2 leading-tight cursor-pointer"
          style={{ color: '#e8d5b0' }}
          onClick={() => setEditMode(true)}
          title="Cliquer pour modifier"
        >
          {pdf.name}
        </div>
        <div className="flex items-center gap-1 mt-auto">
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#1a0a00', color: '#8a7055' }}>
            {CATEGORY_LABELS[pdf.category]}
          </span>
          {pdf.pageCount && (
            <span className="text-xs" style={{ color: '#3d1a08' }}>{pdf.pageCount}p</span>
          )}
        </div>
        {pdf.campaign && (
          <div className="text-xs" style={{ color: '#5a4535' }}>📜 {pdf.campaign}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t" style={{ borderColor: '#3d1a08' }}>
        <button
          onClick={() => onOpen(pdf)}
          className="flex-1 py-1.5 text-xs transition-all hover:bg-amber-900/20"
          style={{ color: '#8a7055' }}
        >
          <ExternalLink size={12} className="inline mr-1" />Ouvrir
        </button>
        <button
          onClick={() => onDelete(pdf.id!)}
          className="px-2 py-1.5 text-xs transition-all hover:bg-red-900/20"
          style={{ color: '#5a4535', borderLeft: '1px solid #3d1a08' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
