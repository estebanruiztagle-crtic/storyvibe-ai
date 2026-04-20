'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Layers, Play } from 'lucide-react'
import StepTransition from '@/components/wizard/StepTransition'
import PalettePanel from '@/components/design/PalettePanel'
import SlideEditor from '@/components/design/SlideEditor'
import PresentationViewer from '@/components/design/PresentationViewer'
import { useAppStore } from '@/store'
import type { Zone3Slide } from '@/components/zones/zone3/types'

type SubStep = 'slides' | 'presentation'

const SUB_STEPS: { id: SubStep; label: string; icon: typeof Layers }[] = [
  { id: 'slides',       label: 'Láminas',      icon: Layers },
  { id: 'presentation', label: 'Presentación', icon: Play },
]

export default function DesignStep() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const design = useAppStore((s) => s.design)
  const setDesign = useAppStore((s) => s.setDesign)
  const narrative = useAppStore((s) => s.narrative)

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
    design.slides.some((s) => s.approved) ? 'presentation' : 'slides'
  )

  const stepIdx  = SUB_STEPS.findIndex((s) => s.id === step)
  const allApproved = design.slides.length > 0 && design.slides.every((s) => s.approved)

  return (
    <StepTransition className="max-w-6xl">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#EEF0FA', margin: 0, letterSpacing: '-0.03em' }}>
            Diseño Visual
          </h1>
          <p style={{ fontSize: 13, color: '#5B5F7A', margin: '4px 0 0' }}>
            Define el layout, imágenes y aprueba cada lámina.
          </p>
        </div>
        {allApproved && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => router.push(`/project/${id}/review`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#34D399', color: '#022c22',
              padding: '10px 20px', borderRadius: 8,
              fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              boxShadow: '0 0 24px rgba(52,211,153,0.25)',
            }}
          >
            Evaluación <ArrowRight size={14} />
          </motion.button>
        )}
      </div>

      {/* ── Sub-step tabs ── */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 20,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: 3,
      }}>
        {SUB_STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = s.id === step
          const isDone = i < stepIdx
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 7,
                fontSize: 12, fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : isDone ? '#34D399' : '#5B5F7A',
                background: isActive ? '#6366F1' : 'transparent',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={13} />
              {s.label}
              {isDone && <span style={{ fontSize: 9 }}>✓</span>}
            </button>
          )
        })}
      </div>

      {/* ── Content card ── */}
      <div style={{
        background: '#0D0F1A',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 24,
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
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
