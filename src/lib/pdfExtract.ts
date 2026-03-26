// PDF text extraction using pdf.js
let pdfjsLib: typeof import('pdfjs-dist') | null = null

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
  }
  return pdfjsLib
}

export async function extractTextFromPdf(blob: Blob): Promise<{ text: string; pageCount: number }> {
  try {
    const lib = await getPdfJs()
    const arrayBuffer = await blob.arrayBuffer()
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise
    const pageCount = pdf.numPages
    const texts: string[] = []

    // Extract up to 50 pages to avoid memory issues
    const maxPages = Math.min(pageCount, 50)
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ')
      texts.push(pageText)
    }

    return { text: texts.join('\n'), pageCount }
  } catch (e) {
    console.error('PDF extraction failed:', e)
    return { text: '', pageCount: 0 }
  }
}

export async function generatePdfThumbnail(blob: Blob): Promise<Blob | null> {
  try {
    const lib = await getPdfJs()
    const arrayBuffer = await blob.arrayBuffer()
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({ scale: 0.5 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await (page.render as any)({ canvasContext: ctx, viewport }).promise

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7)
    })
  } catch {
    return null
  }
}
