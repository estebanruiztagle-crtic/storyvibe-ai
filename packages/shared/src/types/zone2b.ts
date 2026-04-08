export type EmotionType =
  | 'curiosidad'
  | 'tensión'
  | 'alivio'
  | 'excitación'
  | 'confianza'
  | 'empatía'
  | 'urgencia'
  | 'sorpresa'

export interface Zone2BData {
  id: string
  presentation_id: string
  status: 'draft' | 'framework_selected' | 'validated'
  storytelling_options: StorytellingFramework[]
  selected_framework: string | null
  agent_next_action: string
}

export interface StorytellingFramework {
  id: string
  name: string
  origin: string
  fit_score: number
  fit_reasons: string[]
  emotional_arc_proposed: EmotionType[]
  risk: string
  recommended: boolean
  slide_structure?: FrameworkSlot[]
}

export interface FrameworkSlot {
  position: number
  role: string
  topic_type: string
  emotional_type: 'peak' | 'valley' | 'transition'
  suggested_emotion: EmotionType
  intensity_guideline: number
}
