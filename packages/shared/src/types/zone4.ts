export type SuggestionAxis = 'brand_compliance' | 'cognitive_load' | 'emotional_alignment'
export type SuggestionSeverity = 'low' | 'medium' | 'high' | 'critical'
export type CanvaActionType = 'edit_text' | 'change_fill' | 'restructure_layout'

export interface Zone4Data {
  id: string
  presentation_id: string
  overall_status: 'pass' | 'in_progress' | 'blocked'
  export_blocked: boolean
  export_blocked_reason?: string
  slides: SlideReview[]
}

export interface SlideReview {
  slide_number: number
  canva_slide_id?: string
  scores: {
    brand_compliance: number
    cognitive_load: number
    emotional_alignment: number
    composite: number
  }
  status: 'pass' | 'warning' | 'fail'
  suggestions: DesignSuggestion[]
  last_reviewed_at?: string
}

export interface DesignSuggestion {
  id: string
  axis: SuggestionAxis
  severity: SuggestionSeverity
  problem: string
  suggestion: string
  canva_action?: {
    type: CanvaActionType
    element_id: string
    current_text?: string
    suggested_text?: string
    current_fill?: string
    suggested_fill?: string
  }
  status: 'pending' | 'accepted' | 'rejected' | 'applied'
  created_at: string
}
