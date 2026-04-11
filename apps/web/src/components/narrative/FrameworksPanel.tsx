'use client'

import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import type { Zone2State, StorytellingFramework } from '@/components/zones/zone2/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Props {
  state: Zone2State
  projectId: string
  context: Record<string, unknown>
  onChange: (s: Zone2State) => void
  onComplete: () => void
}

export default function FrameworksPanel({ state, projectId, context, onChange, onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const { frameworks, selectedFrameworkId, topics } = state

  const research = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone2/suggest-frameworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: projectId,
          topics: topics.filter((t) => t.selected),
          zone1Context: context,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) onChange({ ...state, frameworks: data.frameworks })
    } catch (err) { console.error('suggest-frameworks:', err) }
    finally { setLoading(false) }
  }

  const select = (id: string) => onChange({ ...state, selectedFrameworkId: id })
  const selected = frameworks.find((f) => f.id === selectedFrameworkId)

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={research}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        <Sparkles size={14} />
        {loading ? 'Investigando...' : frameworks.length > 0 ? 'Regenerar frameworks' : 'Investigar frameworks con IA'}
      </button>

      {/* Framework grid */}
      {frameworks.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {frameworks.map((fw) => (
            <FrameworkCard
              key={fw.id}
              fw={fw}
              isSelected={fw.id === selectedFrameworkId}
              onSelect={() => select(fw.id)}
            />
          ))}
        </div>
      )}

      {/* Selected banner */}
      {selected && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Framework seleccionado</div>
            <div className="text-sm font-semibold text-neutral-800">{selected.name}</div>
          </div>
          <button
            onClick={onComplete}
            className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Generar curva →
          </button>
        </div>
      )}
    </div>
  )
}

function FrameworkCard({ fw, isSelected, onSelect }: { fw: StorytellingFramework; isSelected: boolean; onSelect: () => void }) {
  const fitColor = fw.fitScore >= 85 ? 'text-emerald-600 bg-emerald-50' : fw.fitScore >= 70 ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isSelected ? 'border-emerald-200 bg-emerald-50/30' : 'border-neutral-100 bg-white hover:border-neutral-300'
    }`}>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-neutral-800">{fw.name}</div>
          <div className="text-[11px] text-neutral-400">{fw.origin}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${fitColor}`}>{fw.fitScore}%</span>
          {fw.recommended && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">recomendado</span>}
        </div>
      </div>

      <p className="mb-2 text-[11px] leading-relaxed text-neutral-500">{fw.description}</p>

      {fw.fitReasons.length > 0 && (
        <ul className="mb-2 space-y-0.5">
          {fw.fitReasons.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[10px] text-neutral-500">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              {r}
            </li>
          ))}
        </ul>
      )}

      {fw.emotionalArc.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {fw.emotionalArc.map((arc, i) => (
            <span key={i} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">{arc}</span>
          ))}
        </div>
      )}

      {fw.risk && <p className="mb-3 text-[10px] italic text-neutral-400">{fw.risk}</p>}

      <button
        onClick={onSelect}
        className={`w-full rounded-lg py-1.5 text-xs font-semibold transition-all ${
          isSelected
            ? 'bg-emerald-600 text-white'
            : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
        }`}
      >
        {isSelected ? <span className="flex items-center justify-center gap-1"><Check size={12} /> seleccionado</span> : 'seleccionar'}
      </button>
    </div>
  )
}
