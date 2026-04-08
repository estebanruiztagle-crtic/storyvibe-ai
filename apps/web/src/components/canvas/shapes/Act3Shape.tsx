'use client'
import React from 'react'
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  SvgExportContext,
  T,
  TLBaseShape,
  useEditor,
} from 'tldraw'
import { useEffect, useRef } from 'react'
import { useZonePanel } from '@/lib/zone-panel-context'
import type { Act3State, ColorPalette } from '@/components/zones/act3/types'
import { PALETTES } from '@/components/zones/act3/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  bgSecondary: '#F7F7F5',
  bgTertiary: '#EFECE4',
  border: '#E5E2DA',
  text: '#1A1A18',
  textSecondary: '#6B6866',
  textTertiary: '#9B9895',
  accent: '#6B3FA0',
  accentBg: '#EEEDFE',
  accentText: '#3C3489',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Act3Status = 'empty' | 'configuring' | 'generating' | 'ready'

type Act3ShapeProps = {
  w: number
  h: number
  presentationId: string
  status: Act3Status
  slideCount: number
  paletteId: string
  dataJson: string
}

export type TLAct3Shape = TLBaseShape<'act3', Act3ShapeProps>

// ─── Shape Util ───────────────────────────────────────────────────────────────
export class Act3ShapeUtil extends BaseBoxShapeUtil<TLAct3Shape> {
  static override type = 'act3' as const

  static override props: RecordProps<TLAct3Shape> = {
    w: T.number,
    h: T.number,
    presentationId: T.string,
    status: T.literalEnum('empty', 'configuring', 'generating', 'ready'),
    slideCount: T.number,
    paletteId: T.string,
    dataJson: T.string,
  }

  override getDefaultProps(): Act3ShapeProps {
    return {
      w: 700,
      h: 360,
      presentationId: '',
      status: 'empty',
      slideCount: 0,
      paletteId: 'midnight',
      dataJson: '',
    }
  }

  override component(shape: TLAct3Shape) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { openPanel } = useZonePanel()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const editor = useEditor()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const measureRef = useRef<HTMLDivElement>(null)

    // Auto-resize
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const el = measureRef.current
      if (!el) return
      const observer = new ResizeObserver(() => {
        const naturalH = el.offsetHeight
        if (naturalH > 10 && Math.abs(naturalH - shape.props.h) > 4) {
          editor.run(() => {
            editor.updateShape<TLAct3Shape>({
              id: shape.id,
              type: 'act3',
              props: { h: Math.max(200, naturalH) },
            })
          }, { history: 'ignore' })
        }
      })
      observer.observe(el)
      return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, shape.id])

    const handleOpen = (e: React.MouseEvent) => {
      e.stopPropagation()
      openPanel('act3', shape.id)
    }

    let state: Act3State | null = null
    if (shape.props.dataJson) {
      try {
        state = JSON.parse(shape.props.dataJson) as Act3State
      } catch {
        state = null
      }
    }

    const palette: ColorPalette =
      PALETTES.find((p) => p.id === shape.props.paletteId) ?? PALETTES[0]!
    const isReady = shape.props.status === 'ready'
    const slideCount = shape.props.slideCount

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: 'all',
          overflow: 'visible',
          borderRadius: 12,
        }}
      >
        <div
          ref={measureRef}
          style={{ width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          <div
            style={{
              backgroundColor: C.bg,
              borderRadius: 12,
              border: `1.5px solid ${isReady ? '#6B3FA044' : C.border}`,
              padding: 20,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🎨</span>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: C.textTertiary,
                    }}
                  >
                    Acto #3 — Diseño
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary }}>
                  {isReady
                    ? `${slideCount} slides · Look & Feel aplicado`
                    : slideCount > 0
                    ? `${slideCount} slides generadas`
                    : 'Look & Feel + Contenido de slides'}
                </div>
              </div>
              <div
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  backgroundColor: isReady ? '#EEEDFE' : '#F1EFE8',
                  color: isReady ? '#3C3489' : '#6B6866',
                }}
              >
                {shape.props.status === 'empty'
                  ? 'pendiente'
                  : shape.props.status === 'ready'
                  ? 'listo'
                  : shape.props.status}
              </div>
            </div>

            {/* ── Palette preview ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: C.textTertiary,
                }}
              >
                Paleta · {palette.name}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  palette.primary,
                  palette.secondary,
                  palette.accent,
                  palette.surface,
                  palette.textColor,
                ].map((color, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 24,
                      borderRadius: 4,
                      backgroundColor: color,
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── Slide thumbnails if ready ── */}
            {isReady && state?.slides && state.slides.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: C.textTertiary,
                  }}
                >
                  Slides generadas
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {state.slides.slice(0, 8).map((slide) => (
                    <div
                      key={slide.slideNumber}
                      style={{
                        width: 72,
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,0.08)',
                        backgroundColor: palette.background,
                      }}
                    >
                      <div
                        style={{
                          padding: '4px 5px',
                          minHeight: 44,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 6,
                            color: palette.textColor,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            opacity: 0.9,
                          }}
                        >
                          {slide.title.slice(0, 30)}
                        </div>
                        {slide.images[0] && (
                          <div
                            style={{
                              height: 18,
                              borderRadius: 2,
                              marginTop: 3,
                              backgroundColor: palette.accent + '33',
                              border: `1px dashed ${palette.accent}66`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ fontSize: 8, color: palette.accent, opacity: 0.8 }}>
                              IMG
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ backgroundColor: palette.accent, height: 2 }} />
                    </div>
                  ))}
                  {state.slides.length > 8 && (
                    <div
                      style={{
                        width: 72,
                        borderRadius: 4,
                        border: '1px solid #E5E2DA',
                        backgroundColor: '#F7F7F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: 9, color: C.textTertiary }}>
                        +{state.slides.length - 8}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── CTA Button ── */}
            <button
              onPointerDown={(e) => { e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); handleOpen(e) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '11px',
                backgroundColor: C.accent,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                pointerEvents: 'all',
                textAlign: 'center',
              }}
            >
              {isReady ? '🎨 Abrir Acto #3 →' : 'Abrir Acto #3 — Diseño →'}
            </button>
          </div>
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: TLAct3Shape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
  }

  override toSvg(shape: TLAct3Shape, _ctx: SvgExportContext): React.ReactElement | null {
    const { w, h, status, slideCount, paletteId, dataJson } = shape.props

    let state: Act3State | null = null
    try {
      if (dataJson) state = JSON.parse(dataJson) as Act3State
    } catch { /* empty */ }

    const palette: ColorPalette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0]!

    // Design tokens (card uses neutral theme regardless of presentation palette)
    const BG = '#FFFFFF'
    const BG2 = '#F7F7F5'
    const BORDER = '#E5E2DA'
    const TEXT = '#1A1A18'
    const TEXT3 = '#9B9895'
    const ACCENT = '#6B3FA0'
    const ACCENT_BG = '#EEEDFE'

    const statusLabel = status === 'ready' ? 'listo' : status === 'generating' ? 'generando' : status === 'configuring' ? 'configurando' : 'pendiente'
    const statusBg = status === 'ready' ? ACCENT_BG : BG2
    const statusColor = status === 'ready' ? ACCENT : TEXT3

    const laf = state?.lookAndFeel
    const typographyStyle = laf?.typographyStyle ?? 'modern'
    const visualDensity = laf?.visualDensity ?? 'balanced'

    const paletteColors = [
      palette.primary,
      palette.secondary,
      palette.accent,
      palette.surface,
      palette.textColor,
    ]

    const headerH = 72
    const swatchH = 36
    const rowsStartY = headerH + swatchH + 8
    const rows: Array<{ label: string; value: string }> = [
      { label: 'Tipografía', value: typographyStyle },
      { label: 'Densidad', value: visualDensity },
      { label: 'Slides', value: `${slideCount}` },
    ]

    const slides = state?.slides ?? []
    const firstSlides = slides.slice(0, 5)
    const rowH = 28
    const slideRowH = 24
    const svgH = Math.min(
      h,
      rowsStartY + rows.length * rowH + (firstSlides.length > 0 ? 20 + firstSlides.length * slideRowH : 0) + 24
    )

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
          ACTO #3 — DISEÑO
        </text>

        <rect x={w - 100} y={14} width={84} height={18} rx={4} fill={statusBg} />
        <text x={w - 58} y={27} fontSize={10} fontWeight={600} fill={statusColor} fontFamily="system-ui, sans-serif" textAnchor="middle">
          {statusLabel}
        </text>

        {/* Palette label */}
        <text x={16} y={48} fontSize={9} fontWeight={600} fill={TEXT3} fontFamily="system-ui, sans-serif" letterSpacing={1}>
          PALETA · {palette.name.toUpperCase()}
        </text>

        <line x1={16} y1={56} x2={w - 16} y2={56} stroke={BORDER} strokeWidth={1} />

        {/* Color swatches */}
        {paletteColors.map((color, i) => {
          const swatchW = Math.floor((w - 52) / 5)
          const x = 16 + i * (swatchW + 4)
          return (
            <g key={i}>
              <rect x={x} y={headerH - 4} width={swatchW} height={22} rx={4} fill={color} stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
            </g>
          )
        })}

        <line x1={16} y1={headerH + swatchH - 4} x2={w - 16} y2={headerH + swatchH - 4} stroke={BORDER} strokeWidth={1} />

        {/* Info rows */}
        {rows.map((row, i) => (
          <g key={i}>
            <rect x={16} y={rowsStartY + i * rowH} width={w - 32} height={rowH - 4} rx={4} fill={i % 2 === 0 ? BG : BG2} />
            <text x={24} y={rowsStartY + i * rowH + 12} fontSize={9} fontWeight={600} fill={TEXT3} fontFamily="system-ui, sans-serif" letterSpacing={1}>
              {row.label.toUpperCase()}
            </text>
            <text x={120} y={rowsStartY + i * rowH + 12} fontSize={11} fill={TEXT} fontFamily="system-ui, sans-serif">
              {row.value}
            </text>
          </g>
        ))}

        {/* Slide titles */}
        {firstSlides.length > 0 && (
          <g>
            <text x={16} y={rowsStartY + rows.length * rowH + 16} fontSize={9} fontWeight={700} fill={TEXT3} fontFamily="system-ui, sans-serif" letterSpacing={1}>
              SLIDES GENERADAS
            </text>
            {firstSlides.map((slide, i) => {
              const y = rowsStartY + rows.length * rowH + 28 + i * slideRowH
              return (
                <g key={i}>
                  <circle cx={24} cy={y - 4} r={3} fill={ACCENT} />
                  <text x={32} y={y} fontSize={10} fill={TEXT} fontFamily="system-ui, sans-serif">
                    {`${slide.slideNumber}. ${slide.title.slice(0, Math.floor((w - 60) / 6.2))}`}
                  </text>
                </g>
              )
            })}
            {slides.length > 5 && (
              <text
                x={32}
                y={rowsStartY + rows.length * rowH + 28 + firstSlides.length * slideRowH}
                fontSize={9}
                fill={TEXT3}
                fontFamily="system-ui, sans-serif"
              >
                +{slides.length - 5} más…
              </text>
            )}
          </g>
        )}
      </svg>
    )
  }
}

export const act3ShapeUtil = Act3ShapeUtil
