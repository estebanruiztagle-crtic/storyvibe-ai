'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, ArrowRight, Link as LinkIcon, X } from 'lucide-react'
import type { Zone1Context } from '@/components/zones/zone1/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const URL_RE = /https?:\/\/[^\s"'<>()[\]{}|\\^`]{4,}/g

interface SourceFile {
  id: string
  type: 'image' | 'audio' | 'video' | 'text'
  name: string
  size: number
  preview?: string
  transcription?: string
  description?: string
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

interface Props {
  projectId: string
  ctx: Zone1Context
  sources: SourceFile[]
  onUpdate: (ctx: Zone1Context) => void
  onComplete: () => void
}

export default function DiagnosisChat({ projectId, ctx, sources, onUpdate, onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const chatEnd = useRef<HTMLDivElement>(null)

  // URL reading
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [fetchedUrl, setFetchedUrl] = useState<{ url: string; title: string; text: string; chars: number } | null>(null)
  const [fetchUrlErr, setFetchUrlErr] = useState<string | null>(null)
  const detectedUrl = input.match(URL_RE)?.[0] ?? null

  // Voice
  const [recording, setRecording] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ctx.conversation])

  // ── Voice ──────────────────────────────────────────────────────
  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.continuous = true
    rec.interimResults = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
      }
      if (final) setInput((p) => (p ? p + ' ' : '') + final)
    }
    rec.onend = () => setRecording(false)
    rec.start()
    recRef.current = rec
    setRecording(true)
  }
  const stopVoice = () => { recRef.current?.stop(); setRecording(false) }

  // ── URL fetch ──────────────────────────────────────────────────
  const handleFetchUrl = async () => {
    if (!detectedUrl) return
    setFetchingUrl(true)
    setFetchUrlErr(null)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone1/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: detectedUrl }),
      })
      const data = await res.json()
      if (data.success) {
        setFetchedUrl({ url: data.url, title: data.title, text: data.text, chars: data.chars })
      } else {
        setFetchUrlErr(data.error ?? 'No se pudo leer')
      }
    } catch {
      setFetchUrlErr('Error de conexión')
    } finally {
      setFetchingUrl(false)
    }
  }

  // ── Send message ───────────────────────────────────────────────
  const send = async (message: string, initial = false) => {
    if (!initial && !message.trim()) return
    if (loading) return
    if (recording) stopVoice()

    let finalMessage = message
    if (fetchedUrl && !initial) {
      const block = `[Contenido de ${fetchedUrl.url}]\nTítulo: "${fetchedUrl.title}"\n\n${fetchedUrl.text}\n\n---`
      const note = message.replace(URL_RE, '').trim()
      finalMessage = note ? `${block}\n\n${note}` : block
      setFetchedUrl(null)
    }

    setLoading(true)
    setInput('')

    const doneSources = sources.filter((s) => s.status === 'done')
    const sourceSummary = doneSources.length > 0
      ? doneSources.map((s) => {
          const content = s.description ?? s.transcription ?? ''
          const label = s.type === 'image' ? '🖼 Imagen' : s.type === 'audio' ? '🎵 Audio' : s.type === 'video' ? '🎬 Video' : '📝 Texto'
          return `${label}: ${s.name}${content ? `\n  ${content.slice(0, 400)}` : ''}`
        }).join('\n\n')
      : null

    try {
      const res = await fetch(`${API}/api/v1/zones/zone1/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: projectId,
          conversationHistory: ctx.conversation,
          currentContext: ctx,
          userMessage: finalMessage,
          sourceSummary,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success && data.updatedContext) {
        onUpdate(data.updatedContext)
        const pct = data.completeness ?? data.updatedContext.completeness ?? 0
        if (pct >= 80 || data.conversationComplete) onComplete()
      }
    } catch {
      const errMsg = {
        role: 'agent' as const,
        content: 'Error al conectar con el agente. Intenta de nuevo.',
        timestamp: new Date().toISOString(),
      }
      onUpdate({ ...ctx, conversation: [...ctx.conversation, errMsg] })
    } finally {
      setLoading(false)
    }
  }

  const hasChat = ctx.conversation.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Next question hint */}
      {ctx.nextQuestion && (
        <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
            Siguiente pregunta
          </div>
          <div className="text-sm font-medium text-blue-800">{ctx.nextQuestion}</div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
        {!hasChat ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="text-4xl">🎙</div>
            <div>
              <div className="text-sm font-semibold text-neutral-800">Diagnóstico de Contexto</div>
              <div className="mt-1 text-xs text-neutral-500">
                El agente te hará preguntas para construir el contexto completo.
              </div>
            </div>
            <button
              onClick={() => send('', true)}
              disabled={loading}
              className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Iniciar diagnóstico'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ctx.conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-800 shadow-sm border border-neutral-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
        )}
      </div>

      {/* Input area */}
      {hasChat && (
        <div className="mt-3 flex flex-col gap-2">
          {/* Recording indicator */}
          {recording && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="flex-1 text-[11px] font-medium text-red-700">Escuchando…</span>
              <button onClick={stopVoice} className="text-[11px] font-semibold text-red-700 hover:underline">Detener</button>
            </div>
          )}

          {/* URL strip */}
          {detectedUrl && !fetchedUrl && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
              <LinkIcon size={12} className="text-blue-500" />
              <span className="flex-1 truncate text-[11px] text-blue-700">
                {detectedUrl.replace(/^https?:\/\//, '').slice(0, 60)}
              </span>
              <button
                onClick={handleFetchUrl}
                disabled={fetchingUrl}
                className="rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {fetchingUrl ? 'Leyendo…' : 'Leer →'}
              </button>
            </div>
          )}

          {fetchUrlErr && (
            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-1.5">
              <span className="text-[11px] text-red-700">{fetchUrlErr}</span>
              <button onClick={() => setFetchUrlErr(null)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
            </div>
          )}

          {fetchedUrl && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
              <span className="flex-1 text-[11px] text-emerald-700">
                <span className="font-semibold">{fetchedUrl.title}</span>
                <span className="ml-2 text-[10px]">{fetchedUrl.chars.toLocaleString()} chars</span>
              </span>
              <button onClick={() => setFetchedUrl(null)} className="text-neutral-400 hover:text-red-500"><X size={12} /></button>
            </div>
          )}

          {/* Input row */}
          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2">
            <button
              type="button"
              onClick={recording ? stopVoice : startVoice}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                recording
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
              }`}
            >
              {recording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recording ? 'Dictando…' : 'Escribe tu respuesta...'}
              disabled={loading}
              className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition-opacity hover:bg-neutral-800 disabled:opacity-30"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Continue button */}
          {ctx.nextQuestion && (
            <button
              onClick={() => send(`Continúa: ${ctx.nextQuestion}`)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            >
              Continuar diagnóstico <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
