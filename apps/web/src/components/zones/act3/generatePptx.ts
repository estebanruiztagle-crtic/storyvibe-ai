// generatePptx.ts
// Generates a real editable .pptx file using pptxgenjs (client-side only).
// Dynamically imported to avoid SSR issues in Next.js.

import type { Act3State } from './types'

// ─── Helper: convert hex to pptxgenjs color (no #) ────────────────────────────
function hex(color: string): string {
  return color.replace('#', '')
}

// ─── Helper: truncate long text ───────────────────────────────────────────────
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '…'
}

// ─── Main export function ─────────────────────────────────────────────────────
export async function generatePptx(state: Act3State, title?: string): Promise<void> {
  // Dynamic import to avoid SSR
  const PptxGenJS = (await import('pptxgenjs')).default

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 16:9 — 13.33" x 7.5"

  const palette = state.lookAndFeel.palette
  const bgColor = hex(palette.background)
  const fgColor = hex(palette.textColor)
  const accentColor = hex(palette.accent)
  const surfaceColor = hex(palette.surface)
  const primaryColor = hex(palette.primary)
  const secondaryColor = hex(palette.secondary)

  // ── Slide Master ────────────────────────────────────────────────────────────
  pptx.defineSlideMaster({
    title: 'STORYVIBE_MASTER',
    background: { color: bgColor },
    objects: [
      // Bottom accent bar
      {
        rect: {
          x: 0,
          y: 7.3,
          w: '100%',
          h: 0.2,
          fill: { color: accentColor },
        },
      },
    ],
    slideNumber: { x: 0.3, y: 7.1, color: fgColor, fontFace: 'Helvetica', fontSize: 9 },
  })

  // ── Typography settings based on lookAndFeel.typographyStyle ────────────────
  const fontFaceMap: Record<string, string> = {
    modern: 'Calibri',
    classic: 'Georgia',
    bold: 'Arial Black',
    elegant: 'Palatino Linotype',
    minimal: 'Helvetica',
  }
  const fontFace = fontFaceMap[state.lookAndFeel.typographyStyle] ?? 'Calibri'

  // ── Density → spacing multiplier ───────────────────────────────────────────
  const densityPad = state.lookAndFeel.visualDensity === 'clean' ? 1.0 :
    state.lookAndFeel.visualDensity === 'balanced' ? 0.8 : 0.65

  // ── Generate one slide per SlideContent ────────────────────────────────────
  for (const slide of state.slides) {
    const s = pptx.addSlide({ masterName: 'STORYVIBE_MASTER' })

    const padX = 0.5 * densityPad
    const padY = 0.4 * densityPad
    const contentW = 13.33 - padX * 2

    let cursorY = padY

    // ── Slide number label (top-left) ────────────────────────────────────────
    s.addText(`${slide.slideNumber}`, {
      x: 0.3,
      y: 0.1,
      w: 0.5,
      h: 0.22,
      fontSize: 9,
      color: fgColor,
      fontFace,
      align: 'left',
      transparency: 60,
    })

    // ── Emotion + intensity badge (top-right) ────────────────────────────────
    const emotionLabel = `${slide.emotion.toUpperCase()} · ${slide.intensity}/10`
    s.addText(emotionLabel, {
      x: 11.5,
      y: 0.1,
      w: 1.5,
      h: 0.22,
      fontSize: 8,
      color: accentColor,
      fontFace,
      align: 'right',
      bold: true,
    })

    cursorY = 0.45

    // ── Title ────────────────────────────────────────────────────────────────
    s.addText(slide.title, {
      x: padX,
      y: cursorY,
      w: contentW,
      h: 1.1,
      fontSize: 28,
      bold: true,
      color: fgColor,
      fontFace,
      align: 'left',
      wrap: true,
      autoFit: true,
    })
    cursorY += 1.1

    // ── Subtitle ─────────────────────────────────────────────────────────────
    if (slide.subtitle) {
      s.addText(slide.subtitle, {
        x: padX,
        y: cursorY,
        w: contentW,
        h: 0.5,
        fontSize: 16,
        color: fgColor,
        fontFace,
        align: 'left',
        italic: true,
        transparency: 30,
        wrap: true,
        autoFit: true,
      })
      cursorY += 0.55
    }

    // ── Body text ────────────────────────────────────────────────────────────
    if (slide.bodyText) {
      s.addText(slide.bodyText, {
        x: padX,
        y: cursorY,
        w: contentW * 0.75,
        h: 1.0,
        fontSize: 12,
        color: fgColor,
        fontFace,
        align: 'left',
        wrap: true,
        autoFit: true,
        transparency: 10,
      })
      cursorY += 1.05
    }

    // ── Bullets ──────────────────────────────────────────────────────────────
    if (slide.bullets && slide.bullets.length > 0) {
      const bulletItems = slide.bullets.map((b) => ({
        text: b,
        options: {
          bullet: { code: '25CF', color: accentColor },
          fontSize: 12,
          color: fgColor,
          fontFace,
          paraSpaceAfter: 6,
        },
      }))
      s.addText(bulletItems, {
        x: padX,
        y: cursorY,
        w: contentW * 0.75,
        h: Math.min(slide.bullets.length * 0.32 + 0.1, 2.5),
        fontFace,
        autoFit: true,
        wrap: true,
      })
      cursorY += Math.min(slide.bullets.length * 0.32 + 0.2, 2.6)
    }

    // ── Image placeholders (right column or inline) ──────────────────────────
    if (slide.images && slide.images.length > 0) {
      const imgStartX = slide.bodyText || (slide.bullets && slide.bullets.length > 0)
        ? contentW * 0.75 + padX + 0.1
        : padX
      const imgW = slide.bodyText || (slide.bullets && slide.bullets.length > 0)
        ? contentW * 0.22
        : contentW * 0.45
      let imgY = 0.45 + (slide.subtitle ? 0.55 : 0) + 1.1

      for (const img of slide.images.slice(0, 3)) {
        const imgH = imgW * 0.6
        // Colored rectangle placeholder
        s.addShape(pptx.ShapeType.rect, {
          x: imgStartX,
          y: imgY,
          w: imgW,
          h: imgH,
          fill: { color: secondaryColor },
          line: { color: accentColor, width: 1, dashType: 'dash' },
        })
        // Label text on placeholder
        s.addText(`[${img.label}]\n${truncate(img.suggestedPrompt, 60)}`, {
          x: imgStartX + 0.05,
          y: imgY + 0.05,
          w: imgW - 0.1,
          h: imgH - 0.1,
          fontSize: 7,
          color: fgColor,
          fontFace,
          align: 'center',
          valign: 'middle',
          wrap: true,
          transparency: 20,
        })
        imgY += imgH + 0.1
      }
    }

    // ── Call to Action ───────────────────────────────────────────────────────
    if (slide.callToAction) {
      const ctaY = 6.5
      const ctaW = Math.min(slide.callToAction.length * 0.12 + 0.5, 4)
      const ctaX = padX

      // CTA background box
      s.addShape(pptx.ShapeType.rect, {
        x: ctaX,
        y: ctaY,
        w: ctaW,
        h: 0.45,
        fill: { color: accentColor },
        line: { color: accentColor },
      })
      s.addText(slide.callToAction, {
        x: ctaX + 0.1,
        y: ctaY,
        w: ctaW - 0.2,
        h: 0.45,
        fontSize: 12,
        bold: true,
        color: 'FFFFFF',
        fontFace,
        align: 'center',
        valign: 'middle',
      })
    }

    // ── Speaker notes ────────────────────────────────────────────────────────
    if (slide.speakerNotes) {
      s.addNotes(slide.speakerNotes)
    }
  }

  // ── Download ─────────────────────────────────────────────────────────────────
  const fileName = (title || 'presentacion').replace(/[^a-zA-Z0-9_-]/g, '_')
  await pptx.writeFile({ fileName })
}
