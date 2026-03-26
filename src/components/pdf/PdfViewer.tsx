import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import type { PdfDocument } from '../../db/database'

interface Props {
  pdf: PdfDocument
}

export function PdfViewer({ pdf }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const renderTaskRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
      GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      const ab = await pdf.blob.arrayBuffer()
      const doc = await getDocument({ data: ab }).promise
      if (!cancelled) {
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [pdf])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let cancelled = false

    async function render() {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
      try {
        const p = await pdfDoc.getPage(page)
        if (cancelled) return
        const vp = p.getViewport({ scale })
        const canvas = canvasRef.current!
        canvas.width = vp.width
        canvas.height = vp.height
        const ctx = canvas.getContext('2d')!
        const task = (p.render as any)({ canvasContext: ctx, viewport: vp })
        renderTaskRef.current = task
        await task.promise
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException') console.error(e)
      }
    }
    render()
    return () => { cancelled = true }
  }, [pdfDoc, page, scale])

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 gap-2 flex-wrap" style={{ borderBottom: '1px solid #3d1a08' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded disabled:opacity-30"
            style={{ background: '#231008', color: '#c8972a' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm" style={{ color: '#8a7055' }}>
            {page} / {numPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            className="p-1.5 rounded disabled:opacity-30"
            style={{ background: '#231008', color: '#c8972a' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 rounded" style={{ background: '#231008', color: '#c8972a' }}>
            <ZoomOut size={16} />
          </button>
          <span className="text-xs" style={{ color: '#5a4535' }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 rounded" style={{ background: '#231008', color: '#c8972a' }}>
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setScale(1.2)} className="p-1.5 rounded" style={{ background: '#231008', color: '#5a4535' }}>
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Page jump */}
        <input
          type="number"
          value={page}
          min={1}
          max={numPages}
          onChange={e => setPage(Math.max(1, Math.min(numPages, parseInt(e.target.value) || 1)))}
          className="w-16 text-center text-sm px-2 py-1 rounded outline-none"
          style={{ background: '#231008', border: '1px solid #3d1a08', color: '#e8d5b0' }}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex justify-center p-4" style={{ background: '#0d0500' }}>
        {loading ? (
          <div className="flex items-center justify-center text-sm" style={{ color: '#8a7055' }}>
            Chargement…
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-2xl" style={{ maxWidth: '100%' }} />
        )}
      </div>
    </div>
  )
}
