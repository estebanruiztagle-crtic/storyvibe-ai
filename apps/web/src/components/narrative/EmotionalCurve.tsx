'use client'

import { useState } from 'react'
import { Sparkles, RotateCcw, ArrowRight } from 'lucide-react'
import type { Zone2State, CurvePoint, DesignStyle, VisualMood } from '@/components/zones/zone2/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TYPE_COLORS: Record<string, string> = { peak: '#10b981', valley: '#3b82f6', transition: '#f59e0b' }

const EMOTIONS: Record<string, string[]> = {
  peak:       ['curiosidad', 'excitación', 'confianza', 'alegría', 'orgullo', 'asombro'],
  valley:     ['atención fría', 'análisis', 'incomodidad', 'tensión', 'escepticismo'],
  transition: ['esperanza', 'alivio', 'reflexión', 'anticipación'],
}

const DESIGN_STYLES: { value: DesignStyle; label: string }[] = [
  { value: 'hero', label: 'Hero' }, { value: 'data', label: 'Data' }, { value: 'quote', label: 'Cita' },
  { value: 'list', label: 'Lista' }, { value: 'image', label: 'Imagen' }, { value: 'comparison', label: 'Comparación' },
  { value: 'split', label: 'Split' }, { value: 'timeline', label: 'Timeline' },
]
const VISUAL_MOODS: { value: VisualMood; label: string }[] = [
  { value: 'dark_bold', label: 'Oscuro' }, { value: 'light_clean', label: 'Claro' },
  { value: 'data_heavy', label: 'Datos' }, { value: 'conceptual', label: 'Conceptual' },
  { value: 'emotional', label: 'Emocional' }, { value: 'neutral', label: 'Neutral' },
]

interface Props {
  state: Zone2State
  projectId: string
  context: Record<string, unknown>
  onChange: (s: Zone2State) => void
  onApproved: () => void
}

export default function EmotionalCurve({ state, projectId, context, onChange, onApproved }: Props) {
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const { curvePoints, curveStatus } = state

  const selectedFw = state.frameworks.find((f) => f.id === state.selectedFrameworkId)

  const generate = async () => {
    if (!selectedFw) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone2/generate-curve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: projectId,
          framework: selectedFw,
          topics: state.topics.filter((t) => t.selected),
          zone1Context: context,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) {
        onChange({
          ...state,
          curvePoints: data.curvePoints,
          curveStatus: 'draft',
          curveVersion: state.curveVersion + 1,
          narrativeBrief: data.narrativeBrief ?? state.narrativeBrief,
          presentationTitle: data.presentationTitle ?? state.presentationTitle,
        })
        setActive(0)
      }
    } catch (err) { console.error('generate-curve:', err) }
    finally { setLoading(false) }
  }

  const update = (i: number, changes: Partial<CurvePoint>) => {
    onChange({
      ...state,
      curvePoints: curvePoints.map((p, idx) => idx === i ? { ...p, ...changes, modified: true } : p),
    })
  }

  const reset = (i: number) => {
    const p = curvePoints[i]
    update(i, { type: p.systemType, emotion: p.systemEmotion, intensity: p.systemIntensity, modified: false })
  }

  const approve = () => {
    onChange({ ...state, curveStatus: 'approved' })
    onApproved()
  }

  const pt = curvePoints[active]

  // Metrics
  const peaks = curvePoints.filter((p) => p.type === 'peak').length
  const valleys = curvePoints.filter((p) => p.type === 'valley').length
  const avgInt = curvePoints.length > 0
    ? (curvePoints.reduce((s, p) => s + p.intensity, 0) / curvePoints.length).toFixed(1)
    : '0'

  // No curve yet
  if (curvePoints.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="text-4xl">📈</div>
        <div>
          <div className="text-sm font-semibold text-neutral-800">
            {selectedFw ? `Framework: ${selectedFw.name}` : 'Selecciona un framework primero'}
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            La curva emocional define la intensidad y emoción de cada slide.
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !selectedFw}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          <Sparkles size={14} />
          {loading ? 'Generando...' : 'Generar curva emocional'}
        </button>
      </div>
    )
  }

  // Approved view
  if (curveStatus === 'approved') {
    const totalSecs = curvePoints.reduce((s, p) => s + (p.durationSeconds ?? 0), 0)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-2xl">✓</div>
          <div>
            <div className="text-sm font-bold text-neutral-800">Arco narrativo aprobado</div>
            <div className="text-xs text-emerald-700">
              {curvePoints.length} slides · {Math.round(totalSecs / 60)} min · v{state.curveVersion}
            </div>
          </div>
        </div>
        {state.narrativeBrief && (
          <div className="rounded-xl border border-neutral-100 bg-white p-4">
            {state.presentationTitle && <div className="mb-1 text-sm font-bold text-neutral-800">"{state.presentationTitle}"</div>}
            <p className="text-xs leading-relaxed text-neutral-500">{state.narrativeBrief}</p>
          </div>
        )}
        {/* Slide contract table */}
        <div className="rounded-xl border border-neutral-100 bg-white overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Contrato de diseño</div>
          </div>
          <div className="divide-y divide-neutral-50">
            {curvePoints.map((p) => (
              <div key={p.slide} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[p.type] }}>
                  {p.slide}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-800 truncate">{p.suggestedTitle || p.label}</div>
                </div>
                <span className="text-[10px] font-semibold" style={{ color: TYPE_COLORS[p.type] }}>{p.emotion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Editor view
  return (
    <div className="flex flex-col gap-4">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Picos', val: peaks, color: TYPE_COLORS.peak },
          { label: 'Valles', val: valleys, color: TYPE_COLORS.valley },
          { label: 'Intensidad ø', val: avgInt, color: '#1a1a18' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-neutral-100 bg-white p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{m.label}</div>
            <div className="text-xl font-bold" style={{ color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* SVG Curve */}
      <div className="rounded-xl border border-neutral-100 bg-white p-4">
        <CurveChart points={curvePoints} active={active} onSelect={setActive} />
      </div>

      {/* Slide pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {curvePoints.map((p, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-center transition-all min-w-[56px] ${
              i === active ? 'border-neutral-300 bg-neutral-100' : 'border-neutral-100 bg-white hover:bg-neutral-50'
            }`}
          >
            <div className="text-[10px] font-bold text-neutral-400">{p.slide}</div>
            <div className="mx-auto my-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[p.type] }} />
            <div className="text-[9px] text-neutral-500 truncate max-w-[52px]">{p.label}</div>
          </button>
        ))}
      </div>

      {/* Active point editor */}
      {pt && (
        <div className="rounded-xl border border-neutral-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-neutral-800">Slide {pt.slide} — {pt.fullLabel || pt.label}</div>
            {pt.modified && (
              <button onClick={() => reset(active)} className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600">
                <RotateCcw size={10} /> restaurar
              </button>
            )}
          </div>

          {/* Type + emotion */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Tipo</div>
              <div className="flex gap-1.5">
                {(['peak', 'valley', 'transition'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => update(active, { type: t, emotion: EMOTIONS[t][0] ?? pt.emotion })}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: pt.type === t ? TYPE_COLORS[t] + '22' : '#f5f5f4',
                      color: pt.type === t ? TYPE_COLORS[t] : '#a3a3a3',
                      border: `1.5px solid ${pt.type === t ? TYPE_COLORS[t] : 'transparent'}`,
                    }}
                  >
                    {t === 'peak' ? '▲ pico' : t === 'valley' ? '▼ valle' : '→ trans'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Emoción</div>
              <select
                value={pt.emotion}
                onChange={(e) => update(active, { emotion: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 outline-none"
              >
                {(EMOTIONS[pt.type] ?? []).map((em) => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
          </div>

          {/* Intensity */}
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              <span>Intensidad</span>
              <span className="text-sm font-bold" style={{ color: TYPE_COLORS[pt.type] }}>{pt.intensity}</span>
            </div>
            <input type="range" min={1} max={10} value={pt.intensity}
              onChange={(e) => update(active, { intensity: Number(e.target.value) })}
              className="w-full accent-neutral-900" />
          </div>

          {/* Design contract */}
          <div className="border-t border-neutral-100 pt-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-500">Contrato de diseño</div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={pt.suggestedTitle ?? ''}
                onChange={(e) => update(active, { suggestedTitle: e.target.value })}
                placeholder="Título de la slide…"
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-neutral-400"
              />
              <textarea
                value={pt.contentDirection ?? ''}
                onChange={(e) => update(active, { contentDirection: e.target.value })}
                placeholder="¿Qué comunica esta slide?"
                rows={2}
                className="resize-none rounded-lg border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-neutral-400"
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={pt.designStyle ?? ''} onChange={(e) => update(active, { designStyle: e.target.value as DesignStyle })}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] outline-none">
                  <option value="">Estilo…</option>
                  {DESIGN_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={pt.visualMood ?? ''} onChange={(e) => update(active, { visualMood: e.target.value as VisualMood })}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] outline-none">
                  <option value="">Mood…</option>
                  {VISUAL_MOODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {pt.speakerNotes && (
                <div className="rounded-lg bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500">{pt.speakerNotes}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve */}
      <button
        onClick={approve}
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Aprobar arco narrativo <ArrowRight size={14} />
      </button>
    </div>
  )
}

// ─── SVG Chart ───────────────────────────────────────────────────────────────
function CurveChart({ points, active, onSelect }: { points: CurvePoint[]; active: number; onSelect: (i: number) => void }) {
  const W = 580, H = 180, PX = 32, PY = 16
  const cW = W - PX * 2, cH = H - PY * 2
  const x = (i: number) => PX + (i / Math.max(points.length - 1, 1)) * cW
  const y = (v: number) => PY + cH - ((v - 1) / 9) * cH

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {[1, 5, 10].map((v) => (
        <line key={v} x1={PX} y1={y(v)} x2={W - PX} y2={y(v)} stroke="#e5e5e5" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      {points.slice(1).map((_, i) => (
        <line key={i} x1={x(i)} y1={y(points[i].intensity)} x2={x(i + 1)} y2={y(points[i + 1].intensity)}
          stroke={TYPE_COLORS[points[i].type]} strokeWidth="2.5" strokeLinecap="round" />
      ))}
      {points.map((p, i) => (
        <g key={i} style={{ cursor: 'pointer' }} onClick={() => onSelect(i)}>
          <circle cx={x(i)} cy={y(p.intensity)} r={i === active ? 7 : 5}
            fill={i === active ? 'white' : TYPE_COLORS[p.type]}
            stroke={TYPE_COLORS[p.type]} strokeWidth={i === active ? 2.5 : 1.5} />
        </g>
      ))}
      {points.map((p, i) => (
        <text key={i} x={x(i)} y={H - 2} textAnchor="middle" fontSize="9" fill="#a3a3a3">{p.slide}</text>
      ))}
    </svg>
  )
}
