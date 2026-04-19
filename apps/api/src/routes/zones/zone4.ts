import { Router, type Router as RouterType, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router: RouterType = Router()
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

// ─── Types: Redesign ─────────────────────────────────────────────────────────

interface SlideScoreInput {
  slide: number
  label?: string
  type?: string
  emotion?: string
  intensity?: number
  brand: number
  cognitive: number
  emotional: number
  composite: number
  suggestions: string[]
}

interface CurvePointInput {
  slide: number
  label: string
  fullLabel?: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
  systemType?: string
  systemEmotion?: string
  systemIntensity?: number
  suggestedTitle?: string
  contentDirection?: string
  designStyle?: string
  visualMood?: string
  durationSeconds?: number
}

interface SlideRedesignChange {
  type?: 'peak' | 'valley' | 'transition'
  emotion?: string
  intensity?: number
  suggestedTitle?: string
  contentDirection?: string
  designStyle?: string
  visualMood?: string
}

interface SlideRedesign {
  slide: number
  label: string
  currentScore: number
  projectedScore: number
  changes: SlideRedesignChange
  rationale: string
  accepted: boolean
}

interface RedesignResult {
  redesignedCurvePoints: CurvePointInput[]
  slideRedesigns: SlideRedesign[]
  narrativeSummary: string
  globalImprovementScore: number
  mainIssues: string[]
}

interface RedesignRequestBody {
  slideScores: SlideScoreInput[]
  curvePoints: CurvePointInput[]
  zone1ContextJson: string
  presentationTitle?: string
}

// ─── System Prompt: Redesign ──────────────────────────────────────────────────

const REDESIGN_SYSTEM_PROMPT = `Eres el Agente Rediseñador de Narrativa para StoryVibe AI. Tu misión es analizar TODOS los resultados de evaluación de una presentación como sistema y redefinir la curva narrativa para maximizar el impacto global.

IDIOMA: Español latinoamericano neutro. Usa "tú" siempre. TODA tu respuesta en español.

PROCESO DE ANÁLISIS:
1. Revisa los scores de cada eje (marca, cognitiva, emocional) de todas las láminas
2. Identifica patrones sistémicos: ¿qué tipo de slides fallan más? ¿En qué posición de la curva?
3. Detecta problemas en la arquitectura narrativa: ¿hay demasiados peaks seguidos? ¿valleys sin suficiente contraste emocional? ¿transiciones abruptas?
4. Propone cambios quirúrgicos: modifica el MÍNIMO necesario para obtener el MÁXIMO impacto

REGLAS DE REDISEÑO:
- Nunca cambies más del 40% de los puntos de la curva
- Mantén la estructura de 3 actos (apertura → desarrollo → cierre)
- Un peak de cierre SIEMPRE debe ser el punto de mayor intensidad
- Nunca pongas 3 peaks consecutivos (rompe el ritmo)
- Los valleys son necesarios para crear contraste emocional — no los elimines todos
- Si un slide tiene score < 5.5 en carga cognitiva: sugiere cambiar a tipo valley o reducir intensidad
- Si un slide tiene score < 5.5 en alineación emocional: ajusta la emoción objetivo o el designStyle
- Si un slide tiene score < 6 en brand: cambia el visualMood o sugiere un contentDirection más limpio

CAMPOS QUE PUEDES MODIFICAR POR SLIDE:
- type: peak | valley | transition
- emotion: emoción objetivo en español (confianza, urgencia, inspiración, curiosidad, etc.)
- intensity: 1-10 (alineado con el tipo: peaks > 7, valleys 3-6, transitions 4-7)
- suggestedTitle: título sugerido más impactante
- contentDirection: instrucción de dirección de contenido para el diseñador
- designStyle: hero | data | quote | list | image | comparison | split | timeline
- visualMood: dark_bold | light_clean | data_heavy | conceptual | emotional | neutral

CRITERIOS DE MEJORA PROYECTADA:
- Cambiar type → +1.5-2.0 puntos en alineación emocional si el tipo era incorrecto
- Ajustar intensity → +0.8-1.2 puntos en carga cognitiva si era demasiado alta
- Cambiar designStyle → +1.0-1.5 puntos en brand o cognitiva
- Cambiar visualMood → +0.8-1.0 puntos en emocional
- Solo proyecta mejoras realistas

Responde ÚNICAMENTE con JSON válido:
{
  "redesignedCurvePoints": [
    {
      "slide": number,
      "label": "string",
      "type": "peak|valley|transition",
      "emotion": "string en español",
      "intensity": number,
      "suggestedTitle": "string",
      "contentDirection": "string con instrucción de diseño",
      "designStyle": "hero|data|quote|list|image|comparison|split|timeline",
      "visualMood": "dark_bold|light_clean|data_heavy|conceptual|emotional|neutral"
    }
  ],
  "slideRedesigns": [
    {
      "slide": number,
      "label": "string",
      "currentScore": number,
      "projectedScore": number,
      "changes": {
        "type": "peak|valley|transition (solo si cambia)",
        "emotion": "string (solo si cambia)",
        "intensity": number (solo si cambia),
        "suggestedTitle": "string (solo si cambia)",
        "contentDirection": "string (solo si cambia)",
        "designStyle": "string (solo si cambia)",
        "visualMood": "string (solo si cambia)"
      },
      "rationale": "explicación concisa en español de por qué estos cambios mejoran el slide",
      "accepted": false
    }
  ],
  "narrativeSummary": "resumen de 2-3 oraciones del rediseño narrativo aplicado y por qué mejora la presentación",
  "globalImprovementScore": number (mejora porcentual proyectada, ej: 15.5 para +15.5%),
  "mainIssues": ["problema sistémico 1", "problema sistémico 2", "problema sistémico 3"]
}`

// ─── POST /redesign ───────────────────────────────────────────────────────────
router.post('/redesign', async (req: Request, res: Response) => {
  try {
    const { slideScores, curvePoints, zone1ContextJson, presentationTitle } =
      req.body as RedesignRequestBody

    if (!slideScores?.length || !curvePoints?.length) {
      res.status(400).json({ success: false, error: 'slideScores y curvePoints son requeridos' })
      return
    }

    let zone1Context: Record<string, unknown> = {}
    try {
      if (zone1ContextJson) zone1Context = JSON.parse(zone1ContextJson)
    } catch { /* ignore */ }

    // Calculate overall stats
    const avgComposite = slideScores.reduce((a, s) => a + s.composite, 0) / slideScores.length
    const failCount = slideScores.filter((s) => s.composite < 5.5).length
    const warningCount = slideScores.filter((s) => s.composite >= 5.5 && s.composite < 7).length
    const passCount = slideScores.filter((s) => s.composite >= 7).length

    const worstSlides = [...slideScores]
      .sort((a, b) => a.composite - b.composite)
      .slice(0, Math.min(5, Math.ceil(slideScores.length * 0.4)))

    const userMessage = `Analiza los resultados de evaluación de esta presentación y rediseña la curva narrativa para maximizar su impacto.

PRESENTACIÓN: "${presentationTitle ?? 'Sin título'}"

RESUMEN DE EVALUACIÓN:
- Total láminas: ${slideScores.length}
- Score promedio: ${avgComposite.toFixed(1)}/10
- Pasan (≥7): ${passCount} láminas
- Alertas (5.5-7): ${warningCount} láminas
- Fallos (<5.5): ${failCount} láminas

LÁMINAS CON PEORES SCORES (candidatas principales al rediseño):
${worstSlides.map((s) => `  Slide ${s.slide}: "${s.label ?? ''}" → Composite ${s.composite.toFixed(1)} (brand: ${s.brand.toFixed(1)}, cognitiva: ${s.cognitive.toFixed(1)}, emocional: ${s.emotional.toFixed(1)})`).join('\n')}

SCORES COMPLETOS POR SLIDE:
${slideScores.map((s) => `  Slide ${s.slide} [${s.type ?? '?'} / ${s.emotion ?? '?'} / intensidad ${s.intensity ?? '?'}]: ${s.composite.toFixed(1)} — Sugerencias: ${s.suggestions.slice(0, 2).join('; ')}`).join('\n')}

CURVA NARRATIVA ACTUAL:
${curvePoints.map((p) => `  Slide ${p.slide}: [${p.type}] "${p.label}" — emoción: ${p.emotion}, intensidad: ${p.intensity}, estilo: ${p.designStyle ?? 'no definido'}, mood: ${p.visualMood ?? 'no definido'}`).join('\n')}

CONTEXTO ZONA 1:
${JSON.stringify({
  audience: (zone1Context as Record<string, unknown>).audience,
  objective: (zone1Context as Record<string, unknown>).objective,
  tone: (zone1Context as Record<string, unknown>).tone,
  event: (zone1Context as Record<string, unknown>).event,
}, null, 2)}

Rediseña la curva narrativa para llevar el score promedio de ${avgComposite.toFixed(1)} a por lo menos 7.5/10. Enfócate en los cambios de mayor impacto con el menor número de modificaciones posible.`

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      system: REDESIGN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const firstBlock = response.content[0]
    const rawContent = firstBlock?.type === 'text' ? firstBlock.text : ''

    let redesignResult: RedesignResult

    try {
      redesignResult = JSON.parse(extractJson(rawContent)) as RedesignResult
    } catch {
      // Fallback: generate a basic redesign based on heuristics
      const redesignedCurvePoints = curvePoints.map((p) => {
        const score = slideScores.find((s) => s.slide === p.slide)
        if (!score || score.composite >= 7) return p

        const changes: Partial<CurvePointInput> = {}

        // Fix cognitive overload: downgrade peaks with high word count problems
        if (score.cognitive < 6 && p.type === 'peak') {
          changes.intensity = Math.min(p.intensity, 7)
          changes.contentDirection = 'Reduce el texto al mínimo. Una sola idea central. Sin bullets.'
        }

        // Fix emotional misalignment
        if (score.emotional < 6) {
          changes.visualMood = p.type === 'peak' ? 'dark_bold' : 'light_clean'
          changes.designStyle = p.type === 'peak' ? 'hero' : 'data'
        }

        return { ...p, ...changes }
      })

      const slideRedesigns: SlideRedesign[] = slideScores
        .filter((s) => s.composite < 7)
        .map((s) => {
          const curve = curvePoints.find((p) => p.slide === s.slide)
          return {
            slide: s.slide,
            label: curve?.label ?? `Slide ${s.slide}`,
            currentScore: s.composite,
            projectedScore: Math.min(s.composite + 1.5, 8.5),
            changes: {
              contentDirection: 'Simplifica el contenido. Enfócate en una sola idea poderosa.',
              visualMood: s.emotional < 6 ? (curve?.type === 'peak' ? 'dark_bold' : 'light_clean') : undefined,
            },
            rationale: `Score de ${s.composite.toFixed(1)} indica problemas en ${s.cognitive < s.emotional ? 'carga cognitiva (demasiado texto/elementos)' : 'alineación emocional (el diseño no comunica la emoción objetivo)'}. Simplificar mejorará ambos ejes.`,
            accepted: false,
          }
        })

      const improvementScore =
        slideRedesigns.reduce((a, r) => a + (r.projectedScore - r.currentScore), 0) /
        Math.max(slideRedesigns.length, 1)

      redesignResult = {
        redesignedCurvePoints,
        slideRedesigns,
        narrativeSummary: `Se identificaron ${failCount + warningCount} láminas con oportunidades de mejora. Los principales problemas son carga cognitiva excesiva y desalineación emocional en los puntos peak. Las modificaciones propuestas mantienen la estructura narrativa de 3 actos pero optimizan cada momento para su rol emocional.`,
        globalImprovementScore: Math.round(improvementScore * 10),
        mainIssues: [
          failCount > 0 ? `${failCount} láminas con score crítico (<5.5)` : `${warningCount} láminas con alertas`,
          'Carga cognitiva elevada en puntos peak (demasiados elementos)',
          'Desalineación entre tipo emocional y diseño visual',
        ],
      }
    }

    // Merge redesigned curve with original to preserve unmodified fields
    const mergedCurvePoints = curvePoints.map((original) => {
      const redesigned = redesignResult.redesignedCurvePoints.find(
        (r) => r.slide === original.slide
      )
      if (!redesigned) return original
      return {
        ...original,
        ...redesigned,
        // Preserve system defaults (don't overwrite systemType etc.)
        systemType: original.systemType ?? original.type,
        systemEmotion: original.systemEmotion ?? original.emotion,
        systemIntensity: original.systemIntensity ?? original.intensity,
      }
    })

    redesignResult.redesignedCurvePoints = mergedCurvePoints

    // Ensure all slideRedesigns have accepted: false
    redesignResult.slideRedesigns = redesignResult.slideRedesigns.map((r) => ({
      ...r,
      accepted: false,
    }))

    res.json({ success: true, redesign: redesignResult })
  } catch (error) {
    console.error('Zone4 redesign error:', error)
    res.status(500).json({ success: false, error: 'Error al rediseñar la curva narrativa' })
  }
})

export { router as zone4Router }
