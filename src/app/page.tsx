'use client'

import { useState, useRef, useEffect } from 'react'
import { DraggableWindow } from '@/components/DraggableWindow'
import { Taskbar } from '@/components/Taskbar'

interface WinState {
  id: string
  label: string
  icon: string
  title: string
  isOpen: boolean
  zIndex: number
  spawnPosition: { x: number; y: number }
}

const FALLBACK_POSITIONS: Record<string, { x: number; y: number }> = {
  home:     { x: 200, y: 80  },
  rsvp:     { x: 240, y: 110 },
  schedule: { x: 160, y: 130 },
  travel:   { x: 220, y: 100 },
  registry: { x: 180, y: 120 },
  faq:      { x: 260, y: 90  },
}

const STAGGER: Record<string, { x: number; y: number }> = {
  home:     { x: 0,   y: 0  },
  rsvp:     { x: 40,  y: 30 },
  schedule: { x: -40, y: 50 },
  travel:   { x: 20,  y: 20 },
  registry: { x: -20, y: 40 },
  faq:      { x: 60,  y: 10 },
}

const WINDOWS_CONFIG = [
  { id: 'home',     label: 'HOME',     icon: '🏠', title: 'BECHAN & ETHAN' },
  { id: 'rsvp',     label: 'RSVP',     icon: '💌', title: 'RSVP'           },
  { id: 'schedule', label: 'SCHEDULE', icon: '📋', title: 'SCHEDULE'        },
  { id: 'travel',   label: 'TRAVEL',   icon: '✈️', title: 'TRAVEL'          },
  { id: 'registry', label: 'REGISTRY', icon: '🎁', title: 'REGISTRY'        },
  { id: 'faq',      label: 'FAQ',      icon: '❓', title: 'FAQ'             },
]

function getWidth(id: string): number {
  return id === 'home' ? 560 : 480
}

function TopBar({ clock }: { clock: string | null }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-7 z-[9999] border-b-2 border-[var(--color-primary)] bg-[var(--color-bg)] flex items-center justify-between px-4">
      <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-primary)] tracking-widest leading-none">
        BECHAN &amp; ETHAN
      </span>
      {clock && (
        <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-primary)] tracking-widest leading-none">
          {clock}
        </span>
      )}
    </div>
  )
}

function WindowContent({ id, onOpenWindow }: { id: string; onOpenWindow: (id: string) => void }) {
  switch (id) {
    case 'home':
      return (
        <div className="p-10 text-center flex flex-col items-center">
          <p className="font-[family-name:var(--font-vt323)] text-base tracking-[0.4em] text-[var(--color-accent)] mb-6">
            12 June 2027 &nbsp;&middot;&nbsp; Deer Park, Devon
          </p>
          <div className="w-12 h-0.5 bg-[var(--color-primary)] mb-6" />
          <h1 className="crispy font-[family-name:var(--font-playfair)] italic font-normal text-6xl text-[var(--color-primary)] leading-tight mb-6">
            Bechan<br />&amp; Ethan
          </h1>
          <div className="w-12 h-0.5 bg-[var(--color-primary)] mb-6" />
          <p className="crispy font-[family-name:var(--font-playfair)] text-lg text-[var(--color-muted)] mb-10 tracking-wide">
            Deer Park Country House &middot; Devon, England
          </p>
          <button
            onClick={() => onOpenWindow('rsvp')}
            className="bg-[var(--color-primary)] text-[var(--color-bg)] text-xl tracking-widest px-10 py-3 transition-transform hover:-translate-y-px active:translate-y-0 cursor-pointer font-[family-name:var(--font-vt323)]"
            style={{ boxShadow: '4px 4px 0 var(--color-accent)' }}
          >
            RSVP NOW
          </button>
        </div>
      )
    case 'rsvp':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">RSVP</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-xl text-[var(--color-muted)]">RSVP form coming soon.</p>
        </div>
      )
    case 'schedule':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">Schedule</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-xl text-[var(--color-muted)]">Day-of schedule coming soon.</p>
        </div>
      )
    case 'travel':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">Travel</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-xl text-[var(--color-muted)]">Travel information coming soon.</p>
        </div>
      )
    case 'registry':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">Registry</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-xl text-[var(--color-muted)]">Gift registry coming soon.</p>
        </div>
      )
    case 'faq':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">FAQ</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-xl text-[var(--color-muted)]">FAQs coming soon.</p>
        </div>
      )
    default:
      return null
  }
}

export default function DesktopPage() {
  const [windows, setWindows] = useState<WinState[]>(
    WINDOWS_CONFIG.map((w) => ({
      ...w,
      isOpen: false,
      zIndex: 0,
      spawnPosition: FALLBACK_POSITIONS[w.id],
    }))
  )
  const maxZRef = useRef(1)
  const [clock, setClock] = useState<string | null>(null)

  useEffect(() => {
    function tick() {
      const now = new Date()
      const dd   = String(now.getDate()).padStart(2, '0')
      const mm   = String(now.getMonth() + 1).padStart(2, '0')
      const yyyy = now.getFullYear()
      const hh   = String(now.getHours()).padStart(2, '0')
      const min  = String(now.getMinutes()).padStart(2, '0')
      setClock(`${dd}_${mm}_${yyyy} ${hh}:${min}`)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const W = window.innerWidth
    const H = window.innerHeight - 28 - 80
    const isMobile = W < 768
    const cy = Math.max(20, H / 2 - 180)

    maxZRef.current = 1
    setWindows((ws) =>
      ws.map((w) => ({
        ...w,
        isOpen: w.id === 'home',
        zIndex: w.id === 'home' ? 1 : 0,
        spawnPosition: {
          x: isMobile
            ? 10
            : Math.max(10, (W - getWidth(w.id)) / 2 + STAGGER[w.id].x),
          y: Math.max(10, cy + STAGGER[w.id].y),
        },
      }))
    )
  }, [])

  function focusWindow(id: string) {
    maxZRef.current += 1
    const next = maxZRef.current
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, zIndex: next } : w)))
  }

  function toggleWindow(id: string) {
    setWindows((ws) => {
      const win = ws.find((w) => w.id === id)
      if (win?.isOpen) {
        return ws.map((w) => (w.id === id ? { ...w, isOpen: false } : w))
      } else {
        maxZRef.current += 1
        const next = maxZRef.current
        return ws.map((w) => (w.id === id ? { ...w, isOpen: true, zIndex: next } : w))
      }
    })
  }

  function closeWindow(id: string) {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, isOpen: false } : w)))
  }

  return (
    <div className="fixed inset-0 pt-7 pb-20 overflow-hidden">
      <TopBar clock={clock} />
      {windows.map((w) =>
        !w.isOpen ? null : (
          <DraggableWindow
            key={w.id}
            id={w.id}
            title={w.title}
            initialPosition={w.spawnPosition}
            zIndex={w.zIndex}
            onClose={() => closeWindow(w.id)}
            onFocus={() => focusWindow(w.id)}
            width={getWidth(w.id)}
          >
            <WindowContent id={w.id} onOpenWindow={toggleWindow} />
          </DraggableWindow>
        )
      )}
      <Taskbar
        items={windows.map((w) => ({ id: w.id, label: w.label, icon: w.icon, isOpen: w.isOpen }))}
        onToggle={toggleWindow}
      />
    </div>
  )
}
