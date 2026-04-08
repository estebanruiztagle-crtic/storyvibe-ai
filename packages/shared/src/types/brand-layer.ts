export interface BrandLayer {
  id: string
  scope: 'global'
  priority: 'override'
  status: 'active' | 'inactive'
  source: {
    type: 'pdf'
    filename: string
    parse_confidence: number
  }
  constraints: {
    visual: {
      colors: {
        primary: string[]
        secondary: string[]
        neutral: string[]
        forbidden: string[]
      }
      typography: {
        display: string
        body: string
        mono: string
      }
      imagery: {
        allowed_styles: string[]
        forbidden_styles: string[]
      }
      data_visualization: {
        style: string
        max_variables_per_chart: number
        allowed_chart_types: string[]
        forbidden_chart_types: string[]
      }
    }
    verbal: {
      tone_adjectives: string[]
      forbidden_patterns: string[]
      sentence_style: string
    }
  }
  enforcement: {
    mode: 'strict' | 'advisory'
    on_violation: 'block_and_explain' | 'warn'
    agents_affected: string[]
    violation_log: ViolationLogEntry[]
  }
  ui: {
    display_in_bar: boolean
    inspection_panel: 'expandible' | 'fixed'
    violation_badge: boolean
  }
}

export interface ViolationLogEntry {
  id: string
  timestamp: string
  agent: string
  violation_type: string
  description: string
  resolved: boolean
}
