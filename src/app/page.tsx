'use client'

import { useState, useRef, useEffect } from 'react'
import { DraggableWindow } from '@/components/DraggableWindow'
import { Taskbar } from '@/components/Taskbar'
import { LoadingScreen } from '@/components/LoadingScreen'

interface WinState {
  id: string
  label: string
  icon: string
  title: string
  isOpen: boolean
  zIndex: number
  spawnPosition: { x: number; y: number }
}

interface GuestData {
  id: string
  first_name: string
  last_name: string
  has_deer_park_room: boolean
  friday_invited: boolean
  plus_one_allowed: boolean
  rsvp_submitted_at: string | null
  attending_saturday: boolean | null
  attending_friday: boolean | null
}

const FALLBACK_POSITIONS: Record<string, { x: number; y: number }> = {
  home:      { x: 200, y: 80  },
  rsvp:      { x: 240, y: 110 },
  stay:      { x: 160, y: 130 },
  itinerary: { x: 220, y: 100 },
  travel:    { x: 180, y: 120 },
  faq:       { x: 260, y: 90  },
}

const STAGGER: Record<string, { x: number; y: number }> = {
  home:      { x: 0,   y: 0  },
  rsvp:      { x: 40,  y: 30 },
  stay:      { x: -40, y: 50 },
  itinerary: { x: 20,  y: 20 },
  travel:    { x: -20, y: 40 },
  faq:       { x: 60,  y: 10 },
}

// Mobile: offsets from x=40 (centre of 80px total margin); y is absolute from top
const MOBILE_STAGGER: Record<string, { x: number; y: number }> = {
  home:      { x:   0, y: 50 },
  rsvp:      { x:  15, y: 75 },
  stay:      { x: -15, y: 95 },
  itinerary: { x:  18, y: 65 },
  travel:    { x: -18, y: 85 },
  faq:       { x:  10, y: 70 },
}

const WINDOWS_CONFIG = [
  { id: 'home',      label: 'HOME',      icon: '/icons/home.png',      title: 'CONGRATS!'      },
  { id: 'rsvp',      label: 'RSVP',      icon: '/icons/rsvp.png',      title: 'RSVP'           },
  { id: 'stay',      label: 'STAY',      icon: '/icons/stay.png',      title: 'STAY'            },
  { id: 'itinerary', label: 'ITINERARY', icon: '/icons/itinerary.png', title: 'ITINERARY'       },
  { id: 'travel',    label: 'TRAVEL',    icon: '/icons/travel.png',    title: 'TRAVEL'          },
  { id: 'faq',       label: 'FAQ',       icon: '/icons/faq.png',       title: 'FAQ'             },
]

function getWidth(id: string): number {
  return id === 'home' ? 560 : 480
}

// Fixed positions/delays avoid SSR hydration mismatch from Math.random()
const CONFETTI_PIECES = [
  { left: '5%',  delay: '-0.2s', color: '#E07B5A', size: 8  },
  { left: '15%', delay: '-0.9s', color: '#1760B0', size: 6  },
  { left: '25%', delay: '-0.4s', color: '#FFF5EE', size: 10 },
  { left: '35%', delay: '-1.1s', color: '#E07B5A', size: 7  },
  { left: '45%', delay: '-0.7s', color: '#1760B0', size: 9  },
  { left: '55%', delay: '-1.3s', color: '#E07B5A', size: 6  },
  { left: '65%', delay: '-0.5s', color: '#FFF5EE', size: 8  },
  { left: '75%', delay: '-1.0s', color: '#1760B0', size: 7  },
  { left: '85%', delay: '-0.3s', color: '#E07B5A', size: 9  },
  { left: '92%', delay: '-1.2s', color: '#1760B0', size: 6  },
  { left: '10%', delay: '-0.8s', color: '#E07B5A', size: 7  },
  { left: '30%', delay: '-1.5s', color: '#1760B0', size: 8  },
  { left: '50%', delay: '-0.6s', color: '#FFF5EE', size: 6  },
  { left: '70%', delay: '-1.4s', color: '#E07B5A', size: 9  },
  { left: '90%', delay: '-0.1s', color: '#1760B0', size: 7  },
  { left: '20%', delay: '-1.6s', color: '#E07B5A', size: 8  },
]

const CHROME_BTN = {
  background: 'var(--color-chrome)',
  boxShadow: '2px 2px 0 rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.15)',
} as const

function TopBar({ clock, guest }: { clock: string | null; guest: GuestData | null }) {
  return (
    <>
      <div
        className="fixed top-3 left-3 z-[9999] flex items-center px-3 py-1 rounded-lg"
        style={CHROME_BTN}
      >
        <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)] tracking-widest leading-none">
          {guest ? `WELCOME, ${guest.first_name.toUpperCase()}` : 'BECHAN & ETHAN'}
        </span>
      </div>
      {clock && (
        <div
          className="fixed top-3 right-3 z-[9999] flex items-center px-3 py-1 rounded-lg"
          style={CHROME_BTN}
        >
          <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)] tracking-widest leading-none">
            {clock}
          </span>
        </div>
      )}
    </>
  )
}

function WindowContent({ id, guest, onOpenWindow }: { id: string; guest: GuestData | null; onOpenWindow: (id: string) => void }) {
  switch (id) {
    case 'home':
      return (
        <div className="relative overflow-hidden text-center" style={{ minHeight: 340 }}>
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            {CONFETTI_PIECES.map((c, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{ left: c.left, width: c.size, height: c.size, backgroundColor: c.color, animationDelay: c.delay }}
              />
            ))}
          </div>
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-5">
            <div className="flex items-center justify-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/home.png" width={24} height={24} alt="" className="shrink-0" />
              <span className="font-[family-name:var(--font-vt323)] text-2xl md:text-3xl tracking-widest text-[var(--color-primary)] leading-none">
                CONGRATULATIONS!
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/home.png" width={24} height={24} alt="" className="shrink-0" />
            </div>
            <div className="w-8 h-0.5 bg-[var(--color-accent)]" />
            <p className="crispy font-[family-name:var(--font-playfair)] italic text-sm text-[var(--color-text)]">
              You are cordially invited to the wedding of
            </p>
            <h1 className="crispy font-[family-name:var(--font-playfair)] italic font-normal text-4xl text-[var(--color-primary)] leading-tight">
              Bechan &amp; Ethan
            </h1>
            <div className="relative overflow-hidden rounded" style={{ aspectRatio: '4/3', width: '100%', maxWidth: 280 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/photos/88.jpg"
                alt="Deer Park Country House"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center', imageRendering: 'pixelated' }}
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                style={{ background: 'rgba(13,31,60,0.5)' }}
              >
                <p className="font-[family-name:var(--font-vt323)] text-sm tracking-[0.2em] text-[var(--color-bg)]">
                  SATURDAY &middot; 12TH JUNE 2027
                </p>
                <p className="crispy font-[family-name:var(--font-playfair)] italic text-xs text-[var(--color-bg)]/80">
                  Deer Park Country House &middot; Devon, England
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenWindow('rsvp')}
              className="bg-[var(--color-primary)] text-[var(--color-bg)] text-xl tracking-widest px-10 py-3 transition-transform hover:-translate-y-px active:translate-y-0 cursor-pointer font-[family-name:var(--font-vt323)]"
              style={{ boxShadow: '4px 4px 0 var(--color-accent)' }}
            >
              RSVP NOW
            </button>
          </div>
        </div>
      )
    case 'rsvp':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">RSVP</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-lg text-[var(--color-muted)]">
            {guest ? `Let us know if you can make it, ${guest.first_name}.` : 'RSVP form coming soon.'}
          </p>
        </div>
      )
    case 'stay':
      return guest?.has_deer_park_room ? (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">Your Stay</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-lg text-[var(--color-muted)] mb-4 leading-relaxed">
            A room at Deer Park Country House has been reserved for the night of Saturday 12th June 2027 — yours to book if you&apos;d like to stay on site.
          </p>
          <p className="crispy font-[family-name:var(--font-playfair)] text-lg text-[var(--color-muted)] leading-relaxed">
            Booking details coming soon.
          </p>
        </div>
      ) : (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">Places to Stay</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-lg text-[var(--color-muted)]">
            Accommodation suggestions coming soon.
          </p>
        </div>
      )
    case 'itinerary':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">The Weekend</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-xl text-[var(--color-muted)]">Weekend itinerary coming soon.</p>
        </div>
      )
    case 'travel':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-text)] mb-4">Getting There</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-xl text-[var(--color-muted)]">Travel information coming soon.</p>
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
  const [loading, setLoading] = useState(true)
  const [clock, setClock] = useState<string | null>(null)
  const [guest, setGuest] = useState<GuestData | null>(null)

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
    fetch('/api/me')
      .then((r) => (r.ok ? (r.json() as Promise<GuestData>) : null))
      .then((data) => {
        if (!data) return
        setGuest(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const W = window.innerWidth
    const isMobile = W < 768

    maxZRef.current = 1
    setWindows((ws) =>
      ws.map((w) => {
        let x: number, y: number
        if (isMobile) {
          // With max-width: calc(100vw - 80px), the window is 80px narrower than
          // the viewport, leaving 80px total horizontal room. Centre is at x=40.
          // Offsets of ±20 keep both edges at least 20px from the screen boundary.
          x = 40 + MOBILE_STAGGER[w.id].x
          y = MOBILE_STAGGER[w.id].y
        } else {
          x = Math.max(10, (W - getWidth(w.id)) / 2 + STAGGER[w.id].x)
          y = Math.max(20, 60 + STAGGER[w.id].y)
        }
        return {
          ...w,
          isOpen: w.id === 'home',
          zIndex: w.id === 'home' ? 1 : 0,
          spawnPosition: { x, y },
        }
      })
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
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundImage: "url('/background/pacific-breeze.png')",
        backgroundRepeat: 'repeat',
        imageRendering: 'pixelated',
      }}
    >
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}

      {!loading && (
        <>
          <TopBar clock={clock} guest={guest} />
          <div className="absolute inset-0 pt-7 pb-20 overflow-hidden">
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
                  <WindowContent id={w.id} guest={guest} onOpenWindow={toggleWindow} />
                </DraggableWindow>
              )
            )}
          </div>
          <Taskbar
            items={windows.map((w) => ({ id: w.id, label: w.label, icon: w.icon, isOpen: w.isOpen }))}
            onToggle={toggleWindow}
          />
        </>
      )}
    </div>
  )
}
