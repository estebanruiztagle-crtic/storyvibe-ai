// generateDocx.ts
// Generates a real editable .docx Word document using the docx npm package (client-side only).

import type { Act3ReportData } from './generateAct3Report'

// ─── Helper: safe string ──────────────────────────────────────────────────────
function safe(value: unknown): string {
  if (value === null || value === undefined) return '—'
  return String(value).trim() || '—'
}

// ─── Helper: format ISO date ──────────────────────────────────────────────────
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

// ─── Main export function ─────────────────────────────────────────────────────
export async function generateDocx(data: Act3ReportData): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
    PageBreak,
    ShadingType,
  } = await import('docx')

  const { zone1, zone2, act3 } = data

  // ── Helpers ────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type DocChild = any

  function heading1(text: string) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 160 },
    })
  }

  function heading2(text: string) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 120 },
    })
  }

  function heading3(text: string) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 80 },
    })
  }

  function body(text: string, options?: { bold?: boolean; italic?: boolean }) {
    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: options?.bold,
          italics: options?.italic,
          size: 22, // 11pt
        }),
      ],
      spacing: { before: 60, after: 60 },
    })
  }

  function labelValue(label: string, value: string) {
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 22 }),
        new TextRun({ text: value, size: 22 }),
      ],
      spacing: { before: 60, after: 60 },
    })
  }

  function bullet(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, size: 22 })],
      bullet: { level: 0 },
      spacing: { before: 40, after: 40 },
    })
  }

  function divider() {
    return new Paragraph({
      children: [],
      border: {
        bottom: {
          color: 'E5E2DA',
          space: 4,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      spacing: { before: 160, after: 160 },
    })
  }

  function pageBreak() {
    return new Paragraph({
      children: [new PageBreak()],
    })
  }

  function infoTable(rows: Array<[string, string]>) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: label, bold: true, size: 20 })],
                    spacing: { before: 60, after: 60 },
                  }),
                ],
                shading: { type: ShadingType.SOLID, color: 'F7F7F5', fill: 'F7F7F5' },
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: value, size: 20 })],
                    spacing: { before: 60, after: 60 },
                  }),
                ],
              }),
            ],
          })
      ),
    })
  }

  // ── Document children array ────────────────────────────────────────────────
  const children: DocChild[] = []

  // ─────────────────────────────────────────────────────────────────────────────
  // TITLE PAGE
  // ─────────────────────────────────────────────────────────────────────────────
  const presentationTitle = zone2?.presentationTitle || act3.lookAndFeel.palette.name || 'Presentación'

  children.push(
    new Paragraph({
      children: [new TextRun({ text: presentationTitle, bold: true, size: 56 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'StoryVibe AI — Reporte', size: 32, color: '6B3FA0' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: fmtDate(data.generatedAt), size: 24, color: '9B9895' }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 800 },
    }),
    divider(),
    pageBreak()
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTO 1 — DIAGNÓSTICO
  // ─────────────────────────────────────────────────────────────────────────────
  children.push(heading1('Acto #1 — Diagnóstico'))

  if (zone1) {
    // Evento
    children.push(heading2('Evento'))
    children.push(
      infoTable([
        ['Tipo', safe(zone1.event.type)],
        ['Nombre', safe(zone1.event.name)],
        ['Fecha', safe(zone1.event.date)],
        ['Formato', safe(zone1.event.format)],
        ['Duración', zone1.event.durationMinutes ? `${zone1.event.durationMinutes} min` : '—'],
        ['Q&A', zone1.event.qaMinutes ? `${zone1.event.qaMinutes} min` : '—'],
        ['Idioma', safe(zone1.event.language)],
        ['Lugar', safe(zone1.event.location)],
        ['Formalidad', `${zone1.event.formalityLevel ?? '—'}/10`],
      ])
    )
    children.push(new Paragraph({ children: [], spacing: { before: 200 } }))

    // Audiencia
    children.push(heading2('Audiencia'))
    children.push(
      infoTable([
        ['Tamaño', zone1.audience.size ? `${zone1.audience.size} personas` : '—'],
        ['Baseline emocional', safe(zone1.audience.emotionalBaseline)],
        ['Motivación primaria', safe(zone1.audience.primaryMotivation)],
        ['Miedo primario', safe(zone1.audience.primaryFear)],
        ['Atención estimada', zone1.audience.attentionMinutes ? `${zone1.audience.attentionMinutes} min` : '—'],
        ['Familiaridad', safe(zone1.audience.familiarity)],
      ])
    )
    if (zone1.audience.segments && zone1.audience.segments.length > 0) {
      children.push(heading3('Segmentos'))
      for (const seg of zone1.audience.segments) {
        children.push(body(`${seg.role} (${seg.percentage}%) — ${seg.description}`))
      }
    }
    children.push(new Paragraph({ children: [], spacing: { before: 200 } }))

    // Objetivo
    children.push(heading2('Objetivo'))
    children.push(
      infoTable([
        ['Primario', safe(zone1.objective.primary)],
        ['Acción deseada', safe(zone1.objective.desiredAction)],
        ['Métrica de éxito', safe(zone1.objective.successMetric)],
        ['Deben recordar', safe(zone1.objective.mustRemember)],
        ['Deben sentir', safe(zone1.objective.mustFeel)],
      ])
    )
    children.push(new Paragraph({ children: [], spacing: { before: 200 } }))

    // Tono
    children.push(heading2('Tono y Narrativa'))
    children.push(
      infoTable([
        ['Tono primario', safe(zone1.tone.primary)],
        ['Arco narrativo', safe(zone1.tone.narrativeArc)],
        ['Gancho', safe(zone1.tone.hook)],
        ['Prueba social', safe(zone1.tone.proof)],
        ['Apertura', safe(zone1.tone.arc.opening)],
        ['Desarrollo', safe(zone1.tone.arc.middle)],
        ['Cierre', safe(zone1.tone.arc.closing)],
      ])
    )
    children.push(new Paragraph({ children: [], spacing: { before: 200 } }))

    // Restricciones
    children.push(heading2('Restricciones'))
    if (zone1.constraints.avoidTopics && zone1.constraints.avoidTopics.length > 0) {
      children.push(labelValue('Temas a evitar', zone1.constraints.avoidTopics.join(', ')))
    }
    if (zone1.constraints.mandatoryTopics && zone1.constraints.mandatoryTopics.length > 0) {
      children.push(labelValue('Temas obligatorios', zone1.constraints.mandatoryTopics.join(', ')))
    }
    if (zone1.constraints.previousContext) {
      children.push(labelValue('Contexto previo', zone1.constraints.previousContext))
    }

    // Riesgos
    if (zone1.riskFlags && zone1.riskFlags.length > 0) {
      children.push(heading2('Alertas de Riesgo'))
      for (const flag of zone1.riskFlags) {
        children.push(body(`[${flag.severity.toUpperCase()}] ${flag.title}`, { bold: true }))
        if (flag.mitigation) {
          children.push(body(`Mitigación: ${flag.mitigation}`, { italic: true }))
        }
      }
    }
  } else {
    children.push(body('Datos de Acto #1 no disponibles.', { italic: true }))
  }

  children.push(divider(), pageBreak())

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTO 2 — NARRATIVA
  // ─────────────────────────────────────────────────────────────────────────────
  children.push(heading1('Acto #2 — Narrativa'))

  if (zone2) {
    if (zone2.presentationTitle) {
      children.push(labelValue('Título de la presentación', zone2.presentationTitle))
    }
    if (zone2.narrativeBrief) {
      children.push(heading2('Brief Narrativo'))
      children.push(body(zone2.narrativeBrief, { italic: true }))
    }

    // Framework seleccionado
    if (zone2.selectedFrameworkId && zone2.frameworks) {
      const fw = zone2.frameworks.find((f) => f.id === zone2.selectedFrameworkId)
      if (fw) {
        children.push(heading2('Framework Narrativo Seleccionado'))
        children.push(
          infoTable([
            ['Nombre', fw.name],
            ['Origen', fw.origin],
            ['Fit Score', `${fw.fitScore}%`],
            ['Descripción', fw.description],
            ['Riesgo', fw.risk],
          ])
        )
        if (fw.fitReasons && fw.fitReasons.length > 0) {
          children.push(heading3('Razones de fit'))
          for (const r of fw.fitReasons) {
            children.push(bullet(r))
          }
        }
        if (fw.emotionalArc && fw.emotionalArc.length > 0) {
          children.push(heading3('Arco emocional'))
          children.push(body(fw.emotionalArc.join(' → ')))
        }
      }
    }

    // Curva emocional
    if (zone2.curvePoints && zone2.curvePoints.length > 0) {
      children.push(heading2(`Curva Emocional (${zone2.curvePoints.length} puntos)`))
      for (const pt of zone2.curvePoints) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Slide ${pt.slide} — ${pt.fullLabel}`, bold: true, size: 22 }),
              new TextRun({ text: `  ${pt.emotion} · intensidad ${pt.intensity}/10`, size: 20, color: '6B6866' }),
            ],
            spacing: { before: 80, after: 40 },
          })
        )
        if (pt.contentDirection) {
          children.push(body(pt.contentDirection, { italic: true }))
        }
      }
    }
  } else {
    children.push(body('Datos de Acto #2 no disponibles.', { italic: true }))
  }

  children.push(divider(), pageBreak())

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTO 3 — DISEÑO
  // ─────────────────────────────────────────────────────────────────────────────
  children.push(heading1('Acto #3 — Diseño'))

  // Look & Feel
  children.push(heading2('Look & Feel'))
  const laf = act3.lookAndFeel
  children.push(
    infoTable([
      ['Paleta', `${laf.palette.name} — ${laf.palette.desc}`],
      ['Colores', `Primary: ${laf.palette.primary} · Accent: ${laf.palette.accent} · BG: ${laf.palette.background}`],
      ['Tipografía', laf.typographyStyle],
      ['Densidad', laf.visualDensity],
    ])
  )
  if (act3.generatedAt) {
    children.push(new Paragraph({ children: [], spacing: { before: 100 } }))
    children.push(labelValue('Generado', fmtDate(act3.generatedAt)))
  }

  // Slides
  if (act3.slides && act3.slides.length > 0) {
    children.push(heading2(`Slides (${act3.slides.length})`))

    for (const slide of act3.slides) {
      children.push(heading3(`Slide ${slide.slideNumber}: ${slide.title}`))

      if (slide.subtitle) {
        children.push(body(slide.subtitle, { italic: true }))
      }

      const slideInfoRows: Array<[string, string]> = [
        ['Emoción', `${slide.emotion} · intensidad ${slide.intensity}/10`],
        ['Estilo visual', slide.visualMood],
        ['Tipo de tópico', slide.topicType],
      ]
      if (slide.durationSeconds) {
        slideInfoRows.push(['Duración', `${slide.durationSeconds}s`])
      }
      children.push(infoTable(slideInfoRows))
      children.push(new Paragraph({ children: [], spacing: { before: 80 } }))

      if (slide.bodyText) {
        children.push(body(slide.bodyText))
      }

      if (slide.bullets && slide.bullets.length > 0) {
        for (const b of slide.bullets) {
          children.push(bullet(b))
        }
      }

      if (slide.callToAction) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '→ CTA: ', bold: true, size: 22, color: '6B3FA0' }),
              new TextRun({ text: slide.callToAction, size: 22, bold: true }),
            ],
            spacing: { before: 80, after: 60 },
          })
        )
      }

      // Image placeholders
      if (slide.images && slide.images.length > 0) {
        children.push(heading3('Imágenes'))
        for (const img of slide.images) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `[IMG] ${img.label}`, bold: true, size: 20 }),
                new TextRun({ text: `  ${img.placement} · ${img.style}`, size: 18, color: '9B9895' }),
              ],
              spacing: { before: 60, after: 20 },
            })
          )
          children.push(body(img.suggestedPrompt, { italic: true }))
        }
      }

      // Speaker notes
      if (slide.speakerNotes) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Notas del presentador: ', bold: true, size: 20, color: '6B6866' }),
              new TextRun({ text: slide.speakerNotes, size: 20, italics: true, color: '6B6866' }),
            ],
            spacing: { before: 80, after: 60 },
          })
        )
      }

      children.push(divider())
    }
  } else {
    children.push(body('No se han generado slides todavía.', { italic: true }))
  }

  // ── Build document ──────────────────────────────────────────────────────────
  const doc = new Document({
    creator: 'StoryVibe AI',
    title: presentationTitle,
    description: 'Reporte generado por StoryVibe AI',
    styles: {
      default: {
        document: {
          run: {
            size: 22,
            font: 'Calibri',
            color: '1A1A18',
          },
        },
        heading1: {
          run: {
            size: 40,
            bold: true,
            color: '1A1A18',
          },
          paragraph: {
            spacing: { before: 400, after: 160 },
          },
        },
        heading2: {
          run: {
            size: 30,
            bold: true,
            color: '1A1A18',
          },
          paragraph: {
            spacing: { before: 320, after: 120 },
          },
        },
        heading3: {
          run: {
            size: 24,
            bold: true,
            color: '6B3FA0',
          },
          paragraph: {
            spacing: { before: 200, after: 80 },
          },
        },
      },
    },
    sections: [
      {
        children,
      },
    ],
  })

  // ── Generate blob and trigger download ──────────────────────────────────────
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = presentationTitle.replace(/[^a-zA-Z0-9_-]/g, '_')
  a.href = url
  a.download = `storyvibe-reporte-${safeName}-${new Date().toISOString().slice(0, 10)}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
