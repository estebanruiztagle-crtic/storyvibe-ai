// exportPdf.ts — Generates a printable PDF report from Zone3State + context
// Uses a hidden <iframe> with print-ready HTML and triggers window.print().

import type { Zone3State } from './types'

interface Zone1Context {
  presentationName?: string
  sector?: string
  targetAudience?: string
  objective?: string
  tone?: string
}

interface Zone2Data {
  selectedFrameworkId?: string
  frameworks?: Array<{ id: string; name: string; fitScore?: number }>
  curvePoints?: Array<{ slide: number; label: string; type: string; emotion: string; intensity: number }>
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

import type { ColorSwatch } from './types'

function paletteBar(swatches: ColorSwatch[]): string {
  return swatches
    .map((s) => `<span style="display:inline-block;width:32px;height:32px;background:${s.hex};border-radius:6px;margin-right:6px;vertical-align:middle;" title="${escHtml(s.name)} (${escHtml(s.role)})"></span>`)
    .join('')
}

export function generateZone3Pdf(
  state: Zone3State,
  title?: string,
  zone1ContextJson?: string,
  zone2DataJson?: string,
): void {
  const presTitle = title ?? 'Presentación StoryVibe'

  let z1: Zone1Context = {}
  let z2: Zone2Data = {}
  try { z1 = zone1ContextJson ? JSON.parse(zone1ContextJson) : {} } catch { /* */ }
  try { z2 = zone2DataJson    ? JSON.parse(zone2DataJson)    : {} } catch { /* */ }

  const primary  = state.palette?.swatches.find((s) => s.role === 'primary')?.hex    ?? '#1A2F4E'
  const accent   = state.palette?.swatches.find((s) => s.role === 'accent')?.hex     ?? '#10B981'
  const bgColor  = state.palette?.swatches.find((s) => s.role === 'background')?.hex ?? '#FFFFFF'

  const selectedFw = z2.frameworks?.find((f) => f.id === z2.selectedFrameworkId)

  // ── Slides HTML ─────────────────────────────────────────────────────────────
  const slideRows = state.slides.map((sl) => {
    const typeColor = sl.type === 'peak' ? '#10B981' : sl.type === 'valley' ? '#2563EB' : '#6B7280'
    const imageHtml = sl.generatedImage?.url
      ? `<img src="${escHtml(sl.generatedImage.url)}" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
      : sl.uploadedAsset?.dataUrl && sl.uploadedAsset.fileType === 'image'
        ? `<img src="${escHtml(sl.uploadedAsset.dataUrl)}" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
        : ''

    return `
      <div style="break-inside:avoid;margin-bottom:24px;padding:20px;border:1.5px solid #E5E2DA;border-radius:12px;background:#FAFAF8;">
        <div style="display:flex;align-items:flex-start;gap:16px;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="font-size:11px;font-weight:700;color:#FFF;background:${typeColor};border-radius:20px;padding:2px 10px;">${escHtml(sl.type.toUpperCase())}</span>
              <span style="font-size:11px;color:#6B7280;">Lámina ${sl.slide} · ${escHtml(sl.emotion)} · ${sl.intensity}/10</span>
              ${sl.approved ? '<span style="font-size:11px;color:#10B981;font-weight:700;">✓ Aprobada</span>' : ''}
            </div>
            <h3 style="margin:0 0 6px;font-size:16px;font-weight:700;color:${primary};line-height:1.3;">${escHtml(sl.fullLabel || sl.label)}</h3>
            ${sl.graphicSuggestion ? `
              <div style="margin-top:8px;padding:10px;background:#F1EFE8;border-radius:8px;">
                <div style="font-size:11px;font-weight:700;color:${primary};margin-bottom:4px;">${escHtml(sl.graphicSuggestion.title)}</div>
                <div style="font-size:11px;color:#6B7280;line-height:1.5;">${escHtml(sl.graphicSuggestion.description)}</div>
                <div style="font-size:10px;color:#9B9895;margin-top:4px;font-style:italic;">${escHtml(sl.graphicSuggestion.why)}</div>
              </div>
            ` : ''}
            ${sl.selectedLayout ? `<div style="margin-top:8px;font-size:10px;color:#9B9895;">Layout: <strong>${escHtml(sl.selectedLayout)}</strong></div>` : ''}
          </div>
          ${imageHtml ? `<div style="width:240px;flex-shrink:0;">${imageHtml}</div>` : ''}
        </div>
      </div>`
  }).join('')

  // ── Full HTML ────────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escHtml(presTitle)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #FFF; color: #1A1A18; margin: 0; padding: 0; }
    @page { size: A4; margin: 20mm 16mm; }
    @media print { .no-print { display: none !important; } }
    .page-break { page-break-after: always; }
    h1, h2, h3, p { margin: 0; }
  </style>
</head>
<body>

<!-- ── Cover ──────────────────────────────────────────────────────────────── -->
<div style="min-height:240px;padding:48px 40px 40px;background:${primary};border-radius:0 0 20px 20px;margin-bottom:40px;">
  <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${accent};margin-bottom:16px;">StoryVibe AI · Reporte de Diseño Visual</div>
  <h1 style="font-size:36px;font-weight:900;color:#FFFFFF;line-height:1.2;margin-bottom:16px;">${escHtml(presTitle)}</h1>
  ${state.palette?.mood ? `<p style="font-size:14px;color:#FFFFFF;opacity:0.7;font-style:italic;margin-bottom:24px;">${escHtml(state.palette.mood)}</p>` : ''}
  ${state.palette ? `<div style="margin-top:8px;">${paletteBar(state.palette.swatches)}</div>` : ''}
</div>

<!-- ── Context ────────────────────────────────────────────────────────────── -->
<div style="padding:0 8px;margin-bottom:32px;">
  <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9B9895;margin-bottom:16px;">Contexto del proyecto</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    ${z1.sector       ? `<div style="padding:12px;background:#F1EFE8;border-radius:8px;"><div style="font-size:10px;color:#9B9895;margin-bottom:4px;">SECTOR</div><div style="font-size:13px;font-weight:600;">${escHtml(z1.sector)}</div></div>` : ''}
    ${z1.targetAudience ? `<div style="padding:12px;background:#F1EFE8;border-radius:8px;"><div style="font-size:10px;color:#9B9895;margin-bottom:4px;">AUDIENCIA</div><div style="font-size:13px;font-weight:600;">${escHtml(z1.targetAudience)}</div></div>` : ''}
    ${z1.objective    ? `<div style="padding:12px;background:#F1EFE8;border-radius:8px;grid-column:1/-1;"><div style="font-size:10px;color:#9B9895;margin-bottom:4px;">OBJETIVO</div><div style="font-size:13px;font-weight:600;">${escHtml(z1.objective)}</div></div>` : ''}
    ${selectedFw      ? `<div style="padding:12px;background:#E6F1FB;border-radius:8px;"><div style="font-size:10px;color:#9B9895;margin-bottom:4px;">FRAMEWORK NARRATIVO</div><div style="font-size:13px;font-weight:600;">${escHtml(selectedFw.name)}</div></div>` : ''}
    ${state.palette?.rationale ? `<div style="padding:12px;background:#E1F5EE;border-radius:8px;grid-column:1/-1;"><div style="font-size:10px;color:#9B9895;margin-bottom:4px;">PALETA DE COLORES</div><div style="font-size:13px;">${escHtml(state.palette.rationale)}</div></div>` : ''}
  </div>
</div>

<!-- ── Slides ─────────────────────────────────────────────────────────────── -->
<div style="padding:0 8px;">
  <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9B9895;margin-bottom:16px;">Láminas (${state.slides.length})</h2>
  ${slideRows || '<p style="color:#9B9895;font-size:13px;">Sin láminas disponibles.</p>'}
</div>

<!-- ── Footer ─────────────────────────────────────────────────────────────── -->
<div style="margin-top:48px;padding:20px 8px;border-top:1.5px solid #E5E2DA;text-align:center;font-size:10px;color:#B8B4AA;">
  Generado por StoryVibe AI · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
</div>

</body>
</html>`

  // ── Print via hidden iframe ─────────────────────────────────────────────────
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for images to load before printing
  const imgs = Array.from(doc.querySelectorAll('img'))
  const imgsLoaded = imgs.length === 0
    ? Promise.resolve()
    : Promise.all(imgs.map((img) =>
        new Promise<void>((res) => {
          if ((img as HTMLImageElement).complete) { res(); return }
          img.addEventListener('load',  () => res())
          img.addEventListener('error', () => res())
        })
      ))

  imgsLoaded.then(() => {
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 2000)
    }, 300)
  })
}
