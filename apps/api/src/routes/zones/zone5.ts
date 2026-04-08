import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Types ────────────────────────────────────────────────────────────────────
interface CurvePoint {
  slide: number
  label: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
}

interface PacingResult {
  slide: number
  seconds: number
  pacing: 'slow' | 'medium' | 'fast'
  rationale: string
}

// ─── POST /calculate-pacing ───────────────────────────────────────────────────
// Given curve points + total time, suggest seconds allocation per slide
router.post('/calculate-pacing', async (req: Request, res: Response): Promise<void> => {
  const {
    curvePoints,
    totalAvailableSeconds = 1200,
    slideCount,
  } = req.body as {
    curvePoints: CurvePoint[]
    totalAvailableSeconds: number
    slideCount: number
  }

  if (!curvePoints || curvePoints.length === 0) {
    res.status(400).json({ error: 'curvePoints required' })
    return
  }

  const avgSeconds = Math.round(totalAvailableSeconds / (slideCount || curvePoints.length))

  const systemPrompt = `Eres un experto en presentaciones de alto impacto. Tu tarea es asignar la distribución de tiempo óptima para cada slide de una presentación, respetando el tiempo total disponible y la curva emocional.

Reglas:
- Los slides tipo "peak" (pico emocional) merecen más tiempo para que la audiencia procese el impacto
- Los slides tipo "valley" (análisis/datos) necesitan tiempo para que la audiencia absorba la información
- Los slides tipo "transition" (transición narrativa) deben ser ágiles para mantener el ritmo
- La suma total de segundos DEBE ser exactamente igual a totalAvailableSeconds
- Varía el ritmo: no todos los slides deben tener el mismo tiempo
- Usa "slow" para slides > 1.3x el promedio, "fast" para slides < 0.7x, "medium" para el resto

Responde ÚNICAMENTE con JSON válido en este formato:
{
  "pacing": [
    {"slide": 1, "seconds": 90, "pacing": "fast", "rationale": "Apertura ágil para captar atención"},
    ...
  ]
}`

  const slideSummary = curvePoints.map((p) =>
    `Slide ${p.slide}: "${p.label}" | tipo: ${p.type} | emoción: ${p.emotion} | intensidad: ${p.intensity}/10`
  ).join('\n')

  try {
    const message = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Distribuye ${totalAvailableSeconds} segundos (${Math.round(totalAvailableSeconds / 60)} min) entre ${curvePoints.length} slides.
Promedio base: ${avgSeconds}s por slide.

SLIDES:
${slideSummary}

Asegúrate que la suma exacta sea ${totalAvailableSeconds} segundos.`,
        },
      ],
      system: systemPrompt,
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    const parsed = JSON.parse(jsonMatch[0]) as { pacing: PacingResult[] }

    // Validate and normalize (ensure sum matches)
    let totalAssigned = parsed.pacing.reduce((sum, p) => sum + p.seconds, 0)
    if (Math.abs(totalAssigned - totalAvailableSeconds) > 5) {
      // Re-normalize proportionally
      const factor = totalAvailableSeconds / totalAssigned
      parsed.pacing = parsed.pacing.map((p, i) => {
        const adj = i === parsed.pacing.length - 1
          ? totalAvailableSeconds - parsed.pacing.slice(0, -1).reduce((s, x) => s + Math.round(x.seconds * factor), 0)
          : Math.round(p.seconds * factor)
        return { ...p, seconds: adj }
      })
      totalAssigned = totalAvailableSeconds
    }

    res.json({
      pacing: parsed.pacing,
      totalSeconds: totalAssigned,
      slideCount: parsed.pacing.length,
    })
  } catch (err) {
    console.error('[zone5/calculate-pacing]', err)

    // Fallback: distribute evenly with slight variation by type
    const typeWeights: Record<string, number> = { peak: 1.3, valley: 1.5, transition: 0.8 }
    const rawWeights = curvePoints.map((p) => typeWeights[p.type] ?? 1)
    const weightSum = rawWeights.reduce((s, w) => s + w, 0)
    let remaining = totalAvailableSeconds
    const fallbackPacing: PacingResult[] = curvePoints.map((p, i) => {
      const seconds = i === curvePoints.length - 1
        ? remaining
        : Math.round((rawWeights[i]! / weightSum) * totalAvailableSeconds)
      remaining -= seconds
      const avg = totalAvailableSeconds / curvePoints.length
      const pacing: 'slow' | 'medium' | 'fast' =
        seconds > avg * 1.3 ? 'slow' : seconds < avg * 0.7 ? 'fast' : 'medium'
      return { slide: p.slide, seconds, pacing, rationale: 'Distribución automática' }
    })

    res.json({
      pacing: fallbackPacing,
      totalSeconds: fallbackPacing.reduce((s, p) => s + p.seconds, 0),
      slideCount: fallbackPacing.length,
      fallback: true,
    })
  }
})

// ─── POST /generate-pitch ─────────────────────────────────────────────────────
// Generates the narrative pitch: overall story + per-section timing + delivery tips

interface StoryboardSlideInput {
  slide: number
  label: string
  fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
  seconds: number
}

interface PitchSection {
  slideRange: string
  title: string
  narrativeSummary: string
  durationSeconds: number
  durationPercent: number
  toneOfVoice: string
  suggestedActions: string[]
  keyQuestions: string[]
}

interface PitchData {
  overallNarrative: string
  totalSeconds: number
  sections: PitchSection[]
}

const GENERATE_PITCH_SYSTEM = `Eres un coach experto en storytelling y presentaciones de alto impacto.
Tu tarea es generar el PITCH NARRATIVO de una presentación: cómo el presentador debe contar la historia de principio a fin.

Agrupa las slides en 3-5 secciones narrativas (no necesariamente una por slide). Cada sección debe tener:
- slideRange: rango de slides (ej: "Slides 1-2")
- title: nombre de la sección (ej: "Apertura — El Problema", "Desarrollo — La Solución", "Cierre — La Llamada a la Acción")
- narrativeSummary: 2-3 oraciones explicando qué historia se cuenta en esta sección y por qué importa narrativamente
- durationSeconds: suma exacta de los segundos de las slides incluidas
- durationPercent: porcentaje sobre el total (redondear a entero)
- toneOfVoice: descripción concreta del tono que debe usar el presentador en esta sección (ej: "Íntimo y directo, como si hablaras con una sola persona del público. Habla despacio, haz pausas después de las preguntas.")
- suggestedActions: array de 2-4 acciones físicas o retóricas concretas (ej: "Camina hacia el público al iniciar esta sección", "Señala los datos con el puntero sin leerlos en voz alta", "Haz una pausa de 3 segundos antes de revelar la cifra")
- keyQuestions: array de 1-3 preguntas que el presentador puede hacer (en voz alta o retóricamente) para conectar con el objetivo de esa parte (ej: "¿Cuántos de ustedes han vivido este problema?", "¿Qué pasaría si pudiéramos reducir ese costo a la mitad?")

Además, genera:
- overallNarrative: un párrafo de 4-6 oraciones que describe el arco narrativo completo de la presentación como si fuera el "pitch del pitch" — la historia que el presentador debe tener en la cabeza antes de subir al escenario. Debe ser inspirador, específico y accionable.

IMPORTANTE: los durationPercent de todas las secciones deben sumar 100. Los durationSeconds deben sumar exactamente el total de segundos disponible.

Responde ÚNICAMENTE con JSON válido:
{
  "overallNarrative": "...",
  "totalSeconds": <number>,
  "sections": [PitchSection, ...]
}`

router.post('/generate-pitch', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      storyboardSlides,
      zone1Context,
      narrativeBrief,
      presentationTitle,
      totalSeconds,
    } = req.body as {
      storyboardSlides: StoryboardSlideInput[]
      zone1Context?: Record<string, unknown>
      narrativeBrief?: string
      presentationTitle?: string
      totalSeconds: number
    }

    if (!storyboardSlides || storyboardSlides.length === 0) {
      res.status(400).json({ success: false, error: 'storyboardSlides requeridas' })
      return
    }

    const slideSummary = storyboardSlides
      .map(s =>
        `Slide ${s.slide} (${s.seconds}s · ${Math.round((s.seconds / totalSeconds) * 100)}%): "${s.fullLabel || s.label}" | tipo: ${s.type} | emoción: ${s.emotion} | intensidad: ${s.intensity}/10`
      )
      .join('\n')

    const contextStr = zone1Context
      ? `Objetivo: ${(zone1Context.objective as Record<string,string>)?.primary ?? '—'}
Audiencia: ${(zone1Context.audience as Record<string,string>)?.emotionalBaseline ?? '—'}
Tono: ${(zone1Context.tone as Record<string,string>)?.primary ?? '—'}
Apertura: ${(zone1Context.tone as Record<string,Record<string,string>>)?.arc?.opening ?? '—'}
Cierre: ${(zone1Context.tone as Record<string,Record<string,string>>)?.arc?.closing ?? '—'}`
      : ''

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: GENERATE_PITCH_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Genera el pitch narrativo completo para esta presentación.

Título: "${presentationTitle || 'Presentación'}"
Arco narrativo: ${narrativeBrief || '(no disponible)'}
Tiempo total: ${totalSeconds}s (${Math.round(totalSeconds / 60)} min)

${contextStr}

SLIDES (con tiempos asignados):
${slideSummary}

Agrupa las slides en 3-5 secciones narrativas con coherencia dramática.`,
        },
      ],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in pitch response')

    const parsed = JSON.parse(jsonMatch[0]) as PitchData

    // Normalize percentages to sum 100
    const pctSum = parsed.sections.reduce((s, sec) => s + sec.durationPercent, 0)
    if (pctSum !== 100 && pctSum > 0) {
      let remaining = 100
      parsed.sections = parsed.sections.map((sec, i) => {
        const pct = i === parsed.sections.length - 1
          ? remaining
          : Math.round((sec.durationSeconds / totalSeconds) * 100)
        remaining -= (i === parsed.sections.length - 1 ? 0 : pct)
        return { ...sec, durationPercent: pct }
      })
    }

    res.json({ success: true, pitch: parsed })
  } catch (err) {
    console.error('[zone5/generate-pitch]', err)

    // Fallback: simple 3-section split
    const slides = req.body.storyboardSlides as StoryboardSlideInput[] ?? []
    const total = req.body.totalSeconds as number ?? slides.reduce((s: number, sl: StoryboardSlideInput) => s + sl.seconds, 0)
    const third = Math.floor(slides.length / 3)
    const secs1 = slides.slice(0, third).reduce((s: number, sl: StoryboardSlideInput) => s + sl.seconds, 0)
    const secs2 = slides.slice(third, third * 2).reduce((s: number, sl: StoryboardSlideInput) => s + sl.seconds, 0)
    const secs3 = slides.slice(third * 2).reduce((s: number, sl: StoryboardSlideInput) => s + sl.seconds, 0)

    const fallback: PitchData = {
      overallNarrative: `Esta presentación recorre un arco narrativo de tres actos. Comienza estableciendo el contexto y despertando la atención de la audiencia, avanza hacia el desarrollo de la propuesta de valor con datos y evidencia, y cierra con un llamado a la acción claro y memorable. El presentador debe mantener energía constante, adaptar el tono a cada momento emocional de la curva, y asegurarse de que cada slide refuerce el mensaje central.`,
      totalSeconds: total,
      sections: [
        {
          slideRange: `Slides 1-${third}`,
          title: 'Apertura — Contexto y Gancho',
          narrativeSummary: 'Establece el problema o contexto central. Despierta la curiosidad y la identificación de la audiencia con la situación que se va a abordar.',
          durationSeconds: secs1,
          durationPercent: Math.round((secs1 / total) * 100),
          toneOfVoice: 'Cercano y seguro. Habla como si compartieras un secreto importante. Evita el tono de lectura.',
          suggestedActions: ['Inicia de pie, sin diapositiva en pantalla, mirando al público', 'Haz una pregunta retórica para romper el hielo', 'Camina hacia el frente del escenario al revelar el dato principal'],
          keyQuestions: ['¿Cuántos de ustedes han enfrentado este problema?', '¿Qué cambiaría si pudiéramos resolver esto hoy?'],
        },
        {
          slideRange: `Slides ${third + 1}-${third * 2}`,
          title: 'Desarrollo — Propuesta y Evidencia',
          narrativeSummary: 'Presenta la solución, los datos y la prueba de concepto. Es el núcleo argumentativo de la presentación.',
          durationSeconds: secs2,
          durationPercent: Math.round((secs2 / total) * 100),
          toneOfVoice: 'Experto pero accesible. Usa pausas después de los datos clave para que la audiencia procese.',
          suggestedActions: ['Señala los datos sin leerlos en voz alta', 'Haz una pausa de 3 segundos después de revelar la cifra más importante', 'Usa analogías si el tema es técnico'],
          keyQuestions: ['¿Ven por qué este número es significativo?', '¿Qué implicaciones tiene esto para ustedes?'],
        },
        {
          slideRange: `Slides ${third * 2 + 1}-${slides.length}`,
          title: 'Cierre — Llamada a la Acción',
          narrativeSummary: 'Recapitula el mensaje central y dirige a la audiencia hacia la acción deseada con claridad y urgencia.',
          durationSeconds: secs3,
          durationPercent: 100 - Math.round((secs1 / total) * 100) - Math.round((secs2 / total) * 100),
          toneOfVoice: 'Directo y con convicción. Este no es el momento de dudar. Habla en presente, no en condicional.',
          suggestedActions: ['Vuelve al centro del escenario', 'Mantén contacto visual con distintas personas del público', 'Termina con una frase corta, sin apurarte'],
          keyQuestions: ['¿Qué pueden hacer hoy con esta información?', '¿Cuál es el primer paso que van a tomar?'],
        },
      ],
    }

    res.json({ success: true, pitch: fallback, fallback: true })
  }
})

export default router
