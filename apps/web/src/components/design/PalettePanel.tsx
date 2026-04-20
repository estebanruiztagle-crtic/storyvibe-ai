'use client'

// PalettePanel — Title & palette generation removed.
// This panel now serves as a direct gateway to slide editing.

interface Props {
  onComplete: () => void
}

export default function PalettePanel({ onComplete }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 20 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h9M3 15h5" stroke="#818CF8" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#EEF0FA', margin: '0 0 6px' }}>Diseñar láminas</p>
        <p style={{ fontSize: 13, color: '#5B5F7A', margin: 0 }}>
          Selecciona el layout, imagen y aprueba cada slide de tu presentación.
        </p>
      </div>
      <button
        onClick={onComplete}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#6366F1', color: '#fff',
          padding: '10px 24px', borderRadius: 8,
          fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
        }}
      >
        Ir a láminas
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
