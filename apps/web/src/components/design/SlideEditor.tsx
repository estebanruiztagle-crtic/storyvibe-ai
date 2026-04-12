'use client'

import { useState, useCallback, useRef } from 'react'
import { Sparkles, Check, ChevronLeft, ChevronRight, Upload, Trash2, ImageIcon } from 'lucide-react'
import type {
  Zone3State, Zone3Slide, GraphicType, PointType, RecraftStyle, LayoutId,
} from '@/components/zones/zone3/types'
import SlidePreview, { autoLayout, LAYOUT_META } from '@/components/zones/zone3/SlideLayouts'
import { useAppStore } from '@/store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const GRAPHIC_LABELS: Record<GraphicType, string> = {
  bar_chart: 'Barras', line_chart: 'Lineas', donut_chart: 'Dona',
  comparison_table: 'Tabla', process_flow: 'Flujo', timeline: 'Timeline',
  stats_highlight: 'Stats', quote_block: 'Cita', icon_grid: 'Grid', before_after: 'Antes/Después',
}

const RECRAFT_STYLES: { id: RecraftStyle; label: string; desc: string }[] = [
  { id: 'digital_illustration', label: 'Ilustración digital', desc: 'Estilo gráfico moderno' },
  { id: 'realistic_image', label: 'Fotografía realista', desc: 'Imágenes fotorrealistas' },
  { id: 'vector_illustration', label: 'Vector / Infografía', desc: 'Estilo limpio para datos' },
]

function typeColor(t: PointType) { return t === 'peak' ? 'text-emerald-600 bg-emerald-50' : t === 'valley' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50' }
function typeLabel(t: PointType) { return t === 'peak' ? 'pico' : t === 'valley' ? 'valle' : 'transición' }

function slideStatus(s: Zone3Slide): 'approved' | 'partial' | 'empty' {
  if (s.approved) return 'approved'
  if (s.useGraphic || s.uploadedAsset || s.generatedImage) return 'partial'
  return 'empty'
}

interface Props {
  state: Zone3State
  onChange: (s: Zone3State) => void
  onComplete: () => void
}

export default function SlideEditor({ state, onChange, onComplete }: Props) {
  const context = useAppStore((s) => s.context)
  const narrative = useAppStore((s) => s.narrative)

  const [activeIdx, setActiveIdx] = useState(0)
  const [isGenGraphics, setIsGenGraphics] = useState(false)
  const [genImgFor, setGenImgFor] = useState<number | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<RecraftStyle>('digital_illustration')
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { slides } = state
  const active = slides[activeIdx]
  const approvedCount = slides.filter((s) => s.approved).length

  const updateSlide = useCallback((idx: number, updater: (s: Zone3Slide) => Zone3Slide) => {
    const next = [...state.slides]
    next[idx] = updater(next[idx]!)
    onChange({ ...state, slides: next })
  }, [state, onChange])

  const handleSuggestGraphics = async () => {
    setIsGenGraphics(true)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone3/suggest-graphics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curvePoints: narrative.curvePoints,
          zone1Context: context,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const updated = state.slides.map((slide) => {
          const sug = data.suggestions.find((s: { slide: number }) => s.slide === slide.slide)
          if (!sug) return slide
          return { ...slide, graphicSuggestion: { type: sug.type as GraphicType, title: sug.title, description: sug.description, why: sug.why, tips: sug.tips } }
        })
        onChange({ ...state, slides: updated, graphicsSuggested: true })
      }
    } catch (err) { console.error('suggest-graphics:', err) }
    finally { setIsGenGraphics(false) }
  }

  const handleGenerateImage = async (style: RecraftStyle) => {
    if (!active) return
    setGenImgFor(activeIdx)
    setImageError(null)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone3/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideLabel: active.label, fullLabel: active.fullLabel, emotion: active.emotion,
          intensity: active.intensity, graphicType: active.graphicSuggestion?.type,
          palette: state.palette?.swatches ?? [], zone1Context: context, style,
        }),
      })
      const data = await res.json()
      if (data.success && data.imageUrl) {
        updateSlide(activeIdx, (s) => ({ ...s, generatedImage: { url: data.imageUrl!, prompt: data.usedPrompt ?? '', style } }))
      } else { setImageError(data.error ?? 'No se pudo generar la imagen') }
    } catch (err) { setImageError(String(err)) }
    finally { setGenImgFor(null) }
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    if (!isImage && !file.type.startsWith('video/')) return
    if (isImage && file.size > 8 * 1024 * 1024) { alert('Max 8 MB'); return }
    const fileType = isImage ? 'image' as const : 'video' as const
    if (isImage) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        updateSlide(activeIdx, (s) => ({
          ...s, uploadedAsset: { name: file.name, dataUrl: ev.target?.result as string, fileType, mimeType: file.type, size: file.size },
        }))
      }
      reader.readAsDataURL(file)
    } else {
      const url = URL.createObjectURL(file)
      updateSlide(activeIdx, (s) => ({
        ...s, uploadedAsset: { name: file.name, dataUrl: url, fileType, mimeType: file.type, size: file.size },
      }))
    }
    e.target.value = ''
  }, [activeIdx, updateSlide])

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <p className="text-sm">Sin láminas disponibles</p>
        <p className="text-xs mt-1">Completa y aprueba la curva emocional primero</p>
      </div>
    )
  }

  const currentLayout = active?.selectedLayout ?? (active ? autoLayout(active) : 'hero' as LayoutId)

  return (
    <div className="flex gap-4" style={{ minHeight: 600 }}>
      {/* Sidebar */}
      <div className="w-[200px] shrink-0 rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col">
        <div className="p-3 border-b border-neutral-100">
          <button
            onClick={handleSuggestGraphics}
            disabled={isGenGraphics}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <Sparkles size={12} />
            {isGenGraphics ? 'Generando...' : state.graphicsSuggested ? 'Regenerar gráficos' : 'Sugerir gráficos IA'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {slides.map((slide, i) => {
            const status = slideStatus(slide)
            const isActive = i === activeIdx
            return (
              <div
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs transition-colors ${
                  isActive ? 'bg-neutral-100 font-semibold text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  status === 'approved' ? 'bg-emerald-500' : status === 'partial' ? 'bg-amber-400' : 'bg-neutral-200'
                }`} />
                <span className="text-[10px] text-neutral-400 w-4 shrink-0">{slide.slide}</span>
                <span className="truncate flex-1">{slide.label}</span>
              </div>
            )
          })}
        </div>
        <div className="p-3 border-t border-neutral-100">
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>aprobadas</span>
            <span className="font-semibold text-neutral-600">{approvedCount}/{slides.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(approvedCount / slides.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Editor */}
      {active && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${typeColor(active.type)}`}>
                lámina {active.slide} &middot; {typeLabel(active.type)}
              </span>
              <span className="text-xs text-neutral-400">{active.emotion} &middot; {active.intensity}/10</span>
              {active.approved && <span className="ml-auto text-xs text-emerald-600 font-semibold">aprobada</span>}
            </div>
            <h2 className="text-base font-semibold text-neutral-800">{active.fullLabel}</h2>
          </div>

          {/* Preview + Layout */}
          <div>
            <SlidePreview slide={active} layout={currentLayout} swatches={state.palette?.swatches} containerWidth={580} />
            <div className="mt-3">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-2">Layout</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(LAYOUT_META) as LayoutId[]).map((lid) => {
                  const meta = LAYOUT_META[lid]
                  return (
                    <button
                      key={lid}
                      onClick={() => updateSlide(activeIdx, (s) => ({ ...s, selectedLayout: lid }))}
                      title={meta.desc}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2 px-1 text-center transition-colors ${
                        currentLayout === lid ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-base leading-none">{meta.emoji}</span>
                      <span className={`text-[9px] font-semibold ${currentLayout === lid ? 'text-neutral-900' : 'text-neutral-500'}`}>
                        {meta.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Graphic suggestion */}
          {active.graphicSuggestion && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Gráfico sugerido</div>
              <p className="text-sm font-semibold text-neutral-800 mb-1">{active.graphicSuggestion.title}</p>
              <p className="text-xs text-neutral-500 mb-2">{active.graphicSuggestion.description}</p>
              <button
                onClick={() => updateSlide(activeIdx, (s) => ({ ...s, useGraphic: !s.useGraphic }))}
                className={`w-full rounded-lg py-2 text-xs font-semibold transition-colors ${
                  active.useGraphic ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
              >
                {active.useGraphic ? 'Incluido — clic para excluir' : 'Incluir gráfico'}
              </button>
              <div className="mt-3 flex flex-wrap gap-1">
                {(Object.keys(GRAPHIC_LABELS) as GraphicType[]).map((gt) => (
                  <button
                    key={gt}
                    onClick={() => updateSlide(activeIdx, (s) => ({
                      ...s,
                      graphicSuggestion: s.graphicSuggestion ? { ...s.graphicSuggestion, type: gt } : { type: gt, title: GRAPHIC_LABELS[gt], description: '', why: '' },
                      useGraphic: true,
                    }))}
                    className={`rounded px-2 py-1 text-[10px] ${
                      active.graphicSuggestion?.type === gt ? 'bg-neutral-900 text-white font-semibold' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {GRAPHIC_LABELS[gt]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tips de presentación */}
          {(active.graphicSuggestion as any)?.tips?.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">Tips de delivery</div>
              <ul className="space-y-1.5">
                {((active.graphicSuggestion as any).tips as string[]).map((tip: string, i: number) => (
                  <li key={i} className="text-xs text-neutral-700 flex gap-2">
                    <span className="text-amber-500 shrink-0">&#9679;</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Image */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Imagen IA — Recraft v3</div>
            {active.generatedImage ? (
              <div>
                <div className="rounded-lg overflow-hidden mb-3 bg-neutral-100" style={{ aspectRatio: '16/9' }}>
                  <img src={active.generatedImage.url} alt="Generada" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateImage(active.generatedImage?.style ?? selectedStyle)}
                    disabled={genImgFor === activeIdx}
                    className="flex-1 rounded-lg border border-neutral-200 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {genImgFor === activeIdx ? 'Generando...' : 'Regenerar'}
                  </button>
                  <button
                    onClick={() => updateSlide(activeIdx, (s) => ({ ...s, generatedImage: undefined }))}
                    className="rounded-lg border border-red-100 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-1.5 mb-3">
                  {RECRAFT_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStyle(s.id)}
                      className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 text-left text-xs ${
                        selectedStyle === s.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      <ImageIcon size={16} className="shrink-0 text-neutral-400" />
                      <div>
                        <div className="font-semibold text-neutral-800">{s.label}</div>
                        <div className="text-[10px] text-neutral-400">{s.desc}</div>
                      </div>
                      {selectedStyle === s.id && <Check size={14} className="ml-auto text-neutral-900" />}
                    </button>
                  ))}
                </div>
                {imageError && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{imageError}</div>}
                <button
                  onClick={() => handleGenerateImage(selectedStyle)}
                  disabled={genImgFor === activeIdx}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {genImgFor === activeIdx ? 'Generando imagen...' : 'Generar imagen con Recraft'}
                </button>
              </div>
            )}
          </div>

          {/* Asset upload */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Asset propio</div>
            {active.uploadedAsset ? (
              <div>
                {active.uploadedAsset.fileType === 'image' && (
                  <div className="rounded-lg overflow-hidden mb-3 bg-neutral-100" style={{ aspectRatio: '16/9' }}>
                    <img src={active.uploadedAsset.dataUrl} alt={active.uploadedAsset.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 truncate">{active.uploadedAsset.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-neutral-200 px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-50">Cambiar</button>
                    <button
                      onClick={() => { if (active.uploadedAsset?.fileType === 'video') URL.revokeObjectURL(active.uploadedAsset.dataUrl); updateSlide(activeIdx, (s) => ({ ...s, uploadedAsset: undefined })) }}
                      className="rounded-lg border border-red-100 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                    >Eliminar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-neutral-200 py-8 text-center hover:border-neutral-400 transition-colors"
              >
                <Upload size={24} className="mx-auto mb-2 text-neutral-300" />
                <p className="text-xs font-semibold text-neutral-500">Arrastra o haz clic</p>
                <p className="text-[10px] text-neutral-300 mt-1">JPG, PNG, GIF, WebP, MP4 &middot; Max 8 MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Approve */}
          <button
            onClick={() => updateSlide(activeIdx, (s) => ({ ...s, approved: !s.approved }))}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
              active.approved
                ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {active.approved ? 'Aprobada — clic para desaprobar' : 'Aprobar lámina'}
          </button>

          {/* Nav */}
          <div className="flex gap-3 pb-4">
            <button
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-200 py-2 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="flex items-center text-xs text-neutral-400">{activeIdx + 1} / {slides.length}</span>
            <button
              onClick={() => setActiveIdx((i) => Math.min(slides.length - 1, i + 1))}
              disabled={activeIdx === slides.length - 1}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-200 py-2 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
