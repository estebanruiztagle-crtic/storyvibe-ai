'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Check, AlertTriangle, XCircle,
  ChevronLeft, ChevronRight, Wand2, TrendingUp,
  ArrowRight, CheckCheck, RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useAppStore } from '@/store'
import type { ReviewResult, SlideRedesign } from '@/store/slices/review'
import type { DesignStyle, VisualMood } from '@/components/zones/zone2/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type SlideStatus = 'pass' | 'warning' | 'fail' | 'pending'

function statusStyle(s: SlideStatus) {
  if (s === 'pass') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (s === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (s === 'fail') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-neutral-50 text-neutral-400 border-neutral-200'
}
function statusIcon(s: SlideStatus) {
  if (s === 'pass') return <Check size={12} />
  if (s === 'warning') return <AlertTriangle size={12} />
  if (s === 'fail') return <XCircle size={12} />
  return null
}
function statusLabel(s: SlideStatus) {
  if (s === 'pass') return 'ok'
  if (s === 'warning') return 'alerta'
  if (s === 'fail') return 'fallo'
  return 'pendiente'
}
function slideStatus(composite: number): SlideStatus {
  if (composite >= 7) return 'pass'
  if (composite >= 5) return 'warning'
  return 'fail'
}

const DESIGN_STYLE_LABELS: Record<string, string> = {
  hero: 'Hero', data: 'Data', quote: 'Cita', list: 'Lista',
  image: 'Imagen', comparison: 'Comparación', split: 'Split', timeline: 'Timeline',
}
const VISUAL_MOOD_LABELS: Record<string, string> = {
  dark_bold: 'Oscuro / Bold', light_clean: 'Claro / Limpio',
  data_heavy: 'Data Heavy', conceptual: 'Conceptual',
  emotional: 'Emocional', neutral: 'Neutral',
}
const TYPE_LABELS: Record<string, string> = {
  peak: 'Pico', valley: 'Valle', transition: 'Transición',
}

// ── Redesign Card ──────────────────────────────────────────────────────────────
function RedesignCard({
  redesign,
  onToggle,
}: {
  redesign: SlideRedesign
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const improvement = redesign.projectedScore - redesign.currentScore
  const hasChanges = Object.keys(redesign.changes).length > 0

  return (
    <motion.div
      layout
      className={`rounded-xl border transition-all ${
        redesign.accepted
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-neutral-200 bg-white'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        {/* Accept toggle */}
        <button
          onClick={onToggle}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            redesign.accepted
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-neutral-300 bg-white text-transparent hover:border-neutral-400'
          }`}
        >
          <Check size={12} />
        </button>

        {/* Slide info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-400">
              SLIDE {redesign.slide}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${slideStatus(redesign.currentScore) === 'fail' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
            >
              {redesign.currentScore.toFixed(1)}
            </span>
            <ArrowRight size={10} className="text-neutral-300" />
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
              {redesign.projectedScore.toFixed(1)}
            </span>
            {improvement > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600">
                <TrendingUp size={9} />+{improvement.toFixed(1)}
              </span>
            )}
          </div>
          <p className="truncate text-xs font-semibold text-neutral-700">{redesign.label}</p>
        </div>

        {/* Expand toggle */}
        {hasChanges && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && hasChanges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-neutral-100"
          >
            <div className="p-3 pt-2">
              {/* Changes grid */}
              <div className="mb-3 grid grid-cols-2 gap-2">
                {redesign.changes.type && (
                  <div className="rounded-lg bg-neutral-50 p-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Tipo</p>
                    <p className="text-xs font-semibold text-neutral-700">
                      {TYPE_LABELS[redesign.changes.type] ?? redesign.changes.type}
                    </p>
                  </div>
                )}
                {redesign.changes.emotion && (
                  <div className="rounded-lg bg-neutral-50 p-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Emoción</p>
                    <p className="text-xs font-semibold capitalize text-neutral-700">{redesign.changes.emotion}</p>
                  </div>
                )}
                {redesign.changes.intensity !== undefined && (
                  <div className="rounded-lg bg-neutral-50 p-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Intensidad</p>
                    <p className="text-xs font-semibold text-neutral-700">{redesign.changes.intensity}/10</p>
                  </div>
                )}
                {redesign.changes.designStyle && (
                  <div className="rounded-lg bg-neutral-50 p-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Layout</p>
                    <p className="text-xs font-semibold text-neutral-700">
                      {DESIGN_STYLE_LABELS[redesign.changes.designStyle] ?? redesign.changes.designStyle}
                    </p>
                  </div>
                )}
                {redesign.changes.visualMood && (
                  <div className="rounded-lg bg-neutral-50 p-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Mood visual</p>
                    <p className="text-xs font-semibold text-neutral-700">
                      {VISUAL_MOOD_LABELS[redesign.changes.visualMood] ?? redesign.changes.visualMood}
                    </p>
                  </div>
                )}
              </div>

              {/* Content direction */}
              {redesign.changes.contentDirection && (
                <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-2">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-blue-400">Dirección de contenido</p>
                  <p className="text-xs text-blue-700">{redesign.changes.contentDirection}</p>
                </div>
              )}

              {/* Suggested title */}
              {redesign.changes.suggestedTitle && (
                <div className="mb-3 rounded-lg border border-violet-100 bg-violet-50 p-2">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-violet-400">Título sugerido</p>
                  <p className="text-xs font-semibold text-violet-700">"{redesign.changes.suggestedTitle}"</p>
                </div>
              )}

              {/* Rationale */}
              <p className="text-[10px] italic text-neutral-500">{redesign.rationale}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function EvaluationPanel() {
  const context = useAppStore((s) => s.context)
  const narrative = useAppStore((s) => s.narrative)
  const design = useAppStore((s) => s.design)
  const review = useAppStore((s) => s.review)
  const redesign = useAppStore((s) => s.redesign)
  const redesignApplied = useAppStore((s) => s.redesignApplied)
  const reviewLoading = useAppStore((s) => s.reviewLoading)
  const redesignLoading = useAppStore((s) => s.redesignLoading)

  const setReview = useAppStore((s) => s.setReview)
  const setReviewLoading = useAppStore((s) => s.setReviewLoading)
  const setRedesign = useAppStore((s) => s.setRedesign)
  const setRedesignLoading = useAppStore((s) => s.setRedesignLoading)
  const toggleRedesignAccepted = useAppStore((s) => s.toggleRedesignAccepted)
  const acceptAllRedesigns = useAppStore((s) => s.acceptAllRedesigns)
  const setRedesignApplied = useAppStore((s) => s.setRedesignApplied)
  const patchNarrative = useAppStore((s) => s.patchNarrative)

  const [activeSlide, setActiveSlide] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'evaluation' | 'redesign'>('evaluation')

  const slides = design.slides

  // ── Evaluate ──────────────────────────────────────────────────────────────
  const handleEvaluate = useCallback(async () => {
    if (slides.length === 0) return
    setReviewLoading(true)
    setError(null)

    try {
      const slideScores: ReviewResult['slideScores'] = []

      for (let i = 0; i < slides.length; i++) {
        setActiveSlide(i)
        const slide = slides[i]!

        const res = await fetch(`${API}/api/v1/zones/zone4/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slideReview: {
              slide: slide.slide,
              label: slide.label,
              fullLabel: slide.fullLabel,
              type: slide.type,
              emotion: slide.emotion,
              intensity: slide.intensity,
              globalScore: null,
              globalStatus: 'pending',
              snapshot: null,
              axes: null,
              suggestions: [],
              mockBg: `linear-gradient(135deg, #1a1208 0%, #2d1a0a 100%)`,
              evaluated: false,
            },
            zone1ContextJson: JSON.stringify(context),
            curvePointsJson: JSON.stringify(narrative.curvePoints),
            brandLayerJson: JSON.stringify(context),
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `Error del servidor (${res.status}) en slide ${slide.slide}`)

        if (data.success && data.updatedSlide) {
          const u = data.updatedSlide
          slideScores.push({
            slide: slide.slide,
            brand: u.axes?.brand?.score ?? 0,
            cognitive: u.axes?.cognitive?.score ?? 0,
            emotional: u.axes?.emotional?.score ?? 0,
            composite: u.globalScore ?? 0,
            suggestions: u.suggestions?.map((s: { problem: string }) => s.problem) ?? [],
          })
        }
      }

      const worstComposite = Math.min(...slideScores.map((s) => s.composite))
      const overallStatus: ReviewResult['overallStatus'] =
        worstComposite >= 7 ? 'pass' : worstComposite >= 5 ? 'warning' : 'fail'

      setReview({ slideScores, overallStatus })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setReviewLoading(false)
    }
  }, [slides, context, narrative.curvePoints, setReview, setReviewLoading])

  // ── Redesign ──────────────────────────────────────────────────────────────
  const handleRedesign = useCallback(async () => {
    if (!review) return
    setRedesignLoading(true)
    setError(null)

    try {
      // Enrich slide scores with curve point data
      const enrichedScores = review.slideScores.map((score) => {
        const curvePoint = narrative.curvePoints.find((p) => p.slide === score.slide)
        return {
          ...score,
          label: curvePoint?.label ?? `Slide ${score.slide}`,
          type: curvePoint?.type,
          emotion: curvePoint?.emotion,
          intensity: curvePoint?.intensity,
        }
      })

      const res = await fetch(`${API}/api/v1/zones/zone4/redesign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideScores: enrichedScores,
          curvePoints: narrative.curvePoints,
          zone1ContextJson: JSON.stringify(context),
          presentationTitle: narrative.presentationTitle ?? 'Sin título',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error del servidor (${res.status})`)
      if (!data.success) throw new Error(data.error ?? 'Error en el rediseño')

      setRedesign(data.redesign)
      setView('redesign')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setRedesignLoading(false)
    }
  }, [review, narrative, context, setRedesign, setRedesignLoading])

  // ── Apply redesign to narrative curve ────────────────────────────────────
  const handleApplyRedesign = useCallback(() => {
    if (!redesign) return

    const acceptedSlides = new Set(
      redesign.slideRedesigns.filter((r) => r.accepted).map((r) => r.slide)
    )

    if (acceptedSlides.size === 0) {
      setError('Selecciona al menos un slide para aplicar el rediseño.')
      return
    }

    // Merge accepted redesigns into the narrative curve
    const updatedCurvePoints = narrative.curvePoints.map((point) => {
      if (!acceptedSlides.has(point.slide)) return point
      const redesignedPoint = redesign.redesignedCurvePoints.find(
        (r) => r.slide === point.slide
      )
      if (!redesignedPoint) return point
      return {
        ...point,
        type: redesignedPoint.type ?? point.type,
        emotion: redesignedPoint.emotion ?? point.emotion,
        intensity: redesignedPoint.intensity ?? point.intensity,
        suggestedTitle: redesignedPoint.suggestedTitle ?? point.suggestedTitle,
        contentDirection: redesignedPoint.contentDirection ?? point.contentDirection,
        designStyle: (redesignedPoint.designStyle as DesignStyle | undefined) ?? point.designStyle,
        visualMood: (redesignedPoint.visualMood as VisualMood | undefined) ?? point.visualMood,
        modified: true,
      }
    })

    patchNarrative({ curvePoints: updatedCurvePoints })
    setRedesignApplied(true)
    setError(null)
  }, [redesign, narrative.curvePoints, patchNarrative, setRedesignApplied])

  const activeScore = review?.slideScores[activeSlide]
  const acceptedCount = redesign?.slideRedesigns.filter((r) => r.accepted).length ?? 0
  const needsRedesign = review && (review.overallStatus === 'fail' || review.overallStatus === 'warning')
  const avgScore = review
    ? review.slideScores.reduce((a, s) => a + s.composite, 0) / review.slideScores.length
    : 0
  const projectedAvg = redesign
    ? redesign.slideRedesigns
        .filter((r) => r.accepted)
        .reduce((a, r) => a + r.projectedScore, 0) /
        Math.max(redesign.slideRedesigns.filter((r) => r.accepted).length, 1)
    : 0

  return (
    <div className="flex flex-col gap-5">

      {/* ── Tab Nav (evaluation / redesign) ── */}
      {review && (
        <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
          <button
            onClick={() => setView('evaluation')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              view === 'evaluation'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Sparkles size={12} /> Evaluación
          </button>
          <button
            onClick={() => setView('redesign')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              view === 'redesign'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Wand2 size={12} /> Rediseño
            {redesign && (
              <span className="ml-1 rounded-full bg-violet-100 px-1.5 text-[9px] font-bold text-violet-700">
                {redesign.slideRedesigns.length}
              </span>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          VIEW: EVALUATION
         ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'evaluation' && (
        <>
          {/* Evaluate button */}
          <button
            onClick={handleEvaluate}
            disabled={reviewLoading || slides.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {reviewLoading
              ? `Evaluando slide ${activeSlide + 1} de ${slides.length}...`
              : review
                ? 'Re-evaluar todas las láminas'
                : 'Evaluar todas con IA'}
          </button>

          {slides.length === 0 && (
            <div className="py-12 text-center text-neutral-400">
              <p className="text-sm">Sin láminas para evaluar</p>
              <p className="mt-1 text-xs">Completa el paso de Diseño primero</p>
            </div>
          )}

          {/* Results */}
          {review && (
            <>
              {/* Overall status */}
              <div className={`flex items-center justify-between rounded-xl border p-4 ${statusStyle(review.overallStatus)}`}>
                <div className="flex items-center gap-2">
                  {statusIcon(review.overallStatus)}
                  <span className="text-sm font-semibold">
                    Estado general: {statusLabel(review.overallStatus)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs">
                    {review.slideScores.filter((s) => s.composite >= 7).length}/{review.slideScores.length} slides ok
                  </span>
                  <span className="text-xs font-bold">Promedio: {avgScore.toFixed(1)}/10</span>
                </div>
              </div>

              {/* Redesign CTA — shown when there are issues */}
              {needsRedesign && !redesignApplied && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4"
                >
                  <div className="mb-3 flex items-start gap-2">
                    <Wand2 size={16} className="mt-0.5 shrink-0 text-violet-600" />
                    <div>
                      <p className="text-sm font-semibold text-violet-900">
                        La curva narrativa puede optimizarse
                      </p>
                      <p className="mt-0.5 text-xs text-violet-600">
                        {review.slideScores.filter((s) => s.composite < 7).length} láminas tienen oportunidades de mejora. El agente de rediseño analizará el sistema completo y propondrá cambios para maximizar el impacto narrativo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRedesign}
                    disabled={redesignLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-700 py-2.5 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
                  >
                    <Wand2 size={13} />
                    {redesignLoading
                      ? 'Analizando curva narrativa...'
                      : 'Rediseñar curva narrativa con IA'}
                  </button>
                </motion.div>
              )}

              {redesignApplied && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                >
                  <CheckCheck size={14} className="text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-700">
                    Rediseño aplicado a la curva narrativa — {acceptedCount} láminas actualizadas
                  </p>
                  <button
                    onClick={() => setView('redesign')}
                    className="ml-auto text-xs font-semibold text-emerald-600 underline hover:no-underline"
                  >
                    Ver detalle
                  </button>
                </motion.div>
              )}

              {/* Slide list */}
              <div className="flex gap-4" style={{ minHeight: 400 }}>
                {/* Sidebar */}
                <div className="flex w-[200px] shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <div className="flex-1 overflow-y-auto py-1">
                    {review.slideScores.map((score, i) => {
                      const st = slideStatus(score.composite)
                      const isActive = i === activeSlide
                      const hasRedesign = redesign?.slideRedesigns.some(
                        (r) => r.slide === score.slide && r.accepted
                      )
                      return (
                        <div
                          key={i}
                          onClick={() => setActiveSlide(i)}
                          className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors ${
                            isActive
                              ? 'bg-neutral-100 font-semibold text-neutral-900'
                              : 'text-neutral-500 hover:bg-neutral-50'
                          }`}
                        >
                          <div className={`h-2 w-2 shrink-0 rounded-full ${
                            st === 'pass' ? 'bg-emerald-500' : st === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                          }`} />
                          <span className="w-4 shrink-0 text-[10px] text-neutral-400">{score.slide}</span>
                          <span className="flex-1 truncate">{slides[i]?.label ?? `Slide ${score.slide}`}</span>
                          <div className="flex items-center gap-1">
                            {hasRedesign && <Wand2 size={8} className="text-violet-500" />}
                            <span className="text-[10px] font-semibold">{score.composite.toFixed(1)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Detail panel */}
                {activeScore && (
                  <div className="flex flex-1 flex-col gap-4">
                    {/* Score header */}
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl font-bold ${
                        activeScore.composite >= 7 ? 'text-emerald-600' : activeScore.composite >= 5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {activeScore.composite.toFixed(1)}
                      </div>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              activeScore.composite >= 7 ? 'bg-emerald-500' : activeScore.composite >= 5 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${(activeScore.composite / 10) * 100}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-neutral-400">
                          0.40 × brand + 0.35 × cognitiva + 0.25 × emocional
                        </p>
                      </div>
                    </div>

                    {/* Axis scores */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Brand', score: activeScore.brand, weight: '40%' },
                        { label: 'Cognitiva', score: activeScore.cognitive, weight: '35%' },
                        { label: 'Emocional', score: activeScore.emotional, weight: '25%' },
                      ].map((axis) => (
                        <div key={axis.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                              {axis.label}
                            </span>
                            <span className="text-[10px] text-neutral-300">{axis.weight}</span>
                          </div>
                          <div className={`text-2xl font-bold ${
                            axis.score >= 7 ? 'text-emerald-600' : axis.score >= 5 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {axis.score.toFixed(1)}
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                            <div
                              className={`h-full rounded-full ${
                                axis.score >= 7 ? 'bg-emerald-500' : axis.score >= 5 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${(axis.score / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Suggestions */}
                    {activeScore.suggestions.length > 0 && (
                      <div className="rounded-xl border border-neutral-200 bg-white p-4">
                        <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Sugerencias
                        </div>
                        <ul className="flex flex-col gap-2">
                          {activeScore.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-400" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Nav */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setActiveSlide((i) => Math.max(0, i - 1))}
                        disabled={activeSlide === 0}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-200 py-2 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
                      >
                        <ChevronLeft size={14} /> Anterior
                      </button>
                      <span className="flex items-center text-xs text-neutral-400">
                        {activeSlide + 1} / {review.slideScores.length}
                      </span>
                      <button
                        onClick={() => setActiveSlide((i) => Math.min(review.slideScores.length - 1, i + 1))}
                        disabled={activeSlide === review.slideScores.length - 1}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-200 py-2 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
                      >
                        Siguiente <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          VIEW: REDESIGN
         ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'redesign' && (
        <>
          {!redesign && !redesignLoading && (
            <div className="py-12 text-center text-neutral-400">
              <Wand2 size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Primero evalúa las láminas</p>
              <p className="mt-1 text-xs">El rediseño automático requiere los resultados de evaluación</p>
              <button
                onClick={() => setView('evaluation')}
                className="mt-4 rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Ir a evaluación
              </button>
            </div>
          )}

          {redesignLoading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-violet-500"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-neutral-700">Analizando la curva narrativa…</p>
              <p className="text-xs text-neutral-400">El agente está identificando los problemas sistémicos</p>
            </div>
          )}

          {redesign && !redesignLoading && (
            <div className="flex flex-col gap-4">
              {/* Summary header */}
              <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Wand2 size={14} className="text-violet-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-600">
                    Propuesta de Rediseño
                  </span>
                  <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                    +{redesign.globalImprovementScore}% mejora proyectada
                  </span>
                </div>
                <p className="text-xs text-violet-800">{redesign.narrativeSummary}</p>

                {/* Main issues */}
                {redesign.mainIssues?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {redesign.mainIssues.map((issue, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] text-violet-700"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Score projection */}
              {acceptedCount > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <TrendingUp size={14} className="shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                      <span>Promedio actual: {avgScore.toFixed(1)}</span>
                      <ArrowRight size={10} />
                      <span>Proyectado: {projectedAvg.toFixed(1)}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-emerald-600">
                      {acceptedCount} de {redesign.slideRedesigns.length} slides seleccionados
                    </p>
                  </div>
                </div>
              )}

              {/* Accept all / reset controls */}
              <div className="flex gap-2">
                <button
                  onClick={acceptAllRedesigns}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  <CheckCheck size={12} /> Aceptar todos
                </button>
                <button
                  onClick={() => {
                    // Reset all accepted
                    if (redesign) {
                      const updated = {
                        ...redesign,
                        slideRedesigns: redesign.slideRedesigns.map((r) => ({
                          ...r,
                          accepted: false,
                        })),
                      }
                      setRedesign(updated)
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 py-2 px-3 text-xs font-semibold text-neutral-500 hover:bg-neutral-50"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              {/* Redesign cards */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Láminas a rediseñar ({redesign.slideRedesigns.length})
                </p>
                {redesign.slideRedesigns.map((r) => (
                  <RedesignCard
                    key={r.slide}
                    redesign={r}
                    onToggle={() => toggleRedesignAccepted(r.slide)}
                  />
                ))}
              </div>

              {/* Apply button */}
              <button
                onClick={handleApplyRedesign}
                disabled={acceptedCount === 0 || redesignApplied}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                {redesignApplied ? (
                  <>
                    <CheckCheck size={14} />
                    Rediseño aplicado ({acceptedCount} láminas)
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Aplicar rediseño ({acceptedCount} seleccionadas)
                  </>
                )}
              </button>

              {redesignApplied && (
                <p className="text-center text-xs text-neutral-500">
                  La curva narrativa fue actualizada. Puedes volver al paso de{' '}
                  <strong>Diseño</strong> para ver los cambios aplicados o continuar al{' '}
                  <strong>Export</strong>.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
