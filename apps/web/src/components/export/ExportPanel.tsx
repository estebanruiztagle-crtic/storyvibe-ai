'use client'

import { useState } from 'react'
import { ExternalLink, FileText, Presentation, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store'
import SlidePreview, { autoLayout } from '@/components/zones/zone3/SlideLayouts'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ExportPanel() {
  const design = useAppStore((s) => s.design)
  const narrative = useAppStore((s) => s.narrative)
  const context = useAppStore((s) => s.context)
  const title = useAppStore((s) => s.presentationTitle)
  const review = useAppStore((s) => s.review)

  const [current, setCurrent] = useState(0)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const { slides } = design

  const totalSeconds = narrative.curvePoints.reduce((s, p) => s + (p.durationSeconds ?? 90), 0)
  const approvedCount = slides.filter((s) => s.approved).length
  const reviewStatus = review?.overallStatus ?? 'pending'

  const handleExportPdf = async () => {
    if (slides.length === 0 || isExportingPdf) return
    setIsExportingPdf(true)

    try {
      // Build a report-style HTML and open in new window for print/PDF
      const res = await fetch(`${API}/api/v1/zones/zone5/generate-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboardSlides: narrative.curvePoints.map((p) => ({
            slide: p.slide, label: p.label, fullLabel: p.fullLabel,
            type: p.type, emotion: p.emotion, intensity: p.intensity,
            seconds: p.durationSeconds ?? 90,
          })),
          zone1Context: context,
          narrativeBrief: narrative.narrativeBrief,
          presentationTitle: title,
          totalSeconds,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.pitch) {
          // Open report in new window
          const html = buildReportHtml(data.pitch, title)
          const win = window.open('', '_blank')
          if (win) {
            win.document.write(html)
            win.document.close()
            setTimeout(() => win.print(), 600)
          }
        }
      }
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleOpenCanva = () => {
    window.open('https://www.canva.com/create/presentations/', '_blank', 'noopener,noreferrer')
  }

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Presentation size={32} className="mb-3 text-neutral-300" />
        <p className="text-sm">Sin láminas para exportar</p>
        <p className="text-xs mt-1">Completa los pasos anteriores primero</p>
      </div>
    )
  }

  const slide = slides[current]!
  const layout = slide.selectedLayout ?? autoLayout(slide)

  return (
    <div className="flex flex-col gap-5">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Laminas', value: `${slides.length}`, sub: `${approvedCount} aprobadas` },
          { label: 'Tiempo total', value: formatTime(totalSeconds), sub: `${Math.round(totalSeconds / 60)} min` },
          { label: 'Evaluacion', value: reviewStatus === 'pass' ? 'OK' : reviewStatus === 'warning' ? 'Alerta' : 'Pendiente',
            sub: review ? `${review.slideScores.filter((s) => s.composite >= 7).length}/${review.slideScores.length} ok` : 'sin evaluar' },
          { label: 'Titulo', value: title || 'Sin titulo', sub: '' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{item.label}</div>
            <div className="text-sm font-semibold text-neutral-800 mt-1 truncate">{item.value}</div>
            {item.sub && <div className="text-[10px] text-neutral-400 mt-0.5">{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="rounded-2xl bg-neutral-900 p-6">
        <div className="mx-auto" style={{ maxWidth: 'calc(50vh * 16 / 9)', aspectRatio: '16/9' }}>
          <SlidePreview slide={slide} layout={layout} swatches={design.palette?.swatches} containerWidth={600} />
        </div>
      </div>

      {/* Thumbnails + nav */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-neutral-100 p-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`shrink-0 rounded-lg overflow-hidden transition-all ${
              current === i ? 'ring-2 ring-neutral-900' : 'opacity-50 hover:opacity-80'
            }`}
            style={{ width: 80, aspectRatio: '16/9' }}
          >
            <SlidePreview slide={s} layout={s.selectedLayout ?? autoLayout(s)} swatches={design.palette?.swatches} containerWidth={80} />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((i) => Math.max(0, i - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <span className="text-xs text-neutral-400">{current + 1} / {slides.length} — {slide.label}</span>
        <button
          onClick={() => setCurrent((i) => Math.min(slides.length - 1, i + 1))}
          disabled={current === slides.length - 1}
          className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-white py-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
        >
          <FileText size={18} />
          {isExportingPdf ? 'Generando guía...' : 'Guía PDF para Canva'}
        </button>
        <button
          onClick={handleOpenCanva}
          className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          <ExternalLink size={18} />
          Abrir Canva
        </button>
      </div>

      <p className="text-center text-[10px] text-neutral-400">
        Usa la guía PDF como referencia para crear tus {slides.length} slides en Canva
      </p>
    </div>
  )
}

function buildReportHtml(pitch: { summary?: string; slidePitches?: Array<{ slide: number; pitch: string }> }, title: string): string {
  const pitchRows = pitch.slidePitches?.map((p) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:60px;">Slide ${p.slide}</td><td style="padding:8px;border-bottom:1px solid #eee;">${p.pitch}</td></tr>`
  ).join('') ?? ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} — Guia StoryVibe</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a18;}
h1{font-size:24px;margin-bottom:8px}p.sub{color:#888;font-size:14px;margin-bottom:32px}
table{width:100%;border-collapse:collapse}h2{font-size:16px;margin-top:32px;margin-bottom:12px}
.summary{background:#f5f3ef;padding:16px;border-radius:8px;margin-bottom:24px;font-size:14px;line-height:1.6}
@media print{body{margin:20px}}</style></head><body>
<h1>${title}</h1><p class="sub">Guia de presentacion generada por StoryVibe AI</p>
${pitch.summary ? `<div class="summary">${pitch.summary}</div>` : ''}
<h2>Pitch por slide</h2><table>${pitchRows}</table>
<p style="margin-top:32px;font-size:11px;color:#aaa">Generado el ${new Date().toLocaleDateString()}</p>
</body></html>`
}
