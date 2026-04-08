'use client'

import { useState, useRef, useEffect } from 'react'
import type { Zone1Context } from './types'
import { EMPTY_ZONE1_CONTEXT } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Zone1PanelProps {
  shapeId: string
  initialContext: Zone1Context
  onContextUpdate: (context: Zone1Context, completeness: number) => void
  onClose: () => void
  onAdvanceToZone2?: () => void
}

type Tab = 'fuentes' | 'diagnostico' | 'datos' | 'propagacion'

// ─── Helper sub-components ────────────────────────────────────────────────────
function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[#E5E2DA] bg-white p-4">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9B9895]">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
        {label}
      </div>
      <div className="text-sm text-[#1A1A18]">{value || <span className="text-[#9B9895]">—</span>}</div>
    </div>
  )
}

function Badge({
  label,
  variant = 'gray',
}: {
  label: string
  variant?: 'blue' | 'teal' | 'amber' | 'purple' | 'gray' | 'red'
}) {
  const variants = {
    blue: 'bg-[#E6F1FB] text-[#0C447C]',
    teal: 'bg-[#E1F5EE] text-[#085041]',
    amber: 'bg-[#FAEEDA] text-[#633806]',
    purple: 'bg-[#EEEDFE] text-[#3C3489]',
    gray: 'bg-[#F1EFE8] text-[#444441]',
    red: 'bg-[#FCEBEB] text-[#791F1F]',
  }
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${variants[variant]}`}
    >
      {label}
    </span>
  )
}

function CompletenessBar({ value }: { value: number }) {
  const color =
    value >= 80 ? 'bg-[#0F6E56]' : value >= 40 ? 'bg-[#8C4A00]' : 'bg-[#9B9895]'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#EFECE4]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-[#6B6866]">{value}%</span>
    </div>
  )
}

// ─── Tab: Datos ───────────────────────────────────────────────────────────────
function TabDatos({ ctx }: { ctx: Zone1Context }) {
  const arcDotColors = ['bg-[#185FA5]', 'bg-[#8C4A00]', 'bg-[#0F6E56]']

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* EVENTO */}
      <SectionCard title="Evento">
        <div className="grid grid-cols-3 gap-3">
          <Field
            label="tipo"
            value={
              ctx.event.type ? (
                <Badge label={ctx.event.type} variant="blue" />
              ) : null
            }
          />
          <Field label="nombre" value={ctx.event.name} />
          <Field label="fecha" value={ctx.event.date} />
          <Field
            label="formato"
            value={
              ctx.event.format ? (
                <Badge label={ctx.event.format} variant="gray" />
              ) : null
            }
          />
          <Field
            label="duración"
            value={
              ctx.event.durationMinutes
                ? `${ctx.event.durationMinutes} min${ctx.event.qaMinutes ? ` + ${ctx.event.qaMinutes} min Q&A` : ''}`
                : null
            }
          />
          <Field label="idioma" value={ctx.event.language} />
        </div>
        <div className="my-3 border-t border-[#E5E2DA]" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="lugar" value={ctx.event.location} />
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
              formalidad
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-3.5 w-3.5 rounded-sm ${
                    i < (ctx.event.formalityLevel ?? 0)
                      ? 'bg-[#185FA5]'
                      : 'bg-[#EFECE4]'
                  }`}
                />
              ))}
              <span className="ml-1 text-[11px] text-[#6B6866]">
                {ctx.event.formalityLevel}/10
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* AUDIENCIA */}
      <SectionCard title="Audiencia">
        {ctx.audience.segments.length > 0 && (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {ctx.audience.segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-[#E5E2DA] bg-[#F7F7F5] p-2.5"
                >
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs font-semibold text-[#1A1A18]">{seg.role}</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: seg.color || '#185FA5' }}
                    >
                      {seg.percentage}%
                    </span>
                  </div>
                  <div className="mb-2 text-[11px] text-[#6B6866]">{seg.description}</div>
                  <div className="h-1 overflow-hidden rounded-full bg-[#EFECE4]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${seg.percentage}%`,
                        backgroundColor: seg.color || '#185FA5',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-3 border-t border-[#E5E2DA]" />
          </>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field
            label="baseline emocional"
            value={
              ctx.audience.emotionalBaseline ? (
                <Badge label={ctx.audience.emotionalBaseline} variant="amber" />
              ) : null
            }
          />
          <Field
            label="tamaño"
            value={ctx.audience.size ? `${ctx.audience.size} personas` : null}
          />
          <Field label="motivación primaria" value={ctx.audience.primaryMotivation} />
          <Field label="miedo primario" value={ctx.audience.primaryFear} />
          <Field
            label="atención estimada"
            value={
              ctx.audience.attentionMinutes ? `${ctx.audience.attentionMinutes} min` : null
            }
          />
          <Field label="familiaridad" value={ctx.audience.familiarity} />
        </div>
      </SectionCard>

      {/* OBJETIVO */}
      <SectionCard title="Objetivo">
        <div className="grid grid-cols-1 gap-3">
          <Field label="primario" value={ctx.objective.primary} />
          <Field label="acción deseada" value={ctx.objective.desiredAction} />
          <Field label="métrica de éxito" value={ctx.objective.successMetric} />
        </div>
        <div className="my-3 border-t border-[#E5E2DA]" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
              qué deben recordar
            </div>
            <div className="text-sm italic text-[#6B6866]">
              {ctx.objective.mustRemember || <span className="not-italic text-[#9B9895]">—</span>}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
              qué deben sentir
            </div>
            {ctx.objective.mustFeel ? (
              <Badge label={ctx.objective.mustFeel} variant="teal" />
            ) : (
              <span className="text-[#9B9895]">—</span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* TONO */}
      <SectionCard title="Tono y Narrativa">
        <div className="mb-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
            tono primario
          </div>
          {ctx.tone.primary ? (
            <Badge label={ctx.tone.primary} variant="purple" />
          ) : (
            <span className="text-[#9B9895] text-sm">—</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="arco narrativo" value={ctx.tone.narrativeArc} />
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
              gancho
            </div>
            {ctx.tone.hook ? (
              <Badge label={ctx.tone.hook} variant="gray" />
            ) : (
              <span className="text-[#9B9895] text-sm">—</span>
            )}
          </div>
          <Field label="prueba social" value={ctx.tone.proof} />
          <Field
            label="humor permitido"
            value={
              <Badge
                label={ctx.tone.humorAllowed ? 'sí' : 'no'}
                variant={ctx.tone.humorAllowed ? 'teal' : 'gray'}
              />
            }
          />
        </div>
        <div className="my-3 border-t border-[#E5E2DA]" />
        <div className="flex flex-col gap-2">
          {[
            { label: 'apertura', val: ctx.tone.arc.opening, dot: arcDotColors[0] },
            { label: 'desarrollo', val: ctx.tone.arc.middle, dot: arcDotColors[1] },
            { label: 'cierre', val: ctx.tone.arc.closing, dot: arcDotColors[2] },
          ].map(({ label, val, dot }) => (
            <div key={label} className="flex items-start gap-2">
              <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
                  {label}
                </div>
                <div className="text-[11px] text-[#1A1A18]">{val || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* RESTRICCIONES */}
      <SectionCard title="Restricciones">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
              temas a evitar
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {ctx.constraints.avoidTopics.length > 0 ? (
                ctx.constraints.avoidTopics.map((t, i) => (
                  <Badge key={i} label={t} variant="red" />
                ))
              ) : (
                <span className="text-[#9B9895] text-sm">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
              inclusiones obligatorias
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {ctx.constraints.mandatoryTopics.length > 0 ? (
                ctx.constraints.mandatoryTopics.map((t, i) => (
                  <Badge key={i} label={t} variant="teal" />
                ))
              ) : (
                <span className="text-[#9B9895] text-sm">—</span>
              )}
            </div>
          </div>
        </div>
        {ctx.constraints.previousContext && (
          <>
            <div className="my-3 border-t border-[#E5E2DA]" />
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B9895]">
                contexto previo
              </div>
              <div className="text-sm italic text-[#6B6866]">
                {ctx.constraints.previousContext}
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* ALERTAS */}
      {ctx.riskFlags.length > 0 && (
        <SectionCard title="Alertas de Riesgo">
          <div className="flex flex-col gap-2">
            {ctx.riskFlags.map((flag) => {
              const dotColor =
                flag.severity === 'alta'
                  ? 'bg-[#E24B4A]'
                  : flag.severity === 'media'
                  ? 'bg-[#EF9F27]'
                  : 'bg-[#9B9895]'
              const badgeVariant: 'red' | 'amber' | 'gray' =
                flag.severity === 'alta' ? 'red' : flag.severity === 'media' ? 'amber' : 'gray'

              return (
                <div
                  key={flag.id}
                  className="rounded-md border border-[#E5E2DA] bg-[#F7F7F5] p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1A1A18]">{flag.title}</span>
                        <Badge label={flag.severity} variant={badgeVariant} />
                      </div>
                      <div className="mb-1 text-[11px] text-[#6B6866]">{flag.mitigation}</div>
                      <div className="text-[10px] text-[#9B9895]">
                        {flag.detectedBy} · {flag.date}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─── Tab: Fuentes ─────────────────────────────────────────────────────────────
interface SourceFile {
  id: string
  type: 'image' | 'audio' | 'video' | 'text'
  name: string
  size: number
  preview?: string           // dataUrl for images
  transcription?: string     // for audio/video
  description?: string       // AI description for images
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

function TabFuentes({
  shapeId,
  onSourcesReady,
}: {
  shapeId: string
  onSourcesReady?: (sources: SourceFile[]) => void
}) {
  const [sources, setSources] = useState<SourceFile[]>([])
  const [textInput, setTextInput] = useState('')
  const [textAdded, setTextAdded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  const addSource = (file: File): SourceFile => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'webm']
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm']
    const type: SourceFile['type'] =
      imageExts.includes(ext) ? 'image' :
      audioExts.includes(ext) ? 'audio' :
      videoExts.includes(ext) ? 'video' : 'text'

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type, name: file.name, size: file.size, status: 'pending',
    }
  }

  const processImageFile = async (file: File, id: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: 'processing' } : s))
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Show preview immediately
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, preview: dataUrl } : s))

      // Send to backend for vision analysis
      const res = await fetch(`${apiUrl}/api/v1/zones/zone1/analyze-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: shapeId,
          sourceType: 'image',
          fileName: file.name,
          dataUrl,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { success: boolean; description?: string; error?: string }
      if (data.success && data.description) {
        setSources((prev) => prev.map((s) => s.id === id ? { ...s, description: data.description, status: 'done' } : s))
      } else {
        setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: 'error', error: data.error ?? 'Sin descripción' } : s))
      }
    } catch (err) {
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: 'error', error: String(err) } : s))
    }
  }

  const processAudioFile = async (file: File, id: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: 'processing' } : s))
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch(`${apiUrl}/api/v1/zones/zone1/analyze-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: shapeId,
          sourceType: 'audio',
          fileName: file.name,
          dataUrl,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { success: boolean; transcription?: string; error?: string }
      if (data.success && data.transcription) {
        setSources((prev) => prev.map((s) => s.id === id ? { ...s, transcription: data.transcription, status: 'done' } : s))
      } else {
        setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: 'error', error: data.error ?? 'Sin transcripción' } : s))
      }
    } catch (err) {
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: 'error', error: String(err) } : s))
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    const newSources = fileArr.map(addSource)
    setSources((prev) => [...prev, ...newSources])

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i]
      const src = newSources[i]
      if (src.type === 'image') {
        await processImageFile(file, src.id)
      } else if (src.type === 'audio') {
        await processAudioFile(file, src.id)
      } else {
        // Video / other: just mark as pending, user can describe it
        setSources((prev) => prev.map((s) => s.id === src.id ? { ...s, status: 'done', description: `Archivo ${src.type} adjunto: ${file.name}` } : s))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  const handleAddText = () => {
    if (!textInput.trim()) return
    const src: SourceFile = {
      id: `txt-${Date.now()}`,
      type: 'text', name: 'Texto directo',
      size: textInput.length,
      description: textInput.trim(),
      status: 'done',
    }
    setSources((prev) => [...prev, src])
    setTextInput('')
    setTextAdded(true)
    setTimeout(() => setTextAdded(false), 2000)
  }

  const removeSource = (id: string) => setSources((prev) => prev.filter((s) => s.id !== id))

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const typeIcon = (t: SourceFile['type']) =>
    t === 'image' ? '🖼' : t === 'audio' ? '🎵' : t === 'video' ? '🎬' : '📝'

  const statusColor = (s: SourceFile['status']) =>
    s === 'done' ? '#1D9E75' : s === 'processing' ? '#EF9F27' : s === 'error' ? '#E24B4A' : '#9B9895'

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#D1CCBF] bg-[#F7F7F5] p-8 transition-colors hover:border-[#185FA5] hover:bg-[#EFF5FF]"
      >
        <div className="text-3xl">📁</div>
        <div className="text-center">
          <div className="text-sm font-semibold text-[#1A1A18]">Arrastra archivos o haz clic</div>
          <div className="mt-1 text-[11px] text-[#9B9895]">
            Imágenes · Audio · Video · Documentos
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { icon: '🖼', label: 'JPG / PNG / WEBP', desc: 'Análisis IA' },
            { icon: '🎵', label: 'MP3 / WAV / M4A', desc: 'Transcripción' },
            { icon: '🎬', label: 'MP4 / MOV', desc: 'Video' },
            { icon: '📝', label: 'PDF / TXT', desc: 'Texto' },
          ].map((t) => (
            <div key={t.label} className="rounded-md border border-[#E5E2DA] bg-white px-2.5 py-1 text-center">
              <div className="text-sm">{t.icon}</div>
              <div className="text-[9px] font-semibold text-[#1A1A18]">{t.label}</div>
              <div className="text-[9px] text-[#9B9895]">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*,.pdf,.txt,.doc,.docx"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Text input */}
      <div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9B9895]">
          O pega texto / URL directamente
        </div>
        <div className="flex gap-2">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Pega aquí texto, notas, un brief, una URL, o cualquier contexto relevante…"
            rows={3}
            className="flex-1 resize-none rounded-lg border border-[#E5E2DA] bg-white px-3 py-2 text-sm text-[#1A1A18] placeholder-[#9B9895] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
          />
          <button
            onClick={handleAddText}
            disabled={!textInput.trim()}
            className="self-end rounded-lg bg-[#185FA5] px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {textAdded ? '✓' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* Source list */}
      {sources.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9B9895]">
            {sources.length} fuente{sources.length !== 1 ? 's' : ''} agregada{sources.length !== 1 ? 's' : ''}
          </div>
          {sources.map((src) => (
            <div key={src.id} className="rounded-lg border border-[#E5E2DA] bg-white p-3">
              <div className="flex items-start gap-3">
                {/* Thumbnail or icon */}
                {src.type === 'image' && src.preview ? (
                  <img
                    src={src.preview}
                    alt={src.name}
                    className="h-12 w-12 flex-shrink-0 rounded-md object-cover border border-[#E5E2DA]"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#F7F7F5] border border-[#E5E2DA] text-2xl">
                    {typeIcon(src.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-[#1A1A18]">{src.name}</span>
                    <button
                      onClick={() => removeSource(src.id)}
                      className="flex-shrink-0 text-[#9B9895] hover:text-[#E24B4A] text-sm leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span style={{ color: statusColor(src.status) }} className="text-[10px] font-medium">
                      {src.status === 'processing' ? '⏳ procesando…' :
                       src.status === 'done' ? '✓ listo' :
                       src.status === 'error' ? `✗ error` : '· pendiente'}
                    </span>
                    {src.size > 0 && (
                      <span className="text-[10px] text-[#9B9895]">{fmtSize(src.size)}</span>
                    )}
                  </div>

                  {/* Description / Transcription */}
                  {(src.description || src.transcription) && (
                    <div className="mt-1.5 rounded bg-[#F7F7F5] px-2 py-1.5 text-[11px] text-[#6B6866] leading-relaxed max-h-16 overflow-hidden">
                      {src.description ?? src.transcription}
                    </div>
                  )}

                  {src.error && (
                    <div className="mt-1 text-[10px] text-[#E24B4A]">{src.error}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {sources.length === 0 && (
        <div className="text-center py-4 text-[12px] text-[#9B9895]">
          Las fuentes que agregues aquí enriquecerán el diagnóstico del Acto #1.<br />
          El agente las procesará junto con tus respuestas en el chat.
        </div>
      )}
    </div>
  )
}

// ─── Tab: Diagnóstico ─────────────────────────────────────────────────────────
function TabDiagnostico({
  ctx,
  shapeId,
  onContextUpdate,
  onConversationComplete,
}: {
  ctx: Zone1Context
  shapeId: string
  onContextUpdate: (ctx: Zone1Context, completeness: number) => void
  onConversationComplete?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [localCtx, setLocalCtx] = useState<Zone1Context>(ctx)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ── URL reading ──
  const URL_REGEX = /https?:\/\/[^\s"'<>()[\]{}|\\^`]{4,}/g
  const [isFetchingUrl, setIsFetchingUrl]   = useState(false)
  const [fetchedUrl, setFetchedUrl]         = useState<{ url: string; title: string; text: string; chars: number; domain: string } | null>(null)
  const [fetchUrlError, setFetchUrlError]   = useState<string | null>(null)

  const detectedUrl = (() => {
    const matches = inputMessage.match(URL_REGEX)
    return matches?.[0] ?? null
  })()

  const handleFetchUrl = async () => {
    if (!detectedUrl) return
    setIsFetchingUrl(true)
    setFetchUrlError(null)
    setFetchedUrl(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const res  = await fetch(`${apiUrl}/api/v1/zones/zone1/fetch-url`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: detectedUrl }),
      })
      const data = await res.json() as { success: boolean; url: string; title: string; text: string; chars: number; domain: string; error?: string }
      if (data.success) {
        setFetchedUrl({ url: data.url, title: data.title, text: data.text, chars: data.chars, domain: data.domain })
      } else {
        setFetchUrlError(data.error ?? 'No se pudo leer la URL')
      }
    } catch {
      setFetchUrlError('Error de conexión al intentar leer la URL')
    } finally {
      setIsFetchingUrl(false)
    }
  }

  // ── voice ──
  const [isRecording, setIsRecording] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localCtx.conversation])

  // ── Voice handler ─────────────────────────────────────────────────────────
  const startVoice = () => {
    setVoiceError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setVoiceError('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.')
      return
    }
    const recognition = new SR()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
      }
      if (final) setInputMessage((prev) => (prev ? prev + ' ' : '') + final)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setVoiceError(`Error de micrófono: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => setIsRecording(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  const sendMessage = async (message: string, isInitial = false) => {
    if (!isInitial && !message.trim()) return
    if (isLoading) return
    if (isRecording) stopVoice()

    // If a URL was fetched, prepend its content to the message
    let finalMessage = message
    if (fetchedUrl && !isInitial) {
      const urlBlock = `[Contenido leído de ${fetchedUrl.url}]\nTítulo: "${fetchedUrl.title}"\n\n${fetchedUrl.text}\n\n---`
      const userNote = message.replace(URL_REGEX, '').trim()
      finalMessage = userNote
        ? `${urlBlock}\n\nMi respuesta adicional: ${userNote}`
        : urlBlock
      setFetchedUrl(null)
      setFetchUrlError(null)
    }

    setIsLoading(true)
    setInputMessage('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/v1/zones/zone1/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: shapeId,
          conversationHistory: localCtx.conversation,
          currentContext: localCtx,
          userMessage: finalMessage,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.updatedContext) {
        setLocalCtx(data.updatedContext)
        onContextUpdate(data.updatedContext, data.completeness ?? data.updatedContext.completeness)
        // Signal zone completion by % OR by agent's explicit flag
        const pct = data.completeness ?? data.updatedContext.completeness ?? 0
        if (pct >= 80 || data.conversationComplete) {
          onConversationComplete?.()
        }
      }
    } catch (err) {
      console.error('Diagnosis error:', err)
      // Append error message to conversation
      const errorMsg: Zone1Context['conversation'][0] = {
        role: 'agent',
        content: 'Hubo un error al conectar con el agente. Por favor intenta de nuevo.',
        timestamp: new Date().toISOString(),
      }
      const updatedCtx = {
        ...localCtx,
        conversation: [...localCtx.conversation, errorMsg],
      }
      setLocalCtx(updatedCtx)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartDiagnosis = () => {
    sendMessage('', true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const hasConversation = localCtx.conversation.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Next question box */}
      {localCtx.nextQuestion && (
        <div className="mb-3 rounded-lg border border-[#E6F1FB] bg-[#E6F1FB] p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#185FA5]">
            siguiente pregunta pendiente
          </div>
          <div className="mb-1 text-sm font-medium text-[#0C447C]">{localCtx.nextQuestion}</div>
          {localCtx.nextQuestionContext && (
            <div className="text-[11px] text-[#185FA5] opacity-75">
              {localCtx.nextQuestionContext}
            </div>
          )}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-[#E5E2DA] bg-[#F7F7F5] p-3">
        {!hasConversation ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="text-4xl">🎙</div>
            <div>
              <div className="mb-1 text-sm font-semibold text-[#1A1A18]">
                Diagnóstico de Contexto
              </div>
              <div className="text-[12px] text-[#6B6866]">
                El agente te hará preguntas para construir el contexto completo de tu presentación.
              </div>
            </div>
            <button
              onClick={handleStartDiagnosis}
              disabled={isLoading}
              className="rounded-lg bg-[#185FA5] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Iniciando...' : 'Iniciar diagnóstico →'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {localCtx.conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#185FA5] text-white'
                      : 'bg-white text-[#1A1A18] shadow-sm border border-[#E5E2DA]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-[#E5E2DA] bg-white px-4 py-2 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9B9895] [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9B9895] [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9B9895] [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      {hasConversation && (
        <div className="mt-3 flex flex-col gap-1.5">
          {/* Voice recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 rounded-md border border-[#FCEBEB] bg-[#FEF5F5] px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="flex-1 text-[11px] font-medium text-[#791F1F]">Escuchando… el texto transcrito aparece en el campo</span>
              <button type="button" onClick={stopVoice} className="text-[11px] font-semibold text-[#791F1F] hover:underline">Detener</button>
            </div>
          )}

          {/* Voice error */}
          {voiceError && (
            <div className="rounded-md border border-[#FCEBEB] bg-[#FEF5F5] px-3 py-1.5 text-[11px] text-[#791F1F]">
              {voiceError}
            </div>
          )}

          {/* URL detection strip */}
          {detectedUrl && !fetchedUrl && (
            <div className="flex items-center gap-2 rounded-md border border-[#D0E9FF] bg-[#EDF5FF] px-3 py-2">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[#185FA5]" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 9a4 4 0 005.7.1l2-2A4 4 0 009 1.3L7.8 2.5"/>
                <path d="M9 7a4 4 0 00-5.7-.1l-2 2A4 4 0 007 14.7l1.2-1.2"/>
              </svg>
              <span className="flex-1 truncate text-[11px] text-[#0C447C]">
                URL detectada: <span className="font-medium">{detectedUrl.replace(/^https?:\/\//, '').slice(0, 60)}</span>
              </span>
              <button
                type="button"
                onClick={handleFetchUrl}
                disabled={isFetchingUrl}
                className="flex-shrink-0 rounded bg-[#185FA5] px-2.5 py-1 text-[10px] font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {isFetchingUrl ? 'Leyendo…' : 'Leer contenido →'}
              </button>
            </div>
          )}

          {/* URL fetch error */}
          {fetchUrlError && (
            <div className="flex items-center justify-between rounded-md border border-[#FCEBEB] bg-[#FEF5F5] px-3 py-1.5">
              <span className="text-[11px] text-[#791F1F]">{fetchUrlError}</span>
              <button type="button" onClick={() => setFetchUrlError(null)} className="text-[#791F1F] text-[11px] hover:underline ml-2">×</button>
            </div>
          )}

          {/* URL fetched success strip */}
          {fetchedUrl && (
            <div className="flex items-center gap-2 rounded-md border border-[#C2EAD8] bg-[#F0FBF7] px-3 py-2">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[#1D9E75]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4L6 11l-3-3"/>
              </svg>
              <span className="flex-1 min-w-0 text-[11px] text-[#085041]">
                <span className="font-semibold truncate block">{fetchedUrl.title}</span>
                <span className="text-[10px] text-[#1D9E75]">{fetchedUrl.chars.toLocaleString()} caracteres leídos — se incluirán al enviar</span>
              </span>
              <button
                type="button"
                onClick={() => setFetchedUrl(null)}
                className="flex-shrink-0 text-[#9B9895] hover:text-[#E24B4A] text-[13px] leading-none"
                title="Descartar contenido"
              >
                ×
              </button>
            </div>
          )}

          {/* Input row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {/* Mic button */}
            <button
              type="button"
              onClick={isRecording ? stopVoice : startVoice}
              title={isRecording ? 'Detener micrófono' : 'Dictar respuesta por voz'}
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${
                isRecording
                  ? 'border-red-300 bg-red-50 text-red-500 hover:bg-red-100'
                  : 'border-[#E5E2DA] bg-white text-[#6B6866] hover:border-[#185FA5] hover:text-[#185FA5]'
              }`}
            >
              {isRecording ? (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2.5 7.5A5.5 5.5 0 008 13m0 0a5.5 5.5 0 005.5-5.5M8 13v2m-2 0h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isRecording ? 'Dictando…' : 'Escribe tu respuesta...'}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-[#E5E2DA] bg-white px-3 py-2 text-sm text-[#1A1A18] placeholder-[#9B9895] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {/* Continue diagnosis button */}
      {hasConversation && localCtx.nextQuestion && (
        <button
          onClick={() => sendMessage(`Continúa con la siguiente pregunta: ${localCtx.nextQuestion}`)}
          disabled={isLoading}
          className="mt-2 w-full rounded-lg border border-[#185FA5] px-4 py-2 text-sm font-semibold text-[#185FA5] transition-colors hover:bg-[#E6F1FB] disabled:opacity-50"
        >
          Continuar diagnóstico →
        </button>
      )}
    </div>
  )
}

// ─── Tab: Propagación ─────────────────────────────────────────────────────────
function TabPropagacion({ ctx }: { ctx: Zone1Context }) {
  if (ctx.propagationRules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-2 text-3xl">📡</div>
        <div className="text-sm font-semibold text-[#1A1A18]">Sin reglas de propagación</div>
        <div className="mt-1 text-[12px] text-[#6B6866]">
          Las reglas se generan automáticamente durante el diagnóstico.
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 pb-6">
      {ctx.propagationRules.map((rule, idx) => (
        <div key={idx} className="rounded-lg border border-[#E5E2DA] bg-white p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#185FA5]">
            {rule.agent}
          </div>
          <div className="mb-2 text-xs leading-relaxed text-[#1A1A18]">{rule.instruction}</div>
          <div className="text-[11px] leading-snug text-[#9B9895]">{rule.reason}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function Zone1Panel({
  shapeId,
  initialContext,
  onContextUpdate,
  onClose,
  onAdvanceToZone2,
}: Zone1PanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('fuentes')
  const [ctx, setCtx] = useState<Zone1Context>(initialContext ?? EMPTY_ZONE1_CONTEXT)
  const [canAdvance, setCanAdvance] = useState(
    (initialContext?.completeness ?? 0) >= 80
  )

  const handleContextUpdate = (newCtx: Zone1Context, completeness: number) => {
    setCtx(newCtx)
    onContextUpdate(newCtx, completeness)
    if (completeness >= 80) setCanAdvance(true)
  }

  const handleConversationComplete = () => setCanAdvance(true)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'fuentes', label: '📁 Fuentes' },
    { id: 'diagnostico', label: '🎙 Diagnóstico' },
    { id: 'datos', label: 'Datos' },
    { id: 'propagacion', label: 'Propagación' },
  ]

  return (
    <div
      className="pointer-events-auto fixed right-0 top-0 flex h-full w-[680px] flex-col bg-[#F7F7F5] shadow-2xl"
      style={{ zIndex: 9999 }}
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-[#E5E2DA] bg-white px-5 py-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🎬</span>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9B9895]">
                Acto #1 — Diagnóstico
              </div>
            </div>
            {ctx.presentationName ? (
              <div className="mt-0.5 text-sm font-semibold text-[#1A1A18]">
                {ctx.presentationName}
              </div>
            ) : (
              <div className="mt-0.5 text-[12px] text-[#9B9895]">
                Contexto, audiencia, fuentes y objetivo
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#9B9895] transition-colors hover:bg-[#F1EFE8] hover:text-[#1A1A18]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <CompletenessBar value={ctx.completeness ?? 0} />
          </div>
          {onAdvanceToZone2 && (
            <button
              onClick={onAdvanceToZone2}
              className="flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Avanzar Acto #2
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 border-b border-[#E5E2DA] bg-white px-5">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-[13px] font-medium transition-colors whitespace-nowrap ${
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
        {activeTab === 'fuentes' && (
          <TabFuentes shapeId={shapeId} />
        )}
        {activeTab === 'datos' && <TabDatos ctx={ctx} />}
        {activeTab === 'diagnostico' && (
          <TabDiagnostico
            ctx={ctx}
            shapeId={shapeId}
            onContextUpdate={handleContextUpdate}
            onConversationComplete={handleConversationComplete}
          />
        )}
        {activeTab === 'propagacion' && <TabPropagacion ctx={ctx} />}
      </div>
    </div>
  )
}
