'use client'

import { useState } from 'react'
import { Sparkles, Pencil, Check, X } from 'lucide-react'
import type { Zone3State, ColorSwatch } from '@/components/zones/zone3/types'
import { useAppStore } from '@/store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Props {
  state: Zone3State
  onChange: (s: Zone3State) => void
  onComplete: () => void
}

export default function PalettePanel({ state, onChange, onComplete }: Props) {
  const context = useAppStore((s) => s.context)
  const narrative = useAppStore((s) => s.narrative)
  const title = useAppStore((s) => s.presentationTitle)
  const setTitle = useAppStore((s) => s.setPresentationTitle)

  const [isGenTitle, setIsGenTitle] = useState(false)
  const [isGenPalette, setIsGenPalette] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const handleGenerateTitle = async () => {
    setIsGenTitle(true)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone3/generate-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone1Context: context, zone2Data: narrative }),
      })
      const data = await res.json()
      if (data.success && data.title) setTitle(data.title)
    } catch (err) { console.error('generate-title:', err) }
    finally { setIsGenTitle(false) }
  }

  const handleGeneratePalette = async () => {
    setIsGenPalette(true)
    try {
      const res = await fetch(`${API}/api/v1/zones/zone3/generate-palette`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone1Context: context, zone2Data: narrative }),
      })
      const data = await res.json()
      if (data.success) {
        onChange({
          ...state,
          palette: { swatches: data.swatches as ColorSwatch[], rationale: data.rationale, mood: data.mood },
          paletteGenerated: true,
        })
      }
    } catch (err) { console.error('generate-palette:', err) }
    finally { setIsGenPalette(false) }
  }

  const saveTitle = () => {
    const v = editValue.trim()
    if (v) setTitle(v)
    setIsEditing(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Title section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Título de la presentación
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setIsEditing(false) }}
              className="flex-1 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 outline-none focus:border-neutral-900"
            />
            <button onClick={saveTitle} className="rounded-lg bg-neutral-900 p-2 text-white"><Check size={14} /></button>
            <button onClick={() => setIsEditing(false)} className="rounded-lg border border-neutral-200 p-2 text-neutral-500"><X size={14} /></button>
          </div>
        ) : title && title ? (
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-neutral-800">{title}</p>
            <button onClick={() => { setEditValue(title); setIsEditing(true) }} className="text-neutral-400 hover:text-neutral-600">
              <Pencil size={14} />
            </button>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-neutral-400 mb-1">Sin título aún</p>
            <p className="text-xs text-neutral-300">Claude genera un título basado en tus tópicos y objetivo</p>
          </div>
        )}
        <button
          onClick={handleGenerateTitle}
          disabled={isGenTitle}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          <Sparkles size={14} />
          {isGenTitle ? 'Generando título...' : title && title ? 'Regenerar título' : 'Generar título con IA'}
        </button>
      </div>

      {/* Palette section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Paleta de colores
        </div>
        {state.palette ? (
          <div>
            <SwatchRow swatches={state.palette.swatches} />
            <div className="mt-4 rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-600 leading-relaxed">{state.palette.rationale}</p>
            </div>
            <p className="mt-2 text-[11px] text-neutral-400 italic">&ldquo;{state.palette.mood}&rdquo;</p>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="flex justify-center gap-2 mb-3">
              {['#1A2F4E', '#2563EB', '#10B981', '#6B7280', '#F9FAFB'].map((c, i) => (
                <div key={i} className="h-10 w-10 rounded-lg border border-neutral-200 opacity-30" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className="text-sm text-neutral-400">Paleta no generada aun</p>
          </div>
        )}
        <button
          onClick={handleGeneratePalette}
          disabled={isGenPalette}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          <Sparkles size={14} />
          {isGenPalette ? 'Generando paleta...' : state.paletteGenerated ? 'Regenerar paleta' : 'Generar paleta con IA'}
        </button>
      </div>

      {/* Advance */}
      {state.paletteGenerated && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Paleta lista</div>
            <div className="text-sm text-neutral-700">{state.palette?.swatches.length} colores generados</div>
          </div>
          <button
            onClick={onComplete}
            className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Editar láminas &rarr;
          </button>
        </div>
      )}
    </div>
  )
}

function SwatchRow({ swatches }: { swatches: ColorSwatch[] }) {
  const roleColor: Record<string, string> = {
    primary: 'bg-blue-50 text-blue-700',
    secondary: 'bg-violet-50 text-violet-700',
    accent: 'bg-emerald-50 text-emerald-700',
    neutral: 'bg-neutral-100 text-neutral-600',
    background: 'bg-neutral-50 text-neutral-400',
  }
  return (
    <div className="flex flex-wrap gap-3">
      {swatches.map((sw, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="h-14 w-14 rounded-lg border border-neutral-200 shadow-sm" style={{ backgroundColor: sw.hex }} />
          <span className="font-mono text-[9px] uppercase text-neutral-500">{sw.hex}</span>
          <span className="text-[9px] text-neutral-400">{sw.name}</span>
          <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-semibold uppercase ${roleColor[sw.role] ?? 'bg-neutral-100 text-neutral-500'}`}>
            {sw.role}
          </span>
        </div>
      ))}
    </div>
  )
}
