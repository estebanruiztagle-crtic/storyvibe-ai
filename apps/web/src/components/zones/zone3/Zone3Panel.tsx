'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  Zone3State,
  Zone3Slide,
  GraphicType,
  PointType,
  ColorSwatch,
  RecraftStyle,
  LayoutId,
} from './types'
import { EMPTY_ZONE3 } from './types'
import SlidePreview, { autoLayout, LAYOUT_META } from './SlideLayouts'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Zone3PanelProps {
  shapeId: string
  initialState: Zone3State
  zone1ContextJson?: string
  curvePointsJson?: string
  zone2DataJson?: string
  onStateUpdate: (state: Zone3State) => void
  onTitleUpdate?: (title: string) => void
  onAdvanceToZone4?: () => void
  onClose: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const GRAPHIC_LABELS: Record<GraphicType, string> = {
  bar_chart:        'Gráfico de barras',
  line_chart:       'Gráfico de líneas',
  donut_chart:      'Gráfico de dona',
  comparison_table: 'Tabla comparativa',
  process_flow:     'Flujo de proceso',
  timeline:         'Línea de tiempo',
  stats_highlight:  'Estadística destacada',
  quote_block:      'Cita destacada',
  icon_grid:        'Grid de iconos',
  before_after:     'Antes / Después',
}

const GRAPHIC_EMOJIS: Record<GraphicType, string> = {
  bar_chart:        '📊',
  line_chart:       '📈',
  donut_chart:      '🍩',
  comparison_table: '📋',
  process_flow:     '🔄',
  timeline:         '⏱',
  stats_highlight:  '🔢',
  quote_block:      '💬',
  icon_grid:        '⊞',
  before_after:     '↔',
}

const RECRAFT_STYLES: { id: RecraftStyle; label: string; emoji: string; desc: string }[] = [
  { id: 'digital_illustration', label: 'Ilustración digital', emoji: '🎨', desc: 'Estilo gráfico moderno, ideal para conceptos' },
  { id: 'realistic_image',      label: 'Fotografía realista', emoji: '📸', desc: 'Imágenes fotorrealistas de alta calidad' },
  { id: 'vector_illustration',  label: 'Vector / Infografía', emoji: '🔷', desc: 'Estilo limpio, perfecto para datos y procesos' },
]

type ActiveTab = 'palette' | 'slides'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function typeColor(type: PointType): string {
  if (type === 'peak')   return '#1D9E75'
  if (type === 'valley') return '#378ADD'
  return '#EF9F27'
}

function typeLabel(type: PointType): string {
  if (type === 'peak')   return 'pico'
  if (type === 'valley') return 'valle'
  return 'transición'
}

function typeBgStyle(type: PointType): React.CSSProperties {
  if (type === 'peak')   return { backgroundColor: '#E1F5EE', color: '#085041' }
  if (type === 'valley') return { backgroundColor: '#E6F1FB', color: '#0C447C' }
  return { backgroundColor: '#FAEEDA', color: '#633806' }
}

function slideStatus(slide: Zone3Slide): 'approved' | 'partial' | 'empty' {
  if (slide.approved) return 'approved'
  if (slide.useGraphic || slide.uploadedAsset || slide.generatedImage) return 'partial'
  return 'empty'
}

function initSlides(curvePointsJson: string): Zone3Slide[] {
  try {
    const points = JSON.parse(curvePointsJson) as Array<{
      slide: number
      label: string
      fullLabel: string
      type: 'peak' | 'valley' | 'transition'
      emotion: string
      intensity: number
    }>
    return points.map((p) => ({
      slide: p.slide,
      label: p.label,
      fullLabel: p.fullLabel,
      type: p.type,
      emotion: p.emotion,
      intensity: p.intensity,
      useGraphic: false,
      approved: false,
    }))
  } catch {
    return []
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E5E2DA] bg-white p-4">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9B9895]">
        {title}
      </h3>
      {children}
    </div>
  )
}

function StatusDot({ status }: { status: 'approved' | 'partial' | 'empty' }) {
  const color =
    status === 'approved' ? '#1D9E75' :
    status === 'partial'  ? '#EF9F27' : '#D1CCBF'
  return (
    <div
      style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
    />
  )
}

function SwatchRow({ swatches }: { swatches: ColorSwatch[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {swatches.map((sw, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className="w-14 h-14 rounded-lg border border-[#E5E2DA] shadow-sm"
            style={{ backgroundColor: sw.hex }}
            title={sw.hex}
          />
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6866]">{sw.hex}</span>
          <span className="text-[9px] text-[#9B9895]">{sw.name}</span>
          <span
            className="text-[8px] rounded px-1.5 py-0.5 font-semibold uppercase"
            style={
              sw.role === 'primary'    ? { backgroundColor: '#E6F1FB', color: '#0C447C' } :
              sw.role === 'accent'     ? { backgroundColor: '#E1F5EE', color: '#085041' } :
              sw.role === 'secondary'  ? { backgroundColor: '#EEEDFE', color: '#3C3489' } :
              sw.role === 'neutral'    ? { backgroundColor: '#F1EFE8', color: '#444441' } :
              { backgroundColor: '#F9F8F5', color: '#9B9895' }
            }
          >
            {sw.role}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Zone3Panel ───────────────────────────────────────────────────────────────
export default function Zone3Panel({
  shapeId: _shapeId,
  initialState,
  zone1ContextJson,
  curvePointsJson,
  zone2DataJson,
  onStateUpdate,
  onTitleUpdate,
  onAdvanceToZone4,
  onClose,
}: Zone3PanelProps) {
  const computedInitial: Zone3State =
    initialState.slides.length === 0 && curvePointsJson
      ? { ...initialState, slides: initSlides(curvePointsJson) }
      : initialState

  const [state, setState]                     = useState<Zone3State>(computedInitial)
  const [activeTab, setActiveTab]             = useState<ActiveTab>('palette')
  const [activeSlideIndex, setActiveSlide]    = useState(0)
  const [isGenPalette, setIsGenPalette]       = useState(false)
  const [isGenGraphics, setIsGenGraphics]     = useState(false)
  const [generatingImageFor, setGenImgFor]    = useState<number | null>(null)
  const [selectedStyle, setSelectedStyle]     = useState<RecraftStyle>('digital_illustration')
  const [imageError, setImageError]           = useState<string | null>(null)
  const [isGenTitle, setIsGenTitle]           = useState(false)
  const [isEditingTitle, setIsEditingTitle]   = useState(false)
  const [editingTitleValue, setEditingTitleValue] = useState('')
  const [generatedTitle, setGeneratedTitle]   = useState<string>(() => {
    try {
      const ctx = zone1ContextJson ? JSON.parse(zone1ContextJson) as { presentationName?: string } : {}
      return ctx.presentationName ?? ''
    } catch { return '' }
  })
  const fileInputRef                          = useRef<HTMLInputElement>(null)

  const activeSlide = state.slides[activeSlideIndex]

  // ── State helpers ──────────────────────────────────────────────────────────
  const updateState = useCallback((updater: (prev: Zone3State) => Zone3State) => {
    setState((prev) => {
      const next = updater(prev)
      onStateUpdate(next)
      return next
    })
  }, [onStateUpdate])

  const updateSlide = useCallback((updater: (s: Zone3Slide) => Zone3Slide) => {
    updateState((prev) => {
      const slides = [...prev.slides]
      const cur = slides[activeSlideIndex]
      if (!cur) return prev
      slides[activeSlideIndex] = updater(cur)
      return { ...prev, slides }
    })
  }, [updateState, activeSlideIndex])

  // ── Generate title ────────────────────────────────────────────────────────
  const handleGenerateTitle = useCallback(async () => {
    setIsGenTitle(true)
    try {
      const zone1Context = zone1ContextJson ? JSON.parse(zone1ContextJson) : {}
      const zone2Data    = zone2DataJson    ? JSON.parse(zone2DataJson)    : {}
      const res  = await fetch(`${API_BASE}/api/v1/zones/zone3/generate-title`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ zone1Context, zone2Data }),
      })
      const data = await res.json() as { success: boolean; title?: string; error?: string }
      if (data.success && data.title) {
        setGeneratedTitle(data.title)
        onTitleUpdate?.(data.title)
      }
    } catch (err) {
      console.error('generate-title error:', err)
    } finally {
      setIsGenTitle(false)
    }
  }, [zone1ContextJson, zone2DataJson, onTitleUpdate])

  // ── Generate palette ───────────────────────────────────────────────────────
  const handleGeneratePalette = useCallback(async () => {
    setIsGenPalette(true)
    try {
      const zone1Context = zone1ContextJson ? JSON.parse(zone1ContextJson) : {}
      const zone2Data    = zone2DataJson    ? JSON.parse(zone2DataJson)    : {}
      const res  = await fetch(`${API_BASE}/api/v1/zones/zone3/generate-palette`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ zone1Context, zone2Data }),
      })
      const data = await res.json() as {
        success: boolean
        swatches: Array<{ hex: string; name: string; role: string }>
        rationale: string
        mood: string
      }
      if (data.success) {
        updateState((prev) => ({
          ...prev,
          palette: {
            swatches:  data.swatches as ColorSwatch[],
            rationale: data.rationale,
            mood:      data.mood,
          },
          paletteGenerated: true,
        }))
      }
    } catch (err) {
      console.error('generate-palette error:', err)
    } finally {
      setIsGenPalette(false)
    }
  }, [zone1ContextJson, zone2DataJson, updateState])

  // ── Suggest graphics ───────────────────────────────────────────────────────
  const handleSuggestGraphics = useCallback(async () => {
    if (!curvePointsJson) return
    setIsGenGraphics(true)
    try {
      const curvePoints  = JSON.parse(curvePointsJson)
      const zone1Context = zone1ContextJson ? JSON.parse(zone1ContextJson) : {}
      const res  = await fetch(`${API_BASE}/api/v1/zones/zone3/suggest-graphics`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ curvePoints, zone1Context }),
      })
      const data = await res.json() as {
        success: boolean
        suggestions: Array<{
          slide: number
          type: string
          title: string
          description: string
          why: string
        }>
      }
      if (data.success) {
        updateState((prev) => {
          const slides = prev.slides.map((slide) => {
            const sug = data.suggestions.find((s) => s.slide === slide.slide)
            if (!sug) return slide
            return {
              ...slide,
              graphicSuggestion: {
                type:        sug.type as GraphicType,
                title:       sug.title,
                description: sug.description,
                why:         sug.why,
              },
            }
          })
          return { ...prev, slides, graphicsSuggested: true }
        })
      }
    } catch (err) {
      console.error('suggest-graphics error:', err)
    } finally {
      setIsGenGraphics(false)
    }
  }, [curvePointsJson, zone1ContextJson, updateState])

  // ── Generate AI image with Recraft ────────────────────────────────────────
  const handleGenerateImage = useCallback(async (style: RecraftStyle) => {
    if (!activeSlide) return
    setGenImgFor(activeSlideIndex)
    setImageError(null)
    try {
      const zone1Context = zone1ContextJson ? JSON.parse(zone1ContextJson) as Record<string, unknown> : {}
      const palette = state.palette?.swatches ?? []
      const res = await fetch(`${API_BASE}/api/v1/zones/zone3/generate-image`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideLabel:  activeSlide.label,
          fullLabel:   activeSlide.fullLabel,
          emotion:     activeSlide.emotion,
          intensity:   activeSlide.intensity,
          graphicType: activeSlide.graphicSuggestion?.type,
          palette,
          zone1Context,
          style,
        }),
      })
      const data = await res.json() as {
        success: boolean
        imageUrl?: string
        usedPrompt?: string
        error?: string
      }
      if (data.success && data.imageUrl) {
        updateSlide((s) => ({
          ...s,
          generatedImage: {
            url:    data.imageUrl!,
            prompt: data.usedPrompt ?? '',
            style,
          },
        }))
      } else {
        setImageError(data.error ?? 'No se pudo generar la imagen')
      }
    } catch (err) {
      setImageError(String(err))
    } finally {
      setGenImgFor(null)
    }
  }, [activeSlide, activeSlideIndex, state.palette, zone1ContextJson, updateSlide])

  const handleRemoveGeneratedImage = useCallback(() => {
    updateSlide((s) => ({ ...s, generatedImage: undefined }))
    setImageError(null)
  }, [updateSlide])

  // ── Layout selection ──────────────────────────────────────────────────────
  const handleSelectLayout = useCallback((layout: LayoutId) => {
    updateSlide((s) => ({ ...s, selectedLayout: layout }))
  }, [updateSlide])

  // ── Toggle graphic use ─────────────────────────────────────────────────────
  const handleUseGraphicToggle = useCallback(() => {
    updateSlide((s) => ({ ...s, useGraphic: !s.useGraphic }))
  }, [updateSlide])

  // ── Change graphic type ────────────────────────────────────────────────────
  const handleSelectGraphicType = useCallback((type: GraphicType) => {
    updateSlide((s) => ({
      ...s,
      graphicSuggestion: s.graphicSuggestion
        ? { ...s.graphicSuggestion, type }
        : { type, title: GRAPHIC_LABELS[type], description: '', why: '' },
      useGraphic: true,
    }))
  }, [updateSlide])

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) return

    if (isImage && file.size > 8 * 1024 * 1024) {
      alert('La imagen no puede superar 8 MB')
      return
    }

    const fileType = isImage ? 'image' as const : 'video' as const

    if (isImage) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        updateSlide((s) => ({
          ...s,
          uploadedAsset: { name: file.name, dataUrl, fileType, mimeType: file.type, size: file.size },
        }))
      }
      reader.readAsDataURL(file)
    } else {
      const objectUrl = URL.createObjectURL(file)
      updateSlide((s) => ({
        ...s,
        uploadedAsset: { name: file.name, dataUrl: objectUrl, fileType, mimeType: file.type, size: file.size },
      }))
    }

    e.target.value = ''
  }, [updateSlide])

  const handleRemoveAsset = useCallback(() => {
    updateSlide((s) => {
      if (s.uploadedAsset?.fileType === 'video') {
        URL.revokeObjectURL(s.uploadedAsset.dataUrl)
      }
      return { ...s, uploadedAsset: undefined }
    })
  }, [updateSlide])

  // ── Approve slide ──────────────────────────────────────────────────────────
  const handleApprove = useCallback(() => {
    updateSlide((s) => ({ ...s, approved: !s.approved }))
  }, [updateSlide])

  // ── Derived ────────────────────────────────────────────────────────────────
  const approvedCount = state.slides.filter((s) => s.approved).length
  const totalSlides   = state.slides.length

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-y-0 right-0 flex flex-col bg-[#F9F8F5] border-l border-[#E5E2DA]"
      style={{ width: 900, zIndex: 9999, fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#E5E2DA] bg-white px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#9B9895] tracking-widest uppercase">zona 3</span>
          <span className="text-[#D1CCBF]">·</span>
          <span
            className="text-[13px] font-medium text-[#1A1A18] italic"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            diseño visual
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onAdvanceToZone4 && (
            <button
              onClick={onAdvanceToZone4}
              className="flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
              Avanzar Zona 4
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded border border-[#D1CCBF] px-3 py-1.5 text-[11px] text-[#6B6866] hover:bg-[#F1EFE8] transition-colors"
          >
            cerrar ×
          </button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#E5E2DA] bg-white flex-shrink-0">
        {(
          [
            { id: 'palette' as const, label: 'Paleta de colores', done: state.paletteGenerated },
            { id: 'slides'  as const, label: 'Assets por lámina', count: `${approvedCount}/${totalSlides}` },
          ] as Array<{ id: ActiveTab; label: string; done?: boolean; count?: string }>
        ).map(({ id, label, done, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
              activeTab === id
                ? 'border-[#185FA5] text-[#185FA5]'
                : 'border-transparent text-[#6B6866] hover:text-[#1A1A18]'
            }`}
          >
            {label}
            {done  && <span className="ml-1.5 text-[#1D9E75]">✓</span>}
            {count && <span className="ml-1.5 text-[#9B9895]">{count}</span>}
          </button>
        ))}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ PALETTE TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'palette' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

            {/* ── Presentation title ──────────────────────────────────── */}
            <SectionCard title="Título de la presentación">
              {generatedTitle ? (
                <div>
                  <div className="rounded-lg bg-[#F1EFE8] px-4 py-3 mb-3">
                    {isEditingTitle ? (
                      <div className="flex flex-col gap-2">
                        <input
                          autoFocus
                          value={editingTitleValue}
                          onChange={(e) => setEditingTitleValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const v = editingTitleValue.trim()
                              if (v) { setGeneratedTitle(v); onTitleUpdate?.(v) }
                              setIsEditingTitle(false)
                            }
                            if (e.key === 'Escape') setIsEditingTitle(false)
                          }}
                          className="w-full rounded-md border border-[#C8C4BB] bg-white px-3 py-2 text-[15px] font-semibold text-[#1A1A18] outline-none focus:border-[#1A1A18]"
                          style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic' }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const v = editingTitleValue.trim()
                              if (v) { setGeneratedTitle(v); onTitleUpdate?.(v) }
                              setIsEditingTitle(false)
                            }}
                            className="flex-1 rounded-md bg-[#1A1A18] py-1.5 text-[11px] font-semibold text-white hover:opacity-85 transition-opacity"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setIsEditingTitle(false)}
                            className="flex-1 rounded-md border border-[#D1CCBF] py-1.5 text-[11px] font-semibold text-[#444441] hover:bg-white transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className="text-[16px] font-semibold text-[#1A1A18] leading-snug flex-1"
                          style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic' }}
                        >
                          {generatedTitle}
                        </p>
                        <button
                          onClick={() => { setEditingTitleValue(generatedTitle); setIsEditingTitle(true) }}
                          className="flex-shrink-0 text-[10px] text-[#9B9895] hover:text-[#444441] transition-colors"
                          title="Editar título"
                        >
                          ✏
                        </button>
                      </div>
                    )}
                  </div>
                  {!isEditingTitle && (
                    <button
                      onClick={handleGenerateTitle}
                      disabled={isGenTitle}
                      className="w-full rounded-lg border border-[#D1CCBF] py-2 text-[11px] font-semibold text-[#444441] hover:bg-[#F1EFE8] disabled:opacity-50 transition-colors"
                    >
                      {isGenTitle ? 'Generando...' : '↺ Regenerar título'}
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="py-5 text-center mb-3">
                    <div className="text-2xl mb-2">🎯</div>
                    <p className="text-[12px] text-[#9B9895] mb-1">Sin título aún</p>
                    <p className="text-[11px] text-[#B8B4AA]">
                      Claude genera un título basado en tus tópicos y objetivo
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateTitle}
                    disabled={isGenTitle}
                    className="w-full rounded-lg bg-[#1A1A18] py-2.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenTitle ? (
                      <>
                        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                        </svg>
                        Generando título...
                      </>
                    ) : '✦ Generar título con IA'}
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Generated palette */}
            <SectionCard title="Paleta de colores generada por IA">
              {state.palette ? (
                <div>
                  <SwatchRow swatches={state.palette.swatches} />
                  <div className="mt-4 rounded-lg bg-[#F1EFE8] p-3">
                    <p className="text-[12px] text-[#444441] leading-relaxed">{state.palette.rationale}</p>
                  </div>
                  <p className="mt-2 text-[11px] text-[#9B9895] italic">"{state.palette.mood}"</p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="flex justify-center gap-2 mb-4">
                    {['#1A2F4E', '#2563EB', '#10B981', '#6B7280', '#F9FAFB'].map((c, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-lg border border-[#E5E2DA] opacity-30"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <p className="text-[12px] text-[#9B9895] mb-1">Paleta no generada aún</p>
                  <p className="text-[11px] text-[#B8B4AA]">
                    La paleta se genera a partir de tu contexto de marca (Zona 1) y arquitectura narrativa (Zona 2)
                  </p>
                </div>
              )}
              <button
                onClick={handleGeneratePalette}
                disabled={isGenPalette}
                className="mt-4 w-full rounded-lg bg-[#185FA5] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isGenPalette
                  ? 'Generando paleta...'
                  : state.paletteGenerated
                  ? '↺ Regenerar paleta'
                  : 'Generar paleta con IA →'}
              </button>
            </SectionCard>

            {/* How it works */}
            <SectionCard title="Cómo funciona">
              <ul className="flex flex-col gap-3">
                {[
                  ['1', 'Analiza el sector, audiencia y tono de marca desde tu diagnóstico (Zona 1)'],
                  ['2', 'Considera el framework narrativo y el arco emocional diseñado en Zona 2'],
                  ['3', 'Propone colores estratégicos que refuerzan cada emoción de tu relato'],
                  ['4', 'La paleta sirve como guía maestra para el diseño de láminas en Zona 4'],
                ].map(([n, text]) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E6F1FB] text-[#0C447C] text-[10px] font-bold flex items-center justify-center">
                      {n}
                    </span>
                    <span className="text-[12px] text-[#6B6866] leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

          </div>
        )}

        {/* ══ SLIDES TAB ═══════════════════════════════════════════════════ */}
        {activeTab === 'slides' && (
          <>
            {state.slides.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[14px] text-[#9B9895]">Sin láminas disponibles</p>
                  <p className="text-[12px] text-[#B8B4AA] mt-1">
                    Completa y aprueba la curva emocional en Zona 2 primero
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* ── Sidebar ────────────────────────────────────────────── */}
                <div className="w-[220px] bg-white border-r border-[#E5E2DA] flex flex-col flex-shrink-0 overflow-hidden">

                  {/* Suggest graphics button */}
                  <div className="p-3 border-b border-[#E5E2DA]">
                    <button
                      onClick={handleSuggestGraphics}
                      disabled={isGenGraphics}
                      className="w-full rounded-lg border border-[#D1CCBF] py-2.5 text-[11px] font-semibold text-[#444441] hover:bg-[#F1EFE8] disabled:opacity-50 transition-colors"
                    >
                      {isGenGraphics
                        ? 'Generando sugerencias...'
                        : state.graphicsSuggested
                        ? '↺ Regenerar gráficos'
                        : '✦ Sugerir gráficos con IA'}
                    </button>
                  </div>

                  {/* Slide list */}
                  <div className="flex-1 overflow-y-auto py-1">
                    {state.slides.map((slide, i) => {
                      const status  = slideStatus(slide)
                      const isActive = i === activeSlideIndex
                      return (
                        <div
                          key={i}
                          onClick={() => setActiveSlide(i)}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                            isActive ? 'bg-[#F1EFE8]' : 'hover:bg-[#F9F8F5]'
                          }`}
                          style={{
                            borderLeft: `2px solid ${isActive ? typeColor(slide.type) : 'transparent'}`,
                          }}
                        >
                          <StatusDot status={status} />
                          <span className="text-[10px] text-[#9B9895] flex-shrink-0 w-4">{slide.slide}</span>
                          <span
                            className={`text-[11px] truncate flex-1 ${
                              isActive ? 'text-[#1A1A18] font-semibold' : 'text-[#6B6866]'
                            }`}
                          >
                            {slide.label}
                          </span>
                          <span
                            className="text-[8px] rounded px-1.5 py-0.5 flex-shrink-0 font-bold uppercase"
                            style={typeBgStyle(slide.type)}
                          >
                            {typeLabel(slide.type).slice(0, 3)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Progress */}
                  <div className="p-3 border-t border-[#E5E2DA]">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] text-[#9B9895]">aprobadas</span>
                      <span className="text-[10px] font-semibold text-[#444441]">
                        {approvedCount}/{totalSlides}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#E5E2DA] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1D9E75] transition-all duration-500"
                        style={{ width: `${totalSlides > 0 ? (approvedCount / totalSlides) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Active slide content ────────────────────────────────── */}
                {activeSlide ? (
                  <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

                    {/* Slide header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] rounded px-2.5 py-1 font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: typeColor(activeSlide.type) }}
                        >
                          lámina {activeSlide.slide}
                        </span>
                        <span
                          className="text-[9px] rounded px-2 py-0.5 font-semibold uppercase"
                          style={typeBgStyle(activeSlide.type)}
                        >
                          {typeLabel(activeSlide.type)}
                        </span>
                        <span className="text-[11px] text-[#9B9895]">{activeSlide.emotion}</span>
                        <span className="text-[10px] text-[#B8B4AA] border border-[#E5E2DA] rounded px-1.5 py-0.5">
                          {activeSlide.intensity}/10
                        </span>
                        {activeSlide.approved && (
                          <span className="ml-auto text-[10px] text-[#1D9E75] font-semibold">✓ aprobada</span>
                        )}
                      </div>
                      <h2
                        className="text-[17px] text-[#1A1A18] leading-snug"
                        style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic' }}
                      >
                        {activeSlide.fullLabel}
                      </h2>
                    </div>

                    {/* ── Slide Preview ────────────────────────────────────── */}
                    {(() => {
                      const currentLayout = activeSlide.selectedLayout ?? autoLayout(activeSlide)
                      return (
                        <div>
                          {/* Preview */}
                          <SlidePreview
                            slide={activeSlide}
                            layout={currentLayout}
                            swatches={state.palette?.swatches}
                            containerWidth={630}
                          />
                          {/* Layout picker */}
                          <div className="mt-3">
                            <p className="text-[10px] text-[#9B9895] uppercase tracking-wider mb-2">Layout</p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {(Object.keys(LAYOUT_META) as LayoutId[]).map((lid) => {
                                const meta = LAYOUT_META[lid]
                                const isActive = currentLayout === lid
                                return (
                                  <button
                                    key={lid}
                                    onClick={() => handleSelectLayout(lid)}
                                    title={meta.desc}
                                    className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2 px-1 transition-colors text-center ${
                                      isActive
                                        ? 'border-[#6B3FA0] bg-[#EEEDFE]'
                                        : 'border-[#E5E2DA] bg-white hover:border-[#D1CCBF]'
                                    }`}
                                  >
                                    <span className="text-base leading-none">{meta.emoji}</span>
                                    <span className={`text-[9px] font-semibold leading-tight ${isActive ? 'text-[#6B3FA0]' : 'text-[#6B6866]'}`}>
                                      {meta.label}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* ── Graphic suggestion ──────────────────────────────── */}
                    <SectionCard title="Gráfico o infografía sugerida">
                      {activeSlide.graphicSuggestion ? (
                        <div>
                          {/* Suggestion card */}
                          <div
                            className={`rounded-lg border-2 p-4 mb-3 transition-colors ${
                              activeSlide.useGraphic
                                ? 'border-[#1D9E75] bg-[#F0FBF7]'
                                : 'border-[#E5E2DA] bg-[#F9F8F5]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-3xl flex-shrink-0 mt-0.5">
                                {GRAPHIC_EMOJIS[activeSlide.graphicSuggestion.type] ?? '📊'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[11px] text-[#9B9895] uppercase tracking-wider font-semibold">
                                    {GRAPHIC_LABELS[activeSlide.graphicSuggestion.type]}
                                  </span>
                                  {activeSlide.useGraphic && (
                                    <span className="text-[9px] text-[#1D9E75] font-bold">✓ incluido</span>
                                  )}
                                </div>
                                <p className="text-[14px] font-semibold text-[#1A1A18] mb-1">
                                  {activeSlide.graphicSuggestion.title}
                                </p>
                                <p className="text-[12px] text-[#6B6866] mb-2 leading-relaxed">
                                  {activeSlide.graphicSuggestion.description}
                                </p>
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[10px] text-[#9B9895]">💡</span>
                                  <p className="text-[10px] text-[#9B9895] italic">
                                    {activeSlide.graphicSuggestion.why}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Include / exclude toggle */}
                          <button
                            onClick={handleUseGraphicToggle}
                            className={`w-full rounded-lg py-2.5 text-[12px] font-semibold transition-colors mb-4 ${
                              activeSlide.useGraphic
                                ? 'bg-[#E1F5EE] text-[#085041] hover:bg-[#D0EDDF]'
                                : 'bg-[#185FA5] text-white hover:opacity-90'
                            }`}
                          >
                            {activeSlide.useGraphic
                              ? '✓ Gráfico incluido — clic para excluir'
                              : 'Incluir este gráfico en la lámina →'}
                          </button>

                          {/* Alternative types */}
                          <div>
                            <p className="text-[10px] text-[#9B9895] mb-2 uppercase tracking-wider">
                              ¿Prefieres otro tipo?
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(Object.keys(GRAPHIC_LABELS) as GraphicType[]).map((gtype) => (
                                <button
                                  key={gtype}
                                  onClick={() => handleSelectGraphicType(gtype)}
                                  className={`rounded px-2.5 py-1 text-[10px] transition-colors ${
                                    activeSlide.graphicSuggestion?.type === gtype
                                      ? 'bg-[#185FA5] text-white font-semibold'
                                      : 'bg-[#F1EFE8] text-[#6B6866] hover:bg-[#E8E5DE]'
                                  }`}
                                >
                                  {GRAPHIC_EMOJIS[gtype]} {GRAPHIC_LABELS[gtype]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <p className="text-[12px] text-[#9B9895]">
                            {state.graphicsSuggested
                              ? 'Sin sugerencia para esta lámina'
                              : 'Haz clic en "Sugerir gráficos con IA" para obtener recomendaciones'}
                          </p>
                          {!state.graphicsSuggested && (
                            <button
                              onClick={handleSuggestGraphics}
                              disabled={isGenGraphics}
                              className="mt-3 rounded-lg border border-[#D1CCBF] px-4 py-2 text-[11px] font-semibold text-[#444441] hover:bg-[#F1EFE8] disabled:opacity-50 transition-colors"
                            >
                              {isGenGraphics ? 'Generando...' : '✦ Sugerir gráficos con IA'}
                            </button>
                          )}
                        </div>
                      )}
                    </SectionCard>

                    {/* ── AI Image Generation ──────────────────────────────── */}
                    <SectionCard title="✨ Imagen IA — Recraft v3">
                      {activeSlide.generatedImage ? (
                        /* ── Image result ── */
                        <div>
                          <div className="rounded-lg overflow-hidden mb-3 bg-[#F1EFE8] relative" style={{ aspectRatio: '16/9' }}>
                            <img
                              src={activeSlide.generatedImage.url}
                              alt="Imagen generada"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase text-white"
                                style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                              >
                                {RECRAFT_STYLES.find((s) => s.id === activeSlide.generatedImage?.style)?.emoji}{' '}
                                Recraft v3
                              </span>
                            </div>
                          </div>

                          {/* Prompt used */}
                          <details className="mb-3">
                            <summary className="text-[10px] text-[#9B9895] cursor-pointer select-none hover:text-[#6B6866] transition-colors">
                              💡 Ver prompt utilizado
                            </summary>
                            <p className="mt-1.5 rounded bg-[#F1EFE8] p-2.5 text-[10px] text-[#6B6866] leading-relaxed italic">
                              {activeSlide.generatedImage.prompt}
                            </p>
                          </details>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGenerateImage(activeSlide.generatedImage?.style ?? selectedStyle)}
                              disabled={generatingImageFor === activeSlideIndex}
                              className="flex-1 rounded-lg border border-[#D1CCBF] py-2 text-[11px] font-semibold text-[#444441] hover:bg-[#F1EFE8] disabled:opacity-50 transition-colors"
                            >
                              {generatingImageFor === activeSlideIndex ? '⏳ Generando...' : '↺ Regenerar'}
                            </button>
                            <button
                              onClick={handleRemoveGeneratedImage}
                              className="rounded-lg border border-[#FAECE7] px-3 py-2 text-[11px] font-semibold text-[#E24B4A] hover:bg-[#FAECE7] transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Generator form ── */
                        <div>
                          {/* Style selector */}
                          <p className="text-[10px] text-[#9B9895] uppercase tracking-wider mb-2">Estilo visual</p>
                          <div className="flex flex-col gap-2 mb-4">
                            {RECRAFT_STYLES.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => setSelectedStyle(s.id)}
                                className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors ${
                                  selectedStyle === s.id
                                    ? 'border-[#6B3FA0] bg-[#EEEDFE]'
                                    : 'border-[#E5E2DA] bg-white hover:border-[#D1CCBF]'
                                }`}
                              >
                                <span className="text-xl flex-shrink-0">{s.emoji}</span>
                                <div>
                                  <div className="text-[12px] font-semibold text-[#1A1A18]">{s.label}</div>
                                  <div className="text-[10px] text-[#9B9895]">{s.desc}</div>
                                </div>
                                {selectedStyle === s.id && (
                                  <span className="ml-auto text-[#6B3FA0] text-[12px]">✓</span>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Context hint */}
                          <div className="rounded-lg bg-[#EEEDFE] px-3 py-2 mb-3">
                            <p className="text-[10px] text-[#3C3489] leading-relaxed">
                              <span className="font-semibold">Contexto detectado:</span>{' '}
                              {activeSlide.emotion} · intensidad {activeSlide.intensity}/10
                              {state.palette && ' · paleta de colores aplicada'}
                              {activeSlide.graphicSuggestion && ` · ${activeSlide.graphicSuggestion.title}`}
                            </p>
                          </div>

                          {/* Error */}
                          {imageError && (
                            <div className="mb-3 rounded-lg bg-[#FAECE7] px-3 py-2">
                              <p className="text-[11px] text-[#E24B4A]">⚠ {imageError}</p>
                            </div>
                          )}

                          {/* Generate button */}
                          <button
                            onClick={() => handleGenerateImage(selectedStyle)}
                            disabled={generatingImageFor === activeSlideIndex}
                            className="w-full rounded-lg py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: generatingImageFor === activeSlideIndex ? '#9B9895' : 'linear-gradient(135deg, #6B3FA0 0%, #185FA5 100%)' }}
                          >
                            {generatingImageFor === activeSlideIndex ? (
                              <>
                                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                                </svg>
                                Claude está redactando el prompt...
                              </>
                            ) : (
                              <>✨ Generar imagen con Recraft</>
                            )}
                          </button>
                          <p className="mt-2 text-center text-[10px] text-[#B8B4AA]">
                            Claude genera un prompt optimizado · Recraft v3 crea la imagen
                          </p>
                        </div>
                      )}
                    </SectionCard>

                    {/* ── Asset upload ─────────────────────────────────────── */}
                    <SectionCard title="Asset propio (foto o video)">
                      {activeSlide.uploadedAsset ? (
                        <div>
                          {activeSlide.uploadedAsset.fileType === 'image' ? (
                            <div
                              className="rounded-lg overflow-hidden mb-3 bg-[#F1EFE8]"
                              style={{ aspectRatio: '16/9' }}
                            >
                              <img
                                src={activeSlide.uploadedAsset.dataUrl}
                                alt={activeSlide.uploadedAsset.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="rounded-lg bg-[#F1EFE8] mb-3 flex items-center justify-center"
                              style={{ aspectRatio: '16/9' }}
                            >
                              <div className="text-center">
                                <div className="text-5xl mb-2">🎬</div>
                                <p className="text-[13px] font-medium text-[#444441]">
                                  {activeSlide.uploadedAsset.name}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[12px] font-medium text-[#444441] truncate max-w-[260px]">
                                {activeSlide.uploadedAsset.name}
                              </p>
                              <p className="text-[10px] text-[#9B9895]">
                                {activeSlide.uploadedAsset.fileType} ·{' '}
                                {(activeSlide.uploadedAsset.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded border border-[#D1CCBF] px-3 py-1 text-[11px] text-[#6B6866] hover:bg-[#F1EFE8] transition-colors"
                              >
                                Cambiar
                              </button>
                              <button
                                onClick={handleRemoveAsset}
                                className="rounded border border-[#FAECE7] px-3 py-1 text-[11px] text-[#E24B4A] hover:bg-[#FAECE7] transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-[#D1CCBF] rounded-lg py-10 px-6 text-center cursor-pointer hover:bg-white hover:border-[#9B9895] transition-colors"
                        >
                          <div className="text-4xl mb-3">📎</div>
                          <p className="text-[13px] font-semibold text-[#444441] mb-1">
                            Arrastra o haz clic para subir
                          </p>
                          <p className="text-[11px] text-[#9B9895]">
                            Imágenes (JPG, PNG, GIF, WebP) · Videos (MP4, MOV, WebM)
                          </p>
                          <p className="text-[10px] text-[#B8B4AA] mt-1">Máx. 8 MB para imágenes</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </SectionCard>

                    {/* ── Approve button ───────────────────────────────────── */}
                    <button
                      onClick={handleApprove}
                      className={`w-full rounded-lg py-3 text-[13px] font-semibold transition-colors ${
                        activeSlide.approved
                          ? 'bg-[#E1F5EE] text-[#085041] border-2 border-[#1D9E75]'
                          : 'bg-[#1D9E75] text-white hover:opacity-90'
                      }`}
                    >
                      {activeSlide.approved ? '✓ Lámina aprobada — clic para desaprobar' : 'Aprobar lámina →'}
                    </button>

                    {/* ── Navigation ───────────────────────────────────────── */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setActiveSlide((i) => Math.max(0, i - 1))}
                        disabled={activeSlideIndex === 0}
                        className="flex-1 rounded-lg border border-[#E5E2DA] py-2.5 text-[12px] text-[#6B6866] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Anterior
                      </button>
                      <span className="flex items-center text-[11px] text-[#9B9895] px-2">
                        {activeSlideIndex + 1} / {totalSlides}
                      </span>
                      <button
                        onClick={() => setActiveSlide((i) => Math.min(totalSlides - 1, i + 1))}
                        disabled={activeSlideIndex === totalSlides - 1}
                        className="flex-1 rounded-lg border border-[#E5E2DA] py-2.5 text-[12px] text-[#6B6866] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente →
                      </button>
                    </div>

                    {/* Spacer */}
                    <div className="h-4" />
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
