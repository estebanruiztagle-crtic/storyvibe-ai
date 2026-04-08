'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Zone5State, StoryboardSlide, SlideStatus, PendingSuggestion } from './types'
import { EMPTY_ZONE5 } from './types'
import { generateReportHtml, type ReportData, type PitchData } from './generateReport'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Zone5PanelProps {
  shapeId: string
  initialState: Zone5State
  zone1ContextJson?: string
  curvePointsJson?: string
  zone2DataJson?: string
  zone3DataJson?: string
  zone4DataJson?: string
  onStateUpdate: (state: Zone5State) => void
  onClose: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── Design tokens (exact prototype values) ───────────────────────────────────
const C = {
  bg: '#f7f6f3',
  surface: '#ffffff',
  surface2: '#f0efe9',
  surface3: '#e8e6df',
  border: '#dddbd3',
  border2: '#c8c5bb',
  text: '#1c1b18',
  text2: '#6b6960',
  text3: '#a8a59b',
  pass: '#1a7a57',
  passBg: '#e8f5ee',
  warn: '#8a5a00',
  warnBg: '#fdf3dc',
  fail: '#8a2020',
  failBg: '#fceaea',
  pending: '#5a5a5a',
  pendingBg: '#eeeeec',
  peak: '#1D9E75',
  valley: '#378ADD',
  transition: '#EF9F27',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTimeLabel(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (s === 0) return `${m} min`
  return `${m}m ${s}s`
}

function worstStatus(a: SlideStatus, b: SlideStatus): SlideStatus {
  const rank: Record<SlideStatus, number> = { fail: 3, warning: 2, pending: 1, pass: 0 }
  return rank[a] >= rank[b] ? a : b
}

function statusColor(s: SlideStatus): string {
  return s === 'pass' ? C.pass : s === 'warning' ? C.warn : s === 'fail' ? C.fail : C.pending
}
function statusBg(s: SlideStatus): string {
  return s === 'pass' ? C.passBg : s === 'warning' ? C.warnBg : s === 'fail' ? C.failBg : C.pendingBg
}
function statusLabel(s: SlideStatus): string {
  return s === 'pass' ? 'ok' : s === 'warning' ? 'alerta' : s === 'fail' ? 'fallo' : 'pend'
}

function typeColor(t: 'peak' | 'valley' | 'transition'): string {
  return t === 'peak' ? C.peak : t === 'valley' ? C.valley : C.transition
}
function typeLabel(t: 'peak' | 'valley' | 'transition'): string {
  return t === 'peak' ? 'pico' : t === 'valley' ? 'valle' : 'trans'
}

function mockBgForType(type: 'peak' | 'valley' | 'transition', idx: number): string {
  if (type === 'peak') {
    return idx % 2 === 0
      ? 'linear-gradient(160deg,#1a1208 0%,#3d2b0f 100%)'
      : 'linear-gradient(160deg,#160c08 0%,#2a1408 100%)'
  }
  if (type === 'valley') {
    return idx % 2 === 0
      ? 'linear-gradient(160deg,#0d1420 0%,#1a1a2e 100%)'
      : 'linear-gradient(160deg,#060c18 0%,#0a1525 100%)'
  }
  return idx % 2 === 0
    ? 'linear-gradient(160deg,#0f2015 0%,#1a2e1a 100%)'
    : 'linear-gradient(160deg,#181008 0%,#281c08 100%)'
}

function defaultSeconds(type: 'peak' | 'valley' | 'transition'): number {
  return type === 'peak' ? 120 : type === 'valley' ? 150 : 90
}

// ─── Build slides from zone data ──────────────────────────────────────────────
interface CurvePoint {
  slide: number
  label: string
  fullLabel: string
  type: 'peak' | 'valley' | 'transition'
  emotion: string
  intensity: number
}

interface Zone3Slot {
  // new structure (Zone3Slide)
  slide?: number
  approved: boolean
  uploadedAsset?: { dataUrl: string; fileType: 'image' | 'video' }
  // old structure (legacy)
  curvePoint?: { slide: number } | null
  status?: string
}

interface Zone4Review {
  slide: number
  globalStatus: SlideStatus
  globalScore: number | null
  suggestions: Array<{
    severity: 'high' | 'medium' | 'low'
    problem: string
    axis: string
    status: string
  }>
  evaluated: boolean
}

function buildSlidesFromZones(
  curveJson: string,
  zone3Json: string,
  zone4Json: string,
): StoryboardSlide[] {
  let curvePoints: CurvePoint[] = []
  let zone3Slots: Zone3Slot[] = []
  let zone4Reviews: Zone4Review[] = []

  try { curvePoints = JSON.parse(curveJson) as CurvePoint[] } catch { /* empty */ }
  try {
    const z3 = JSON.parse(zone3Json) as { slides?: Zone3Slot[]; slots?: Zone3Slot[] }
    zone3Slots = z3.slides ?? z3.slots ?? []
  } catch { /* empty */ }
  try {
    const z4 = JSON.parse(zone4Json) as { slides?: Zone4Review[] }
    zone4Reviews = z4.slides ?? []
  } catch { /* empty */ }

  if (curvePoints.length === 0) return []

  return curvePoints.map((pt, idx) => {
    const z3slot = zone3Slots.find((s) => (s.slide ?? s.curvePoint?.slide) === pt.slide)
    const z4review = zone4Reviews.find((r) => r.slide === pt.slide)

    const assetStatus: SlideStatus = z3slot
      ? z3slot.approved ? 'pass' : 'warning'
      : 'pending'

    const designStatus: SlideStatus = z4review
      ? z4review.evaluated ? (z4review.globalStatus as SlideStatus) : 'pending'
      : 'pending'

    const overallStatus = worstStatus(assetStatus, designStatus)

    const pendingSuggestions: PendingSuggestion[] = z4review
      ? z4review.suggestions
          .filter((s) => s.status === 'pending')
          .map((s) => ({
            severity: s.severity,
            text: s.problem,
            axis: s.axis as PendingSuggestion['axis'],
          }))
      : []

    return {
      slide: pt.slide,
      label: pt.label,
      fullLabel: pt.fullLabel,
      type: pt.type,
      emotion: pt.emotion,
      intensity: pt.intensity,
      seconds: defaultSeconds(pt.type),
      pacing: pt.type === 'valley' ? 'slow' : 'medium',
      assetStatus,
      designStatus,
      overallStatus,
      pendingSuggestions,
      designScore: z4review?.globalScore ?? null,
      mockBg: mockBgForType(pt.type, idx),
      uploadedAsset: z3slot?.uploadedAsset,
    } satisfies StoryboardSlide
  })
}

function computeExportBlocked(_slides: StoryboardSlide[]): { blocked: boolean; reason: string } {
  // Export is always available — the user decides when to export to Canva
  return { blocked: false, reason: '' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SlideCard({
  slide,
  index,
  isActive,
  fallbackMode,
  onClick,
}: {
  slide: StoryboardSlide
  index: number
  isActive: boolean
  fallbackMode: boolean
  onClick: () => void
}) {
  const tc = typeColor(slide.type)
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: '220px',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
    >
      {/* Thumb wrap */}
      <div style={{
        border: `1.5px solid ${isActive ? C.text : C.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: C.surface,
        transition: 'border-color 0.15s',
      }}>
        {/* 16:9 thumbnail */}
        <div style={{
          width: '100%',
          paddingBottom: '56.25%',
          position: 'relative',
          background: slide.mockBg,
          overflow: 'hidden',
        }}>
          {/* Uploaded image from Zone 3 */}
          {slide.uploadedAsset?.fileType === 'image' && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${slide.uploadedAsset.dataUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.6,
            }} />
          )}
          {/* Gradient overlay for readability */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          }} />
          <div style={{ position: 'absolute', inset: 0, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {fallbackMode && (
              <div style={{
                position: 'absolute', top: 6, right: 6,
                background: 'rgba(0,0,0,0.5)', borderRadius: '3px',
                padding: '2px 5px', fontSize: '7px',
                color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace',
              }}>
                15 min
              </div>
            )}
            <div style={{ fontSize: '8px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, marginBottom: '2px', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
              {slide.fullLabel || slide.label}
            </div>
            <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
              {slide.emotion}
            </div>
          </div>
        </div>

        {/* Status strip: assets | design | overall */}
        <div style={{ display: 'flex', borderTop: `0.5px solid ${C.border}` }}>
          {(['assetStatus', 'designStatus', 'overallStatus'] as const).map((key, i) => {
            const st = slide[key]
            return (
              <div key={key} style={{
                flex: 1,
                height: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '7px', fontWeight: 500, fontFamily: 'monospace',
                backgroundColor: statusBg(st),
                color: statusColor(st),
                borderRight: i < 2 ? `0.5px solid ${C.border}` : 'none',
              }}>
                {i === 0 ? 'asset' : i === 1 ? 'diseño' : 'total'}
              </div>
            )
          })}
        </div>

        {/* Meta */}
        <div style={{
          padding: '7px 9px',
          backgroundColor: C.surface,
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '9px', color: C.text3, fontFamily: 'monospace' }}>
              {String(slide.slide).padStart(2, '0')}
            </span>
            <span style={{
              fontSize: '9px', padding: '1px 6px', borderRadius: '3px',
              backgroundColor: `${tc}18`, color: tc, fontFamily: 'monospace',
            }}>
              {typeLabel(slide.type)}
            </span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {slide.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: tc }} />
              <span style={{ fontSize: '9px', color: C.text2, fontFamily: 'monospace' }}>
                {slide.emotion}
              </span>
            </div>
            <span style={{
              fontSize: '9px', color: C.text3, fontFamily: 'monospace',
              backgroundColor: C.surface2, padding: '2px 6px', borderRadius: '3px',
            }}>
              {formatTime(slide.seconds)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailPanel({ slide }: { slide: StoryboardSlide | null }) {
  if (!slide) {
    return (
      <div style={{
        backgroundColor: C.surface, borderTop: `0.5px solid ${C.border}`,
        padding: '14px 20px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '90px',
      }}>
        <span style={{ fontSize: '11px', color: C.text3, fontFamily: 'monospace' }}>
          selecciona un slide para ver el detalle
        </span>
      </div>
    )
  }

  const cols = [
    {
      label: 'slide',
      val: `${String(slide.slide).padStart(2, '0')} — ${slide.label}`,
      sub: slide.fullLabel,
    },
    {
      label: 'emoción / intensidad',
      val: slide.emotion,
      sub: `intensidad ${slide.intensity}/10 · ${typeLabel(slide.type)}`,
    },
    {
      label: 'tiempo asignado',
      val: formatTimeLabel(slide.seconds),
      sub: `ritmo ${slide.pacing}`,
    },
    {
      label: 'puntuación diseño',
      val: slide.designScore !== null ? `${slide.designScore.toFixed(1)} / 10` : '—',
      sub: `assets: ${statusLabel(slide.assetStatus)} · diseño: ${statusLabel(slide.designStatus)}`,
    },
    {
      label: 'sugerencias',
      val: null,
      suggestions: slide.pendingSuggestions,
    },
  ]

  return (
    <div style={{
      backgroundColor: C.surface,
      borderTop: `0.5px solid ${C.border}`,
      padding: '14px 20px',
      flexShrink: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '12px',
      alignItems: 'start',
    }}>
      {cols.map((col, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{
            fontSize: '9px', color: C.text3,
            fontFamily: 'monospace', textTransform: 'uppercase',
            letterSpacing: '0.07em', marginBottom: '2px',
          }}>
            {col.label}
          </div>
          {col.suggestions !== undefined ? (
            col.suggestions.length === 0 ? (
              <span style={{
                fontSize: '9px', color: C.pass, fontFamily: 'monospace',
                backgroundColor: C.passBg, padding: '2px 6px',
                borderRadius: '3px', display: 'inline-block',
              }}>
                sin issues
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {col.suggestions.slice(0, 3).map((s, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: '9px', color: C.text2, fontFamily: 'monospace' }}>
                    <span style={{
                      fontSize: '8px', padding: '1px 5px', borderRadius: '3px',
                      backgroundColor: s.severity === 'high' ? C.failBg : C.warnBg,
                      color: s.severity === 'high' ? C.fail : C.warn,
                      flexShrink: 0,
                    }}>
                      {s.severity === 'high' ? 'alto' : 'med'}
                    </span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <>
              <div style={{ fontSize: '12px', fontWeight: 500, color: C.text }}>{col.val}</div>
              {col.sub && <div style={{ fontSize: '10px', color: C.text2 }}>{col.sub}</div>}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function Zone5Panel({
  shapeId: _shapeId,
  initialState,
  zone1ContextJson = '',
  curvePointsJson = '',
  zone2DataJson = '',
  zone3DataJson = '',
  zone4DataJson = '',
  onStateUpdate,
  onClose,
}: Zone5PanelProps) {
  const [state, setState] = useState<Zone5State>(() => {
    // Init from saved state if available, otherwise build from zone data
    if (initialState.slides.length > 0) return initialState

    const slides = buildSlidesFromZones(curvePointsJson, zone3DataJson, zone4DataJson)
    if (slides.length === 0) return initialState

    const estimated = slides.reduce((sum, s) => sum + s.seconds, 0)
    const fallbackSlides = slides.filter((s) => s.type === 'peak' || s.type === 'transition')
    const fallbackEstimated = fallbackSlides.reduce((sum, s) => sum + s.seconds, 0)
    const { blocked, reason } = computeExportBlocked(slides)

    return {
      ...initialState,
      slides,
      timeControl: {
        ...initialState.timeControl,
        estimatedTotalSeconds: estimated,
        fallbackEstimatedSeconds: fallbackEstimated,
      },
      exportBlocked: blocked,
      exportBlockedReason: reason,
    }
  })

  const [isPacingLoading, setIsPacingLoading] = useState(false)
  const [isPitchLoading, setIsPitchLoading] = useState(false)
  const [canvaToast, setCanvaToast] = useState(false)

  const commit = useCallback((next: Zone5State) => {
    setState(next)
    onStateUpdate(next)
  }, [onStateUpdate])

  // Rebuild when zone3/zone4 data changes externally and we have no slides yet
  useEffect(() => {
    if (state.slides.length > 0) return
    const slides = buildSlidesFromZones(curvePointsJson, zone3DataJson, zone4DataJson)
    if (slides.length === 0) return
    const estimated = slides.reduce((sum, s) => sum + s.seconds, 0)
    const fallbackSlides = slides.filter((s) => s.type === 'peak' || s.type === 'transition')
    const fallbackEstimated = fallbackSlides.reduce((sum, s) => sum + s.seconds, 0)
    const { blocked, reason } = computeExportBlocked(slides)
    commit({
      ...state,
      slides,
      timeControl: {
        ...state.timeControl,
        estimatedTotalSeconds: estimated,
        fallbackEstimatedSeconds: fallbackEstimated,
      },
      exportBlocked: blocked,
      exportBlockedReason: reason,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curvePointsJson, zone3DataJson, zone4DataJson])

  const { slides, timeControl, exportBlocked, exportBlockedReason, selectedSlideIndex } = state
  const { totalAvailableSeconds, estimatedTotalSeconds, fallbackMode, fallbackAvailableSeconds, fallbackEstimatedSeconds } = timeControl

  const availSec = fallbackMode ? fallbackAvailableSeconds : totalAvailableSeconds
  const estimSec = fallbackMode ? fallbackEstimatedSeconds : estimatedTotalSeconds

  const timePct = availSec > 0 ? Math.min((estimSec / availSec) * 100, 110) : 0
  const timeMarginSec = availSec - estimSec
  const timeStatus = timePct > 100 ? 'fail' : timePct > 88 ? 'warn' : 'ok'
  const timeColor = timeStatus === 'fail' ? C.fail : timeStatus === 'warn' ? C.warn : C.pass

  const passCount = slides.filter((s) => s.overallStatus === 'pass').length
  const warnCount = slides.filter((s) => s.overallStatus === 'warning').length
  const failCount = slides.filter((s) => s.overallStatus === 'fail').length
  const pendCount = slides.filter((s) => s.overallStatus === 'pending').length

  const displaySlides = fallbackMode
    ? slides.filter((s) => s.type === 'peak' || s.type === 'transition')
    : slides

  const selectedSlide = displaySlides[selectedSlideIndex] ?? null

  // ── Calculate pacing via AI ────────────────────────────────────────────────
  async function handleCalculatePacing() {
    if (!curvePointsJson || isPacingLoading) return
    setIsPacingLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/zones/zone5/calculate-pacing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curvePoints: JSON.parse(curvePointsJson),
          totalAvailableSeconds: availSec,
          slideCount: slides.length,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { pacing: Array<{ slide: number; seconds: number; pacing: string }> }
      const updatedSlides = slides.map((s) => {
        const p = data.pacing.find((p) => p.slide === s.slide)
        return p ? { ...s, seconds: p.seconds, pacing: p.pacing as 'slow' | 'medium' | 'fast' } : s
      })
      const newEstimated = updatedSlides.reduce((sum, s) => sum + s.seconds, 0)
      const newFallback = updatedSlides
        .filter((s) => s.type === 'peak' || s.type === 'transition')
        .reduce((sum, s) => sum + s.seconds, 0)
      commit({
        ...state,
        slides: updatedSlides,
        timeControl: {
          ...timeControl,
          estimatedTotalSeconds: newEstimated,
          fallbackEstimatedSeconds: newFallback,
        },
      })
    } catch (err) {
      console.error('Pacing error:', err)
    } finally {
      setIsPacingLoading(false)
    }
  }

  // ── Export report ─────────────────────────────────────────────────────────
  async function handleExport() {
    if (slides.length === 0 || isPitchLoading) return
    setIsPitchLoading(true)

    // Parse all zone data
    let zone1 = null
    let curvePoints: ReportData['curvePoints'] = []
    let zone3Slides: ReportData['zone3Slides'] = []
    let zone4Slides: ReportData['zone4Slides'] = []

    try { zone1 = JSON.parse(zone1ContextJson) } catch { /* empty */ }
    try { curvePoints = JSON.parse(curvePointsJson) ?? [] } catch { /* empty */ }
    try {
      const z3 = JSON.parse(zone3DataJson)
      zone3Slides = z3?.slides ?? []
    } catch { /* empty */ }
    try {
      const z4 = JSON.parse(zone4DataJson)
      zone4Slides = z4?.slides ?? []
    } catch { /* empty */ }

    // Parse zone2 for narrativeBrief + presentationTitle
    let narrativeBrief: string | undefined
    let presentationTitle: string | undefined
    try {
      const z2 = zone2DataJson ? JSON.parse(zone2DataJson) : null
      narrativeBrief = z2?.narrativeBrief
      presentationTitle = z2?.presentationTitle
    } catch { /* empty */ }

    // ── Generate narrative pitch via AI ────────────────────────────────────
    let pitchData: PitchData | undefined
    try {
      const pitchResp = await fetch(`${API_BASE}/api/v1/zones/zone5/generate-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboardSlides: slides.map(s => ({
            slide: s.slide,
            label: s.label,
            fullLabel: s.fullLabel,
            type: s.type,
            emotion: s.emotion,
            intensity: s.intensity,
            seconds: s.seconds,
          })),
          zone1Context: zone1 ?? undefined,
          narrativeBrief,
          presentationTitle,
          totalSeconds: estimSec,
        }),
      })
      if (pitchResp.ok) {
        const pitchJson = await pitchResp.json() as { success: boolean; pitch?: PitchData }
        if (pitchJson.success && pitchJson.pitch) {
          pitchData = pitchJson.pitch
        }
      }
    } catch (err) {
      console.warn('[Zone5Panel] pitch generation failed, continuing without it:', err)
    } finally {
      setIsPitchLoading(false)
    }

    const reportData: ReportData = {
      zone1,
      curvePoints,
      zone3Slides,
      zone4Slides,
      storyboardSlides: slides,
      totalAvailableSeconds: availSec,
      estimatedTotalSeconds: estimSec,
      generatedAt: new Date().toISOString(),
      pitchData,
    }

    const html = generateReportHtml(reportData)
    const win = window.open('', '_blank')
    if (!win) {
      // Fallback: download as .html file
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `storyboard-${new Date().toISOString().slice(0, 10)}.html`
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    win.document.write(html)
    win.document.close()
    // Auto-trigger print dialog after a short delay to ensure rendering
    setTimeout(() => win.print(), 600)
  }

  // ── Open Canva ────────────────────────────────────────────────────────────
  function handleExportToCanva() {
    if (slides.length === 0) return
    window.open('https://www.canva.com/create/presentations/', '_blank', 'noopener,noreferrer')
    setCanvaToast(true)
    setTimeout(() => setCanvaToast(false), 6000)
  }

  // ── Toggle fallback mode ───────────────────────────────────────────────────
  function toggleFallback() {
    commit({ ...state, timeControl: { ...timeControl, fallbackMode: !fallbackMode } })
  }

  // ── Select slide ──────────────────────────────────────────────────────────
  function selectSlide(index: number) {
    commit({ ...state, selectedSlideIndex: index })
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bg,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    color: C.text,
    overflow: 'hidden',
  }

  return (
    <div style={panelStyle}>
      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.surface,
        borderBottom: `0.5px solid ${C.border}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: '16px',
      }}>
        {/* Left: zone label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, fontFamily: 'monospace' }}>
            zona 5
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>storyboard</span>
        </div>

        {/* Center: time bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '10px', color: C.text3, fontFamily: 'monospace' }}>tiempo estimado</span>
            <div style={{ width: '200px', height: '6px', backgroundColor: C.surface3, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(timePct, 100)}%`,
                backgroundColor: timeColor,
                borderRadius: '3px',
                transition: 'width 0.4s',
              }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'monospace', color: timeColor }}>
              {formatTime(estimSec)} / {formatTime(availSec)}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: C.text3, fontFamily: 'monospace' }}>
            {timeMarginSec >= 0
              ? `${formatTimeLabel(timeMarginSec)} de margen`
              : `${formatTimeLabel(Math.abs(timeMarginSec))} de exceso`}
          </div>
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleCalculatePacing}
            disabled={isPacingLoading || slides.length === 0}
            style={{
              padding: '5px 12px', borderRadius: '6px',
              fontSize: '11px', fontWeight: 500, cursor: 'pointer',
              border: `0.5px solid ${C.border2}`,
              backgroundColor: 'transparent', color: C.text2,
              opacity: isPacingLoading || slides.length === 0 ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {isPacingLoading ? 'calculando…' : 'calcular ritmo IA'}
          </button>
          <button
            onClick={toggleFallback}
            style={{
              padding: '5px 12px', borderRadius: '6px',
              fontSize: '11px', fontWeight: 500, cursor: 'pointer',
              border: `0.5px solid ${C.border2}`,
              backgroundColor: fallbackMode ? C.text : 'transparent',
              color: fallbackMode ? '#fff' : C.text2,
              fontFamily: 'inherit',
            }}
          >
            versión {fallbackMode ? `${Math.round(fallbackAvailableSeconds / 60)} min ✓` : `${Math.round(fallbackAvailableSeconds / 60)} min`}
          </button>
          <button
            onClick={handleExport}
            disabled={slides.length === 0 || isPitchLoading}
            title={isPitchLoading ? 'Generando pitch narrativo…' : 'Generar guía de diseño descargable'}
            style={{
              padding: '5px 14px', borderRadius: '6px',
              fontSize: '11px', fontWeight: 500,
              cursor: (slides.length === 0 || isPitchLoading) ? 'not-allowed' : 'pointer',
              border: `0.5px solid ${C.border2}`,
              backgroundColor: isPitchLoading ? C.surface2 : 'transparent',
              color: (slides.length === 0 || isPitchLoading) ? C.text3 : C.text2,
              opacity: (slides.length === 0) ? 0.4 : 1,
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {isPitchLoading ? '⏳ generando pitch…' : '📄 guía pdf'}
          </button>
          <button
            onClick={handleExportToCanva}
            disabled={slides.length === 0}
            title="Abrir Canva para crear la presentación"
            style={{
              padding: '5px 14px', borderRadius: '6px',
              fontSize: '11px', fontWeight: 500,
              cursor: slides.length === 0 ? 'not-allowed' : 'pointer',
              border: `0.5px solid ${slides.length === 0 ? C.border2 : C.text}`,
              backgroundColor: slides.length === 0 ? 'transparent' : C.text,
              color: slides.length === 0 ? C.text3 : '#fff',
              opacity: slides.length === 0 ? 0.4 : 1,
              fontFamily: 'inherit',
            }}
          >
            exportar a canva ↗
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '5px 10px', borderRadius: '6px',
              fontSize: '18px', cursor: 'pointer',
              border: 'none', backgroundColor: 'transparent', color: C.text3,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Readiness bar ────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.surface,
        borderBottom: `0.5px solid ${C.border}`,
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
      }}>
        {[
          { count: passCount, color: C.pass, label: 'listo' },
          { count: warnCount, color: C.warn, label: 'alerta' },
          { count: failCount, color: C.fail, label: 'fallo' },
          { count: pendCount, color: C.pending, label: 'pendiente' },
        ].map(({ count, color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontFamily: 'monospace' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
            <span style={{ color: C.text2 }}>{count} {label}</span>
          </div>
        ))}

        {failCount > 0 && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '10px', color: C.warn, fontFamily: 'monospace',
          }}>
            {failCount} slide(s) con issues — revisa antes de exportar
          </div>
        )}
      </div>

      {/* ── Filmstrip ─────────────────────────────────────────────────────── */}
      {displaySlides.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: C.text3,
        }}>
          <div style={{ fontSize: '32px' }}>🎬</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: C.text2 }}>Sin slides en el storyboard</div>
          <div style={{ fontSize: '12px', color: C.text3, textAlign: 'center', maxWidth: '360px', lineHeight: 1.6 }}>
            Completa la Zona 2 (curva emocional), Zona 3 (assets) y Zona 4 (crítico de diseño) para que el storyboard se genere automáticamente.
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}>
          {displaySlides.map((slide, idx) => (
            <SlideCard
              key={slide.slide}
              slide={slide}
              index={idx}
              isActive={idx === selectedSlideIndex}
              fallbackMode={fallbackMode}
              onClick={() => selectSlide(idx)}
            />
          ))}
        </div>
      )}

      {/* ── Detail panel ──────────────────────────────────────────────────── */}
      <DetailPanel slide={selectedSlide} />

      {/* ── Canva toast ───────────────────────────────────────────────────── */}
      {canvaToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: C.text, color: '#fff',
          borderRadius: 10, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: '12px', fontFamily: 'monospace',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          zIndex: 2000, maxWidth: 480,
          animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ fontSize: 18 }}>🎨</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 600 }}>Canva abierto en nueva pestaña</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>
              Usa la guía PDF (📄 guía pdf) como referencia para crear tus {slides.length} slides
            </span>
          </div>
          <button
            onClick={() => setCanvaToast(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16, padding: 0, marginLeft: 4 }}
          >×</button>
        </div>
      )}
    </div>
  )
}
