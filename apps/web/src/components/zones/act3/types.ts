export type PaletteId = 'midnight' | 'ocean' | 'earth' | 'coral' | 'slate'
export type TypographyStyle = 'modern' | 'classic' | 'bold' | 'elegant' | 'minimal'
export type VisualDensity = 'clean' | 'balanced' | 'rich'
export type ImageStyle = 'photography' | 'illustration' | 'abstract' | 'icon' | 'chart'
export type ImagePlacement = 'full_bleed' | 'half' | 'corner' | 'small'

export interface ColorPalette {
  id: PaletteId
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  textColor: string
  desc: string
}

export const PALETTES: ColorPalette[] = [
  { id: 'midnight', name: 'Midnight', primary: '#1A1A2E', secondary: '#16213E', accent: '#E94560', background: '#0F0F1A', surface: '#1A1A2E', textColor: '#F0F0F5', desc: 'Oscuro y dramático' },
  { id: 'ocean',    name: 'Ocean',    primary: '#003049', secondary: '#023E8A', accent: '#F77F00', background: '#012030', surface: '#003049', textColor: '#FFFFFF', desc: 'Profundo y confiable' },
  { id: 'earth',    name: 'Earth',    primary: '#264653', secondary: '#2A9D8F', accent: '#E9C46A', background: '#F8F4EF', surface: '#FFFFFF', textColor: '#1A2E25', desc: 'Natural y cercano' },
  { id: 'coral',    name: 'Coral',    primary: '#22223B', secondary: '#4A4E69', accent: '#C9ADA7', background: '#F8F7F4', surface: '#FFFFFF', textColor: '#22223B', desc: 'Elegante y moderno' },
  { id: 'slate',    name: 'Slate',    primary: '#1C1C1E', secondary: '#2C2C2E', accent: '#0A84FF', background: '#F2F2F7', surface: '#FFFFFF', textColor: '#1C1C1E', desc: 'Limpio y minimalista' },
]

export const TYPOGRAPHY_STYLES: { id: TypographyStyle; label: string; desc: string; fontFamily: string }[] = [
  { id: 'modern',   label: 'Modern',   desc: 'Sans-serif limpio, espaciado generoso',    fontFamily: 'Inter, system-ui' },
  { id: 'classic',  label: 'Classic',  desc: 'Serif elegante, estructura tradicional',   fontFamily: 'Georgia, serif' },
  { id: 'bold',     label: 'Bold',     desc: 'Tipografía de alto impacto, contrastante', fontFamily: 'system-ui, sans-serif' },
  { id: 'elegant',  label: 'Elegant',  desc: 'Fino y sofisticado, luxury feel',          fontFamily: 'Palatino, serif' },
  { id: 'minimal',  label: 'Minimal',  desc: 'Ultra limpio, sólo lo esencial',           fontFamily: 'Helvetica, Arial' },
]

export interface LookAndFeel {
  paletteId: PaletteId
  palette: ColorPalette
  typographyStyle: TypographyStyle
  visualDensity: VisualDensity
}

export interface ImagePlaceholder {
  id: string
  label: string
  placement: ImagePlacement
  suggestedPrompt: string
  style: ImageStyle
  aspectRatio?: string
}

export interface SlideContent {
  slideNumber: number
  title: string
  subtitle?: string
  bodyText?: string
  bullets?: string[]
  callToAction?: string
  images: ImagePlaceholder[]
  speakerNotes?: string
  designStyle: string
  visualMood: string
  emotion: string
  intensity: number
  topicType: string
  durationSeconds?: number
  status: 'draft' | 'ready'
}

export interface Act3State {
  lookAndFeel: LookAndFeel
  slides: SlideContent[]
  status: 'empty' | 'configuring' | 'generating' | 'ready'
  generatedAt?: string
}

export const EMPTY_ACT3: Act3State = {
  lookAndFeel: {
    paletteId: 'midnight',
    palette: PALETTES[0]!,
    typographyStyle: 'modern',
    visualDensity: 'balanced',
  },
  slides: [],
  status: 'empty',
}
