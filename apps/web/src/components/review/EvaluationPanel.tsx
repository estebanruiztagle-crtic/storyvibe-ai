'use client'

import { useState, useCallback } from 'react'
import { Sparkles, Check, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store'
import type { ReviewResult } from '@/store/slices/review'

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

export default function EvaluationPanel() {
  const context = useAppStore((s) => s.context)
  const narrative = useAppStore((s) => s.narrative)
  const design = useAppStore((s) => s.design)
  const review = useAppStore((s) => s.review)
  const setReview = useAppStore((s) => s.setReview)
  const reviewLoading = useAppStore((s) => s.reviewLoading)
  const setReviewLoading = useAppStore((s) => s.setReviewLoading)

  const [activeSlide, setActiveSlide] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const slides = design.slides

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

  const activeScore = review?.slideScores[activeSlide]
  const slideStatus = (composite: number): SlideStatus =>
    composite >= 7 ? 'pass' : composite >= 5 ? 'warning' : 'fail'

  return (
    <div className="flex flex-col gap-5">
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

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {slides.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          <p className="text-sm">Sin láminas para evaluar</p>
          <p className="text-xs mt-1">Completa el paso de Diseño primero</p>
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
            <span className="text-xs">
              {review.slideScores.filter((s) => s.composite >= 7).length}/{review.slideScores.length} slides ok
            </span>
          </div>

          {/* Slide list */}
          <div className="flex gap-4" style={{ minHeight: 400 }}>
            {/* Sidebar */}
            <div className="w-[200px] shrink-0 rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto py-1">
                {review.slideScores.map((score, i) => {
                  const st = slideStatus(score.composite)
                  const isActive = i === activeSlide
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs transition-colors ${
                        isActive ? 'bg-neutral-100 font-semibold text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                        st === 'pass' ? 'bg-emerald-500' : st === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      <span className="text-[10px] text-neutral-400 w-4 shrink-0">{score.slide}</span>
                      <span className="truncate flex-1">{slides[i]?.label ?? `Slide ${score.slide}`}</span>
                      <span className="text-[10px] font-semibold">{score.composite.toFixed(1)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Detail */}
            {activeScore && (
              <div className="flex-1 flex flex-col gap-4">
                {/* Score header */}
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${
                    activeScore.composite >= 7 ? 'text-emerald-600' : activeScore.composite >= 5 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {activeScore.composite.toFixed(1)}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          activeScore.composite >= 7 ? 'bg-emerald-500' : activeScore.composite >= 5 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${(activeScore.composite / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">0.40 x brand + 0.35 x cognitiva + 0.25 x emocional</p>
                  </div>
                </div>

                {/* Axis scores */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Brand compliance', score: activeScore.brand, weight: '40%' },
                    { label: 'Carga cognitiva', score: activeScore.cognitive, weight: '35%' },
                    { label: 'Alineación emocional', score: activeScore.emotional, weight: '25%' },
                  ].map((axis) => (
                    <div key={axis.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{axis.label}</span>
                        <span className="text-[10px] text-neutral-300">{axis.weight}</span>
                      </div>
                      <div className={`text-2xl font-bold ${
                        axis.score >= 7 ? 'text-emerald-600' : axis.score >= 5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {axis.score.toFixed(1)}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
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
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Sugerencias</div>
                    <ul className="flex flex-col gap-2">
                      {activeScore.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-400" />
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
                  <span className="flex items-center text-xs text-neutral-400">{activeSlide + 1} / {review.slideScores.length}</span>
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
    </div>
  )
}
