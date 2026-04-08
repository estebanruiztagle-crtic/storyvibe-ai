import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Local types ──────────────────────────────────────────────────────────────
type TopicType =
  | 'problema_contexto'
  | 'dato_duro'
  | 'propuesta_valor'
  | 'prueba_social'
  | 'visión'
  | 'contexto_mercado'

type TopicOrigin = 'investigación web' | 'documento interno' | 'manual' | 'sugerencia ia'

interface Topic {
  id: string
  label: string
  type: TopicType
  origin: TopicOrigin
  score: number
  selected: boolean
  mandatory: boolean
  systemSuggested: boolean
  durationMinutes: number
  rejectedReason?: string
}

interface AuthorPattern {
  presentationsAnalyzed: number
  topicCountMin: number
  topicCountMax: number
  topicCountPreferred: number
  detectedBiases: string[]
  confidence: number
}

interface StorytellingFramework {
  id: string
  name: string
  origin: string
  fitScore: number
  recommended: boolean
  description: string
  fitReasons: string[]
  emotionalArc: string[]
  risk: string
}

interface CurvePoint {
  slide: number
  label: string
  fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
  topicType: string
  systemType: 'peak' | 'valley' | 'transition'
  systemEmotion: string
  systemIntensity: number
  modified: boolean
  mappingRules: string[]
  // Act #3 design contract
  suggestedTitle?: string
  contentDirection?: string
  designStyle?: 'hero' | 'data' | 'quote' | 'list' | 'image' | 'comparison' | 'split' | 'timeline'
  visualMood?: 'dark_bold' | 'light_clean' | 'data_heavy' | 'conceptual' | 'emotional' | 'neutral'
  speakerNotes?: string
  durationSeconds?: number
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

// ─── POST /suggest-topics ─────────────────────────────────────────────────────
const SUGGEST_TOPICS_PROMPT = `Eres el Agente de Curación de Tópicos para StoryVibe AI.

Basado en el contexto de Zona 1 (audiencia, objetivo, tono, restricciones), sugiere 6-8 tópicos candidatos para la presentación. Identifica cuáles son obligatorios por las restricciones de Zona 1. Calcula un "author pattern" simulado.

Tipos de tópico permitidos: problema_contexto, dato_duro, propuesta_valor, prueba_social, visión, contexto_mercado
Orígenes permitidos: "investigación web", "documento interno", "manual", "sugerencia ia"

Para cada tópico:
- id: uuid string corto
- label: nombre conciso del tópico (máx 50 chars)
- type: uno de los tipos permitidos
- origin: "sugerencia ia" para todos los sugeridos por IA
- score: número 0-10 representando relevancia compuesta
- selected: true si es muy relevante o mandatory
- mandatory: true si aparece en mandatoryTopics de Zona 1
- systemSuggested: true
- durationMinutes: estimado razonable (3-8 min)
- rejectedReason: solo si selected=false, razón breve

Para authorPattern, basa presentationsAnalyzed en 8-15 (simulado), y confidence en 65-90.

Responde ÚNICAMENTE con JSON válido:
{
  "topics": [...],
  "authorPattern": {
    "presentationsAnalyzed": number,
    "topicCountMin": number,
    "topicCountMax": number,
    "topicCountPreferred": number,
    "detectedBiases": string[],
    "confidence": number
  }
}`

router.post('/suggest-topics', async (req: Request, res: Response) => {
  try {
    const { presentationId, zone1Context } = req.body as {
      presentationId: string
      zone1Context: Record<string, unknown>
    }

    if (!presentationId) {
      res.status(400).json({ success: false, error: 'presentationId is required' })
      return
    }

    const contextSummary = JSON.stringify(zone1Context ?? {}, null, 2)

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2500,
      system: SUGGEST_TOPICS_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Genera los tópicos candidatos para esta presentación.\n\nContexto de Zona 1:\n${contextSummary}`,
        },
      ],
    })

    const firstBlock = response.content[0]
    const rawContent = firstBlock && firstBlock.type === 'text' ? firstBlock.text : ''
    let parsed: { topics: Topic[]; authorPattern: AuthorPattern }

    try {
      parsed = JSON.parse(extractJson(rawContent))
    } catch {
      // Fallback with sensible defaults
      parsed = {
        topics: [
          {
            id: 'topic-1',
            label: 'Contexto del problema principal',
            type: 'problema_contexto',
            origin: 'sugerencia ia',
            score: 8.5,
            selected: true,
            mandatory: false,
            systemSuggested: true,
            durationMinutes: 5,
          },
          {
            id: 'topic-2',
            label: 'Dato clave de mercado',
            type: 'dato_duro',
            origin: 'sugerencia ia',
            score: 7.8,
            selected: true,
            mandatory: false,
            systemSuggested: true,
            durationMinutes: 4,
          },
          {
            id: 'topic-3',
            label: 'Propuesta de valor diferencial',
            type: 'propuesta_valor',
            origin: 'sugerencia ia',
            score: 9.2,
            selected: true,
            mandatory: false,
            systemSuggested: true,
            durationMinutes: 6,
          },
          {
            id: 'topic-4',
            label: 'Caso de éxito de cliente',
            type: 'prueba_social',
            origin: 'sugerencia ia',
            score: 8.1,
            selected: true,
            mandatory: false,
            systemSuggested: true,
            durationMinutes: 5,
          },
          {
            id: 'topic-5',
            label: 'Visión 2026 y roadmap',
            type: 'visión',
            origin: 'sugerencia ia',
            score: 7.5,
            selected: true,
            mandatory: false,
            systemSuggested: true,
            durationMinutes: 4,
          },
          {
            id: 'topic-6',
            label: 'Contexto de industria',
            type: 'contexto_mercado',
            origin: 'sugerencia ia',
            score: 6.2,
            selected: false,
            mandatory: false,
            systemSuggested: true,
            durationMinutes: 3,
            rejectedReason: 'score bajo, relevancia limitada',
          },
        ],
        authorPattern: {
          presentationsAnalyzed: 12,
          topicCountMin: 4,
          topicCountMax: 7,
          topicCountPreferred: 5,
          detectedBiases: ['preferencia por datos cuantitativos', 'cierre con visión'],
          confidence: 72,
        },
      }
    }

    res.json({ success: true, ...parsed })
  } catch (error) {
    console.error('Zone2 suggest-topics error:', error)
    res.status(500).json({ success: false, error: 'Error en el agente de tópicos' })
  }
})

// ─── POST /suggest-frameworks ─────────────────────────────────────────────────
const SUGGEST_FRAMEWORKS_PROMPT = `Eres el Agente de Arquitectura Narrativa para StoryVibe AI.

Dado el contexto de Zona 1 y los tópicos seleccionados, evalúa y presenta exactamente 4 frameworks narrativos para estructurar la presentación. Calcula un fitScore (0-100) basado en el match con el contexto.

Para cada framework:
- id: slug único
- name: nombre del framework
- origin: autor o tradición (ej: "Chris Anderson / TED", "Nancy Duarte", "Aristoteles")
- fitScore: 0-100 match con el contexto dado
- recommended: true solo para el de mayor fitScore
- description: 1-2 oraciones explicando el framework
- fitReasons: 2-3 razones por qué encaja con ESTE contexto
- emotionalArc: 4-6 emociones que recorre el arco (ej: ["confusión", "revelación", "esperanza", "compromiso"])
- risk: una frase sobre el principal riesgo de usar este framework mal

Frameworks a considerar: The Monomyth, Sparkline (Duarte), Problem-Solution-Benefit, Situation-Complication-Resolution, Pyramid Principle, The Hero's Journey, Start With Why (Sinek), antes-después-puente.

Responde ÚNICAMENTE con JSON válido:
{
  "frameworks": [...]
}`

router.post('/suggest-frameworks', async (req: Request, res: Response) => {
  try {
    const { presentationId, topics, zone1Context } = req.body as {
      presentationId: string
      topics: Topic[]
      zone1Context: Record<string, unknown>
    }

    if (!presentationId) {
      res.status(400).json({ success: false, error: 'presentationId is required' })
      return
    }

    const topicLabels = (topics ?? []).map((t) => `${t.label} (${t.type})`).join(', ')
    const contextSummary = JSON.stringify(zone1Context ?? {}, null, 2)

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      system: SUGGEST_FRAMEWORKS_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Sugiere 4 frameworks narrativos para esta presentación.\n\nTópicos seleccionados: ${topicLabels}\n\nContexto de Zona 1:\n${contextSummary}`,
        },
      ],
    })

    const fwBlock = response.content[0]
    const rawContent = fwBlock && fwBlock.type === 'text' ? fwBlock.text : ''
    let parsed: { frameworks: StorytellingFramework[] }

    try {
      parsed = JSON.parse(extractJson(rawContent))
    } catch {
      // Fallback
      parsed = {
        frameworks: [
          {
            id: 'problem-solution-benefit',
            name: 'Problema → Solución → Beneficio',
            origin: 'Retórica clásica',
            fitScore: 88,
            recommended: true,
            description: 'Estructura directa que primero establece el dolor, luego presenta la solución y finalmente cuantifica el valor obtenido.',
            fitReasons: [
              'Audiencia escéptica necesita ver el problema antes de la solución',
              'Objetivo de ventas/persuasión se beneficia de la secuencia lógica',
              'Compatible con los tópicos de dato_duro y prueba_social incluidos',
            ],
            emotionalArc: ['reconocimiento', 'tensión', 'alivio', 'confianza', 'compromiso'],
            risk: 'Si el problema no resuena con la audiencia, todo el arco falla.',
          },
          {
            id: 'sparkline',
            name: 'Sparkline (Duarte)',
            origin: 'Nancy Duarte',
            fitScore: 79,
            recommended: false,
            description: 'Alterna entre "lo que es" y "lo que podría ser", creando tensión dramática que empuja a la acción.',
            fitReasons: [
              'Ideal para presentaciones de cambio o transformación',
              'La alternancia crea ritmo emocional natural',
            ],
            emotionalArc: ['realidad actual', 'posibilidad', 'contraste', 'visión', 'llamado a acción'],
            risk: 'Puede volverse repetitivo si los contrastes no son suficientemente vívidos.',
          },
          {
            id: 'scr',
            name: 'Situación–Complicación–Resolución',
            origin: 'McKinsey / Barbara Minto',
            fitScore: 74,
            recommended: false,
            description: 'Framework consultor clásico: establece el contexto, introduce la complicación que crea urgencia, y presenta la resolución estructurada.',
            fitReasons: [
              'Funciona bien con audiencias analíticas',
              'La complicación genera urgencia',
            ],
            emotionalArc: ['comprensión', 'preocupación', 'urgencia', 'claridad', 'acción'],
            risk: 'Sin emoción suficiente en la complicación, la resolución pierde impacto.',
          },
          {
            id: 'start-with-why',
            name: 'Start With Why',
            origin: 'Simon Sinek',
            fitScore: 68,
            recommended: false,
            description: 'Comienza con el propósito y los valores antes de explicar el cómo y el qué, apelando a la toma de decisiones emocional.',
            fitReasons: [
              'Efectivo para construir credibilidad del presentador',
              'Conecta con valores de la audiencia',
            ],
            emotionalArc: ['inspiración', 'curiosidad', 'conexión', 'entendimiento', 'motivación'],
            risk: 'Si el "por qué" no es auténtico o relevante, la audiencia lo percibe como vacío.',
          },
        ],
      }
    }

    res.json({ success: true, ...parsed })
  } catch (error) {
    console.error('Zone2 suggest-frameworks error:', error)
    res.status(500).json({ success: false, error: 'Error en el agente de frameworks' })
  }
})

// ─── POST /generate-curve ─────────────────────────────────────────────────────
const GENERATE_CURVE_PROMPT = `Eres el Agente Generador del Arco Narrativo para StoryVibe AI.

Convierte el framework narrativo seleccionado y los tópicos en una secuencia de puntos de curva emocional. Cada tópico se convierte en 1 diapositiva. Tu output es el CONTRATO DE DISEÑO que el Acto #3 usará para diseñar cada diapositiva.

REGLAS DE MAPEO EMOCIONAL:
- problema_contexto → peak (urgencia/curiosidad)
- dato_duro → valley (análisis frío/atención racional)
- propuesta_valor → transition (esperanza/alivio)
- prueba_social → peak (confianza/excitación)
- visión → peak con intensidad máxima (8-10)
- contexto_mercado → valley o transition

CALIBRACIÓN POR AUDIENCIA (baseline emocional de Zona 1):
- "escéptico" → valleys +1 intensidad, picos -1
- "entusiasta" → picos +1 intensidad
- "neutral" → sin ajuste

DIAPOSITIVAS EXTRA:
- Diapositiva 1: Apertura (peak o transition, intensidad 7-8) — hook inicial
- Última diapositiva: Cierre CTA (peak, intensidad 9-10) — llamado a la acción

ESTILOS DE DISEÑO disponibles para designStyle:
- "hero": título grande + imagen de impacto (picos emocionales altos)
- "data": gráfico o tabla + insight (valleys racionales)
- "quote": cita destacada + atribución (transiciones o picos emocionales)
- "list": puntos clave estructurados (valleys o contenido informativo)
- "image": imagen dominante con texto mínimo (picos emocionales)
- "comparison": antes/después o A vs B (transiciones o propuestas de valor)
- "split": mitad texto / mitad visual (equilibrado)
- "timeline": secuencia temporal o de pasos (contexto_mercado, visión)

MOOD VISUAL disponibles para visualMood:
- "dark_bold": fondo oscuro, contraste alto, tipografía grande (picos de alta intensidad)
- "light_clean": fondo claro, espaciado, minimalista (valleys, análisis)
- "data_heavy": densidad de información, tablas, charts (dato_duro)
- "conceptual": ilustraciones, metáforas visuales (propuesta_valor, visión)
- "emotional": fotografía humana, calor visual (prueba_social, cierre)
- "neutral": balance, presentación corporativa estándar (apertura, transiciones)

Para cada punto de curva, produce:
- slide: número secuencial desde 1
- label: etiqueta corta (máx 20 chars)
- fullLabel: label completo descriptivo
- type: "peak" | "valley" | "transition"
- emotion: emoción específica en español
- intensity: 1-10 (calibrado por audiencia)
- topicType: tipo del tópico origen
- systemType / systemEmotion / systemIntensity: iguales a type/emotion/intensity (valores originales para reset)
- modified: false
- mappingRules: array de strings con las reglas aplicadas
- suggestedTitle: título de diapositiva en español, concreto y accionable (máx 60 chars)
- contentDirection: 1-2 oraciones describiendo QUÉ comunica esta diapositiva y CÓMO
- designStyle: uno de los estilos listados arriba (el más apropiado para esta slide)
- visualMood: uno de los moods listados arriba
- speakerNotes: 2-3 puntos clave para decir en esta diapositiva
- durationSeconds: duración estimada en segundos (basado en durationMinutes del tópico × 60, ajustado por tipo)

Además del arco, genera:
- narrativeBrief: 2-3 oraciones describiendo el arco narrativo completo de la presentación
- presentationTitle: título sugerido para la presentación completa

Responde ÚNICAMENTE con JSON válido:
{
  "curvePoints": [...],
  "narrativeBrief": "...",
  "presentationTitle": "...",
  "mappings": [{ "topicId": string, "slideIndex": number, "rules": string[] }]
}`

router.post('/generate-curve', async (req: Request, res: Response) => {
  try {
    const { presentationId, framework, topics, zone1Context } = req.body as {
      presentationId: string
      framework: StorytellingFramework
      topics: Topic[]
      zone1Context: Record<string, unknown>
    }

    if (!presentationId) {
      res.status(400).json({ success: false, error: 'presentationId is required' })
      return
    }

    const topicList = (topics ?? [])
      .map((t) => `- ${t.label} (type: ${t.type}, score: ${t.score}, duration: ${t.durationMinutes}min)`)
      .join('\n')
    const contextSummary = JSON.stringify(zone1Context ?? {}, null, 2)
    const frameworkSummary = JSON.stringify(framework ?? {}, null, 2)

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3500,
      system: GENERATE_CURVE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Genera la curva emocional.\n\nFramework:\n${frameworkSummary}\n\nTópicos seleccionados:\n${topicList}\n\nContexto de Zona 1:\n${contextSummary}`,
        },
      ],
    })

    const curveBlock = response.content[0]
    const rawContent = curveBlock && curveBlock.type === 'text' ? curveBlock.text : ''
    let parsed: { curvePoints: CurvePoint[]; narrativeBrief?: string; presentationTitle?: string; mappings: unknown[] }

    try {
      parsed = JSON.parse(extractJson(rawContent))
    } catch {
      // Fallback curve with design contract fields
      const fallbackTopics = topics ?? []
      const designStyleMap: Record<string, string> = {
        problema_contexto: 'hero',
        dato_duro: 'data',
        propuesta_valor: 'comparison',
        prueba_social: 'quote',
        visión: 'image',
        contexto_mercado: 'timeline',
      }
      const visualMoodMap: Record<string, string> = {
        problema_contexto: 'dark_bold',
        dato_duro: 'data_heavy',
        propuesta_valor: 'conceptual',
        prueba_social: 'emotional',
        visión: 'dark_bold',
        contexto_mercado: 'neutral',
      }
      const curvePoints: CurvePoint[] = [
        {
          slide: 1,
          label: 'Apertura',
          fullLabel: 'Apertura e introducción',
          type: 'peak',
          emotion: 'curiosidad',
          intensity: 7,
          topicType: 'intro',
          systemType: 'peak',
          systemEmotion: 'curiosidad',
          systemIntensity: 7,
          modified: false,
          mappingRules: ['Apertura generada para captar atención inicial'],
          suggestedTitle: 'Bienvenidos — El momento de cambiar',
          contentDirection: 'Captura la atención con un hook poderoso que plantea el reto o la oportunidad central.',
          designStyle: 'hero',
          visualMood: 'dark_bold',
          speakerNotes: 'Abrir con pregunta o dato sorpresivo. Establecer credibilidad. Presentar la agenda.',
          durationSeconds: 90,
        },
        ...fallbackTopics.map((t, i): CurvePoint => {
          const type: 'peak' | 'valley' | 'transition' =
            t.type === 'problema_contexto' ? 'peak' :
            t.type === 'dato_duro' ? 'valley' :
            t.type === 'propuesta_valor' ? 'transition' :
            t.type === 'prueba_social' ? 'peak' :
            t.type === 'visión' ? 'peak' : 'transition'
          const emotion = type === 'peak' ? 'excitación' : type === 'valley' ? 'análisis' : 'esperanza'
          const intensity = t.type === 'visión' ? 9 : type === 'peak' ? 7 : type === 'valley' ? 4 : 6
          return {
            slide: i + 2,
            label: t.label.substring(0, 20),
            fullLabel: t.label,
            type, emotion, intensity,
            topicType: t.type,
            systemType: type, systemEmotion: emotion, systemIntensity: intensity,
            modified: false,
            mappingRules: [`${t.type} → ${type} por regla de mapeo base`],
            suggestedTitle: t.label,
            contentDirection: `Comunica ${t.label} con foco en ${emotion}. Duración estimada: ${t.durationMinutes} min.`,
            designStyle: (designStyleMap[t.type] ?? 'split') as CurvePoint['designStyle'],
            visualMood: (visualMoodMap[t.type] ?? 'neutral') as CurvePoint['visualMood'],
            speakerNotes: `Presentar ${t.label}. Conectar con la audiencia usando ${emotion}.`,
            durationSeconds: (t.durationMinutes ?? 4) * 60,
          }
        }),
        {
          slide: fallbackTopics.length + 2,
          label: 'Cierre',
          fullLabel: 'Llamado a la acción',
          type: 'peak',
          emotion: 'compromiso',
          intensity: 9,
          topicType: 'cta',
          systemType: 'peak',
          systemEmotion: 'compromiso',
          systemIntensity: 9,
          modified: false,
          mappingRules: ['Cierre con llamado a acción de alta intensidad'],
          suggestedTitle: 'El siguiente paso empieza hoy',
          contentDirection: 'Cierre con llamado a acción claro y memorable. Qué debe hacer la audiencia ahora.',
          designStyle: 'hero',
          visualMood: 'dark_bold',
          speakerNotes: 'Resumir el viaje emocional. Dar el CTA específico. Dejar imagen mental duradera.',
          durationSeconds: 120,
        },
      ]
      parsed = {
        curvePoints,
        narrativeBrief: 'La presentación sigue un arco clásico: abre con impacto, desarrolla el contexto y la propuesta, y cierra con un llamado a la acción.',
        presentationTitle: 'Presentación sin título',
        mappings: [],
      }
    }

    res.json({ success: true, ...parsed })
  } catch (error) {
    console.error('Zone2 generate-curve error:', error)
    res.status(500).json({ success: false, error: 'Error en el generador de curva emocional' })
  }
})

export { router as zone2Router }
