import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Helper: Calculate completeness based on field population ─────────────────
function calculateCompleteness(ctx: Zone1Context): number {
  const requiredFields = {
    'event.type': () => !!ctx.event.type,
    'event.name': () => !!ctx.event.name,
    'event.date': () => !!ctx.event.date,
    'event.format': () => !!ctx.event.format,
    'event.durationMinutes': () => (ctx.event.durationMinutes ?? 0) > 0,
    'event.language': () => !!ctx.event.language,
    'event.location': () => !!ctx.event.location,
    'event.formalityLevel': () => (ctx.event.formalityLevel ?? 0) > 0,
    'audience.emotionalBaseline': () => !!ctx.audience.emotionalBaseline,
    'audience.size': () => (ctx.audience.size ?? 0) > 0,
    'audience.primaryMotivation': () => !!ctx.audience.primaryMotivation,
    'audience.primaryFear': () => !!ctx.audience.primaryFear,
    'audience.attentionMinutes': () => (ctx.audience.attentionMinutes ?? 0) > 0,
    'audience.familiarity': () => !!ctx.audience.familiarity,
    'audience.segments': () => (ctx.audience.segments ?? []).length > 0,
    'objective.primary': () => !!ctx.objective.primary,
    'objective.desiredAction': () => !!ctx.objective.desiredAction,
    'objective.successMetric': () => !!ctx.objective.successMetric,
    'objective.mustRemember': () => !!ctx.objective.mustRemember,
    'objective.mustFeel': () => !!ctx.objective.mustFeel,
    'tone.primary': () => !!ctx.tone.primary,
    'tone.narrativeArc': () => !!ctx.tone.narrativeArc,
    'tone.hook': () => !!ctx.tone.hook,
    'tone.proof': () => !!ctx.tone.proof,
    'tone.humorAllowed': () => ctx.tone.humorAllowed !== undefined && ctx.tone.humorAllowed !== null,
    'constraints.restrictions': () =>
      ((ctx.constraints.avoidTopics ?? []).length > 0 || (ctx.constraints.mandatoryTopics ?? []).length > 0),
  }

  const populatedCount = Object.values(requiredFields).filter((checker) => checker()).length
  const totalFields = Object.keys(requiredFields).length
  return Math.round((populatedCount / totalFields) * 100)
}

// ─── Local type definitions ────────────────────────────────────────────────────
interface RiskFlag {
  id: string
  title: string
  mitigation: string
  severity: 'alta' | 'media' | 'baja'
  detectedBy: string
  date: string
}

interface PropagationRule {
  agent: string
  instruction: string
  reason: string
}

interface ConversationTurn {
  role: 'agent' | 'user'
  content: string
  inputMode?: string
  timestamp: string
}

interface Zone1Context {
  presentationName: string
  updatedAt: string
  completeness: number
  event: {
    type: string
    name: string
    date: string
    format: 'presencial' | 'virtual' | 'híbrido'
    durationMinutes: number
    qaMinutes: number
    language: string
    location: string
    formalityLevel: number
  }
  audience: {
    segments: Array<{
      role: string
      percentage: number
      description: string
      color: string
    }>
    emotionalBaseline: string
    size: number
    primaryMotivation: string
    primaryFear: string
    attentionMinutes: number
    familiarity: string
  }
  objective: {
    primary: string
    desiredAction: string
    successMetric: string
    mustRemember: string
    mustFeel: string
  }
  tone: {
    primary: string
    narrativeArc: string
    hook: string
    proof: string
    humorAllowed: boolean
    arc: {
      opening: string
      middle: string
      closing: string
    }
  }
  constraints: {
    avoidTopics: string[]
    mandatoryTopics: string[]
    previousContext: string
  }
  riskFlags: RiskFlag[]
  propagationRules: PropagationRule[]
  conversation: ConversationTurn[]
  nextQuestion?: string
  nextQuestionContext?: string
}

// ─── System prompt ────────────────────────────────────────────────────────────
const ZONE1_SYSTEM_PROMPT = `Eres el Agente de Diagnóstico de Contexto para StoryVibe AI, un sistema de diseño de presentaciones con IA.

Tu rol es construir un "diagnóstico de contexto" completo a través de una conversación con el presentador. Este diagnóstico es la fuente de verdad que alimentará todos los agentes downstream.

CAMPOS QUE DEBES COMPLETAR (26 campos requeridos):
Evento (7): tipo, nombre, fecha, formato, durationMinutes, qaMinutes, idioma, lugar, formalityLevel
Audiencia (6): segments[], emotionalBaseline, size, primaryMotivation, primaryFear, attentionMinutes, familiarity
Objetivo (5): primary, desiredAction, successMetric, mustRemember, mustFeel
Tono (6): primary, narrativeArc, hook, proof, humorAllowed, arc (opening, middle, closing)
Restricciones (3): avoidTopics[], mandatoryTopics[], previousContext

REGLAS DE CONVERSACIÓN:
1. Haz UNA pregunta a la vez
2. Las preguntas deben ser concretas y relevantes al contexto ya conocido
3. Si el usuario da información voluntaria, extráela y actualiza el contexto aunque no hayas preguntado explícitamente
4. Cuando hayas extraído suficiente información de un campo, no vuelvas a preguntarlo
5. Usa el contexto ya conocido para hacer preguntas más inteligentes
6. Identifica proactivamente riesgos y genera alertas

CÁLCULO DE COMPLETENESS:
Cuenta los campos NO VACÍOS de los 26 requeridos:
- event.type, event.name, event.date, event.format, event.durationMinutes, event.language, event.location, event.formalityLevel
- audience.emotionalBaseline, audience.size, audience.primaryMotivation, audience.primaryFear, audience.attentionMinutes, audience.familiarity, audience.segments.length > 0
- objective.primary, objective.desiredAction, objective.successMetric, objective.mustRemember, objective.mustFeel
- tone.primary, tone.narrativeArc, tone.hook, tone.proof, tone.humorAllowed
- constraints.avoidTopics.length > 0 OR constraints.mandatoryTopics.length > 0
Completeness = (campos_poblados / 26) * 100
Redondea a entero. Conversa hasta alcanzar 80% mínimo.

EXTRACCIÓN DE VALORES CONCRETOS:
- SIEMPRE extrae valores específicos, numéricos cuando sea posible
- Para segmentos de audiencia: role (string), percentage (number), description (string), color (hex)
- Para duraciones: siempre números en minutos
- Para formalidad: número 1-10
- Para emociones/tono: palabras clave específicas, no genéricas

FORMATO DE RESPUESTA:
Responde SIEMPRE con JSON válido con esta estructura exacta:
{
  "agentMessage": "tu mensaje conversacional aquí",
  "updatedFields": {
    // solo los campos que actualizaste en esta interacción
    // usa la misma estructura que el contexto
    // IMPORTANTE: incluye VALORES CONCRETOS, no campos vacíos
  },
  "newRiskFlags": [
    // cualquier riesgo nuevo detectado
    { "id": "uuid", "title": "...", "mitigation": "...", "severity": "alta|media|baja", "detectedBy": "agente diagnóstico", "date": "YYYY-MM-DD" }
  ],
  "newPropagationRules": [
    // reglas derivadas de lo que acabas de aprender
    { "agent": "Nombre del agente destino", "instruction": "...", "reason": "..." }
  ],
  "nextQuestion": "la próxima pregunta que harías",
  "nextQuestionContext": "por qué esta pregunta es importante ahora",
  "completeness": (número calculado como se indica arriba),
  "conversationComplete": (true si completeness >= 80 y todos los campos críticos están poblados, false si no)
}

IMPORTANTE:
- Responde ÚNICAMENTE con el JSON válido. No añadas texto antes ni después del JSON.
- El completeness DEBE ser un número 0-100 basado en el cálculo anterior.
- Los updatedFields deben contener VALORES CONCRETOS extraídos de la conversación, no campos vacíos.`

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/zones/zone1/diagnose
 * Conversational diagnosis via Claude
 */
router.post('/diagnose', async (req: Request, res: Response) => {
  try {
    const {
      presentationId,
      conversationHistory,
      currentContext,
      userMessage,
    } = req.body as {
      presentationId: string
      conversationHistory: ConversationTurn[]
      currentContext: Zone1Context
      userMessage?: string
    }

    if (!presentationId) {
      res.status(400).json({ success: false, error: 'presentationId is required' })
      return
    }

    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = []

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const turn of conversationHistory) {
        messages.push({
          role: turn.role === 'agent' ? 'assistant' : 'user',
          content: turn.content,
        })
      }
    }

    // Add current user message if provided
    if (userMessage && userMessage.trim()) {
      messages.push({ role: 'user', content: userMessage })
    } else if (messages.length === 0) {
      // First turn — initiate diagnosis
      messages.push({
        role: 'user',
        content: 'Inicia el diagnóstico. Necesito preparar una presentación.',
      })
    }

    // Ensure the last message is from the user (Claude requires alternating turns ending with user)
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      messages.push({
        role: 'user',
        content: 'Continúa con la siguiente pregunta.',
      })
    }

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: ZONE1_SYSTEM_PROMPT,
      messages,
    })

    const rawContent =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON response from Claude
    let parsed: {
      agentMessage: string
      updatedFields: Partial<Zone1Context>
      newRiskFlags: RiskFlag[]
      newPropagationRules: PropagationRule[]
      nextQuestion: string
      nextQuestionContext: string
      completeness: number
      conversationComplete: boolean
    }

    try {
      // Extract JSON block from response (Claude might wrap it in markdown)
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) ||
        rawContent.match(/```\s*([\s\S]*?)\s*```/) ||
        rawContent.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : rawContent
      parsed = JSON.parse(jsonStr)
    } catch {
      // Try to rescue just the agentMessage field before falling back to raw content
      const rescued = rawContent.match(/"agentMessage"\s*:\s*"((?:[^"\\]|\\.)*)"/)
      const fallbackMsg = rescued
        ? rescued[1]
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
        : 'Lo siento, no pude procesar la respuesta. Por favor intenta de nuevo.'
      parsed = {
        agentMessage: fallbackMsg,
        updatedFields: {},
        newRiskFlags: [],
        newPropagationRules: [],
        nextQuestion: '',
        nextQuestionContext: '',
        completeness: currentContext?.completeness ?? 0,
        conversationComplete: false,
      }
    }

    // Deep-merge updated fields into current context
    const safeCtx = currentContext ?? {}
    const mergedContext: Zone1Context = {
      presentationName: safeCtx.presentationName ?? '',
      completeness: parsed.completeness, // Placeholder, will be recalculated
      updatedAt: new Date().toISOString(),
      event: {
        type: '',
        name: '',
        date: '',
        format: 'presencial',
        durationMinutes: 0,
        qaMinutes: 0,
        language: 'español',
        location: '',
        formalityLevel: 5,
        ...(safeCtx.event ?? {}),
        ...(parsed.updatedFields?.event ?? {}),
      },
      audience: {
        segments: [],
        emotionalBaseline: '',
        size: 0,
        primaryMotivation: '',
        primaryFear: '',
        attentionMinutes: 0,
        familiarity: '',
        ...(safeCtx.audience ?? {}),
        ...(parsed.updatedFields?.audience ?? {}),
      },
      objective: {
        primary: '',
        desiredAction: '',
        successMetric: '',
        mustRemember: '',
        mustFeel: '',
        ...(safeCtx.objective ?? {}),
        ...(parsed.updatedFields?.objective ?? {}),
      },
      tone: {
        primary: '',
        narrativeArc: '',
        hook: '',
        proof: '',
        humorAllowed: false,
        ...(safeCtx.tone ?? {}),
        ...(parsed.updatedFields?.tone ?? {}),
        arc: {
          opening: '',
          middle: '',
          closing: '',
          ...(safeCtx.tone?.arc ?? {}),
          ...(parsed.updatedFields?.tone?.arc ?? {}),
        },
      },
      constraints: {
        avoidTopics: [],
        mandatoryTopics: [],
        previousContext: '',
        ...(safeCtx.constraints ?? {}),
        ...(parsed.updatedFields?.constraints ?? {}),
      },
      riskFlags: [
        ...(safeCtx.riskFlags ?? []),
        ...(parsed.newRiskFlags ?? []),
      ],
      propagationRules: [
        ...(safeCtx.propagationRules ?? []),
        ...(parsed.newPropagationRules ?? []),
      ],
      conversation: [
        ...(conversationHistory ?? []),
        // Only add user message if it was explicitly sent
        ...(userMessage?.trim()
          ? [
              {
                role: 'user' as const,
                content: userMessage,
                timestamp: new Date().toISOString(),
              },
            ]
          : []),
        {
          role: 'agent' as const,
          content: parsed.agentMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      nextQuestion: parsed.nextQuestion,
      nextQuestionContext: parsed.nextQuestionContext,
    } as Zone1Context

    // Recalculate completeness based on actual field population
    const actualCompleteness = calculateCompleteness(mergedContext)
    mergedContext.completeness = actualCompleteness

    res.json({
      success: true,
      agentMessage: parsed.agentMessage,
      updatedContext: mergedContext,
      completeness: actualCompleteness,
      conversationComplete: parsed.conversationComplete || actualCompleteness >= 80,
    })
  } catch (error) {
    console.error('Zone1 diagnose error:', error)
    res.status(500).json({ success: false, error: 'Error en el agente de diagnóstico' })
  }
})

/**
 * GET /api/v1/zones/zone1/:id
 * Returns a Zone1Context by ID.
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  res.json({ success: true, id, message: 'Zone1 context retrieval not yet implemented' })
})

/**
 * PATCH /api/v1/zones/zone1/:id
 * Updates a Zone1Context by ID.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const updates = req.body
  res.json({ success: true, id, updates, message: 'Zone1 context update not yet implemented' })
})

// ─── Helper: strip HTML and extract clean text ────────────────────────────────
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000)
}

/**
 * POST /api/v1/zones/zone1/fetch-url
 * Fetches a URL server-side (avoids CORS) and returns extracted text.
 */
router.post('/fetch-url', async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string }

  if (!url) {
    res.status(400).json({ success: false, error: 'URL requerida' })
    return
  }

  // Validate URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('invalid protocol')
    }
  } catch {
    res.status(400).json({ success: false, error: 'URL no válida. Debe comenzar con http:// o https://' })
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StoryVibeAI/1.0; +https://storyvibe.ai)',
        'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es,en;q=0.9',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      res.status(400).json({
        success: false,
        error: `La URL no respondió correctamente (${response.status} ${response.statusText})`,
      })
      return
    }

    const contentType = response.headers.get('content-type') ?? ''
    const isHtml = contentType.includes('text/html') || contentType.includes('xhtml')
    const isText = contentType.includes('text/plain')

    if (!isHtml && !isText) {
      res.status(400).json({
        success: false,
        error: `Tipo de contenido no soportado: ${contentType}. Solo se pueden leer páginas web HTML o texto plano.`,
      })
      return
    }

    const rawContent = await response.text()
    const text = isHtml ? extractTextFromHtml(rawContent) : rawContent.slice(0, 12000)

    // Extract page title
    let title = parsedUrl.hostname
    if (isHtml) {
      const titleMatch = rawContent.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
      if (titleMatch?.[1]) title = titleMatch[1].replace(/\s+/g, ' ').trim()
    }

    res.json({
      success: true,
      url,
      title,
      text,
      chars: text.length,
      domain: parsedUrl.hostname,
    })
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError'
    console.error('fetch-url error:', err)
    res.status(500).json({
      success: false,
      error: isAbort
        ? 'La URL tardó demasiado en responder (timeout 12s)'
        : 'No se pudo acceder a la URL. Verifica que sea pública y accesible.',
    })
  }
})

// ─── POST /analyze-source — vision/audio analysis for Fuentes tab ─────────────
router.post('/analyze-source', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceType, fileName, dataUrl } = req.body as {
      sourceType: 'image' | 'audio' | 'video' | 'text'
      fileName?: string
      dataUrl?: string
    }

    if (!dataUrl) {
      res.status(400).json({ success: false, error: 'dataUrl requerido' })
      return
    }

    const anthropic = getAnthropic()

    if (sourceType === 'image') {
      // Strip data URL prefix to get base64
      const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!base64Match) {
        res.status(400).json({ success: false, error: 'Formato de imagen inválido' })
        return
      }
      const mediaType = base64Match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      const base64Data = base64Match[2]

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Data },
              },
              {
                type: 'text',
                text: `Analiza esta imagen en el contexto de preparar una presentación. Describe brevemente:
1. ¿Qué muestra la imagen?
2. ¿Qué información, texto, datos o conceptos clave contiene?
3. ¿Cómo podría ser relevante para construir el contexto de una presentación (evento, audiencia, objetivo, tono)?

Responde en español, en 3-5 oraciones concisas. Sé específico sobre el contenido visible.${fileName ? ` (Archivo: ${fileName})` : ''}`,
              },
            ],
          },
        ],
      })

      const description = response.content[0]?.type === 'text' ? response.content[0].text : ''
      res.json({ success: true, description })
      return
    }

    if (sourceType === 'audio') {
      // Claude doesn't natively transcribe audio via REST API — indicate to user
      // In production you'd use Whisper API here
      res.json({
        success: true,
        transcription: `[Audio: ${fileName ?? 'archivo de audio'}] — La transcripción automática de audio requiere integración con un servicio de speech-to-text (ej. Whisper). Por ahora, por favor escribe o pega el contenido del audio en el campo de texto, o usa la grabación de voz directamente en el tab de Diagnóstico.`,
      })
      return
    }

    res.json({ success: true, description: `Archivo adjunto: ${fileName ?? 'sin nombre'}` })
  } catch (err: unknown) {
    console.error('analyze-source error:', err)
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Error al analizar el archivo',
    })
  }
})

export { router as zone1Router }
