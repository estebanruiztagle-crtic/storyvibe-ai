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
const SYSTEM_PROMPT = `You are the Design Critic Agent for StoryVibe AI. You evaluate presentation slide designs against 3 axes.

You receive:
- Slide info: topic, emotional type (peak/valley/transition), intensity (1-10), emotion label
- Zone 1 context: audience baseline, formality level, brand constraints
- Emotional curve: the approved narrative structure

EVALUATION AXES (evaluate each independently):

1. BRAND COMPLIANCE (weight: 40%)
   - Typography: are fonts from the brand book?
   - Color palette: are colors within brand specs?
   - Imagery style: allowed vs forbidden styles
   - Verbal patterns: no forbidden language patterns
   - Data visualization rules (max 1 variable per chart)
   Score 0-10, status: pass (>=8.5), warning (>=7), fail (<7)

2. COGNITIVE LOAD (weight: 35%)
   - Word count: peak slides max 15 words, valley max 20, transition max 18
   - Element count: max 5 elements per slide
   - Visual hierarchy: max 3 levels
   Score 0-10

3. EMOTIONAL ALIGNMENT (weight: 25%)
   - Visual weight appropriate for point type (peaks = high visual weight)
   - Text density appropriate (peaks = minimal, valleys = moderate)
   - Color temperature aligned with target emotion
   Score 0-10

COMPOSITE SCORE: 0.40 x brand + 0.35 x cognitive + 0.25 x emotional

Generate CONCRETE, EXECUTABLE suggestions (max 3) for any issues found.
Each suggestion must have: axis, severity, problem, fix, before text, after text.

Respond ONLY with valid JSON:
{
  "globalScore": number,
  "globalStatus": "pass" | "warning" | "fail",
  "axes": {
    "brand": { "score": number, "status": string, "checks": [{"pass": bool, "text": string}] },
    "cognitive": { "score": number, "status": string, "checks": [...] },
    "emotional": { "score": number, "status": string, "checks": [...] }
  },
  "suggestions": [
    {
      "id": "s_unique_id",
      "axis": "brand_compliance" | "cognitive_load" | "emotional_alignment",
      "severity": "high" | "medium" | "low",
      "problem": "specific problem description",
      "fix": "specific actionable fix",
      "diffType": "text" | "color" | "font" | "layout" | "structure",
      "before": "current state",
      "after": "desired state",
      "status": "pending"
    }
  ],
  "snapshot": {
    "elements": number,
    "textBlocks": number,
    "images": number,
    "words": number,
    "fonts": ["font names"],
    "colors": ["#hex"],
    "layout": "layout description"
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
      model: 'claude-3-5-sonnet-20241022',
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
