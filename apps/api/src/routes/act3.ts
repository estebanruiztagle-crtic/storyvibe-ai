import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Helper: extract JSON from Claude response ────────────────────────────────
function extractJson(raw: string): string {
  const m =
    raw.match(/```json\s*([\s\S]*?)\s*```/) ||
    raw.match(/```\s*([\s\S]*?)\s*```/) ||
    raw.match(/(\{[\s\S]*\})/)
  if (m) return m[1] ?? m[0]
  return raw
}

// ─── Local types ──────────────────────────────────────────────────────────────
interface CurvePoint {
  slide: number
  label: string
  fullLabel: string
  type: string
  emotion: string
  intensity: number
  topicType: string
  suggestedTitle?: string
  contentDirection?: string
  designStyle?: string
  visualMood?: string
  speakerNotes?: string
  durationSeconds?: number
}

interface ImagePlaceholder {
  id: string
  label: string
  placement: string
  suggestedPrompt: string
  style: string
  aspectRatio?: string
}

interface SlideContent {
  slideNumber: number
  title: string
  subtitle?: string
  bodyText?: string
  bullets?: string[]
  callToAction?: string
  images: ImagePlaceholder[]
  speakerNotes?: string
  designStyle: string
  visualMood: string
  emotion: string
  intensity: number
  topicType: string
  durationSeconds?: number
  status: 'draft' | 'ready'
}

// ─── System prompt ────────────────────────────────────────────────────────────
const GENERATE_SLIDES_PROMPT = `Eres el Agente de Diseño de Contenido para StoryVibe AI.

Tu tarea es generar el contenido textual completo de una presentación basado en el arco narrativo del Acto #2. El contenido es PLANO: texto y marcadores de imagen (no imágenes reales).

Para cada diapositiva genera:
- slideNumber: número de la diapositiva
- title: título definitivo (máx 60 chars, impactante, accionable)
- subtitle: subtítulo opcional (máx 80 chars) — solo si agrega valor
- bodyText: 2-3 oraciones de desarrollo. Solo para slides con mucho contenido textual (dato_duro, propuesta_valor)
- bullets: array de 3-5 puntos clave (solo para designStyle = "list", "split", "data")
- callToAction: texto de CTA (SOLO para la última slide o slides de cierre)
- images: array de 1-2 marcadores de imagen, cada uno con:
  - id: "img-{slideNumber}-{a|b}"
  - label: nombre del placeholder (ej: "IMAGEN HERO", "IMAGEN SECUNDARIA")
  - placement: "full_bleed" (ocupa todo el fondo) | "half" (mitad de la slide) | "corner" (esquina) | "small" (icono/pequeña)
  - suggestedPrompt: prompt detallado en inglés para generador de imágenes IA. DEBE ser específico: estilo fotográfico/ilustración, colores, composición, sujeto, ambiente. Mín 20 palabras.
  - style: "photography" | "illustration" | "abstract" | "icon" | "chart"
  - aspectRatio: "16:9" | "1:1" | "9:16" (según placement)
- speakerNotes: puntos clave de lo que el presentador debe decir (2-3 oraciones)
- designStyle: mismo que el CurvePoint de entrada (no cambiar)
- visualMood: mismo que el CurvePoint de entrada (no cambiar)
- emotion: mismo que el CurvePoint de entrada
- intensity: mismo que el CurvePoint de entrada
- topicType: mismo que el CurvePoint de entrada
- durationSeconds: mismo que el CurvePoint de entrada
- status: "ready"

REGLAS DE IMÁGENES por designStyle:
- "hero": 1 imagen full_bleed (photography o abstract, alta calidad emocional)
- "data": 1 imagen small (chart o icon) + el espacio restante es para texto/datos
- "quote": 1 imagen half (photography, retrato o ambiente que refuerza la cita)
- "list": 0-1 imagen corner o small (icono que refuerza el tema)
- "image": 1 imagen full_bleed (la imagen ES el contenido principal)
- "comparison": 1-2 imágenes half (una para cada lado de la comparación)
- "split": 1 imagen half (photography o illustration)
- "timeline": 1 imagen small o corner (icono de contexto)

REGLAS DE PROMPTS DE IMAGEN:
- Escribe prompts en INGLÉS
- Incluye: estilo visual (photorealistic, flat illustration, etc.), composición, paleta de colores sugerida, ambiente emocional, sujeto específico
- Ejemplo: "Photorealistic wide-angle shot of a modern conference room with floor-to-ceiling windows overlooking a city skyline at dusk, warm golden lighting, empty presentation screen visible, atmospheric perspective, professional business setting"

TONO DE CONTENIDO:
- Usa el lookAndFeel.typographyStyle para calibrar el tono:
  - modern/minimal: conciso, directo, sin adornos
  - classic/elegant: más narrativo, sofisticado
  - bold: impactante, con statements fuertes

Responde ÚNICAMENTE con JSON válido:
{
  "slides": [SlideContent, ...]
}`

// ─── POST /generate-slides ────────────────────────────────────────────────────
router.post('/generate-slides', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      curvePoints,
      zone1Context,
      lookAndFeel,
      narrativeBrief,
      presentationTitle,
    } = req.body as {
      curvePoints: CurvePoint[]
      zone1Context?: Record<string, unknown>
      lookAndFeel?: { typographyStyle?: string; visualDensity?: string; paletteId?: string }
      narrativeBrief?: string
      presentationTitle?: string
    }

    if (!curvePoints || curvePoints.length === 0) {
      res.status(400).json({ success: false, error: 'curvePoints requeridos' })
      return
    }

    const slideSummary = curvePoints
      .map(
        (p) =>
          `Slide ${p.slide}: "${p.suggestedTitle || p.fullLabel}" | tipo: ${p.type} | emoción: ${p.emotion} | intensidad: ${p.intensity} | designStyle: ${p.designStyle || 'hero'} | visualMood: ${p.visualMood || 'neutral'} | topicType: ${p.topicType} | contentDirection: ${p.contentDirection || ''} | durationSeconds: ${p.durationSeconds || 120}`
      )
      .join('\n')

    const contextStr = zone1Context ? JSON.stringify(zone1Context, null, 2) : '{}'
    const styleStr = lookAndFeel
      ? `Estilo tipográfico: ${lookAndFeel.typographyStyle}, densidad: ${lookAndFeel.visualDensity}, paleta: ${lookAndFeel.paletteId}`
      : ''

    const response = await getAnthropic().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      system: GENERATE_SLIDES_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Genera el contenido completo de la presentación.

Título: "${presentationTitle || 'Presentación'}"
Arco narrativo: ${narrativeBrief || ''}
${styleStr}

Slides del Acto #2:
${slideSummary}

Contexto (Acto #1):
${contextStr}`,
        },
      ],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    let parsed: { slides: SlideContent[] }

    try {
      parsed = JSON.parse(extractJson(raw)) as { slides: SlideContent[] }
    } catch {
      // Fallback: generate basic content per slide
      parsed = {
        slides: curvePoints.map((p): SlideContent => ({
          slideNumber: p.slide,
          title: p.suggestedTitle || p.fullLabel || p.label,
          subtitle: p.contentDirection?.split('.')[0] ?? undefined,
          bodyText: p.contentDirection ?? '',
          bullets:
            p.type === 'valley'
              ? ['Punto clave 1', 'Punto clave 2', 'Punto clave 3']
              : undefined,
          callToAction: p.topicType === 'cta' ? 'Comienza hoy →' : undefined,
          images: [
            {
              id: `img-${p.slide}-a`,
              label:
                p.type === 'peak'
                  ? 'IMAGEN HERO'
                  : p.type === 'valley'
                  ? 'GRÁFICO'
                  : 'IMAGEN APOYO',
              placement:
                p.designStyle === 'hero' || p.designStyle === 'image'
                  ? 'full_bleed'
                  : p.designStyle === 'data'
                  ? 'small'
                  : 'half',
              suggestedPrompt: `Professional ${
                p.visualMood === 'dark_bold' ? 'dark dramatic' : 'clean light'
              } ${p.type === 'peak' ? 'inspirational' : 'analytical'} image representing ${
                p.fullLabel || p.label
              }, high quality, cinematic composition`,
              style:
                p.designStyle === 'data'
                  ? 'chart'
                  : p.topicType === 'prueba_social'
                  ? 'photography'
                  : 'illustration',
              aspectRatio: '16:9',
            },
          ],
          speakerNotes:
            p.speakerNotes ||
            `Presentar ${p.fullLabel}. Conectar con la audiencia. Duración: ${Math.round(
              (p.durationSeconds || 120) / 60
            )} min.`,
          designStyle: p.designStyle || 'hero',
          visualMood: p.visualMood || 'neutral',
          emotion: p.emotion,
          intensity: p.intensity,
          topicType: p.topicType,
          durationSeconds: p.durationSeconds,
          status: 'ready',
        })),
      }
    }

    res.json({ success: true, slides: parsed.slides })
  } catch (err) {
    console.error('act3 generate-slides error:', err)
    res.status(500).json({ success: false, error: 'Error al generar contenido de slides' })
  }
})

export { router as act3Router }
