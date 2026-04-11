'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Palette, Layers, Play } from 'lucide-react'
import StepTransition from '@/components/wizard/StepTransition'
import PalettePanel from '@/components/design/PalettePanel'
import SlideEditor from '@/components/design/SlideEditor'
import PresentationViewer from '@/components/design/PresentationViewer'
import { useAppStore } from '@/store'
import type { Zone3Slide } from '@/components/zones/zone3/types'

type SubStep = 'palette' | 'slides' | 'presentation'

const SUB_STEPS: { id: SubStep; label: string; icon: typeof Palette }[] = [
  { id: 'palette',      label: 'Paleta',       icon: Palette },
  { id: 'slides',       label: 'Láminas',      icon: Layers },
  { id: 'presentation', label: 'Presentación', icon: Play },
]

export default function DesignStep() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const design = useAppStore((s) => s.design)
  const setDesign = useAppStore((s) => s.setDesign)
  const narrative = useAppStore((s) => s.narrative)

  // Initialize slides from approved curve points if not already done
  useEffect(() => {
    if (design.slides.length === 0 && narrative.curvePoints.length > 0) {
      const slides: Zone3Slide[] = narrative.curvePoints.map((p) => ({
        slide: p.slide,
        label: p.label,
        fullLabel: p.fullLabel,
        type: p.type,
        emotion: p.emotion,
        intensity: p.intensity,
        useGraphic: false,
        approved: false,
      }))
      setDesign({ ...design, slides })
    }
  }, [design, narrative.curvePoints, setDesign])

  const [step, setStep] = useState<SubStep>(
    design.slides.some((s) => s.approved) ? 'presentation'
    : design.paletteGenerated ? 'slides'
    : 'palette'
  )

  const stepIdx = SUB_STEPS.findIndex((s) => s.id === step)
  const allApproved = design.slides.length > 0 && design.slides.every((s) => s.approved)

  return (
    <StepTransition className="max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Diseño Visual
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Paleta, láminas y presentación final.
          </p>
        </div>
        {allApproved && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => router.push(`/project/${id}/review`)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Evaluación <ArrowRight size={14} />
          </motion.button>
        )}
      </div>

      {/* Sub-step tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-neutral-100 p-1">
        {SUB_STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = s.id === step
          const isDone = i < stepIdx
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : isDone
                    ? 'text-emerald-600 hover:text-emerald-700'
                    : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Icon size={14} />
              {s.label}
              {isDone && <span className="text-emerald-500">&check;</span>}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'palette' && (
              <PalettePanel
                state={design}
                onChange={setDesign}
                onComplete={() => setStep('slides')}
              />
            )}
            {step === 'slides' && (
              <SlideEditor
                state={design}
                onChange={setDesign}
                onComplete={() => setStep('presentation')}
              />
            )}
            {step === 'presentation' && (
              <PresentationViewer state={design} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </StepTransition>
  )
}
