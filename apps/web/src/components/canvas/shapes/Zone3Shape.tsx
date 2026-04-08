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
type Zone3ShapeProps = {
  w: number
  h: number
  presentationId: string
  status: 'empty' | 'in_progress' | 'completed'
  approvedCount: number
  totalSlots: number
  dataJson: string
  // Legacy field — kept in schema so tldraw can load persisted shapes that still have it
  sessionCostUsd?: number
}

export type TLZone3Shape = TLBaseShape<'zone3', Zone3ShapeProps>

// ─── Light theme tokens ───────────────────────────────────────────────────────
const C = {
  bg:        '#FFFFFF',
  surface:   '#F9F8F5',
  surface2:  '#F1EFE8',
  border:    '#E5E2DA',
  border2:   '#D1CCBF',
  text:      '#1A1A18',
  text2:     '#6B6866',
  text3:     '#9B9895',
  text4:     '#B8B4AA',
  peak:      '#1D9E75',
  valley:    '#378ADD',
  trans:     '#EF9F27',
  blue:      '#185FA5',
}

// ─── ShapeUtil ────────────────────────────────────────────────────────────────
export class Zone3ShapeUtil extends BaseBoxShapeUtil<TLZone3Shape> {
  static override type = 'zone3' as const

  static override props: RecordProps<TLZone3Shape> = {
    w:              T.number,
    h:              T.number,
    presentationId: T.string,
    status:         T.literalEnum('empty', 'in_progress', 'completed'),
    approvedCount:  T.number,
    totalSlots:     T.number,
    dataJson:       T.string,
    // Legacy field — kept so tldraw can load persisted shapes that still have it
    sessionCostUsd: T.optional(T.number),
  }

  override getDefaultProps(): Zone3ShapeProps {
    return {
      w:              640,
      h:              340,
      presentationId: 'default',
      status:         'empty',
      approvedCount:  0,
      totalSlots:     0,
      dataJson:       '',
    }
  }

  override component(shape: TLZone3Shape) {
    return <Zone3ShapeComponent shape={shape} />
  }

  override indicator(shape: TLZone3Shape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={10} ry={10} />
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
function Zone3ShapeComponent({ shape }: { shape: TLZone3Shape }) {
  const { openPanel } = useZonePanel()
  const editor = useEditor()
  const { w, h, status, approvedCount, totalSlots, dataJson } = shape.props

  // Parse state for display
  let palette: Array<{ hex: string; role: string }> = []
  let slides: Array<{ label: string; type: string; approved: boolean; slide: number; useGraphic: boolean; hasAsset: boolean }> = []
  let paletteGenerated = false

  if (dataJson) {
    try {
      const parsed = JSON.parse(dataJson)
      if (parsed.palette?.swatches) palette = parsed.palette.swatches
      if (parsed.slides)           slides  = parsed.slides.map((s: {
        label: string; type: string; approved: boolean; slide: number
        useGraphic: boolean; uploadedAsset?: { name: string }
      }) => ({ ...s, hasAsset: !!s.uploadedAsset }))
      paletteGenerated = !!parsed.paletteGenerated
    } catch {
      // ignore
    }
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    editor.selectNone()
    openPanel('zone3', shape.id)
  }

  const containerStyle: React.CSSProperties = {
    width:           w,
    height:          h,
    backgroundColor: C.bg,
    borderRadius:    10,
    border:          `1.5px solid ${status === 'completed' ? C.peak : C.border}`,
    padding:         '18px 20px',
    color:           C.text,
    fontFamily:      "'Inter', sans-serif",
    overflow:        'hidden',
    pointerEvents:   'all',
    boxSizing:       'border-box',
    display:         'flex',
    flexDirection:   'column',
    gap:             12,
  }

  // ── EMPTY STATE ──────────────────────────────────────────────────────────────
  if (status === 'empty') {
    return (
      <HTMLContainer id={shape.id} style={containerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              zona 3
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
              Diseño visual
            </div>
            <div style={{ fontSize: 10, color: C.text2, marginTop: 3 }}>
              paleta de colores · gráficos · assets
            </div>
          </div>
          <div style={{
            fontSize: 9, color: C.text3, border: `1px solid ${C.border2}`,
            borderRadius: 4, padding: '3px 8px', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            sin configurar
          </div>
        </div>

        {/* Palette placeholder */}
        <div style={{
          backgroundColor: C.surface, border: `1px dashed ${C.border2}`,
          borderRadius: 8, padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#1A2F4E', '#2563EB', '#10B981', '#6B7280', '#F9FAFB'].map((c) => (
              <div key={c} style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: c, opacity: 0.4, border: `1px solid ${C.border}` }} />
            ))}
          </div>
          <span style={{ fontSize: 10, color: C.text4 }}>paleta de colores — sin generar</span>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: '🎨', label: 'Paleta IA' },
            { icon: '📊', label: 'Gráficos' },
            { icon: '📎', label: 'Tus assets' },
          ].map((f) => (
            <div key={f.label} style={{
              flex: 1, backgroundColor: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <span style={{ fontSize: 10, color: C.text2, fontWeight: 600 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
            onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); handleOpen(e as unknown as React.MouseEvent) }}
            style={{
              width: '100%', padding: '10px 0', backgroundColor: C.blue, color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 12, fontFamily: "'Inter', sans-serif",
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Diseño visual →
          </button>
        </div>
      </HTMLContainer>
    )
  }

  // ── FULL STATE ────────────────────────────────────────────────────────────────
  const pct = totalSlots > 0 ? Math.round((approvedCount / totalSlots) * 100) : 0
  const visibleSlides = slides.slice(0, 12)

  return (
    <HTMLContainer id={shape.id} style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.10em', textTransform: 'uppercase' }}>zona 3</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Diseño visual</div>
        </div>
        <div style={{
          backgroundColor: status === 'completed' ? '#E1F5EE' : C.surface,
          border:          `1px solid ${status === 'completed' ? C.peak : C.border2}`,
          borderRadius:    12, padding: '3px 10px', fontSize: 10,
          color:           status === 'completed' ? C.peak : C.text2, fontWeight: 600,
        }}>
          {approvedCount}/{totalSlots} aprobadas
        </div>
      </div>

      {/* Palette swatches */}
      {palette.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.10em', flexShrink: 0 }}>
            paleta
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {palette.slice(0, 7).map((sw, i) => (
              <div
                key={i}
                title={sw.hex}
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  backgroundColor: sw.hex, border: `1px solid ${C.border}`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {!paletteGenerated && (
        <div style={{
          backgroundColor: C.surface, border: `1px dashed ${C.border2}`,
          borderRadius: 6, padding: '6px 10px', fontSize: 9, color: C.text4,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🎨 <span>Paleta pendiente de generar</span>
        </div>
      )}

      {/* Slide pills */}
      {visibleSlides.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {visibleSlides.map((slide, i) => {
            const dotColor = slide.approved ? C.peak : slide.useGraphic || slide.hasAsset ? C.trans : C.text4
            return (
              <div key={i} style={{
                backgroundColor: slide.approved ? '#E1F5EE' : C.surface,
                border:          `1px solid ${slide.approved ? C.peak : C.border}`,
                borderRadius:    5, padding: '4px 6px',
                display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                <span style={{ fontSize: 8, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slide.slide}. {slide.label}
                </span>
              </div>
            )
          })}
          {slides.length > 12 && (
            <div style={{
              backgroundColor: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 5, padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 8, color: C.text3 }}>+{slides.length - 12}</span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: C.text3 }}>progreso general</span>
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600 }}>{pct}%</span>
        </div>
        <div style={{ height: 4, backgroundColor: C.surface2, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: C.peak, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 'auto' }}>
        <button
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
          onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); handleOpen(e as unknown as React.MouseEvent) }}
          style={{
            width: '100%', padding: '9px 0',
            backgroundColor: status === 'completed' ? C.peak : C.blue,
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 11,
            fontFamily: "'Inter', sans-serif", fontWeight: 600, cursor: 'pointer',
          }}
        >
          {status === 'completed' ? '✓ Diseño visual completo' : 'Continuar diseño visual →'}
        </button>
      </div>
    </HTMLContainer>
  )
}

export const zone3ShapeUtil = Zone3ShapeUtil
