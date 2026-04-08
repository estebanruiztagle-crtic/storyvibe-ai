import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
} from 'tldraw'
import { useZonePanel } from '@/lib/zone-panel-context'

type OverallStatus = 'empty' | 'in_progress' | 'ready' | 'blocked'

type Zone5ShapeProps = {
  w: number
  h: number
  presentationId: string
  overallStatus: OverallStatus
  slidesReady: number
  slidesTotal: number
  passCount: number
  warnCount: number
  failCount: number
  exportBlocked: boolean
  dataJson: string
}

export type TLZone5Shape = TLBaseShape<'zone5', Zone5ShapeProps>

// ─── Light cream theme (exact prototype tokens) ───────────────────────────────
const C = {
  bg: '#f7f6f3',
  surface: '#ffffff',
  surface2: '#f0efe9',
  surface3: '#e8e6df',
  border: '#dddbd3',
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
} as const

const STATUS_COLORS: Record<OverallStatus, string> = {
  empty: C.text3,
  in_progress: C.warn,
  ready: C.pass,
  blocked: C.fail,
}

const STATUS_LABELS: Record<OverallStatus, string> = {
  empty: 'Vacío',
  in_progress: 'En progreso',
  ready: 'Listo',
  blocked: 'Bloqueado',
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export class Zone5ShapeUtil extends BaseBoxShapeUtil<TLZone5Shape> {
  static override type = 'zone5' as const

  static override props: RecordProps<TLZone5Shape> = {
    w: T.number,
    h: T.number,
    presentationId: T.string,
    overallStatus: T.literalEnum('empty', 'in_progress', 'ready', 'blocked'),
    slidesReady: T.number,
    slidesTotal: T.number,
    passCount: T.number,
    warnCount: T.number,
    failCount: T.number,
    exportBlocked: T.boolean,
    dataJson: T.string,
  }

  override getDefaultProps(): Zone5ShapeProps {
    return {
      w: 640,
      h: 340,
      presentationId: '',
      overallStatus: 'empty',
      slidesReady: 0,
      slidesTotal: 0,
      passCount: 0,
      warnCount: 0,
      failCount: 0,
      exportBlocked: true,
      dataJson: '',
    }
  }

  override component(shape: TLZone5Shape) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { openPanel } = useZonePanel()
    const {
      w, h, overallStatus,
      slidesReady, slidesTotal,
      passCount, warnCount, failCount,
      exportBlocked,
    } = shape.props

    const statusColor = STATUS_COLORS[overallStatus]
    const readinessPct = slidesTotal > 0 ? Math.round((slidesReady / slidesTotal) * 100) : 0
    const pendingCount = Math.max(0, slidesTotal - passCount - warnCount - failCount)

    // Build mini filmstrip
    const blockCount = Math.min(Math.max(slidesTotal, 6), 12)
    const blocks: string[] = []
    for (let i = 0; i < passCount && blocks.length < blockCount; i++) blocks.push(C.pass)
    for (let i = 0; i < warnCount && blocks.length < blockCount; i++) blocks.push(C.warn)
    for (let i = 0; i < failCount && blocks.length < blockCount; i++) blocks.push(C.fail)
    while (blocks.length < blockCount) blocks.push(C.text3)

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: w,
          height: h,
          backgroundColor: C.bg,
          borderRadius: '10px',
          border: `1.5px solid ${overallStatus === 'empty' ? C.border : statusColor + '60'}`,
          padding: '22px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          pointerEvents: 'all',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }} onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); openPanel('zone5', shape.id); }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{
              fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: C.text3, marginBottom: '3px', fontFamily: 'monospace',
            }}>
              zona 5
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: C.text }}>
              storyboard
            </div>
          </div>
          <span style={{
            fontSize: '10px', padding: '3px 10px', borderRadius: '20px',
            backgroundColor: overallStatus === 'empty' ? C.surface3 : `${statusColor}15`,
            color: overallStatus === 'empty' ? C.text3 : statusColor,
            border: `0.5px solid ${overallStatus === 'empty' ? C.border : statusColor + '40'}`,
            letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
          }}>
            {STATUS_LABELS[overallStatus]}
          </span>
        </div>

        {/* Mini filmstrip */}
        {slidesTotal === 0 ? (
          <div style={{
            height: '44px', marginBottom: '16px',
            backgroundColor: C.surface,
            border: `1px dashed ${C.border}`,
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '11px', color: C.text3 }}>
              Abre el panel para ver el storyboard →
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '3px', marginBottom: '16px' }}>
            {blocks.map((color, i) => (
              <div key={i} style={{
                flex: 1,
                height: '44px',
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${color}`,
                borderRadius: '4px',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                paddingBottom: '4px',
              }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: color }} />
              </div>
            ))}
          </div>
        )}

        {/* Readiness counts */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { count: passCount, color: C.pass, label: 'listo' },
            { count: warnCount, color: C.warn, label: 'alerta' },
            { count: failCount, color: C.fail, label: 'fallo' },
            { count: pendingCount, color: C.pending, label: 'pendiente' },
          ].map(({ count, color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontFamily: 'monospace' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
              <span style={{ color: C.text2 }}>{count} {label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '5px' }}>
            <span style={{ color: C.text3, fontFamily: 'monospace' }}>preparación del storyboard</span>
            <span style={{ color: statusColor, fontWeight: 500 }}>
              {slidesReady}/{slidesTotal || 0} ({readinessPct}%)
            </span>
          </div>
          <div style={{ height: '4px', backgroundColor: C.surface3, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${readinessPct}%`,
              backgroundColor: statusColor,
              borderRadius: '2px',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* Export status */}
        <div style={{
          padding: '8px 12px',
          backgroundColor: C.surface,
          borderRadius: '6px',
          border: `0.5px solid ${C.border}`,
          fontSize: '11px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: C.text2, fontFamily: 'monospace' }}>exportar a canva</span>
          <span style={{
            fontWeight: 500,
            color: exportBlocked ? C.fail : C.pass,
            fontSize: '10px', padding: '2px 8px',
            backgroundColor: exportBlocked ? C.failBg : C.passBg,
            borderRadius: '3px', fontFamily: 'monospace',
          }}>
            {exportBlocked ? 'bloqueado' : 'habilitado'}
          </span>
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: TLZone5Shape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={10} ry={10} />
  }
}

export const zone5ShapeUtil = Zone5ShapeUtil
