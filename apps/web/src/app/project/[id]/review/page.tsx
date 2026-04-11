'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import StepTransition from '@/components/wizard/StepTransition'
import EvaluationPanel from '@/components/review/EvaluationPanel'
import { useAppStore } from '@/store'

export default function ReviewStep() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const review = useAppStore((s) => s.review)

  const canAdvance = review?.overallStatus === 'pass' || review?.overallStatus === 'warning'

  return (
    <StepTransition className="max-w-5xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Evaluación
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Revisión de coherencia, brand compliance y carga cognitiva.
          </p>
        </div>
        {canAdvance && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => router.push(`/project/${id}/export`)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Exportar <ArrowRight size={14} />
          </motion.button>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <EvaluationPanel />
      </div>
    </StepTransition>
  )
}
