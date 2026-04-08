'use client'

import { useState } from 'react'
import type {
  Act3State,
  SlideContent,
  ColorPalette,
  TypographyStyle,
  VisualDensity,
  PaletteId,
} from './types'
import { PALETTES, TYPOGRAPHY_STYLES } from './types'
import { type Act3ReportData, type PitchData, generateAct3ReportHtml } from './generateAct3Report'
import { generateSlidesPdf } from './generateSlidesPdf'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Act3PanelProps {
  shapeId: string
  initialState: Act3State
  zone1ContextJson?: string
  curvePointsJson?: string
  zone2DataJson?: string
  onStateUpdate: (state: Act3State) => void
  onClose: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const T = {
  bg:            '#FFFFFF',
  bgSecondary:   '#F7F7F5',
  border:        '#E5E2DA',
  text:          '#1A1A18',
  textSecondary: '#6B6866',
  textTertiary:  '#9B9895',
  accent:        '#6B3FA0',
  accentBg:      '#EEEDFE',
} as const

type ActiveTab = 'look_feel' | 'slides'

const DENSITY_OPTIONS: { id: VisualDensity; label: string; desc: string }[] = [
  { id: 'clean',    label: 'Clean',    desc: 'Ultra limpio' },
  { id: 'balanced', label: 'Balanced', desc: 'Equilibrado' },
  { id: 'rich',     label: 'Rich',     desc: 'Rico en contenido' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tryParse(json: string): Record<string, unknown> | null {
  try { return JSON.parse(json) as Record<string, unknown> } catch { return null }
}

// ─── Act3Panel ────────────────────────────────────────────────────────────────
export default function Act3Panel({
  shapeId: _shapeId,
  initialState,
  zone1ContextJson,
  curvePointsJson,
  zone2DataJson,
  onStateUpdate,
  onClose,
}: Act3PanelProps) {
  const [state, setState]       = useState<Act3State>(initialState)
  const [activeTab, setActiveTab] = useState<ActiveTab>('look_feel')
  const [generating, setGenerating] = useState(false)

  const [exportingReport, setExportingReport] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())

  // ── Helpers ────────────────────────────────────────────────────────────────
  function updateLookAndFeel(patch: Partial<Act3State['lookAndFeel']>) {
    setState((prev) => {
      const next: Act3State = {
        ...prev,
        status: prev.status === 'empty' ? 'configuring' : prev.status,
        lookAndFeel: { ...prev.lookAndFeel, ...patch },
      }
      onStateUpdate(next)
      return next
    })
  }

  function selectPalette(palette: ColorPalette) {
    updateLookAndFeel({ paletteId: palette.id as PaletteId, palette })
  }

  function selectTypography(style: TypographyStyle) {
    updateLookAndFeel({ typographyStyle: style })
  }

  function selectDensity(density: VisualDensity) {
    updateLookAndFeel({ visualDensity: density })
  }

  function toggleNotes(slideNumber: number) {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(slideNumber)) {
        next.delete(slideNumber)
      } else {
        next.add(slideNumber)
      }
      return next
    })
  }

  // ── Export slides as printable PDF ────────────────────────────────────────
  function handleExportSlidesPdf() {
    if (state.slides.length === 0) return
    const presentationTitle = zone2DataJson
      ? (tryParse(zone2DataJson)?.presentationTitle as string | undefined)
      : undefined
    generateSlidesPdf(state, presentationTitle ?? 'presentacion')
  }

  // ── Export consolidated PDF report (3 acts) ──────────────────────────────
  async function handleExportReport() {
    setExportingReport(true)
    let zone1 = null
    let zone2 = null
    try { zone1 = zone1ContextJson ? JSON.parse(zone1ContextJson) : null } catch { /* empty */ }
    try { zone2 = zone2DataJson ? JSON.parse(zone2DataJson) : null } catch { /* empty */ }

    let pitchData: PitchData | undefined = undefined
    try {
      const totalSeconds = state.slides.reduce((acc, s) => acc + (s.durationSeconds ?? 120), 0)
      const pitchResp = await fetch(`${API_BASE}/api/v1/zones/zone5/generate-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboardSlides: state.slides.map((s) => ({
            slide: s.slideNumber,
            seconds: s.durationSeconds ?? 120,
            label: s.title.slice(0, 20),
            fullLabel: s.title,
            type: s.intensity >= 7 ? 'peak' : s.intensity <= 4 ? 'valley' : 'transition',
            emotion: s.emotion,
            intensity: s.intensity,
          })),
          zone1Context: zone1 ?? undefined,
          narrativeBrief: zone2?.narrativeBrief,
          presentationTitle: zone2?.presentationTitle,
          totalSeconds,
        }),
      })
      const pitchJson = await pitchResp.json()
      if (pitchJson?.pitch) {
        pitchData = pitchJson.pitch as PitchData
      }
    } catch {
      // Pitch API failed — continue without pitch data
    }

    try {
      const reportData: Act3ReportData = {
        zone1,
        zone2,
        act3: {
          lookAndFeel: state.lookAndFeel,
          slides: state.slides,
          generatedAt: state.generatedAt,
        },
        generatedAt: new Date().toISOString(),
        pitchData,
      }

      const html = generateAct3ReportHtml(reportData)
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
      }
    } finally {
      setExportingReport(false)
    }
  }

  // ── Generate slides ────────────────────────────────────────────────────────
  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    try {
      const zone2Data = zone2DataJson ? JSON.parse(zone2DataJson) : null
      const curvePoints =
        zone2Data?.curvePoints ?? (curvePointsJson ? JSON.parse(curvePointsJson) : [])
      const narrativeBrief     = zone2Data?.narrativeBrief
      const presentationTitle  = zone2Data?.presentationTitle

      const resp = await fetch(`${API_BASE}/api/v1/act3/generate-slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curvePoints,
          zone1Context: zone1ContextJson ? JSON.parse(zone1ContextJson) : undefined,
          lookAndFeel: state.lookAndFeel,
          narrativeBrief,
          presentationTitle,
        }),
      })

      const data = await resp.json()

      if (data.success) {
        const newState: Act3State = {
          ...state,
          slides: data.slides,
          status: 'ready',
          generatedAt: new Date().toISOString(),
        }
        setState(newState)
        onStateUpdate(newState)
        setActiveTab('slides')
      } else {
        setError(data.error ?? 'Error generando slides. Inténtalo de nuevo.')
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const slidesReady = state.slides.length > 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // Overlay
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Panel */}
      <div
        style={{
          width: 740,
          height: '90vh',
          backgroundColor: T.bg,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${T.border}`,
            position: 'sticky',
            top: 0,
            backgroundColor: T.bg,
            zIndex: 10,
            borderRadius: '16px 16px 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎨</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: T.text, lineHeight: 1.2 }}>
                Acto #3 — Diseño
              </div>
              <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>
                Look &amp; Feel · Contenido de slides
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              backgroundColor: T.bg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.textSecondary,
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '12px 20px 0',
            borderBottom: `1px solid ${T.border}`,
            backgroundColor: T.bg,
            position: 'sticky',
            top: 61,
            zIndex: 9,
          }}
        >
          {(
            [
              { id: 'look_feel' as ActiveTab, label: 'Look & Feel' },
              { id: 'slides'   as ActiveTab, label: 'Slides' },
            ] as const
          ).map((tab) => {
            const isActive   = activeTab === tab.id
            const isDisabled = tab.id === 'slides' && !slidesReady
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isDisabled
                    ? T.textTertiary
                    : isActive
                      ? T.accent
                      : T.textSecondary,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
                  cursor: isDisabled ? 'default' : 'pointer',
                  marginBottom: -1,
                  transition: 'color 0.15s',
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {activeTab === 'look_feel' && (
            <LookFeelTab
              state={state}
              generating={generating}
              error={error}
              onSelectPalette={selectPalette}
              onSelectTypography={selectTypography}
              onSelectDensity={selectDensity}
              onGenerate={handleGenerate}
            />
          )}
          {activeTab === 'slides' && (
            <SlidesTab
              state={state}
              expandedNotes={expandedNotes}
              onToggleNotes={toggleNotes}
              onGoToLookFeel={() => setActiveTab('look_feel')}
            />
          )}
        </div>

        {/* ── Footer — Exportar (fuera del scroll, siempre visible) ── */}
        {slidesReady && (
          <div
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${T.border}`,
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.bg,
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12, color: T.textTertiary }}>
              {state.slides.length} slide{state.slides.length !== 1 ? 's' : ''} generados
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleExportSlidesPdf}
                title="Exportar slides como PDF imprimible en paisaje A4"
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: T.accent,
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📄 Slides PDF
              </button>
              <button
                onClick={handleExportReport}
                disabled={exportingReport}
                title="Exportar reporte PDF consolidado de los 3 actos con guía de pitch"
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: T.accent,
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: exportingReport ? 'default' : 'pointer',
                  opacity: exportingReport ? 0.7 : 1,
                }}
              >
                {exportingReport ? '⏳ Generando pitch…' : '📋 Reporte PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Look & Feel Tab ──────────────────────────────────────────────────────────
function LookFeelTab({
  state,
  generating,
  error,
  onSelectPalette,
  onSelectTypography,
  onSelectDensity,
  onGenerate,
}: {
  state: Act3State
  generating: boolean
  error: string | null
  onSelectPalette: (p: ColorPalette) => void
  onSelectTypography: (t: TypographyStyle) => void
  onSelectDensity: (d: VisualDensity) => void
  onGenerate: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Section: Paleta de color */}
      <Section title="Paleta de color">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {PALETTES.map((palette) => {
            const isSelected = state.lookAndFeel.paletteId === palette.id
            return (
              <button
                key={palette.id}
                onClick={() => onSelectPalette(palette)}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? T.accent : T.border}`,
                  backgroundColor: isSelected ? T.accentBg : T.bg,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
              >
                {/* Color swatches */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[
                    palette.primary,
                    palette.secondary,
                    palette.accent,
                    palette.background,
                    palette.surface,
                  ].map((color, i) => (
                    <div
                      key={i}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        backgroundColor: color,
                        border: `1px solid ${T.border}`,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isSelected ? T.accent : T.text,
                    marginBottom: 2,
                  }}
                >
                  {palette.name}
                </div>
                <div style={{ fontSize: 11, color: T.textTertiary }}>
                  {palette.desc}
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Section: Estilo tipográfico */}
      <Section title="Estilo tipográfico">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TYPOGRAPHY_STYLES.map((typo) => {
            const isSelected = state.lookAndFeel.typographyStyle === typo.id
            return (
              <button
                key={typo.id}
                onClick={() => onSelectTypography(typo.id)}
                title={typo.desc}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                  backgroundColor: isSelected ? T.accent : T.bg,
                  color: isSelected ? '#FFFFFF' : T.text,
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: typo.fontFamily,
                }}
              >
                {typo.label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Section: Densidad visual */}
      <Section title="Densidad visual">
        <div style={{ display: 'flex', gap: 8 }}>
          {DENSITY_OPTIONS.map((opt) => {
            const isSelected = state.lookAndFeel.visualDensity === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => onSelectDensity(opt.id)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                  backgroundColor: isSelected ? T.accent : T.bg,
                  color: isSelected ? '#FFFFFF' : T.text,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: isSelected ? 'rgba(255,255,255,0.8)' : T.textTertiary,
                  }}
                >
                  {opt.desc}
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={generating}
        style={{
          width: '100%',
          padding: '13px 20px',
          borderRadius: 10,
          border: 'none',
          backgroundColor: generating ? '#9E82C6' : T.accent,
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 600,
          cursor: generating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background-color 0.15s',
        }}
      >
        {generating ? (
          <>
            <SpinnerIcon />
            Generando slides…
          </>
        ) : (
          'Generar contenido de slides →'
        )}
      </button>
    </div>
  )
}

// ─── Slides Tab ───────────────────────────────────────────────────────────────
function SlidesTab({
  state,
  expandedNotes,
  onToggleNotes,
  onGoToLookFeel,
}: {
  state: Act3State
  expandedNotes: Set<number>
  onToggleNotes: (slideNumber: number) => void
  onGoToLookFeel: () => void
}) {
  if (state.slides.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          gap: 16,
          color: T.textTertiary,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36 }}>🎨</div>
        <div style={{ fontSize: 15, color: T.textSecondary, fontWeight: 500 }}>
          Aún no hay slides generados
        </div>
        <div style={{ fontSize: 13 }}>
          Configura el Look &amp; Feel y presiona generar
        </div>
        <button
          onClick={onGoToLookFeel}
          style={{
            marginTop: 8,
            padding: '8px 18px',
            borderRadius: 8,
            border: `1.5px solid ${T.accent}`,
            backgroundColor: 'transparent',
            color: T.accent,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Volver a Look &amp; Feel
        </button>
      </div>
    )
  }

  const { slides, lookAndFeel } = state
  const n = slides.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Summary header */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          backgroundColor: T.bgSecondary,
          border: `1px solid ${T.border}`,
          fontSize: 12,
          color: T.textSecondary,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontWeight: 600, color: T.text }}>{n} slides</span>
        <span>·</span>
        <span>{lookAndFeel.palette.name}</span>
        <span>·</span>
        <span style={{ textTransform: 'capitalize' }}>{lookAndFeel.typographyStyle}</span>
      </div>

      {/* Slide cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {slides.map((slide) => (
          <SlideCard
            key={slide.slideNumber}
            slide={slide}
            isNotesExpanded={expandedNotes.has(slide.slideNumber)}
            onToggleNotes={() => onToggleNotes(slide.slideNumber)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── SlideCard ────────────────────────────────────────────────────────────────
function SlideCard({
  slide,
  isNotesExpanded,
  onToggleNotes,
}: {
  slide: SlideContent
  isNotesExpanded: boolean
  onToggleNotes: () => void
}) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        backgroundColor: T.bg,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${T.border}`,
          backgroundColor: T.bgSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Slide number badge */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            backgroundColor: T.accent,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {slide.slideNumber}
        </div>
        {/* Emotion chip */}
        <div
          style={{
            padding: '3px 8px',
            borderRadius: 20,
            backgroundColor: T.accentBg,
            color: T.accent,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {slide.emotion}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px' }}>
        {/* Title */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: T.text,
            marginBottom: slide.subtitle ? 4 : 10,
            lineHeight: 1.3,
          }}
        >
          {slide.title}
        </div>

        {/* Subtitle */}
        {slide.subtitle && (
          <div
            style={{
              fontSize: 13,
              color: T.textSecondary,
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            {slide.subtitle}
          </div>
        )}

        {/* Body text */}
        {slide.bodyText && (
          <div
            style={{
              fontSize: 13,
              color: T.textSecondary,
              marginBottom: 10,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {slide.bodyText}
          </div>
        )}

        {/* Bullets */}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul
            style={{
              margin: '0 0 10px 0',
              paddingLeft: 16,
              fontSize: 13,
              color: T.textSecondary,
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {slide.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}

        {/* Image placeholders */}
        {slide.images && slide.images.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {slide.images.map((img) => (
              <div
                key={img.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 6,
                  backgroundColor: T.bgSecondary,
                  border: `1px solid ${T.border}`,
                }}
              >
                <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>🖼</span>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600, color: T.text }}>{img.label}</span>
                  {' — '}
                  <span style={{ textTransform: 'capitalize' }}>
                    {img.placement.replace('_', ' ')}
                  </span>
                  {' — '}
                  <span style={{ fontStyle: 'italic', color: T.textTertiary }}>
                    &ldquo;
                    {img.suggestedPrompt.length > 60
                      ? img.suggestedPrompt.slice(0, 60) + '…'
                      : img.suggestedPrompt}
                    &rdquo;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Speaker notes (collapsible) */}
        {slide.speakerNotes && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={onToggleNotes}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 11,
                color: T.textTertiary,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: isNotesExpanded ? 6 : 0,
              }}
            >
              <span style={{ fontSize: 10 }}>{isNotesExpanded ? '▾' : '▸'}</span>
              Notas del presentador
            </button>
            {isNotesExpanded && (
              <div
                style={{
                  fontSize: 12,
                  color: T.textSecondary,
                  lineHeight: 1.5,
                  padding: '8px 10px',
                  borderRadius: 6,
                  backgroundColor: T.bgSecondary,
                  border: `1px solid ${T.border}`,
                }}
              >
                {slide.speakerNotes}
              </div>
            )}
          </div>
        )}

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge label={slide.designStyle} />
          <Badge label={slide.visualMood} />
          {slide.topicType && <Badge label={slide.topicType} muted />}
        </div>
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        backgroundColor: T.bg,
        padding: '14px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: T.textTertiary,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function Badge({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div
      style={{
        padding: '3px 8px',
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        backgroundColor: muted ? T.bgSecondary : T.accentBg,
        color: muted ? T.textTertiary : T.accent,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {label}
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
      />
      <path
        d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
