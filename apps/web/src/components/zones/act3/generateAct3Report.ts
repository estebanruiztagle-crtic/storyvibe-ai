// generateAct3Report.ts
// Generates a self-contained HTML string for a consolidated PDF report covering all 3 acts.
// No external imports — all types defined locally.

// ─── Local Type Definitions ──────────────────────────────────────────────────

interface Zone1Context {
  presentationName: string
  event: {
    type: string
    name: string
    date: string
    format: string
    durationMinutes: number
    qaMinutes: number
    language: string
    location: string
    formalityLevel: number
  }
  audience: {
    segments: Array<{ role: string; percentage: number; description: string; color: string }>
    emotionalBaseline: string
    size: number
    primaryMotivation: string
    primaryFear: string
    attentionMinutes: number
    familiarity: string
  }
  objective: {
    primary: string
    desiredAction: string
    successMetric: string
    mustRemember: string
    mustFeel: string
  }
  tone: {
    primary: string
    narrativeArc: string
    hook: string
    proof: string
    humorAllowed: boolean
    arc: { opening: string; middle: string; closing: string }
  }
  constraints: {
    avoidTopics: string[]
    mandatoryTopics: string[]
    previousContext: string
  }
  riskFlags: Array<{
    id: string
    title: string
    mitigation: string
    severity: 'alta' | 'media' | 'baja'
  }>
}

interface CurvePoint {
  slide: number
  label: string
  fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
  suggestedTitle?: string
  contentDirection?: string
  designStyle?: string
  visualMood?: string
  speakerNotes?: string
  durationSeconds?: number
}

interface StorytellingFramework {
  id: string
  name: string
  origin: string
  fitScore: number
  recommended: boolean
  description: string
  fitReasons: string[]
  emotionalArc: string[]
  risk: string
}

interface Zone2Data {
  narrativeBrief?: string
  presentationTitle?: string
  selectedFrameworkId?: string | null
  frameworks?: StorytellingFramework[]
  curvePoints?: CurvePoint[]
}

interface ImagePlaceholder {
  id: string
  label: string
  placement: string
  suggestedPrompt: string
  style: string
  aspectRatio?: string
}

interface SlideContent {
  slideNumber: number
  title: string
  subtitle?: string
  bodyText?: string
  bullets?: string[]
  callToAction?: string
  images: ImagePlaceholder[]
  speakerNotes?: string
  designStyle: string
  visualMood: string
  emotion: string
  intensity: number
  topicType: string
  durationSeconds?: number
}

interface ColorPalette {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  textColor: string
  desc: string
}

interface LookAndFeel {
  paletteId: string
  palette: ColorPalette
  typographyStyle: string
  visualDensity: string
}

interface Act3Data {
  lookAndFeel: LookAndFeel
  slides: SlideContent[]
  generatedAt?: string
}

export interface Act3ReportData {
  zone1: Zone1Context | null
  zone2: Zone2Data | null
  act3: Act3Data
  generatedAt: string
  pitchData?: PitchData
}

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

// ─── Utility Functions ────────────────────────────────────────────────────────

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
  const str = String(s ?? '').trim()
  return str.length > 0 ? esc(str) : '—'
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return esc(iso)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return esc(iso)
  }
}

function fmtSecs(s: number | undefined): string {
  if (s === undefined || s === null) return '—'
  const mins = Math.floor(s / 60)
  const secs = s % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins} min`
  return `${mins} min ${secs}s`
}

function typeColor(type: string): string {
  switch (type) {
    case 'peak': return '#1D9E75'
    case 'valley': return '#378ADD'
    case 'transition': return '#EF9F27'
    default: return '#6B6866'
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'peak': return 'Pico'
    case 'valley': return 'Valle'
    case 'transition': return 'Transición'
    default: return esc(type)
  }
}

function badge(text: string, fg: string, bg: string): string {
  return `<span style="display:inline-block;padding:2px 9px;border-radius:12px;font-size:8pt;font-weight:600;color:${fg};background:${bg};letter-spacing:0.02em">${esc(text)}</span>`
}

function sectionHeading(text: string): string {
  return `<h2 style="font-size:15pt;font-weight:700;color:#1A2E27;border-left:4px solid #6B3FA0;padding-left:12px;margin:0 0 16px 0">${esc(text)}</h2>`
}

function subHeading(text: string): string {
  return `<h3 style="font-size:11pt;font-weight:600;color:#1A1A18;margin:18px 0 8px 0">${esc(text)}</h3>`
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="font-weight:600;color:#6B6866;white-space:nowrap;width:34%;padding:5px 8px;border-bottom:1px solid #E5E2DA;vertical-align:top">${esc(label)}</td>
    <td style="color:#1A1A18;padding:5px 8px;border-bottom:1px solid #E5E2DA;vertical-align:top">${value}</td>
  </tr>`
}

function pageBreak(): string {
  return `<div class="page-break"></div>`
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

function buildStyles(): string {
  return `<style>
    *, *::before, *::after { box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 10pt;
      color: #1A1A18;
      background: #DDD9D2;
      margin: 0;
      padding: 1.8cm 0 2cm;
      line-height: 1.55;
    }
    .page {
      max-width: 21cm;
      margin: 0 auto 1.2cm;
      background: #FFFFFF;
      box-shadow: 0 4px 24px rgba(0,0,0,0.13);
      position: relative;
      overflow: hidden;
    }
    .cover-page { min-height: 28cm; padding: 0; display: flex; flex-direction: column; }
    .content-page { padding: 2cm 2.4cm 2.2cm; }
    .page-break { page-break-before: always; }

    @media print {
      .no-print { display: none !important; }
      body { background: #FFFFFF; padding: 0; margin: 0; }
      .page { box-shadow: none; margin: 0; max-width: 100%; }
      .cover-page { min-height: 100vh; }
      .content-page { padding: 0; }
    }
    @page { size: A4; margin: 2cm 2.2cm; }

    .section-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%;
      background: #5B2D8E; color: #FFFFFF;
      font-family: system-ui, sans-serif;
      font-size: 13pt; font-weight: 800;
      margin-right: 12px; flex-shrink: 0; vertical-align: middle;
    }
    .section-header {
      display: flex; align-items: center;
      padding: 14px 0 14px;
      border-bottom: 2px solid #5B2D8E;
      margin-bottom: 22px;
    }
    .section-title {
      font-family: system-ui, sans-serif;
      font-size: 16pt; font-weight: 700; color: #1A1A18; margin: 0;
      letter-spacing: -0.02em;
    }
    .section-subtitle {
      font-size: 9pt; color: #8A8785; margin: 2px 0 0; font-family: system-ui, sans-serif;
    }
    .subsection-title {
      font-family: system-ui, sans-serif;
      font-size: 10pt; font-weight: 700; color: #5B2D8E;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin: 24px 0 10px; padding-bottom: 4px;
      border-bottom: 1px solid #E2DDD6;
    }

    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; font-family: system-ui, sans-serif; }
    th { background: #5B2D8E; color: #FFFFFF; padding: 7px 10px; text-align: left; font-size: 8.5pt; font-weight: 600; letter-spacing: 0.04em; }
    td { padding: 6px 10px; font-size: 9pt; vertical-align: top; border-bottom: 1px solid #EEE9E1; color: #1A1A18; }
    tr:nth-child(even) td { background: #FAF8F5; }

    .info-pair { display: flex; padding: 7px 0; border-bottom: 1px solid #EEE9E1; font-family: system-ui, sans-serif; }
    .info-label { width: 38%; min-width: 120px; font-size: 8.5pt; font-weight: 600; color: #6B6866; text-transform: uppercase; letter-spacing: 0.05em; padding-right: 12px; padding-top: 1px; }
    .info-value { flex: 1; font-size: 9.5pt; color: #1A1A18; }

    .seg-bar-bg { background: #EEE9E1; border-radius: 3px; height: 6px; flex: 1; margin: 0 10px; overflow: hidden; }
    .seg-bar-fill { height: 100%; border-radius: 3px; }

    .brief-block {
      background: #F0EBFA; border-left: 5px solid #5B2D8E;
      padding: 16px 20px; margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
      font-style: italic; font-size: 10.5pt; color: #2D1A52;
      line-height: 1.7;
    }

    .fw-card {
      border: 1.5px solid #C8BDDC; border-radius: 8px;
      background: #F7F3FF; padding: 16px 18px; margin-bottom: 16px;
    }
    .fw-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .fw-name { font-family: system-ui, sans-serif; font-size: 13pt; font-weight: 700; color: #2D1A52; }

    .stat-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 14px; border-radius: 20px;
      background: #F0EBFA; color: #5B2D8E;
      font-size: 9pt; font-weight: 600; font-family: system-ui, sans-serif;
      margin: 0 6px 6px 0; border: 1px solid #C8BDDC;
    }

    .badge {
      display: inline-block; padding: 2px 9px; border-radius: 10px;
      font-size: 8pt; font-weight: 600; font-family: system-ui, sans-serif;
      letter-spacing: 0.02em; white-space: nowrap;
    }

    .risk-alta { background: #FDECEA; color: #C0392B; }
    .risk-media { background: #FFF3D0; color: #C47A00; }
    .risk-baja { background: #E0F5EE; color: #1A7A5E; }

    .slide-card {
      border: 1px solid #E2DDD6; border-radius: 8px;
      margin-bottom: 18px; page-break-inside: avoid;
      overflow: hidden; font-family: system-ui, sans-serif;
    }
    .slide-card-header {
      display: flex; align-items: center; gap: 0;
      background: #1A1A18; padding: 10px 14px;
    }
    .slide-num {
      width: 32px; height: 32px; border-radius: 6px;
      background: #5B2D8E; color: #FFFFFF;
      display: flex; align-items: center; justify-content: center;
      font-size: 11pt; font-weight: 800; flex-shrink: 0; margin-right: 12px;
      font-family: system-ui, sans-serif;
    }
    .slide-title { font-size: 11pt; font-weight: 700; color: #FFFFFF; flex: 1; }
    .slide-subtitle { font-size: 9pt; color: #9CA3AF; font-style: italic; margin-top: 2px; }
    .slide-meta { display: flex; gap: 6px; align-items: center; flex-shrink: 0; flex-wrap: wrap; }
    .slide-body { padding: 14px 16px; }
    .slide-bodytxt { font-size: 9.5pt; color: #1A1A18; line-height: 1.6; margin-bottom: 10px; }
    .bullet-list { margin: 0 0 10px 4px; padding: 0; list-style: none; }
    .bullet-list li { padding: 3px 0 3px 16px; position: relative; font-size: 9.5pt; color: #1A1A18; }
    .bullet-list li::before { content: '\\25B8'; position: absolute; left: 0; color: #5B2D8E; font-size: 8pt; top: 4px; }
    .cta-box {
      background: #F0EBFA; border: 1.5px solid #C8BDDC;
      border-radius: 6px; padding: 8px 14px; margin: 8px 0;
      font-weight: 700; color: #2D1A52; font-size: 9.5pt;
    }
    .img-placeholder {
      border: 2px dashed #C8BDDC; border-radius: 6px;
      padding: 10px 12px; margin: 8px 0;
      background: #F7F3FF;
    }
    .img-label { font-weight: 700; color: #5B2D8E; font-size: 8.5pt; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .prompt-box {
      font-family: 'Courier New', monospace;
      font-size: 8pt; background: #F0EBE0;
      padding: 8px 10px; border-radius: 4px; color: #4A4845;
      margin-top: 5px; line-height: 1.5;
      white-space: pre-wrap; word-break: break-word;
    }
    .speaker-notes {
      background: #F7F7F5; border-radius: 4px;
      padding: 8px 12px; margin-top: 10px;
      font-size: 8.5pt; color: #6B6866; font-style: italic;
      border-left: 3px solid #C8C5BB;
    }
    .slide-footer { background: #FAFAF8; padding: 7px 16px 9px; display: flex; gap: 6px; flex-wrap: wrap; border-top: 1px solid #EEE9E1; }

    .int-bar-bg { display: inline-block; background: #E2DDD6; border-radius: 2px; height: 8px; width: 80px; vertical-align: middle; overflow: hidden; }
    .int-bar-fill { height: 100%; border-radius: 2px; }

    .toc-section { padding: 8px 0; border-bottom: 1px solid #EEE9E1; display: flex; align-items: center; gap: 8px; }
    .toc-num { font-size: 9pt; font-weight: 700; color: #5B2D8E; width: 20px; font-family: system-ui, sans-serif; }
    .toc-label { font-size: 10.5pt; font-weight: 600; color: #1A1A18; flex: 1; font-family: system-ui, sans-serif; }
    .toc-slide { padding: 4px 0 4px 28px; font-size: 9pt; color: #6B6866; border-bottom: 1px dotted #EEE9E1; font-family: system-ui, sans-serif; }

    .swatch-row { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .swatch { width: 48px; height: 48px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; }
    .swatch-label { font-size: 7.5pt; text-align: center; margin-top: 3px; color: #6B6866; font-family: monospace; }
    .palette-color-block { display: flex; flex-direction: column; align-items: center; }

    .cover-top { background: #1A0A2E; padding: 2.5cm 2.4cm 1.8cm; flex: 1; min-height: 16cm; display: flex; flex-direction: column; justify-content: flex-end; }
    .cover-bottom { padding: 1.5cm 2.4cm 1.8cm; display: flex; flex-direction: column; }
    .cover-eyebrow { font-family: system-ui, sans-serif; font-size: 9pt; font-weight: 700; color: #C4A4F0; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 20px; }
    .cover-title { font-family: system-ui, sans-serif; font-size: 30pt; font-weight: 800; color: #FFFFFF; line-height: 1.1; margin: 0 0 14px; letter-spacing: -0.02em; }
    .cover-sub { font-family: system-ui, sans-serif; font-size: 13pt; color: #A78BDA; margin: 0; }
    .cover-stats-row { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 18px; }
    .cover-stat { flex: 1; min-width: 80px; }
    .cover-stat-num { font-family: system-ui, sans-serif; font-size: 18pt; font-weight: 800; color: #1A1A18; line-height: 1; }
    .cover-stat-label { font-family: system-ui, sans-serif; font-size: 8.5pt; color: #8A8785; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
    .cover-footer { font-family: system-ui, sans-serif; font-size: 8.5pt; color: #8A8785; border-top: 1px solid #E2DDD6; padding-top: 12px; margin-top: auto; display: flex; justify-content: space-between; }
  </style>`
}

// ─── Section Builders ─────────────────────────────────────────────────────────

function buildCover(data: Act3ReportData): string {
  const title =
    data.zone1?.presentationName ||
    data.zone2?.presentationTitle ||
    'Presentación'

  const slideCount = data.act3.slides.length
  const totalSecs = data.act3.slides.reduce(
    (acc, s) => acc + (s.durationSeconds ?? 0),
    0
  )
  const totalMin = Math.round(totalSecs / 60)
  const paletteName = data.act3.lookAndFeel?.palette?.name || '—'
  const genDate = fmtDate(data.generatedAt)

  return `<div class="page cover-page">
    <div class="cover-top">
      <div class="cover-eyebrow">StoryVibe AI · Reporte de Presentación</div>
      <h1 class="cover-title">${esc(title)}</h1>
      <p class="cover-sub">Reporte consolidado · Actos 1, 2 y 3</p>
    </div>
    <div class="cover-bottom">
      <div class="cover-stats-row">
        <div class="cover-stat">
          <div class="cover-stat-num">${slideCount}</div>
          <div class="cover-stat-label">Diapositivas</div>
        </div>
        <div class="cover-stat">
          <div class="cover-stat-num">${totalMin > 0 ? totalMin + ' min' : '—'}</div>
          <div class="cover-stat-label">Duración total</div>
        </div>
        <div class="cover-stat">
          <div class="cover-stat-num" style="font-size:13pt">${esc(paletteName)}</div>
          <div class="cover-stat-label">Paleta de color</div>
        </div>
      </div>
      <div class="cover-footer">
        <span>Generado el ${genDate}</span>
        <span>StoryVibe AI</span>
      </div>
    </div>
  </div>`
}

function buildTOC(data: Act3ReportData): string {
  const slides = data.act3.slides

  const slideItems = slides
    .map(
      (s) =>
        `<div class="toc-slide">Slide ${s.slideNumber} &mdash; ${esc(s.title)}</div>`
    )
    .join('')

  return `${pageBreak()}<div class="page content-page">
    <div class="section-header">
      <span class="section-badge" style="background:#5B2D8E">&#9776;</span>
      <div>
        <div class="section-title">Tabla de Contenidos</div>
      </div>
    </div>
    <div style="margin-top:8px">
      <div class="toc-section">
        <span class="toc-num">1</span>
        <span class="toc-label">Acto 1 &mdash; Contexto y Audiencia</span>
        <span style="font-size:9pt;color:#8A8785;font-family:system-ui,sans-serif">&hellip;</span>
      </div>
      <div class="toc-section">
        <span class="toc-num">2</span>
        <span class="toc-label">Acto 2 &mdash; Arquitectura Narrativa</span>
        <span style="font-size:9pt;color:#8A8785;font-family:system-ui,sans-serif">&hellip;</span>
      </div>
      <div class="toc-section">
        <span class="toc-num">3</span>
        <span class="toc-label">Acto 3 &mdash; Look &amp; Feel y Slides</span>
        <span style="font-size:9pt;color:#8A8785;font-family:system-ui,sans-serif">&hellip;</span>
      </div>
      ${slideItems}
      <div class="toc-section">
        <span class="toc-num">4</span>
        <span class="toc-label">Anexo &mdash; Prompts de Im&aacute;genes</span>
        <span style="font-size:9pt;color:#8A8785;font-family:system-ui,sans-serif">&hellip;</span>
      </div>
    </div>
  </div>`
}

function buildAct1(zone1: Zone1Context | null): string {
  if (!zone1) {
    return `${pageBreak()}<div class="page content-page">
      <div class="section-header">
        <span class="section-badge">1</span>
        <div><div class="section-title">Acto 1 &mdash; Diagn&oacute;stico de Contexto</div></div>
      </div>
      <p style="color:#8A8785;font-style:italic">Sin datos de contexto disponibles.</p>
    </div>`
  }

  const { event, audience, objective, tone, constraints, riskFlags } = zone1

  // Event info pairs
  const eventPairs = [
    ['Tipo de evento', dash(event.type)],
    ['Nombre del evento', dash(event.name)],
    ['Fecha', event.date ? fmtDate(event.date) : '—'],
    ['Formato', dash(event.format)],
    ['Duraci&oacute;n', event.durationMinutes ? `${event.durationMinutes} min` : '—'],
    ['Tiempo de preguntas', event.qaMinutes ? `${event.qaMinutes} min` : '—'],
    ['Idioma', dash(event.language)],
    ['Lugar', dash(event.location)],
    ['Nivel de formalidad', event.formalityLevel !== undefined ? `${event.formalityLevel}/10` : '—'],
  ].map(([l, v]) => `<div class="info-pair"><span class="info-label">${l}</span><span class="info-value">${v}</span></div>`).join('')

  // Audience info pairs
  const audiencePairs = [
    ['Tama&ntilde;o de audiencia', audience.size ? String(audience.size) : '—'],
    ['Estado emocional base', dash(audience.emotionalBaseline)],
    ['Motivaci&oacute;n principal', dash(audience.primaryMotivation)],
    ['Miedo principal', dash(audience.primaryFear)],
    ['Minutos de atenci&oacute;n', audience.attentionMinutes ? `${audience.attentionMinutes} min` : '—'],
    ['Familiaridad', dash(audience.familiarity)],
  ].map(([l, v]) => `<div class="info-pair"><span class="info-label">${l}</span><span class="info-value">${v}</span></div>`).join('')

  // Segments bars
  const segmentBars = (audience.segments || []).map((seg) => `
    <div style="padding:6px 0;border-bottom:1px solid #EEE9E1;display:flex;align-items:center;gap:10px;font-family:system-ui,sans-serif">
      <span style="width:10px;height:10px;border-radius:50%;background:${esc(seg.color)};display:inline-block;flex-shrink:0"></span>
      <span style="font-size:9.5pt;font-weight:600;color:#1A1A18;width:150px">${esc(seg.role)}</span>
      <div class="seg-bar-bg"><div class="seg-bar-fill" style="width:${seg.percentage}%;background:${esc(seg.color)}"></div></div>
      <span style="font-size:9pt;font-weight:700;color:#1A1A18;width:36px;text-align:right">${seg.percentage}%</span>
      <span style="font-size:8.5pt;color:#6B6866;flex:1">${esc(seg.description)}</span>
    </div>`).join('')

  const segmentsBlock = segmentBars.length > 0
    ? segmentBars
    : '<p style="color:#8A8785;font-size:9pt">Sin segmentos definidos.</p>'

  // Objective info pairs
  const objectivePairs = [
    ['Objetivo principal', dash(objective.primary)],
    ['Acci&oacute;n deseada', dash(objective.desiredAction)],
    ['M&eacute;trica de &eacute;xito', dash(objective.successMetric)],
    ['Deben recordar', dash(objective.mustRemember)],
    ['Deben sentir', dash(objective.mustFeel)],
  ].map(([l, v]) => `<div class="info-pair"><span class="info-label">${l}</span><span class="info-value">${v}</span></div>`).join('')

  // Tone info pairs
  const tonePairs = [
    ['Tono principal', dash(tone.primary)],
    ['Arco narrativo', dash(tone.narrativeArc)],
    ['Gancho', dash(tone.hook)],
    ['Prueba / credibilidad', dash(tone.proof)],
    ['Humor permitido', tone.humorAllowed ? 'S&iacute;' : 'No'],
  ].map(([l, v]) => `<div class="info-pair"><span class="info-label">${l}</span><span class="info-value">${v}</span></div>`).join('')

  // Tone arc boxes
  const arcColors: Record<string, string> = { opening: '#EFF6FF', middle: '#F0EBFA', closing: '#E0F5EE' }
  const arcBorderColors: Record<string, string> = { opening: '#2563EB', middle: '#5B2D8E', closing: '#1A7A5E' }
  const arcTextColors: Record<string, string> = { opening: '#1E3A8A', middle: '#2D1A52', closing: '#0F4D39' }
  const toneArcBlock = `
    <div style="display:flex;gap:10px;margin-top:8px">
      ${(['opening', 'middle', 'closing'] as const).map((key) => {
        const labels: Record<string, string> = { opening: 'Apertura', middle: 'Desarrollo', closing: 'Cierre' }
        const val = tone.arc?.[key] || '—'
        return `<div style="flex:1;background:${arcColors[key]};border:1.5px solid ${arcBorderColors[key]};border-radius:8px;padding:10px 12px">
          <div style="font-family:system-ui,sans-serif;font-size:7.5pt;font-weight:700;color:${arcBorderColors[key]};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">${labels[key]}</div>
          <div style="font-size:9pt;color:${arcTextColors[key]}">${esc(val)}</div>
        </div>`
      }).join('')}
    </div>`

  // Constraints
  const avoidList = (constraints.avoidTopics || []).map((t) => `<li style="margin-bottom:3px">${esc(t)}</li>`).join('')
  const mandatoryList = (constraints.mandatoryTopics || []).map((t) => `<li style="margin-bottom:3px">${esc(t)}</li>`).join('')

  // Risk flags cards
  const riskCards = (riskFlags || []).map((r) => {
    const sevLabel = r.severity === 'alta' ? 'Alta' : r.severity === 'media' ? 'Media' : 'Baja'
    const riskColor = r.severity === 'alta' ? '#C0392B' : r.severity === 'media' ? '#C47A00' : '#1A7A5E'
    const riskBg = r.severity === 'alta' ? '#FDECEA' : r.severity === 'media' ? '#FFF3D0' : '#E0F5EE'
    return `<div style="border-left:4px solid ${riskColor};background:${riskBg};border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:10px;font-family:system-ui,sans-serif">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-weight:700;font-size:10pt;color:#1A1A18">${esc(r.title)}</span>
        <span class="badge risk-${r.severity}">${sevLabel}</span>
      </div>
      <div style="font-size:9pt;color:#4A4845">${esc(r.mitigation)}</div>
    </div>`
  }).join('')

  const riskBlock = riskCards.length > 0
    ? riskCards
    : '<p style="color:#8A8785;font-size:9pt">Sin se&ntilde;ales de riesgo registradas.</p>'

  return `${pageBreak()}<div class="page content-page">
    <div class="section-header">
      <span class="section-badge">1</span>
      <div>
        <div class="section-title">Acto 1 &mdash; Diagn&oacute;stico de Contexto</div>
        <div class="section-subtitle">Evento · Audiencia · Objetivo · Tono · Riesgos</div>
      </div>
    </div>

    <div class="subsection-title">Evento</div>
    ${eventPairs}

    <div class="subsection-title">Audiencia</div>
    ${audiencePairs}

    <div class="subsection-title">Segmentos de audiencia</div>
    ${segmentsBlock}

    <div class="subsection-title">Objetivo</div>
    ${objectivePairs}

    <div class="subsection-title">Tono y estilo narrativo</div>
    ${tonePairs}
    <div class="subsection-title" style="margin-top:16px">Arco tonal</div>
    ${toneArcBlock}

    <div class="subsection-title">Restricciones</div>
    <div style="font-family:system-ui,sans-serif;font-size:9pt;font-weight:600;color:#4A4845;margin-bottom:4px">Temas a evitar</div>
    ${avoidList ? `<ul style="margin:0 0 12px 18px;padding:0;color:#1A1A18;font-size:9pt">${avoidList}</ul>` : '<p style="color:#8A8785;font-size:9pt;margin:0 0 12px">Ninguno.</p>'}
    <div style="font-family:system-ui,sans-serif;font-size:9pt;font-weight:600;color:#4A4845;margin-bottom:4px">Temas obligatorios</div>
    ${mandatoryList ? `<ul style="margin:0 0 12px 18px;padding:0;color:#1A1A18;font-size:9pt">${mandatoryList}</ul>` : '<p style="color:#8A8785;font-size:9pt;margin:0 0 12px">Ninguno.</p>'}
    <div style="font-family:system-ui,sans-serif;font-size:9pt;font-weight:600;color:#4A4845;margin-bottom:4px">Contexto previo</div>
    <p style="color:#1A1A18;margin:0 0 10px 0;font-size:9pt">${dash(constraints.previousContext)}</p>

    <div class="subsection-title">Se&ntilde;ales de riesgo</div>
    ${riskBlock}
  </div>`
}

function buildAct2(zone2: Zone2Data | null): string {
  if (!zone2) {
    return `${pageBreak()}<div class="page content-page">
      <div class="section-header">
        <span class="section-badge">2</span>
        <div><div class="section-title">Acto 2 &mdash; Arquitectura Narrativa</div></div>
      </div>
      <p style="color:#8A8785;font-style:italic">Sin datos de arquitectura disponibles.</p>
    </div>`
  }

  // Narrative brief
  const briefBlock = zone2.narrativeBrief
    ? `<div class="brief-block">${esc(zone2.narrativeBrief)}</div>`
    : '<p style="color:#8A8785;font-size:9pt;font-style:italic">Sin brief narrativo.</p>'

  // Selected framework
  const selectedFw = zone2.frameworks?.find(
    (fw) => fw.id === zone2.selectedFrameworkId
  )

  let frameworkBlock = '<p style="color:#8A8785;font-size:9pt">Sin framework seleccionado.</p>'
  if (selectedFw) {
    const fitScore = selectedFw.fitScore
    const fitColor = fitScore >= 7 ? '#1A7A5E' : fitScore >= 5 ? '#C47A00' : '#C0392B'
    const fitBg    = fitScore >= 7 ? '#E0F5EE' : fitScore >= 5 ? '#FFF3D0' : '#FDECEA'

    const fitReasonsList = (selectedFw.fitReasons || [])
      .map((r) => `<li style="padding:3px 0 3px 16px;position:relative;font-size:9pt;color:#1A1A18"><span style="position:absolute;left:0;color:#5B2D8E;font-size:8pt;top:4px">&#9658;</span>${esc(r)}</li>`)
      .join('')
    const emoArcChips = (selectedFw.emotionalArc || [])
      .map((e) => `<span class="stat-pill">${esc(e)}</span>`)
      .join('')

    frameworkBlock = `<div class="fw-card">
      <div class="fw-card-header">
        <span class="fw-name">${esc(selectedFw.name)}</span>
        <span class="badge" style="background:${fitBg};color:${fitColor}">${fitScore}/10</span>
        ${selectedFw.recommended ? `<span class="badge" style="background:#F0EBFA;color:#5B2D8E">Recomendado</span>` : ''}
      </div>
      <p style="color:#6B6866;font-size:9pt;margin:0 0 8px 0;font-family:system-ui,sans-serif"><em>${esc(selectedFw.origin)}</em></p>
      <p style="color:#1A1A18;margin:0 0 12px 0;font-size:9.5pt">${esc(selectedFw.description)}</p>
      <div style="font-family:system-ui,sans-serif;font-size:9pt;font-weight:700;color:#5B2D8E;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px">Razones de ajuste</div>
      <ul style="margin:0 0 12px 0;padding:0;list-style:none">${fitReasonsList || '<li style="font-size:9pt;color:#8A8785">—</li>'}</ul>
      <div style="font-family:system-ui,sans-serif;font-size:9pt;font-weight:700;color:#5B2D8E;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px">Arco emocional</div>
      <div style="margin-bottom:10px">${emoArcChips || '—'}</div>
      <div style="font-family:system-ui,sans-serif;font-size:9pt;font-weight:700;color:#C47A00;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">Riesgo</div>
      <p style="color:#C47A00;margin:0;font-size:9pt">${esc(selectedFw.risk)}</p>
    </div>`
  }

  // Emotional curve table with intensity bars
  const curvePoints = zone2.curvePoints || []
  const curveRows = curvePoints
    .map((cp) => {
      const tc = typeColor(cp.type)
      const intBar = `<span class="int-bar-bg"><span class="int-bar-fill" style="width:${cp.intensity * 10}%;background:${tc}"></span></span>`
      return `<tr>
        <td style="font-weight:700;text-align:center">${cp.slide}</td>
        <td>${esc(cp.label.length > 28 ? cp.label.slice(0, 28) + '…' : cp.label)}</td>
        <td><span class="badge" style="background:${tc}22;color:${tc}">${typeLabel(cp.type)}</span></td>
        <td><span style="font-size:8.5pt;color:#5B2D8E;font-family:system-ui,sans-serif">${esc(cp.emotion)}</span></td>
        <td style="white-space:nowrap">${intBar} <span style="font-size:8.5pt;color:#4A4845;font-family:system-ui,sans-serif">${cp.intensity}</span></td>
        <td style="color:#6B6866">${cp.durationSeconds !== undefined ? fmtSecs(cp.durationSeconds) : '—'}</td>
      </tr>`
    })
    .join('')

  const curveTable = curveRows.length > 0
    ? `<table>
        <thead><tr><th style="width:36px">#</th><th>Etiqueta</th><th>Tipo</th><th>Emoci&oacute;n</th><th>Intensidad</th><th>Duraci&oacute;n</th></tr></thead>
        <tbody>${curveRows}</tbody>
      </table>`
    : '<p style="color:#8A8785;font-size:9pt">Sin puntos de curva disponibles.</p>'

  return `${pageBreak()}<div class="page content-page">
    <div class="section-header">
      <span class="section-badge">2</span>
      <div>
        <div class="section-title">Acto 2 &mdash; Arquitectura Narrativa</div>
        <div class="section-subtitle">Brief · Framework · Curva emocional</div>
      </div>
    </div>

    <div class="subsection-title">Brief Narrativo</div>
    ${briefBlock}

    <div class="subsection-title">Framework Seleccionado</div>
    ${frameworkBlock}

    <div class="subsection-title">Curva Emocional</div>
    ${curveTable}
  </div>`
}

function buildAct3LookAndFeel(act3: Act3Data): string {
  const { lookAndFeel } = act3
  const p = lookAndFeel?.palette

  let paletteBlock = '<p style="color:#8A8785">Sin paleta definida.</p>'
  if (p) {
    const swatchItems = [
      { label: 'Primary',    color: p.primary },
      { label: 'Secondary',  color: p.secondary },
      { label: 'Accent',     color: p.accent },
      { label: 'Background', color: p.background },
      { label: 'Surface',    color: p.surface },
      { label: 'Text',       color: p.textColor },
    ].map((sw) => `<div class="palette-color-block">
      <div class="swatch" style="background:${esc(sw.color)}"></div>
      <div class="swatch-label">${sw.label}<br>${esc(sw.color)}</div>
    </div>`).join('')

    paletteBlock = `
      <div style="font-family:system-ui,sans-serif;font-size:11pt;font-weight:700;color:#1A1A18;margin-bottom:4px">${esc(p.name)}</div>
      <div style="font-size:9pt;color:#6B6866;font-family:system-ui,sans-serif;margin-bottom:8px">${esc(p.desc)}</div>
      <div class="swatch-row">${swatchItems}</div>`
  }

  const typoPairs = [
    ['Estilo tipogr&aacute;fico', lookAndFeel?.typographyStyle ? dash(lookAndFeel.typographyStyle) : '—'],
    ['Densidad visual', lookAndFeel?.visualDensity ? dash(lookAndFeel.visualDensity) : '—'],
  ].map(([l, v]) => `<div class="info-pair"><span class="info-label">${l}</span><span class="info-value">${v}</span></div>`).join('')

  return `${pageBreak()}<div class="page content-page">
    <div class="section-header">
      <span class="section-badge">3</span>
      <div>
        <div class="section-title">Acto 3 &mdash; Look &amp; Feel</div>
        <div class="section-subtitle">Paleta de color · Tipograf&iacute;a · Densidad visual</div>
      </div>
    </div>

    <div class="subsection-title">Paleta de Colores</div>
    ${paletteBlock}

    <div class="subsection-title" style="margin-top:28px">Tipograf&iacute;a y Densidad</div>
    ${typoPairs}
  </div>`
}

function buildAct3Slides(act3: Act3Data): string {
  const slides = act3.slides || []
  if (slides.length === 0) {
    return `${pageBreak()}<div class="page content-page">
      <div class="section-header">
        <div><div class="section-title">Slides de la Presentaci&oacute;n</div></div>
      </div>
      <p style="color:#8A8785;font-style:italic">Sin slides generadas.</p>
    </div>`
  }

  const slideCards = slides.map((s) => {
    // Image placeholders
    const imagePlaceholders = (s.images || []).map((img) => `<div class="img-placeholder">
      <div class="img-label">
        <span>&#9703; IMG</span>
        <span>${esc(img.label)}</span>
        <span class="badge" style="background:#EFF6FF;color:#2563EB">${esc(img.placement)}</span>
        <span class="badge" style="background:#E0F5EE;color:#1A7A5E">${esc(img.style)}</span>
        ${img.aspectRatio ? `<span class="badge" style="background:#F0EBFA;color:#5B2D8E">${esc(img.aspectRatio)}</span>` : ''}
      </div>
      <div class="prompt-box">${esc(img.suggestedPrompt)}</div>
    </div>`).join('')

    // Bullets
    const bulletsList = (s.bullets || []).length > 0
      ? `<ul class="bullet-list">${(s.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
      : ''

    // CTA
    const ctaBlock = s.callToAction
      ? `<div class="cta-box">&#9654; ${esc(s.callToAction)}</div>`
      : ''

    // Speaker notes
    const notesBlock = s.speakerNotes
      ? `<div class="speaker-notes"><span style="font-weight:700;color:#4A4845;font-style:normal">Notas del orador:</span> ${esc(s.speakerNotes)}</div>`
      : ''

    // Body text
    const bodyBlock = s.bodyText
      ? `<div class="slide-bodytxt">${esc(s.bodyText)}</div>`
      : ''

    // Duration
    const durationStr = s.durationSeconds !== undefined ? fmtSecs(s.durationSeconds) : '—'

    return `<div class="slide-card">
      <div class="slide-card-header">
        <div class="slide-num">${s.slideNumber}</div>
        <div style="flex:1">
          <div class="slide-title">${esc(s.title)}</div>
          ${s.subtitle ? `<div class="slide-subtitle">${esc(s.subtitle)}</div>` : ''}
        </div>
        <div class="slide-meta">
          <span class="badge" style="background:#F0EBFA;color:#C4A4F0">${esc(s.emotion)}</span>
          <span class="badge" style="background:#FFFFFF22;color:#D1D5DB">${s.intensity}/10</span>
          <span style="font-size:8pt;color:#9CA3AF;font-family:system-ui,sans-serif">${durationStr}</span>
        </div>
      </div>
      <div class="slide-body">
        ${bodyBlock}
        ${bulletsList}
        ${ctaBlock}
        ${imagePlaceholders}
        ${notesBlock}
      </div>
      <div class="slide-footer">
        <span class="badge" style="background:#F0EBFA;color:#5B2D8E">${esc(s.designStyle)}</span>
        <span class="badge" style="background:#EFF6FF;color:#2563EB">${esc(s.visualMood)}</span>
        <span class="badge" style="background:#F5F5F4;color:#6B6866">${esc(s.topicType)}</span>
      </div>
    </div>`
  }).join('')

  return `${pageBreak()}<div class="page content-page">
    <div style="font-family:system-ui,sans-serif;font-size:14pt;font-weight:700;color:#1A1A18;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #5B2D8E">
      Slides de la Presentaci&oacute;n
    </div>
    ${slideCards}
  </div>`
}

function buildImagePromptsAnnex(act3: Act3Data): string {
  const slides = act3.slides || []

  const allImages: Array<{
    slideNumber: number
    slideTitle: string
    img: ImagePlaceholder
  }> = []

  slides.forEach((s) => {
    ;(s.images || []).forEach((img) => {
      allImages.push({ slideNumber: s.slideNumber, slideTitle: s.title, img })
    })
  })

  if (allImages.length === 0) {
    return `${pageBreak()}<div class="page content-page">
      <div class="section-header">
        <span class="section-badge">4</span>
        <div><div class="section-title">Anexo &mdash; Prompts de Im&aacute;genes IA</div></div>
      </div>
      <p style="color:#8A8785;font-style:italic">Sin im&aacute;genes registradas.</p>
    </div>`
  }

  const rows = allImages.map(({ slideNumber, slideTitle, img }) => `<tr>
    <td style="font-weight:700;text-align:center">${slideNumber}</td>
    <td>${esc(slideTitle)}</td>
    <td>${esc(img.label)}</td>
    <td><span class="badge" style="background:#EFF6FF;color:#2563EB">${esc(img.placement)}</span></td>
    <td><span class="badge" style="background:#E0F5EE;color:#1A7A5E">${esc(img.style)}</span></td>
    <td><div class="prompt-box" style="margin-top:0">${esc(img.suggestedPrompt)}</div></td>
  </tr>`).join('')

  return `${pageBreak()}<div class="page content-page">
    <div class="section-header">
      <span class="section-badge">4</span>
      <div>
        <div class="section-title">Anexo &mdash; Prompts de Im&aacute;genes IA</div>
        <div class="section-subtitle">Listos para usar en Midjourney, DALL&middot;E, Stable Diffusion, etc.</div>
      </div>
    </div>
    <p style="font-size:9pt;color:#4A4845;margin:0 0 16px 0;font-family:system-ui,sans-serif">Los siguientes prompts est&aacute;n listos para usar en generadores de imagen IA (Midjourney, DALL&middot;E, Stable Diffusion, etc.)</p>
    <table>
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th style="width:130px">Slide</th>
          <th style="width:100px">Etiqueta</th>
          <th style="width:90px">Placement</th>
          <th style="width:80px">Estilo</th>
          <th>Prompt</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`
}

function buildPitch(pitchData: PitchData | undefined): string {
  if (!pitchData) {
    return `${pageBreak()}<div class="page content-page">
      <div class="section-header">
        <span class="section-badge" style="background:#1A5276">P</span>
        <div>
          <div class="section-title">Gu&iacute;a de Pitch Narrativo</div>
          <div class="section-subtitle">Pitch no generado</div>
        </div>
      </div>
      <p style="color:#8A8785;font-style:italic">Los datos de pitch no est&aacute;n disponibles para este reporte.</p>
    </div>`
  }

  const { overallNarrative, sections } = pitchData

  // Timeline bar
  const timelineColors = ['#1A5276', '#2E86C1', '#5DADE2', '#85C1E9', '#AED6F1']
  const timelineBar = `<div style="display:flex;border-radius:8px;overflow:hidden;height:28px;margin-bottom:20px;border:1px solid #AED6F1">
    ${sections.map((s, i) => `<div style="flex:${s.durationPercent};background:${timelineColors[i % 5]};display:flex;align-items:center;justify-content:center;overflow:hidden">
      <span style="font-size:7.5pt;color:#fff;font-weight:700;font-family:system-ui,sans-serif;white-space:nowrap;padding:0 4px">${s.durationPercent}%</span>
    </div>`).join('')}
  </div>`

  // Section cards
  const sectionCards = sections.map((s) => {
    const actionsHtml = s.suggestedActions.map((a) => `<div style="font-size:9pt;color:#1A1A18;padding:3px 0 3px 16px;position:relative;font-family:system-ui,sans-serif">
      <span style="position:absolute;left:0;color:#2E86C1;font-weight:700">&rarr;</span>${esc(a)}
    </div>`).join('')

    const questionsHtml = s.keyQuestions.map((q, i) => `<div style="font-size:9pt;color:#1A1A18;padding:3px 0 3px 22px;position:relative;font-family:system-ui,sans-serif">
      <span style="position:absolute;left:0;background:#1A5276;color:#fff;border-radius:50%;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;font-size:7pt;font-weight:700">${i + 1}</span>
      <em>&ldquo;${esc(q)}&rdquo;</em>
    </div>`).join('')

    return `<div style="border:1.5px solid #AED6F1;border-radius:10px;margin-bottom:18px;overflow:hidden;page-break-inside:avoid">
      <div style="background:#1A5276;padding:10px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-family:system-ui,sans-serif;font-size:11pt;font-weight:700;color:#FFFFFF;flex:1">${esc(s.title)}</span>
        <span style="background:rgba(255,255,255,0.15);color:#FFFFFF;border-radius:10px;padding:2px 10px;font-size:8pt;font-weight:600;font-family:system-ui,sans-serif">${esc(s.slideRange)}</span>
        <span style="background:rgba(255,255,255,0.15);color:#FFFFFF;border-radius:10px;padding:2px 10px;font-size:8pt;font-weight:600;font-family:system-ui,sans-serif">${Math.round(s.durationSeconds / 60)}min &middot; ${s.durationPercent}%</span>
      </div>
      <div style="padding:14px 16px">
        <p style="margin:0 0 12px;font-size:10pt;color:#1A1A18;line-height:1.6;font-family:system-ui,sans-serif">${esc(s.narrativeSummary)}</p>
        <div style="background:#EBF5FB;border-left:4px solid #2E86C1;border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:12px;font-style:italic;color:#1A3E6F;font-size:9.5pt;font-family:system-ui,sans-serif">
          &#127908; <strong>Tono:</strong> ${esc(s.toneOfVoice)}
        </div>
        <div style="display:flex;gap:16px">
          <div style="flex:1">
            <div style="font-family:system-ui,sans-serif;font-size:8pt;font-weight:700;color:#1A5276;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Acciones sugeridas</div>
            ${actionsHtml || '<div style="font-size:9pt;color:#8A8785;font-family:system-ui,sans-serif">—</div>'}
          </div>
          <div style="flex:1">
            <div style="font-family:system-ui,sans-serif;font-size:8pt;font-weight:700;color:#1A5276;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Preguntas clave</div>
            ${questionsHtml || '<div style="font-size:9pt;color:#8A8785;font-family:system-ui,sans-serif">—</div>'}
          </div>
        </div>
      </div>
    </div>`
  }).join('')

  return `${pageBreak()}<div class="page content-page">
    <div class="section-header">
      <span class="section-badge" style="background:#1A5276">P</span>
      <div>
        <div class="section-title">Gu&iacute;a de Pitch Narrativo</div>
        <div class="section-subtitle">Narrativa global &middot; Timeline &middot; Secciones de pitch</div>
      </div>
    </div>

    <div style="background:#EBF5FB;border-left:5px solid #1A5276;padding:16px 20px;margin-bottom:20px;border-radius:0 8px 8px 0;font-style:italic;font-size:10.5pt;color:#1A3E6F;line-height:1.7;font-family:system-ui,sans-serif">
      ${esc(overallNarrative)}
    </div>

    <div class="subsection-title" style="color:#1A5276;border-bottom-color:#AED6F1">Timeline de secci&oacute;n</div>
    ${timelineBar}

    <div class="subsection-title" style="color:#1A5276;border-bottom-color:#AED6F1">Secciones de pitch</div>
    ${sectionCards}
  </div>`
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function generateAct3ReportHtml(data: Act3ReportData): string {
  const cover = buildCover(data)
  const toc = buildTOC(data)
  const act1 = buildAct1(data.zone1)
  const act2 = buildAct2(data.zone2)
  const pitch = buildPitch(data.pitchData)
  const lookAndFeel = buildAct3LookAndFeel(data.act3)
  const slides = buildAct3Slides(data.act3)
  const annex = buildImagePromptsAnnex(data.act3)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(data.zone1?.presentationName || data.zone2?.presentationTitle || 'Presentación')} · Reporte StoryVibe AI</title>
  ${buildStyles()}
</head>
<body>
  ${cover}
  ${toc}
  ${act1}
  ${act2}
  ${pitch}
  ${lookAndFeel}
  ${slides}
  ${annex}
</body>
</html>`
}
