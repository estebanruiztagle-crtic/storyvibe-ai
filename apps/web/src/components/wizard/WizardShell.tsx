'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MessageSquareText,
  BookOpen,
  Palette,
  CheckCircle,
  Download,
} from 'lucide-react'

const STEPS = [
  { key: 'context',   label: 'Contexto',   icon: MessageSquareText, path: 'context' },
  { key: 'narrative', label: 'Narrativa',   icon: BookOpen,          path: 'narrative' },
  { key: 'design',    label: 'Diseño',      icon: Palette,           path: 'design' },
  { key: 'review',    label: 'Evaluación',  icon: CheckCircle,       path: 'review' },
  { key: 'export',    label: 'Exportar',    icon: Download,          path: 'export' },
] as const

export type StepKey = (typeof STEPS)[number]['key']

function getCurrentStep(pathname: string): number {
  const segment = pathname.split('/').pop() ?? ''
  const idx = STEPS.findIndex((s) => s.path === segment)
  return idx >= 0 ? idx : 0
}

export default function WizardShell({
  projectId,
  children,
}: {
  projectId: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const current = getCurrentStep(pathname)

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: '#FAF9F7' }}>
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between border-b border-neutral-200/60 px-6 py-3">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-semibold tracking-tight text-neutral-800 hover:text-neutral-600 transition-colors"
        >
          StoryVibe AI
        </button>

        {/* ── Step indicators ── */}
        <nav className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isActive = i === current
            const isDone = i < current

            return (
              <button
                key={step.key}
                onClick={() =>
                  router.push(`/project/${projectId}/${step.path}`)
                }
                className={`
                  relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : isDone
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'text-neutral-400 hover:text-neutral-500'}
                `}
              >
                <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="hidden sm:inline">{step.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="step-pill"
                    className="absolute inset-0 rounded-full bg-neutral-900 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <div className="w-20" /> {/* spacer for balance */}
      </header>

      {/* ── Progress bar ── */}
      <div className="h-0.5 bg-neutral-100">
        <motion.div
          className="h-full bg-neutral-900"
          initial={false}
          animate={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
