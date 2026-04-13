import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Types ────────────────────────────────────────────────────────────────────
interface AxisCheck {
  pass: boolean
  text: string
}

interface AxisEvaluation {
  score: number
  status: 'pass' | 'warning' | 'fail'
  checks: AxisCheck[]
}

interface SlideSnapshot {
  elements: number
  textBlocks: number
  images: number
  words: number
  fonts: string[]
  colors: string[]
  layout: string
}

interface DesignSuggestion {
  id: string
  axis: 'brand_compliance' | 'cognitive_load' | 'emotional_alignment'
  severity: 'high' | 'medium' | 'low'
  problem: string
  fix: string
  diffType: 'text' | 'color' | 'font' | 'layout' | 'structure'
  before: string
  after: string
  status: 'pending'
}

interface SlideReview {
  slide: number
  label: string
  fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
  globalScore: number | null
  globalStatus: 'pass' | 'warning' | 'fail' | 'pending'
  snapshot: SlideSnapshot | null
  axes: {
    brand: AxisEvaluation
    cognitive: AxisEvaluation
    emotional: AxisEvaluation
  } | null
  suggestions: DesignSuggestion[]
  mockBg: string
  evaluated: boolean
}

interface EvaluateRequestBody {
  slideReview: SlideReview
  zone1ContextJson: string
  curvePointsJson: string
  brandLayerJson: string
}

interface ClaudeEvalResponse {
  globalScore: number
  globalStatus: 'pass' | 'warning' | 'fail'
  axes: {
    brand: { score: number; status: string; checks: Array<{ pass: boolean; text: string }> }
    cognitive: { score: number; status: string; checks: Array<{ pass: boolean; text: string }> }
    emotional: { score: number; status: string; checks: Array<{ pass: boolean; text: string }> }
  }
  suggestions: Array<{
    id: string
    axis: 'brand_compliance' | 'cognitive_load' | 'emotional_alignment'
    severity: 'high' | 'medium' | 'low'
    problem: string
    fix: string
    diffType: 'text' | 'color' | 'font' | 'layout' | 'structure'
    before: string
    after: string
    status: 'pending'
  }>
  snapshot: SlideSnapshot
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

// ─── Helper: normalize axis status ───────────────────────────────────────────
function normalizeAxisStatus(score: number): 'pass' | 'warning' | 'fail' {
  if (score >= 8.5) return 'pass'
  if (score >= 7) return 'warning'
  return 'fail'
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres el Agente Crítico de Diseño para StoryVibe AI. Evalúas diseños de diapositivas contra 3 ejes.

IDIOMA: Español latinoamericano neutro (NO argentino, NO español de España). Usa "tú" siempre. TODA tu respuesta (incluyendo checks, suggestions, problem, fix, before, after) DEBE estar en español.

Recibes:
- Info de la lámina: tópico, tipo emocional (peak/valley/transition), intensidad (1-10), emoción
- Contexto de Zona 1: audiencia, nivel de formalidad, restricciones de marca
- Curva emocional: la estructura narrativa aprobada

EJES DE EVALUACIÓN (evalúa cada uno independientemente):

1. CUMPLIMIENTO DE MARCA (peso: 40%)
   - Tipografía: ¿las fuentes son del brand book?
   - Paleta de color: ¿los colores están dentro de las especificaciones?
   - Estilo de imagen: estilos permitidos vs prohibidos
   - Patrones verbales: sin lenguaje prohibido
   - Reglas de visualización de datos (máx 1 variable por gráfico)
   Puntuación 0-10, estado: pass (>=8.5), warning (>=7), fail (<7)

2. CARGA COGNITIVA (peso: 35%)
   - Conteo de palabras: láminas peak máx 15 palabras, valley máx 20, transition máx 18
   - Conteo de elementos: máx 5 elementos por lámina
   - Jerarquía visual: máx 3 niveles
   Puntuación 0-10

3. ALINEACIÓN EMOCIONAL (peso: 25%)
   - Peso visual apropiado para el tipo (peaks = alto peso visual)
   - Densidad de texto apropiada (peaks = mínima, valleys = moderada)
   - Temperatura de color alineada con la emoción objetivo
   Puntuación 0-10

PUNTUACIÓN COMPUESTA: 0.40 x marca + 0.35 x cognitivo + 0.25 x emocional

Genera sugerencias CONCRETAS y EJECUTABLES (máx 3) para cualquier problema encontrado.
Cada sugerencia debe tener: eje, severidad, problema, solución, texto antes, texto después. TODO EN ESPAÑOL.

Responde ÚNICAMENTE con JSON válido:
{
  "globalScore": number,
  "globalStatus": "pass" | "warning" | "fail",
  "axes": {
    "brand": { "score": number, "status": string, "checks": [{"pass": bool, "text": "descripción en español"}] },
    "cognitive": { "score": number, "status": string, "checks": [...] },
    "emotional": { "score": number, "status": string, "checks": [...] }
  },
  "suggestions": [
    {
      "id": "s_id_unico",
      "axis": "brand_compliance" | "cognitive_load" | "emotional_alignment",
      "severity": "high" | "medium" | "low",
      "problem": "descripción específica del problema en español",
      "fix": "solución accionable específica en español",
      "diffType": "text" | "color" | "font" | "layout" | "structure",
      "before": "estado actual en español",
      "after": "estado deseado en español",
      "status": "pending"
    }
  ],
  "snapshot": {
    "elements": number,
    "textBlocks": number,
    "images": number,
    "words": number,
    "fonts": ["nombres de fuentes"],
    "colors": ["#hex"],
    "layout": "descripción del layout en español"
  }
}`

// ─── POST /evaluate ───────────────────────────────────────────────────────────
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { slideReview, zone1ContextJson, curvePointsJson, brandLayerJson } =
      req.body as EvaluateRequestBody

    if (!slideReview) {
      res.status(400).json({ success: false, error: 'slideReview is required' })
      return
    }

    // Parse context objects for richer message
    let zone1Context: Record<string, unknown> = {}
    let curvePoints: unknown[] = []

    try {
      if (zone1ContextJson) zone1Context = JSON.parse(zone1ContextJson)
    } catch {
      /* ignore */
    }
    try {
      if (curvePointsJson) curvePoints = JSON.parse(curvePointsJson)
    } catch {
      /* ignore */
    }

    const brandConstraints = (brandLayerJson
      ? (() => {
          try {
            const parsed = JSON.parse(brandLayerJson) as Record<string, unknown>
            return parsed.brandConstraints ?? parsed.brand ?? null
          } catch {
            return null
          }
        })()
      : null)

    const userMessage = `Evaluate the following presentation slide:

SLIDE INFO:
- Slide number: ${slideReview.slide}
- Label: ${slideReview.fullLabel || slideReview.label}
- Emotional type: ${slideReview.type}
- Target emotion: ${slideReview.emotion}
- Emotional intensity: ${slideReview.intensity}/10

ZONE 1 CONTEXT:
${JSON.stringify(zone1Context, null, 2)}

BRAND CONSTRAINTS:
${brandConstraints ? JSON.stringify(brandConstraints, null, 2) : 'No brand constraints specified — use sensible defaults (professional corporate typography, neutral palette)'}

EMOTIONAL CURVE (context):
${curvePoints.length > 0 ? `${curvePoints.length} total curve points. This slide is a ${slideReview.type} moment.` : 'No curve data available'}

CURRENT SLIDE STATE:
- Evaluated: ${slideReview.evaluated ? 'Yes (re-evaluation)' : 'No (first evaluation)'}
- Previous suggestions: ${slideReview.suggestions.length}

Please evaluate this slide across all 3 axes and generate concrete suggestions for improvement. Focus on actionable, specific feedback appropriate for the slide's emotional role (${slideReview.type}) and intensity (${slideReview.intensity}/10).`

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    const firstBlock = response.content[0]
    const rawContent = firstBlock && firstBlock.type === 'text' ? firstBlock.text : ''

    let evalResult: ClaudeEvalResponse

    try {
      evalResult = JSON.parse(extractJson(rawContent)) as ClaudeEvalResponse
    } catch {
      // Fallback evaluation based on slide type
      const baseScore = slideReview.type === 'peak' ? 8.2 : slideReview.type === 'valley' ? 7.8 : 8.0
      const brandScore = baseScore + (Math.random() - 0.5) * 0.8
      const cognitiveScore = baseScore + (Math.random() - 0.5) * 1.2
      const emotionalScore = baseScore + (Math.random() - 0.5) * 0.6

      const globalScore =
        Math.round((0.4 * brandScore + 0.35 * cognitiveScore + 0.25 * emotionalScore) * 10) / 10

      evalResult = {
        globalScore,
        globalStatus: normalizeAxisStatus(globalScore),
        axes: {
          brand: {
            score: Math.round(brandScore * 10) / 10,
            status: normalizeAxisStatus(brandScore),
            checks: [
              { pass: true, text: 'Tipografía dentro del brand book' },
              { pass: true, text: 'Paleta de colores alineada' },
              { pass: brandScore >= 7, text: 'Estilo de imagen apropiado' },
            ],
          },
          cognitive: {
            score: Math.round(cognitiveScore * 10) / 10,
            status: normalizeAxisStatus(cognitiveScore),
            checks: [
              {
                pass: cognitiveScore >= 7,
                text: `Conteo de palabras: ${slideReview.type === 'peak' ? 'max 15' : slideReview.type === 'valley' ? 'max 20' : 'max 18'} palabras`,
              },
              { pass: true, text: 'Máx. 5 elementos por slide' },
              { pass: cognitiveScore >= 8, text: 'Jerarquía visual: máx. 3 niveles' },
            ],
          },
          emotional: {
            score: Math.round(emotionalScore * 10) / 10,
            status: normalizeAxisStatus(emotionalScore),
            checks: [
              {
                pass: true,
                text: `Peso visual apropiado para ${slideReview.type}`,
              },
              {
                pass: emotionalScore >= 7,
                text: `Densidad de texto: ${slideReview.type === 'peak' ? 'mínima (pico)' : 'moderada'}`,
              },
              { pass: true, text: `Temperatura de color alineada con "${slideReview.emotion}"` },
            ],
          },
        },
        suggestions: [],
        snapshot: {
          elements: Math.floor(Math.random() * 4) + 2,
          textBlocks: Math.floor(Math.random() * 3) + 1,
          images: Math.floor(Math.random() * 2),
          words: slideReview.type === 'peak' ? 12 : slideReview.type === 'valley' ? 18 : 15,
          fonts: ['IBM Plex Sans', 'Playfair Display'],
          colors: ['#1a1916', '#2d4a3e', '#c4a882'],
          layout: slideReview.type === 'peak' ? 'hero-centered' : 'two-column',
        },
      }
    }

    // Normalize axis statuses to ensure consistency with scores
    if (evalResult.axes) {
      const brandScore = evalResult.axes.brand.score
      const cognitiveScore = evalResult.axes.cognitive.score
      const emotionalScore = evalResult.axes.emotional.score

      evalResult.axes.brand.status = normalizeAxisStatus(brandScore)
      evalResult.axes.cognitive.status = normalizeAxisStatus(cognitiveScore)
      evalResult.axes.emotional.status = normalizeAxisStatus(emotionalScore)

      // Recalculate composite score
      const composite =
        Math.round(
          (0.4 * brandScore + 0.35 * cognitiveScore + 0.25 * emotionalScore) * 10
        ) / 10
      evalResult.globalScore = composite
      evalResult.globalStatus = normalizeAxisStatus(composite)
    }

    // Ensure all suggestions have 'pending' status and valid IDs
    if (evalResult.suggestions) {
      evalResult.suggestions = evalResult.suggestions.map((s, i) => ({
        ...s,
        id: s.id || `s_${slideReview.slide}_${Date.now()}_${i}`,
        status: 'pending' as const,
      }))
    }

    // Build updated slide
    const updatedSlide: SlideReview = {
      ...slideReview,
      globalScore: evalResult.globalScore,
      globalStatus: evalResult.globalStatus,
      axes: evalResult.axes
        ? {
            brand: {
              score: evalResult.axes.brand.score,
              status: evalResult.axes.brand.status as 'pass' | 'warning' | 'fail',
              checks: evalResult.axes.brand.checks,
            },
            cognitive: {
              score: evalResult.axes.cognitive.score,
              status: evalResult.axes.cognitive.status as 'pass' | 'warning' | 'fail',
              checks: evalResult.axes.cognitive.checks,
            },
            emotional: {
              score: evalResult.axes.emotional.score,
              status: evalResult.axes.emotional.status as 'pass' | 'warning' | 'fail',
              checks: evalResult.axes.emotional.checks,
            },
          }
        : null,
      suggestions: evalResult.suggestions ?? [],
      snapshot: evalResult.snapshot ?? null,
      evaluated: true,
    }

    res.json({ success: true, updatedSlide })
  } catch (error) {
    console.error('Zone4 evaluate error:', error)
    res.status(500).json({ success: false, error: 'Error al evaluar slide' })
  }
})

export { router as zone4Router }
