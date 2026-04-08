import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
} from 'tldraw'

type CurveStatus = 'draft' | 'approved' | 'locked'

type EmotionalCurveShapeProps = {
  w: number
  h: number
  title: string
  status: CurveStatus
  version: number
  tension_score: number
  point_count: number
  presentationId: string
}

export type TLEmotionalCurveShape = TLBaseShape<'emotional_curve', EmotionalCurveShapeProps>

const STATUS_COLORS: Record<CurveStatus, string> = {
  draft: '#F59E0B',
  approved: '#10B981',
  locked: '#6366F1',
}

const STATUS_ICONS: Record<CurveStatus, string> = {
  draft: '✏️',
  approved: '✓',
  locked: '🔒',
}

/**
 * Generates a smooth SVG path from an array of intensity values (0–1).
 */
function buildCurvePath(points: number[], width: number, height: number): string {
  if (points.length < 2) return ''

  const padX = 20
  const padY = 16
  const usableW = width - padX * 2
  const usableH = height - padY * 2

  const coords = points.map((v, i) => ({
    x: padX + (i / (points.length - 1)) * usableW,
    y: padY + (1 - v) * usableH,
  }))

  let d = `M ${coords[0]!.x} ${coords[0]!.y}`
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]!
    const curr = coords[i]!
    const cpX = (prev.x + curr.x) / 2
    d += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`
  }
  return d
}

// Sample emotional arc: curiosidad → tension → alivio → excitacion → confianza
const SAMPLE_POINTS = [0.35, 0.5, 0.75, 0.6, 0.8, 0.55, 0.45, 0.7, 0.9, 0.85, 0.95]

export class EmotionalCurveShapeUtil extends BaseBoxShapeUtil<TLEmotionalCurveShape> {
  static override type = 'emotional_curve' as const

  static override props: RecordProps<TLEmotionalCurveShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    status: T.literalEnum('draft', 'approved', 'locked'),
    version: T.number,
    tension_score: T.number,
    point_count: T.number,
    presentationId: T.string,
  }

  override getDefaultProps(): EmotionalCurveShapeProps {
    return {
      w: 640,
      h: 380,
      title: 'Curva Emocional',
      status: 'draft',
      version: 1,
      tension_score: 0.72,
      point_count: 11,
      presentationId: '',
    }
  }

  override component(shape: TLEmotionalCurveShape) {
    const { w, h, title, status, version, tension_score, point_count } = shape.props
    const color = STATUS_COLORS[status]

    const chartW = w - 48
    const chartH = 140
    const curvePath = buildCurvePath(SAMPLE_POINTS, chartW, chartH)

    const tensionPct = Math.round(tension_score * 100)

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: w,
          height: h,
          backgroundColor: '#0D1117',
          borderRadius: '14px',
          border: `2px solid ${color}`,
          padding: '24px',
          color: '#F5F5F5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          pointerEvents: 'all',
          boxSizing: 'border-box',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: '#F5F5F5' }}>
              {title}
            </h2>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6B7280' }}>
              <span>v{version}</span>
              <span>{point_count} puntos</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                padding: '3px 10px',
                borderRadius: '20px',
                backgroundColor: color,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {STATUS_ICONS[status]} {status}
            </span>
            <div
              style={{
                fontSize: '11px',
                color: '#9CA3AF',
                textAlign: 'right',
              }}
            >
              Tension: <span style={{ color, fontWeight: 600 }}>{tensionPct}%</span>
            </div>
          </div>
        </div>

        {/* SVG Curve Chart */}
        <div
          style={{
            backgroundColor: '#161B22',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          {/* Y-axis labels */}
          <div
            style={{
              position: 'absolute',
              left: '4px',
              top: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: `${chartH}px`,
            }}
          >
            {['alta', 'med', 'baja'].map((l) => (
              <span key={l} style={{ fontSize: '9px', color: '#374151' }}>
                {l}
              </span>
            ))}
          </div>

          <svg
            width={chartW}
            height={chartH}
            style={{ display: 'block', marginLeft: '14px' }}
            overflow="visible"
          >
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((v) => (
              <line
                key={v}
                x1={20}
                y1={16 + (1 - v) * (chartH - 32)}
                x2={chartW - 20}
                y2={16 + (1 - v) * (chartH - 32)}
                stroke="#1F2937"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}

            {/* Gradient fill under curve */}
            <defs>
              <linearGradient id={`curve-grad-${shape.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Fill path */}
            <path
              d={`${curvePath} L ${chartW - 20} ${chartH - 16} L 20 ${chartH - 16} Z`}
              fill={`url(#curve-grad-${shape.id})`}
            />

            {/* Curve line */}
            <path
              d={curvePath}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {SAMPLE_POINTS.map((v, i) => {
              const x = 20 + (i / (SAMPLE_POINTS.length - 1)) * (chartW - 40)
              const y = 16 + (1 - v) * (chartH - 32)
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill={v > 0.7 ? color : '#1F2937'}
                  stroke={color}
                  strokeWidth={1.5}
                />
              )
            })}
          </svg>

          {/* X-axis slide numbers */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              marginLeft: '14px',
              paddingLeft: '12px',
              paddingRight: '12px',
            }}
          >
            {SAMPLE_POINTS.map((_, i) => (
              <span
                key={i}
                style={{ fontSize: '9px', color: '#374151', textAlign: 'center' }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'Tension score', value: `${tensionPct}%`, color },
            { label: 'Ritmo', value: 'Balanceado', color: '#3B82F6' },
            { label: 'Valleys seguidos', value: '0', color: '#10B981' },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#161B22',
                borderRadius: '8px',
                borderTop: `2px solid ${m.color}`,
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#0A0E13',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#6B7280',
            borderLeft: `3px solid ${color}`,
          }}
        >
          Alimenta: Zona 3 (assets) · Zona 4 (revisión de diseño) · Zona 5 (storyboard)
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: TLEmotionalCurveShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={14}
        ry={14}
      />
    )
  }
}

export const emotionalCurveShapeUtil = EmotionalCurveShapeUtil
