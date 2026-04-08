import Link from 'next/link'

const ACTS = [
  {
    num: '01',
    label: 'Diagnóstico',
    desc: 'Contexto, audiencia, fuentes y objetivo de la presentación',
    icon: '🎙',
    color: '#185FA5',
    bg: '#E6F1FB',
  },
  {
    num: '02',
    label: 'Arco Narrativo',
    desc: 'Tópicos, curva emocional y estructura dramática',
    icon: '📈',
    color: '#0F6E56',
    bg: '#E1F5EE',
  },
  {
    num: '03',
    label: 'Diseño',
    desc: 'Paleta visual, assets, crítica IA y storyboard final',
    icon: '🎨',
    color: '#6B3FA0',
    bg: '#EEEDFE',
  },
]

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0E0D0B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Film grain texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
        pointerEvents: 'none',
      }} />

      {/* Top film strip decoration */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 6,
        display: 'flex', gap: 2, overflow: 'hidden',
      }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: i % 3 === 0 ? '#2A2925' : '#1A1918', borderRadius: 1 }} />
        ))}
      </div>

      {/* Logo + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          backgroundColor: '#1A1918',
          border: '1.5px solid #2E2C28',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          🎬
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F5F3EE', letterSpacing: '-0.01em' }}>
            StoryVibe AI
          </div>
          <div style={{ fontSize: 10, color: '#6B6866', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Presentation Intelligence
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 580, marginBottom: 52 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          backgroundColor: '#1A1918', border: '1px solid #2E2C28',
          borderRadius: 100, padding: '4px 14px', marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1D9E75', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#9B9895', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            3 actos · agentes IA · multi-modal
          </span>
        </div>

        <h1 style={{
          fontSize: 46, fontWeight: 800, color: '#F5F3EE',
          lineHeight: 1.08, marginBottom: 18, letterSpacing: '-0.03em',
        }}>
          Diseña presentaciones<br />
          <span style={{ color: '#EF9F27' }}>que mueven a la acción</span>
        </h1>
        <p style={{ fontSize: 16, color: '#8A877F', lineHeight: 1.65, maxWidth: 480, margin: '0 auto' }}>
          Un canvas cinematográfico de 3 actos con agentes IA que construyen el diagnóstico, la narrativa y el diseño de tu presentación — desde cualquier fuente.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/canvas"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          backgroundColor: '#F5F3EE', color: '#0E0D0B',
          padding: '14px 36px', borderRadius: 10,
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          letterSpacing: '-0.01em', marginBottom: 72,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
          transition: 'opacity 0.15s',
        }}
      >
        <span style={{ fontSize: 18 }}>🎬</span>
        Abrir Canvas
        <span style={{ opacity: 0.5 }}>→</span>
      </Link>

      {/* Acts grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        maxWidth: 760, width: '100%',
      }}>
        {ACTS.map((act, i) => (
          <div
            key={act.num}
            style={{
              backgroundColor: '#141311',
              border: '1.5px solid #252320',
              borderRadius: 12,
              padding: '20px 18px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Act number */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.12em',
              color: '#3A3835', textTransform: 'uppercase',
            }}>
              acto {act.num}
            </div>

            {/* Connector dot */}
            {i < ACTS.length - 1 && (
              <div style={{
                position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: '#0E0D0B', border: '1.5px solid #252320',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1, fontSize: 8, color: '#3A3835',
              }}>
                →
              </div>
            )}

            <div style={{ fontSize: 24, marginBottom: 12 }}>{act.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F3EE', marginBottom: 5, letterSpacing: '-0.01em' }}>
              {act.label}
            </div>
            <div style={{ fontSize: 11, color: '#6B6866', lineHeight: 1.5 }}>
              {act.desc}
            </div>

            {/* Bottom accent line */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
              backgroundColor: act.color, opacity: 0.3, borderRadius: '0 0 10px 10px',
            }} />
          </div>
        ))}
      </div>

      <p style={{ marginTop: 28, fontSize: 11, color: '#3A3835', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Haz clic en 🎬 en el canvas para comenzar el Acto #1
      </p>

      {/* Bottom film strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
        display: 'flex', gap: 2, overflow: 'hidden',
      }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: i % 3 === 0 ? '#2A2925' : '#1A1918', borderRadius: 1 }} />
        ))}
      </div>
    </main>
  )
}
