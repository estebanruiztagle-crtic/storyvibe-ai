export type SlideStatus = 'pass' | 'warning' | 'fail' | 'pending'

export interface PendingSuggestion {
  severity: 'high' | 'medium' | 'low'
  text: string
  axis: 'brand_compliance' | 'cognitive_load' | 'emotional_alignment'
}

export interface StoryboardSlide {
  slide: number
  label: string
  fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
  // Time allocation
  seconds: number
  pacing: 'slow' | 'medium' | 'fast'
  // Status from each zone
  assetStatus: SlideStatus    // from Zone 3
  designStatus: SlideStatus   // from Zone 4
  overallStatus: SlideStatus  // worst of the two
  // Design feedback
  pendingSuggestions: PendingSuggestion[]
  designScore: number | null
  // Visual
  mockBg: string
  // Asset from Zone 3 (if uploaded)
  uploadedAsset?: { dataUrl: string; fileType: 'image' | 'video' }
}

export interface TimeControl {
  totalAvailableSeconds: number
  estimatedTotalSeconds: number
  fallbackAvailableSeconds: number
  fallbackEstimatedSeconds: number
  fallbackMode: boolean
}

export interface Zone5State {
  slides: StoryboardSlide[]
  timeControl: TimeControl
  exportBlocked: boolean
  exportBlockedReason: string
  selectedSlideIndex: number
  lastUpdatedAt?: string
}

export const EMPTY_ZONE5: Zone5State = {
  slides: [],
  timeControl: {
    totalAvailableSeconds: 1200,
    estimatedTotalSeconds: 0,
    fallbackAvailableSeconds: 900,
    fallbackEstimatedSeconds: 0,
    fallbackMode: false,
  },
  exportBlocked: false,
  exportBlockedReason: '',
  selectedSlideIndex: 0,
}
