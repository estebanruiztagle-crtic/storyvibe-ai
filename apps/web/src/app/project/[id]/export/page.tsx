'use client'

import StepTransition from '@/components/wizard/StepTransition'
import ExportPanel from '@/components/export/ExportPanel'

export default function ExportStep() {
  return (
    <StepTransition className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Guión & Exportar
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Genera el guión narrativo y expórtalo como brief para crear la presentación en Claude Design.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ExportPanel />
      </div>
    </StepTransition>
  )
}
