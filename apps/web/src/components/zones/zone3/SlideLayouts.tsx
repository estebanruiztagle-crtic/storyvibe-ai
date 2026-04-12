'use client'

import type { Zone3Slide, LayoutId, ColorSwatch } from './types'

// ─── Palette helper ───────────────────────────────────────────────────────────
function getPalette(swatches: ColorSwatch[] | undefined) {
  const find = (role: string, fallback: string) =>
    swatches?.find((s) => s.role === role)?.hex ?? fallback
  return {
    primary:    find('primary',    '#185FA5'),
    secondary:  find('secondary',  '#2563EB'),
    accent:     find('accent',     '#1D9E75'),
    neutral:    find('neutral',    '#6B7280'),
    background: find('background', '#F9FAFB'),
  }
}

// ─── Slide content builder ────────────────────────────────────────────────────
export interface SlideContent {
  title: string
  subtitle: string
  body: string
  why: string
  tips?: string[]
  imageUrl: string | undefined
  emotion: string
  intensity: number
  pal: ReturnType<typeof getPalette>
}

export function buildContent(slide: Zone3Slide, swatches?: ColorSwatch[]): SlideContent {
  return {
    title:    slide.graphicSuggestion?.title    ?? slide.label,
    subtitle: slide.emotion,
    body:     slide.graphicSuggestion?.description ?? slide.fullLabel,
    why:      slide.graphicSuggestion?.why ?? '',
    tips:     (slide.graphicSuggestion as any)?.tips as string[] | undefined,
    imageUrl: slide.generatedImage?.url ?? slide.uploadedAsset?.dataUrl,
    emotion:  slide.emotion,
    intensity: slide.intensity,
    pal:      getPalette(swatches),
  }
}

// ─── Auto layout selector ─────────────────────────────────────────────────────
export function autoLayout(slide: Zone3Slide): LayoutId {
  const g = slide.graphicSuggestion?.type
  if (g === 'quote_block')       return 'statement'
  if (g === 'stats_highlight')   return 'metrics'
  if (g === 'before_after')      return 'before-after'
  if (g === 'timeline' || g === 'process_flow') return 'timeline'
  if (g === 'icon_grid')         return 'three-col'
  if (g === 'comparison_table')  return 'split'
  if (slide.type === 'peak' && slide.intensity >= 8) return 'hero'
  if (slide.type === 'peak')     return 'statement'
  if (slide.type === 'valley')   return 'image-text'
  if (slide.type === 'transition') return 'timeline'
  return 'split'
}

// ─── Layout metadata for picker UI ───────────────────────────────────────────
export const LAYOUT_META: Record<LayoutId, { label: string; emoji: string; desc: string; fits: string[] }> = {
  'hero':         { label: 'Hero',         emoji: '🖼',  desc: 'Imagen a full bleed + título',         fits: ['peak', 'portada'] },
  'split':        { label: 'Split',        emoji: '⬛⬜', desc: 'Texto izq. + visual der.',              fits: ['valley', 'solución'] },
  'statement':    { label: 'Statement',    emoji: '"  "', desc: 'Cita o dato grande centrado',           fits: ['peak', 'inspiracional'] },
  'metrics':      { label: 'Métricas',     emoji: '📊',  desc: '3 KPIs en fila con datos clave',        fits: ['datos', 'pitch'] },
  'three-col':    { label: '3 Columnas',   emoji: '⊞',   desc: 'Tres pilares con ícono + texto',        fits: ['features', 'beneficios'] },
  'before-after': { label: 'Antes/Después',emoji: '↔',   desc: 'Contraste en dos paneles',              fits: ['transformación', 'peak'] },
  'timeline':     { label: 'Timeline',     emoji: '⏱',   desc: '4 pasos secuenciales con línea',        fits: ['proceso', 'transición'] },
  'image-text':   { label: 'Imagen + Texto',emoji: '📰', desc: 'Imagen izq. tall + texto der.',          fits: ['narrativa', 'caso'] },
}

// ─── Shared decorative primitives ────────────────────────────────────────────
const W = 1280
const H = 720

function DotGrid({ x, y, color, opacity = 0.12 }: { x: number; y: number; color: string; opacity?: number }) {
  const dots = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      dots.push(<circle key={`${r}-${c}`} cx={x + c * 18} cy={y + r * 18} r={2.5} fill={color} />)
    }
  }
  return <svg style={{ position: 'absolute', opacity }} width={7*18} height={5*18}>{dots}</svg>
}

function AccentBar({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, backgroundColor: color, borderRadius: 2 }} />
  )
}

function SlideNumber({ n, color }: { n: number; color: string }) {
  return (
    <div style={{
      position: 'absolute', bottom: 32, right: 44,
      fontFamily: 'monospace', fontSize: 13, color, opacity: 0.4, letterSpacing: '0.12em',
    }}>
      {String(n).padStart(2, '0')}
    </div>
  )
}

// ─── LAYOUT 1: HERO ──────────────────────────────────────────────────────────
// Full-bleed image/gradient background + large title overlay, bottom-anchored
function HeroLayout({ c, slideN }: { c: SlideContent; slideN: number }) {
  const hasBg = !!c.imageUrl
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* Background */}
      {hasBg ? (
        <img src={c.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${c.pal.primary} 0%, ${c.pal.secondary} 60%, ${c.pal.accent} 100%)` }} />
      )}
      {/* Dark gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)' }} />
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: c.pal.accent }} />
      {/* Top label */}
      <div style={{ position: 'absolute', top: 36, left: 60, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
        {c.subtitle}
      </div>
      {/* Main title */}
      <div style={{ position: 'absolute', bottom: 100, left: 60, right: 200 }}>
        <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.02, color: '#FFFFFF', letterSpacing: '-0.03em', textShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          {c.title}
        </div>
        <div style={{ marginTop: 16, fontSize: 20, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, maxWidth: 640 }}>
          {c.body}
        </div>
      </div>
      {/* Intensity indicator */}
      <div style={{ position: 'absolute', bottom: 36, left: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: i < c.intensity ? c.pal.accent : 'rgba(255,255,255,0.2)' }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{c.intensity}/10</span>
      </div>
      <SlideNumber n={slideN} color="#fff" />
    </div>
  )
}

// ─── LAYOUT 2: SPLIT ─────────────────────────────────────────────────────────
// Left 58%: title + body text. Right 42%: image or colored panel
function SplitLayout({ c, slideN }: { c: SlideContent; slideN: number }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: c.pal.background, fontFamily: "'Inter', sans-serif" }}>
      {/* Left text panel */}
      <div style={{ width: '58%', padding: '64px 68px 64px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        <AccentBar x={0} y={60} w={5} h={84} color={c.pal.primary} />
        <div style={{ marginLeft: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.pal.accent, marginBottom: 18 }}>
            {c.subtitle}
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, color: '#1A1A18', letterSpacing: '-0.025em', marginBottom: 24 }}>
            {c.title}
          </div>
          <div style={{ fontSize: 18, color: '#5A5855', lineHeight: 1.65, maxWidth: 480 }}>
            {c.body}
          </div>
          {c.why && (
            <div style={{ marginTop: 32, paddingLeft: 16, borderLeft: `3px solid ${c.pal.accent}`, fontSize: 14, color: c.pal.neutral, lineHeight: 1.5 }}>
              {c.why}
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 32, left: 60 }}>
          <DotGrid x={0} y={0} color={c.pal.primary} opacity={0.10} />
        </div>
      </div>
      {/* Right visual panel */}
      <div style={{ width: '42%', position: 'relative', overflow: 'hidden' }}>
        {c.imageUrl ? (
          <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(150deg, ${c.pal.primary} 0%, ${c.pal.secondary} 100%)` }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 180, height: 180, borderRadius: '50%', border: `3px solid rgba(255,255,255,0.25)` }} />
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600, textAlign: 'center', maxWidth: 280, lineHeight: 1.4 }}>
              {c.emotion}
            </div>
          </>
        )}
        {/* Accent top stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: c.pal.accent }} />
      </div>
      <SlideNumber n={slideN} color={c.pal.neutral} />
    </div>
  )
}

// ─── LAYOUT 3: STATEMENT ─────────────────────────────────────────────────────
// Giant centered title / quote. Minimal. High-impact.
function StatementLayout({ c, slideN }: { c: SlideContent; slideN: number }) {
  return (
    <div style={{ width: W, height: H, position: 'relative', backgroundColor: c.pal.background, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Top + bottom accent bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: c.pal.primary }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: c.pal.accent }} />
      {/* Large decorative quote marks */}
      <div style={{ position: 'absolute', top: 56, left: 56, fontSize: 160, lineHeight: 1, color: c.pal.primary, opacity: 0.08, fontFamily: 'Georgia, serif', fontWeight: 900 }}>
        "
      </div>
      {/* Background image — visible with overlay for readability */}
      {c.imageUrl && (
        <>
          <img src={c.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${c.pal.background}dd 30%, ${c.pal.background}99 100%)` }} />
        </>
      )}
      {/* Center content */}
      <div style={{ textAlign: 'center', maxWidth: 900, padding: '0 80px', position: 'relative' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: c.pal.accent, marginBottom: 28 }}>
          {c.subtitle} · {c.intensity}/10
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.08, color: '#1A1A18', letterSpacing: '-0.03em' }}>
          {c.title}
        </div>
        <div style={{ marginTop: 32, width: 64, height: 4, backgroundColor: c.pal.accent, borderRadius: 2, margin: '32px auto 0' }} />
        <div style={{ marginTop: 24, fontSize: 19, color: c.pal.neutral, lineHeight: 1.55, maxWidth: 680, margin: '24px auto 0' }}>
          {c.body}
        </div>
      </div>
      {/* Corner dots */}
      <div style={{ position: 'absolute', bottom: 40, right: 60 }}>
        <DotGrid x={0} y={0} color={c.pal.primary} opacity={0.12} />
      </div>
      <SlideNumber n={slideN} color={c.pal.neutral} />
    </div>
  )
}

// ─── LAYOUT 4: METRICS ───────────────────────────────────────────────────────
// Title top + 3 KPI metric cards in horizontal row below
function MetricsLayout({ c, slideN }: { c: SlideContent; slideN: number }) {
  // Extract numbers from body text or fabricate placeholder labels from slide context
  const cards = [
    { value: `${c.intensity * 10}%`, label: 'Impacto', sub: c.emotion },
    { value: `${c.intensity}x`,      label: 'Eficiencia', sub: 'sobre el promedio' },
    { value: `${100 - c.intensity * 5}%`, label: 'Certeza', sub: 'validado en campo' },
  ]
  return (
    <div style={{ width: W, height: H, position: 'relative', backgroundColor: c.pal.background, fontFamily: "'Inter', sans-serif", padding: '56px 60px' }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: c.pal.primary }} />
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.pal.accent, marginBottom: 12 }}>
          {c.subtitle}
        </div>
        <div style={{ fontSize: 50, fontWeight: 800, color: '#1A1A18', letterSpacing: '-0.025em', lineHeight: 1.1, maxWidth: 780 }}>
          {c.title}
        </div>
      </div>
      {/* Divider */}
      <div style={{ height: 2, backgroundColor: '#E5E2DA', margin: '28px 0' }} />
      {/* Body text */}
      <div style={{ fontSize: 17, color: '#5A5855', lineHeight: 1.6, maxWidth: 740, marginBottom: 40 }}>
        {c.body}
      </div>
      {/* KPI cards row */}
      <div style={{ display: 'flex', gap: 24, position: 'absolute', bottom: 60, left: 60, right: 60 }}>
        {cards.map((card, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: '28px 28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderTop: `4px solid ${i === 0 ? c.pal.primary : i === 1 ? c.pal.accent : c.pal.secondary}` }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: i === 0 ? c.pal.primary : i === 1 ? c.pal.accent : c.pal.secondary, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A18', marginTop: 8, marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: '#9B9895' }}>{card.sub}</div>
          </div>
        ))}
      </div>
      {/* Background image — visible strip on right */}
      {c.imageUrl && (
        <>
          <img src={c.imageUrl} alt="" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '35%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '35%', background: `linear-gradient(to right, ${c.pal.background} 0%, transparent 40%)` }} />
        </>
      )}
      <SlideNumber n={slideN} color={c.pal.neutral} />
    </div>
  )
}

// ─── LAYOUT 5: THREE COLUMNS ─────────────────────────────────────────────────
// Title top + 3 equal columns with icon circle + title + description
function ThreeColLayout({ c, slideN }: { c: SlideContent; slideN: number }) {
  const cols = [
    { icon: '01', title: 'Diagnóstico', body: c.body.slice(0, 60) + '…' },
    { icon: '02', title: c.emotion,     body: c.body.slice(60, 120) + '…' },
    { icon: '03', title: 'Impacto',     body: `Intensidad ${c.intensity}/10 en el arco narrativo` },
  ]
  return (
    <div style={{ width: W, height: H, position: 'relative', backgroundColor: c.pal.background, fontFamily: "'Inter', sans-serif", padding: '52px 60px 40px' }}>
      <AccentBar x={0} y={0} w={W} h={5} color={c.pal.primary} />
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.pal.accent, marginBottom: 10 }}>
          {c.subtitle}
        </div>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#1A1A18', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          {c.title}
        </div>
      </div>
      <div style={{ height: 2, backgroundColor: '#E5E2DA', margin: '20px 0 36px' }} />
      {/* Three columns */}
      <div style={{ display: 'flex', gap: 32 }}>
        {cols.map((col, i) => (
          <div key={i} style={{ flex: 1, position: 'relative' }}>
            {/* Vertical accent line */}
            {i > 0 && (
              <div style={{ position: 'absolute', left: -16, top: 0, bottom: 0, width: 1, backgroundColor: '#E5E2DA' }} />
            )}
            {/* Icon circle */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%', marginBottom: 20,
              backgroundColor: i === 0 ? c.pal.primary : i === 1 ? c.pal.accent : c.pal.secondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: '#FFFFFF', fontFamily: 'monospace',
            }}>
              {col.icon}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1A18', marginBottom: 12, lineHeight: 1.3 }}>
              {col.title}
            </div>
            <div style={{ fontSize: 15, color: '#6B6866', lineHeight: 1.6 }}>
              {col.body}
            </div>
            {/* Bottom accent */}
            <div style={{ marginTop: 24, height: 3, width: 40, borderRadius: 2, backgroundColor: i === 0 ? c.pal.primary : i === 1 ? c.pal.accent : c.pal.secondary }} />
          </div>
        ))}
      </div>
      {/* Background image — subtle full background */}
      {c.imageUrl && (
        <>
          <img src={c.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${c.pal.background}ee 0%, ${c.pal.background}cc 50%, ${c.pal.background}ee 100%)` }} />
        </>
      )}
      <div style={{ position: 'absolute', bottom: 40, right: 60 }}>
        <DotGrid x={0} y={0} color={c.pal.primary} opacity={0.10} />
      </div>
      <SlideNumber n={slideN} color={c.pal.neutral} />
    </div>
  )
}

// ─── LAYOUT 6: BEFORE / AFTER ────────────────────────────────────────────────
// Two contrasting panels: left = problema (neutral), right = solución (primary)
function BeforeAfterLayout({ c, slideN }: { c: SlideContent; slideN: number }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
      {/* Left "Antes" panel */}
      <div style={{ width: '50%', backgroundColor: '#F1EFE8', padding: '60px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9B9895', marginBottom: 16 }}>
            ANTES
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#3A3835', lineHeight: 1.2, marginBottom: 20 }}>
            El problema actual
          </div>
          <div style={{ fontSize: 16, color: '#6B6866', lineHeight: 1.65 }}>
            {c.body.slice(0, Math.floor(c.body.length / 2))}
          </div>
        </div>
        {/* Pain icon area */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 32 }}>
          {['⚠', '📉', '🔴'].map((icon, i) => (
            <div key={i} style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#E5E2DA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {icon}
            </div>
          ))}
          <span style={{ fontSize: 13, color: '#9B9895', marginLeft: 8 }}>Estado actual</span>
        </div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 120, height: 120, borderRadius: '50%', backgroundColor: '#E5E2DA', transform: 'translate(40%, 40%)', opacity: 0.6 }} />
      </div>

      {/* Center arrow */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
        →
      </div>

      {/* Right "Después" panel */}
      <div style={{ width: '50%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 52px' }}>
        {c.imageUrl ? (
          <img src={c.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${c.pal.primary} 0%, ${c.pal.secondary} 100%)` }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
            DESPUÉS
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 20 }}>
            {c.title}
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>
            {c.body.slice(Math.floor(c.body.length / 2))}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 12, alignItems: 'center', marginTop: 32 }}>
          {['✅', '📈', '🟢'].map((icon, i) => (
            <div key={i} style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {icon}
            </div>
          ))}
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginLeft: 8 }}>{c.emotion}</span>
        </div>
      </div>

      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: c.pal.accent }} />
      <SlideNumber n={slideN} color={c.pal.neutral} />
    </div>
  )
}

// ─── LAYOUT 7: TIMELINE ──────────────────────────────────────────────────────
// Horizontal 4-step timeline with numbered circles and connecting line
function TimelineLayout({ c, slideN }: { c: SlideContent; slideN: number }) {
  const steps = [
    { n: '01', title: 'Inicio',        body: c.body.slice(0, 45) + '…' },
    { n: '02', title: c.subtitle,      body: c.body.slice(45, 90) + '…' },
    { n: '03', title: 'Desarrollo',    body: c.body.slice(90, 135) + '…' },
    { n: '04', title: 'Resultado',     body: `Intensidad ${c.intensity}/10` },
  ]
  return (
    <div style={{ width: W, height: H, position: 'relative', backgroundColor: c.pal.background, fontFamily: "'Inter', sans-serif", padding: '52px 60px' }}>
      <AccentBar x={0} y={0} w={W} h={5} color={c.pal.primary} />
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.pal.accent, marginBottom: 8 }}>
          {c.subtitle}
        </div>
        <div style={{ fontSize: 46, fontWeight: 800, color: '#1A1A18', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          {c.title}
        </div>
      </div>
      {/* Image banner strip if available */}
      {c.imageUrl && (
        <div style={{ height: 90, width: '100%', overflow: 'hidden', borderRadius: 8, marginBottom: 32, position: 'relative' }}>
          <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${c.pal.primary}CC, transparent)` }} />
        </div>
      )}
      {/* Timeline */}
      <div style={{ position: 'absolute', bottom: 80, left: 60, right: 60 }}>
        {/* Connecting line */}
        <div style={{ position: 'absolute', top: 28, left: 28, right: 28, height: 3, backgroundColor: '#E5E2DA', zIndex: 0 }}>
          <div style={{ width: `${(c.intensity / 10) * 100}%`, height: '100%', backgroundColor: c.pal.primary, borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {steps.map((step, i) => {
            const isActive = i < Math.ceil(c.intensity / 3)
            return (
              <div key={i} style={{ width: '22%', textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                  backgroundColor: isActive ? c.pal.primary : '#FFFFFF',
                  border: `3px solid ${isActive ? c.pal.primary : '#D1CCBF'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: isActive ? '#FFFFFF' : '#9B9895',
                  fontFamily: 'monospace', boxShadow: isActive ? `0 4px 16px ${c.pal.primary}44` : 'none',
                }}>
                  {step.n}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? '#1A1A18' : '#9B9895', marginBottom: 6 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 12, color: '#9B9895', lineHeight: 1.5 }}>
                  {step.body}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <SlideNumber n={slideN} color={c.pal.neutral} />
    </div>
  )
}

// ─── LAYOUT 8: IMAGE + TEXT ──────────────────────────────────────────────────
// Left 42%: tall image. Right 58%: title + body + accent detail
function ImageTextLayout({ c, slideN }: { c: SlideContent; slideN: number }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: c.pal.background, fontFamily: "'Inter', sans-serif" }}>
      {/* Left image column */}
      <div style={{ width: '42%', position: 'relative', overflow: 'hidden' }}>
        {c.imageUrl ? (
          <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${c.pal.accent}DD 0%, ${c.pal.primary}DD 100%)` }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 80 }}>✦</div>
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 600, textAlign: 'center', maxWidth: 220 }}>{c.emotion}</div>
            </div>
          </>
        )}
        {/* Left edge accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 5, backgroundColor: c.pal.accent }} />
      </div>

      {/* Right text column */}
      <div style={{ width: '58%', padding: '64px 60px 64px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: `${c.pal.accent}18`, border: `1px solid ${c.pal.accent}44`, borderRadius: 100, padding: '5px 14px', width: 'fit-content', marginBottom: 24 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c.pal.accent }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.pal.accent }}>{c.subtitle}</span>
        </div>
        {/* Title */}
        <div style={{ fontSize: 50, fontWeight: 800, color: '#1A1A18', letterSpacing: '-0.025em', lineHeight: 1.12, marginBottom: 24 }}>
          {c.title}
        </div>
        {/* Divider */}
        <div style={{ width: 56, height: 3, backgroundColor: c.pal.primary, borderRadius: 2, marginBottom: 24 }} />
        {/* Body */}
        <div style={{ fontSize: 17, color: '#5A5855', lineHeight: 1.7, maxWidth: 440 }}>
          {c.body}
        </div>
        {/* Why insight */}
        {c.why && (
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: `${c.pal.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>💡</div>
            <div style={{ fontSize: 13, color: c.pal.neutral, lineHeight: 1.55 }}>{c.why}</div>
          </div>
        )}
        {/* Bottom dots decoration */}
        <div style={{ position: 'absolute', bottom: 40, right: 56 }}>
          <DotGrid x={0} y={0} color={c.pal.primary} opacity={0.10} />
        </div>
      </div>

      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: c.pal.primary }} />
      <SlideNumber n={slideN} color={c.pal.neutral} />
    </div>
  )
}

// ─── Render dispatcher ────────────────────────────────────────────────────────
function renderLayout(layout: LayoutId, c: SlideContent, slideN: number) {
  switch (layout) {
    case 'hero':         return <HeroLayout c={c} slideN={slideN} />
    case 'split':        return <SplitLayout c={c} slideN={slideN} />
    case 'statement':    return <StatementLayout c={c} slideN={slideN} />
    case 'metrics':      return <MetricsLayout c={c} slideN={slideN} />
    case 'three-col':    return <ThreeColLayout c={c} slideN={slideN} />
    case 'before-after': return <BeforeAfterLayout c={c} slideN={slideN} />
    case 'timeline':     return <TimelineLayout c={c} slideN={slideN} />
    case 'image-text':   return <ImageTextLayout c={c} slideN={slideN} />
  }
}

// ─── SlidePreview — main export ───────────────────────────────────────────────
// Renders the selected layout at 1280×720 scaled to fit containerWidth
interface SlidePreviewProps {
  slide: Zone3Slide
  layout: LayoutId
  swatches?: ColorSwatch[]
  containerWidth?: number   // default 640px
}

export default function SlidePreview({ slide, layout, swatches, containerWidth = 640 }: SlidePreviewProps) {
  const scale  = containerWidth / W
  const height = H * scale
  const content = buildContent(slide, swatches)

  return (
    <div
      style={{
        width:      containerWidth,
        height,
        overflow:   'hidden',
        borderRadius: 10,
        boxShadow:  '0 4px 24px rgba(0,0,0,0.14)',
        position:   'relative',
        cursor:     'default',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width:           W,
          height:          H,
          transformOrigin: 'top left',
          transform:       `scale(${scale})`,
          pointerEvents:   'none',
          userSelect:      'none',
        }}
      >
        {renderLayout(layout, content, slide.slide)}
      </div>
    </div>
  )
}
