export interface Zone5Data {
  id: string
  presentation_id: string
  time_control: TimeControl
  slides: StoryboardSlide[]
  readiness: PresentationReadiness
}

export interface TimeControl {
  total_available_seconds: number
  estimated_total_seconds: number
  alert_threshold_pct: number
  alert_triggered: boolean
  fallback_version: {
    available: boolean
    estimated_seconds: number
    label: string
    slide_ids_to_remove?: string[]
  }
}

export interface StoryboardSlide {
  id: string
  slide_number: number
  label: string
  thumbnail_url?: string
  duration_seconds: number
  cumulative_seconds: number
  status: {
    assets: 'empty' | 'candidate' | 'approved' | 'brand_violation'
    design: 'pass' | 'warning' | 'fail' | 'pending'
    narrative: 'draft' | 'validated'
    overall: 'ready' | 'in_progress' | 'blocked'
  }
  emotional_point_id?: string
}

export interface PresentationReadiness {
  overall_status: 'ready' | 'in_progress' | 'blocked'
  slides_ready: number
  slides_total: number
  export_to_canva_blocked: boolean
  export_blocked_reason?: string
}
