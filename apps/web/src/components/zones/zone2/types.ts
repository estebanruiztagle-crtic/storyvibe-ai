export interface Topic {
  id: string
  label: string
  type: 'problema_contexto' | 'dato_duro' | 'propuesta_valor' | 'prueba_social' | 'visión' | 'contexto_mercado'
  origin: 'investigación web' | 'documento interno' | 'manual' | 'sugerencia ia'
  score: number  // composite score 0-10
  selected: boolean
  mandatory: boolean
  systemSuggested: boolean
  durationMinutes: number
  rejectedReason?: string
}

export interface AuthorPattern {
  presentationsAnalyzed: number
  topicCountMin: number
  topicCountMax: number
  topicCountPreferred: number
  detectedBiases: string[]
  confidence: number
}

export interface StorytellingFramework {
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

export type DesignStyle = 'hero' | 'data' | 'quote' | 'list' | 'image' | 'comparison' | 'split' | 'timeline'
export type VisualMood = 'dark_bold' | 'light_clean' | 'data_heavy' | 'conceptual' | 'emotional' | 'neutral'

export interface CurvePoint {
  slide: number
  label: string
  fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
  topicType: string
  // system-generated originals (for reset)
  systemType: 'peak' | 'valley' | 'transition'
  systemEmotion: string
  systemIntensity: number
  modified: boolean
  mappingRules: string[]
  // ── Acto #3 design contract ──────────────────────
  suggestedTitle?: string       // draft slide title for Act 3
  contentDirection?: string     // 1-2 sentences: what this slide communicates
  designStyle?: DesignStyle     // slide layout type
  visualMood?: VisualMood       // visual intensity/tone
  speakerNotes?: string         // key talking points
  durationSeconds?: number      // estimated on-screen time
}

export interface Zone2State {
  // 2A — Topics
  authorPattern: AuthorPattern
  topics: Topic[]
  // 2B — Narrative architecture
  frameworks: StorytellingFramework[]
  selectedFrameworkId: string | null
  // Curve — Emotional arc
  curvePoints: CurvePoint[]
  curveStatus: 'not_generated' | 'draft' | 'approved'
  curveVersion: number
  // Narrative contract (exported to Act #3)
  narrativeBrief?: string       // AI-generated arc summary
  presentationTitle?: string    // suggested presentation title
}

export const EMPTY_ZONE2: Zone2State = {
  authorPattern: {
    presentationsAnalyzed: 0,
    topicCountMin: 4,
    topicCountMax: 7,
    topicCountPreferred: 5,
    detectedBiases: [],
    confidence: 0,
  },
  topics: [],
  frameworks: [],
  selectedFrameworkId: null,
  curvePoints: [],
  curveStatus: 'not_generated',
  curveVersion: 0,
}

export type Zone2Tab = '2a' | '2b' | 'curve'
