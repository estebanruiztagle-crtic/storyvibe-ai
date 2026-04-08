export type EmotionalPointType = 'peak' | 'valley' | 'transition'
export type ValenceType = 'positive' | 'negative' | 'neutral'
export type ArousalLevel = 'high' | 'medium' | 'low'
export type PacingType = 'lento' | 'medio' | 'rápido'
export type TransitionType =
  | 'descenso_gradual'
  | 'ascenso_gradual'
  | 'corte_abrupto'
  | 'meseta'
export type CognitiveLoad = 'bajo' | 'medio' | 'alto'
export type TextDensity = 'minima' | 'baja' | 'media' | 'alta'

export interface EmotionalCurve {
  id: string
  presentation_id: string
  version: number
  status: 'draft' | 'approved' | 'locked'
  global_metrics: CurveMetrics
  points: EmotionalPoint[]
  history: CurveHistoryEntry[]
}

export interface CurveMetrics {
  tension_score: number
  rhythm_balance: number
  consecutive_valleys_max: number
  total_duration_seconds: number
  alerts: CurveAlert[]
}

export interface CurveAlert {
  id: string
  type: 'consecutive_valleys' | 'low_tension' | 'abrupt_ending' | 'missing_peak'
  slides: number[]
  severity: 'info' | 'warning' | 'critical'
  suggestion: string
}

export interface EmotionalPoint {
  id: string
  slide_number: number
  label: string
  emotional: {
    type: EmotionalPointType
    target_emotion: string
    intensity: number
    valence: ValenceType
    arousal: ArousalLevel
    transition_to_next: TransitionType
  }
  narrative: {
    role: string
    resource_type: string
    content_summary?: string
  }
  timing: {
    duration_seconds: number
    cumulative_seconds: number
    pacing: PacingType
  }
  assets: {
    primary?: {
      id: string
      type: 'image' | 'video' | 'chart' | 'text'
      emotion_alignment_score: number
      url?: string
    }
  }
  design: {
    cognitive_load: CognitiveLoad
    text_density: TextDensity
    visual_weight: 'bajo' | 'medio' | 'alto'
  }
  ai_metadata: {
    agent_suggestions: AgentSuggestion[]
    iteration_count: number
  }
}

export interface AgentSuggestion {
  id: string
  agent: string
  suggestion: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface CurveHistoryEntry {
  version: number
  changed_by: 'user' | 'agent'
  change_summary: string
  timestamp: string
}
