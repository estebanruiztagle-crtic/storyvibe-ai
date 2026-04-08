import React from 'react'
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  SvgExportContext,
  T,
  TLBaseShape,
} from 'tldraw'
import { useZonePanel } from '@/lib/zone-panel-context'
import type { Zone2State, Topic, AuthorPattern } from '@/components/zones/zone2/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  bgSecondary: '#F7F7F5',
  bgTertiary: '#F1EFE8',
  border: '#E5E2DA',
  text: '#1A1A18',
  textSecondary: '#6B6866',
  textTertiary: '#9B9895',
  accentBlue: '#185FA5',
  accentTeal: '#1D9E75',
  accentTealDark: '#0F6E56',
  accentAmber: '#EF9F27',
  badgeBlueBg: '#E6F1FB',
  badgeBlueText: '#0C447C',
  badgeTealBg: '#E1F5EE',
  badgeTealText: '#085041',
  badgeAmberBg: '#FAEEDA',
  badgeAmberText: '#633806',
  badgePurpleBg: '#EEEDFE',
  badgePurpleText: '#3C3489',
  badgeGrayBg: '#F1EFE8',
  badgeGrayText: '#444441',
  badgeCoralBg: '#FAECE7',
  badgeCoralText: '#712B13',
}

// ─── Type helpers ─────────────────────────────────────────────────────────────
type Zone2AStatus = 'empty' | 'in_progress' | 'validated'

type Zone2AShapeProps = {
  w: number
  h: number
  presentationId: string
  status: Zone2AStatus
  selectedCount: number
  totalCount: number
  mandatoryCount: number
  patternConfidence: number
  contractReady: boolean
  dataJson: string
}

export type TLZone2AShape = TLBaseShape<'zone2a', Zone2AShapeProps>

// ─── Topic badge color map ────────────────────────────────────────────────────
function topicBadgeStyle(type: Topic['type']): { bg: string; color: string } {
  switch (type) {
    case 'problema_contexto': return { bg: C.badgeBlueBg, color: C.badgeBlueText }
    case 'dato_duro':         return { bg: C.badgeGrayBg, color: C.badgeGrayText }
    case 'propuesta_valor':   return { bg: C.badgePurpleBg, color: C.badgePurpleText }
    case 'prueba_social':     return { bg: C.badgeTealBg, color: C.badgeTealText }
    case 'visión':            return { bg: C.badgeAmberBg, color: C.badgeAmberText }
    case 'contexto_mercado':  return { bg: C.badgeCoralBg, color: C.badgeCoralText }
    default:                  return { bg: C.badgeGrayBg, color: C.badgeGrayText }
  }
}

function scoreColor(score: number): string {
  if (score >= 8.5) return C.accentTeal
  if (score >= 7)   return '#378ADD'
  return '#888780'
}

// ─── Shared sub-components (inline styles) ────────────────────────────────────
function SmallBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
      backgroundColor: bg,
      color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      color: C.textTertiary,
      marginBottom: '6px',
    }}>
      {label}
    </div>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? C.accentTeal : value >= 40 ? C.accentAmber : C.textTertiary
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', backgroundColor: C.bgTertiary, borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', backgroundColor: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '10px', color: C.textSecondary, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {value}% confianza
      </span>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onOpen }: { onOpen: (e: React.MouseEvent) => void }) {
  const placeholders = [
    { label: 'Presentaciones analizadas', val: '—' },
    { label: 'Tópicos típicos', val: '—' },
    { label: 'Sesgos detectados', val: '—' },
  ]

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: C.bg,
      borderRadius: '12px',
      border: `1.5px solid ${C.border}`,
      padding: '24px',
      boxSizing: 'border-box' as const,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.textTertiary, marginBottom: '4px' }}>
          Acto #2 — Arco Narrativo
        </div>
        <div style={{ fontSize: '13px', color: C.textSecondary }}>
          Tópicos · Narrativa · Curva emocional
        </div>
      </div>

      {/* Pattern stat placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {placeholders.map((p) => (
          <div key={p.label} style={{
            padding: '10px 12px',
            backgroundColor: C.bgSecondary,
            borderRadius: '8px',
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: '10px', color: C.textTertiary, fontWeight: 600, marginBottom: '4px' }}>{p.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: C.textTertiary }}>{p.val}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onPointerDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); onOpen(e as any) }}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          backgroundColor: C.accentBlue,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          pointerEvents: 'all' as const,
          textAlign: 'center' as const,
        }}
      >
        Generar mapa de tópicos →
      </button>

      <div style={{ fontSize: '11px', color: C.textTertiary, textAlign: 'center' as const, lineHeight: 1.5 }}>
        Detecta el patrón del autor y propone tópicos candidatos. Propaga a 2B y Curva Emocional.
      </div>
    </div>
  )
}

// ─── Full State Card ──────────────────────────────────────────────────────────
function FullCard({
  state,
  props,
  onOpen,
}: {
  state: Zone2State
  props: Zone2AShapeProps
  onOpen: (e: React.MouseEvent) => void
}) {
  const { authorPattern, topics } = state
  const selectedTopics = topics.filter((t) => t.selected)
  const mandatoryTopics = topics.filter((t) => t.mandatory)
  const systemSuggested = topics.filter((t) => t.systemSuggested && t.selected)
  const totalDuration = selectedTopics.reduce((s, t) => s + (t.durationMinutes ?? 0), 0)

  const selectedFw = state.frameworks.find((f) => f.id === state.selectedFrameworkId)

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: C.bgSecondary,
      borderRadius: '12px',
      border: `1.5px solid ${C.border}`,
      padding: '20px',
      boxSizing: 'border-box' as const,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.textTertiary, marginBottom: '4px' }}>
            Acto #2 — Arco Narrativo
          </div>
          <div style={{ fontSize: '12px', color: C.textSecondary }}>
            {props.selectedCount} tópicos seleccionados · {props.totalCount} candidatos
          </div>
        </div>
        <SmallBadge
          label={props.status === 'validated' ? 'validado' : 'en progreso'}
          bg={props.status === 'validated' ? C.badgeTealBg : C.badgeAmberBg}
          color={props.status === 'validated' ? C.badgeTealText : C.badgeAmberText}
        />
      </div>

      {/* Patrón del autor */}
      <div>
        <SectionLabel label="Patrón del autor" />
        <div style={{
          backgroundColor: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '12px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '10px', color: C.textTertiary, fontWeight: 600, marginBottom: '2px' }}>Presentaciones</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>{authorPattern.presentationsAnalyzed}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: C.textTertiary, fontWeight: 600, marginBottom: '2px' }}>Rango tópicos</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>
                {authorPattern.topicCountMin}–{authorPattern.topicCountMax}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: C.textTertiary, fontWeight: 600, marginBottom: '2px' }}>Sesgos</div>
              <div style={{ fontSize: '12px', color: C.textSecondary }}>
                {authorPattern.detectedBiases.length > 0
                  ? authorPattern.detectedBiases.slice(0, 2).join(', ')
                  : '—'}
              </div>
            </div>
          </div>
          <ConfidenceBar value={authorPattern.confidence} />
        </div>
      </div>

      {/* Tópicos seleccionados */}
      {topics.length > 0 && (
        <div>
          <SectionLabel label="Tópicos seleccionados" />
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
            {topics.map((topic) => {
              const badge = topicBadgeStyle(topic.type)
              const isRejected = !topic.selected && !topic.mandatory
              const scoreC = scoreColor(topic.score)
              return (
                <div
                  key={topic.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: '6px',
                    opacity: isRejected ? 0.45 : 1,
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    border: `2px solid ${topic.selected ? C.accentTeal : C.border}`,
                    backgroundColor: topic.selected ? C.accentTeal : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {topic.selected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {/* Label */}
                  <div style={{ flex: 1, fontSize: '11px', color: C.text, fontWeight: isRejected ? 400 : 500, fontStyle: isRejected ? 'italic' : 'normal' }}>
                    {topic.label}
                    {topic.rejectedReason && (
                      <span style={{ fontSize: '10px', color: C.textTertiary, marginLeft: '6px' }}>
                        ({topic.rejectedReason})
                      </span>
                    )}
                  </div>
                  {/* Type badge */}
                  <SmallBadge label={topic.type.replace('_', ' ')} bg={badge.bg} color={badge.color} />
                  {/* Mandatory flag */}
                  {topic.mandatory && (
                    <SmallBadge label="obl" bg={C.badgeAmberBg} color={C.badgeAmberText} />
                  )}
                  {/* Score bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '36px', height: '3px', backgroundColor: C.bgTertiary, borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${(topic.score / 10) * 100}%`, height: '100%', backgroundColor: scoreC, borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '10px', color: scoreC, fontWeight: 600 }}>{topic.score.toFixed(1)}</span>
                  </div>
                  {/* Duration */}
                  <span style={{ fontSize: '10px', color: C.textTertiary, whiteSpace: 'nowrap' as const }}>
                    {topic.durationMinutes}m
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary row */}
      {topics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { label: 'Seleccionados', val: `${props.selectedCount}` },
            { label: 'Obligatorios', val: `${mandatoryTopics.length}` },
            { label: 'Sugeridos IA', val: `${systemSuggested.length}` },
            { label: 'Cobertura', val: `${totalDuration}min` },
          ].map((s) => (
            <div key={s.label} style={{
              padding: '8px 10px',
              backgroundColor: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              textAlign: 'center' as const,
            }}>
              <div style={{ fontSize: '10px', color: C.textTertiary, fontWeight: 600, marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Framework summary if selected */}
      {selectedFw && (
        <div style={{
          padding: '10px 12px',
          backgroundColor: C.badgeTealBg,
          border: `1px solid ${C.badgeTealText}33`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: C.badgeTealText, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
              Framework narrativo
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>{selectedFw.name}</div>
          </div>
          <SmallBadge label={`fit ${selectedFw.fitScore}%`} bg={C.badgeTealBg} color={C.badgeTealText} />
        </div>
      )}

      {/* Contract banner */}
      <div style={{
        padding: '10px 12px',
        backgroundColor: props.contractReady ? C.badgeTealBg : C.bgTertiary,
        border: `1px solid ${props.contractReady ? C.badgeTealText + '44' : C.border}`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <div style={{ fontSize: '12px', color: C.text }}>
          <strong>Listo para Narrativa</strong>
          {' · '}
          {props.contractReady
            ? `${props.selectedCount} tópicos listos`
            : 'selecciona al menos 4 tópicos'}
        </div>
        <button
          onPointerDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); onOpen(e as any) }}
          style={{
            padding: '6px 12px',
            backgroundColor: C.accentBlue,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            pointerEvents: 'all' as const,
            whiteSpace: 'nowrap' as const,
          }}
        >
          Abrir Acto #2 →
        </button>
      </div>
    </div>
  )
}

// ─── Shape Util ───────────────────────────────────────────────────────────────
export class Zone2AShapeUtil extends BaseBoxShapeUtil<TLZone2AShape> {
  static override type = 'zone2a' as const

  static override props: RecordProps<TLZone2AShape> = {
    w: T.number,
    h: T.number,
    presentationId: T.string,
    status: T.literalEnum('empty', 'in_progress', 'validated'),
    selectedCount: T.number,
    totalCount: T.number,
    mandatoryCount: T.number,
    patternConfidence: T.number,
    contractReady: T.boolean,
    dataJson: T.string,
  }

  override getDefaultProps(): Zone2AShapeProps {
    return {
      w: 640,
      h: 340,
      presentationId: '',
      status: 'empty',
      selectedCount: 0,
      totalCount: 0,
      mandatoryCount: 0,
      patternConfidence: 0,
      contractReady: false,
      dataJson: '',
    }
  }

  override component(shape: TLZone2AShape) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { openPanel } = useZonePanel()

    const handleOpen = (e: React.MouseEvent) => {
      e.stopPropagation()
      openPanel('zone2', shape.id)
    }

    let state: Zone2State | null = null
    if (shape.props.dataJson) {
      try {
        state = JSON.parse(shape.props.dataJson) as Zone2State
      } catch {
        state = null
      }
    }

    const isEmpty = shape.props.status === 'empty' || state === null

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: 'all',
          overflow: 'hidden',
          borderRadius: '12px',
        }}
      >
        {isEmpty ? (
          <EmptyState onOpen={handleOpen} />
        ) : (
          <FullCard state={state!} props={shape.props} onOpen={handleOpen} />
        )}
      </HTMLContainer>
    )
  }

  override indicator(shape: TLZone2AShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
  }

  override toSvg(shape: TLZone2AShape, _ctx: SvgExportContext): React.ReactElement | null {
    const { w, h, status, selectedCount, totalCount, patternConfidence, dataJson } = shape.props

    let stateData: Zone2State | null = null
    try {
      if (dataJson) stateData = JSON.parse(dataJson) as Zone2State
    } catch { /* empty */ }

    // Design tokens
    const BG = '#FFFFFF'
    const BG2 = '#F7F7F5'
    const BORDER = '#E5E2DA'
    const TEXT = '#1A1A18'
    const TEXT2 = '#6B6866'
    const TEXT3 = '#9B9895'
    const ACCENT = '#185FA5'
    const ACCENT_BG = '#E6F1FB'
    const TEAL = '#0F6E56'
    const TEAL_BG = '#E1F5EE'

    const statusLabel = status === 'validated' ? 'validado' : status === 'in_progress' ? 'en progreso' : 'pendiente'
    const statusBg = status === 'validated' ? TEAL_BG : status === 'in_progress' ? '#FAEEDA' : BG2
    const statusColor = status === 'validated' ? TEAL : status === 'in_progress' ? '#633806' : TEXT3

    const selectedFw = stateData?.frameworks?.find((f) => f.id === stateData?.selectedFrameworkId)
    const narrativeBrief = (stateData as { narrativeBrief?: string } | null)?.narrativeBrief ?? ''
    const presentationTitle = (stateData as { presentationTitle?: string } | null)?.presentationTitle ?? ''

    const rows: Array<{ label: string; value: string }> = []
    if (presentationTitle) rows.push({ label: 'Título', value: presentationTitle.slice(0, 60) })
    if (selectedFw) rows.push({ label: 'Framework', value: `${selectedFw.name} · fit ${selectedFw.fitScore}%` })
    rows.push({ label: 'Tópicos', value: `${selectedCount} seleccionados / ${totalCount} candidatos` })
    rows.push({ label: 'Confianza patrón', value: `${patternConfidence}%` })
    if (narrativeBrief) rows.push({ label: 'Brief', value: narrativeBrief.slice(0, 80) + (narrativeBrief.length > 80 ? '…' : '') })

    const rowH = 34
    const headerH = 56
    const svgH = Math.min(h, headerH + rows.length * rowH + 24)
    const confBarW = (patternConfidence / 100) * 80

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={w}
        height={svgH}
        viewBox={`0 0 ${w} ${svgH}`}
      >
        <rect x={0} y={0} width={w} height={svgH} rx={12} ry={12} fill={BG2} stroke={BORDER} strokeWidth={1.5} />
        <rect x={0} y={0} width={w} height={6} rx={0} fill={ACCENT} />
        <rect x={0} y={0} width={12} height={6} rx={0} fill={ACCENT} />

        <text x={16} y={28} fontSize={10} fontWeight={700} letterSpacing={1.5} fill={TEXT3} fontFamily="system-ui, sans-serif">
          ACTO #2 — NARRATIVA
        </text>

        <rect x={w - 100} y={14} width={84} height={18} rx={4} fill={statusBg} />
        <text x={w - 58} y={27} fontSize={10} fontWeight={600} fill={statusColor} fontFamily="system-ui, sans-serif" textAnchor="middle">
          {statusLabel}
        </text>

        <text x={16} y={48} fontSize={9} fill={TEXT3} fontFamily="system-ui, sans-serif">
          confianza {patternConfidence}%
        </text>
        <rect x={120} y={40} width={80} height={4} rx={2} fill={BORDER} />
        <rect x={120} y={40} width={confBarW} height={4} rx={2} fill={patternConfidence >= 70 ? TEAL : patternConfidence >= 40 ? '#EF9F27' : TEXT3} />

        <line x1={16} y1={56} x2={w - 16} y2={56} stroke={BORDER} strokeWidth={1} />

        {rows.map((row, i) => (
          <g key={i}>
            <rect x={16} y={headerH + i * rowH} width={w - 32} height={rowH - 4} rx={4} fill={i % 2 === 0 ? BG : BG2} />
            <text x={24} y={headerH + i * rowH + 13} fontSize={9} fontWeight={600} fill={TEXT3} fontFamily="system-ui, sans-serif" letterSpacing={1}>
              {row.label.toUpperCase()}
            </text>
            <text x={24} y={headerH + i * rowH + 27} fontSize={11} fill={TEXT} fontFamily="system-ui, sans-serif">
              {row.value.slice(0, Math.floor((w - 48) / 6.5))}
            </text>
          </g>
        ))}
      </svg>
    )
  }
}

export const zone2aShapeUtil = Zone2AShapeUtil
