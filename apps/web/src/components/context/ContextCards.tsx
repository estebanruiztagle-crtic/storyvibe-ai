'use client'

import type { Zone1Context } from '@/components/zones/zone1/types'

// ─── Reusable primitives ─────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </div>
      <div className="text-sm text-neutral-800">
        {value || <span className="text-neutral-300">—</span>}
      </div>
    </div>
  )
}

function Tag({
  label,
  color = 'neutral',
}: {
  label: string
  color?: 'blue' | 'teal' | 'amber' | 'purple' | 'neutral' | 'red'
}) {
  const styles: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-700',
    teal:    'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    purple:  'bg-violet-50 text-violet-700',
    neutral: 'bg-neutral-100 text-neutral-600',
    red:     'bg-red-50 text-red-700',
  }
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${styles[color]}`}>
      {label}
    </span>
  )
}

// ─── Completeness bar ────────────────────────────────────────────────────────

export function CompletenessBar({ value }: { value: number }) {
  const color =
    value >= 80 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-neutral-300'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-neutral-500">{value}%</span>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ContextCards({ ctx }: { ctx: Zone1Context }) {
  const isEmpty = !ctx.event.type && !ctx.event.name && !ctx.objective.primary

  if (isEmpty) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <div className="mb-2 text-3xl">📋</div>
          <p className="text-sm font-medium text-neutral-400">
            Los datos aparecerán aquí a medida que avance el diagnóstico.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Evento */}
      <Card title="Evento">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="tipo"
            value={ctx.event.type ? <Tag label={ctx.event.type} color="blue" /> : null}
          />
          <Field label="nombre" value={ctx.event.name} />
          <Field label="fecha" value={ctx.event.date} />
          <Field
            label="formato"
            value={ctx.event.format ? <Tag label={ctx.event.format} /> : null}
          />
          <Field
            label="duración"
            value={
              ctx.event.durationMinutes
                ? `${ctx.event.durationMinutes} min${ctx.event.qaMinutes ? ` + ${ctx.event.qaMinutes} Q&A` : ''}`
                : null
            }
          />
          <Field label="idioma" value={ctx.event.language} />
        </div>
      </Card>

      {/* Audiencia */}
      {(ctx.audience.segments.length > 0 || ctx.audience.primaryMotivation) && (
        <Card title="Audiencia">
          {ctx.audience.segments.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {ctx.audience.segments.map((seg, i) => (
                <div key={i} className="rounded-lg border border-neutral-100 bg-neutral-50 p-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-neutral-800">{seg.role}</span>
                    <span className="font-bold" style={{ color: seg.color || '#3b82f6' }}>
                      {seg.percentage}%
                    </span>
                  </div>
                  {seg.description && (
                    <div className="mt-1 text-[11px] text-neutral-500">{seg.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="baseline emocional"
              value={ctx.audience.emotionalBaseline ? <Tag label={ctx.audience.emotionalBaseline} color="amber" /> : null}
            />
            <Field label="tamaño" value={ctx.audience.size ? `${ctx.audience.size} personas` : null} />
            <Field label="motivación" value={ctx.audience.primaryMotivation} />
            <Field label="miedo" value={ctx.audience.primaryFear} />
          </div>
        </Card>
      )}

      {/* Objetivo */}
      {ctx.objective.primary && (
        <Card title="Objetivo">
          <div className="flex flex-col gap-3">
            <Field label="primario" value={ctx.objective.primary} />
            <Field label="acción deseada" value={ctx.objective.desiredAction} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="deben recordar" value={ctx.objective.mustRemember} />
              <Field
                label="deben sentir"
                value={ctx.objective.mustFeel ? <Tag label={ctx.objective.mustFeel} color="teal" /> : null}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tono */}
      {ctx.tone.primary && (
        <Card title="Tono">
          <div className="flex flex-wrap gap-2 mb-3">
            <Tag label={ctx.tone.primary} color="purple" />
            {ctx.tone.humorAllowed && <Tag label="humor ✓" color="teal" />}
          </div>
          <div className="flex gap-4">
            {[
              { label: 'apertura', val: ctx.tone.arc.opening, dot: 'bg-blue-400' },
              { label: 'desarrollo', val: ctx.tone.arc.middle, dot: 'bg-amber-400' },
              { label: 'cierre', val: ctx.tone.arc.closing, dot: 'bg-emerald-400' },
            ].map(({ label, val, dot }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                <span className="text-[11px] text-neutral-600">{val || '—'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Restricciones */}
      {(ctx.constraints.avoidTopics.length > 0 || ctx.constraints.mandatoryTopics.length > 0) && (
        <Card title="Restricciones">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">evitar</div>
              <div className="flex flex-wrap gap-1">
                {ctx.constraints.avoidTopics.map((t, i) => <Tag key={i} label={t} color="red" />)}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">obligatorio</div>
              <div className="flex flex-wrap gap-1">
                {ctx.constraints.mandatoryTopics.map((t, i) => <Tag key={i} label={t} color="teal" />)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Risk flags */}
      {ctx.riskFlags.length > 0 && (
        <Card title="Alertas">
          <div className="flex flex-col gap-2">
            {ctx.riskFlags.map((flag) => (
              <div key={flag.id} className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                  flag.severity === 'alta' ? 'bg-red-500' : flag.severity === 'media' ? 'bg-amber-500' : 'bg-neutral-300'
                }`} />
                <div>
                  <span className="text-xs font-semibold text-neutral-800">{flag.title}</span>
                  <div className="mt-0.5 text-[11px] text-neutral-500">{flag.mitigation}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
