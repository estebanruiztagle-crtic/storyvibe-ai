'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, FileText, Presentation, ChevronLeft, ChevronRight, Download, Clock, BookOpen, Loader2, RefreshCw } from 'lucide-react'
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

  // Zone 5: Pacing & Pitch
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  interface PacingItem { slide: number; seconds: number; pacing: 'slow' | 'medium' | 'fast'; rationale: string }
  interface PitchSection { slideRange: string; title: string; narrativeSummary: string; durationSeconds: number; durationPercent: number; toneOfVoice: string; suggestedActions: string[]; keyQuestions: string[] }
  interface PitchData { overallNarrative: string; totalSeconds: number; sections: PitchSection[] }

  const [pacing, setPacing] = useState<PacingItem[] | null>(null)
  const [pacingLoading, setPacingLoading] = useState(false)
  const [pitch, setPitch] = useState<PitchData | null>(null)
  const [pitchLoading, setPitchLoading] = useState(false)

  const { slides } = design

  const totalSeconds = narrative.curvePoints.reduce((s, p) => s + (p.durationSeconds ?? 90), 0)
  const approvedCount = slides.filter((s) => s.approved).length
  const reviewStatus = review?.overallStatus ?? 'pending'

  // ── Auto-fetch pacing on mount ──
  const fetchPacing = useCallback(async () => {
    if (narrative.curvePoints.length === 0) return
    setPacingLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone5/calculate-pacing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curvePoints: narrative.curvePoints,
          totalAvailableSeconds: totalSeconds,
          slideCount: slides.length,
        }),
      })
      const data = await res.json()
      if (data.pacing) setPacing(data.pacing)
    } catch (err) {
      console.error('Pacing fetch error:', err)
    } finally {
      setPacingLoading(false)
    }
  }, [narrative.curvePoints, totalSeconds, slides.length, API])

  useEffect(() => {
    if (slides.length > 0 && !pacing && !pacingLoading) fetchPacing()
  }, [slides.length, pacing, pacingLoading, fetchPacing])

  const fetchPitch = async () => {
    if (slides.length === 0) return
    setPitchLoading(true)
    try {
      const storyboardSlides = narrative.curvePoints.map((p) => {
        const pacingItem = pacing?.find((pa) => pa.slide === p.slide)
        return {
          slide: p.slide,
          label: p.label,
          fullLabel: p.label,
          type: p.type,
          emotion: p.emotion,
          intensity: p.intensity,
          seconds: pacingItem?.seconds ?? p.durationSeconds ?? 90,
        }
      })
      const res = await fetch(`${API}/api/v1/zones/zone5/generate-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboardSlides,
          zone1Context: context,
          narrativeBrief: narrative.narrativeBrief,
          presentationTitle: title,
          totalSeconds,
        }),
      })
      const data = await res.json()
      if (data.success && data.pitch) setPitch(data.pitch)
    } catch (err) {
      console.error('Pitch fetch error:', err)
    } finally {
      setPitchLoading(false)
    }
  }

  // ── PPTX Export with pptxgenjs ──
  const handleExportPptx = async () => {
    if (slides.length === 0 || isExportingPptx) return
    setIsExportingPptx(true)

    try {
      // Load pptxgenjs v3 from CDN (v4 has node: protocol issues, v3 UMD works in browser)
      if (!(window as any).PptxGenJS) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load pptxgenjs'))
          document.head.appendChild(s)
        })
      }
      const PptxGenJS = (window as any).PptxGenJS
      if (!PptxGenJS) throw new Error('PptxGenJS not loaded')
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

        // Speaker notes from curve point + tips
        const curvePoint = narrative.curvePoints.find((p) => p.slide === slide.slide)
        const tips = (slide.graphicSuggestion as any)?.tips as string[] | undefined
        const noteParts: string[] = []
        if (curvePoint?.speakerNotes) noteParts.push(curvePoint.speakerNotes)
        if (tips?.length) noteParts.push('\n--- Tips de delivery ---\n' + tips.map(t => `• ${t}`).join('\n'))
        if (noteParts.length) pptxSlide.addNotes(noteParts.join('\n'))
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
        ${content.tips?.length ? `
        <div style="background:#fffaf0;border:1px solid #f5e6cc;border-radius:8px;padding:12px;margin-top:8px;">
          <div style="font-size:10px;font-weight:700;color:#BA7517;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Tips de delivery</div>
          <ul style="margin:0;padding-left:16px;">${content.tips.map(t => `<li style="font-size:12px;color:#444441;line-height:1.5;margin-bottom:4px;">${t}</li>`).join('')}</ul>
        </div>` : ''}
        ${reviewScore?.suggestions?.length ? `
        <div style="background:#fef2f2;border:1px solid #f5cccc;border-radius:8px;padding:12px;margin-top:8px;">
          <div style="font-size:10px;font-weight:700;color:#A32D2D;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Sugerencias de mejora</div>
          <ul style="margin:0;padding-left:16px;">${reviewScore.suggestions.map(s => `<li style="font-size:12px;color:#444441;line-height:1.5;margin-bottom:4px;">${s}</li>`).join('')}</ul>
        </div>` : ''}
        ${slide.selectedLayout ? `<div style="font-size:10px;color:#9b9895;margin-top:8px;">Layout: ${slide.selectedLayout}</div>` : ''}
      </div>`
    }).join('')

    const paletteHtml = design.palette ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Paleta de colores</h2>
      <div style="display:flex;gap:16px;margin-bottom:12px;">
        ${design.palette.swatches.map((sw) => `
          <div style="text-align:center;">
            <div style="width:52px;height:52px;border-radius:8px;background-color:${sw.hex} !important;border:1px solid #ccc;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;"></div>
            <div style="font-size:9px;font-family:monospace;color:#6b6866;margin-top:4px;">${sw.hex}</div>
            <div style="font-size:9px;color:#9b9895;">${sw.role}</div>
          </div>
        `).join('')}
      </div>
      <p style="font-size:12px;color:#6b6866;line-height:1.5;">${design.palette.rationale}</p>
    </div>` : ''

    // ── Diagnóstico completo (Zone 1 data) ──
    const ctx = context
    const diagField = (label: string, value: string | number | undefined | null | boolean) => {
      const v = value === undefined || value === null || value === '' || value === 0 || value === false ? null : String(value)
      return v ? `<div style="margin-bottom:8px;"><span style="font-size:10px;font-weight:700;color:#9b9895;text-transform:uppercase;letter-spacing:0.05em;">${label}</span><div style="font-size:13px;color:#1a1a18;margin-top:2px;">${v}</div></div>` : ''
    }

    const eventHtml = ctx?.event ? `
    <div style="background:#f5f3ef;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="font-size:13px;font-weight:700;color:#1a1a18;margin:0 0 12px;">Evento</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 16px;">
        ${diagField('Tipo', ctx.event.type)}
        ${diagField('Nombre', ctx.event.name)}
        ${diagField('Fecha', ctx.event.date)}
        ${diagField('Formato', ctx.event.format)}
        ${diagField('Duración', ctx.event.durationMinutes ? `${ctx.event.durationMinutes} min` : '')}
        ${diagField('Q&A', ctx.event.qaMinutes ? `${ctx.event.qaMinutes} min` : '')}
        ${diagField('Idioma', ctx.event.language)}
        ${diagField('Lugar', ctx.event.location)}
        ${diagField('Formalidad', ctx.event.formalityLevel ? `${ctx.event.formalityLevel}/10` : '')}
      </div>
    </div>` : ''

    const audienceHtml = ctx?.audience ? `
    <div style="background:#f5f3ef;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="font-size:13px;font-weight:700;color:#1a1a18;margin:0 0 12px;">Audiencia</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
        ${diagField('Tamaño', ctx.audience.size ? `${ctx.audience.size} personas` : '')}
        ${diagField('Baseline emocional', ctx.audience.emotionalBaseline)}
        ${diagField('Motivación principal', ctx.audience.primaryMotivation)}
        ${diagField('Miedo principal', ctx.audience.primaryFear)}
        ${diagField('Atención', ctx.audience.attentionMinutes ? `${ctx.audience.attentionMinutes} min` : '')}
        ${diagField('Familiaridad', ctx.audience.familiarity)}
      </div>
      ${ctx.audience.segments?.length ? `
      <div style="margin-top:12px;">
        <div style="font-size:10px;font-weight:700;color:#9b9895;text-transform:uppercase;margin-bottom:8px;">Segmentos</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${ctx.audience.segments.map(seg => `
            <div style="background:white;border-radius:8px;padding:8px 12px;border:1px solid #e5e2da;flex:1;min-width:140px;">
              <div style="font-size:12px;font-weight:700;color:#1a1a18;">${seg.role}</div>
              <div style="font-size:11px;color:#6b6866;">${seg.percentage}% — ${seg.description}</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    </div>` : ''

    const objectiveHtml = ctx?.objective ? `
    <div style="background:#f5f3ef;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="font-size:13px;font-weight:700;color:#1a1a18;margin:0 0 12px;">Objetivo</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
        ${diagField('Objetivo primario', ctx.objective.primary)}
        ${diagField('Acción deseada', ctx.objective.desiredAction)}
        ${diagField('Métrica de éxito', ctx.objective.successMetric)}
        ${diagField('Debe recordar', ctx.objective.mustRemember)}
        ${diagField('Debe sentir', ctx.objective.mustFeel)}
      </div>
    </div>` : ''

    const toneHtml = ctx?.tone ? `
    <div style="background:#f5f3ef;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="font-size:13px;font-weight:700;color:#1a1a18;margin:0 0 12px;">Tono narrativo</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
        ${diagField('Tono primario', ctx.tone.primary)}
        ${diagField('Arco narrativo', ctx.tone.narrativeArc)}
        ${diagField('Hook', ctx.tone.hook)}
        ${diagField('Prueba/Proof', ctx.tone.proof)}
        ${diagField('Humor permitido', ctx.tone.humorAllowed ? 'Sí' : 'No')}
      </div>
      ${ctx.tone.arc?.opening || ctx.tone.arc?.middle || ctx.tone.arc?.closing ? `
      <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        ${ctx.tone.arc.opening ? `<div style="background:white;border-radius:8px;padding:8px;border:1px solid #e5e2da;"><div style="font-size:10px;font-weight:700;color:#9b9895;margin-bottom:4px;">APERTURA</div><div style="font-size:11px;color:#1a1a18;">${ctx.tone.arc.opening}</div></div>` : ''}
        ${ctx.tone.arc.middle ? `<div style="background:white;border-radius:8px;padding:8px;border:1px solid #e5e2da;"><div style="font-size:10px;font-weight:700;color:#9b9895;margin-bottom:4px;">DESARROLLO</div><div style="font-size:11px;color:#1a1a18;">${ctx.tone.arc.middle}</div></div>` : ''}
        ${ctx.tone.arc.closing ? `<div style="background:white;border-radius:8px;padding:8px;border:1px solid #e5e2da;"><div style="font-size:10px;font-weight:700;color:#9b9895;margin-bottom:4px;">CIERRE</div><div style="font-size:11px;color:#1a1a18;">${ctx.tone.arc.closing}</div></div>` : ''}
      </div>` : ''}
    </div>` : ''

    const risksHtml = ctx?.riskFlags?.length ? `
    <div style="background:#fef2f2;border:1px solid #f5cccc;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="font-size:13px;font-weight:700;color:#A32D2D;margin:0 0 12px;">Riesgos detectados</h3>
      ${ctx.riskFlags.map(r => `
        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #f5cccc;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;background:${r.severity === 'alta' ? '#A32D2D' : r.severity === 'media' ? '#BA7517' : '#6b6866'};color:white;">${r.severity.toUpperCase()}</span>
            <span style="font-size:12px;font-weight:700;color:#1a1a18;">${r.title}</span>
          </div>
          <div style="font-size:11px;color:#6b6866;margin-top:4px;">${r.mitigation}</div>
        </div>
      `).join('')}
    </div>` : ''

    const constraintsHtml = ctx?.constraints && (ctx.constraints.mandatoryTopics?.length || ctx.constraints.avoidTopics?.length) ? `
    <div style="background:#f5f3ef;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="font-size:13px;font-weight:700;color:#1a1a18;margin:0 0 12px;">Restricciones</h3>
      ${ctx.constraints.mandatoryTopics?.length ? `<div style="margin-bottom:8px;"><span style="font-size:10px;font-weight:700;color:#1D9E75;">TEMAS OBLIGATORIOS:</span> <span style="font-size:12px;color:#1a1a18;">${ctx.constraints.mandatoryTopics.join(', ')}</span></div>` : ''}
      ${ctx.constraints.avoidTopics?.length ? `<div><span style="font-size:10px;font-weight:700;color:#A32D2D;">TEMAS A EVITAR:</span> <span style="font-size:12px;color:#1a1a18;">${ctx.constraints.avoidTopics.join(', ')}</span></div>` : ''}
    </div>` : ''

    const diagnosisHtml = (eventHtml || audienceHtml || objectiveHtml || toneHtml) ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:16px;">Diagnóstico de contexto</h2>
      ${eventHtml}${audienceHtml}${objectiveHtml}${toneHtml}${constraintsHtml}${risksHtml}
    </div>` : ''

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || 'Presentación'} — Guía StoryVibe</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 24px; color: #1a1a18; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  .meta { color: #9b9895; font-size: 13px; margin-bottom: 32px; }
  @media print {
    body { margin: 16px; max-width: 100%; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    .slide-card { break-inside: avoid; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style></head><body>
<h1>${title || 'Presentación'}</h1>
<p class="meta">Guía de diseño generada por StoryVibe AI · ${slides.length} láminas · ${formatTime(totalSeconds)} · ${new Date().toLocaleDateString()}</p>
${diagnosisHtml}
${paletteHtml}
${review ? (() => {
      const avgScore = review.slideScores.length > 0
        ? (review.slideScores.reduce((a, s) => a + s.composite, 0) / review.slideScores.length).toFixed(1)
        : '—'
      const statusColor = review.overallStatus === 'pass' ? '#1D9E75' : review.overallStatus === 'warning' ? '#BA7517' : '#A32D2D'
      const statusLabel = review.overallStatus === 'pass' ? 'Aprobada' : review.overallStatus === 'warning' ? 'Con observaciones' : 'Necesita mejoras'
      const totalSuggestions = review.slideScores.reduce((a, s) => a + s.suggestions.length, 0)
      return `
    <div style="margin-bottom:32px;border:2px solid ${statusColor}22;border-radius:12px;padding:20px;background:${statusColor}08;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Evaluación general</h2>
      <div style="display:flex;gap:24px;align-items:center;">
        <div style="text-align:center;">
          <div style="font-size:36px;font-weight:800;color:${statusColor};">${avgScore}</div>
          <div style="font-size:11px;color:#6b6866;">Puntuación promedio</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:16px;font-weight:700;color:${statusColor};">${statusLabel}</div>
          <div style="font-size:11px;color:#6b6866;">Estado general</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:16px;font-weight:700;color:#1a1a18;">${totalSuggestions}</div>
          <div style="font-size:11px;color:#6b6866;">Sugerencias de mejora</div>
        </div>
      </div>
    </div>`
    })() : ''}
${pitch ? `
<div style="margin-bottom:32px;">
  <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Guión narrativo</h2>
  <div style="background:#f5f3ef;border-radius:12px;padding:16px;margin-bottom:16px;">
    <div style="font-size:10px;font-weight:700;color:#9b9895;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Arco narrativo</div>
    <p style="font-size:13px;color:#1a1a18;line-height:1.6;margin:0;">${pitch.overallNarrative}</p>
  </div>
  ${pitch.sections.map((sec) => `
  <div style="border:1px solid #e5e2da;border-radius:12px;padding:16px;margin-bottom:12px;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <span style="background:#1a1a18;color:white;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;">${sec.slideRange}</span>
      <span style="font-size:14px;font-weight:700;color:#1a1a18;">${sec.title}</span>
      <span style="margin-left:auto;font-size:11px;color:#9b9895;">${formatTime(sec.durationSeconds)} · ${sec.durationPercent}%</span>
    </div>
    <p style="font-size:12px;color:#6b6866;line-height:1.5;margin:0 0 12px;">${sec.narrativeSummary}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
      <div style="background:#eff6ff;border-radius:8px;padding:10px;">
        <div style="font-size:9px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin-bottom:4px;">Tono</div>
        <p style="font-size:11px;color:#1e3a5f;line-height:1.4;margin:0;">${sec.toneOfVoice}</p>
      </div>
      <div style="background:#fffbeb;border-radius:8px;padding:10px;">
        <div style="font-size:9px;font-weight:700;color:#d97706;text-transform:uppercase;margin-bottom:4px;">Acciones</div>
        <ul style="margin:0;padding-left:12px;">${sec.suggestedActions.map(a => `<li style="font-size:11px;color:#78350f;line-height:1.4;">${a}</li>`).join('')}</ul>
      </div>
      <div style="background:#ecfdf5;border-radius:8px;padding:10px;">
        <div style="font-size:9px;font-weight:700;color:#059669;text-transform:uppercase;margin-bottom:4px;">Preguntas clave</div>
        <ul style="margin:0;padding-left:12px;">${sec.keyQuestions.map(q => `<li style="font-size:11px;color:#064e3b;line-height:1.4;">${q}</li>`).join('')}</ul>
      </div>
    </div>
  </div>`).join('')}
</div>` : ''}
${pacing ? `
<div style="margin-bottom:32px;">
  <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Distribución de tiempo</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    <tr style="border-bottom:2px solid #e5e2da;">
      <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;font-weight:700;">SLIDE</th>
      <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;font-weight:700;">TIEMPO</th>
      <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;font-weight:700;">RITMO</th>
      <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;font-weight:700;">NOTA</th>
    </tr>
    ${pacing.map(p => `
    <tr style="border-bottom:1px solid #f0ede8;">
      <td style="padding:6px 8px;font-weight:600;">Slide ${p.slide}</td>
      <td style="padding:6px 8px;font-family:monospace;">${formatTime(p.seconds)}</td>
      <td style="padding:6px 8px;"><span style="background:${p.pacing === 'slow' ? '#dbeafe' : p.pacing === 'fast' ? '#fef3c7' : '#f3f4f6'};color:${p.pacing === 'slow' ? '#1e40af' : p.pacing === 'fast' ? '#92400e' : '#374151'};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${p.pacing}</span></td>
      <td style="padding:6px 8px;color:#6b6866;">${p.rationale}</td>
    </tr>`).join('')}
  </table>
</div>` : ''}
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

      {/* Pacing per slide */}
      {pacing && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-neutral-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Ritmo por slide</span>
            </div>
            <button onClick={fetchPacing} disabled={pacingLoading} className="text-[10px] text-neutral-400 hover:text-neutral-600">
              <RefreshCw size={12} className={pacingLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="space-y-1.5">
            {pacing.map((p) => {
              const pacingColor = p.pacing === 'slow' ? 'bg-blue-100 text-blue-700' : p.pacing === 'fast' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
              return (
                <div key={p.slide} className="flex items-center gap-3 text-xs">
                  <span className="w-14 shrink-0 font-semibold text-neutral-700">Slide {p.slide}</span>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-800 rounded-full" style={{ width: `${Math.min(100, (p.seconds / totalSeconds) * slides.length * 100)}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono text-neutral-500">{formatTime(p.seconds)}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${pacingColor}`}>{p.pacing}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {pacingLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-4">
          <Loader2 size={16} className="animate-spin text-neutral-400" />
          <span className="text-xs text-neutral-400">Calculando ritmo…</span>
        </div>
      )}

      {/* Pitch narrativo */}
      {!pitch && !pitchLoading && pacing && (
        <button
          onClick={fetchPitch}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 py-4 text-sm font-semibold text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
        >
          <BookOpen size={18} />
          Generar guión narrativo
        </button>
      )}
      {pitchLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-6">
          <Loader2 size={16} className="animate-spin text-neutral-400" />
          <span className="text-xs text-neutral-400">Generando guión narrativo…</span>
        </div>
      )}
      {pitch && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-neutral-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Guión narrativo</span>
            </div>
            <button onClick={fetchPitch} disabled={pitchLoading} className="text-[10px] text-neutral-400 hover:text-neutral-600">
              <RefreshCw size={12} className={pitchLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          {/* Overall narrative */}
          <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Arco narrativo</div>
            <p className="text-sm text-neutral-700 leading-relaxed">{pitch.overallNarrative}</p>
          </div>
          {/* Sections */}
          <div className="space-y-3">
            {pitch.sections.map((sec, i) => (
              <div key={i} className="rounded-xl border border-neutral-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white">{sec.slideRange}</span>
                  <span className="text-sm font-semibold text-neutral-800">{sec.title}</span>
                  <span className="ml-auto text-[10px] text-neutral-400">{formatTime(sec.durationSeconds)} · {sec.durationPercent}%</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed mb-3">{sec.narrativeSummary}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-blue-50/60 p-2.5">
                    <div className="text-[9px] font-bold uppercase text-blue-500 mb-1">Tono</div>
                    <p className="text-[11px] text-blue-800 leading-snug">{sec.toneOfVoice}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50/60 p-2.5">
                    <div className="text-[9px] font-bold uppercase text-amber-600 mb-1">Acciones</div>
                    <ul className="space-y-0.5">
                      {sec.suggestedActions.map((a, j) => (
                        <li key={j} className="text-[11px] text-amber-800 leading-snug">• {a}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-emerald-50/60 p-2.5">
                    <div className="text-[9px] font-bold uppercase text-emerald-600 mb-1">Preguntas clave</div>
                    <ul className="space-y-0.5">
                      {sec.keyQuestions.map((q, j) => (
                        <li key={j} className="text-[11px] text-emerald-800 leading-snug">• {q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
