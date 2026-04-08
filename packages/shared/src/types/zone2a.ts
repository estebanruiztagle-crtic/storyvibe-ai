export type TopicType =
  | 'problema_contexto'
  | 'dato_duro'
  | 'propuesta_valor'
  | 'prueba_social'
  | 'visión'
  | 'contexto_mercado'

export type TopicOrigin =
  | 'investigación_web'
  | 'documento_interno'
  | 'manual'
  | 'sugerencia_ia'

export interface Zone2AData {
  id: string
  presentation_id: string
  status: 'draft' | 'validated'
  author_pattern: AuthorPattern
  topics: Topic[]
  contract_output: {
    status: 'pending' | 'validated'
    ready_for_2b: boolean
    validated_at?: string
  }
}

export interface AuthorPattern {
  learned_from_presentations: number
  typical_topic_count: { min: number; max: number; preferred: number }
  selection_bias: string[]
  confidence: number
}

export interface Topic {
  id: string
  label: string
  type: TopicType
  origin: TopicOrigin
  description?: string
  weight: {
    relevance_to_audience: number
    emotional_potential: number
    data_availability: number
    author_pattern_match: number
    composite_score: number
  }
  selected: boolean
  mandatory: boolean
  order?: number
}

// ─── Zone2A Shape snapshot data ───────────────────────────────────────────────
export interface Zone2AShapeData {
  presentationName: string
  status: 'empty' | 'in_progress' | 'validated'
  topicCount: number
  selectedCount: number
  mandatoryCount: number
  authorPatternConfidence: number
  contractReady: boolean
  topicsJson: string // serialized Topic[]
  patternJson: string // serialized AuthorPattern
}

export const EMPTY_ZONE2A: Zone2AShapeData = {
  presentationName: '',
  status: 'empty',
  topicCount: 0,
  selectedCount: 0,
  mandatoryCount: 0,
  authorPatternConfidence: 0,
  contractReady: false,
  topicsJson: '',
  patternJson: '',
}
