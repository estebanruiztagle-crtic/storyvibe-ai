export type SlideStatus = 'pass' | 'warning' | 'fail' | 'pending'
export type SuggestionAxis = 'brand_compliance' | 'cognitive_load' | 'emotional_alignment'
export type SuggestionSeverity = 'high' | 'medium' | 'low'
export type SuggestionStatus = 'pending' | 'approved' | 'rejected'
export type DiffType = 'text' | 'color' | 'font' | 'layout' | 'structure'

export interface AxisCheck {
  pass: boolean
  text: string  // can contain <span> for highlights
}

export interface AxisEvaluation {
  score: number  // 0-10
  status: 'pass' | 'warning' | 'fail'
  checks: AxisCheck[]
}

export interface SlideSnapshot {
  elements: number
  textBlocks: number
  images: number
  words: number
  fonts: string[]
  colors: string[]
  layout: string
}

export interface DesignSuggestion {
  id: string
  axis: SuggestionAxis
  severity: SuggestionSeverity
  problem: string
  fix: string
  diffType: DiffType
  before: string
  after: string
  status: SuggestionStatus
}

export interface SlideAsset {
  dataUrl: string
  fileType: 'image' | 'video'
  mimeType?: string
  name?: string
}

export interface SlideReview {
  slide: number
  label: string
  fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
  globalScore: number | null
  globalStatus: SlideStatus
  snapshot: SlideSnapshot | null
  axes: {
    brand: AxisEvaluation
    cognitive: AxisEvaluation
    emotional: AxisEvaluation
  } | null
  suggestions: DesignSuggestion[]
  mockBg: string  // CSS gradient for slide preview
  evaluated: boolean
  uploadedAsset?: SlideAsset  // from Zone3
}

export interface Zone4State {
  slides: SlideReview[]
  exportBlocked: boolean
  exportBlockedReason: string
  canvaConnected: boolean
  lastEvaluatedAt?: string
}

export const EMPTY_ZONE4: Zone4State = {
  slides: [],
  exportBlocked: true,
  exportBlockedReason: 'Sin slides evaluados',
  canvaConnected: false,
}
