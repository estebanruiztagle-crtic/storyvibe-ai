// Zone1Context (from zone1/types.ts)
interface Zone1Context {
  presentationName: string
  updatedAt: string
  completeness: number
  event: {
    type: string; name: string; date: string
    format: 'presencial' | 'virtual' | 'híbrido'
    durationMinutes: number; qaMinutes: number
    language: string; location: string; formalityLevel: number
  }
  audience: {
    segments: Array<{ role: string; percentage: number; description: string; color: string }>
    emotionalBaseline: string; size: number
    primaryMotivation: string; primaryFear: string
    attentionMinutes: number; familiarity: string
  }
  objective: {
    primary: string; desiredAction: string; successMetric: string
    mustRemember: string; mustFeel: string
  }
  tone: {
    primary: string; narrativeArc: string; hook: string; proof: string
    humorAllowed: boolean; arc: { opening: string; middle: string; closing: string }
  }
  constraints: { avoidTopics: string[]; mandatoryTopics: string[]; previousContext: string }
  riskFlags: Array<{ id: string; title: string; mitigation: string; severity: 'alta' | 'media' | 'baja'; detectedBy: string; date: string }>
}

// CurvePoint (Zone2)
interface CurvePoint {
  slide: number; label: string; fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string; intensity: number
}

// Zone3Slide
interface Zone3Slide {
  slide: number; label: string; fullLabel: string
  type: string; emotion: string; intensity: number
  graphicSuggestion?: { type: string; title: string; description: string; why: string }
  uploadedAsset?: { dataUrl: string; fileType: 'image' | 'video'; name?: string }
  useGraphic: boolean; approved: boolean
}

// Zone4SlideReview
interface Zone4SlideReview {
  slide: number; label: string; fullLabel: string
  type: 'peak' | 'valley' | 'transition'; emotion: string; intensity: number
  globalScore: number | null
  globalStatus: 'pass' | 'warning' | 'fail' | 'pending'
  axes: {
    brand: { score: number; status: string; checks: Array<{ pass: boolean; text: string }> }
    cognitive: { score: number; status: string; checks: Array<{ pass: boolean; text: string }> }
    emotional: { score: number; status: string; checks: Array<{ pass: boolean; text: string }> }
  } | null
  suggestions: Array<{
    id: string; axis: string; severity: 'high' | 'medium' | 'low'
    problem: string; fix: string; diffType: string; before: string; after: string; status: string
  }>
  evaluated: boolean
}

// StoryboardSlide (Zone5)
interface StoryboardSlide {
  slide: number; label: string; fullLabel: string
  type: 'peak' | 'valley' | 'transition'; emotion: string; intensity: number
  seconds: number; pacing: string
  assetStatus: string; designStatus: string; overallStatus: string
  pendingSuggestions: Array<{ severity: string; text: string; axis: string }>
  designScore: number | null
}

// PitchData — narrative pitch for the presenter
export interface PitchSection {
  slideRange: string
  title: string
  narrativeSummary: string
  durationSeconds: number
  durationPercent: number
  toneOfVoice: string
  suggestedActions: string[]
  keyQuestions: string[]
}

export interface PitchData {
  overallNarrative: string
  totalSeconds: number
  sections: PitchSection[]
}

export interface ReportData {
  zone1: Zone1Context | null
  curvePoints: CurvePoint[]
  zone3Slides: Zone3Slide[]
  zone4Slides: Zone4SlideReview[]
  storyboardSlides: StoryboardSlide[]
  totalAvailableSeconds: number
  estimatedTotalSeconds: number
  generatedAt: string
  pitchData?: PitchData
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function esc(s: unknown): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function dash(s: unknown): string {
  const v = s === null || s === undefined ? '' : String(s).trim()
  return v.length > 0 ? esc(v) : '—'
}

function formatDateEs(iso: string): string {
  if (!iso) return '—'
  try {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    const d = new Date(iso)
    if (isNaN(d.getTime())) return esc(iso)
    return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
  } catch {
    return esc(iso)
  }
}

function fmtSeconds(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  if (m === 0) return `${s}s`
  if (s === 0) return `${m} min`
  return `${m} min ${s}s`
}

function fmtMinutes(secs: number): string {
  const m = (secs / 60).toFixed(1)
  return `${m} min`
}

function statusColor(status: string): { fg: string; bg: string; label: string } {
  switch (status) {
    case 'pass':    return { fg: '#1a7a57', bg: '#e8f5ee', label: 'Aprobado' }
    case 'warning': return { fg: '#8a5a00', bg: '#fdf3dc', label: 'Advertencia' }
    case 'fail':    return { fg: '#8a2020', bg: '#fceaea', label: 'Rechazado' }
    default:        return { fg: '#5a5a5a', bg: '#eeeeec', label: 'Pendiente' }
  }
}

function typeColor(type: string): string {
  switch (type) {
    case 'peak':       return '#1D9E75'
    case 'valley':     return '#378ADD'
    case 'transition': return '#EF9F27'
    default:           return '#888888'
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'peak':       return 'Pico'
    case 'valley':     return 'Valle'
    case 'transition': return 'Transición'
    default:           return esc(type)
  }
}

function severityColor(severity: string): { fg: string; bg: string } {
  switch (severity) {
    case 'high':   return { fg: '#8a2020', bg: '#fceaea' }
    case 'medium': return { fg: '#8a5a00', bg: '#fdf3dc' }
    default:       return { fg: '#1a7a57', bg: '#e8f5ee' }
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'high':   return 'Alta'
    case 'medium': return 'Media'
    default:       return 'Baja'
  }
}

function badge(text: string, fg: string, bg: string): string {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:8pt;font-weight:700;color:${fg};background:${bg};border:1px solid ${fg}33;">${esc(text)}</span>`
}

function sectionHeading(text: string, id?: string): string {
  const idAttr = id ? ` id="${esc(id)}"` : ''
  return `<h2${idAttr} style="font-size:16pt;font-weight:700;color:#1a2e27;border-left:4px solid #2d4a3e;padding-left:12px;margin:0 0 18px 0;">${esc(text)}</h2>`
}

function subHeading(text: string): string {
  return `<h3 style="font-size:12pt;font-weight:700;color:#2d4a3e;margin:18px 0 8px 0;border-bottom:1px solid #ddd;padding-bottom:4px;">${esc(text)}</h3>`
}

function infoBox(content: string, bg = '#f7f7f5'): string {
  return `<div style="background:${bg};border:1px solid #ddd;border-radius:4px;padding:14px 18px;margin-bottom:14px;">${content}</div>`
}

function tableStart(headers: string[]): string {
  const ths = headers.map(h => `<th>${esc(h)}</th>`).join('')
  return `<table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;"><thead><tr>${ths}</tr></thead><tbody>`
}

function tableEnd(): string {
  return `</tbody></table>`
}

const TABLE_STYLE = `
  table { border-collapse: collapse; width: 100%; font-size: 9pt; }
  th { background: #2d4a3e; color: #fff; padding: 6px 8px; text-align: left; font-weight: 700; }
  td { padding: 5px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  tr:nth-child(even) td { background: #f7f7f5; }
`

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildStyles(): string {
  return `
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: system-ui, Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.5;
  }
  ${TABLE_STYLE}
  h1 { margin: 0; }
  h2 { margin: 0 0 16px 0; }
  h3 { margin: 16px 0 8px 0; }
  p  { margin: 6px 0; }
  ul { margin: 6px 0; padding-left: 20px; }
  li { margin: 3px 0; }
  .page {
    width: 100%;
    max-width: 21cm;
    margin: 0 auto;
    padding: 2cm;
  }
  .page-break { page-break-before: always; }
  .cover-page {
    min-height: 27cm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 3cm 2cm;
  }
  .stat-pill {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 20px;
    background: #e8f5ee;
    color: #1a7a57;
    font-weight: 700;
    font-size: 11pt;
    margin: 4px 6px 4px 0;
    border: 1px solid #1a7a5733;
  }
  .disclaimer {
    margin-top: 32px;
    padding: 16px 20px;
    background: #f7f7f5;
    border-left: 4px solid #2d4a3e;
    border-radius: 0 4px 4px 0;
    font-size: 9pt;
    color: #555;
    max-width: 480px;
  }
  .toc-list { list-style: none; padding: 0; margin: 0; }
  .toc-list li {
    padding: 7px 0;
    border-bottom: 1px solid #eee;
    font-size: 11pt;
  }
  .toc-list li .toc-num {
    display: inline-block;
    width: 28px;
    font-weight: 700;
    color: #2d4a3e;
  }
  .toc-sub {
    margin-left: 28px;
    font-size: 9.5pt;
    color: #666;
    padding: 3px 0;
    border-bottom: 1px dotted #eee;
  }
  .slide-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid #2d4a3e;
  }
  .slide-num {
    font-size: 20pt;
    font-weight: 800;
    color: #2d4a3e;
    min-width: 44px;
  }
  .block-label {
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #2d4a3e;
    margin-bottom: 8px;
  }
  .check-pass { color: #1a7a57; font-weight: 700; }
  .check-fail { color: #8a2020; font-weight: 700; }
  .ascii-bar { font-family: monospace; font-size: 9pt; letter-spacing: -1px; }
  .axis-row td { font-size: 9pt; }
  @media print {
    html, body { font-size: 10pt; }
    .page { padding: 0; max-width: 100%; }
    .page-break { page-break-before: always; }
    .no-print { display: none !important; }
    a { color: inherit; text-decoration: none; }
    table { page-break-inside: avoid; }
    .slide-block { page-break-inside: avoid; }
  }
  @page {
    size: A4;
    margin: 2cm;
  }
</style>`
}

// ---------------------------------------------------------------------------
// COVER PAGE
// ---------------------------------------------------------------------------

function buildCover(data: ReportData): string {
  const title = data.zone1?.presentationName || 'Storyboard de Presentación'
  const dateStr = formatDateEs(data.generatedAt)
  const totalSlides = data.storyboardSlides.length
  const estMin = fmtMinutes(data.estimatedTotalSeconds)
  const availMin = fmtMinutes(data.totalAvailableSeconds)

  return `
<div class="page cover-page">
  <div style="font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#2d4a3e;margin-bottom:24px;">
    StoryVibe AI
  </div>
  <h1 style="font-size:24pt;font-weight:800;color:#1a2e27;line-height:1.2;margin-bottom:10px;">${esc(title)}</h1>
  <p style="font-size:14pt;color:#555;margin:0 0 32px 0;font-weight:400;">Guía de Diseño y Ajustes para Canva</p>

  <div style="margin-bottom:28px;">
    <span class="stat-pill">${esc(String(totalSlides))} slides</span>
    <span class="stat-pill">${esc(estMin)} estimados</span>
    <span class="stat-pill">${esc(availMin)} disponibles</span>
  </div>

  <p style="font-size:10pt;color:#888;margin:0 0 4px 0;">Generado el ${esc(dateStr)}</p>

  <div class="disclaimer">
    Este documento es una guía de referencia para realizar ajustes manuales en Canva.
    Contiene el análisis generado por StoryVibe AI sobre estructura emocional, diseño y calidad del contenido.
  </div>
</div>`
}

// ---------------------------------------------------------------------------
// TABLE OF CONTENTS
// ---------------------------------------------------------------------------

function buildTOC(data: ReportData): string {
  const slides = data.storyboardSlides
  const slideItems = slides.map((s, i) =>
    `<li class="toc-sub">${esc(String(i + 1))}. Slide ${esc(String(s.slide))} — ${esc(s.label)}</li>`
  ).join('')

  return `
<div class="page page-break">
  ${sectionHeading('Índice')}
  <ul class="toc-list">
    <li><span class="toc-num">1.</span> Pitch Narrativo — Cómo contar la historia</li>
    <li><span class="toc-num">2.</span> Storyboard — Resumen</li>
    <li><span class="toc-num">3.</span> Detalle por Slide
      <ul class="toc-list" style="margin-top:6px;">${slideItems}</ul>
    </li>
    <li><span class="toc-num">A.</span> Anexo A — Análisis de Contexto (Zona 1)</li>
    <li><span class="toc-num">B.</span> Anexo B — Curva Emocional (Zona 2)</li>
    <li><span class="toc-num">C.</span> Anexo C — Assets y Gráficos (Zona 3)</li>
    <li><span class="toc-num">D.</span> Anexo D — Evaluación de Diseño (Zona 4)</li>
  </ul>
</div>`
}

// ---------------------------------------------------------------------------
// SECTION 1 — PITCH NARRATIVO
// ---------------------------------------------------------------------------

function buildPitch(data: ReportData): string {
  const pitch = data.pitchData

  if (!pitch) {
    return `
<div class="page page-break">
  ${sectionHeading('Sección 1 — Pitch Narrativo: Cómo Contar la Historia')}
  <p style="color:#888;font-style:italic;">El pitch narrativo no está disponible. Genera el reporte desde el panel de Storyboard para incluir esta sección.</p>
</div>`
  }

  const totalMin = fmtMinutes(pitch.totalSeconds)

  // Determine bar color per section index
  const sectionColors = ['#2d4a3e', '#1a6b4a', '#0f8a5c', '#07a870', '#05c07a']

  const sectionsHtml = pitch.sections.map((sec, idx) => {
    const color = sectionColors[idx % sectionColors.length]!
    const pct = Math.min(100, Math.max(0, sec.durationPercent))

    const actionsHtml = sec.suggestedActions.length > 0
      ? `<ul style="margin:0 0 0 0;padding-left:18px;">
          ${sec.suggestedActions.map(a => `<li style="margin:3px 0;font-size:9pt;">${esc(a)}</li>`).join('')}
        </ul>`
      : '<p style="margin:0;font-size:9pt;color:#888;font-style:italic;">—</p>'

    const questionsHtml = sec.keyQuestions.length > 0
      ? `<ul style="margin:0;padding-left:18px;">
          ${sec.keyQuestions.map(q => `<li style="margin:3px 0;font-size:9pt;font-style:italic;">&ldquo;${esc(q)}&rdquo;</li>`).join('')}
        </ul>`
      : '<p style="margin:0;font-size:9pt;color:#888;font-style:italic;">—</p>'

    return `
    <div style="border:1px solid ${color}33;border-left:5px solid ${color};border-radius:0 6px 6px 0;padding:16px 18px;margin-bottom:16px;background:#fff;">

      <!-- Section header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">
        <div>
          <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${color};margin-bottom:3px;">
            ${esc(sec.slideRange)}
          </div>
          <div style="font-size:13pt;font-weight:700;color:#1a2e27;line-height:1.2;">
            ${esc(sec.title)}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:16pt;font-weight:800;color:${color};">${esc(String(sec.durationPercent))}%</div>
          <div style="font-size:8pt;color:#888;">${esc(fmtSeconds(sec.durationSeconds))}</div>
        </div>
      </div>

      <!-- Time bar -->
      <div style="background:#eee;border-radius:3px;height:6px;margin-bottom:12px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
      </div>

      <!-- Narrative summary -->
      <p style="margin:0 0 12px 0;font-size:9.5pt;color:#333;line-height:1.55;">${esc(sec.narrativeSummary)}</p>

      <!-- Three-column grid: tone / actions / questions -->
      <table style="width:100%;border-collapse:collapse;font-size:9pt;">
        <thead>
          <tr>
            <th style="width:33%;background:${color}11;padding:6px 10px;text-align:left;font-size:8pt;text-transform:uppercase;letter-spacing:0.08em;color:${color};border-bottom:2px solid ${color}33;">Tono de voz</th>
            <th style="width:33%;background:${color}11;padding:6px 10px;text-align:left;font-size:8pt;text-transform:uppercase;letter-spacing:0.08em;color:${color};border-bottom:2px solid ${color}33;border-left:1px solid ${color}22;">Acciones sugeridas</th>
            <th style="width:34%;background:${color}11;padding:6px 10px;text-align:left;font-size:8pt;text-transform:uppercase;letter-spacing:0.08em;color:${color};border-bottom:2px solid ${color}33;border-left:1px solid ${color}22;">Preguntas clave</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px;vertical-align:top;font-size:9pt;color:#333;line-height:1.5;">${esc(sec.toneOfVoice)}</td>
            <td style="padding:10px;vertical-align:top;border-left:1px solid ${color}22;">${actionsHtml}</td>
            <td style="padding:10px;vertical-align:top;border-left:1px solid ${color}22;">${questionsHtml}</td>
          </tr>
        </tbody>
      </table>
    </div>`
  }).join('')

  // Timeline bar showing proportional sections
  const timelineHtml = pitch.sections.map((sec, idx) => {
    const color = sectionColors[idx % sectionColors.length]!
    const pct = Math.min(100, Math.max(0, sec.durationPercent))
    return `<div title="${esc(sec.title)} · ${esc(fmtSeconds(sec.durationSeconds))}" style="flex:0 0 ${pct}%;background:${color};height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:7pt;color:#fff;font-weight:700;letter-spacing:0.04em;">
      ${pct > 8 ? `${pct}%` : ''}
    </div>`
  }).join('')

  return `
<div class="page page-break">
  ${sectionHeading('Sección 1 — Pitch Narrativo: Cómo Contar la Historia')}

  <!-- Overall narrative -->
  <div style="background:#f0f5f2;border:1px solid #2d4a3e33;border-radius:6px;padding:18px 20px;margin-bottom:22px;">
    <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#2d4a3e;margin-bottom:8px;">El arco completo · ${esc(totalMin)}</div>
    <p style="margin:0;font-size:10.5pt;color:#1a2e27;line-height:1.65;font-style:italic;">&ldquo;${esc(pitch.overallNarrative)}&rdquo;</p>
  </div>

  <!-- Proportional timeline -->
  <div style="margin-bottom:22px;">
    <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#555;margin-bottom:8px;">Distribución del tiempo</div>
    <div style="display:flex;width:100%;height:28px;border-radius:4px;overflow:hidden;border:1px solid #ddd;">
      ${timelineHtml}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
      ${pitch.sections.map((sec, idx) => {
        const color = sectionColors[idx % sectionColors.length]!
        return `<div style="display:flex;align-items:center;gap:5px;">
          <div style="width:10px;height:10px;border-radius:2px;background:${color};flex-shrink:0;"></div>
          <span style="font-size:8pt;color:#555;">${esc(sec.title.split('—')[0]?.trim() ?? sec.title)}</span>
        </div>`
      }).join('')}
    </div>
  </div>

  <!-- Section cards -->
  ${sectionsHtml}
</div>`
}

// ---------------------------------------------------------------------------
// SECTION 2 — STORYBOARD RESUMEN
// ---------------------------------------------------------------------------

function buildSection1(data: ReportData): string {
  const slides = data.storyboardSlides

  const rows = slides.map(s => {
    const sc = statusColor(s.overallStatus)
    const tc = typeColor(s.type)
    const score = s.designScore !== null ? `${s.designScore}` : '—'
    return `<tr>
      <td style="font-weight:700;color:#2d4a3e;">${esc(String(s.slide))}</td>
      <td>${esc(s.label)}</td>
      <td><span style="color:${tc};font-weight:700;">${esc(typeLabel(s.type))}</span></td>
      <td>${esc(s.emotion)}</td>
      <td style="text-align:center;">${esc(String(s.intensity))}/10</td>
      <td>${esc(fmtSeconds(s.seconds))}</td>
      <td style="text-align:center;">${esc(score)}</td>
      <td>${badge(sc.label, sc.fg, sc.bg)}</td>
    </tr>`
  }).join('')

  const totalRow = `<tr style="font-weight:700;background:#f0f4f2;">
    <td colspan="5" style="text-align:right;padding-right:12px;">Total</td>
    <td>${esc(fmtSeconds(data.estimatedTotalSeconds))}</td>
    <td colspan="2" style="color:#888;font-size:8pt;">Disponible: ${esc(fmtSeconds(data.totalAvailableSeconds))}</td>
  </tr>`

  return `
<div class="page page-break">
  ${sectionHeading('Sección 2 — Storyboard: Resumen')}
  <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;">
    <thead>
      <tr>
        <th>#</th><th>Slide</th><th>Tipo</th><th>Emoción</th>
        <th>Intens.</th><th>Tiempo</th><th>Score Diseño</th><th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${totalRow}
    </tbody>
  </table>
</div>`
}

// ---------------------------------------------------------------------------
// SECTION 2 — DETALLE POR SLIDE
// ---------------------------------------------------------------------------

function buildSlideDetail(
  s: StoryboardSlide,
  index: number,
  allStoryboard: StoryboardSlide[],
  zone4Slides: Zone4SlideReview[],
  zone3Slides: Zone3Slide[]
): string {
  const sc = statusColor(s.overallStatus)
  const tc = typeColor(s.type)
  const z4 = zone4Slides.find(z => z.slide === s.slide) || null
  const z3 = zone3Slides.find(z => z.slide === s.slide) || null

  // Narrative type description
  let tipoNarrativo = ''
  switch (s.type) {
    case 'peak':       tipoNarrativo = 'Momento de máximo impacto'; break
    case 'valley':     tipoNarrativo = 'Momento íntimo o reflexivo'; break
    case 'transition': tipoNarrativo = 'Slide de transición'; break
    default:           tipoNarrativo = esc(s.type)
  }

  // Suggested phrases based on type
  const prevSlide = index > 0 ? allStoryboard[index - 1] : null
  const nextSlide = index < allStoryboard.length - 1 ? allStoryboard[index + 1] : null
  let fraseSugerida = ''
  switch (s.type) {
    case 'peak':
      fraseSugerida = `Usa una frase corta y poderosa. Máx. 15 palabras.<br>
        <em>Ej: &ldquo;${esc(s.fullLabel)} &mdash; el momento clave que cambia todo.&rdquo;</em>`
      break
    case 'valley':
      fraseSugerida = `Usa datos o preguntas reflexivas.<br>
        <em>Ej: &ldquo;¿Qué pasaría si ${esc(s.emotion)}?&rdquo;</em>`
      break
    case 'transition':
      {
        const fromEmotion = prevSlide ? esc(prevSlide.emotion) : 'el momento anterior'
        const toEmotion   = nextSlide ? esc(nextSlide.emotion) : 'el siguiente'
        fraseSugerida = `Conecta el momento anterior con el siguiente.<br>
          <em>Ej: &ldquo;Pasando de ${fromEmotion} a ${toEmotion}...&rdquo;</em>`
      }
      break
    default:
      fraseSugerida = `Adapta el mensaje al contexto emocional: <em>${esc(s.emotion)}</em>.`
  }

  // Max words guidance (peak = 15, valley = 20, transition = 25)
  const maxWords = s.type === 'peak' ? 15 : s.type === 'valley' ? 20 : 25

  // Bloque 1 — Contenido
  const bloque1 = infoBox(`
    <div class="block-label">Bloque 1 — Contenido del Slide</div>
    <p style="font-size:13pt;font-weight:700;margin:0 0 8px 0;">${esc(s.fullLabel)}</p>
    <p><strong>Subtítulo / Emoción:</strong> ${esc(s.emotion)} a intensidad <strong>${esc(String(s.intensity))}/10</strong></p>
    <p><strong>Tiempo asignado:</strong> ${esc(fmtSeconds(s.seconds))} &nbsp;|&nbsp; <strong>Ritmo:</strong> ${esc(s.pacing)}</p>
    <p><strong>Tipo narrativo:</strong> ${esc(tipoNarrativo)}</p>
  `, '#f7f7f5')

  // Frases sugeridas
  const frasesBlock = `
    <div style="background:#eef6ff;border:1px solid #b8d4f0;border-radius:4px;padding:12px 16px;margin-bottom:14px;">
      <div class="block-label" style="color:#1a4a7a;">Frases sugeridas para este slide</div>
      <p style="margin:0;">${fraseSugerida}</p>
    </div>`

  // Preguntas de diseño
  let preguntasItems = [
    `¿El fondo visual refuerza la emoción &ldquo;<em>${esc(s.emotion)}</em>&rdquo;?`,
    `¿El texto tiene menos de <strong>${esc(String(maxWords))}</strong> palabras?`,
    `¿La jerarquía visual está clara (máx. 3 niveles)?`,
  ]
  if (s.type === 'peak') {
    preguntasItems.push(`¿La imagen o elemento central es de alto impacto visual?`)
  }
  const preguntasBlock = `
    <div style="background:#fffbf0;border:1px solid #e8d8a0;border-radius:4px;padding:12px 16px;margin-bottom:14px;">
      <div class="block-label" style="color:#6a4800;">Preguntas de diseño para Canva</div>
      <ul style="margin:0;padding-left:18px;">
        ${preguntasItems.map(q => `<li style="margin:4px 0;">${q}</li>`).join('')}
      </ul>
    </div>`

  // Bloque 2 — Sugerencias
  let bloque2 = ''
  const suggestions = z4?.suggestions || s.pendingSuggestions.map((ps, i) => ({
    id: `ps-${i}`,
    axis: ps.axis,
    severity: ps.severity as 'high' | 'medium' | 'low',
    problem: ps.text,
    fix: '',
    diffType: '',
    before: '',
    after: '',
    status: 'pending'
  }))

  if (suggestions && suggestions.length > 0) {
    const suggRows = suggestions.map(sg => {
      const svc = severityColor(sg.severity)
      const svl = severityLabel(sg.severity)
      return `
      <div style="border:1px solid ${svc.fg}44;border-left:4px solid ${svc.fg};border-radius:0 4px 4px 0;padding:10px 14px;margin-bottom:10px;background:${svc.bg};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          ${badge(`Severidad: ${svl}`, svc.fg, svc.bg)}
          <span style="font-size:9pt;color:#555;font-style:italic;">Eje: ${esc(sg.axis)}</span>
        </div>
        <p style="margin:4px 0;"><strong>Problema:</strong> ${esc(sg.problem) || '—'}</p>
        ${sg.fix    ? `<p style="margin:4px 0;"><strong>Fix:</strong> ${esc(sg.fix)}</p>` : ''}
        ${sg.before ? `<p style="margin:4px 0;font-size:9pt;"><strong>Antes:</strong> <code style="background:#fff;padding:1px 4px;border-radius:2px;">${esc(sg.before)}</code></p>` : ''}
        ${sg.after  ? `<p style="margin:4px 0;font-size:9pt;"><strong>Después:</strong> <code style="background:#fff;padding:1px 4px;border-radius:2px;">${esc(sg.after)}</code></p>` : ''}
      </div>`
    }).join('')

    bloque2 = `
      <div style="margin-bottom:14px;">
        <div class="block-label">Bloque 2 — Sugerencias de Diseño IA</div>
        ${suggRows}
      </div>`
  } else {
    bloque2 = infoBox(
      `<div class="block-label">Bloque 2 — Sugerencias de Diseño IA</div>
       <p style="margin:0;color:#1a7a57;">&#10003; Este slide no tiene observaciones de diseño pendientes.</p>`,
      '#e8f5ee'
    )
  }

  // Bloque 3 — Evaluación por ejes
  let bloque3 = ''
  if (z4?.axes) {
    const axes = z4.axes
    const axisRows = [
      { label: 'Brand Compliance (40%)', data: axes.brand },
      { label: 'Carga Cognitiva (35%)',  data: axes.cognitive },
      { label: 'Alineación Emocional (25%)', data: axes.emotional },
    ].map(ax => {
      const sc2 = statusColor(ax.data.status)
      const checksHtml = ax.data.checks.map(c =>
        `<span class="${c.pass ? 'check-pass' : 'check-fail'}">${c.pass ? '✓' : '✗'}</span> ${esc(c.text)}`
      ).join('<br>')
      return `<tr class="axis-row">
        <td>${esc(ax.label)}</td>
        <td style="text-align:center;font-weight:700;">${esc(String(ax.data.score))}</td>
        <td>${badge(esc(ax.data.status), sc2.fg, sc2.bg)}</td>
        <td style="font-size:8pt;line-height:1.6;">${checksHtml}</td>
      </tr>`
    }).join('')

    bloque3 = `
      <div style="margin-bottom:14px;">
        <div class="block-label">Bloque 3 — Evaluación por Ejes</div>
        <table style="width:100%;border-collapse:collapse;font-size:9pt;">
          <thead><tr>
            <th>Eje</th><th>Score</th><th>Estado</th><th>Checks</th>
          </tr></thead>
          <tbody>${axisRows}</tbody>
        </table>
      </div>`
  }

  // Bloque 4 — Asset
  let bloque4 = ''
  if (z3?.uploadedAsset) {
    const asset = z3.uploadedAsset
    const name = asset.name || `Asset slide ${s.slide}`
    bloque4 = `
      <div style="margin-bottom:14px;">
        <div class="block-label">Bloque 4 — Asset</div>
        <div style="display:flex;align-items:flex-start;gap:14px;padding:10px;background:#f7f7f5;border:1px solid #ddd;border-radius:4px;">
          ${asset.fileType === 'image'
            ? `<img src="${esc(asset.dataUrl)}" alt="${esc(name)}" style="max-width:200px;max-height:150px;border-radius:3px;border:1px solid #ddd;" />`
            : `<div style="width:200px;height:100px;background:#222;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9pt;">[Video: ${esc(name)}]</div>`
          }
          <div>
            <p style="margin:0;font-weight:700;">${esc(name)}</p>
            <p style="margin:4px 0 0 0;font-size:9pt;color:#555;">Tipo: ${esc(asset.fileType)}</p>
          </div>
        </div>
      </div>`
  }

  return `
<div class="page page-break slide-block">
  <div class="slide-header">
    <span class="slide-num">${esc(String(s.slide))}</span>
    <span style="font-size:14pt;font-weight:700;color:#1a2e27;flex:1;">${esc(s.label)}</span>
    <span style="margin-right:8px;">${badge(typeLabel(s.type), '#fff', tc)}</span>
    ${badge(sc.label, sc.fg, sc.bg)}
  </div>

  ${bloque1}
  ${frasesBlock}
  ${preguntasBlock}
  ${bloque2}
  ${bloque3}
  ${bloque4}
</div>`
}

function buildSection2(data: ReportData): string {
  return data.storyboardSlides.map((s, i) =>
    buildSlideDetail(s, i, data.storyboardSlides, data.zone4Slides, data.zone3Slides)
  ).join('\n')
}

// ---------------------------------------------------------------------------
// ANEXO A — ANÁLISIS DE CONTEXTO (ZONA 1)
// ---------------------------------------------------------------------------

function buildAnexoA(zone1: Zone1Context | null): string {
  if (!zone1) {
    return `
<div class="page page-break">
  ${sectionHeading('Anexo A — Análisis de Contexto (Zona 1)')}
  <p style="color:#888;font-style:italic;">Sin información de contexto disponible.</p>
</div>`
  }

  const ev = zone1.event
  const au = zone1.audience
  const ob = zone1.objective
  const to = zone1.tone
  const co = zone1.constraints

  // Evento
  const eventoBlock = `
    ${subHeading('Evento')}
    <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;">
      <tbody>
        <tr><td style="width:180px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Nombre</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ev?.name)}</td></tr>
        <tr><td style="width:180px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Tipo</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ev?.type)}</td></tr>
        <tr><td style="width:180px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Fecha</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ev?.date)}</td></tr>
        <tr><td style="width:180px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Formato</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ev?.format)}</td></tr>
        <tr><td style="width:180px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Duración</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${ev?.durationMinutes != null ? `${esc(String(ev.durationMinutes))} min (Q&A: ${esc(String(ev.qaMinutes))} min)` : '—'}</td></tr>
        <tr><td style="width:180px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Idioma</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ev?.language)}</td></tr>
        <tr><td style="width:180px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Nivel de formalidad</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${ev?.formalityLevel != null ? `${esc(String(ev.formalityLevel))}/10` : '—'}</td></tr>
      </tbody>
    </table>`

  // Audiencia - segmentos
  const segRows = (au?.segments || []).map(sg =>
    `<tr>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${esc(sg.color)};margin-right:6px;vertical-align:middle;"></span>
        ${esc(sg.role)}
      </td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${esc(String(sg.percentage))}%</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${esc(sg.description)}</td>
    </tr>`
  ).join('')

  const audienciaBlock = `
    ${subHeading('Audiencia')}
    <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:12px;">
      <tbody>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Tamaño</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(au?.size)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Baseline emocional</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(au?.emotionalBaseline)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Motivación principal</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(au?.primaryMotivation)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Temor principal</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(au?.primaryFear)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Minutos de atención</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(au?.attentionMinutes)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Familiaridad con el tema</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(au?.familiarity)}</td></tr>
      </tbody>
    </table>
    ${(au?.segments || []).length > 0 ? `
      <p style="font-weight:700;font-size:9.5pt;margin:10px 0 6px 0;">Segmentos de audiencia:</p>
      <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;">
        <thead><tr><th>Rol</th><th>%</th><th>Descripción</th></tr></thead>
        <tbody>${segRows}</tbody>
      </table>` : ''}`

  // Objetivo
  const objetivoBlock = `
    ${subHeading('Objetivo')}
    <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;">
      <tbody>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Objetivo principal</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ob?.primary)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Acción deseada</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ob?.desiredAction)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Métrica de éxito</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ob?.successMetric)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Qué deben recordar</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ob?.mustRemember)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Cómo deben sentirse</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(ob?.mustFeel)}</td></tr>
      </tbody>
    </table>`

  // Tono y Arco Narrativo
  const tonoBlock = `
    ${subHeading('Tono y Arco Narrativo')}
    <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;">
      <tbody>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Tono primario</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(to?.primary)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Arco narrativo</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(to?.narrativeArc)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Hook / Gancho</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(to?.hook)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Prueba / Evidencia</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(to?.proof)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Humor permitido</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${to?.humorAllowed ? 'Sí' : 'No'}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Apertura</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(to?.arc?.opening)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Desarrollo</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(to?.arc?.middle)}</td></tr>
        <tr><td style="width:220px;font-weight:700;color:#555;border-bottom:1px solid #eee;padding:5px 8px;">Cierre</td><td style="border-bottom:1px solid #eee;padding:5px 8px;">${dash(to?.arc?.closing)}</td></tr>
      </tbody>
    </table>`

  // Restricciones
  const avoid = (co?.avoidTopics || [])
  const mandatory = (co?.mandatoryTopics || [])
  const restriccionesBlock = `
    ${subHeading('Restricciones')}
    <p><strong>Temas a evitar:</strong></p>
    ${avoid.length > 0
      ? `<ul>${avoid.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`
      : `<p style="color:#888;font-style:italic;">Ninguno especificado.</p>`}
    <p><strong>Temas obligatorios:</strong></p>
    ${mandatory.length > 0
      ? `<ul>${mandatory.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`
      : `<p style="color:#888;font-style:italic;">Ninguno especificado.</p>`}`

  // Señales de riesgo
  const risks = zone1.riskFlags || []
  const riskRows = risks.map(r => {
    const sevColors: Record<string, { fg: string; bg: string }> = {
      alta:  { fg: '#8a2020', bg: '#fceaea' },
      media: { fg: '#8a5a00', bg: '#fdf3dc' },
      baja:  { fg: '#1a7a57', bg: '#e8f5ee' },
    }
    const rc = riskColors(r.severity)
    return `<tr>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${esc(r.title)}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${badge(esc(r.severity), rc.fg, rc.bg)}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${esc(r.mitigation)}</td>
    </tr>`
  }).join('')

  const riesgosBlock = `
    ${subHeading('Señales de Riesgo')}
    ${risks.length > 0
      ? `<table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;">
          <thead><tr><th>Riesgo</th><th>Severidad</th><th>Mitigación</th></tr></thead>
          <tbody>${riskRows}</tbody>
        </table>`
      : `<p style="color:#888;font-style:italic;">Sin señales de riesgo detectadas.</p>`}`

  return `
<div class="page page-break">
  ${sectionHeading('Anexo A — Análisis de Contexto (Zona 1)')}
  ${eventoBlock}
  ${audienciaBlock}
  ${objetivoBlock}
  ${tonoBlock}
  ${restriccionesBlock}
  ${riesgosBlock}
</div>`
}

function riskColors(severity: string): { fg: string; bg: string } {
  switch (severity) {
    case 'alta':  return { fg: '#8a2020', bg: '#fceaea' }
    case 'media': return { fg: '#8a5a00', bg: '#fdf3dc' }
    default:      return { fg: '#1a7a57', bg: '#e8f5ee' }
  }
}

// ---------------------------------------------------------------------------
// ANEXO B — CURVA EMOCIONAL
// ---------------------------------------------------------------------------

function buildAnexoB(curvePoints: CurvePoint[]): string {
  if (!curvePoints || curvePoints.length === 0) {
    return `
<div class="page page-break">
  ${sectionHeading('Anexo B — Curva Emocional (Zona 2)')}
  <p style="color:#888;font-style:italic;">Sin datos de curva emocional disponibles.</p>
</div>`
  }

  // ASCII bar chart
  const maxIntensity = 10
  const barMaxLen = 30
  const barRows = curvePoints.map(cp => {
    const filled = Math.round((cp.intensity / maxIntensity) * barMaxLen)
    const empty  = barMaxLen - filled
    const bar = '█'.repeat(filled) + '░'.repeat(empty)
    const tc = typeColor(cp.type)
    return `<tr>
      <td style="padding:3px 8px;font-weight:700;color:#2d4a3e;border-bottom:1px solid #eee;">${esc(String(cp.slide))}</td>
      <td style="padding:3px 8px;border-bottom:1px solid #eee;">${esc(cp.label)}</td>
      <td style="padding:3px 8px;border-bottom:1px solid #eee;">
        <span class="ascii-bar" style="color:${tc};">${esc(bar)}</span>
        <span style="margin-left:8px;font-size:8pt;color:#555;">${esc(String(cp.intensity))}/10</span>
      </td>
    </tr>`
  }).join('')

  const tableRows = curvePoints.map(cp => {
    const tc = typeColor(cp.type)
    return `<tr>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;font-weight:700;color:#2d4a3e;">${esc(String(cp.slide))}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${esc(cp.label)}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;"><span style="color:${tc};font-weight:700;">${esc(typeLabel(cp.type))}</span></td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${esc(cp.emotion)}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;text-align:center;">${esc(String(cp.intensity))}/10</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;font-size:8.5pt;color:#555;">${esc(cp.fullLabel)}</td>
    </tr>`
  }).join('')

  return `
<div class="page page-break">
  ${sectionHeading('Anexo B — Curva Emocional (Zona 2)')}

  ${subHeading('Gráfico de Intensidad Emocional')}
  <div style="background:#f7f7f5;border:1px solid #ddd;border-radius:4px;padding:12px 0;margin-bottom:18px;overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:9pt;">
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th style="width:120px;">Slide</th>
          <th>Intensidad</th>
        </tr>
      </thead>
      <tbody>${barRows}</tbody>
    </table>
  </div>

  ${subHeading('Tabla de Curva Emocional')}
  <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;">
    <thead><tr><th>#</th><th>Slide</th><th>Tipo</th><th>Emoción</th><th>Intensidad</th><th>Descripción</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</div>`
}

// ---------------------------------------------------------------------------
// ANEXO C — ASSETS Y GRÁFICOS
// ---------------------------------------------------------------------------

function buildAnexoC(zone3Slides: Zone3Slide[]): string {
  if (!zone3Slides || zone3Slides.length === 0) {
    return `
<div class="page page-break">
  ${sectionHeading('Anexo C — Assets y Gráficos (Zona 3)')}
  <p style="color:#888;font-style:italic;">Sin datos de assets disponibles.</p>
</div>`
  }

  const rows = zone3Slides.map(s => {
    const assetCell = s.uploadedAsset
      ? (s.uploadedAsset.fileType === 'image'
          ? `<img src="${esc(s.uploadedAsset.dataUrl)}" alt="${esc(s.uploadedAsset.name || 'asset')}" style="max-width:50px;max-height:40px;border-radius:2px;border:1px solid #ddd;vertical-align:middle;" /> <span style="font-size:8pt;">${esc(s.uploadedAsset.name || '—')}</span>`
          : `<span style="font-size:8pt;">[Video] ${esc(s.uploadedAsset.name || '—')}</span>`)
      : '<span style="color:#aaa;">—</span>'

    const graphicCell = s.graphicSuggestion
      ? `<strong>${esc(s.graphicSuggestion.type)}: ${esc(s.graphicSuggestion.title)}</strong><br><span style="font-size:8pt;color:#555;">${esc(s.graphicSuggestion.why)}</span>`
      : '<span style="color:#aaa;">—</span>'

    const estadoCell = s.approved
      ? badge('Aprobado', '#1a7a57', '#e8f5ee')
      : s.useGraphic
        ? badge('Con gráfico', '#8a5a00', '#fdf3dc')
        : badge('Sin asset', '#5a5a5a', '#eeeeec')

    return `<tr>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;font-weight:700;color:#2d4a3e;">${esc(String(s.slide))}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${esc(s.label)}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${assetCell}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${graphicCell}</td>
      <td style="border-bottom:1px solid #eee;padding:5px 8px;">${estadoCell}</td>
    </tr>`
  }).join('')

  return `
<div class="page page-break">
  ${sectionHeading('Anexo C — Assets y Gráficos (Zona 3)')}
  <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:16px;">
    <thead><tr><th>#</th><th>Slide</th><th>Asset</th><th>Sugerencia Gráfica</th><th>Estado</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`
}

// ---------------------------------------------------------------------------
// ANEXO D — EVALUACIÓN DE DISEÑO
// ---------------------------------------------------------------------------

function buildAnexoD(zone4Slides: Zone4SlideReview[]): string {
  if (!zone4Slides || zone4Slides.length === 0) {
    return `
<div class="page page-break">
  ${sectionHeading('Anexo D — Evaluación de Diseño (Zona 4)')}
  <p style="color:#888;font-style:italic;">Sin datos de evaluación disponibles.</p>
</div>`
  }

  const evaluated = zone4Slides.filter(s => s.evaluated)
  const total     = zone4Slides.length
  const totalEval = evaluated.length
  const scores    = evaluated.filter(s => s.globalScore !== null).map(s => s.globalScore as number)
  const avgScore  = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '—'

  const countPass    = zone4Slides.filter(s => s.globalStatus === 'pass').length
  const countWarning = zone4Slides.filter(s => s.globalStatus === 'warning').length
  const countFail    = zone4Slides.filter(s => s.globalStatus === 'fail').length

  const statsBlock = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      ${statBox('Slides evaluados', `${totalEval} / ${total}`, '#2d4a3e', '#e8f5ee')}
      ${statBox('Score promedio', String(avgScore), '#2d4a3e', '#e8f5ee')}
      ${statBox('Aprobados', String(countPass),    '#1a7a57', '#e8f5ee')}
      ${statBox('Advertencias', String(countWarning), '#8a5a00', '#fdf3dc')}
      ${statBox('Rechazados', String(countFail),  '#8a2020', '#fceaea')}
    </div>`

  const slideDetails = zone4Slides.map(s => {
    const sc = statusColor(s.globalStatus)
    const tc = typeColor(s.type)

    let axesSummary = '<span style="color:#aaa;font-style:italic;font-size:8.5pt;">No evaluado</span>'
    if (s.axes) {
      axesSummary = `
        <span style="font-size:8pt;">
          Brand: <strong>${esc(String(s.axes.brand.score))}</strong> &nbsp;|&nbsp;
          Cog: <strong>${esc(String(s.axes.cognitive.score))}</strong> &nbsp;|&nbsp;
          Emoc: <strong>${esc(String(s.axes.emotional.score))}</strong>
        </span>`
    }

    const suggCount = s.suggestions?.length || 0

    return `
      <div style="border:1px solid #ddd;border-radius:4px;padding:10px 14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-weight:700;color:#2d4a3e;font-size:11pt;">Slide ${esc(String(s.slide))}</span>
          <span style="flex:1;color:#555;font-size:9pt;">${esc(s.label)}</span>
          <span style="margin-right:6px;">${badge(typeLabel(s.type), '#fff', tc)}</span>
          ${badge(sc.label, sc.fg, sc.bg)}
          ${s.globalScore !== null ? `<span style="font-size:9pt;font-weight:700;color:#2d4a3e;margin-left:6px;">Score: ${esc(String(s.globalScore))}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:16px;font-size:9pt;">
          ${axesSummary}
          <span style="color:#555;">${esc(String(suggCount))} sugerencia${suggCount !== 1 ? 's' : ''}</span>
        </div>
      </div>`
  }).join('')

  return `
<div class="page page-break">
  ${sectionHeading('Anexo D — Evaluación de Diseño (Zona 4)')}
  ${statsBlock}
  ${subHeading('Detalle por Slide')}
  ${slideDetails}
</div>`
}

function statBox(label: string, value: string, fg: string, bg: string): string {
  return `
    <div style="background:${bg};border:1px solid ${fg}33;border-radius:6px;padding:12px 18px;min-width:130px;text-align:center;">
      <div style="font-size:18pt;font-weight:800;color:${fg};">${esc(value)}</div>
      <div style="font-size:8pt;color:#555;margin-top:2px;">${esc(label)}</div>
    </div>`
}

// ---------------------------------------------------------------------------
// MAIN FUNCTION
// ---------------------------------------------------------------------------

export function generateReportHtml(data: ReportData): string {
  const title = data.zone1?.presentationName || 'Storyboard de Presentación'

  const cover      = buildCover(data)
  const toc        = buildTOC(data)
  const pitchSec   = buildPitch(data)
  const section2   = buildSection1(data)
  const section3   = buildSection2(data)
  const anexoA     = buildAnexoA(data.zone1)
  const anexoB     = buildAnexoB(data.curvePoints)
  const anexoC     = buildAnexoC(data.zone3Slides)
  const anexoD     = buildAnexoD(data.zone4Slides)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} — Storyboard Report</title>
  ${buildStyles()}
</head>
<body>
  ${cover}
  ${toc}
  ${pitchSec}
  ${section2}
  ${section3}
  ${anexoA}
  ${anexoB}
  ${anexoC}
  ${anexoD}
</body>
</html>`
}
