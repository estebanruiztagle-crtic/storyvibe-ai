import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
  useEditor,
} from 'tldraw'
import { useZonePanel } from '@/lib/zone-panel-context'

// ─── Props ────────────────────────────────────────────────────────────────────
type Zone4ShapeProps = {
  w: number
  h: number
  presentationId: string
  status: 'empty' | 'evaluating' | 'done'
  passCount: number
  warnCount: number
  failCount: number
  totalSlides: number
  exportBlocked: boolean
  dataJson: string
}

export type TLZone4Shape = TLBaseShape<'zone4', Zone4ShapeProps>

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

// ─── Axis weight cards data ───────────────────────────────────────────────────
const AXES = [
  { label: 'Brand', weight: '0.40', desc: 'tipografía · paleta · estilo' },
  { label: 'Carga Cognitiva', weight: '0.35', desc: 'palabras · elementos · jerarquía' },
  { label: 'Alineación Emocional', weight: '0.25', desc: 'peso visual · temperatura color' },
]

// ─── ShapeUtil ────────────────────────────────────────────────────────────────
export class Zone4ShapeUtil extends BaseBoxShapeUtil<TLZone4Shape> {
  static override type = 'zone4' as const

  static override props: RecordProps<TLZone4Shape> = {
    w: T.number,
    h: T.number,
    presentationId: T.string,
    status: T.literalEnum('empty', 'evaluating', 'done'),
    passCount: T.number,
    warnCount: T.number,
    failCount: T.number,
    totalSlides: T.number,
    exportBlocked: T.boolean,
    dataJson: T.string,
  }

  override getDefaultProps(): Zone4ShapeProps {
    return {
      w: 640,
      h: 340,
      presentationId: 'default',
      status: 'empty',
      passCount: 0,
      warnCount: 0,
      failCount: 0,
      totalSlides: 0,
      exportBlocked: true,
      dataJson: '',
    }
  }

  override component(shape: TLZone4Shape) {
    return <Zone4ShapeComponent shape={shape} />
  }

  override indicator(shape: TLZone4Shape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={10} ry={10} />
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
function Zone4ShapeComponent({ shape }: { shape: TLZone4Shape }) {
  const { openPanel } = useZonePanel()
  const editor = useEditor()
  const { w, h, status, passCount, warnCount, failCount, totalSlides, exportBlocked } = shape.props

  const evaluatedCount = passCount + warnCount + failCount
  const pendingCount = totalSlides - evaluatedCount

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    editor.selectNone()
    openPanel('zone4', shape.id)
  }

  const containerStyle: React.CSSProperties = {
    width: w,
    height: h,
    backgroundColor: C.bg,
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    padding: '20px 22px',
    color: C.text,
    fontFamily: "'IBM Plex Mono', monospace",
    overflow: 'hidden',
    pointerEvents: 'all',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }

  // ── EMPTY STATE ──────────────────────────────────────────────────────────────
  if (status === 'empty') {
    return (
      <HTMLContainer id={shape.id} style={containerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: C.text3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              zona 4
            </div>
            <div style={{
              fontSize: 15,
              fontWeight: 500,
              color: C.text,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              crítico de diseño
            </div>
            <div style={{ fontSize: 10, color: C.text2, marginTop: 3, letterSpacing: '0.05em' }}>
              brand compliance · carga cognitiva · alineación emocional
            </div>
          </div>
          {/* Canva API status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 9,
            color: C.text3,
            border: `1px solid ${C.border2}`,
            borderRadius: 4,
            padding: '3px 8px',
            letterSpacing: '0.08em',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.border2 }} />
            canva API — sin conectar
          </div>
        </div>

        {/* Axis weight cards */}
        <div style={{ display: 'flex', gap: 8 }}>
          {AXES.map((axis) => (
            <div key={axis.label} style={{
              flex: 1,
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '8px 10px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 2 }}>
                {axis.weight}
              </div>
              <div style={{ fontSize: 9, color: C.text, fontWeight: 600, marginBottom: 2 }}>{axis.label}</div>
              <div style={{ fontSize: 8, color: C.text3 }}>{axis.desc}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: C.border }} />

        {/* CTA button */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }} onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); handleOpen(e as any); }}
            style={{
              width: '100%',
              padding: '10px 0',
              backgroundColor: C.accent,
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Evaluar diseño →
          </button>
        </div>
      </HTMLContainer>
    )
  }

  // ── FULL STATE (evaluating / done) ───────────────────────────────────────────
  const passPercent = totalSlides > 0 ? (passCount / totalSlides) * 100 : 0
  const warnPercent = totalSlides > 0 ? (warnCount / totalSlides) * 100 : 0
  const failPercent = totalSlides > 0 ? (failCount / totalSlides) * 100 : 0

  return (
    <HTMLContainer id={shape.id} style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.10em', textTransform: 'uppercase' }}>zona 4</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            crítico de diseño
          </div>
        </div>
        <div style={{
          backgroundColor: C.surface2,
          border: `1px solid ${C.border2}`,
          borderRadius: 12,
          padding: '2px 10px',
          fontSize: 10,
          color: C.text2,
          fontWeight: 600,
        }}>
          {evaluatedCount}/{totalSlides} evaluados
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { label: `${passCount} ok`, color: C.pass, bg: C.passBg },
          { label: `${warnCount} alerta`, color: C.warn, bg: C.warnBg },
          { label: `${failCount} fallo`, color: C.fail, bg: C.failBg },
          { label: `${pendingCount} pendiente`, color: C.text2, bg: C.surface2 },
        ].map((chip) => (
          <div key={chip.label} style={{
            backgroundColor: chip.bg,
            borderRadius: 10,
            padding: '2px 8px',
            fontSize: 9,
            color: chip.color,
            fontWeight: 600,
            border: `1px solid ${chip.color}30`,
          }}>
            {chip.label}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, backgroundColor: C.surface3, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${passPercent}%`, backgroundColor: C.pass }} />
        <div style={{ width: `${warnPercent}%`, backgroundColor: C.warn }} />
        <div style={{ width: `${failPercent}%`, backgroundColor: C.fail }} />
      </div>

      {/* Export status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        backgroundColor: exportBlocked ? C.failBg : C.passBg,
        border: `1px solid ${exportBlocked ? C.fail : C.pass}30`,
        borderRadius: 6,
        fontSize: 9,
        color: exportBlocked ? C.fail : C.pass,
        fontWeight: 600,
      }}>
        <span>{exportBlocked ? '⚠' : '✓'}</span>
        <span>{exportBlocked ? 'exportación bloqueada' : 'listo para exportar'}</span>
      </div>

      {/* CTA button */}
      <div style={{ marginTop: 'auto' }}>
        <button
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }} onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); handleOpen(e as any); }}
          style={{
            width: '100%',
            padding: '9px 0',
            backgroundColor: C.accent,
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Abrir crítico →
        </button>
      </div>
    </HTMLContainer>
  )
}

export const zone4ShapeUtil = Zone4ShapeUtil
