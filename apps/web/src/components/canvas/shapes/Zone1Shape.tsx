import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  SvgExportContext,
  T,
  TLBaseShape,
  useEditor,
} from 'tldraw'
import React, { useEffect, useRef } from 'react'
import { useZonePanel } from '@/lib/zone-panel-context'
import type { Zone1Context } from '@/components/zones/zone1/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  bgSecondary: '#F7F7F5',
  bgTertiary: '#EFECE4',
  border: '#E5E2DA',
  text: '#1A1A18',
  textSecondary: '#6B6866',
  textTertiary: '#9B9895',
  accentBlue: '#185FA5',
  accentTeal: '#0F6E56',
  accentAmber: '#8C4A00',
  accentPurple: '#3C3489',
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
  badgeRedBg: '#FCEBEB',
  badgeRedText: '#791F1F',
  dangerDot: '#E24B4A',
  warningDot: '#EF9F27',
  successDot: '#17A35E',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Zone1Status = 'empty' | 'in_progress' | 'validated'

type Zone1ShapeProps = {
  w: number
  h: number
  presentationId: string
  status: Zone1Status
  completeness: number
  contextJson: string
}

export type TLZone1Shape = TLBaseShape<'zone1', Zone1ShapeProps>

// ─── Inline helper components (functions returning JSX) ───────────────────────
function Badge({
  label,
  bg,
  color,
}: {
  label: string
  bg: string
  color: string
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: C.textTertiary,
        marginBottom: '6px',
      }}
    >
      {label}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        padding: '14px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function FieldLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: C.textTertiary,
        marginBottom: '3px',
      }}
    >
      {label}
    </div>
  )
}

function FieldVal({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontSize: '12px',
        color: C.text,
        lineHeight: 1.4,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: C.border,
        margin: '10px 0',
      }}
    />
  )
}

function FieldGrid({
  children,
  cols = 3,
}: {
  children: React.ReactNode
  cols?: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '10px',
      }}
    >
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel label={label} />
      <FieldVal>{children}</FieldVal>
    </div>
  )
}

function CompletenessBar({ value }: { value: number }) {
  const color =
    value >= 80 ? C.accentTeal : value >= 40 ? C.accentAmber : C.textTertiary
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '80px',
          height: '4px',
          backgroundColor: C.bgTertiary,
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '2px',
          }}
        />
      </div>
      <span style={{ fontSize: '10px', color: C.textSecondary, fontWeight: 600 }}>
        {value}%
      </span>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({
  onStart,
}: {
  onStart: (e: React.MouseEvent) => void
}) {
  const inputModes = [
    { icon: '⌨️', label: 'Texto', sub: 'Escribe o pega contenido' },
    { icon: '🎙', label: 'Voz', sub: 'Transcripción en directo' },
    { icon: '🖼', label: 'Imágenes', sub: 'Análisis visual con IA' },
    { icon: '🎵', label: 'Audio', sub: 'Transcripción automática' },
  ]

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: C.bg,
        borderRadius: '12px',
        border: `1.5px solid ${C.border}`,
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.textTertiary,
              marginBottom: '4px',
            }}
          >
            Acto #1 — Diagnóstico
          </div>
          <div style={{ fontSize: '13px', color: C.textSecondary }}>
            Fuente de verdad para todos los agentes
          </div>
        </div>
        <CompletenessBar value={0} />
      </div>

      {/* Input mode pills — only real capabilities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {inputModes.map((m) => (
          <div
            key={m.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: C.bgSecondary,
              borderRadius: '8px',
              border: `1px solid ${C.border}`,
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{m.icon}</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{m.label}</div>
              <div style={{ fontSize: '10px', color: C.textTertiary, marginTop: '1px' }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button
        onPointerDown={(e) => { e.stopPropagation() }}
        onClick={(e) => { e.stopPropagation(); onStart(e as any) }}
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
          pointerEvents: 'all',
          textAlign: 'center',
        }}
      >
        Iniciar diagnóstico →
      </button>

      {/* Subtle description */}
      <div
        style={{
          fontSize: '11px',
          color: C.textTertiary,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        Agrega fuentes multi-modal. El agente construye el contexto y lo propaga.
      </div>
    </div>
  )
}

// ─── Full Context Card ─────────────────────────────────────────────────────────
function FullContextCard({
  ctx,
  onOpenPanel,
}: {
  ctx: Zone1Context
  onOpenPanel: (e: React.MouseEvent) => void
}) {
  const severityColors: Record<string, { bg: string; text: string }> = {
    alta: { bg: C.badgeRedBg, text: C.badgeRedText },
    media: { bg: C.badgeAmberBg, text: C.badgeAmberText },
    baja: { bg: C.badgeGrayBg, text: C.badgeGrayText },
  }

  const arcDotColors = [C.accentBlue, C.accentAmber, C.accentTeal]

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: C.bgSecondary,
        borderRadius: '12px',
        border: `1.5px solid ${C.border}`,
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* ── Top row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.textTertiary,
              marginBottom: '4px',
            }}
          >
            Acto #1 — Diagnóstico
          </div>
          {ctx.presentationName && (
            <div style={{ fontSize: '12px', color: C.textSecondary }}>
              {ctx.presentationName}
              {ctx.updatedAt && (
                <span style={{ color: C.textTertiary }}>
                  {' · '}
                  {new Date(ctx.updatedAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              )}
            </div>
          )}
        </div>
        <CompletenessBar value={ctx.completeness ?? 0} />
      </div>

      {/* ── EVENTO ── */}
      <div>
        <SectionLabel label="Evento" />
        <Card>
          <FieldGrid cols={3}>
            <Field label="tipo">
              <Badge label={ctx.event.type || '—'} bg={C.badgeBlueBg} color={C.badgeBlueText} />
            </Field>
            <Field label="nombre">
              {ctx.event.name || '—'}
            </Field>
            <Field label="fecha">
              {ctx.event.date || '—'}
            </Field>
            <Field label="formato">
              <Badge label={ctx.event.format} bg={C.badgeGrayBg} color={C.badgeGrayText} />
            </Field>
            <Field label="duración">
              {ctx.event.durationMinutes ? `${ctx.event.durationMinutes} min` : '—'}
              {ctx.event.qaMinutes ? ` + ${ctx.event.qaMinutes} min Q&A` : ''}
            </Field>
            <Field label="idioma">
              {ctx.event.language || '—'}
            </Field>
          </FieldGrid>
          <Divider />
          <FieldGrid cols={2}>
            <Field label="lugar">
              {ctx.event.location || '—'}
            </Field>
            <Field label="formalidad">
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap' }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      backgroundColor:
                        i < (ctx.event.formalityLevel ?? 0)
                          ? C.accentBlue
                          : C.bgTertiary,
                    }}
                  />
                ))}
                <span style={{ fontSize: '11px', color: C.textSecondary, marginLeft: '4px' }}>
                  {ctx.event.formalityLevel}/10
                </span>
              </div>
            </Field>
          </FieldGrid>
        </Card>
      </div>

      {/* ── AUDIENCIA ── */}
      <div>
        <SectionLabel label="Audiencia" />
        <Card>
          {/* Segments */}
          {ctx.audience.segments && ctx.audience.segments.length > 0 && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                {ctx.audience.segments.map((seg, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px',
                      backgroundColor: C.bgSecondary,
                      borderRadius: '6px',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 600, color: C.text }}>
                        {seg.role}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: seg.color || C.accentBlue,
                        }}
                      >
                        {seg.percentage}%
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: C.textSecondary, marginBottom: '6px' }}>
                      {seg.description}
                    </div>
                    <div
                      style={{
                        height: '3px',
                        backgroundColor: C.bgTertiary,
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${seg.percentage}%`,
                          height: '100%',
                          backgroundColor: seg.color || C.accentBlue,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Divider />
            </>
          )}

          <FieldGrid cols={3}>
            <Field label="baseline emocional">
              <Badge
                label={ctx.audience.emotionalBaseline || '—'}
                bg={C.badgeAmberBg}
                color={C.badgeAmberText}
              />
            </Field>
            <Field label="tamaño">
              {ctx.audience.size ? `${ctx.audience.size} personas` : '—'}
            </Field>
            <Field label="motivación primaria">
              {ctx.audience.primaryMotivation || '—'}
            </Field>
            <Field label="miedo primario">
              {ctx.audience.primaryFear || '—'}
            </Field>
            <Field label="atención estimada">
              {ctx.audience.attentionMinutes ? `${ctx.audience.attentionMinutes} min` : '—'}
            </Field>
            <Field label="familiaridad">
              {ctx.audience.familiarity || '—'}
            </Field>
          </FieldGrid>
        </Card>
      </div>

      {/* ── Two-column row: OBJETIVO + TONO ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* OBJETIVO */}
        <div>
          <SectionLabel label="Objetivo" />
          <Card style={{ height: '100%', boxSizing: 'border-box' }}>
            <FieldGrid cols={1}>
              <Field label="primario">{ctx.objective.primary || '—'}</Field>
              <Field label="acción deseada">{ctx.objective.desiredAction || '—'}</Field>
              <Field label="métrica de éxito">{ctx.objective.successMetric || '—'}</Field>
            </FieldGrid>
            <Divider />
            <Field label="qué deben recordar">
              <FieldVal style={{ fontStyle: 'italic', color: C.textSecondary }}>
                {ctx.objective.mustRemember || '—'}
              </FieldVal>
            </Field>
            <div style={{ marginTop: '8px' }}>
              <FieldLabel label="qué deben sentir" />
              <Badge
                label={ctx.objective.mustFeel || '—'}
                bg={C.badgeTealBg}
                color={C.badgeTealText}
              />
            </div>
          </Card>
        </div>

        {/* TONO */}
        <div>
          <SectionLabel label="Tono y Narrativa" />
          <Card style={{ height: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '8px' }}>
              <FieldLabel label="tono primario" />
              <Badge
                label={ctx.tone.primary || '—'}
                bg={C.badgePurpleBg}
                color={C.badgePurpleText}
              />
            </div>
            <FieldGrid cols={1}>
              <Field label="arco narrativo">{ctx.tone.narrativeArc || '—'}</Field>
              <Field label="gancho">
                <Badge
                  label={ctx.tone.hook || '—'}
                  bg={C.badgeGrayBg}
                  color={C.badgeGrayText}
                />
              </Field>
              <Field label="prueba social">{ctx.tone.proof || '—'}</Field>
            </FieldGrid>
            <Divider />
            {/* Arc row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'apertura', val: ctx.tone.arc.opening },
                { label: 'desarrollo', val: ctx.tone.arc.middle },
                { label: 'cierre', val: ctx.tone.arc.closing },
              ].map(({ label, val }, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: arcDotColors[i],
                      flexShrink: 0,
                      marginTop: '3px',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '10px', color: C.textTertiary, fontWeight: 600 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '11px', color: C.text }}>{val || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── RESTRICCIONES ── */}
      <div>
        <SectionLabel label="Restricciones" />
        <Card>
          <FieldGrid cols={2}>
            <Field label="temas a evitar">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {ctx.constraints.avoidTopics.length > 0
                  ? ctx.constraints.avoidTopics.map((t, i) => (
                      <Badge key={i} label={t} bg={C.badgeRedBg} color={C.badgeRedText} />
                    ))
                  : <span style={{ color: C.textTertiary, fontSize: '11px' }}>—</span>}
              </div>
            </Field>
            <Field label="inclusiones obligatorias">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {ctx.constraints.mandatoryTopics.length > 0
                  ? ctx.constraints.mandatoryTopics.map((t, i) => (
                      <Badge key={i} label={t} bg={C.badgeTealBg} color={C.badgeTealText} />
                    ))
                  : <span style={{ color: C.textTertiary, fontSize: '11px' }}>—</span>}
              </div>
            </Field>
          </FieldGrid>
          {ctx.constraints.previousContext && (
            <>
              <Divider />
              <Field label="contexto previo">
                <FieldVal style={{ fontStyle: 'italic', color: C.textSecondary }}>
                  {ctx.constraints.previousContext}
                </FieldVal>
              </Field>
            </>
          )}
        </Card>
      </div>

      {/* ── ALERTAS DE RIESGO ── */}
      {ctx.riskFlags.length > 0 && (
        <div>
          <SectionLabel label="Alertas de Riesgo" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ctx.riskFlags.map((flag) => {
              const sev = severityColors[flag.severity] ?? { bg: C.badgeGrayBg, text: C.badgeGrayText }
              const dotColor =
                flag.severity === 'alta'
                  ? C.dangerDot
                  : flag.severity === 'media'
                  ? C.warningDot
                  : C.textTertiary

              return (
                <Card key={flag.id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        flexShrink: 0,
                        marginTop: '4px',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>
                          {flag.title}
                        </span>
                        <Badge label={flag.severity} bg={sev.bg} color={sev.text} />
                      </div>
                      <div style={{ fontSize: '11px', color: C.textSecondary, marginBottom: '4px' }}>
                        {flag.mitigation}
                      </div>
                      <div style={{ fontSize: '10px', color: C.textTertiary }}>
                        {flag.detectedBy} · {flag.date}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── REGLAS DE PROPAGACIÓN ── */}
      {ctx.propagationRules.length > 0 && (
        <div>
          <SectionLabel label="Reglas de Propagación" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {ctx.propagationRules.map((rule, idx) => (
              <Card key={idx}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: C.accentBlue,
                    marginBottom: '4px',
                  }}
                >
                  {rule.agent}
                </div>
                <div style={{ fontSize: '11px', color: C.text, marginBottom: '6px', lineHeight: 1.4 }}>
                  {rule.instruction}
                </div>
                <div style={{ fontSize: '10px', color: C.textTertiary, lineHeight: 1.3 }}>
                  {rule.reason}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Open panel button ── */}
      <button
        onPointerDown={(e) => { e.stopPropagation() }}
        onClick={(e) => { e.stopPropagation(); onOpenPanel(e as any) }}
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
          pointerEvents: 'all',
          textAlign: 'center',
          marginTop: '4px',
        }}
      >
        Abrir sesión de diagnóstico →
      </button>
    </div>
  )
}

// ─── Shape Util ───────────────────────────────────────────────────────────────
export class Zone1ShapeUtil extends BaseBoxShapeUtil<TLZone1Shape> {
  static override type = 'zone1' as const

  static override props: RecordProps<TLZone1Shape> = {
    w: T.number,
    h: T.number,
    presentationId: T.string,
    status: T.literalEnum('empty', 'in_progress', 'validated'),
    completeness: T.number,
    contextJson: T.string,
  }

  override getDefaultProps(): Zone1ShapeProps {
    return {
      w: 640,
      h: 340,
      presentationId: '',
      status: 'empty',
      completeness: 0,
      contextJson: '',
    }
  }

  override component(shape: TLZone1Shape) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { openPanel } = useZonePanel()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const editor = useEditor()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const measureRef = useRef<HTMLDivElement>(null)

    // Auto-resize: observe natural content height and sync to shape.props.h
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const el = measureRef.current
      if (!el) return
      const observer = new ResizeObserver(() => {
        const naturalH = el.offsetHeight
        if (naturalH > 10 && Math.abs(naturalH - shape.props.h) > 4) {
          editor.run(() => {
            editor.updateShape<TLZone1Shape>({
              id: shape.id,
              type: 'zone1',
              props: { h: Math.max(200, naturalH) },
            })
          }, { history: 'ignore' })
        }
      })
      observer.observe(el)
      return () => observer.disconnect()
    // shape.props.h intentionally excluded — observer handles drift
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, shape.id])

    const handleOpenPanel = (e: React.MouseEvent) => {
      e.stopPropagation()
      openPanel('zone1', shape.id)
    }

    const handleStartDiagnosis = (e: React.MouseEvent) => {
      e.stopPropagation()
      openPanel('zone1', shape.id)
    }

    let ctx: Zone1Context | null = null
    if (shape.props.contextJson) {
      try {
        ctx = JSON.parse(shape.props.contextJson) as Zone1Context
      } catch {
        ctx = null
      }
    }

    const isPopulated = shape.props.status !== 'empty' && ctx !== null

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: 'all',
          overflow: 'visible',
          borderRadius: '12px',
        }}
      >
        <div ref={measureRef} style={{ width: '100%' }}>
          {isPopulated ? (
            <FullContextCard ctx={ctx!} onOpenPanel={handleOpenPanel} />
          ) : (
            <EmptyState onStart={handleStartDiagnosis} />
          )}
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: TLZone1Shape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
  }

  override toSvg(shape: TLZone1Shape, _ctx: SvgExportContext): React.ReactElement | null {
    const { w, h, status, completeness, contextJson } = shape.props

    let ctx: Zone1Context | null = null
    try {
      if (contextJson) ctx = JSON.parse(contextJson) as Zone1Context
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

    const rows: Array<{ label: string; value: string }> = []
    if (ctx?.presentationName) rows.push({ label: 'Presentación', value: ctx.presentationName })
    if (ctx?.event?.type) rows.push({ label: 'Tipo de evento', value: `${ctx.event.type}${ctx.event.date ? ' · ' + ctx.event.date : ''}` })
    if (ctx?.audience?.size) rows.push({ label: 'Audiencia', value: `${ctx.audience.size} personas${ctx.audience.segments?.length ? ' · ' + ctx.audience.segments.map((s) => `${s.role} ${s.percentage}%`).slice(0, 2).join(', ') : ''}` })
    if (ctx?.objective?.primary) rows.push({ label: 'Objetivo', value: ctx.objective.primary.slice(0, 60) })
    if (ctx?.tone?.primary) rows.push({ label: 'Tono', value: `${ctx.tone.primary}${ctx.event?.formalityLevel ? ' · formalidad ' + ctx.event.formalityLevel + '/10' : ''}` })

    const rowH = 34
    const headerH = 56
    const svgH = Math.min(h, headerH + rows.length * rowH + 24)
    const barW = (completeness / 100) * 80

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={w}
        height={svgH}
        viewBox={`0 0 ${w} ${svgH}`}
      >
        {/* Card background */}
        <rect x={0} y={0} width={w} height={svgH} rx={12} ry={12} fill={BG2} stroke={BORDER} strokeWidth={1.5} />
        {/* Header accent strip */}
        <rect x={0} y={0} width={w} height={6} rx={0} ry={0} fill={ACCENT} />
        <rect x={0} y={0} width={12} height={6} rx={0} ry={0} fill={ACCENT} />

        {/* Title */}
        <text x={16} y={28} fontSize={10} fontWeight={700} letterSpacing={1.5} fill={TEXT3} fontFamily="system-ui, sans-serif" style={{ textTransform: 'uppercase' }}>
          ACTO #1 — DIAGNÓSTICO
        </text>

        {/* Status badge */}
        <rect x={w - 100} y={14} width={84} height={18} rx={4} fill={statusBg} />
        <text x={w - 58} y={27} fontSize={10} fontWeight={600} fill={statusColor} fontFamily="system-ui, sans-serif" textAnchor="middle">
          {statusLabel}
        </text>

        {/* Completeness bar */}
        <text x={16} y={48} fontSize={9} fill={TEXT3} fontFamily="system-ui, sans-serif">
          {completeness}% completado
        </text>
        <rect x={120} y={40} width={80} height={4} rx={2} fill={BORDER} />
        <rect x={120} y={40} width={barW} height={4} rx={2} fill={completeness >= 80 ? TEAL : completeness >= 40 ? '#EF9F27' : TEXT3} />

        {/* Divider */}
        <line x1={16} y1={56} x2={w - 16} y2={56} stroke={BORDER} strokeWidth={1} />

        {/* Rows */}
        {rows.map((row, i) => (
          <g key={i}>
            <rect x={16} y={headerH + i * rowH} width={w - 32} height={rowH - 4} rx={4} fill={i % 2 === 0 ? BG : BG2} />
            <text x={24} y={headerH + i * rowH + 13} fontSize={9} fontWeight={600} fill={TEXT3} fontFamily="system-ui, sans-serif" style={{ textTransform: 'uppercase' }} letterSpacing={1}>
              {row.label}
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

export const zone1ShapeUtil = Zone1ShapeUtil
