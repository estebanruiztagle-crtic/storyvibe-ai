import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import type { CurvePoint, PacingResult, ScriptData } from '../../types'

const router = Router()
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

IDIOMA: Español latinoamericano neutro (NO argentino, NO español de España). Usa "tú" siempre.

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

// ─── POST /generate-script ────────────────────────────────────────────────────
// Generates the narrative script from the story beats + diagnosis (NO design deps).
// Output: structured, enriched sections meant as a brief for building the deck
// afterwards in Claude Design.

const GENERATE_SCRIPT_SYSTEM = `Eres un coach experto en storytelling y presentaciones de alto impacto.
IDIOMA: Español latinoamericano neutro (NO argentino, NO español de España). Usa "tú" siempre.

Tu tarea es generar el GUION NARRATIVO de una presentación a partir de sus BEATS (momentos narrativos) y el diagnóstico de contexto. Este guion NO es sobre diseño de láminas: es la historia hablada que guiará a quien luego arme la presentación.

Agrupa los beats en 3-5 SECCIONES narrativas coherentes (no una por beat). Cada sección debe tener:
- beatRange: rango de beats que abarca (ej: "Beats 1-2")
- title: nombre de la sección con su función dramática (ej: "Apertura — El Problema", "Desarrollo — La Evidencia", "Cierre — La Llamada a la Acción")
- keyMessage: UNA sola frase con la idea central que la audiencia debe retener de esta sección
- whatToTell: 2-4 oraciones concretas sobre QUÉ contar aquí (el contenido narrativo: qué historia, qué datos, qué ejemplo). Accionable, no genérico.
- toneOfVoice: cómo debe sonar el presentador en esta sección (ritmo, energía, actitud)
- transition: 1 oración con la frase o idea puente para pasar a la siguiente sección de forma fluida
- keyQuestions: array de 1-3 preguntas (reales o retóricas) que conectan con el objetivo de esta parte
- durationSeconds: suma aproximada de los segundos de los beats incluidos
- durationPercent: porcentaje entero sobre el total

Además genera:
- overallNarrative: párrafo de 4-6 oraciones con el arco completo — "la historia que el presentador debe tener en la cabeza antes de subir al escenario". Inspirador, específico y accionable.

IMPORTANTE: los durationPercent deben sumar 100. Los durationSeconds deben sumar aproximadamente el total disponible.

Responde ÚNICAMENTE con JSON válido:
{
  "overallNarrative": "...",
  "totalSeconds": <number>,
  "sections": [
    {"beatRange": "...", "title": "...", "keyMessage": "...", "whatToTell": "...", "toneOfVoice": "...", "transition": "...", "keyQuestions": ["..."], "durationSeconds": <number>, "durationPercent": <number>}
  ]
}`

router.post('/generate-script', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      curvePoints,
      zone1Context,
      narrativeBrief,
      frameworkName,
      selectedTopics,
      presentationTitle,
      totalSeconds: totalSecondsRaw,
    } = req.body as {
      curvePoints: CurvePoint[]
      zone1Context?: Record<string, unknown>
      narrativeBrief?: string
      frameworkName?: string
      selectedTopics?: string[]
      presentationTitle?: string
      totalSeconds?: number
    }

    if (!curvePoints || curvePoints.length === 0) {
      res.status(400).json({ success: false, error: 'curvePoints (beats) requeridos' })
      return
    }

    const totalSeconds = totalSecondsRaw
      ?? curvePoints.reduce((s, p) => s + (p.durationSeconds ?? 90), 0)

    const beatSummary = curvePoints
      .map((p) => {
        const secs = p.durationSeconds ?? Math.round(totalSeconds / curvePoints.length)
        const extra = p.contentDirection ?? p.speakerNotes ?? ''
        return `Beat ${p.slide} (${secs}s): "${p.fullLabel || p.label}" | tipo: ${p.type} | emoción: ${p.emotion} | intensidad: ${p.intensity}/10${extra ? ` | nota: ${extra}` : ''}`
      })
      .join('\n')

    const contextStr = zone1Context
      ? `Objetivo: ${(zone1Context.objective as Record<string, string>)?.primary ?? '—'}
Acción deseada: ${(zone1Context.objective as Record<string, string>)?.desiredAction ?? '—'}
Audiencia (baseline emocional): ${(zone1Context.audience as Record<string, string>)?.emotionalBaseline ?? '—'}
Tono: ${(zone1Context.tone as Record<string, string>)?.primary ?? '—'}
Apertura: ${(zone1Context.tone as Record<string, Record<string, string>>)?.arc?.opening ?? '—'}
Cierre: ${(zone1Context.tone as Record<string, Record<string, string>>)?.arc?.closing ?? '—'}`
      : ''

    const topicsStr = selectedTopics && selectedTopics.length > 0
      ? `\nTópicos clave: ${selectedTopics.join(', ')}`
      : ''

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: GENERATE_SCRIPT_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Genera el guion narrativo completo para esta presentación.

Título: "${presentationTitle || 'Presentación'}"
Framework narrativo: ${frameworkName || '(no especificado)'}
Arco narrativo: ${narrativeBrief || '(no disponible)'}
Tiempo total: ${totalSeconds}s (${Math.round(totalSeconds / 60)} min)${topicsStr}

${contextStr}

BEATS (momentos narrativos):
${beatSummary}

Agrupa los beats en 3-5 secciones narrativas con coherencia dramática.`,
        },
      ],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in script response')

    const parsed = JSON.parse(jsonMatch[0]) as ScriptData

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

    res.json({ success: true, script: parsed })
  } catch (err) {
    console.error('[zone5/generate-script]', err)

    // Fallback: simple 3-section split over the beats
    const beats = (req.body.curvePoints as CurvePoint[]) ?? []
    const total = (req.body.totalSeconds as number)
      ?? beats.reduce((s, p) => s + (p.durationSeconds ?? 90), 0)
    const third = Math.max(1, Math.floor(beats.length / 3))
    const sumSecs = (arr: CurvePoint[]) =>
      arr.reduce((s, p) => s + (p.durationSeconds ?? Math.round(total / (beats.length || 1))), 0)
    const secs1 = sumSecs(beats.slice(0, third))
    const secs2 = sumSecs(beats.slice(third, third * 2))
    const secs3 = sumSecs(beats.slice(third * 2))
    const pct = (s: number) => (total > 0 ? Math.round((s / total) * 100) : 0)

    const fallback: ScriptData = {
      overallNarrative: `Esta presentación recorre un arco narrativo de tres actos. Abre estableciendo el contexto y despertando la atención de la audiencia, avanza hacia el desarrollo de la propuesta de valor con evidencia, y cierra con un llamado a la acción claro y memorable. El presentador mantiene energía constante y adapta el tono a cada momento emocional de la curva.`,
      totalSeconds: total,
      sections: [
        {
          beatRange: `Beats 1-${third}`,
          title: 'Apertura — Contexto y Gancho',
          keyMessage: 'Existe un problema relevante que vale la pena resolver ahora.',
          whatToTell: 'Establece el problema o contexto central con un ejemplo concreto que la audiencia reconozca. Despierta curiosidad e identificación antes de proponer nada.',
          toneOfVoice: 'Cercano y seguro. Habla como si compartieras algo importante; evita el tono de lectura.',
          transition: 'Del problema pasamos naturalmente a cómo se resuelve.',
          keyQuestions: ['¿Cuántos de ustedes han enfrentado este problema?'],
          durationSeconds: secs1,
          durationPercent: pct(secs1),
        },
        {
          beatRange: `Beats ${third + 1}-${third * 2}`,
          title: 'Desarrollo — Propuesta y Evidencia',
          keyMessage: 'Hay una solución concreta respaldada por evidencia.',
          whatToTell: 'Presenta la solución, los datos y la prueba de concepto. Es el núcleo argumentativo: conecta cada dato con el problema de la apertura.',
          toneOfVoice: 'Experto pero accesible. Usa pausas después de los datos clave.',
          transition: 'Con la evidencia sobre la mesa, dirigimos a la audiencia hacia la acción.',
          keyQuestions: ['¿Ven por qué este número es significativo?'],
          durationSeconds: secs2,
          durationPercent: pct(secs2),
        },
        {
          beatRange: `Beats ${third * 2 + 1}-${beats.length}`,
          title: 'Cierre — Llamada a la Acción',
          keyMessage: 'Este es el primer paso concreto que la audiencia debe dar.',
          whatToTell: 'Recapitula el mensaje central y dirige a la audiencia hacia la acción deseada con claridad y urgencia.',
          toneOfVoice: 'Directo y con convicción. Habla en presente, no en condicional.',
          transition: 'Cierra con una frase corta y memorable.',
          keyQuestions: ['¿Cuál es el primer paso que van a tomar?'],
          durationSeconds: secs3,
          durationPercent: 100 - pct(secs1) - pct(secs2),
        },
      ],
    }

    res.json({ success: true, script: fallback, fallback: true })
  }
})

export default router
