import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '800', '900'],
})

// Generate wavy contour lines for the decorative sides
function WavyLines({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left'
  const color = isLeft ? '#E8896A' : '#5BBFBF'
  const lines: string[] = []
  const count = 18
  const baseOffset = isLeft ? 0 : 320
  const dir = isLeft ? 1 : -1

  for (let i = 0; i < count; i++) {
    const spacing = i * 14
    const x = baseOffset + dir * spacing
    const amp = 18 + i * 1.2
    const freq = 0.012
    const phase = i * 0.4

    let d = `M ${x} 0 `
    const steps = 40
    for (let s = 1; s <= steps; s++) {
      const y = (s / steps) * 520
      const wave = Math.sin(y * freq * Math.PI + phase) * amp
      d += `L ${x + wave} ${y} `
    }
    lines.push(d)
  }

  return (
    <svg
      style={{
        position: 'absolute',
        [isLeft ? 'left' : 'right']: -40,
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0.55,
        overflow: 'visible',
        zIndex: 1,
      }}
      width="300"
      height="520"
      viewBox={`0 0 ${isLeft ? 320 : 320} 520`}
    >
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={color}
          strokeWidth="0.9"
          fill="none"
          opacity={1 - i * 0.03}
        />
      ))}
    </svg>
  )
}

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#EAE5DB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px 56px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Decorative wavy lines ── */}
      <WavyLines side="left" />
      <WavyLines side="right" />

      {/* ── Gradient blob ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -54%)',
          width: 660,
          height: 360,
          background: `
            radial-gradient(ellipse at 20% 25%, #8DE8EE 0%, transparent 55%),
            radial-gradient(ellipse at 75% 35%, #F7BDD0 0%, transparent 55%),
            radial-gradient(ellipse at 55% 80%, #F3CDB4 0%, transparent 55%),
            radial-gradient(ellipse at 45% 50%, #F0E8D8 0%, transparent 70%)
          `,
          borderRadius: '58% 42% 62% 38% / 44% 56% 44% 56%',
          zIndex: 0,
          opacity: 0.92,
        }}
      />

      {/* ── App pill nav ── */}
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <Link
          href="/project/new/context"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: '1.5px solid #C4BBA8',
            borderRadius: 100,
            padding: '7px 22px',
            fontSize: 13,
            fontWeight: 500,
            color: '#3A3530',
            textDecoration: 'none',
            backgroundColor: 'rgba(234, 229, 219, 0.7)',
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.01em',
            transition: 'background-color 0.15s',
          }}
        >
          App
        </Link>
      </div>

      {/* ── Hero title ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          marginBottom: 28,
          marginTop: 24,
        }}
      >
        <h1
          className={playfair.className}
          style={{
            fontSize: 'clamp(72px, 13vw, 136px)',
            fontWeight: 900,
            lineHeight: 0.88,
            letterSpacing: '-0.03em',
            color: '#D94B27',
            margin: 0,
            padding: 0,
          }}
        >
          Story
          <br />
          Vibe&nbsp;AI
        </h1>
      </div>

      {/* ── Subtitles ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          marginBottom: 44,
        }}
      >
        <p
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#1A1714',
            margin: '0 0 6px',
            letterSpacing: '-0.01em',
          }}
        >
          Transforma tu contenido en guiones poderosos
        </p>
        <p
          style={{
            fontSize: 13,
            color: '#7A756C',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          Genera presentaciones con IA a través de una trama en tres actos
        </p>
      </div>

      {/* ── CTA ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Link
          href="/project/new/context"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#D94B27',
            color: '#FFFFFF',
            padding: '14px 40px',
            borderRadius: 50,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            boxShadow: '0 4px 24px rgba(217,75,39,0.35)',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
        >
          <span style={{ fontSize: 16 }}>🎬</span>
          Crear presentación
        </Link>
      </div>

      {/* ── Acts row (small, below fold) ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          gap: 12,
          marginTop: 60,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { num: '01', label: 'Diagnóstico', icon: '🎙', color: '#185FA5' },
          { num: '02', label: 'Arco Narrativo', icon: '📈', color: '#0F6E56' },
          { num: '03', label: 'Diseño', icon: '🎨', color: '#6B3FA0' },
        ].map((act, i, arr) => (
          <div key={act.num} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(180,172,160,0.5)',
                borderRadius: 10,
                padding: '8px 14px',
                backdropFilter: 'blur(6px)',
              }}
            >
              <span style={{ fontSize: 15 }}>{act.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: '#9B9895',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    marginBottom: 2,
                  }}
                >
                  Acto {act.num}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1714' }}>{act.label}</div>
              </div>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: act.color,
                  opacity: 0.6,
                }}
              />
            </div>
            {i < arr.length - 1 && (
              <span style={{ fontSize: 12, color: '#B4ACA0' }}>→</span>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
