'use client'

import { useState, useCallback } from 'react'
import type {
  Zone4State,
  SlideReview,
  DesignSuggestion,
  SuggestionAxis,
  SlideStatus,
} from './types'
import { EMPTY_ZONE4 } from './types'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Zone4PanelProps {
  shapeId: string
  initialState: Zone4State
  zone1ContextJson?: string
  curvePointsJson?: string
  zone3DataJson?: string
  onStateUpdate: (state: Zone4State) => void
  onClose: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── Warm cream/parchment theme tokens ───────────────────────────────────────
const C = {
  bg: '#f5f3ef',
  surface: '#ffffff',
  surface2: '#efefeb',
  surface3: '#e8e6e1',
  border: '#dddbd6',
  border2: '#c8c6c0',
  text: '#1a1916',
  text2: '#6b6860',
  text3: '#a8a69f',
  accent: '#2d4a3e',
  accent2: '#4a7c66',
  pass: '#1D9E75',
  passBg: '#e1f5ee',
  warn: '#BA7517',
  warnBg: '#faeeda',
  fail: '#A32D2D',
  failBg: '#fcebeb',
  info: '#185FA5',
  infoBg: '#e6f1fb',
}

// ─── Helper: mock bg gradient based on slide type ─────────────────────────────
function mockBgForType(type: 'peak' | 'valley' | 'transition', index: number): string {
  const peaks = [
    'linear-gradient(135deg, #1a0f08 0%, #2d1a0a 50%, #1a1208 100%)',
    'linear-gradient(135deg, #160c08 0%, #2a1408 50%, #1a0e08 100%)',
  ]
  const valleys = [
    'linear-gradient(135deg, #080f1a 0%, #0c1a2d 50%, #081218 100%)',
    'linear-gradient(135deg, #060c18 0%, #0a1525 50%, #060e14 100%)',
  ]
  const transitions = [
    'linear-gradient(135deg, #1a1008 0%, #2d1f0a 50%, #1a1408 100%)',
    'linear-gradient(135deg, #181008 0%, #281c08 50%, #181208 100%)',
  ]
  const arr = type === 'peak' ? peaks : type === 'valley' ? valleys : transitions
  return arr[index % arr.length]!
}

// ─── Helper: initialize slides from curve points ──────────────────────────────
function initSlidesFromCurvePoints(curvePointsJson: string): SlideReview[] {
  try {
    const points = JSON.parse(curvePointsJson) as Array<{
      slide: number
      label: string
      fullLabel: string
      type: 'peak' | 'valley' | 'transition'
      emotion: string
      intensity: number
      uploadedAsset?: { dataUrl: string; fileType: 'image' | 'video'; mimeType?: string; name?: string }
    }>

    return points.map((p, i) => ({
      slide: p.slide,
      label: p.label,
      fullLabel: p.fullLabel,
      type: p.type,
      emotion: p.emotion,
      intensity: p.intensity,
      globalScore: null,
      globalStatus: 'pending' as SlideStatus,
      snapshot: null,
      axes: null,
      suggestions: [],
      mockBg: mockBgForType(p.type, i),
      evaluated: false,
      uploadedAsset: p.uploadedAsset,
    }))
  } catch {
    return []
  }
}

// ─── Helper: enrich slides with Zone3 uploaded assets ────────────────────────
function enrichSlidesWithZone3Assets(
  slides: SlideReview[],
  zone3DataJson: string | undefined
): SlideReview[] {
  if (!zone3DataJson) return slides
  try {
    const zone3State = JSON.parse(zone3DataJson) as {
      slides?: Array<{
        slide: number
        uploadedAsset?: { dataUrl: string; fileType: 'image' | 'video'; mimeType?: string; name?: string }
      }>
    }
    if (!zone3State.slides?.length) return slides
    const assetBySlide = new Map(
      zone3State.slides
        .filter((s) => !!s.uploadedAsset)
        .map((s) => [s.slide, s.uploadedAsset!])
    )
    if (assetBySlide.size === 0) return slides
    return slides.map((s) =>
      assetBySlide.has(s.slide) ? { ...s, uploadedAsset: assetBySlide.get(s.slide) } : s
    )
  } catch {
    return slides
  }
}

// ─── Helper: recalculate export blocked ──────────────────────────────────────
function recalcExportBlocked(slides: SlideReview[]): { blocked: boolean; reason: string } {
  if (slides.length === 0) return { blocked: true, reason: 'Sin slides evaluados' }
  const failsWithHighPending = slides.filter(
    (s) =>
      s.globalStatus === 'fail' &&
      s.suggestions.some((sg) => sg.severity === 'high' && sg.status === 'pending')
  )
  if (failsWithHighPending.length > 0) {
    return {
      blocked: true,
      reason: `${failsWithHighPending.length} slide(s) con fallos críticos sin resolver`,
    }
  }
  const notEvaluated = slides.filter((s) => !s.evaluated)
  if (notEvaluated.length > 0) {
    return {
      blocked: true,
      reason: `${notEvaluated.length} slide(s) sin evaluar`,
    }
  }
  return { blocked: false, reason: '' }
}

// ─── Status colors ────────────────────────────────────────────────────────────
function statusColor(status: SlideStatus | 'pass' | 'warning' | 'fail'): string {
  if (status === 'pass') return C.pass
  if (status === 'warning') return C.warn
  if (status === 'fail') return C.fail
  return C.text3
}
function statusBg(status: SlideStatus | 'pass' | 'warning' | 'fail'): string {
  if (status === 'pass') return C.passBg
  if (status === 'warning') return C.warnBg
  if (status === 'fail') return C.failBg
  return C.surface2
}
function statusLabel(status: SlideStatus | 'pass' | 'warning' | 'fail'): string {
  if (status === 'pass') return 'ok'
  if (status === 'warning') return 'alerta'
  if (status === 'fail') return 'fallo'
  return 'pendiente'
}

// ─── Axis labels ──────────────────────────────────────────────────────────────
const AXIS_LABELS: Record<SuggestionAxis, string> = {
  brand_compliance: 'brand compliance',
  cognitive_load: 'carga cognitiva',
  emotional_alignment: 'alineación emocional',
}

// ─── Main Panel Component ─────────────────────────────────────────────────────
export default function Zone4Panel({
  shapeId: _shapeId,
  initialState,
  zone1ContextJson,
  curvePointsJson,
  zone3DataJson,
  onStateUpdate,
  onClose,
}: Zone4PanelProps) {
  // Initialize slides from curve points or Zone3 data
  const resolvedInitial: Zone4State = (() => {
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('[Z4 init]', {
        curvePointsLen: curvePointsJson?.length ?? 0,
        zone3DataLen: zone3DataJson?.length ?? 0,
        initialSlides: initialState.slides.length,
      })
    }

    // Try to parse curvePointsJson first (from Zone2 — no assets here, will enrich below)
    const slidesFromCurve = curvePointsJson ? initSlidesFromCurvePoints(curvePointsJson) : []
    if (slidesFromCurve.length > 0) {
      const enriched = enrichSlidesWithZone3Assets(slidesFromCurve, zone3DataJson)
      const withAssets = enriched.filter(s => s.uploadedAsset).length
      console.log('[Z4 init] ✓ Loaded from Zone2 curvePoints:', enriched.length, '| slides con imagen:', withAssets)
      return { ...initialState, slides: enriched }
    }

    // Fallback: try to extract slides from Zone3 data directly (assets included)
    if (zone3DataJson) {
      try {
        const zone3State = JSON.parse(zone3DataJson) as {
          slides?: Array<{
            slide: number; label: string; fullLabel: string; type: string
            emotion: string; intensity: number
            uploadedAsset?: { dataUrl: string; fileType: 'image' | 'video'; mimeType?: string; name?: string }
          }>
        }
        if (zone3State.slides && zone3State.slides.length > 0) {
          const zone3Slides = initSlidesFromCurvePoints(JSON.stringify(zone3State.slides))
          if (zone3Slides.length > 0) {
            const withAssets = zone3Slides.filter(s => s.uploadedAsset).length
            console.log('[Z4 init] ✓ Loaded from Zone3 slides:', zone3Slides.length, '| slides con imagen:', withAssets)
            return { ...initialState, slides: zone3Slides }
          }
        }
      } catch (e) {
        console.log('[Z4 init] ✗ Failed to parse Zone3 data:', e)
      }
    }

    // Use initialState if it has slides (already persisted, may have assets)
    if (initialState.slides.length > 0) {
      console.log('[Z4 init] ✓ Using initialState slides:', initialState.slides.length)
      return initialState
    }

    // Return empty state
    console.log('[Z4 init] ⚠ No slides found - Zone 2 or Zone 3 may be empty')
    return initialState
  })()

  const [state, setState] = useState<Zone4State>(resolvedInitial)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [evalProgress, setEvalProgress] = useState<{ current: number; total: number } | null>(null)

  const currentSlide = state.slides[activeSlide]

  // ─── Core: call API for a single slide ─────────────────────────────────────
  const callEvaluateApi = useCallback(async (slide: SlideReview): Promise<SlideReview> => {
    // Strip dataUrl (can be several MB — API only needs metadata)
    const slideForApi = slide.uploadedAsset
      ? {
          ...slide,
          uploadedAsset: {
            fileType: slide.uploadedAsset.fileType,
            mimeType: slide.uploadedAsset.mimeType,
            name: slide.uploadedAsset.name,
            dataUrl: '',
          },
        }
      : slide

    const resp = await fetch(`${API_BASE}/api/v1/zones/zone4/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slideReview: slideForApi,
        zone1ContextJson: zone1ContextJson ?? '',
        curvePointsJson: curvePointsJson ?? '',
        brandLayerJson: zone1ContextJson ?? '',
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({})) as { error?: string }
      throw new Error(errBody.error ?? `Error del servidor (${resp.status})`)
    }
    const data = (await resp.json()) as { success: boolean; updatedSlide: SlideReview; error?: string }
    if (!data.success || !data.updatedSlide) {
      throw new Error(data.error ?? 'Respuesta inválida del agente')
    }
    // Re-attach the original uploadedAsset (dataUrl was stripped for the request)
    return { ...data.updatedSlide, evaluated: true, uploadedAsset: slide.uploadedAsset }
  }, [zone1ContextJson, curvePointsJson])

  // ─── Evaluate ALL slides sequentially ──────────────────────────────────────
  const handleEvaluateAll = useCallback(async () => {
    if (isEvaluating || state.slides.length === 0) return
    setIsEvaluating(true)
    setEvalError(null)
    setEvalProgress({ current: 0, total: state.slides.length })

    // Work on a local copy so each iteration reads fresh data,
    // not stale React state — this prevents suggestion accumulation
    let workingSlides = [...state.slides]

    for (let i = 0; i < workingSlides.length; i++) {
      setEvalProgress({ current: i + 1, total: workingSlides.length })
      setActiveSlide(i)

      try {
        const evaluated = await callEvaluateApi(workingSlides[i]!)
        workingSlides = workingSlides.map((s, idx) => idx === i ? evaluated : s)

        // Persist after each slide so the user sees live progress
        setState((prev) => {
          const { blocked, reason } = recalcExportBlocked(workingSlides)
          const next: Zone4State = {
            ...prev,
            slides: workingSlides,
            exportBlocked: blocked,
            exportBlockedReason: reason,
            lastEvaluatedAt: new Date().toISOString(),
          }
          onStateUpdate(next)
          return next
        })
      } catch (err) {
        console.error(`Zone4 evaluate error slide ${workingSlides[i]?.slide}:`, err)
        setEvalError(`Error en slide ${workingSlides[i]?.slide ?? i + 1}: ${err instanceof Error ? err.message : 'Error desconocido'}`)
        // Continue with remaining slides instead of aborting
      }
    }

    setIsEvaluating(false)
    setEvalProgress(null)
  }, [isEvaluating, state.slides, callEvaluateApi, onStateUpdate])

  // ─── Apply / reject suggestion ──────────────────────────────────────────────
  const handleSuggestion = useCallback(
    (suggId: string, action: 'approved' | 'rejected') => {
      setState((prev) => {
        const newSlides = prev.slides.map((s, i) => {
          if (i !== activeSlide) return s
          const newSuggs = s.suggestions.map((sg) =>
            sg.id === suggId ? { ...sg, status: action } : sg
          )
          return { ...s, suggestions: newSuggs }
        })
        const { blocked, reason } = recalcExportBlocked(newSlides)
        const next: Zone4State = {
          ...prev,
          slides: newSlides,
          exportBlocked: blocked,
          exportBlockedReason: reason,
        }
        onStateUpdate(next)
        return next
      })
    },
    [activeSlide, onStateUpdate]
  )

  // ─── Summary counts ──────────────────────────────────────────────────────────
  const evaluatedCount = state.slides.filter((s) => s.evaluated).length
  const okCount = state.slides.filter((s) => s.globalStatus === 'pass').length
  const alertCount = state.slides.filter((s) => s.globalStatus === 'warning').length
  const failCount = state.slides.filter((s) => s.globalStatus === 'fail').length
  const totalSuggestions = state.slides.reduce((acc, s) => acc + s.suggestions.length, 0)
  const appliedSuggestions = state.slides.reduce(
    (acc, s) => acc + s.suggestions.filter((sg) => sg.status === 'approved').length,
    0
  )

  const pendingSuggestions = currentSlide?.suggestions.filter((sg) => sg.status === 'pending').length ?? 0
  const approvedSuggestions = currentSlide?.suggestions.filter((sg) => sg.status === 'approved').length ?? 0

  // ─── Panel wrapper ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(26,25,22,0.55)',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: 1000,
          maxWidth: '96vw',
          maxHeight: '90vh',
          backgroundColor: C.bg,
          borderRadius: 12,
          border: `1.5px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* ── Panel header ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: C.surface,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                zona 4
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Playfair Display', serif" }}>
                crítico de diseño
              </div>
            </div>
            {/* Canva API status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                backgroundColor: C.surface2,
                border: `1px solid ${C.border2}`,
                borderRadius: 4,
                fontSize: 9,
                color: state.canvaConnected ? C.pass : C.text3,
                letterSpacing: '0.08em',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: state.canvaConnected ? C.pass : C.border2,
                }}
              />
              {state.canvaConnected ? 'canva API — conectado' : 'canva API — sin conectar'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: `1px solid ${C.border2}`,
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 11,
              color: C.text2,
              cursor: 'pointer',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            cerrar ✕
          </button>
        </div>

        {/* ── 3-column body ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* LEFT COLUMN — slide navigation */}
          <div
            style={{
              width: 220,
              flexShrink: 0,
              borderRight: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: C.surface,
            }}
          >
            {/* Column header */}
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
                zona 4
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Playfair Display', serif" }}>
                crítico de diseño
              </div>
              {/* Canva dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: state.canvaConnected ? C.pass : C.border2,
                  }}
                />
                <span style={{ fontSize: 8, color: C.text3 }}>
                  {state.canvaConnected ? 'canva conectado' : 'canva — sin conectar'}
                </span>
              </div>
            </div>

            {/* Slide list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {state.slides.length === 0 ? (
                <div style={{ padding: '20px 14px', fontSize: 10, color: C.text3, textAlign: 'center', lineHeight: 1.5 }}>
                  <div style={{ marginBottom: 8 }}>🔄</div>
                  <div style={{ marginBottom: 6 }}>Sin slides inicializados</div>
                  <div style={{ fontSize: 9, color: C.text3 }}>
                    Asegúrate de que Zona 2<br/>o Zona 3 tengan slides
                  </div>
                </div>
              ) : (
                state.slides.map((slide, idx) => (
                  <button
                    key={slide.slide}
                    onClick={() => setActiveSlide(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '7px 14px',
                      background: activeSlide === idx ? C.surface2 : 'none',
                      border: 'none',
                      borderLeft: activeSlide === idx ? `3px solid ${C.accent}` : '3px solid transparent',
                      cursor: 'pointer',
                      fontFamily: "'IBM Plex Mono', monospace",
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: C.text3,
                        minWidth: 18,
                        fontWeight: 600,
                      }}
                    >
                      {slide.slide}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 9,
                        color: activeSlide === idx ? C.text : C.text2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {slide.label}
                    </span>
                    {/* Status badge */}
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: statusColor(slide.globalStatus),
                        backgroundColor: statusBg(slide.globalStatus),
                        borderRadius: 8,
                        padding: '1px 5px',
                        flexShrink: 0,
                      }}
                    >
                      {slide.globalScore !== null ? slide.globalScore.toFixed(1) : '—'}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Footer summary */}
            <div
              style={{
                padding: '10px 14px',
                borderTop: `1px solid ${C.border}`,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
              }}
            >
              {[
                { label: 'evaluados', value: `${evaluatedCount}/${state.slides.length}` },
                { label: 'ok/alerta/fallo', value: `${okCount}/${alertCount}/${failCount}` },
                { label: 'sugerencias', value: totalSuggestions },
                { label: 'aplicadas', value: appliedSuggestions },
              ].map((item) => (
                <div key={item.label} style={{ backgroundColor: C.surface2, borderRadius: 5, padding: '5px 7px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{item.value}</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 1 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER COLUMN — slide detail */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            {currentSlide ? (
              <>
                {/* Slide header */}
                <div
                  style={{
                    padding: '12px 18px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.accent,
                      backgroundColor: C.surface2,
                      border: `1px solid ${C.border2}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                    }}
                  >
                    slide {currentSlide.slide}
                  </span>
                  <span style={{ fontSize: 10, color: C.text2 }}>
                    {currentSlide.type} · {currentSlide.emotion} · {currentSlide.intensity}/10
                  </span>
                  <div style={{ marginLeft: 'auto' }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: statusColor(currentSlide.globalStatus),
                        backgroundColor: statusBg(currentSlide.globalStatus),
                        borderRadius: 8,
                        padding: '2px 8px',
                        border: `1px solid ${statusColor(currentSlide.globalStatus)}30`,
                      }}
                    >
                      {statusLabel(currentSlide.globalStatus)}
                      {currentSlide.globalScore !== null ? ` · ${currentSlide.globalScore.toFixed(1)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Scrollable body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Section: contenido del slide */}
                  <SectionBlock title="contenido del slide">
                    <SlideMock slide={currentSlide} />
                  </SectionBlock>

                  {/* Section: evaluación por ejes */}
                  {currentSlide.evaluated && currentSlide.axes && (
                    <SectionBlock title="evaluación por ejes">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <AxisCard
                          name="Brand compliance"
                          weight="40%"
                          axis={currentSlide.axes.brand}
                        />
                        <AxisCard
                          name="Carga cognitiva"
                          weight="35%"
                          axis={currentSlide.axes.cognitive}
                        />
                        <AxisCard
                          name="Alineación emocional"
                          weight="25%"
                          axis={currentSlide.axes.emotional}
                        />
                      </div>
                    </SectionBlock>
                  )}

                  {/* Section: score global */}
                  {currentSlide.evaluated && currentSlide.globalScore !== null && (
                    <SectionBlock title="score global">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: '10px 14px',
                          backgroundColor: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 36,
                            fontWeight: 700,
                            fontFamily: "'Playfair Display', serif",
                            color: statusColor(currentSlide.globalStatus),
                            minWidth: 60,
                          }}
                        >
                          {currentSlide.globalScore.toFixed(1)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 8, backgroundColor: C.surface3, borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${(currentSlide.globalScore / 10) * 100}%`,
                                backgroundColor: statusColor(currentSlide.globalStatus),
                                borderRadius: 4,
                                transition: 'width 0.5s ease',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 8, color: C.text3 }}>
                            0.40 × brand + 0.35 × cognitiva + 0.25 × emocional
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: statusColor(currentSlide.globalStatus),
                            backgroundColor: statusBg(currentSlide.globalStatus),
                            borderRadius: 8,
                            padding: '3px 10px',
                          }}
                        >
                          {statusLabel(currentSlide.globalStatus)}
                        </div>
                      </div>
                    </SectionBlock>
                  )}
                </div>

                {/* Evaluate button */}
                <div
                  style={{
                    padding: '12px 18px',
                    borderTop: `1px solid ${C.border}`,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {/* Progress bar (visible only during evaluation) */}
                  {evalProgress && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.text3, fontFamily: "'IBM Plex Mono', monospace" }}>
                        <span>evaluando slide {evalProgress.current} de {evalProgress.total}</span>
                        <span>{Math.round((evalProgress.current / evalProgress.total) * 100)}%</span>
                      </div>
                      <div style={{ height: 3, backgroundColor: C.surface3, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(evalProgress.current / evalProgress.total) * 100}%`,
                          backgroundColor: C.accent2,
                          borderRadius: 2,
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleEvaluateAll}
                    disabled={isEvaluating || state.slides.length === 0}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      backgroundColor: isEvaluating ? C.surface3 : C.accent,
                      color: isEvaluating ? C.text3 : '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 600,
                      cursor: isEvaluating || state.slides.length === 0 ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.05em',
                      transition: 'background 0.2s',
                    }}
                  >
                    {isEvaluating
                      ? `⏳ evaluando (${evalProgress?.current ?? 0}/${evalProgress?.total ?? state.slides.length})...`
                      : state.slides.every(s => s.evaluated)
                        ? `🔄 re-evaluar todas (${state.slides.length})`
                        : `🤖 evalúa todas con IA (${state.slides.length})`}
                  </button>

                  {evalError && (
                    <div
                      style={{
                        padding: '8px 10px',
                        backgroundColor: C.failBg,
                        border: `1px solid ${C.fail}30`,
                        borderRadius: 6,
                        fontSize: 10,
                        color: C.fail,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>⚠</span>
                      <span style={{ flex: 1 }}>{evalError}</span>
                      <button
                        onClick={() => setEvalError(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fail, fontSize: 12, padding: 0, lineHeight: 1 }}
                      >×</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.text3,
                  fontSize: 12,
                  fontStyle: 'italic',
                }}
              >
                Selecciona un slide para ver el detalle
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — suggestions */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              borderLeft: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: C.surface,
            }}
          >
            {/* Column header */}
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>sugerencias del agente</div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>
                {pendingSuggestions} pendientes · {approvedSuggestions} aplicadas
              </div>
            </div>

            {/* Suggestions list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {!currentSlide || currentSlide.suggestions.length === 0 ? (
                <div
                  style={{
                    padding: '20px 10px',
                    fontSize: 10,
                    color: C.text3,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {currentSlide?.evaluated
                    ? 'Sin sugerencias para este slide'
                    : 'Evalúa el slide para ver sugerencias'}
                </div>
              ) : (
                currentSlide.suggestions.map((sugg) => (
                  <SuggestionCard
                    key={sugg.id}
                    suggestion={sugg}
                    onApply={() => handleSuggestion(sugg.id, 'approved')}
                    onReject={() => handleSuggestion(sugg.id, 'rejected')}
                  />
                ))
              )}
            </div>

            {/* Export status footer */}
            <div
              style={{
                padding: '10px 14px',
                borderTop: `1px solid ${C.border}`,
                backgroundColor: state.exportBlocked ? C.failBg : C.passBg,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: state.exportBlocked ? C.fail : C.pass,
                  marginBottom: 2,
                }}
              >
                {state.exportBlocked ? '⚠ exportación bloqueada' : '✓ listo para exportar'}
              </div>
              {state.exportBlocked && (
                <div style={{ fontSize: 8, color: C.fail }}>{state.exportBlockedReason}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SectionBlock ─────────────────────────────────────────────────────────────
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 8,
          color: C.text3,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

// ─── SlideMock ────────────────────────────────────────────────────────────────
function SlideMock({ slide }: { slide: SlideReview }) {
  const isPending = !slide.evaluated

  // Type colors and labels
  const typeConfig = {
    peak: { color: '#e8a44a', bg: 'rgba(232,164,74,0.15)', label: 'pico emocional', icon: '▲' },
    valley: { color: '#5b8fcf', bg: 'rgba(91,143,207,0.15)', label: 'momento íntimo', icon: '▼' },
    transition: { color: '#9b7fc7', bg: 'rgba(155,127,199,0.15)', label: 'transición', icon: '◆' },
  }
  const tc = typeConfig[slide.type]

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        background: slide.mockBg,
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        boxSizing: 'border-box',
        gap: 0,
      }}
    >
      {isPending ? (
        <>
          {/* If there's an uploaded image, show it as full background */}
          {slide.uploadedAsset?.fileType === 'image' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${slide.uploadedAsset.dataUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.55,
              borderRadius: 8,
            }} />
          )}

          {/* Dark overlay so text is always readable */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.15) 100%)',
            borderRadius: 8,
          }} />

          {/* Content — relative so it sits above overlays */}
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Top row: slide number + type badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.55)',
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.1em',
              }}>
                SLIDE {slide.slide}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: tc.bg,
                border: `1px solid ${tc.color}55`,
                borderRadius: 4,
                padding: '2px 7px',
                backdropFilter: 'blur(4px)',
              }}>
                <span style={{ fontSize: 7, color: tc.color }}>{tc.icon}</span>
                <span style={{ fontSize: 8, color: tc.color, fontWeight: 600, letterSpacing: '0.06em' }}>{tc.label}</span>
              </div>
            </div>

            {/* Slide title — center stage */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
              <div style={{
                fontSize: slide.type === 'peak' ? 17 : 14,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.95)',
                fontFamily: "'Playfair Display', serif",
                lineHeight: 1.3,
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}>
                {slide.fullLabel || slide.label}
              </div>

              {/* Emotion + intensity bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>
                  {slide.emotion}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.15)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(slide.intensity / 10) * 100}%`,
                      background: tc.color,
                      borderRadius: 2,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: tc.color,
                    fontFamily: "'IBM Plex Mono', monospace",
                    minWidth: 24,
                  }}>
                    {slide.intensity}/10
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: asset indicator or CTA */}
            <div style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              {slide.uploadedAsset ? (
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
                  🖼 {slide.uploadedAsset.name ?? 'imagen cargada'} · evalúa con IA para analizar diseño
                </span>
              ) : (
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  Haz clic en «evalúa con IA» para analizar el diseño
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* If there's an uploaded image, show it as background */}
          {slide.uploadedAsset?.fileType === 'image' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${slide.uploadedAsset.dataUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.45,
              borderRadius: 8,
            }} />
          )}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.15) 100%)',
            borderRadius: 8,
          }} />

          {/* Content wrapper */}
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Top row: slide number + type badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.55)',
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '0.1em',
            }}>
              SLIDE {slide.slide}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: tc.bg,
              border: `1px solid ${tc.color}55`,
              borderRadius: 4,
              padding: '2px 7px',
              backdropFilter: 'blur(4px)',
            }}>
              <span style={{ fontSize: 7, color: tc.color }}>{tc.icon}</span>
              <span style={{ fontSize: 8, color: tc.color, fontWeight: 600, letterSpacing: '0.06em' }}>{tc.label}</span>
            </div>
          </div>

          {/* Evaluated content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div
              style={{
                fontSize: slide.type === 'peak' ? 17 : 14,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
                fontFamily: "'Playfair Display', serif",
                lineHeight: 1.3,
              }}
            >
              {slide.fullLabel || slide.label}
            </div>
            {slide.type === 'peak' && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: tc.color,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {(slide.intensity * 10).toFixed(0)}%
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(slide.intensity / 10) * 100}%`,
                  background: tc.color,
                  borderRadius: 2,
                }} />
              </div>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                color: tc.color,
                fontFamily: "'IBM Plex Mono', monospace",
                minWidth: 24,
              }}>
                {slide.intensity}/10
              </div>
            </div>
          </div>

          {/* Annotation overlay if has failing checks */}
          {slide.axes && (
            (() => {
              const wordCheck = slide.snapshot?.words
              const hasAnnotation = wordCheck && wordCheck > (slide.type === 'peak' ? 15 : slide.type === 'valley' ? 20 : 18)
              return hasAnnotation ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    border: '1.5px solid #BA7517',
                    borderRadius: 4,
                    padding: '2px 6px',
                    backgroundColor: 'rgba(186,117,23,0.15)',
                    fontSize: 8,
                    color: '#BA7517',
                    fontWeight: 600,
                  }}
                >
                  {wordCheck} palabras — excede límite
                </div>
              ) : null
            })()
          )}
          </div>{/* end content wrapper */}
        </>
      )}
    </div>
  )
}

// ─── AxisCard ─────────────────────────────────────────────────────────────────
function AxisCard({
  name,
  weight,
  axis,
}: {
  name: string
  weight: string
  axis: { score: number; status: 'pass' | 'warning' | 'fail'; checks: Array<{ pass: boolean; text: string }> }
}) {
  const color = statusColor(axis.status)
  const bg = statusBg(axis.status)
  const pct = (axis.score / 10) * 100

  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '10px',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color: C.text, marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 8, color: C.text3, marginBottom: 8 }}>peso {weight}</div>

      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color }}>
          {axis.score.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color,
            backgroundColor: bg,
            borderRadius: 6,
            padding: '1px 5px',
          }}
        >
          {statusLabel(axis.status)}
        </span>
      </div>

      {/* Score bar */}
      <div style={{ height: 4, backgroundColor: C.surface3, borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      {/* Checks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {axis.checks.slice(0, 4).map((check, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
            <span style={{ fontSize: 9, color: check.pass ? C.pass : C.fail, flexShrink: 0 }}>
              {check.pass ? '✓' : '✗'}
            </span>
            <span
              style={{ fontSize: 8, color: C.text2, lineHeight: 1.4 }}
              dangerouslySetInnerHTML={{ __html: check.text }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SuggestionCard ───────────────────────────────────────────────────────────
function SuggestionCard({
  suggestion,
  onApply,
  onReject,
}: {
  suggestion: DesignSuggestion
  onApply: () => void
  onReject: () => void
}) {
  const isResolved = suggestion.status !== 'pending'
  const isApproved = suggestion.status === 'approved'
  const isRejected = suggestion.status === 'rejected'

  const severityColor = suggestion.severity === 'high' ? C.fail : suggestion.severity === 'medium' ? C.warn : C.info
  const severityBg = suggestion.severity === 'high' ? C.failBg : suggestion.severity === 'medium' ? C.warnBg : C.infoBg

  const statusIcon = suggestion.status === 'pending' ? '⏳' : suggestion.status === 'approved' ? '✓' : '✗'

  return (
    <div
      style={{
        marginBottom: 8,
        border: `1px solid ${isApproved ? C.pass : C.border}`,
        borderRadius: 8,
        padding: '10px',
        backgroundColor: isApproved ? `${C.pass}08` : isRejected ? C.surface2 : C.surface,
        opacity: isRejected ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        <span
          style={{
            fontSize: 7,
            fontWeight: 700,
            color: severityColor,
            backgroundColor: severityBg,
            borderRadius: 4,
            padding: '1px 5px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {suggestion.severity}
        </span>
        <span style={{ fontSize: 8, color: C.text3, flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {AXIS_LABELS[suggestion.axis]}
        </span>
        <span style={{ fontSize: 10 }}>{statusIcon}</span>
      </div>

      {/* Problem */}
      <div style={{ fontSize: 9, color: C.text, marginBottom: 5, lineHeight: 1.4 }}>
        {suggestion.problem}
      </div>

      {/* Fix */}
      <div style={{ fontSize: 9, color: C.text2, fontStyle: 'italic', marginBottom: 7, lineHeight: 1.4 }}>
        {suggestion.fix}
      </div>

      {/* Diff block */}
      {suggestion.before && suggestion.after && (
        <div
          style={{
            backgroundColor: C.surface2,
            borderRadius: 5,
            padding: '7px',
            marginBottom: 8,
            fontSize: 8,
          }}
        >
          <div style={{ color: C.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 7 }}>
            diff · {suggestion.diffType}
          </div>
          <div style={{ color: C.fail, textDecoration: 'line-through', marginBottom: 3, lineHeight: 1.4 }}>
            {suggestion.before}
          </div>
          <div style={{ color: C.pass, lineHeight: 1.4 }}>
            {suggestion.after}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isResolved ? (
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={onApply}
            style={{
              flex: 1,
              padding: '5px 0',
              backgroundColor: C.passBg,
              color: C.pass,
              border: `1px solid ${C.pass}40`,
              borderRadius: 5,
              fontSize: 9,
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            aplicar
          </button>
          <button
            onClick={onReject}
            style={{
              flex: 1,
              padding: '5px 0',
              backgroundColor: C.surface3,
              color: C.text2,
              border: `1px solid ${C.border2}`,
              borderRadius: 5,
              fontSize: 9,
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            rechazar
          </button>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            fontSize: 8,
            fontWeight: 700,
            color: isApproved ? C.pass : C.text3,
            padding: '3px 0',
          }}
        >
          {isApproved ? '✓ aplicada' : '✗ rechazada'}
        </div>
      )}
    </div>
  )
}
