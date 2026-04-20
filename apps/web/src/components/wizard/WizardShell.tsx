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
  Sun,
  Moon,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { useTheme } from '@/components/ThemeProvider'

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
        background: 'rgba(0,0,0,0.6)',
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
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 28px 24px',
          width: 360,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'var(--danger-dim)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertTriangle size={20} color="var(--danger)" />
        </div>

        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          ¿Borrar todo el contenido?
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Se eliminarán el diagnóstico, narrativa, diseño y evaluación del proyecto actual. Esta acción no se puede deshacer.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8,
              fontSize: 13, fontWeight: 500,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-mid)', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              background: 'var(--danger)',
              border: 'none',
              color: '#fff', cursor: 'pointer',
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
  const { theme, toggle } = useTheme()

  const [showResetModal, setShowResetModal] = useState(false)

  function handleConfirmReset() {
    resetProject()
    setShowResetModal(false)
    router.push(`/project/${projectId}/context`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* ── Top bar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        height: 52,
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--header-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text)',
            letterSpacing: '-0.02em', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--accent)', fontSize: 11, fontWeight: 800, color: '#fff',
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
                  padding: '6px 12px', borderRadius: 8,
                  fontSize: 12, fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : isDone ? 'var(--text-mid)' : 'var(--text-muted)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'color 0.15s, background 0.15s',
                  opacity: isFuture ? 0.5 : 1,
                }}
              >
                <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="hidden sm:inline">{step.label}</span>
                {isDone && <span style={{ fontSize: 9, color: 'var(--success)' }}>✓</span>}
              </button>
            )
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Modo día' : 'Modo noche'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-mid)', cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-dim)'
              e.currentTarget.style.color = 'var(--accent-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-2)'
              e.currentTarget.style.color = 'var(--text-mid)'
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Reset button */}
          <button
            onClick={() => setShowResetModal(true)}
            title="Nuevo proyecto"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8,
              fontSize: 12, fontWeight: 500,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger)'
              e.currentTarget.style.borderColor = 'var(--danger-dim)'
              e.currentTarget.style.background = 'var(--danger-dim)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div style={{ height: 2, background: 'var(--border)' }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-light))' }}
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
