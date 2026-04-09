// exportPptx.ts — Pixel-perfect PPTX export
// Captures each slide's rendered DOM element as a PNG via html-to-image,
// then embeds it as a full-bleed image in a pptxgenjs slide.

export async function generateZone3Pptx(
  slideElements: HTMLElement[],
  title?: string,
): Promise<void> {
  if (slideElements.length === 0) throw new Error('No hay láminas para exportar')

  // Dynamic imports — avoid SSR
  const [{ toPng }, PptxGenJSModule] = await Promise.all([
    import('html-to-image'),
    import('pptxgenjs'),
  ])
  const PptxGenJS = PptxGenJSModule.default

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33" × 7.5" — 16:9

  for (const el of slideElements) {
    // Capture the rendered slide as a PNG data URL (1280×720)
    const dataUrl = await toPng(el, {
      width:  1280,
      height: 720,
      pixelRatio: 1,
      skipFonts: false,
    })

    // Add a slide with the image covering the full surface
    const s = pptx.addSlide()
    s.addImage({
      data: dataUrl,
      x: 0, y: 0,
      w: '100%', h: '100%',
    })
  }

  const fileName = (title ?? 'presentacion_storyvibe').replace(/[^a-zA-Z0-9_\- ]/g, '_')
  await pptx.writeFile({ fileName })
}
