export type EventType = 'pitch_deck' | 'keynote' | 'workshop' | 'demo' | 'webinar'
export type EmotionalBaseline = 'escéptico' | 'neutral' | 'favorable' | 'entusiasta'
export type OpeningEmotion = 'curiosidad' | 'urgencia' | 'sorpresa' | 'empatía'
export type MiddleEmotion = 'tensión_resuelta' | 'construcción_lógica' | 'narrativa'
export type ClosingEmotion = 'confianza' | 'inspiración' | 'urgencia'

export interface Zone1Context {
  id: string
  presentation_id: string
  created_at: string
  updated_at: string
  status: 'draft' | 'validated' | 'propagated'
  event: {
    type: EventType
    duration_minutes: number
    formality_level: number
    location?: string
    virtual: boolean
  }
  audience: {
    profile_label: string
    emotional_baseline: EmotionalBaseline
    primary_motivation: string
    primary_fear: string
    attention_span_minutes: number
    size: 'individual' | 'small_group' | 'large_group' | 'mass'
  }
  objective: {
    primary: string
    success_metric: string
    what_must_they_feel: string
    what_must_they_believe: string
    what_must_they_do: string
  }
  tone: {
    primary: string
    humor_allowed: boolean
    formality: number
    emotional_arc: {
      opening: OpeningEmotion
      middle: MiddleEmotion
      closing: ClosingEmotion
    }
  }
  input_sources: {
    external_research: {
      sources: ExternalSource[]
    }
    internal_documents: {
      documents: InternalDocument[]
    }
    brand_book?: {
      uploaded: boolean
      filename?: string
      parse_confidence?: number
    }
  }
  downstream_contracts: {
    propagation_rules: PropagationRule[]
  }
  risk_flags: RiskFlag[]
  ai_metadata: {
    confidence_score: number
    suggested_next_question?: string
    conversation_history: ConversationTurn[]
  }
}

export interface ExternalSource {
  id: string
  type: 'url' | 'web_search'
  subtype: string
  url?: string
  query?: string
  destination_zone: string
  extracted_fields: string[]
  status: 'pending' | 'processing' | 'done' | 'error'
}

export interface InternalDocument {
  id: string
  type: 'pdf' | 'pptx' | 'docx'
  filename: string
  destination_zone: string
  extracted_content: {
    key_metrics: string[]
    narrative_assets: string[]
  }
  status: 'pending' | 'processing' | 'done' | 'error'
}

export interface PropagationRule {
  if_field: string
  equals: string | boolean | number
  then: string
}

export interface RiskFlag {
  id: string
  type: string
  severity: 'baja' | 'media' | 'alta'
  detected_by: string
  description: string
  mitigation: string
}

export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
