'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, List, BookOpen, TrendingUp } from 'lucide-react'
import StepTransition from '@/components/wizard/StepTransition'
import TopicsPanel from '@/components/narrative/TopicsPanel'
import FrameworksPanel from '@/components/narrative/FrameworksPanel'
import EmotionalCurve from '@/components/narrative/EmotionalCurve'
import { useAppStore } from '@/store'
import { EMPTY_ZONE2 } from '@/components/zones/zone2/types'

type SubStep = 'topics' | 'frameworks' | 'curve'

const SUB_STEPS: { id: SubStep; label: string; icon: typeof List }[] = [
  { id: 'topics',     label: 'Tópicos',    icon: List },
  { id: 'frameworks', label: 'Framework',   icon: BookOpen },
  { id: 'curve',      label: 'Curva',       icon: TrendingUp },
]

export default function NarrativeStep() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const narrative = useAppStore((s) => s.narrative)
  const setNarrative = useAppStore((s) => s.setNarrative)
  const context = useAppStore((s) => s.context)

  const [step, setStep] = useState<SubStep>(
    narrative.curveStatus === 'approved' ? 'curve'
    : narrative.selectedFrameworkId ? 'curve'
    : narrative.topics.length > 0 ? 'frameworks'
    : 'topics'
  )

  const stepIdx = SUB_STEPS.findIndex((s) => s.id === step)
  const canAdvance = narrative.curveStatus === 'approved'

  return (
    <StepTransition className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Arquitectura Narrativa
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Temas, framework narrativo y curva emocional.
          </p>
        </div>
        {canAdvance && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => router.push(`/project/${id}/design`)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Diseño <ArrowRight size={14} />
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
              {isDone && <span className="text-emerald-500">✓</span>}
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
            {step === 'topics' && (
              <TopicsPanel
                state={narrative}
                projectId={id}
                context={context as unknown as Record<string, unknown> ?? {}}
                onChange={setNarrative}
                onComplete={() => setStep('frameworks')}
              />
            )}
            {step === 'frameworks' && (
              <FrameworksPanel
                state={narrative}
                projectId={id}
                context={context as unknown as Record<string, unknown> ?? {}}
                onChange={setNarrative}
                onComplete={() => setStep('curve')}
              />
            )}
            {step === 'curve' && (
              <EmotionalCurve
                state={narrative}
                projectId={id}
                context={context as unknown as Record<string, unknown> ?? {}}
                onChange={setNarrative}
                onApproved={() => {}}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </StepTransition>
  )
}
