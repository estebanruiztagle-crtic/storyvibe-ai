// exportPdf.ts — Comprehensive presentation report
// Covers Act 1 (context), Act 2 (narrative), Act 3 (visual design),
// speaker notes, pitch timing, and palette.

import type { Zone3State, ColorSwatch } from './types'

// ─── External type mirrors (avoids cross-package imports) ──────────────────────
interface Zone1Context {
  presentationName?: string
  event?: {
    type?: string; name?: string; date?: string
    format?: string; durationMinutes?: number; qaMinutes?: number
    language?: string; location?: string; formalityLevel?: number
  }
  audience?: {
    segments?: Array<{ role: string; percentage: number; description: string }>
    emotionalBaseline?: string; size?: number
    primaryMotivation?: string; primaryFear?: string
    attentionMinutes?: number; familiarity?: string
  }
  objective?: {
    primary?: string; desiredAction?: string; successMetric?: string
    mustRemember?: string; mustFeel?: string
  }
  tone?: {
    primary?: string; narrativeArc?: string; hook?: string
    proof?: string; humorAllowed?: boolean
    arc?: { opening?: string; middle?: string; closing?: string }
  }
  constraints?: { avoidTopics?: string[]; mandatoryTopics?: string[] }
  riskFlags?: Array<{ title: string; mitigation: string; severity: string }>
}

interface Topic {
  label: string; selected: boolean; mandatory: boolean
  durationMinutes?: number; type?: string; score?: number
}

interface CurvePoint {
  slide: number; label: string; fullLabel?: string
  type: string; emotion: string; intensity: number
  suggestedTitle?: string; contentDirection?: string
  speakerNotes?: string; durationSeconds?: number
  designStyle?: string; visualMood?: string
}

interface StorytellingFramework {
  id: string; name: string; fitScore: number
  description?: string; emotionalArc?: string[]
}

interface Zone2Data {
  topics?: Topic[]
  frameworks?: StorytellingFramework[]
  selectedFrameworkId?: string | null
  curvePoints?: CurvePoint[]
  narrativeBrief?: string
  presentationTitle?: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function esc(s: string | undefined | null): string {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function paletteSwatches(swatches: ColorSwatch[]): string {
  return swatches.map((s) =>
    `<span title="${esc(s.name)} · ${esc(s.role)}" style="display:inline-block;width:28px;height:28px;background:${s.hex};border-radius:5px;margin-right:5px;vertical-align:middle;border:1px solid rgba(0,0,0,0.08);"></span>`
  ).join('')
}

function severityBadge(sev: string): string {
  const colors: Record<string, string> = { alta: '#E74C3C', media: '#F39C12', baja: '#27AE60' }
  return `<span style="display:inline-block;background:${colors[sev] ?? '#999'};color:#fff;font-size:9px;font-weight:700;border-radius:3px;padding:1px 6px;text-transform:uppercase;">${esc(sev)}</span>`
}

function typeColor(type: string): string {
  return type === 'peak' ? '#10B981' : type === 'valley' ? '#3B82F6' : '#9CA3AF'
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60
  return m > 0 ? `${m}m ${s > 0 ? s + 's' : ''}`.trim() : `${s}s`
}

// ─── Section header ────────────────────────────────────────────────────────────
function sectionHeader(num: string, title: string, accent: string): string {
  return `
  <div style="display:flex;align-items:center;gap:12px;margin:40px 0 20px;page-break-before:always;">
    <div style="width:36px;height:36px;border-radius:50%;background:${accent};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <span style="font-size:14px;font-weight:900;color:#fff;">${num}</span>
    </div>
    <h2 style="margin:0;font-size:20px;font-weight:800;color:#1A1A18;letter-spacing:-0.02em;">${esc(title)}</h2>
    <div style="flex:1;height:2px;background:${accent};opacity:0.25;border-radius:2px;"></div>
  </div>`
}

function card(content: string, bg = '#F9F8F5'): string {
  return `<div style="background:${bg};border-radius:10px;padding:16px 20px;margin-bottom:12px;">${content}</div>`
}

function label(text: string): string {
  return `<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9B9895;margin-bottom:4px;">${esc(text)}</div>`
}

function value(text: string, size = 13): string {
  return `<div style="font-size:${size}px;color:#1A1A18;line-height:1.5;">${esc(text)}</div>`
}

function grid2(...items: string[]): string {
  const filled = items.filter(Boolean)
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${filled.join('')}</div>`
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function generateZone3Pdf(
  state: Zone3State,
  title?: string,
  zone1ContextJson?: string,
  zone2DataJson?: string,
): void {
  let z1: Zone1Context = {}
  let z2: Zone2Data    = {}
  try { z1 = zone1ContextJson ? JSON.parse(zone1ContextJson) : {} } catch { /**/ }
  try { z2 = zone2DataJson    ? JSON.parse(zone2DataJson)    : {} } catch { /**/ }

  const presTitle = title ?? z1.presentationName ?? z2.presentationTitle ?? 'Presentación StoryVibe'
  const accentA   = '#D94B27'   // Act 1 — coral
  const accentB   = '#185FA5'   // Act 2 — blue
  const accentC   = state.palette?.swatches.find(s => s.role === 'accent')?.hex ?? '#10B981'  // Act 3
  const primaryC  = state.palette?.swatches.find(s => s.role === 'primary')?.hex ?? '#1A2F4E'

  const selectedFw = z2.frameworks?.find(f => f.id === z2.selectedFrameworkId)
  const slides     = Array.isArray(state.slides) ? state.slides : []
  const cp         = Array.isArray(z2.curvePoints) ? z2.curvePoints : []
  const topics     = (z2.topics ?? []).filter(t => t.selected)

  // ── Total duration ────────────────────────────────────────────────────────
  const totalMin   = z1.event?.durationMinutes ?? 0
  const totalSec   = totalMin * 60
  const cpWithTime = cp.filter(p => (p.durationSeconds ?? 0) > 0)
  const sumCpSec   = cpWithTime.reduce((a, p) => a + (p.durationSeconds ?? 0), 0)
  const autoSecPer = cp.length > 0 && totalSec > 0 ? Math.round(totalSec / cp.length) : 0

  // ─────────────────────────────────────────────────────────────────────────
  // ── 1. TABLE OF CONTENTS ─────────────────────────────────────────────────
  const tocItems = [
    ['1', 'Acto 1 — Diagnóstico', 'Evento, audiencia, objetivo y restricciones'],
    ['2', 'Acto 2 — Arquitectura narrativa', 'Tópicos, framework y curva emocional'],
    ['3', 'Acto 3 — Diseño visual', 'Paleta, layouts y assets por lámina'],
    ['4', 'Pitch completo con timing', 'Guión de presentación y duración recomendada'],
  ].map(([n, t, d]) => `
    <div style="display:flex;align-items:baseline;gap:8px;padding:10px 0;border-bottom:1px dashed #E5E2DA;">
      <span style="font-size:11px;font-weight:700;color:#9B9895;width:20px;flex-shrink:0;">${n}</span>
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:700;color:#1A1A18;">${t}</div>
        <div style="font-size:11px;color:#9B9895;margin-top:2px;">${d}</div>
      </div>
    </div>`).join('')

  // ─────────────────────────────────────────────────────────────────────────
  // ── 2. ACT 1 ─────────────────────────────────────────────────────────────
  const eventBlock = z1.event ? card(`
    ${label('Evento')}
    ${grid2(
      z1.event.name  ? `<div>${label('Nombre')    }${value(z1.event.name)}</div>`     : '',
      z1.event.type  ? `<div>${label('Tipo')      }${value(z1.event.type)}</div>`     : '',
      z1.event.date  ? `<div>${label('Fecha')     }${value(z1.event.date)}</div>`     : '',
      z1.event.format? `<div>${label('Formato')   }${value(z1.event.format)}</div>`   : '',
      z1.event.durationMinutes ? `<div>${label('Duración total')}${value(z1.event.durationMinutes + ' min')}</div>` : '',
      z1.event.qaMinutes       ? `<div>${label('Q&A')}${value(z1.event.qaMinutes + ' min')}</div>`                  : '',
      z1.event.location? `<div>${label('Lugar')   }${value(z1.event.location)}</div>` : '',
      z1.event.language? `<div>${label('Idioma')  }${value(z1.event.language)}</div>` : '',
    )}
  `) : ''

  const audienceBlock = z1.audience ? card(`
    ${label('Audiencia')}
    ${grid2(
      z1.audience.size             ? `<div>${label('Tamaño')}${value(String(z1.audience.size) + ' personas')}</div>` : '',
      z1.audience.familiarity      ? `<div>${label('Familiaridad')}${value(z1.audience.familiarity)}</div>` : '',
      z1.audience.emotionalBaseline? `<div>${label('Estado emocional base')}${value(z1.audience.emotionalBaseline)}</div>` : '',
      z1.audience.attentionMinutes ? `<div>${label('Atención estimada')}${value(z1.audience.attentionMinutes + ' min')}</div>` : '',
    )}
    ${z1.audience.primaryMotivation ? `<div style="margin-top:10px;">${label('Motivación principal')}${value(z1.audience.primaryMotivation)}</div>` : ''}
    ${z1.audience.primaryFear       ? `<div style="margin-top:8px;">${label('Mayor temor')}${value(z1.audience.primaryFear)}</div>` : ''}
    ${(z1.audience.segments ?? []).length > 0 ? `
      <div style="margin-top:12px;">${label('Segmentos')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
        ${(z1.audience.segments ?? []).map(seg => `
          <div style="background:#EEF2FF;border-radius:8px;padding:8px 12px;font-size:11px;">
            <strong>${esc(seg.role)}</strong> <span style="color:#6B7280;">${seg.percentage}%</span>
            ${seg.description ? `<div style="color:#6B7280;margin-top:2px;font-size:10px;">${esc(seg.description)}</div>` : ''}
          </div>`).join('')}
      </div>` : ''}
  `) : ''

  const objectiveBlock = z1.objective ? card(`
    ${label('Objetivo')}
    ${z1.objective.primary        ? `<div style="margin-bottom:10px;">${label('Objetivo principal')}${value(z1.objective.primary, 14)}</div>` : ''}
    ${grid2(
      z1.objective.desiredAction  ? `<div>${label('Acción deseada')}${value(z1.objective.desiredAction)}</div>`     : '',
      z1.objective.successMetric  ? `<div>${label('Métrica de éxito')}${value(z1.objective.successMetric)}</div>`   : '',
      z1.objective.mustRemember   ? `<div>${label('Deben recordar')}${value(z1.objective.mustRemember)}</div>`       : '',
      z1.objective.mustFeel       ? `<div>${label('Deben sentir')}${value(z1.objective.mustFeel)}</div>`             : '',
    )}
  `) : ''

  const toneBlock = z1.tone ? card(`
    ${label('Tono y arco narrativo')}
    ${grid2(
      z1.tone.primary       ? `<div>${label('Tono principal')}${value(z1.tone.primary)}</div>`         : '',
      z1.tone.narrativeArc  ? `<div>${label('Arco narrativo')}${value(z1.tone.narrativeArc)}</div>`    : '',
      z1.tone.hook          ? `<div>${label('Gancho de apertura')}${value(z1.tone.hook)}</div>`         : '',
      z1.tone.proof         ? `<div>${label('Tipo de prueba')}${value(z1.tone.proof)}</div>`            : '',
    )}
    ${z1.tone.arc ? `
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        ${z1.tone.arc.opening ? `<div style="background:#E8F5E9;border-radius:6px;padding:10px;">${label('Apertura')}${value(z1.tone.arc.opening, 11)}</div>` : ''}
        ${z1.tone.arc.middle  ? `<div style="background:#E3F2FD;border-radius:6px;padding:10px;">${label('Desarrollo')}${value(z1.tone.arc.middle, 11)}</div>` : ''}
        ${z1.tone.arc.closing ? `<div style="background:#FFF3E0;border-radius:6px;padding:10px;">${label('Cierre')}${value(z1.tone.arc.closing, 11)}</div>` : ''}
      </div>` : ''}
  `) : ''

  const constraintsBlock = z1.constraints ? card(`
    ${label('Restricciones')}
    ${(z1.constraints.mandatoryTopics ?? []).length > 0 ? `
      <div style="margin-bottom:8px;">${label('Temas obligatorios')}
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
          ${(z1.constraints.mandatoryTopics ?? []).map(t => `<span style="background:#E8F5E9;color:#1B5E20;font-size:10px;padding:2px 8px;border-radius:12px;">${esc(t)}</span>`).join('')}
        </div>
      </div>` : ''}
    ${(z1.constraints.avoidTopics ?? []).length > 0 ? `
      <div>${label('Temas a evitar')}
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
          ${(z1.constraints.avoidTopics ?? []).map(t => `<span style="background:#FFEBEE;color:#B71C1C;font-size:10px;padding:2px 8px;border-radius:12px;">${esc(t)}</span>`).join('')}
        </div>
      </div>` : ''}
  `) : ''

  const riskBlock = (z1.riskFlags ?? []).length > 0 ? card(`
    ${label('Alertas de riesgo')}
    ${(z1.riskFlags ?? []).map(r => `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #F1EFE8;">
        ${severityBadge(r.severity)}
        <div>
          <div style="font-size:12px;font-weight:600;color:#1A1A18;">${esc(r.title)}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:2px;">${esc(r.mitigation)}</div>
        </div>
      </div>`).join('')}
  `, '#FFF8F5') : ''

  // ─────────────────────────────────────────────────────────────────────────
  // ── 3. ACT 2 ─────────────────────────────────────────────────────────────
  const topicsBlock = topics.length > 0 ? card(`
    ${label('Tópicos seleccionados')}
    <div style="margin-top:8px;">
      ${topics.map((t, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1EFE8;">
          <span style="font-size:11px;font-weight:700;color:#9B9895;width:20px;flex-shrink:0;">${i + 1}</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;color:#1A1A18;">${esc(t.label)}</div>
            ${t.type ? `<div style="font-size:10px;color:#9B9895;margin-top:1px;">${esc(t.type)}</div>` : ''}
          </div>
          ${t.durationMinutes ? `<span style="font-size:10px;color:#6B7280;flex-shrink:0;">${t.durationMinutes} min</span>` : ''}
          ${t.mandatory ? `<span style="background:#FFF3E0;color:#E65100;font-size:9px;font-weight:700;border-radius:3px;padding:1px 5px;flex-shrink:0;">OBL</span>` : ''}
        </div>`).join('')}
    </div>
  `) : ''

  const frameworkBlock = selectedFw ? card(`
    ${label('Framework narrativo seleccionado')}
    <div style="margin-top:4px;">
      <div style="font-size:16px;font-weight:800;color:${accentB};margin-bottom:6px;">${esc(selectedFw.name)}</div>
      ${selectedFw.description ? `<div style="font-size:12px;color:#444441;line-height:1.6;margin-bottom:10px;">${esc(selectedFw.description)}</div>` : ''}
      ${(selectedFw.emotionalArc ?? []).length > 0 ? `
        <div>${label('Arco emocional')}
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:6px;">
            ${(selectedFw.emotionalArc ?? []).map((e, i, arr) => `
              <span style="background:#EEF2FF;color:#3730A3;font-size:10px;font-weight:600;border-radius:12px;padding:3px 10px;">${esc(e)}</span>
              ${i < arr.length - 1 ? '<span style="color:#D1D5DB;font-size:14px;">→</span>' : ''}
            `).join('')}
          </div>
        </div>` : ''}
    </div>
  `, '#F0F4FF') : ''

  const narrativeBlock = z2.narrativeBrief ? card(`
    ${label('Resumen narrativo')}
    <div style="font-size:13px;color:#1A1A18;line-height:1.7;margin-top:4px;font-style:italic;">"${esc(z2.narrativeBrief)}"</div>
  `) : ''

  // Curve points summary
  const curveBlock = cp.length > 0 ? `
    <div style="margin-top:16px;">${label('Curva emocional — resumen')}</div>
    <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
      ${cp.map(p => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:6px;background:#FAFAF8;border-left:3px solid ${typeColor(p.type)};">
          <span style="font-size:10px;font-weight:700;color:${typeColor(p.type)};width:60px;flex-shrink:0;">${esc(p.type.toUpperCase())}</span>
          <span style="font-size:11px;color:#1A1A18;flex:1;font-weight:600;">${esc(p.fullLabel ?? p.label)}</span>
          <span style="font-size:10px;color:#6B7280;">${esc(p.emotion)} · ${p.intensity}/10</span>
          ${p.durationSeconds ? `<span style="font-size:10px;color:#9B9895;flex-shrink:0;">${fmtDuration(p.durationSeconds)}</span>` : ''}
        </div>`).join('')}
    </div>` : ''

  // ─────────────────────────────────────────────────────────────────────────
  // ── 4. ACT 3 ─────────────────────────────────────────────────────────────
  const paletteBlock = state.palette ? card(`
    ${label('Paleta de colores')}
    <div style="margin:10px 0 8px;">${paletteSwatches(state.palette.swatches)}</div>
    ${state.palette.mood      ? `<div style="font-size:12px;font-style:italic;color:#6B7280;margin-bottom:6px;">"${esc(state.palette.mood)}"</div>` : ''}
    ${state.palette.rationale ? `<div style="font-size:12px;color:#444441;line-height:1.6;">${esc(state.palette.rationale)}</div>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
      ${state.palette.swatches.map(s => `
        <div style="text-align:center;">
          <div style="width:40px;height:40px;background:${s.hex};border-radius:6px;border:1px solid rgba(0,0,0,0.08);"></div>
          <div style="font-size:8px;color:#9B9895;margin-top:3px;font-family:monospace;">${s.hex}</div>
          <div style="font-size:8px;color:#9B9895;">${esc(s.role)}</div>
        </div>`).join('')}
    </div>
  `) : ''

  const slideBlocks = slides.map((sl, i) => {
    const point = cp.find(p => p.slide === sl.slide) ?? cp[i]
    const imageHtml = sl.generatedImage?.url
      ? `<img src="${esc(sl.generatedImage.url)}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-top:8px;" />`
      : sl.uploadedAsset?.dataUrl && sl.uploadedAsset.fileType === 'image'
        ? `<img src="${esc(sl.uploadedAsset.dataUrl)}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-top:8px;" />`
        : ''
    const tc = typeColor(sl.type ?? 'transition')

    return `
    <div style="break-inside:avoid;margin-bottom:16px;border:1.5px solid #E5E2DA;border-radius:10px;overflow:hidden;">
      <div style="background:${tc}18;border-left:4px solid ${tc};padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:13px;font-weight:800;color:${tc};">${sl.slide ?? i + 1}</span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#1A1A18;">${esc(sl.fullLabel ?? sl.label)}</div>
          <div style="font-size:10px;color:#6B7280;margin-top:2px;">${esc(sl.emotion)} · ${sl.intensity}/10 · ${esc((sl.type ?? '').toUpperCase())}${sl.approved ? ' · <span style="color:#10B981;font-weight:700;">✓ Aprobada</span>' : ''}</div>
        </div>
        ${sl.selectedLayout ? `<span style="font-size:9px;background:#F1EFE8;color:#6B7280;border-radius:4px;padding:2px 7px;flex-shrink:0;">${esc(sl.selectedLayout)}</span>` : ''}
      </div>
      <div style="padding:14px 16px;display:grid;grid-template-columns:${imageHtml ? '1fr 200px' : '1fr'};gap:14px;align-items:start;">
        <div>
          ${sl.graphicSuggestion ? `
            <div style="margin-bottom:8px;">
              ${label('Sugerencia visual')}
              <div style="font-size:12px;font-weight:600;color:#1A1A18;">${esc(sl.graphicSuggestion.title)}</div>
              <div style="font-size:11px;color:#6B7280;line-height:1.5;margin-top:2px;">${esc(sl.graphicSuggestion.description)}</div>
              ${sl.graphicSuggestion.why ? `<div style="font-size:10px;color:#9B9895;font-style:italic;margin-top:3px;">Rationale: ${esc(sl.graphicSuggestion.why)}</div>` : ''}
            </div>` : ''}
          ${point?.contentDirection ? `
            <div style="margin-bottom:8px;">${label('Dirección de contenido')}
              <div style="font-size:11px;color:#444441;line-height:1.5;">${esc(point.contentDirection)}</div>
            </div>` : ''}
          ${point?.speakerNotes ? `
            <div style="background:#FFFBF0;border-radius:6px;padding:10px;border-left:3px solid #F59E0B;">
              ${label('Notas del orador')}
              <div style="font-size:11px;color:#444441;line-height:1.6;white-space:pre-wrap;">${esc(point.speakerNotes)}</div>
            </div>` : ''}
        </div>
        ${imageHtml ? `<div>${imageHtml}</div>` : ''}
      </div>
    </div>`
  }).join('')

  // ─────────────────────────────────────────────────────────────────────────
  // ── 5. PITCH + TIMING ────────────────────────────────────────────────────
  const totalDisplaySec = sumCpSec || totalSec
  const pitchRows = cp.map((p, i) => {
    const sl = slides.find(s => s.slide === p.slide) ?? slides[i]
    const secForSlide = p.durationSeconds ?? autoSecPer
    const pct = totalDisplaySec > 0 ? Math.round((secForSlide / totalDisplaySec) * 100) : 0
    return `
    <tr style="border-bottom:1px solid #F1EFE8;">
      <td style="padding:10px 8px;font-size:11px;font-weight:700;color:${typeColor(p.type)};text-align:center;width:32px;">${p.slide}</td>
      <td style="padding:10px 8px;">
        <div style="font-size:12px;font-weight:700;color:#1A1A18;">${esc(p.fullLabel ?? p.label)}</div>
        ${p.contentDirection ? `<div style="font-size:10px;color:#6B7280;margin-top:2px;">${esc(p.contentDirection)}</div>` : ''}
      </td>
      <td style="padding:10px 8px;font-size:11px;color:#6B7280;text-align:center;width:80px;">${esc(p.emotion)}<br/><strong style="color:#1A1A18;">${p.intensity}/10</strong></td>
      <td style="padding:10px 8px;width:110px;">
        <div style="font-size:12px;font-weight:700;color:#1A1A18;text-align:center;">${secForSlide > 0 ? fmtDuration(secForSlide) : '—'}</div>
        ${pct > 0 ? `<div style="background:#E5E7EB;border-radius:4px;height:4px;margin-top:4px;"><div style="background:${typeColor(p.type)};width:${pct}%;height:4px;border-radius:4px;"></div></div>` : ''}
      </td>
      <td style="padding:10px 8px;font-size:10px;color:#6B7280;width:160px;">${esc(p.speakerNotes ?? '').slice(0, 120)}${(p.speakerNotes ?? '').length > 120 ? '…' : ''}</td>
    </tr>`
  }).join('')

  // ─────────────────────────────────────────────────────────────────────────
  // ── Full HTML ─────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(presTitle)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #FFF; color: #1A1A18;
      margin: 0; padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Wrapper carries the margins — unaffected by browser print margin settings */
    #report-body { padding: 18mm 20mm; max-width: 210mm; margin: 0 auto; }
    @page { size: A4; margin: 0; }
    @media print { .no-print { display:none!important; } }
    h1,h2,h3,p { margin: 0; }
    table { border-collapse: collapse; width: 100%; }
    td { vertical-align: top; }
  </style>
</head>
<body>
<div id="report-body">

<!-- ══ COVER ══════════════════════════════════════════════════════════════════ -->
<div style="min-height:220px;padding:48px 40px 36px;background:${primaryC};border-radius:0 0 16px 16px;margin-bottom:36px;">
  <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${accentC};margin-bottom:14px;">
    StoryVibe AI · Reporte de Presentación
  </div>
  <h1 style="font-size:32px;font-weight:900;color:#FFFFFF;line-height:1.2;margin-bottom:12px;">${esc(presTitle)}</h1>
  ${z1.event?.date ? `<div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:6px;">${esc(z1.event.date)}${z1.event.location ? ' · ' + z1.event.location : ''}</div>` : ''}
  ${z1.event?.durationMinutes ? `<div style="font-size:12px;color:rgba(255,255,255,0.6);">${z1.event.durationMinutes} min totales · ${slides.length} láminas${z1.event.qaMinutes ? ' · Q&A ' + z1.event.qaMinutes + ' min' : ''}</div>` : ''}
  ${state.palette ? `<div style="margin-top:20px;">${paletteSwatches(state.palette.swatches)}</div>` : ''}
</div>

<!-- ══ TABLE OF CONTENTS ══════════════════════════════════════════════════════ -->
<div style="padding:0;margin-bottom:32px;">
  <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9B9895;margin-bottom:12px;">Contenido del reporte</h2>
  ${tocItems}
</div>

<!-- ══ ACT 1 ══════════════════════════════════════════════════════════════════ -->
${sectionHeader('1', 'Acto 1 — Diagnóstico del contexto', accentA)}
${eventBlock}
${audienceBlock}
${objectiveBlock}
${toneBlock}
${constraintsBlock}
${riskBlock}

<!-- ══ ACT 2 ══════════════════════════════════════════════════════════════════ -->
${sectionHeader('2', 'Acto 2 — Arquitectura narrativa', accentB)}
${narrativeBlock}
${frameworkBlock}
${topicsBlock}
${curveBlock}

<!-- ══ ACT 3 ══════════════════════════════════════════════════════════════════ -->
${sectionHeader('3', 'Acto 3 — Diseño visual', accentC)}
${paletteBlock}
<div style="margin-top:20px;">${label('Láminas — assets y notas de diseño')}</div>
<div style="margin-top:12px;">${slideBlocks || '<p style="color:#9B9895;font-size:12px;">Sin láminas disponibles.</p>'}</div>

<!-- ══ PITCH + TIMING ══════════════════════════════════════════════════════════ -->
${sectionHeader('4', 'Pitch completo con timing', '#7C3AED')}
${(totalMin > 0 || sumCpSec > 0) ? card(`
  ${label('Tiempo total disponible')}
  <div style="font-size:22px;font-weight:900;color:#1A1A18;">
    ${totalMin > 0 ? totalMin + ' min' : fmtDuration(sumCpSec)}
    ${z1.event?.qaMinutes ? `<span style="font-size:13px;font-weight:400;color:#9B9895;margin-left:8px;">+ Q&A ${z1.event.qaMinutes} min</span>` : ''}
  </div>
`) : ''}

${cp.length > 0 ? `
<table style="margin-top:16px;font-size:11px;">
  <thead>
    <tr style="background:#F9F8F5;border-bottom:2px solid #E5E2DA;">
      <th style="padding:8px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#9B9895;width:32px;">#</th>
      <th style="padding:8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#9B9895;">Lámina</th>
      <th style="padding:8px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#9B9895;width:80px;">Emoción</th>
      <th style="padding:8px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#9B9895;width:110px;">Duración</th>
      <th style="padding:8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#9B9895;width:160px;">Notas del orador</th>
    </tr>
  </thead>
  <tbody>${pitchRows}</tbody>
</table>` : '<p style="color:#9B9895;font-size:12px;margin-top:12px;">Completa la curva emocional en Zona 2 para ver el pitch con timing.</p>'}

<!-- ══ FOOTER ══════════════════════════════════════════════════════════════════ -->
<div style="margin-top:56px;padding:16px 0;border-top:1.5px solid #E5E2DA;display:flex;justify-content:space-between;font-size:10px;color:#B8B4AA;">
  <span>StoryVibe AI</span>
  <span>${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
</div>

</div>
</body>
</html>`

  // ── Open in new tab → print as PDF ─────────────────────────────────────────
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  if (!win) {
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${(presTitle).replace(/[^a-zA-Z0-9_\- ]/g, '_')}_reporte.html`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    return
  }
  win.addEventListener('load', () => {
    setTimeout(() => {
      win.focus()
      win.print()
      win.addEventListener('afterprint', () => URL.revokeObjectURL(url))
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    }, 600)
  })
}
