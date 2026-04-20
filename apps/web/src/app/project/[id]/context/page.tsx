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

  const ctx = useAppStore((s) => s.context) ?? EMPTY_ZONE1_CONTEXT
  const setContext = useAppStore((s) => s.setContext)

  const [tab, setTab] = useState<Tab>('sources')
  const [sources, setSources] = useState<SourceFile[]>([])
  const [canAdvance, setCanAdvance] = useState(false)

  const doneSources = sources.filter((s) => s.status === 'done')
  const hasStartedChat = ctx.conversation.length > 0
  const completeness = ctx.completeness ?? 0
  const canGoNext = canAdvance || completeness >= 80

  const TABS: { id: Tab; label: string; icon: typeof FolderOpen }[] = [
    {
      id: 'sources',
      label: sources.length > 0 ? `Fuentes (${sources.length})` : 'Fuentes',
      icon: FolderOpen,
    },
    {
      id: 'chat',
      label: doneSources.length > 0 ? `Diagnóstico ✦${doneSources.length}` : 'Diagnóstico',
      icon: MessageSquareText,
    },
  ]

  return (
    <StepTransition className="max-w-7xl">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#EEF0FA', margin: 0, letterSpacing: '-0.03em' }}>
            Diagnóstico
          </h1>
          <p style={{ fontSize: 13, color: '#5B5F7A', margin: '4px 0 0' }}>
            Contexto, audiencia y objetivos de tu presentación.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 140 }}>
            <CompletenessBar value={completeness} />
          </div>
          {canGoNext && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push(`/project/${id}/narrative`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#34D399', color: '#022c22',
                padding: '10px 20px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                boxShadow: '0 0 24px rgba(52,211,153,0.25)',
              }}
            >
              Narrativa <ArrowRight size={14} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="lg:grid-cols-5-custom">
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
          {/* Left: tab panel */}
          <div>
            {/* Tab switcher */}
            <div style={{
              display: 'flex', gap: 2, marginBottom: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: 3,
            }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '8px 14px', borderRadius: 7,
                    fontSize: 12, fontWeight: tab === t.id ? 600 : 500,
                    color: tab === t.id ? '#fff' : '#5B5F7A',
                    background: tab === t.id ? '#6366F1' : 'transparent',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{
              background: '#0D0F1A', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 20, minHeight: 480,
            }}>
              <AnimatePresence mode="wait">
                {tab === 'sources' ? (
                  <motion.div key="sources"
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.2 }}
                  >
                    <SourceUploader projectId={id} sources={sources} onSourcesChange={setSources} />
                    {sources.length > 0 && !hasStartedChat && (
                      <button
                        onClick={() => setTab('chat')}
                        style={{
                          marginTop: 16, width: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '10px 0', borderRadius: 8,
                          fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          background: 'rgba(99,102,241,0.08)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          color: '#818CF8', transition: 'background 0.15s',
                        }}
                      >
                        <MessageSquareText size={14} />
                        Iniciar diagnóstico con estas fuentes
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="chat"
                    initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.2 }}
                    style={{ minHeight: 440 }}
                  >
                    <DiagnosisChat
                      projectId={id} ctx={ctx} sources={sources}
                      onUpdate={setContext} onComplete={() => setCanAdvance(true)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: context cards */}
          <div>
            <div style={{
              position: 'sticky', top: 16,
              background: '#0D0F1A', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 20,
              maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3E4260', marginBottom: 12 }}>
                Datos extraídos
              </div>
              <ContextCards ctx={ctx} />
            </div>
          </div>
        </div>
      </div>
    </StepTransition>
  )
}
