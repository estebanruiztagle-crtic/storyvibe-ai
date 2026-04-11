'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import type { Zone3State } from '@/components/zones/zone3/types'
import SlidePreview, { autoLayout } from '@/components/zones/zone3/SlideLayouts'

interface Props {
  state: Zone3State
}

export default function PresentationViewer({ state }: Props) {
  const { slides } = state
  const [current, setCurrent] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setCurrent((i) => Math.min(slides.length - 1, i + 1))
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setCurrent((i) => Math.max(0, i - 1))
      else if (e.key === 'Escape' && fullscreen) setFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [slides.length, fullscreen])

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        <p className="text-sm">Sin láminas — completa la curva emocional primero</p>
      </div>
    )
  }

  const slide = slides[current]!
  const layout = slide.selectedLayout ?? autoLayout(slide)

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Main viewer */}
        <div className="relative rounded-2xl bg-neutral-900 p-6">
          <div className="mx-auto" style={{ maxWidth: 'calc((60vh) * 16 / 9)', aspectRatio: '16/9' }}>
            <SlidePreview slide={slide} layout={layout} swatches={state.palette?.swatches} containerWidth={700} />
          </div>
          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-3 right-3 rounded-lg bg-white/10 p-2 text-white/60 hover:bg-white/20 transition-colors"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-neutral-100 p-2">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 rounded-lg overflow-hidden transition-all ${
                current === i ? 'ring-2 ring-neutral-900 opacity-100' : 'opacity-50 hover:opacity-80'
              }`}
              style={{ width: 96, aspectRatio: '16/9' }}
            >
              <SlidePreview slide={s} layout={s.selectedLayout ?? autoLayout(s)} swatches={state.palette?.swatches} containerWidth={96} />
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent((i) => Math.max(0, i - 1))}
            disabled={current === 0}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 px-4 py-2 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-xs text-neutral-400">
            {current + 1} / {slides.length}
            {slide.label && <span className="ml-2 text-neutral-300">— {slide.label}</span>}
          </span>
          <button
            onClick={() => setCurrent((i) => Math.min(slides.length - 1, i + 1))}
            disabled={current === slides.length - 1}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 px-4 py-2 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
          >
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          onClick={() => setFullscreen(false)}
        >
          <div
            style={{ width: '90vw', maxWidth: 'calc(90vh * 16 / 9)', aspectRatio: '16/9' }}
            onClick={(e) => e.stopPropagation()}
          >
            <SlidePreview
              slide={slide}
              layout={layout}
              swatches={state.palette?.swatches}
              containerWidth={Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.9 : 1200, (typeof window !== 'undefined' ? window.innerHeight * 0.9 : 800) * 16 / 9)}
            />
          </div>
          <div className="mt-6 flex items-center gap-6">
            <button
              onClick={() => setCurrent((i) => Math.max(0, i - 1))}
              disabled={current === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-white/50">{current + 1} / {slides.length}</span>
            <button
              onClick={() => setCurrent((i) => Math.min(slides.length - 1, i + 1))}
              disabled={current === slides.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-6 text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  )
}
