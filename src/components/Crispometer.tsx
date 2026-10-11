'use client'

import { useState, useEffect } from 'react'

export function Crispometer() {
  const [freq, setFreq]         = useState(0.65)
  const [octaves, setOctaves]   = useState(4)
  const [scale, setScale]       = useState(1.00)
  const [contrast, setContrast] = useState(1.06)
  const [open, setOpen]         = useState(true)
  const [copied, setCopied]     = useState(false)

  // Mutate the SVG filter in the DOM on every change — instant, no reload
  useEffect(() => {
    const turbulence   = document.querySelector<SVGFETurbulenceElement>('#grain feTurbulence')
    const displacement = document.querySelector<SVGFEDisplacementMapElement>('#grain feDisplacementMap')
    turbulence?.setAttribute('baseFrequency', String(freq))
    turbulence?.setAttribute('numOctaves', String(octaves))
    displacement?.setAttribute('scale', String(scale))
  }, [freq, octaves, scale])

  useEffect(() => {
    let el = document.getElementById('crispometer-style') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'crispometer-style'
      document.head.appendChild(el)
    }
    el.textContent = `.crispy { filter: url(#grain) contrast(${contrast}) !important; }`
  }, [contrast])

  const codeSnippet =
    `// layout.tsx — feTurbulence:\nbaseFrequency="${freq}" numOctaves="${octaves}"\n\n// layout.tsx — feDisplacementMap:\nscale="${scale}"\n\n// globals.css — .crispy:\nfilter: url(#grain) contrast(${contrast});`

  async function copy() {
    await navigator.clipboard.writeText(codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const PANEL = {
    position: 'fixed' as const,
    bottom: 88,
    right: 12,
    zIndex: 99999,
    background: '#EDE8D8',
    boxShadow: '2px 2px 0 rgba(0,0,0,0.35), inset -1px -1px 0 rgba(0,0,0,0.2), inset 1px 1px 0 rgba(255,255,255,0.8)',
    border: '1px solid #999',
    minWidth: 240,
    fontFamily: 'var(--font-vt323), monospace',
  }

  const TITLE_BAR = {
    background: '#1760B0',
    color: '#fff',
    padding: '2px 6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'default',
    userSelect: 'none' as const,
  }

  const row = { display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px' }
  const label = { fontSize: 13, letterSpacing: 2, color: '#333', width: 100, flexShrink: 0 }
  const val = { fontSize: 13, color: '#1760B0', width: 36, textAlign: 'right' as const }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{ position: 'fixed', bottom: 88, right: 12, zIndex: 99999, background: '#1760B0', color: '#fff', fontFamily: 'var(--font-vt323), monospace', fontSize: 13, letterSpacing: 2, padding: '3px 8px', border: 'none', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(0,0,0,0.35)' }}
    >
      🎛 CRISPY
    </button>
  )

  return (
    <div style={PANEL}>
      <div style={TITLE_BAR}>
        <span style={{ fontSize: 13, letterSpacing: 2 }}>🎛 CRISPOMETER</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', padding: '0 4px', lineHeight: 1.4 }}>✕</button>
      </div>

      <div style={{ padding: '6px 0 4px' }}>
        {[
          { label: 'FREQ',     value: freq,     min: 0.01, max: 2,   step: 0.01, set: setFreq,     decimals: 2 },
          { label: 'OCTAVES',  value: octaves,  min: 1,    max: 8,   step: 0.01, set: setOctaves,  decimals: 2 },
          { label: 'SCALE',    value: scale,    min: 0,    max: 20,  step: 0.01, set: setScale,    decimals: 2 },
          { label: 'CONTRAST', value: contrast, min: 1,    max: 1.5, step: 0.01, set: setContrast, decimals: 2 },
        ].map(({ label: lbl, value, min, max, step, set, decimals }) => (
          <div key={lbl} style={row}>
            <span style={label}>{lbl}</span>
            <input
              type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#1760B0' }}
            />
            <input
              type="number" min={min} max={max} step={step} value={value.toFixed(decimals)}
              onChange={e => {
                const n = parseFloat(e.target.value)
                if (!isNaN(n)) set(Math.min(max, Math.max(min, n)))
              }}
              style={{ ...val, width: 52, border: '1px solid #aaa', background: '#fff', padding: '1px 3px', textAlign: 'right', fontFamily: 'var(--font-vt323), monospace', fontSize: 13 }}
            />
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #ccc', padding: '4px 8px 6px' }}>
        <button
          onClick={copy}
          style={{ width: '100%', background: '#1760B0', color: '#fff', fontFamily: 'var(--font-vt323), monospace', fontSize: 13, letterSpacing: 2, padding: '3px 0', border: 'none', cursor: 'pointer' }}
        >
          {copied ? '✓ COPIED' : 'COPY VALUES'}
        </button>
      </div>
    </div>
  )
}
