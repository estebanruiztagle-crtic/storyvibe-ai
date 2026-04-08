'use client'

import { useState, useCallback } from 'react'
import type {
  Zone2State,
  Zone2Tab,
  Topic,
  AuthorPattern,
  StorytellingFramework,
  CurvePoint,
  DesignStyle,
  VisualMood,
} from './types'
import { EMPTY_ZONE2 } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Zone2PanelProps {
  shapeId: string
  initialState: Zone2State
  zone1ContextJson?: string
  onStateUpdate: (state: Zone2State) => void
  onClose: () => void
  onCurveApproved?: (curvePoints: CurvePoint[]) => void
}

// ─── Emotion lists ────────────────────────────────────────────────────────────
const EMOTIONS: Record<'peak' | 'valley' | 'transition', string[]> = {
  peak:       ['curiosidad', 'excitación', 'confianza', 'alegría', 'orgullo', 'asombro'],
  valley:     ['atención fría', 'análisis', 'incomodidad', 'tensión', 'escepticismo'],
  transition: ['esperanza', 'alivio', 'reflexión', 'anticipación'],
}

// ─── Design contract options ──────────────────────────────────────────────────
const DESIGN_STYLES: { value: DesignStyle; label: string; desc: string }[] = [
  { value: 'hero',       label: 'Hero',        desc: 'Título grande + imagen de impacto' },
  { value: 'data',       label: 'Data',         desc: 'Gráfico o tabla + insight' },
  { value: 'quote',      label: 'Cita',         desc: 'Cita destacada + atribución' },
  { value: 'list',       label: 'Lista',        desc: 'Puntos clave estructurados' },
  { value: 'image',      label: 'Imagen',       desc: 'Imagen dominante, texto mínimo' },
  { value: 'comparison', label: 'Comparación',  desc: 'Antes/después o A vs B' },
  { value: 'split',      label: 'Split',        desc: 'Mitad texto / mitad visual' },
  { value: 'timeline',   label: 'Timeline',     desc: 'Secuencia temporal o de pasos' },
]

const VISUAL_MOODS: { value: VisualMood; label: string }[] = [
  { value: 'dark_bold',   label: '◼ Oscuro & Impactante' },
  { value: 'light_clean', label: '◻ Claro & Limpio' },
  { value: 'data_heavy',  label: '⊞ Denso en datos' },
  { value: 'conceptual',  label: '◈ Conceptual / Metafórico' },
  { value: 'emotional',   label: '♡ Emocional / Humano' },
  { value: 'neutral',     label: '◇ Neutral / Corporativo' },
]

// ─── API base ─────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── Design helpers (Tailwind) ────────────────────────────────────────────────
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

function Badge({
  label,
  variant = 'gray',
}: {
  label: string
  variant?: 'blue' | 'teal' | 'amber' | 'purple' | 'gray' | 'coral'
}) {
  const variants: Record<string, string> = {
    blue:   'bg-[#E6F1FB] text-[#0C447C]',
    teal:   'bg-[#E1F5EE] text-[#085041]',
    amber:  'bg-[#FAEEDA] text-[#633806]',
    purple: 'bg-[#EEEDFE] text-[#3C3489]',
    gray:   'bg-[#F1EFE8] text-[#444441]',
    coral:  'bg-[#FAECE7] text-[#712B13]',
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${variants[variant] ?? variants.gray}`}>
      {label}
    </span>
  )
}

function topicBadgeVariant(type: Topic['type']): 'blue' | 'teal' | 'amber' | 'purple' | 'gray' | 'coral' {
  switch (type) {
    case 'problema_contexto': return 'blue'
    case 'dato_duro':         return 'gray'
    case 'propuesta_valor':   return 'purple'
    case 'prueba_social':     return 'teal'
    case 'visión':            return 'amber'
    case 'contexto_mercado':  return 'coral'
    default:                  return 'gray'
  }
}

function scoreColor(score: number): string {
  if (score >= 8.5) return 'text-[#1D9E75]'
  if (score >= 7)   return 'text-[#378ADD]'
  return 'text-[#888780]'
}

function scoreBarColor(score: number): string {
  if (score >= 8.5) return 'bg-[#1D9E75]'
  if (score >= 7)   return 'bg-[#378ADD]'
  return 'bg-[#888780]'
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-[#1D9E75]' : value >= 40 ? 'bg-[#EF9F27]' : 'bg-[#9B9895]'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F1EFE8]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-[#6B6866]">{value}% confianza</span>
    </div>
  )
}

// ─── Tab 2A — Mapa de Tópicos ─────────────────────────────────────────────────
function Tab2A({
  state,
  shapeId,
  zone1ContextJson,
  onStateChange,
  onGoTo2B,
}: {
  state: Zone2State
  shapeId: string
  zone1ContextJson: string
  onStateChange: (s: Zone2State) => void
  onGoTo2B: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const { authorPattern, topics } = state

  const handleGenerateTopics = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/zones/zone2/suggest-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: shapeId,
          zone1Context: zone1ContextJson ? JSON.parse(zone1ContextJson) : {},
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) {
        onStateChange({ ...state, topics: data.topics, authorPattern: data.authorPattern })
      }
    } catch (err) {
      console.error('suggest-topics error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTopic = (id: string) => {
    const updated = topics.map((t) => {
      if (t.id !== id || t.mandatory) return t
      return { ...t, selected: !t.selected }
    })
    onStateChange({ ...state, topics: updated })
  }

  const selectedCount = topics.filter((t) => t.selected).length
  const mandatoryCount = topics.filter((t) => t.mandatory).length
  const systemCount = topics.filter((t) => t.systemSuggested && t.selected).length
  const totalDuration = topics.filter((t) => t.selected).reduce((s, t) => s + (t.durationMinutes ?? 0), 0)
  const contractReady = selectedCount >= 4

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Patrón del autor */}
      <SectionCard title="Patrón del autor">
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Presentaciones</div>
            <div className="text-xl font-bold text-[#1A1A18]">{authorPattern.presentationsAnalyzed}</div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Rango tópicos</div>
            <div className="text-xl font-bold text-[#1A1A18]">{authorPattern.topicCountMin}–{authorPattern.topicCountMax}</div>
            <div className="text-[11px] text-[#6B6866]">preferido: {authorPattern.topicCountPreferred}</div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Sesgos detectados</div>
            {authorPattern.detectedBiases.length > 0
              ? authorPattern.detectedBiases.map((b, i) => (
                  <Badge key={i} label={b} variant="amber" />
                ))
              : <span className="text-[#9B9895] text-sm">—</span>
            }
          </div>
        </div>
        <ConfBar value={authorPattern.confidence} />
      </SectionCard>

      {/* Generate button */}
      <button
        onClick={handleGenerateTopics}
        disabled={isLoading}
        className="w-full rounded-lg bg-[#185FA5] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? 'Generando...' : 'Generar tópicos con IA →'}
      </button>

      {/* Topics list */}
      {topics.length > 0 && (
        <SectionCard title={`Tópicos candidatos (${topics.length})`}>
          <div className="flex flex-col gap-2">
            {topics.map((topic) => {
              const isRejected = !topic.selected && !topic.mandatory
              return (
                <div
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border border-[#E5E2DA] p-3 transition-colors ${
                    topic.selected
                      ? 'bg-[#E1F5EE] border-[#085041]/20'
                      : isRejected
                      ? 'opacity-50 bg-[#F7F7F5]'
                      : 'bg-[#F7F7F5] hover:bg-white'
                  } ${topic.mandatory ? 'cursor-default' : ''}`}
                >
                  {/* Checkbox */}
                  <div className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-sm border-2 ${
                    topic.selected ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-[#E5E2DA]'
                  } flex items-center justify-center`}>
                    {topic.selected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold text-[#1A1A18] ${isRejected ? 'italic line-through' : ''}`}>
                        {topic.label}
                      </span>
                      <Badge label={topic.type.replace('_', ' ')} variant={topicBadgeVariant(topic.type)} />
                      {topic.mandatory && <Badge label="obligatorio" variant="amber" />}
                      {topic.systemSuggested && <Badge label="IA" variant="blue" />}
                    </div>
                    <div className="mb-1.5 text-[10px] text-[#9B9895]">
                      {topic.origin} · {topic.durationMinutes}min
                    </div>
                    {topic.rejectedReason && (
                      <div className="text-[10px] italic text-[#9B9895]">{topic.rejectedReason}</div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className={`text-sm font-bold ${scoreColor(topic.score)}`}>{topic.score.toFixed(1)}</div>
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#F1EFE8]">
                      <div
                        className={`h-full rounded-full ${scoreBarColor(topic.score)}`}
                        style={{ width: `${(topic.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* Summary row */}
      {topics.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Seleccionados', val: selectedCount },
            { label: 'Obligatorios', val: mandatoryCount },
            { label: 'Sugeridos IA', val: systemCount },
            { label: 'Cobertura', val: `${totalDuration}min` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-[#E5E2DA] bg-white p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">{s.label}</div>
              <div className="text-lg font-bold text-[#1A1A18]">{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Progress banner */}
      {topics.length > 0 && (
        <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
          contractReady
            ? 'border-[#085041]/20 bg-[#E1F5EE]'
            : 'border-[#E5E2DA] bg-[#F1EFE8]'
        }`}>
          <div className="text-sm text-[#1A1A18]">
            {contractReady
              ? <><strong>{selectedCount} tópicos</strong> · {totalDuration} min · listos para narrativa</>
              : `Selecciona al menos 4 tópicos (${selectedCount}/4)`}
          </div>
          <button
            onClick={onGoTo2B}
            disabled={!contractReady}
            className="flex-shrink-0 rounded-md bg-[#185FA5] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            ir a Narrativa →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Tab 2B — Arquitectura Narrativa ─────────────────────────────────────────
function Tab2B({
  state,
  shapeId,
  zone1ContextJson,
  onStateChange,
  onGoToCurve,
}: {
  state: Zone2State
  shapeId: string
  zone1ContextJson: string
  onStateChange: (s: Zone2State) => void
  onGoToCurve: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const { frameworks, selectedFrameworkId, topics } = state

  const handleResearch = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/zones/zone2/suggest-frameworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: shapeId,
          topics: topics.filter((t) => t.selected),
          zone1Context: zone1ContextJson ? JSON.parse(zone1ContextJson) : {},
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) {
        onStateChange({ ...state, frameworks: data.frameworks })
      }
    } catch (err) {
      console.error('suggest-frameworks error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (id: string) => {
    onStateChange({ ...state, selectedFrameworkId: id })
  }

  const selectedFw = frameworks.find((f) => f.id === selectedFrameworkId)
  const fitLabel = (score: number) =>
    score >= 85 ? 'teal' : score >= 70 ? 'blue' : 'amber'

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Research context card */}
      <SectionCard title="Contexto de investigación">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#6B6866]">
            {frameworks.length > 0
              ? `${frameworks.length} frameworks evaluados`
              : 'Sin frameworks evaluados aún'}
          </div>
        </div>
      </SectionCard>

      {/* Research button */}
      <button
        onClick={handleResearch}
        disabled={isLoading}
        className="w-full rounded-lg bg-[#185FA5] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? 'Investigando frameworks...' : 'Investigar frameworks con IA →'}
      </button>

      {/* Framework grid */}
      {frameworks.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {frameworks.map((fw) => {
            const isSelected = fw.id === selectedFrameworkId
            return (
              <div
                key={fw.id}
                className={`rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? 'border-[#085041]/30 bg-[#E1F5EE]'
                    : 'border-[#E5E2DA] bg-white hover:border-[#185FA5]/30 hover:bg-[#F7F7F5]'
                }`}
              >
                {/* Framework header */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-[#1A1A18]">{fw.name}</div>
                    <div className="text-[11px] text-[#9B9895]">{fw.origin}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge label={`${fw.fitScore}%`} variant={fitLabel(fw.fitScore) as 'blue' | 'teal' | 'amber'} />
                    {fw.recommended && <Badge label="recomendado" variant="teal" />}
                  </div>
                </div>

                {/* Description */}
                <p className="mb-2 text-[11px] leading-relaxed text-[#6B6866]">{fw.description}</p>

                {/* Fit reasons */}
                {fw.fitReasons.length > 0 && (
                  <ul className="mb-2 space-y-1">
                    {fw.fitReasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] text-[#6B6866]">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1D9E75]" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Emotional arc */}
                {fw.emotionalArc.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {fw.emotionalArc.map((arc, i) => (
                      <span key={i} className="rounded-full bg-[#F1EFE8] px-2 py-0.5 text-[10px] text-[#444441]">
                        {arc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Risk */}
                {fw.risk && (
                  <p className="mb-2 text-[10px] italic text-[#9B9895]">{fw.risk}</p>
                )}

                {/* Select button */}
                <button
                  onClick={() => handleSelect(fw.id)}
                  className={`w-full rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#1D9E75] text-white'
                      : 'border border-[#185FA5] text-[#185FA5] hover:bg-[#E6F1FB]'
                  }`}
                >
                  {isSelected ? 'seleccionado ✓' : 'seleccionar'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected framework banner */}
      {selectedFw && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#085041]/20 bg-[#E1F5EE] p-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#085041]">
              Framework seleccionado
            </div>
            <div className="text-sm font-semibold text-[#1A1A18]">{selectedFw.name}</div>
          </div>
          <button
            onClick={onGoToCurve}
            className="flex-shrink-0 rounded-md bg-[#185FA5] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            generar curva emocional →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── SVG Curve Chart ──────────────────────────────────────────────────────────
const TYPE_COLORS: Record<'peak' | 'valley' | 'transition', string> = {
  peak:       '#1D9E75',
  valley:     '#378ADD',
  transition: '#EF9F27',
}

function CurveChart({
  points,
  activeSlide,
  onSelectSlide,
}: {
  points: CurvePoint[]
  activeSlide: number
  onSelectSlide: (i: number) => void
}) {
  if (points.length === 0) return null

  const W = 580
  const H = 200
  const PAD_X = 32
  const PAD_Y = 16
  const chartW = W - PAD_X * 2
  const chartH = H - PAD_Y * 2

  const xPos = (i: number) => PAD_X + (i / Math.max(points.length - 1, 1)) * chartW
  const yPos = (intensity: number) => PAD_Y + chartH - ((intensity - 1) / 9) * chartH

  // Build smooth cubic bezier path
  const pathD = points.reduce((d, pt, i) => {
    const x = xPos(i)
    const y = yPos(pt.intensity)
    if (i === 0) return `M ${x} ${y}`
    const prev = points[i - 1]!
    const prevX = xPos(i - 1)
    const prevY = yPos(prev.intensity)
    const cp1x = prevX + (x - prevX) / 3
    const cp1y = prevY
    const cp2x = x - (x - prevX) / 3
    const cp2y = y
    return `${d} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`
  }, '')

  // Segment colors (by source point type)
  const segments = points.slice(1).map((pt, i) => ({
    x1: xPos(i), y1: yPos(points[i]!.intensity),
    x2: xPos(i + 1), y2: yPos(pt.intensity),
    color: TYPE_COLORS[points[i]!.type],
  }))

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Grid lines */}
        {[1, 3, 5, 7, 9, 10].map((v) => (
          <line
            key={v}
            x1={PAD_X} y1={yPos(v)}
            x2={W - PAD_X} y2={yPos(v)}
            stroke="#E5E2DA"
            strokeWidth="1"
            strokeDasharray={v === 5 ? '4 4' : '2 4'}
          />
        ))}

        {/* Colored segments */}
        {segments.map((seg, i) => (
          <line
            key={i}
            x1={seg.x1} y1={seg.y1}
            x2={seg.x2} y2={seg.y2}
            stroke={seg.color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}

        {/* Smooth path overlay (semi-transparent) */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="1.5"
        />

        {/* Points */}
        {points.map((pt, i) => {
          const cx = xPos(i)
          const cy = yPos(pt.intensity)
          const isActive = i === activeSlide
          const color = TYPE_COLORS[pt.type]
          return (
            <g key={i} style={{ cursor: 'pointer' }} onClick={() => onSelectSlide(i)}>
              <circle cx={cx} cy={cy} r={isActive ? 9 : 6} fill="transparent" />
              <circle
                cx={cx} cy={cy}
                r={isActive ? 7 : 5}
                fill={isActive ? 'white' : color}
                stroke={color}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              {pt.modified && (
                <circle cx={cx + 5} cy={cy - 5} r={3} fill="#EF9F27" />
              )}
            </g>
          )
        })}

        {/* X axis labels */}
        {points.map((pt, i) => (
          <text
            key={i}
            x={xPos(i)}
            y={H - 2}
            textAnchor="middle"
            fontSize="9"
            fill="#9B9895"
          >
            {pt.slide}
          </text>
        ))}

        {/* Y axis labels */}
        {[1, 5, 10].map((v) => (
          <text key={v} x={PAD_X - 4} y={yPos(v) + 3} textAnchor="end" fontSize="9" fill="#9B9895">
            {v}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ─── Tab Curva Emocional ──────────────────────────────────────────────────────
function TabCurve({
  state,
  shapeId,
  zone1ContextJson,
  onStateChange,
  onCurveApproved,
}: {
  state: Zone2State
  shapeId: string
  zone1ContextJson: string
  onStateChange: (s: Zone2State) => void
  onCurveApproved?: (curvePoints: CurvePoint[]) => void
}) {
  const [curveStep, setCurveStep] = useState<1 | 2 | 3>(
    state.curveStatus === 'approved' ? 3 : state.curvePoints.length > 0 ? 2 : 1
  )
  const [activeSlide, setActiveSlide] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const selectedFw = state.frameworks.find((f) => f.id === state.selectedFrameworkId)
  const selectedTopics = state.topics.filter((t) => t.selected)
  const { curvePoints } = state

  const activePoint = curvePoints[activeSlide]

  // Metrics
  const peakCount = curvePoints.filter((p) => p.type === 'peak').length
  const valleyCount = curvePoints.filter((p) => p.type === 'valley').length
  const avgIntensity = curvePoints.length > 0
    ? (curvePoints.reduce((s, p) => s + p.intensity, 0) / curvePoints.length).toFixed(1)
    : '0'
  let maxConsecutiveValleys = 0
  let cur = 0
  for (const p of curvePoints) {
    cur = p.type === 'valley' ? cur + 1 : 0
    maxConsecutiveValleys = Math.max(maxConsecutiveValleys, cur)
  }

  const handleGenerateCurve = async () => {
    if (!selectedFw) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/zones/zone2/generate-curve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: shapeId,
          framework: selectedFw,
          topics: selectedTopics,
          zone1Context: zone1ContextJson ? JSON.parse(zone1ContextJson) : {},
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) {
        const newState = {
          ...state,
          curvePoints: data.curvePoints,
          curveStatus: 'draft' as const,
          curveVersion: state.curveVersion + 1,
          narrativeBrief: data.narrativeBrief ?? state.narrativeBrief,
          presentationTitle: data.presentationTitle ?? state.presentationTitle,
        }
        onStateChange(newState)
        setCurveStep(2)
        setActiveSlide(0)
      }
    } catch (err) {
      console.error('generate-curve error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePoint = (idx: number, changes: Partial<CurvePoint>) => {
    const updated = curvePoints.map((p, i) => {
      if (i !== idx) return p
      return { ...p, ...changes, modified: true }
    })
    onStateChange({ ...state, curvePoints: updated })
  }

  const resetPoint = (idx: number) => {
    const updated = curvePoints.map((p, i) => {
      if (i !== idx) return p
      return {
        ...p,
        type: p.systemType,
        emotion: p.systemEmotion,
        intensity: p.systemIntensity,
        modified: false,
      }
    })
    onStateChange({ ...state, curvePoints: updated })
  }

  const handleApprove = () => {
    const newState = { ...state, curveStatus: 'approved' as const }
    onStateChange(newState)
    setCurveStep(3)
    onCurveApproved?.(curvePoints)
  }

  // ── Step 1: Mapeo ─────────────────────────────────────────────────────────
  if (curveStep === 1) {
    return (
      <div className="flex flex-col gap-4 pb-6">
        {/* Framework banner */}
        {selectedFw ? (
          <div className="rounded-lg border border-[#085041]/20 bg-[#E1F5EE] p-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#085041]">
              Framework seleccionado
            </div>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-semibold text-[#1A1A18]">{selectedFw.name}</span>
              <span className="text-[11px] text-[#085041]">{selectedFw.origin}</span>
              <Badge label={`fit ${selectedFw.fitScore}%`} variant="teal" />
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedFw.emotionalArc.map((arc, i) => (
                <span key={i} className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] text-[#085041] border border-[#085041]/20">
                  {arc}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-[#FAEEDA] bg-[#FAEEDA] p-3 text-sm text-[#633806]">
            Selecciona un framework en la pestaña 2B antes de generar la curva.
          </div>
        )}

        {/* Mapping grid */}
        {selectedTopics.length > 0 && (
          <SectionCard title="Mapeo de tópicos → puntos emocionales">
            <div className="flex flex-col gap-2">
              {selectedTopics.map((topic) => {
                const defaultType: 'peak' | 'valley' | 'transition' =
                  topic.type === 'problema_contexto' ? 'peak' :
                  topic.type === 'dato_duro' ? 'valley' :
                  topic.type === 'propuesta_valor' ? 'transition' :
                  topic.type === 'prueba_social' ? 'peak' :
                  topic.type === 'visión' ? 'peak' : 'transition'

                return (
                  <div key={topic.id} className="flex items-center gap-3 rounded-md border border-[#E5E2DA] bg-[#F7F7F5] p-2.5">
                    <div className="flex-1 text-xs font-medium text-[#1A1A18]">{topic.label}</div>
                    <span className="text-[#9B9895]">→</span>
                    <div
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                      style={{
                        backgroundColor: TYPE_COLORS[defaultType] + '22',
                        color: TYPE_COLORS[defaultType],
                      }}
                    >
                      {defaultType}
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerateCurve}
          disabled={isLoading || !selectedFw}
          className="w-full rounded-lg bg-[#185FA5] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Generando curva...' : 'generar curva emocional →'}
        </button>
      </div>
    )
  }

  // ── Step 3: Aprobada ──────────────────────────────────────────────────────
  if (curveStep === 3) {
    const totalSecs = curvePoints.reduce((s, p) => s + (p.durationSeconds ?? 0), 0)
    const totalMins = Math.round(totalSecs / 60)
    return (
      <div className="flex flex-col gap-4 pb-6">
        {/* Approved badge */}
        <div className="flex items-center gap-3 rounded-lg border border-[#085041]/20 bg-[#E1F5EE] p-4">
          <div className="text-3xl">✓</div>
          <div>
            <div className="text-sm font-bold text-[#1A1A18]">Arco narrativo aprobado</div>
            <div className="text-[12px] text-[#085041]">
              {curvePoints.length} slides · {totalMins > 0 ? `${totalMins} min estimados` : ''} · versión {state.curveVersion}
            </div>
          </div>
        </div>

        {/* Narrative brief */}
        {state.narrativeBrief && (
          <div className="rounded-lg border border-[#E5E2DA] bg-white p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9B9895]">Resumen del arco narrativo</div>
            {state.presentationTitle && (
              <div className="mb-2 text-sm font-bold text-[#1A1A18]">"{state.presentationTitle}"</div>
            )}
            <p className="text-[12px] leading-relaxed text-[#6B6866]">{state.narrativeBrief}</p>
          </div>
        )}

        {/* Slide summary table */}
        <div className="rounded-lg border border-[#E5E2DA] bg-white overflow-hidden">
          <div className="border-b border-[#E5E2DA] px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9B9895]">
              Contrato de diseño → Acto #3
            </div>
          </div>
          <div className="divide-y divide-[#F1EFE8]">
            {curvePoints.map((pt) => (
              <div key={pt.slide} className="flex items-start gap-3 px-4 py-3">
                <div
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: TYPE_COLORS[pt.type] }}
                >
                  {pt.slide}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1A1A18] truncate">
                    {pt.suggestedTitle || pt.fullLabel || pt.label}
                  </div>
                  {pt.contentDirection && (
                    <div className="text-[10px] text-[#6B6866] leading-relaxed mt-0.5 line-clamp-1">
                      {pt.contentDirection}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {pt.designStyle && (
                    <span className="rounded bg-[#F1EFE8] px-1.5 py-0.5 text-[9px] font-semibold text-[#444441]">
                      {pt.designStyle}
                    </span>
                  )}
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: TYPE_COLORS[pt.type] }}
                  >
                    {pt.emotion} {pt.intensity}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurveStep(2)}
            className="flex-1 rounded-lg border border-[#185FA5] py-2 text-sm font-semibold text-[#185FA5] transition-colors hover:bg-[#E6F1FB]"
          >
            ← ajustar arco
          </button>
          <button
            className="flex-1 rounded-lg bg-[#0F6E56] py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Avanzar Acto #3 →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Editor ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Metrics cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Picos', val: peakCount, color: '#1D9E75' },
          { label: 'Valles', val: valleyCount, color: '#378ADD' },
          { label: 'Intensidad promedio', val: avgIntensity, color: '#1A1A18' },
          {
            label: 'Valles consecutivos',
            val: maxConsecutiveValleys,
            color: maxConsecutiveValleys > 2 ? '#E24B4A' : '#1A1A18',
          },
        ].map((m) => (
          <div key={m.label} className={`rounded-lg border p-3 text-center ${
            m.label === 'Valles consecutivos' && maxConsecutiveValleys > 2
              ? 'border-[#E24B4A]/30 bg-[#FCEBEB]'
              : 'border-[#E5E2DA] bg-white'
          }`}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">{m.label}</div>
            <div className="text-xl font-bold" style={{ color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Alert bar */}
      {maxConsecutiveValleys > 2 && (
        <div className="flex items-center gap-2 rounded-lg border border-[#E24B4A]/30 bg-[#FCEBEB] p-3">
          <span className="h-2 w-2 rounded-full bg-[#E24B4A]" />
          <span className="text-sm text-[#791F1F]">
            Hay {maxConsecutiveValleys} valles consecutivos — considera insertar un pico para mantener la atención.
          </span>
        </div>
      )}

      {/* SVG Chart */}
      <div className="rounded-lg border border-[#E5E2DA] bg-white p-4">
        <CurveChart
          points={curvePoints}
          activeSlide={activeSlide}
          onSelectSlide={setActiveSlide}
        />
      </div>

      {/* Slides row */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {curvePoints.map((pt, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`flex-shrink-0 rounded-lg border p-2 text-center transition-colors min-w-[60px] ${
              i === activeSlide
                ? 'border-[#185FA5]/40 bg-[#E6F1FB]'
                : 'border-[#E5E2DA] bg-white hover:bg-[#F7F7F5]'
            }`}
          >
            <div className="text-[10px] font-bold text-[#9B9895]">{pt.slide}</div>
            <div
              className="mx-auto my-1 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[pt.type] }}
            />
            <div className="text-[9px] text-[#6B6866] leading-tight max-w-[56px] truncate">{pt.label}</div>
            {pt.modified && (
              <div className="mt-0.5 text-[9px] text-[#EF9F27] font-semibold">editado</div>
            )}
          </button>
        ))}
      </div>

      {/* Editor panel */}
      {activePoint && (
        <div className="rounded-lg border border-[#E5E2DA] bg-white p-4">
          {/* Editor header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-[#1A1A18]">
              Slide {activePoint.slide} — {activePoint.fullLabel || activePoint.label}
            </div>
            {activePoint.modified && (
              <button
                onClick={() => resetPoint(activeSlide)}
                className="text-[11px] text-[#9B9895] underline hover:text-[#1A1A18]"
              >
                restaurar original
              </button>
            )}
          </div>

          {/* Row 1: emotional arc controls */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left: type + emotion */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Tipo emocional</div>
                <div className="flex gap-1.5">
                  {(['peak', 'valley', 'transition'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updatePoint(activeSlide, {
                        type: t,
                        emotion: EMOTIONS[t][0] ?? activePoint.emotion,
                      })}
                      className="rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: activePoint.type === t ? TYPE_COLORS[t] + '22' : '#F1EFE8',
                        color: activePoint.type === t ? TYPE_COLORS[t] : '#6B6866',
                        border: `1.5px solid ${activePoint.type === t ? TYPE_COLORS[t] : 'transparent'}`,
                      }}
                    >
                      {t === 'peak' ? '▲ pico' : t === 'valley' ? '▼ valle' : '→ transición'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Emoción</div>
                <select
                  value={activePoint.emotion}
                  onChange={(e) => updatePoint(activeSlide, { emotion: e.target.value })}
                  className="w-full rounded-md border border-[#E5E2DA] bg-white px-2 py-1.5 text-xs text-[#1A1A18] outline-none focus:border-[#185FA5]"
                >
                  {EMOTIONS[activePoint.type].map((em) => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Right: intensity */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
                  <span>Intensidad</span>
                  <span className="text-sm font-bold" style={{ color: TYPE_COLORS[activePoint.type] }}>
                    {activePoint.intensity}
                  </span>
                </div>
                <input
                  type="range" min={1} max={10} value={activePoint.intensity}
                  onChange={(e) => updatePoint(activeSlide, { intensity: Number(e.target.value) })}
                  className="w-full accent-[#185FA5]"
                />
                <div className="mt-1 flex justify-between text-[9px] text-[#9B9895]">
                  <span>1 mínimo</span><span>10 máximo</span>
                </div>
              </div>
              {activePoint.durationSeconds && (
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Duración estimada</div>
                  <div className="text-xs text-[#6B6866]">
                    {Math.floor(activePoint.durationSeconds / 60)}:{String(activePoint.durationSeconds % 60).padStart(2,'0')} min
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-[#E5E2DA]" />
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#185FA5]">
            Contrato de diseño → Acto #3
          </div>

          {/* Row 2: design contract */}
          <div className="flex flex-col gap-3">
            {/* Suggested title */}
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Título sugerido</div>
              <input
                type="text"
                value={activePoint.suggestedTitle ?? ''}
                onChange={(e) => updatePoint(activeSlide, { suggestedTitle: e.target.value })}
                placeholder="Título de la diapositiva…"
                className="w-full rounded-md border border-[#E5E2DA] bg-white px-3 py-1.5 text-xs text-[#1A1A18] outline-none focus:border-[#185FA5]"
              />
            </div>

            {/* Content direction */}
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Dirección de contenido</div>
              <textarea
                value={activePoint.contentDirection ?? ''}
                onChange={(e) => updatePoint(activeSlide, { contentDirection: e.target.value })}
                placeholder="¿Qué comunica esta diapositiva y cómo?"
                rows={2}
                className="w-full resize-none rounded-md border border-[#E5E2DA] bg-white px-3 py-1.5 text-xs text-[#1A1A18] outline-none focus:border-[#185FA5]"
              />
            </div>

            {/* Design style + visual mood */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Estilo de diseño</div>
                <select
                  value={activePoint.designStyle ?? ''}
                  onChange={(e) => updatePoint(activeSlide, { designStyle: e.target.value as DesignStyle })}
                  className="w-full rounded-md border border-[#E5E2DA] bg-white px-2 py-1.5 text-[11px] text-[#1A1A18] outline-none focus:border-[#185FA5]"
                >
                  <option value="">— elegir —</option>
                  {DESIGN_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Mood visual</div>
                <select
                  value={activePoint.visualMood ?? ''}
                  onChange={(e) => updatePoint(activeSlide, { visualMood: e.target.value as VisualMood })}
                  className="w-full rounded-md border border-[#E5E2DA] bg-white px-2 py-1.5 text-[11px] text-[#1A1A18] outline-none focus:border-[#185FA5]"
                >
                  <option value="">— elegir —</option>
                  {VISUAL_MOODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Speaker notes */}
            {activePoint.speakerNotes && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Notas del presentador</div>
                <div className="rounded-md bg-[#F7F7F5] px-3 py-2 text-[11px] text-[#6B6866] leading-relaxed">
                  {activePoint.speakerNotes}
                </div>
              </div>
            )}

            {/* Mapping rules */}
            {activePoint.mappingRules.length > 0 && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">Reglas aplicadas</div>
                <ul className="space-y-0.5">
                  {activePoint.mappingRules.map((r, i) => (
                    <li key={i} className="text-[10px] text-[#9B9895]">· {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* System note */}
          <div className="mt-3 rounded-md bg-[#F1EFE8] px-2 py-1.5 text-[10px] text-[#9B9895]">
            Original: {activePoint.systemType} · {activePoint.systemEmotion} · intensidad {activePoint.systemIntensity}
          </div>
        </div>
      )}

      {/* Approve button */}
      <button
        onClick={handleApprove}
        className="w-full rounded-lg bg-[#0F6E56] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        ✓ Aprobar arco narrativo → Acto #3
      </button>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function Zone2Panel({
  shapeId,
  initialState,
  zone1ContextJson = '',
  onStateUpdate,
  onClose,
  onCurveApproved,
}: Zone2PanelProps) {
  const [activeTab, setActiveTab] = useState<Zone2Tab>('2a')
  const [state, setState] = useState<Zone2State>(initialState ?? EMPTY_ZONE2)

  const handleStateChange = useCallback((newState: Zone2State) => {
    setState(newState)
    onStateUpdate(newState)
  }, [onStateUpdate])

  const tabs: { id: Zone2Tab; label: string }[] = [
    { id: '2a',    label: '📋 Tópicos' },
    { id: '2b',    label: '🏗 Narrativa' },
    { id: 'curve', label: '📈 Curva' },
  ]

  return (
    <div
      className="pointer-events-auto fixed right-0 top-0 flex h-full w-[680px] flex-col bg-[#F7F7F5] shadow-2xl"
      style={{ zIndex: 9999 }}
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-[#E5E2DA] bg-white px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">📈</span>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9B9895]">
                Acto #2 — Arco Narrativo
              </div>
            </div>
            <div className="mt-0.5 text-[12px] text-[#6B6866]">
              {state.topics.filter((t) => t.selected).length > 0
                ? `${state.topics.filter((t) => t.selected).length} tópicos`
                : 'Sin tópicos aún'}
              {state.selectedFrameworkId && ` · ${state.frameworks.find((f) => f.id === state.selectedFrameworkId)?.name ?? ''}`}
              {state.curvePoints.length > 0 && ` · ${state.curvePoints.length} slides`}
              {state.curveStatus === 'approved' && ' · ✓ aprobado'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#9B9895] transition-colors hover:bg-[#F1EFE8] hover:text-[#1A1A18]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 border-b border-[#E5E2DA] bg-white px-5">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-[12px] font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#185FA5] text-[#185FA5]'
                  : 'border-transparent text-[#6B6866] hover:text-[#1A1A18]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-5 pt-4">
        {activeTab === '2a' && (
          <Tab2A
            state={state}
            shapeId={shapeId}
            zone1ContextJson={zone1ContextJson}
            onStateChange={handleStateChange}
            onGoTo2B={() => setActiveTab('2b')}
          />
        )}
        {activeTab === '2b' && (
          <Tab2B
            state={state}
            shapeId={shapeId}
            zone1ContextJson={zone1ContextJson}
            onStateChange={handleStateChange}
            onGoToCurve={() => setActiveTab('curve')}
          />
        )}
        {activeTab === 'curve' && (
          <TabCurve
            state={state}
            shapeId={shapeId}
            zone1ContextJson={zone1ContextJson}
            onStateChange={handleStateChange}
            onCurveApproved={onCurveApproved}
          />
        )}
      </div>
    </div>
  )
}
