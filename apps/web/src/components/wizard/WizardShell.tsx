'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MessageSquareText,
  BookOpen,
  Layers,
  CheckCircle,
  Download,
} from 'lucide-react'

const STEPS = [
  { key: 'context',   label: 'Diagnóstico', icon: MessageSquareText, path: 'context' },
  { key: 'narrative', label: 'Narrativa',   icon: BookOpen,          path: 'narrative' },
  { key: 'design',    label: 'Diseño',      icon: Layers,            path: 'design' },
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
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#07080E' }}
    >
      {/* ── Top bar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        height: 52,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(7,8,14,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          style={{
            fontSize: 13, fontWeight: 700, color: '#EEF0FA',
            letterSpacing: '-0.02em', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6,
            background: '#6366F1', fontSize: 11, fontWeight: 800, color: '#fff',
          }}>S</span>
          StoryVibe AI
        </button>

        {/* Step nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isActive = i === current
            const isDone   = i < current
            const isFuture = i > current

            return (
              <button
                key={step.key}
                onClick={() => router.push(`/project/${projectId}/${step.path}`)}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12, fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : isDone ? '#9296B0' : '#3E4260',
                  background: isActive ? '#6366F1' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'color 0.15s, background 0.15s',
                  opacity: isFuture ? 0.5 : 1,
                }}
              >
                <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                <span style={{ display: 'none' }} className="sm:inline">{step.label}</span>
                <span className="hidden sm:inline">{step.label}</span>
                {isDone && (
                  <span style={{ fontSize: 9, color: '#34D399' }}>✓</span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ width: 88 }} />
      </header>

      {/* ── Progress bar ── */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.04)' }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(90deg, #6366F1, #818CF8)' }}
          initial={false}
          animate={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Content ── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
