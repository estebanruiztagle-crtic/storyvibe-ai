import Link from 'next/link'

const STEPS = [
  { num: '01', label: 'Diagnóstico', color: '#818CF8' },
  { num: '02', label: 'Narrativa',   color: '#34D399' },
  { num: '03', label: 'Diseño',      color: '#F472B6' },
  { num: '04', label: 'Evaluación',  color: '#FBBF24' },
  { num: '05', label: 'Exportar',    color: '#60A5FA' },
]

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px 64px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        transition: 'background-color 0.22s ease',
      }}
    >
      {/* ── Ambient glow ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 40% at 20% 30%, rgba(99,102,241,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 35% at 80% 70%, rgba(52,211,153,0.07) 0%, transparent 70%)
        `,
      }} />

      {/* ── Dot grid ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(128,128,128,0.12) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse 80% 60% at center, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at center, black 30%, transparent 100%)',
      }} />

      {/* ── Badge ── */}
      <div style={{ position: 'relative', zIndex: 2, marginBottom: 48 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--accent-dim)',
          border: '1px solid var(--border-accent)',
          borderRadius: 100, padding: '5px 14px',
          fontSize: 11, fontWeight: 600, color: 'var(--accent-light)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-light)', display: 'inline-block' }} />
          Powered by Claude AI
        </span>
      </div>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: 24, maxWidth: 640 }}>
        <h1 style={{
          fontSize: 'clamp(52px, 9vw, 88px)',
          fontWeight: 800,
          lineHeight: 0.92,
          letterSpacing: '-0.04em',
          color: 'var(--text)',
          margin: 0,
        }}>
          Story
          <span style={{ color: 'var(--accent-light)' }}>Vibe</span>
          <br />
          <span style={{ fontSize: '0.62em', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '-0.02em' }}>
            AI
          </span>
        </h1>
      </div>

      {/* ── Tagline ── */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-mid)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
          Transforma cualquier contenido en un pitch deck extraordinario
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Narrativa en tres actos · Diseño por IA · Exporta en PPTX
        </p>
      </div>

      {/* ── CTA ── */}
      <div style={{ position: 'relative', zIndex: 2, marginBottom: 80 }}>
        <Link
          href="/project/new/context"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            backgroundColor: 'var(--accent)', color: '#fff',
            padding: '14px 32px', borderRadius: 10,
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            letterSpacing: '-0.01em',
            boxShadow: '0 0 40px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.3)',
            transition: 'opacity 0.15s',
          }}
        >
          Crear presentación
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      {/* ── Steps row ── */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', gap: 2, flexWrap: 'nowrap',
        padding: '4px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-sm)',
        transition: 'background 0.22s, border-color 0.22s',
      }}>
        {STEPS.map((step, i) => (
          <div key={step.num} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 10,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: step.color, flexShrink: 0, opacity: 0.9,
            }} />
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}>
                {step.num}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', lineHeight: 1.3, marginTop: 2 }}>
                {step.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 16, borderTop: '1px solid var(--border)', marginLeft: 4 }} />
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
