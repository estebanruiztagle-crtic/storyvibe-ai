'use client'

import { useState } from 'react'
import { ExternalLink, FileText, Presentation, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useAppStore } from '@/store'
import SlidePreview, { autoLayout, buildContent } from '@/components/zones/zone3/SlideLayouts'

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
  const [isExportingPptx, setIsExportingPptx] = useState(false)

  const { slides } = design

  const totalSeconds = narrative.curvePoints.reduce((s, p) => s + (p.durationSeconds ?? 90), 0)
  const approvedCount = slides.filter((s) => s.approved).length
  const reviewStatus = review?.overallStatus ?? 'pending'

  // ── PPTX Export with pptxgenjs ──
  const handleExportPptx = async () => {
    if (slides.length === 0 || isExportingPptx) return
    setIsExportingPptx(true)

    try {
      // @ts-ignore — dynamic import to avoid SSR bundling of node:https
      const PptxGenJS = (await import(/* webpackIgnore: true */ 'pptxgenjs')).default
      const pptx = new PptxGenJS()
      pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
      pptx.layout = 'WIDE'
      pptx.title = title || 'StoryVibe Presentation'

      for (const slide of slides) {
        const content = buildContent(slide, design.palette?.swatches)
        const pptxSlide = pptx.addSlide()

        // Background
        const bgColor = content.pal.background.replace('#', '')
        pptxSlide.background = { color: bgColor }

        // Top accent bar
        pptxSlide.addShape('rect' as never, {
          x: 0, y: 0, w: 13.33, h: 0.06,
          fill: { color: content.pal.primary.replace('#', '') },
        })

        // Add image if available (right side, 40% width)
        if (content.imageUrl && !content.imageUrl.startsWith('blob:')) {
          try {
            pptxSlide.addImage({
              path: content.imageUrl,
              x: 7.8, y: 0.5, w: 5, h: 6.5,
              sizing: { type: 'cover', w: 5, h: 6.5 },
              rounding: true,
            })
          } catch {
            // Skip if image fails to load
          }
        }

        // Subtitle (emotion label)
        pptxSlide.addText(content.subtitle.toUpperCase(), {
          x: 0.7, y: 0.5, w: 6.5, h: 0.4,
          fontSize: 10, fontFace: 'Arial',
          color: content.pal.accent.replace('#', ''),
          bold: true, charSpacing: 3,
        })

        // Title
        pptxSlide.addText(content.title, {
          x: 0.7, y: 1.0, w: 6.5, h: 1.5,
          fontSize: 36, fontFace: 'Arial',
          color: '1A1A18', bold: true,
          shrinkText: true,
        })

        // Body text
        pptxSlide.addText(content.body, {
          x: 0.7, y: 2.8, w: 6.5, h: 3.0,
          fontSize: 14, fontFace: 'Arial',
          color: '6B6866', lineSpacingMultiple: 1.5,
          valign: 'top',
        })

        // Slide number
        pptxSlide.addText(`${slide.slide}`, {
          x: 12.3, y: 6.9, w: 0.8, h: 0.4,
          fontSize: 9, fontFace: 'Arial',
          color: '9B9895', align: 'right',
        })

        // Speaker notes from curve point
        const curvePoint = narrative.curvePoints.find((p) => p.slide === slide.slide)
        if (curvePoint?.speakerNotes) {
          pptxSlide.addNotes(curvePoint.speakerNotes)
        }
      }

      const fileName = (title || 'presentacion').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '').replace(/\s+/g, '-')
      await pptx.writeFile({ fileName: `${fileName}.pptx` })
    } catch (err) {
      console.error('PPTX export error:', err)
      alert(`Error generando PPTX: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsExportingPptx(false)
    }
  }

  // ── PDF Guide Export ──
  const handleExportPdf = () => {
    if (slides.length === 0) return
    setIsExportingPdf(true)

    try {
      const html = buildFullReportHtml()
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 800)
      }
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const buildFullReportHtml = (): string => {
    const slideRows = slides.map((slide, i) => {
      const content = buildContent(slide, design.palette?.swatches)
      const curvePoint = narrative.curvePoints.find((p) => p.slide === slide.slide)
      const typeColor = slide.type === 'peak' ? '#1D9E75' : slide.type === 'valley' ? '#378ADD' : '#EF9F27'
      const typeLabel = slide.type === 'peak' ? 'Pico' : slide.type === 'valley' ? 'Valle' : 'Transición'
      const reviewScore = review?.slideScores.find((s) => s.slide === slide.slide)
      const duration = curvePoint?.durationSeconds ?? 90

      return `
      <div class="slide-card" style="page-break-inside:avoid;border:1px solid #e5e2da;border-radius:12px;padding:24px;margin-bottom:20px;background:white;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <span style="background:${typeColor};color:white;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;">
            SLIDE ${slide.slide} · ${typeLabel.toUpperCase()}
          </span>
          <span style="color:#6b6866;font-size:12px;">${slide.emotion} · intensidad ${slide.intensity}/10</span>
          <span style="color:#9b9895;font-size:11px;margin-left:auto;">${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}</span>
          ${reviewScore ? `<span style="background:${reviewScore.composite >= 7 ? '#e1f5ee' : reviewScore.composite >= 5 ? '#faeeda' : '#fcebeb'};color:${reviewScore.composite >= 7 ? '#1D9E75' : reviewScore.composite >= 5 ? '#BA7517' : '#A32D2D'};padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;">${reviewScore.composite.toFixed(1)}</span>` : ''}
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#1a1a18;margin:0 0 8px;">${content.title}</h3>
        <p style="font-size:13px;color:#6b6866;line-height:1.6;margin:0 0 12px;">${content.body}</p>
        ${content.imageUrl && !content.imageUrl.startsWith('blob:') ? `<img src="${content.imageUrl}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:12px;" />` : ''}
        ${curvePoint?.speakerNotes ? `
        <div style="background:#f5f3ef;border-radius:8px;padding:12px;margin-top:8px;">
          <div style="font-size:10px;font-weight:700;color:#9b9895;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Notas del presentador</div>
          <p style="font-size:12px;color:#444441;line-height:1.5;margin:0;">${curvePoint.speakerNotes}</p>
        </div>` : ''}
        ${slide.selectedLayout ? `<div style="font-size:10px;color:#9b9895;margin-top:8px;">Layout: ${slide.selectedLayout}</div>` : ''}
      </div>`
    }).join('')

    const paletteHtml = design.palette ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Paleta de colores</h2>
      <div style="display:flex;gap:12px;margin-bottom:12px;">
        ${design.palette.swatches.map((sw) => `
          <div style="text-align:center;">
            <div style="width:48px;height:48px;border-radius:8px;background:${sw.hex};border:1px solid #e5e2da;"></div>
            <div style="font-size:9px;font-family:monospace;color:#6b6866;margin-top:4px;">${sw.hex}</div>
            <div style="font-size:9px;color:#9b9895;">${sw.role}</div>
          </div>
        `).join('')}
      </div>
      <p style="font-size:12px;color:#6b6866;line-height:1.5;">${design.palette.rationale}</p>
    </div>` : ''

    const contextHtml = context?.event || context?.audience || context?.objective ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Contexto</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        ${context?.event ? `<div style="background:#f5f3ef;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#9b9895;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Evento</div><div style="font-size:13px;color:#1a1a18;">${context.event}</div></div>` : ''}
        ${context?.audience ? `<div style="background:#f5f3ef;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#9b9895;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Audiencia</div><div style="font-size:13px;color:#1a1a18;">${context.audience}</div></div>` : ''}
        ${context?.objective ? `<div style="background:#f5f3ef;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#9b9895;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Objetivo</div><div style="font-size:13px;color:#1a1a18;">${context.objective}</div></div>` : ''}
      </div>
    </div>` : ''

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || 'Presentación'} — Guía StoryVibe</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 24px; color: #1a1a18; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  .meta { color: #9b9895; font-size: 13px; margin-bottom: 32px; }
  @media print {
    body { margin: 16px; max-width: 100%; }
    .slide-card { break-inside: avoid; }
  }
</style></head><body>
<h1>${title || 'Presentación'}</h1>
<p class="meta">Guía de diseño generada por StoryVibe AI · ${slides.length} láminas · ${formatTime(totalSeconds)} · ${new Date().toLocaleDateString()}</p>
${contextHtml}
${paletteHtml}
<h2 style="font-size:16px;font-weight:700;margin-bottom:16px;">Láminas (${slides.length})</h2>
${slideRows}
<p style="margin-top:32px;font-size:10px;color:#b8b4aa;text-align:center;">Generado por StoryVibe AI · ${new Date().toLocaleDateString()}</p>
</body></html>`
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
          { label: 'Láminas', value: `${slides.length}`, sub: `${approvedCount} aprobadas` },
          { label: 'Tiempo total', value: formatTime(totalSeconds), sub: `${Math.round(totalSeconds / 60)} min` },
          { label: 'Evaluación', value: reviewStatus === 'pass' ? 'OK' : reviewStatus === 'warning' ? 'Alerta' : 'Pendiente',
            sub: review ? `${review.slideScores.filter((s) => s.composite >= 7).length}/${review.slideScores.length} ok` : 'sin evaluar' },
          { label: 'Título', value: title || 'Sin título', sub: '' },
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
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleExportPptx}
          disabled={isExportingPptx}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 py-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          <Download size={18} />
          {isExportingPptx ? 'Generando...' : 'Descargar PPTX'}
        </button>
        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-white py-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
        >
          <FileText size={18} />
          {isExportingPdf ? 'Generando...' : 'Guía PDF'}
        </button>
        <button
          onClick={() => window.open('https://www.canva.com/create/presentations/', '_blank', 'noopener,noreferrer')}
          className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          <ExternalLink size={18} />
          Abrir Canva
        </button>
      </div>

      <p className="text-center text-[10px] text-neutral-400">
        PPTX editable con título, contenido y notas del presentador por slide
      </p>
    </div>
  )
}
