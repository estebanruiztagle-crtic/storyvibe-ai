'use client'

import { useState } from 'react'
import { FileText, FileJson, FileCode, Copy, Check, BookOpen, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface ScriptSection {
  beatRange: string
  title: string
  keyMessage: string
  whatToTell: string
  toneOfVoice: string
  transition: string
  keyQuestions: string[]
  durationSeconds: number
  durationPercent: number
}
interface ScriptData {
  overallNarrative: string
  totalSeconds: number
  sections: ScriptSection[]
}

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').trim()

export default function ExportPanel() {
  const narrative = useAppStore((s) => s.narrative)
  const context = useAppStore((s) => s.context)
  const title = useAppStore((s) => s.presentationTitle)
  const setTitle = useAppStore((s) => s.setPresentationTitle)

  const [script, setScript] = useState<ScriptData | null>(null)
  const [scriptLoading, setScriptLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const beats = narrative.curvePoints
  const totalSeconds = beats.reduce((s, p) => s + (p.durationSeconds ?? 90), 0)
  const framework = narrative.frameworks.find((f) => f.id === narrative.selectedFrameworkId)
  const selectedTopics = narrative.topics.filter((t) => t.selected).map((t) => t.label)
  const effectiveTitle = (title || context?.event?.name || 'Presentación').trim()

  // ── Generate narrative script ──
  const generateScript = async () => {
    if (beats.length === 0) return
    setScriptLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone5/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curvePoints: beats,
          zone1Context: context,
          narrativeBrief: narrative.narrativeBrief,
          frameworkName: framework?.name,
          selectedTopics,
          presentationTitle: effectiveTitle,
          totalSeconds,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success && data.script) setScript(data.script)
    } catch (err) {
      console.error('Script generation error:', err)
    } finally {
      setScriptLoading(false)
    }
  }

  // ── Build Markdown brief for Claude Design ──
  const buildMarkdown = (): string => {
    const ev = context?.event
    const au = context?.audience
    const ob = context?.objective
    const to = context?.tone
    const lines: string[] = []

    lines.push(`# ${effectiveTitle}`)
    lines.push('')
    lines.push('> Brief narrativo generado con Story Vibe AI. Úsalo como base para diseñar la presentación en Claude Design.')
    lines.push('')

    lines.push('## Contexto')
    if (ev?.type) lines.push(`- **Evento:** ${ev.type}${ev.name ? ` — ${ev.name}` : ''}`)
    if (ev?.format) lines.push(`- **Formato:** ${ev.format}`)
    if (au?.segments?.length) lines.push(`- **Audiencia:** ${au.segments.map((s) => `${s.role} (${s.percentage}%)`).join(', ')}`)
    if (au?.emotionalBaseline) lines.push(`- **Estado emocional inicial:** ${au.emotionalBaseline}`)
    if (ob?.primary) lines.push(`- **Objetivo:** ${ob.primary}`)
    if (ob?.desiredAction) lines.push(`- **Acción deseada:** ${ob.desiredAction}`)
    if (to?.primary) lines.push(`- **Tono:** ${to.primary}`)
    lines.push(`- **Duración:** ~${Math.round(totalSeconds / 60)} min · ${beats.length} beats`)
    lines.push('')

    if (framework?.name) {
      lines.push('## Framework narrativo')
      lines.push(`${framework.name}${framework.description ? ` — ${framework.description}` : ''}`)
      lines.push('')
    }

    if (script?.overallNarrative) {
      lines.push('## Arco narrativo')
      lines.push(script.overallNarrative)
      lines.push('')
    }

    if (script?.sections?.length) {
      lines.push('## Guión por secciones')
      script.sections.forEach((sec, i) => {
        lines.push('')
        lines.push(`### ${i + 1}. ${sec.title}`)
        lines.push(`*${sec.beatRange} · ${formatTime(sec.durationSeconds)} · ${sec.durationPercent}%*`)
        lines.push('')
        if (sec.keyMessage) lines.push(`- **Mensaje clave:** ${sec.keyMessage}`)
        if (sec.whatToTell) lines.push(`- **Qué contar:** ${sec.whatToTell}`)
        if (sec.toneOfVoice) lines.push(`- **Tono:** ${sec.toneOfVoice}`)
        if (sec.transition) lines.push(`- **Transición:** ${sec.transition}`)
        if (sec.keyQuestions?.length) {
          lines.push(`- **Preguntas clave:**`)
          sec.keyQuestions.forEach((q) => lines.push(`  - ${q}`))
        }
      })
      lines.push('')
    }

    lines.push('## Beats (curva emocional)')
    beats.forEach((b) => {
      lines.push(`${b.slide}. **${b.fullLabel || b.label}** — ${b.type}, emoción "${b.emotion}", intensidad ${b.intensity}/10 (~${formatTime(b.durationSeconds ?? 90)})`)
    })
    lines.push('')

    if (selectedTopics.length) {
      lines.push('## Tópicos clave')
      selectedTopics.forEach((t) => lines.push(`- ${t}`))
      lines.push('')
    }

    return lines.join('\n')
  }

  const buildJson = (): string => {
    return JSON.stringify(
      {
        title: effectiveTitle,
        context,
        framework: framework ? { name: framework.name, description: framework.description } : null,
        selectedTopics,
        narrativeBrief: narrative.narrativeBrief ?? null,
        totalSeconds,
        beats: beats.map((b) => ({
          n: b.slide,
          label: b.fullLabel || b.label,
          type: b.type,
          emotion: b.emotion,
          intensity: b.intensity,
          durationSeconds: b.durationSeconds ?? 90,
        })),
        script,
      },
      null,
      2
    )
  }

  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const slug = effectiveTitle.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'guion'

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: download if clipboard blocked
      download(`${slug}-brief.md`, buildMarkdown(), 'text/markdown')
    }
  }

  const handleExportPdf = () => {
    const html = buildReportHtml()
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 600)
    }
  }

  const buildReportHtml = (): string => {
    const ev = context?.event
    const au = context?.audience
    const ob = context?.objective
    const to = context?.tone

    const field = (label: string, value?: string | number | null) => {
      const v = value === undefined || value === null || value === '' || value === 0 ? null : String(value)
      return v ? `<div style="margin-bottom:8px;"><span style="font-size:10px;font-weight:700;color:#9b9895;text-transform:uppercase;letter-spacing:0.05em;">${label}</span><div style="font-size:13px;color:#1a1a18;margin-top:2px;">${v}</div></div>` : ''
    }

    const contextHtml = (ev || au || ob || to) ? `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Diagnóstico de contexto</h2>
      <div style="background:#f5f3ef;border-radius:12px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
        ${field('Evento', ev?.type)}
        ${field('Nombre', ev?.name)}
        ${field('Formato', ev?.format)}
        ${field('Duración', ev?.durationMinutes ? `${ev.durationMinutes} min` : '')}
        ${field('Objetivo', ob?.primary)}
        ${field('Acción deseada', ob?.desiredAction)}
        ${field('Tono', to?.primary)}
        ${field('Estado emocional audiencia', au?.emotionalBaseline)}
      </div>
    </div>` : ''

    const sectionsHtml = script?.sections?.length ? script.sections.map((sec, i) => `
      <div style="border:1px solid #e5e2da;border-radius:12px;padding:16px;margin-bottom:12px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="background:#1a1a18;color:white;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;">${sec.beatRange}</span>
          <span style="font-size:14px;font-weight:700;color:#1a1a18;">${i + 1}. ${sec.title}</span>
          <span style="margin-left:auto;font-size:11px;color:#9b9895;">${formatTime(sec.durationSeconds)} · ${sec.durationPercent}%</span>
        </div>
        ${sec.keyMessage ? `<p style="font-size:13px;color:#1a1a18;margin:0 0 8px;"><b>Mensaje clave:</b> ${sec.keyMessage}</p>` : ''}
        ${sec.whatToTell ? `<p style="font-size:12px;color:#444441;line-height:1.6;margin:0 0 8px;"><b>Qué contar:</b> ${sec.whatToTell}</p>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
          ${sec.toneOfVoice ? `<div style="background:#eff6ff;border-radius:8px;padding:10px;"><div style="font-size:9px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin-bottom:4px;">Tono</div><p style="font-size:11px;color:#1e3a5f;line-height:1.4;margin:0;">${sec.toneOfVoice}</p></div>` : ''}
          ${sec.transition ? `<div style="background:#f5f3ef;border-radius:8px;padding:10px;"><div style="font-size:9px;font-weight:700;color:#6b6866;text-transform:uppercase;margin-bottom:4px;">Transición</div><p style="font-size:11px;color:#444441;line-height:1.4;margin:0;">${sec.transition}</p></div>` : ''}
        </div>
        ${sec.keyQuestions?.length ? `<div style="background:#ecfdf5;border-radius:8px;padding:10px;margin-top:8px;"><div style="font-size:9px;font-weight:700;color:#059669;text-transform:uppercase;margin-bottom:4px;">Preguntas clave</div><ul style="margin:0;padding-left:14px;">${sec.keyQuestions.map((q) => `<li style="font-size:11px;color:#064e3b;line-height:1.4;">${q}</li>`).join('')}</ul></div>` : ''}
      </div>`).join('') : ''

    const scriptHtml = script ? `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Arco narrativo</h2>
      <div style="background:#f5f3ef;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="font-size:13px;color:#1a1a18;line-height:1.6;margin:0;">${script.overallNarrative}</p>
      </div>
      <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Guión por secciones</h2>
      ${sectionsHtml}
    </div>` : ''

    const beatsHtml = `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Beats (curva emocional)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="border-bottom:2px solid #e5e2da;">
          <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;">#</th>
          <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;">MOMENTO</th>
          <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;">TIPO</th>
          <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;">EMOCIÓN</th>
          <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;">INT.</th>
          <th style="text-align:left;padding:6px 8px;font-size:10px;color:#9b9895;">TIEMPO</th>
        </tr>
        ${beats.map((b) => `
        <tr style="border-bottom:1px solid #f0ede8;">
          <td style="padding:6px 8px;font-weight:600;">${b.slide}</td>
          <td style="padding:6px 8px;">${b.fullLabel || b.label}</td>
          <td style="padding:6px 8px;">${b.type}</td>
          <td style="padding:6px 8px;color:#6b6866;">${b.emotion}</td>
          <td style="padding:6px 8px;font-family:monospace;">${b.intensity}/10</td>
          <td style="padding:6px 8px;font-family:monospace;">${formatTime(b.durationSeconds ?? 90)}</td>
        </tr>`).join('')}
      </table>
    </div>`

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${effectiveTitle} — Guía narrativa</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 24px; color: #1a1a18; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  .meta { color: #9b9895; font-size: 13px; margin-bottom: 32px; }
  @media print {
    body { margin: 16px; max-width: 100%; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style></head><body>
<h1>${effectiveTitle}</h1>
<p class="meta">Guía narrativa generada por Story Vibe AI · ${beats.length} beats · ~${Math.round(totalSeconds / 60)} min · ${new Date().toLocaleDateString()}</p>
${contextHtml}
${scriptHtml}
${beatsHtml}
<p style="margin-top:32px;font-size:10px;color:#b8b4aa;text-align:center;">Usa esta guía como base para diseñar la presentación en Claude Design.</p>
</body></html>`
  }

  // ── Empty state ──
  if (beats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <BookOpen size={32} className="mb-3 text-neutral-300" />
        <p className="text-sm">Todavía no hay narrativa</p>
        <p className="text-xs mt-1">Genera y aprueba la curva emocional en el paso Narrativa</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Title + summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Título de la presentación</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={context?.event?.name || 'Escribe un título…'}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-neutral-400 focus:outline-none"
        />
        <div className="mt-3 flex gap-4 text-xs text-neutral-500">
          <span><b className="text-neutral-800">{beats.length}</b> beats</span>
          <span><b className="text-neutral-800">~{Math.round(totalSeconds / 60)}</b> min</span>
          {framework && <span>Framework: <b className="text-neutral-800">{framework.name}</b></span>}
        </div>
      </div>

      {/* Generate script */}
      {!script && !scriptLoading && (
        <button
          onClick={generateScript}
          className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          <Sparkles size={18} />
          Generar guión narrativo
        </button>
      )}
      {scriptLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-6">
          <Loader2 size={16} className="animate-spin text-neutral-400" />
          <span className="text-xs text-neutral-400">Generando guión narrativo…</span>
        </div>
      )}

      {/* Script */}
      {script && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-neutral-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Guión narrativo</span>
            </div>
            <button onClick={generateScript} disabled={scriptLoading} className="text-[10px] text-neutral-400 hover:text-neutral-600">
              <RefreshCw size={12} className={scriptLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Arco narrativo</div>
            <p className="text-sm text-neutral-700 leading-relaxed">{script.overallNarrative}</p>
          </div>

          <div className="space-y-3">
            {script.sections.map((sec, i) => (
              <div key={i} className="rounded-xl border border-neutral-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white">{sec.beatRange}</span>
                  <span className="text-sm font-semibold text-neutral-800">{i + 1}. {sec.title}</span>
                  <span className="ml-auto text-[10px] text-neutral-400">{formatTime(sec.durationSeconds)} · {sec.durationPercent}%</span>
                </div>
                {sec.keyMessage && <p className="text-xs text-neutral-800 mb-1.5"><span className="font-semibold">Mensaje clave:</span> {sec.keyMessage}</p>}
                {sec.whatToTell && <p className="text-xs text-neutral-600 leading-relaxed mb-3"><span className="font-semibold text-neutral-700">Qué contar:</span> {sec.whatToTell}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {sec.toneOfVoice && (
                    <div className="rounded-lg bg-blue-50/60 p-2.5">
                      <div className="text-[9px] font-bold uppercase text-blue-500 mb-1">Tono</div>
                      <p className="text-[11px] text-blue-800 leading-snug">{sec.toneOfVoice}</p>
                    </div>
                  )}
                  {sec.transition && (
                    <div className="rounded-lg bg-neutral-100/70 p-2.5">
                      <div className="text-[9px] font-bold uppercase text-neutral-500 mb-1">Transición</div>
                      <p className="text-[11px] text-neutral-700 leading-snug">{sec.transition}</p>
                    </div>
                  )}
                </div>
                {sec.keyQuestions?.length > 0 && (
                  <div className="mt-3 rounded-lg bg-emerald-50/60 p-2.5">
                    <div className="text-[9px] font-bold uppercase text-emerald-600 mb-1">Preguntas clave</div>
                    <ul className="space-y-0.5">
                      {sec.keyQuestions.map((q, j) => (
                        <li key={j} className="text-[11px] text-emerald-800 leading-snug">• {q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export actions */}
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Exportar para Claude Design
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar brief'}
          </button>
          <button
            onClick={() => download(`${slug}-brief.md`, buildMarkdown(), 'text/markdown')}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-white py-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <FileCode size={16} /> Markdown
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-white py-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <FileText size={16} /> Guía PDF
          </button>
          <button
            onClick={() => download(`${slug}.json`, buildJson(), 'application/json')}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-white py-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <FileJson size={16} /> JSON
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-neutral-400">
          Copia el brief y pégalo en Claude Design para generar la presentación.
        </p>
      </div>
    </div>
  )
}
