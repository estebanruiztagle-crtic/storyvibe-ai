// exportPptx.ts — Generates a .pptx from Zone3State (client-side only)
// Uses pptxgenjs; dynamically imported to avoid SSR issues.

import type { Zone3State, Zone3Slide, ColorSwatch } from './types'

function hex(color: string): string {
  return color.replace('#', '')
}

function swatch(swatches: ColorSwatch[], role: ColorSwatch['role'], fallback: string): string {
  return hex(swatches.find((s) => s.role === role)?.hex ?? fallback)
}

// Fetch a remote image and return its base64 data
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve((reader.result as string).split(',')[1] ?? '')
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function imageExtension(mimeType?: string): 'jpg' | 'png' | 'gif' | 'webp' {
  if (!mimeType) return 'jpg'
  if (mimeType.includes('png'))  return 'png'
  if (mimeType.includes('gif'))  return 'gif'
  if (mimeType.includes('webp')) return 'webp'
  return 'jpg'
}

export async function generateZone3Pptx(
  state: Zone3State,
  title?: string,
  zone1ContextJson?: string,
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33" × 7.5" — 16:9

  const sw = state.palette?.swatches ?? []
  const bg       = swatch(sw, 'background', '#FFFFFF')
  const primary  = swatch(sw, 'primary',    '#1A2F4E')
  const accent   = swatch(sw, 'accent',     '#10B981')
  const neutral  = swatch(sw, 'neutral',    '#6B7280')
  const secondary = swatch(sw, 'secondary', '2563EB')

  // ── Master ──────────────────────────────────────────────────────────────────
  pptx.defineSlideMaster({
    title: 'SV_MASTER',
    background: { color: bg },
    objects: [
      { rect: { x: 0, y: 7.3, w: '100%', h: 0.2, fill: { color: accent } } },
    ],
    slideNumber: { x: 0.3, y: 7.1, color: neutral, fontFace: 'Calibri', fontSize: 9 },
  })

  // ── Cover slide ─────────────────────────────────────────────────────────────
  const cover = pptx.addSlide({ masterName: 'SV_MASTER' })
  const presTitle = title ?? 'Presentación StoryVibe'

  // Left color band
  cover.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.25, h: 7.5,
    fill: { color: accent },
    line: { color: accent },
  })
  // Title
  cover.addText(presTitle, {
    x: 0.55, y: 2.2, w: 9, h: 2,
    fontSize: 40, bold: true, color: primary, fontFace: 'Calibri', wrap: true, autoFit: true,
  })
  // Mood line
  if (state.palette?.mood) {
    cover.addText(state.palette.mood, {
      x: 0.55, y: 4.4, w: 9, h: 0.5,
      fontSize: 14, italic: true, color: neutral, fontFace: 'Calibri',
    })
  }
  // Palette swatches (bottom-right)
  sw.forEach((s, i) => {
    cover.addShape(pptx.ShapeType.rect, {
      x: 10.5 + i * 0.55, y: 6.7, w: 0.45, h: 0.45,
      fill: { color: hex(s.hex) },
      line: { color: hex(s.hex) },
    })
  })
  // StoryVibe label
  cover.addText('StoryVibe AI · Diseño Visual', {
    x: 0.55, y: 6.9, w: 6, h: 0.3,
    fontSize: 9, color: neutral, fontFace: 'Calibri', transparency: 30,
  })

  // ── Content slides ──────────────────────────────────────────────────────────
  const slides = state.slides.length > 0 ? state.slides : []

  for (const slide of slides) {
    const hasImage = !!(slide.generatedImage?.url || slide.uploadedAsset?.dataUrl)
    const s = pptx.addSlide({ masterName: 'SV_MASTER' })

    // ── Slide number + emotion badge ────────────────────────────────────────
    s.addText(`${slide.slide}`, {
      x: 0.3, y: 0.1, w: 0.4, h: 0.22,
      fontSize: 9, color: neutral, fontFace: 'Calibri', transparency: 50,
    })
    s.addText(`${slide.emotion.toUpperCase()} · ${slide.intensity}/10`, {
      x: 11, y: 0.1, w: 2, h: 0.22,
      fontSize: 8, bold: true, color: accent, fontFace: 'Calibri', align: 'right',
    })

    // ── Layout: image on right half, text on left ───────────────────────────
    const textW = hasImage ? 6.2 : 12.5
    const padX  = 0.5
    let   curY  = 0.55

    // Title
    s.addText(slide.fullLabel || slide.label, {
      x: padX, y: curY, w: textW, h: 1.4,
      fontSize: 26, bold: true, color: primary, fontFace: 'Calibri', wrap: true, autoFit: true,
    })
    curY += 1.45

    // Emotion type badge
    const typeColor = slide.type === 'peak' ? accent : slide.type === 'valley' ? secondary : neutral
    s.addShape(pptx.ShapeType.roundRect, {
      x: padX, y: curY, w: 1.4, h: 0.3,
      fill: { color: typeColor }, line: { color: typeColor }, rectRadius: 0.08,
    })
    s.addText(slide.type.toUpperCase(), {
      x: padX, y: curY, w: 1.4, h: 0.3,
      fontSize: 8, bold: true, color: 'FFFFFF', fontFace: 'Calibri', align: 'center', valign: 'middle',
    })
    curY += 0.45

    // Graphic suggestion content
    if (slide.graphicSuggestion) {
      s.addText(slide.graphicSuggestion.title, {
        x: padX, y: curY, w: textW, h: 0.45,
        fontSize: 13, color: primary, fontFace: 'Calibri', wrap: true, autoFit: true,
      })
      curY += 0.5
      s.addText(slide.graphicSuggestion.description, {
        x: padX, y: curY, w: textW, h: 1.0,
        fontSize: 11, color: neutral, fontFace: 'Calibri', wrap: true, autoFit: true, transparency: 15,
      })
    }

    // ── Image (right column) ─────────────────────────────────────────────────
    if (hasImage) {
      const imgX = 7.0
      const imgY = 0.45
      const imgW = 5.9
      const imgH = 6.3

      if (slide.generatedImage?.url) {
        const b64 = await urlToBase64(slide.generatedImage.url)
        if (b64) {
          const ext = slide.generatedImage.style === 'realistic_image' ? 'jpg' : 'png'
          s.addImage({ data: `image/${ext};base64,${b64}`, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'cover', w: imgW, h: imgH } })
        } else {
          // Fallback placeholder rect
          s.addShape(pptx.ShapeType.rect, { x: imgX, y: imgY, w: imgW, h: imgH, fill: { color: secondary }, line: { color: accent } })
          s.addText('[Imagen IA]', { x: imgX, y: imgY + imgH / 2 - 0.2, w: imgW, h: 0.4, fontSize: 10, color: neutral, align: 'center', fontFace: 'Calibri' })
        }
      } else if (slide.uploadedAsset?.dataUrl) {
        const dataUrl = slide.uploadedAsset.dataUrl
        const ext = imageExtension(slide.uploadedAsset.mimeType)
        const b64 = dataUrl.split(',')[1] ?? dataUrl
        s.addImage({ data: `image/${ext};base64,${b64}`, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'cover', w: imgW, h: imgH } })
      }
    }

    // ── Speaker note: why + layout ──────────────────────────────────────────
    const notes: string[] = []
    if (slide.graphicSuggestion?.why) notes.push(`Por qué este visual: ${slide.graphicSuggestion.why}`)
    if (slide.selectedLayout) notes.push(`Layout: ${slide.selectedLayout}`)
    if (slide.generatedImage?.prompt) notes.push(`Prompt Recraft: ${slide.generatedImage.prompt}`)
    if (notes.length > 0) s.addNotes(notes.join('\n\n'))
  }

  const fileName = (title ?? 'presentacion_storyvibe').replace(/[^a-zA-Z0-9_-]/g, '_')
  await pptx.writeFile({ fileName })
}
