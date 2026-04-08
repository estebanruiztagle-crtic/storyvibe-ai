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
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Zone2BStatus = 'empty' | 'framework_selected' | 'curve_generated' | 'curve_approved'

type Zone2BShapeProps = {
  w: number
  h: number
  presentationId: string
  status: Zone2BStatus
  selectedFrameworkName: string
  selectedFrameworkFitScore: number
  curvePointCount: number
  dataJson: string
}

export type TLZone2BShape = TLBaseShape<'zone2b', Zone2BShapeProps>

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SmallBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
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

function fitScoreColor(score: number) {
  if (score >= 85) return { bg: C.badgeTealBg, text: C.badgeTealText }
  if (score >= 70) return { bg: C.badgeBlueBg, text: C.badgeBlueText }
  return { bg: C.badgeAmberBg, text: C.badgeAmberText }
}

// ─── Component ────────────────────────────────────────────────────────────────
export class Zone2BShapeUtil extends BaseBoxShapeUtil<TLZone2BShape> {
  static override type = 'zone2b' as const

  static override props: RecordProps<TLZone2BShape> = {
    w: T.number,
    h: T.number,
    presentationId: T.string,
    status: T.literalEnum('empty', 'framework_selected', 'curve_generated', 'curve_approved'),
    selectedFrameworkName: T.string,
    selectedFrameworkFitScore: T.number,
    curvePointCount: T.number,
    dataJson: T.string,
  }

  override getDefaultProps(): Zone2BShapeProps {
    return {
      w: 640,
      h: 280,
      presentationId: '',
      status: 'empty',
      selectedFrameworkName: '',
      selectedFrameworkFitScore: 0,
      curvePointCount: 0,
      dataJson: '',
    }
  }

  override component(shape: TLZone2BShape) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { openPanel } = useZonePanel()

    const handleOpen = (e: React.MouseEvent) => {
      e.stopPropagation()
      openPanel('zone2', shape.id)
    }

    const { status, selectedFrameworkName, selectedFrameworkFitScore, curvePointCount } = shape.props
    const isEmpty = status === 'empty'
    const fitColors = fitScoreColor(selectedFrameworkFitScore)

    // Try to parse emotional arc from dataJson
    let emotionalArc: string[] = []
    if (shape.props.dataJson) {
      try {
        const parsed = JSON.parse(shape.props.dataJson)
        const fw = parsed?.frameworks?.find((f: { id: string }) => f.id === parsed?.selectedFrameworkId)
        emotionalArc = fw?.emotionalArc ?? []
      } catch {
        emotionalArc = []
      }
    }

    // Curve status badge
    const curveLabel =
      status === 'curve_approved' ? 'curva aprobada' :
      status === 'curve_generated' ? 'curva generada' :
      null
    const curveBadge = status === 'curve_approved'
      ? { bg: C.badgeTealBg, text: C.badgeTealText }
      : { bg: C.badgeAmberBg, text: C.badgeAmberText }

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
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: isEmpty ? C.bg : C.bgSecondary,
          borderRadius: '12px',
          border: `1.5px solid ${C.border}`,
          padding: '20px',
          boxSizing: 'border-box' as const,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '12px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.textTertiary, marginBottom: '4px' }}>
                Acto #2 — Arco Narrativo
              </div>
              <div style={{ fontSize: '12px', color: C.textSecondary }}>
                {isEmpty ? 'Selecciona un framework narrativo' : 'Framework seleccionado'}
              </div>
            </div>
            {curveLabel && (
              <SmallBadge label={curveLabel} bg={curveBadge.bg} color={curveBadge.text} />
            )}
          </div>

          {/* Content */}
          {isEmpty ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px',
              backgroundColor: C.bgSecondary,
              borderRadius: '8px',
              border: `1px dashed ${C.border}`,
              textAlign: 'center' as const,
            }}>
              <div style={{ fontSize: '24px' }}>📖</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                  Sin framework seleccionado
                </div>
                <div style={{ fontSize: '11px', color: C.textSecondary }}>
                  Completa el mapa de tópicos primero, luego selecciona el arco narrativo.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Framework banner */}
              <div style={{
                padding: '12px 14px',
                backgroundColor: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{selectedFrameworkName}</div>
                  <SmallBadge
                    label={`fit ${selectedFrameworkFitScore}%`}
                    bg={fitColors.bg}
                    color={fitColors.text}
                  />
                </div>
                {/* Emotional arc pills */}
                {emotionalArc.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
                    {emotionalArc.map((arc, i) => (
                      <span key={i} style={{
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: '20px',
                        backgroundColor: C.bgTertiary,
                        color: C.textSecondary,
                        fontWeight: 500,
                      }}>
                        {arc}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Curve info */}
              {curvePointCount > 0 && (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: C.badgeTealBg,
                  border: `1px solid ${C.badgeTealText}33`,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: '12px', color: C.text }}>
                    <strong>Curva emocional</strong> · {curvePointCount} puntos
                  </div>
                  <SmallBadge
                    label={status === 'curve_approved' ? 'aprobada' : 'borrador'}
                    bg={status === 'curve_approved' ? C.badgeTealBg : C.badgeAmberBg}
                    color={status === 'curve_approved' ? C.badgeTealText : C.badgeAmberText}
                  />
                </div>
              )}
            </>
          )}

          {/* Open button */}
          <button
            onPointerDown={(e) => { e.stopPropagation() }} onClick={(e) => { e.stopPropagation(); handleOpen(e as any) }}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
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
            {isEmpty ? 'Abrir Acto #2 →' : 'Abrir Acto #2 →'}
          </button>
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: TLZone2BShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
  }

  override toSvg(shape: TLZone2BShape, _ctx: SvgExportContext): React.ReactElement | null {
    const { w, h, status, selectedFrameworkName, selectedFrameworkFitScore, curvePointCount, dataJson } = shape.props

    // Design tokens
    const BG = '#FFFFFF'
    const BG2 = '#F7F7F5'
    const BORDER = '#E5E2DA'
    const TEXT = '#1A1A18'
    const TEXT3 = '#9B9895'
    const ACCENT = '#185FA5'
    const TEAL = '#0F6E56'
    const TEAL_BG = '#E1F5EE'
    const AMBER_BG = '#FAEEDA'
    const AMBER = '#633806'

    const statusLabel =
      status === 'curve_approved' ? 'curva aprobada' :
      status === 'curve_generated' ? 'curva generada' :
      status === 'framework_selected' ? 'framework ok' : 'pendiente'
    const statusBg = status === 'curve_approved' ? TEAL_BG : status === 'curve_generated' ? AMBER_BG : BG2
    const statusColor = status === 'curve_approved' ? TEAL : status === 'curve_generated' ? AMBER : TEXT3

    // Parse curve points for mini-chart
    let curvePoints: Array<{ slide: number; intensity: number }> = []
    try {
      if (dataJson) {
        const parsed = JSON.parse(dataJson)
        if (Array.isArray(parsed?.curvePoints)) {
          curvePoints = parsed.curvePoints.map((p: { slide: number; intensity: number }) => ({
            slide: p.slide,
            intensity: p.intensity,
          }))
        }
      }
    } catch { /* empty */ }

    const hasFramework = status !== 'empty' && selectedFrameworkName
    const fitColors = fitScoreColor(selectedFrameworkFitScore)

    const headerH = 56
    const chartH = curvePoints.length > 1 ? 70 : 0
    const rowsStartY = headerH + chartH + 8
    const rows: Array<{ label: string; value: string }> = []
    if (hasFramework) rows.push({ label: 'Framework', value: `${selectedFrameworkName} · fit ${selectedFrameworkFitScore}%` })
    rows.push({ label: 'Puntos de curva', value: `${curvePointCount}` })
    rows.push({ label: 'Estado', value: statusLabel })

    const rowH = 30
    const svgH = Math.min(h, rowsStartY + rows.length * rowH + 16)

    // Build mini chart polyline
    let polylinePoints = ''
    if (curvePoints.length > 1) {
      const chartX = 16
      const chartY = headerH + 8
      const chartW = w - 32
      const chartInnerH = 54
      const maxSlide = Math.max(...curvePoints.map((p) => p.slide), 1)
      polylinePoints = curvePoints
        .map((p) => {
          const px = chartX + (p.slide / maxSlide) * chartW
          const py = chartY + chartInnerH - (p.intensity / 10) * chartInnerH
          return `${px.toFixed(1)},${py.toFixed(1)}`
        })
        .join(' ')
    }

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
          ACTO #2 — CURVA EMOCIONAL
        </text>

        <rect x={w - 120} y={14} width={104} height={18} rx={4} fill={statusBg} />
        <text x={w - 68} y={27} fontSize={10} fontWeight={600} fill={statusColor} fontFamily="system-ui, sans-serif" textAnchor="middle">
          {statusLabel}
        </text>

        <line x1={16} y1={56} x2={w - 16} y2={56} stroke={BORDER} strokeWidth={1} />

        {/* Mini chart */}
        {curvePoints.length > 1 && (
          <g>
            {/* Chart background */}
            <rect x={16} y={headerH + 4} width={w - 32} height={62} rx={4} fill={BG} stroke={BORDER} strokeWidth={1} />
            {/* Grid lines */}
            {[0, 5, 10].map((val) => {
              const y = headerH + 8 + 54 - (val / 10) * 54
              return (
                <g key={val}>
                  <line x1={16} y1={y} x2={w - 16} y2={y} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3,3" />
                  <text x={20} y={y - 2} fontSize={7} fill={TEXT3} fontFamily="system-ui, sans-serif">{val}</text>
                </g>
              )
            })}
            {/* Curve line */}
            <polyline
              points={polylinePoints}
              fill="none"
              stroke={ACCENT}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Dots */}
            {curvePoints.slice(0, 20).map((p, i) => {
              const chartX = 16
              const chartW = w - 32
              const maxSlide = Math.max(...curvePoints.map((cp) => cp.slide), 1)
              const px = chartX + (p.slide / maxSlide) * chartW
              const py = headerH + 8 + 54 - (p.intensity / 10) * 54
              return <circle key={i} cx={px} cy={py} r={2.5} fill={ACCENT} />
            })}
          </g>
        )}

        {/* Info rows */}
        {rows.map((row, i) => (
          <g key={i}>
            <rect x={16} y={rowsStartY + i * rowH} width={w - 32} height={rowH - 4} rx={4} fill={i % 2 === 0 ? BG : BG2} />
            <text x={24} y={rowsStartY + i * rowH + 12} fontSize={9} fontWeight={600} fill={TEXT3} fontFamily="system-ui, sans-serif" letterSpacing={1}>
              {row.label.toUpperCase()}
            </text>
            <text x={24} y={rowsStartY + i * rowH + 25} fontSize={11} fill={TEXT} fontFamily="system-ui, sans-serif">
              {row.value.slice(0, Math.floor((w - 48) / 6.5))}
            </text>
          </g>
        ))}
      </svg>
    )
  }
}

export const zone2bShapeUtil = Zone2BShapeUtil
