'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquareText,
  BookOpen,
  Layers,
  CheckCircle,
  Download,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react'
import { useAppStore } from '@/store'

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

function ResetModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0D0F1A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          width: 360,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertTriangle size={20} color="#F87171" />
        </div>

        {/* Title */}
        <p style={{ fontSize: 16, fontWeight: 700, color: '#EEF0FA', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          ¿Borrar todo el contenido?
        </p>
        <p style={{ fontSize: 13, color: '#5B5F7A', margin: '0 0 24px', lineHeight: 1.5 }}>
          Se eliminarán el diagnóstico, narrativa, diseño y evaluación del proyecto actual. Esta acción no se puede deshacer.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8,
              fontSize: 13, fontWeight: 500,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#9296B0', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              background: '#EF4444',
              border: 'none',
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(239,68,68,0.25)',
            }}
          >
            Sí, borrar todo
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
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
  const resetProject = useAppStore((s) => s.resetProject)

  const [showResetModal, setShowResetModal] = useState(false)

  function handleConfirmReset() {
    resetProject()
    setShowResetModal(false)
    router.push(`/project/${projectId}/context`)
  }

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

        {/* Reset button */}
        <button
          onClick={() => setShowResetModal(true)}
          title="Nuevo proyecto"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            fontSize: 12, fontWeight: 500,
            color: '#3E4260',
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#F87171'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#3E4260'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
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

      {/* ── Reset confirmation modal ── */}
      <AnimatePresence>
        {showResetModal && (
          <ResetModal
            onConfirm={handleConfirmReset}
            onCancel={() => setShowResetModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
