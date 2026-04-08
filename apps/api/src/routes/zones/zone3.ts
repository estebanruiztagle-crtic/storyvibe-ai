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
      model: 'claude-sonnet-4-6',
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
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: `Eres un diseñador experto en presentaciones corporativas y visualización de datos.
Para cada lámina de una presentación, sugiere el tipo de gráfico o infografía más efectivo para comunicar su concepto, considerando el tipo emocional y la intensidad.

Tipos disponibles:
- bar_chart: Gráfico de barras — para comparaciones, rankings, cifras por categoría
- line_chart: Gráfico de líneas — para tendencias, evolución temporal, crecimiento
- donut_chart: Gráfico de dona — para proporciones, distribución de partes
- comparison_table: Tabla comparativa — para pros/contras, opciones, alternativas
- process_flow: Flujo de proceso — para metodología, pasos, cómo funciona algo
- timeline: Línea de tiempo — para hoja de ruta, historia, evolución
- stats_highlight: Estadísticas destacadas — para datos clave de alto impacto, cifras WOW
- quote_block: Cita destacada — para testimonios, declaraciones de expertos, afirmaciones
- icon_grid: Grid de iconos — para listar características, beneficios, pilares
- before_after: Antes / Después — para transformación, impacto, contraste situacional

Criterios de selección por tipo emocional:
- peak (pico, alta intensidad): stats_highlight, before_after, bar_chart — impacto visual máximo
- valley (valle, reflexión): comparison_table, quote_block, line_chart — análisis y profundidad
- transition (transición): process_flow, timeline, icon_grid — narración de cambio

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "suggestions": [
    {
      "slide": 1,
      "type": "stats_highlight",
      "title": "Título concreto del gráfico (no genérico)",
      "description": "Qué datos o información mostraría este gráfico (1-2 frases específicas al contexto)",
      "why": "Por qué este tipo encaja con la emoción y el tópico de esta lámina específica (1 frase)"
    }
  ]
}`,
      messages: [
        {
          role: 'user',
          content: `Sugiere el mejor gráfico o infografía para cada lámina de esta presentación.

Sector y audiencia (Zona 1):
${JSON.stringify(zone1Context, null, 2)}

Láminas con arco emocional:
${curvePoints.map((p) => `- Lámina ${p.slide}: "${p.fullLabel}" | tipo: ${p.type} | emoción: ${p.emotion} | intensidad: ${p.intensity}/10`).join('\n')}

Genera exactamente una sugerencia por cada lámina listada.`,
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

export { router as zone3Router }
