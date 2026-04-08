export type AssetType = 'image' | 'video' | 'chart' | 'illustration'
export type AssetSource = 'drive' | 'generated' | 'pinterest_reference'
export type GenerationEngine = 'flux_pro' | 'nanobanana_pro' | 'recraft_v3'

export interface Zone3Data {
  id: string
  presentation_id: string
  slots: AssetSlot[]
  arena_mode: ArenaModeConfig
  arena_history: ArenaHistory
}

export interface AssetSlot {
  id: string
  slide_number: number
  emotional_point_id: string
  status: 'empty' | 'candidate' | 'approved' | 'brand_violation'
  current_asset?: Asset
  candidates?: Asset[]
  prompt?: string
  brand_compliance: {
    status: 'pass' | 'warning' | 'fail'
    violations: string[]
    checked_at?: string
  }
}

export interface Asset {
  id: string
  type: AssetType
  source: AssetSource
  url: string
  thumbnail_url?: string
  engine?: GenerationEngine
  drive_file_id?: string
  emotion_alignment_score: number
  brand_compliance_score: number
  created_at: string
  metadata: Record<string, unknown>
}

export interface ArenaModeConfig {
  enabled: boolean
  engines: ArenaEngine[]
  cost_per_arena_session_usd: number
  flow: Record<string, string>
}

export interface ArenaEngine {
  id: GenerationEngine
  name: string
  api: string
  cost_per_image_usd: number
  specialty: string
}

export interface ArenaHistory {
  wins: Record<GenerationEngine, number>
  win_by_emotion_type: Record<string, Record<GenerationEngine, number>>
  confidence: number
  sessions_for_high_confidence: number
}
