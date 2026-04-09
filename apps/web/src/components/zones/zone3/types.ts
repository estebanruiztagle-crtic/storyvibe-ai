export type PointType = 'peak' | 'valley' | 'transition'

export interface ColorSwatch {
  hex: string
  name: string
  role: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background'
}

export interface ColorPalette {
  swatches: ColorSwatch[]
  rationale: string
  mood: string
}

export type GraphicType =
  | 'bar_chart'
  | 'line_chart'
  | 'donut_chart'
  | 'comparison_table'
  | 'process_flow'
  | 'timeline'
  | 'stats_highlight'
  | 'quote_block'
  | 'icon_grid'
  | 'before_after'

export interface GraphicSuggestion {
  type: GraphicType
  title: string
  description: string
  why: string
}

export interface UploadedAsset {
  name: string
  dataUrl: string
  fileType: 'image' | 'video'
  mimeType: string
  size: number
}

export interface GeneratedImage {
  url: string
  prompt: string
  style: RecraftStyle
}

export type RecraftStyle =
  | 'realistic_image'
  | 'digital_illustration'
  | 'vector_illustration'

export interface Zone3Slide {
  slide: number
  label: string
  fullLabel: string
  type: PointType
  emotion: string
  intensity: number
  graphicSuggestion?: GraphicSuggestion
  useGraphic: boolean
  uploadedAsset?: UploadedAsset
  generatedImage?: GeneratedImage
  approved: boolean
}

export interface Zone3State {
  palette?: ColorPalette
  paletteGenerated: boolean
  slides: Zone3Slide[]
  graphicsSuggested: boolean
}

export const EMPTY_ZONE3: Zone3State = {
  slides: [],
  paletteGenerated: false,
  graphicsSuggested: false,
}
