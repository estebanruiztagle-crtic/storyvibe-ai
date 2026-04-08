import type { Act3State } from './types'

// ─── HTML Escape Helper ───────────────────────────────────────────────────────

function esc(s: unknown): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── HTML Builder ─────────────────────────────────────────────────────────────

function buildSlidesPdfHtml(state: Act3State, title?: string): string {
  const { slides, lookAndFeel } = state
  const palette = lookAndFeel.palette
  const presentationTitle = title ?? 'Presentación'
  const total = slides.length

  const css = `
    *, *::before, *::after { box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; padding: 0; background: #111; font-family: system-ui, -apple-system, sans-serif; }
    .slide {
      width: 29.7cm; height: 21cm;
      display: flex; flex-direction: column;
      page-break-after: always; page-break-inside: avoid;
      overflow: hidden; position: relative;
    }
    .slide:last-child { page-break-after: avoid; }
    @page { size: A4 landscape; margin: 0; }
    @media print { body { background: #000; } .slide { width: 100vw; height: 100vh; } }
    .slide-inner {
      flex: 1; display: flex; flex-direction: column;
      padding: 1cm 1.4cm 0.8cm;
    }
    .slide-number {
      position: absolute; top: 0.5cm; right: 0.8cm;
      font-size: 9pt; font-weight: 700; opacity: 0.4;
    }
    .slide-title { font-size: 28pt; font-weight: 800; line-height: 1.1; margin: 0 0 8px; letter-spacing: -0.02em; }
    .slide-subtitle { font-size: 14pt; opacity: 0.7; margin: 0 0 20px; font-style: italic; }
    .slide-body { font-size: 12pt; line-height: 1.6; opacity: 0.85; margin-bottom: 16px; }
    .bullet-list { margin: 0 0 16px; padding: 0; list-style: none; }
    .bullet-list li { padding: 6px 0 6px 24px; position: relative; font-size: 12pt; line-height: 1.4; }
    .bullet-list li::before { content: '▸'; position: absolute; left: 0; opacity: 0.6; font-size: 10pt; top: 8px; }
    .cta-box {
      border-radius: 8px; padding: 12px 18px; margin-top: auto; margin-bottom: 4px;
      font-size: 13pt; font-weight: 700;
    }
    .img-placeholder {
      border-radius: 8px; padding: 14px 18px;
      margin-top: 12px;
      border: 2px dashed rgba(255,255,255,0.25);
    }
    .img-label { font-size: 8pt; font-weight: 700; letter-spacing: 0.1em; opacity: 0.5; text-transform: uppercase; margin-bottom: 6px; }
    .img-prompt { font-family: 'Courier New', monospace; font-size: 8.5pt; opacity: 0.55; line-height: 1.5; }
    .slide-footer {
      height: 6px; flex-shrink: 0; border-radius: 0 0 0 0;
    }
    .header-bar { height: 8px; flex-shrink: 0; }
    .duration-badge {
      position: absolute; bottom: 16px; right: 16px;
      font-size: 8pt; font-weight: 600; opacity: 0.5;
      background: rgba(255,255,255,0.1); border-radius: 10px; padding: 2px 10px;
    }
  `

  // Cover slide
  const coverSlide = `<div class="slide" style="background:${esc(palette.background)};color:${esc(palette.textColor)}">
    <div class="header-bar" style="background:${esc(palette.primary)}"></div>
    <div class="slide-inner" style="justify-content:center;align-items:flex-start">
      <div style="font-size:11pt;font-weight:700;opacity:0.4;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:24px">StoryVibe AI</div>
      <div style="font-size:36pt;font-weight:800;line-height:1.1;letter-spacing:-0.02em;margin-bottom:16px">${esc(presentationTitle)}</div>
      <div style="font-size:13pt;opacity:0.5;font-style:italic">${total} slide${total !== 1 ? 's' : ''} · ${esc(palette.name)}</div>
      <div style="margin-top:auto;font-size:9pt;opacity:0.3">${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="slide-footer" style="background:${esc(palette.accent)}"></div>
  </div>`

  // Content slides
  const slideHtml = slides.map((s, idx) => {
    const slideNumber = idx + 1
    const images = s.images ?? []
    const durationSeconds = s.durationSeconds

    const subtitleHtml = s.subtitle
      ? `<div class="slide-subtitle">${esc(s.subtitle)}</div>`
      : ''

    const bodyHtml = s.bodyText
      ? `<div class="slide-body">${esc(s.bodyText)}</div>`
      : ''

    const bulletsHtml = s.bullets && s.bullets.length > 0
      ? `<ul class="bullet-list">${s.bullets.map((b) => `<li style="color:${esc(palette.textColor)}">${esc(b)}</li>`).join('')}</ul>`
      : ''

    const ctaHtml = s.callToAction
      ? `<div class="cta-box" style="background:${esc(palette.accent)}22;color:${esc(palette.accent)};border:1.5px solid ${esc(palette.accent)}44">${esc(s.callToAction)}</div>`
      : ''

    const imagesHtml = images.length > 0
      ? images.map((img) => `<div class="img-placeholder">
          <div class="img-label">◧ ${esc(img.label)} · ${esc(img.placement)} · ${esc(img.style)}</div>
          <div class="img-prompt">${esc(img.suggestedPrompt.slice(0, 180))}${img.suggestedPrompt.length > 180 ? '…' : ''}</div>
        </div>`).join('')
      : ''

    const notesHtml = s.speakerNotes
      ? `<div style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);font-size:8pt;opacity:0.4;font-style:italic">${esc(s.speakerNotes)}</div>`
      : ''

    const durationHtml = durationSeconds
      ? `<div class="duration-badge">${Math.round(durationSeconds / 60) > 0 ? Math.round(durationSeconds / 60) + 'm ' : ''}${durationSeconds % 60 > 0 ? (durationSeconds % 60) + 's' : ''}</div>`
      : ''

    return `<div class="slide" style="background:${esc(palette.background)};color:${esc(palette.textColor)}">
      <div class="header-bar" style="background:${esc(palette.primary)}"></div>
      <div class="slide-inner">
        <div class="slide-number" style="color:${esc(palette.textColor)}">${slideNumber} / ${total}</div>
        <div class="slide-title">${esc(s.title)}</div>
        ${subtitleHtml}
        ${bodyHtml}
        ${bulletsHtml}
        ${ctaHtml}
        ${imagesHtml}
        ${notesHtml}
        ${durationHtml}
      </div>
      <div class="slide-footer" style="background:${esc(palette.accent)}"></div>
    </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(presentationTitle)}</title>
  <style>${css}</style>
</head>
<body>
  ${coverSlide}
  ${slideHtml}
</body>
</html>`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateSlidesPdf(state: Act3State, title?: string): void {
  const html = buildSlidesPdfHtml(state, title)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 500)
}
