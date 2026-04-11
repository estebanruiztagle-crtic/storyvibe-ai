'use client'

import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import type { Zone2State, Topic } from '@/components/zones/zone2/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TYPE_COLORS: Record<string, string> = {
  problema_contexto: 'bg-blue-50 text-blue-700',
  dato_duro:         'bg-neutral-100 text-neutral-600',
  propuesta_valor:   'bg-violet-50 text-violet-700',
  prueba_social:     'bg-emerald-50 text-emerald-700',
  visión:            'bg-amber-50 text-amber-700',
  contexto_mercado:  'bg-orange-50 text-orange-700',
}

interface Props {
  state: Zone2State
  projectId: string
  context: Record<string, unknown>
  onChange: (s: Zone2State) => void
  onComplete: () => void
}

export default function TopicsPanel({ state, projectId, context, onChange, onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const { authorPattern, topics } = state

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone2/suggest-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentationId: projectId, zone1Context: context }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) onChange({ ...state, topics: data.topics, authorPattern: data.authorPattern })
    } catch (err) { console.error('suggest-topics:', err) }
    finally { setLoading(false) }
  }

  const toggle = (id: string) => {
    onChange({
      ...state,
      topics: topics.map((t) => t.id === id && !t.mandatory ? { ...t, selected: !t.selected } : t),
    })
  }

  const selected = topics.filter((t) => t.selected)
  const ready = selected.length >= 4

  return (
    <div className="flex flex-col gap-4">
      {/* Author pattern summary */}
      {authorPattern.presentationsAnalyzed > 0 && (
        <div className="rounded-xl border border-neutral-100 bg-white p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Patrón del autor</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-neutral-800">{authorPattern.presentationsAnalyzed}</div>
              <div className="text-[10px] text-neutral-400">presentaciones</div>
            </div>
            <div>
              <div className="text-lg font-bold text-neutral-800">{authorPattern.topicCountMin}–{authorPattern.topicCountMax}</div>
              <div className="text-[10px] text-neutral-400">rango tópicos</div>
            </div>
            <div>
              <div className="text-lg font-bold text-neutral-800">{authorPattern.confidence}%</div>
              <div className="text-[10px] text-neutral-400">confianza</div>
            </div>
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        <Sparkles size={14} />
        {loading ? 'Generando...' : topics.length > 0 ? 'Regenerar tópicos' : 'Generar tópicos con IA'}
      </button>

      {/* Topics list */}
      {topics.length > 0 && (
        <div className="flex flex-col gap-2">
          {topics.map((topic) => (
            <TopicRow key={topic.id} topic={topic} onToggle={() => toggle(topic.id)} />
          ))}
        </div>
      )}

      {/* Summary + advance */}
      {topics.length > 0 && (
        <div className={`flex items-center justify-between rounded-xl border p-4 ${
          ready ? 'border-emerald-200 bg-emerald-50' : 'border-neutral-200 bg-neutral-50'
        }`}>
          <div className="text-sm text-neutral-700">
            <strong>{selected.length}</strong> tópicos · {selected.reduce((s, t) => s + (t.durationMinutes ?? 0), 0)} min
          </div>
          <button
            onClick={onComplete}
            disabled={!ready}
            className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-30"
          >
            Continuar →
          </button>
        </div>
      )}
    </div>
  )
}

function TopicRow({ topic, onToggle }: { topic: Topic; onToggle: () => void }) {
  const rejected = !topic.selected && !topic.mandatory
  const typeClass = TYPE_COLORS[topic.type] ?? 'bg-neutral-100 text-neutral-600'

  return (
    <div
      onClick={onToggle}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
        topic.selected
          ? 'border-emerald-200 bg-emerald-50/50'
          : rejected ? 'opacity-40 border-neutral-100 bg-white' : 'border-neutral-100 bg-white hover:border-neutral-300'
      } ${topic.mandatory ? 'cursor-default' : ''}`}
    >
      {/* Checkbox */}
      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
        topic.selected ? 'bg-emerald-600' : 'border-2 border-neutral-200'
      }`}>
        {topic.selected && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold text-neutral-800 ${rejected ? 'line-through' : ''}`}>
            {topic.label}
          </span>
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${typeClass}`}>
            {topic.type.replace('_', ' ')}
          </span>
          {topic.mandatory && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">obligatorio</span>}
          {topic.systemSuggested && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">IA</span>}
        </div>
        <div className="mt-0.5 text-[11px] text-neutral-400">
          {topic.origin} · {topic.durationMinutes} min
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div className={`text-sm font-bold ${topic.score >= 8.5 ? 'text-emerald-600' : topic.score >= 7 ? 'text-blue-500' : 'text-neutral-400'}`}>
          {topic.score.toFixed(1)}
        </div>
        <div className="mt-0.5 h-1 w-10 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full ${topic.score >= 8.5 ? 'bg-emerald-500' : topic.score >= 7 ? 'bg-blue-400' : 'bg-neutral-300'}`}
            style={{ width: `${(topic.score / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
