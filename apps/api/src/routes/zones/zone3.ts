import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Types ────────────────────────────────────────────────────────────────────
type PointType = 'peak' | 'valley' | 'transition'

interface CurvePoint {
  slide: number
  label: string
  fullLabel: string
  type: PointType
  emotion: string
  intensity: number
}

// ─── Helper: extract JSON from Claude response ────────────────────────────────
function extractJson(raw: string): string {
  const jsonMatch =
    raw.match(/```json\s*([\s\S]*?)\s*```/) ||
    raw.match(/```\s*([\s\S]*?)\s*```/) ||
    raw.match(/(\{[\s\S]*\})/)
  if (jsonMatch) return jsonMatch[1] ?? jsonMatch[0]
  return raw
}

// ─── POST /generate-palette ───────────────────────────────────────────────────
router.post('/generate-palette', async (req: Request, res: Response) => {
  try {
    const { zone1Context, zone2Data } = req.body as {
      zone1Context: Record<string, unknown>
      zone2Data: Record<string, unknown>
    }

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      system: `Eres un director de arte especializado en presentaciones corporativas de alto impacto.
Dado el contexto de la presentación (sector, audiencia, tono de marca) y su arquitectura narrativa (framework elegido, arco emocional, tópicos), genera una paleta de colores profesional, cohesiva y estratégica.

La paleta debe:
- Reflejar el tono emocional del relato (confianza, urgencia, inspiración, etc.)
- Ser accesible y legible en presentaciones
- Tener contraste adecuado entre colores
- Ser coherente con el sector / industria

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "swatches": [
    { "hex": "#XXXXXX", "name": "nombre descriptivo en español", "role": "primary|secondary|accent|neutral|background" }
  ],
  "rationale": "Explicación en 1-2 frases de por qué esta paleta encaja con el relato",
  "mood": "5-8 palabras que describen el mood visual"
}

Genera entre 5 y 7 swatches. Incluir obligatoriamente: al menos 1 primary, 1 accent, 1 neutral, 1 background.`,
      messages: [
        {
          role: 'user',
          content: `Genera una paleta de colores para esta presentación.

Contexto de la presentación (Zona 1):
${JSON.stringify(zone1Context, null, 2)}

Arquitectura narrativa (Zona 2):
${JSON.stringify(zone2Data, null, 2)}`,
        },
      ],
    })

    const firstBlock = response.content[0]
    const rawContent = firstBlock?.type === 'text' ? firstBlock.text : ''

    try {
      const parsed = JSON.parse(extractJson(rawContent)) as {
        swatches: Array<{ hex: string; name: string; role: string }>
        rationale: string
        mood: string
      }
      res.json({ success: true, swatches: parsed.swatches, rationale: parsed.rationale, mood: parsed.mood })
    } catch {
      // Fallback palette: clean corporate blue
      res.json({
        success: true,
        swatches: [
          { hex: '#1A2F4E', name: 'Azul corporativo', role: 'primary' },
          { hex: '#2563EB', name: 'Azul medio', role: 'secondary' },
          { hex: '#10B981', name: 'Verde acento', role: 'accent' },
          { hex: '#6B7280', name: 'Gris neutro', role: 'neutral' },
          { hex: '#F9FAFB', name: 'Blanco suave', role: 'background' },
        ],
        rationale: 'Paleta corporativa equilibrada que transmite confianza y claridad profesional.',
        mood: 'profesional, confiable, moderno y claro',
      })
    }
  } catch (error) {
    console.error('Zone3 generate-palette error:', error)
    res.status(500).json({ success: false, error: 'Error al generar paleta' })
  }
})

// ─── POST /suggest-graphics ───────────────────────────────────────────────────
router.post('/suggest-graphics', async (req: Request, res: Response) => {
  try {
    const { curvePoints, zone1Context } = req.body as {
      curvePoints: CurvePoint[]
      zone1Context: Record<string, unknown>
    }

    if (!curvePoints || curvePoints.length === 0) {
      res.status(400).json({ success: false, error: 'curvePoints is required' })
      return
    }

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 5000,
      system: `Eres un director creativo experto en pitch decks ejecutivos y storytelling visual.
Tu trabajo es transformar cada lámina en una pieza de contenido PODEROSA que combine datos, insights y narrativa persuasiva.

PRINCIPIOS DE DISEÑO EJECUTIVO:
- Titulares DECLARATIVOS: declaran la conclusión ("Las ventas crecieron 40%"), NUNCA temas pasivos ("Ventas").
- UNA idea por diapositiva con mensaje claro y memorable.
- El contenido debe incluir datos específicos, recomendaciones accionables o insights diferenciadores.
- Framework Sparkline: alterna entre "lo que es" y "lo que podría ser" para crear tensión emocional.
- Principio de la Pirámide: conclusión primero, evidencia después.

Tipos de gráfico disponibles:
- bar_chart: Gráfico de barras — comparaciones, rankings, cifras por categoría
- line_chart: Gráfico de líneas — tendencias, evolución temporal, crecimiento
- donut_chart: Gráfico de dona — proporciones, distribución de partes
- comparison_table: Tabla comparativa — pros/contras, opciones, alternativas
- process_flow: Flujo de proceso — metodología, pasos, cómo funciona
- timeline: Línea de tiempo — hoja de ruta, historia, evolución
- stats_highlight: Estadísticas destacadas — datos clave de alto impacto, cifras WOW
- quote_block: Cita destacada — testimonios, declaraciones, afirmaciones
- icon_grid: Grid de iconos — características, beneficios, pilares
- before_after: Antes / Después — transformación, impacto, contraste

Criterios de selección por tipo emocional:
- peak: stats_highlight, before_after, bar_chart — impacto visual máximo
- valley: comparison_table, quote_block, line_chart — análisis y profundidad
- transition: process_flow, timeline, icon_grid — narración de cambio

Para cada lámina genera:
- slide: número
- type: tipo de gráfico más efectivo
- title: Título DECLARATIVO y concreto (la conclusión principal de esta slide, máx 50 chars). Ej: "3x más retención con onboarding guiado"
- description: 3-4 frases con el CONTENIDO REAL de la slide: qué dato mostrar, qué insight comunicar, qué recomendación dar. Escribe como si redactaras el copy final de la diapositiva. Incluye números, porcentajes, comparaciones o hechos concretos basados en el contexto del negocio.
- tips: Array de 2-3 consejos prácticos para el presentador sobre CÓMO comunicar esta slide con máximo impacto (técnicas de delivery, pausas, contacto visual, etc.)
- why: Por qué este tipo de gráfico y contenido encaja con la emoción de esta lámina (1 frase)

Responde ÚNICAMENTE con JSON válido:
{
  "suggestions": [
    {
      "slide": 1,
      "type": "stats_highlight",
      "title": "Título declarativo concreto",
      "description": "Contenido rico y específico de la slide...",
      "tips": ["Consejo 1", "Consejo 2"],
      "why": "Razón de la elección"
    }
  ]
}`,
      messages: [
        {
          role: 'user',
          content: `Genera contenido PODEROSO para cada lámina de este pitch deck ejecutivo.

CONTEXTO DEL NEGOCIO (Zona 1):
${JSON.stringify(zone1Context, null, 2)}

LÁMINAS CON ARCO EMOCIONAL Y DIRECCIÓN DE CONTENIDO:
${curvePoints.map((p) => `- Lámina ${p.slide}: "${p.suggestedTitle || p.fullLabel}"
  Tipo emocional: ${p.type} | Emoción: ${p.emotion} | Intensidad: ${p.intensity}/10
  Dirección de contenido: ${(p as any).contentDirection || p.fullLabel}
  Mensaje clave: ${(p as any).keyMessage || 'No definido'}
  Estilo de diseño: ${(p as any).designStyle || 'hero'}`).join('\n')}

INSTRUCCIONES:
- Usa los datos del contexto de negocio para generar contenido ESPECÍFICO (cifras, métricas, comparaciones reales del sector).
- Cada title debe ser una afirmación poderosa que declare un insight, NO un tema genérico.
- Cada description debe tener contenido listo para poner en la slide: datos, recomendaciones, insights diferenciadores.
- Los tips deben ser técnicas de delivery concretas para esa slide específica.
- Genera exactamente una sugerencia por cada lámina.`,
        },
      ],
    })

    const firstBlock = response.content[0]
    const rawContent = firstBlock?.type === 'text' ? firstBlock.text : ''

    try {
      const parsed = JSON.parse(extractJson(rawContent)) as {
        suggestions: Array<{ slide: number; type: string; title: string; description: string; why: string }>
      }
      res.json({ success: true, suggestions: parsed.suggestions })
    } catch {
      // Fallback: basic suggestions based on point type
      const suggestions = curvePoints.map((p) => ({
        slide: p.slide,
        type: p.type === 'peak' ? 'stats_highlight' : p.type === 'valley' ? 'comparison_table' : 'process_flow',
        title: `Visualización: ${p.label}`,
        description: `Gráfico que refuerza el concepto "${p.emotion}" de esta lámina con datos de alto impacto.`,
        why: `El tipo emocional ${p.type} con intensidad ${p.intensity}/10 requiere máximo impacto visual.`,
      }))
      res.json({ success: true, suggestions })
    }
  } catch (error) {
    console.error('Zone3 suggest-graphics error:', error)
    res.status(500).json({ success: false, error: 'Error al sugerir gráficos' })
  }
})

// ─── POST /generate-title ─────────────────────────────────────────────────────
router.post('/generate-title', async (req: Request, res: Response) => {
  try {
    const { zone1Context, zone2Data } = req.body as {
      zone1Context: Record<string, unknown>
      zone2Data: Record<string, unknown>
    }

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 80,
      system: `Eres un experto en copywriting para presentaciones corporativas de alto impacto.
Genera un título corto, poderoso y memorable para una presentación de negocios.

Reglas:
- Entre 3 y 8 palabras
- En el mismo idioma del contexto (si el contexto es en español, el título en español)
- Específico al sector, audiencia y objetivo — nada genérico
- Transmite la transformación o insight central de la presentación
- Sin signos de puntuación al final
- Responde ÚNICAMENTE con el título, sin comillas ni explicación`,
      messages: [
        {
          role: 'user',
          content: `Genera el título para esta presentación.

Contexto diagnóstico (Zona 1):
${JSON.stringify(zone1Context, null, 2)}

Arquitectura narrativa (Zona 2):
${JSON.stringify(zone2Data, null, 2)}`,
        },
      ],
    })

    const firstBlock = response.content[0]
    const title = firstBlock?.type === 'text' ? firstBlock.text.trim() : ''
    if (!title) {
      res.status(500).json({ success: false, error: 'No se pudo generar el título' })
      return
    }
    res.json({ success: true, title })
  } catch (error) {
    console.error('Zone3 generate-title error:', error)
    res.status(500).json({ success: false, error: 'Error al generar título' })
  }
})

// ─── POST /generate-image ─────────────────────────────────────────────────────
router.post('/generate-image', async (req: Request, res: Response) => {
  const recraftApiKey = process.env.RECRAFT_API_KEY
  if (!recraftApiKey) {
    res.status(500).json({ success: false, error: 'RECRAFT_API_KEY no está configurada en el servidor' })
    return
  }

  try {
    const {
      slideLabel,
      fullLabel,
      emotion,
      intensity,
      graphicType,
      palette,
      zone1Context,
      style,
    } = req.body as {
      slideLabel: string
      fullLabel: string
      emotion: string
      intensity: number
      graphicType?: string
      palette?: Array<{ hex: string; role: string; name: string }>
      zone1Context?: Record<string, unknown>
      style?: string
    }

    const recraftStyle = style ?? 'digital_illustration'
    const paletteDesc = palette && palette.length > 0
      ? palette.map((p) => `${p.name} (${p.hex}, ${p.role})`).join(', ')
      : 'not specified'

    // ── Step 1: Claude crafts an optimised Recraft prompt ──────────────────
    const promptResponse = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      system: `You are an expert at writing image generation prompts for Recraft v3, specialised in high-impact visuals for corporate presentations.

Generate ONE short, precise, evocative prompt (40-80 words) that will produce a powerful slide image.
Rules:
- Write in English
- Landscape / 16:9 composition
- Specify lighting mood, color temperature, and atmosphere
- Integrate the brand palette colors when provided
- Do NOT include any text, words, numbers, or charts in the image
- No people's faces unless essential
- Output ONLY the prompt, no quotes, no explanation`,
      messages: [
        {
          role: 'user',
          content: `Create an image prompt for this presentation slide:

Short label: "${slideLabel}"
Full concept: "${fullLabel}"
Emotion: ${emotion}
Emotional intensity: ${intensity}/10
Suggested graphic type: ${graphicType ?? 'none'}
Color palette: ${paletteDesc}
Presentation context: ${JSON.stringify(zone1Context ?? {}, null, 2)}`,
        },
      ],
    })

    const firstBlock = promptResponse.content[0]
    const imagePrompt =
      firstBlock?.type === 'text' ? firstBlock.text.trim() : fullLabel

    // ── Step 2: Call Recraft v3 API ────────────────────────────────────────
    const recraftRes = await fetch('https://external.api.recraft.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${recraftApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        style: recraftStyle,
        model: 'recraftv3',
        size: '1365x1024',
      }),
    })

    if (!recraftRes.ok) {
      const errText = await recraftRes.text()
      console.error('Recraft API error:', recraftRes.status, errText)
      res.status(500).json({ success: false, error: `Error de Recraft (${recraftRes.status}): ${errText}` })
      return
    }

    const recraftData = await recraftRes.json() as { data: Array<{ url: string }> }
    const imageUrl = recraftData.data[0]?.url

    if (!imageUrl) {
      res.status(500).json({ success: false, error: 'Recraft no devolvió ninguna imagen' })
      return
    }

    res.json({ success: true, imageUrl, usedPrompt: imagePrompt })
  } catch (error) {
    console.error('Zone3 generate-image error:', error)
    res.status(500).json({ success: false, error: 'Error al generar imagen' })
  }
})

export { router as zone3Router }
