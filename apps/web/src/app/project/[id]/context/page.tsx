'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderOpen, MessageSquareText, ArrowRight } from 'lucide-react'
import StepTransition from '@/components/wizard/StepTransition'
import DiagnosisChat from '@/components/context/DiagnosisChat'
import ContextCards, { CompletenessBar } from '@/components/context/ContextCards'
import SourceUploader, { type SourceFile } from '@/components/context/SourceUploader'
import { useAppStore } from '@/store'
import { EMPTY_ZONE1_CONTEXT } from '@/components/zones/zone1/types'

type Tab = 'sources' | 'chat'

export default function ContextStep() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  // Store
  const ctx = useAppStore((s) => s.context) ?? EMPTY_ZONE1_CONTEXT
  const setContext = useAppStore((s) => s.setContext)

  // Local state
  const [tab, setTab] = useState<Tab>('sources')
  const [sources, setSources] = useState<SourceFile[]>([])
  const [canAdvance, setCanAdvance] = useState(false)

  const doneSources = sources.filter((s) => s.status === 'done')
  const hasStartedChat = ctx.conversation.length > 0

  // Auto-switch to chat after adding sources
  const handleSwitchToChat = () => setTab('chat')

  return (
    <StepTransition className="max-w-7xl">
      {/* Header row */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Diagnóstico
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Contexto, audiencia y objetivos de tu presentación.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-40">
            <CompletenessBar value={ctx.completeness ?? 0} />
          </div>
          {(canAdvance || (ctx.completeness ?? 0) >= 80) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push(`/project/${id}/narrative`)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
            >
              Narrativa <ArrowRight size={14} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Sources + Chat */}
        <div className="lg:col-span-3">
          {/* Tab switcher */}
          <div className="mb-4 flex gap-1 rounded-xl bg-neutral-100 p-1">
            {[
              {
                id: 'sources' as Tab,
                label: sources.length > 0 ? `Fuentes (${sources.length})` : 'Fuentes',
                icon: FolderOpen,
              },
              {
                id: 'chat' as Tab,
                label: doneSources.length > 0 ? `Diagnóstico ✦${doneSources.length}` : 'Diagnóstico',
                icon: MessageSquareText,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" style={{ minHeight: 480 }}>
            <AnimatePresence mode="wait">
              {tab === 'sources' ? (
                <motion.div
                  key="sources"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SourceUploader
                    projectId={id}
                    sources={sources}
                    onSourcesChange={setSources}
                  />
                  {sources.length > 0 && !hasStartedChat && (
                    <button
                      onClick={handleSwitchToChat}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      <MessageSquareText size={14} />
                      Iniciar diagnóstico con estas fuentes
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                  style={{ minHeight: 440 }}
                >
                  <DiagnosisChat
                    projectId={id}
                    ctx={ctx}
                    sources={sources}
                    onUpdate={setContext}
                    onComplete={() => setCanAdvance(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Live context cards */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Datos extraídos
            </div>
            <ContextCards ctx={ctx} />
          </div>
        </div>
      </div>
    </StepTransition>
  )
}
