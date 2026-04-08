export interface Zone1Context {
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
  riskFlags: Array<{
    id: string
    title: string
    mitigation: string
    severity: 'alta' | 'media' | 'baja'
    detectedBy: string
    date: string
  }>
  propagationRules: Array<{
    agent: string
    instruction: string
    reason: string
  }>
  conversation: Array<{
    role: 'agent' | 'user'
    content: string
    inputMode?: string
    timestamp: string
  }>
  nextQuestion?: string
  nextQuestionContext?: string
}

export const EMPTY_ZONE1_CONTEXT: Zone1Context = {
  presentationName: '',
  updatedAt: '',
  completeness: 0,
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
  },
  audience: {
    segments: [],
    emotionalBaseline: '',
    size: 0,
    primaryMotivation: '',
    primaryFear: '',
    attentionMinutes: 0,
    familiarity: '',
  },
  objective: {
    primary: '',
    desiredAction: '',
    successMetric: '',
    mustRemember: '',
    mustFeel: '',
  },
  tone: {
    primary: '',
    narrativeArc: '',
    hook: '',
    proof: '',
    humorAllowed: false,
    arc: { opening: '', middle: '', closing: '' },
  },
  constraints: {
    avoidTopics: [],
    mandatoryTopics: [],
    previousContext: '',
  },
  riskFlags: [],
  propagationRules: [],
  conversation: [],
  nextQuestion: '',
  nextQuestionContext: '',
}
