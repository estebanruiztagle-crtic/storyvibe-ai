// Shared types across API routes — single source of truth

export type PointType = 'peak' | 'valley' | 'transition'

export interface CurvePoint {
  slide: number
  label: string
  fullLabel: string
  type: PointType
  emotion: string
  intensity: number
  topicType?: string
  systemType?: PointType
  systemEmotion?: string
  systemIntensity?: number
  modified?: boolean
  mappingRules?: string[]
  durationSeconds?: number
  speakerNotes?: string
  // Zone 2 → Zone 3 contract
  suggestedTitle?: string
  contentDirection?: string
  keyMessage?: string
  designStyle?: string
  visualMood?: string
}

export interface PacingResult {
  slide: number
  seconds: number
  pacing: 'slow' | 'medium' | 'fast'
  rationale: string
}

export interface ScriptSection {
  beatRange: string
  title: string
  keyMessage: string
  whatToTell: string
  toneOfVoice: string
  transition: string
  keyQuestions: string[]
  durationSeconds: number
  durationPercent: number
}

export interface ScriptData {
  overallNarrative: string
  totalSeconds: number
  sections: ScriptSection[]
}
