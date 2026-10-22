'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { DraggableWindow } from '@/components/DraggableWindow'
import { Taskbar } from '@/components/Taskbar'
import { LoadingScreen } from '@/components/LoadingScreen'
import { BreakoutGame } from '@/components/BreakoutGame'
import { RsvpForm } from '@/components/RsvpForm'

interface WinState {
  id: string
  label: string
  icon: string
  title: string
  isOpen: boolean
  zIndex: number
  spawnPosition: { x: number; y: number }
}

interface GuestMember {
  id: string
  first_name: string
  last_name: string
  rsvp_submitted_at: string | null
  attending_saturday: boolean | null
  attending_friday: boolean | null
  attending_sunday: boolean | null
  dietary: string | null
  song_request: string | null
  message: string | null
}

interface InviteData {
  id: string
  display_name: string
  email: string | null
  room_counts: Record<string, number>
  room_accepted: Record<string, (boolean | null)[]>
  friday_invited: boolean
  guests: GuestMember[]
  sunday_venue_short: string | null
  sunday_venue_address: string | null
}

const ROOM_TYPES = {
  main_house_double: { label: 'Main House Double', price: '£150 per night' },
  garden_double:     { label: 'Garden Double',      price: '£150 per night' },
  garden_single:     { label: 'Garden Single',      price: '£75 per night'  },
  treehouse:         { label: 'The Treehouse',       price: 'Bridal Suite'   },
} as const

const FALLBACK_POSITIONS: Record<string, { x: number; y: number }> = {
  home:      { x: 200, y: 80  },
  rsvp:      { x: 240, y: 110 },
  stay:      { x: 160, y: 130 },
  itinerary: { x: 220, y: 100 },
  travel:    { x: 180, y: 120 },
  faq:       { x: 260, y: 90  },
  secret:    { x: 140, y: 100 },
}

const STAGGER: Record<string, { x: number; y: number }> = {
  home:      { x: 0,   y: 0  },
  rsvp:      { x: 40,  y: 30 },
  stay:      { x: -40, y: 50 },
  itinerary: { x: 20,  y: 20 },
  travel:    { x: -20, y: 40 },
  faq:       { x: 60,  y: 10 },
  secret:    { x: -60, y: 20 },
}

// Mobile: offsets from x=40 (centre of 80px total margin); y is absolute from top
const MOBILE_STAGGER: Record<string, { x: number; y: number }> = {
  home:      { x:   0, y: 50 },
  rsvp:      { x:  15, y: 75 },
  stay:      { x: -15, y: 95 },
  itinerary: { x:  18, y: 65 },
  travel:    { x: -18, y: 85 },
  faq:       { x:  10, y: 70 },
  secret:    { x:   0, y: 60 },
}

const WINDOWS_CONFIG = [
  { id: 'home',      label: 'HOME',      icon: '/icons/home.png',      title: 'CONGRATS!'      },
  { id: 'rsvp',      label: 'RSVP',      icon: '/icons/rsvp.png',      title: 'RSVP'           },
  { id: 'stay',      label: 'STAY',      icon: '/icons/stay.png',      title: 'STAY'            },
  { id: 'itinerary', label: 'ITINERARY', icon: '/icons/itinerary.png', title: 'ITINERARY'       },
  { id: 'travel',    label: 'TRAVEL',    icon: '/icons/travel.png',    title: 'TRAVEL'          },
  { id: 'faq',       label: 'FAQ',       icon: '/icons/faq.png',       title: 'FAQ'             },
  { id: 'secret',    label: 'SECRET',    icon: '/icons/secret.png',    title: 'BREAKOUT!'       },
]

function getWidth(id: string): number {
  return id === 'home' ? 560 : id === 'secret' ? 440 : 480
}

// Photos shown inside windows. Fetched up front so they're already decoded by the
// time a window is opened, rather than popping in a beat later.
const WINDOW_PHOTOS = ['/photos/88.jpg', '/photos/89.jpg', '/photos/90.jpg', '/photos/91.jpg']

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

// Full-screen block dissolve that erases the loading screen's backdrop to reveal
// the desktop underneath — same visual language as the loading slideshow transition
function PixelDissolveOut({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  // Layout effect, not a plain effect: the backdrop has to be painted in the same
  // frame the loading screen unmounts, or the desktop flashes through for a beat
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Repaint the loading screen's exact backdrop so the handover is seamless
    ctx.fillStyle = '#FAF4C6'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(13,31,60,0.1)'
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) ctx.fillRect(x, y, 2, 2)
    }

    const BLOCK = 24
    const cols = Math.ceil(w / BLOCK)
    const rows = Math.ceil(h / BLOCK)
    const order = Array.from({ length: cols * rows }, (_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }

    const DURATION = 550
    const start = performance.now()
    let cleared = 0
    let raf = 0

    function frame(now: number) {
      const t = Math.min(1, (now - start) / DURATION)
      const target = Math.ceil(t * order.length)
      for (let i = cleared; i < target; i++) {
        const b = order[i]
        ctx!.clearRect((b % cols) * BLOCK, Math.floor(b / cols) * BLOCK, BLOCK, BLOCK)
      }
      cleared = target
      if (t >= 1) { doneRef.current(); return }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-[99998] pointer-events-none" />
}

// The Win95 wireframe zoom: a dotted outline stepping outward into the window's
// final position before the window itself appears
function WireframeZoom({ to, onDone }: { to: { x: number; y: number; w: number; h: number }; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const STEPS = 4

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      if (i >= STEPS) { clearInterval(id); doneRef.current() }
      else setStep(i)
    }, 45)
    return () => clearInterval(id)
  }, [])

  const t = (step + 1) / STEPS
  const cx = to.x + to.w / 2
  const cy = to.y + to.h / 2
  const w = Math.max(40, to.w * t)
  const h = Math.max(28, to.h * t)

  return (
    <div
      className="fixed pointer-events-none z-[9998]"
      style={{
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        border: '2px dotted var(--color-text)',
        borderRadius: 8,
      }}
    />
  )
}

function TopBar({ clock, invite }: { clock: string | null; invite: InviteData | null }) {
  return (
    <>
      <div
        className="fixed top-3 left-3 z-[9999] flex items-center px-3 py-1 rounded-lg"
        style={CHROME_BTN}
      >
        <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)] tracking-widest leading-none">
          {invite ? `WELCOME, ${invite.display_name.toUpperCase()}` : 'BECHAN & ETHAN'}
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

function StayCard({
  name, price, tag, query, children,
}: {
  name: string; price: string; tag: string; query: string; children: React.ReactNode
}) {
  return (
    <div
      className="mb-3 rounded-md overflow-hidden border border-[var(--color-text)]/15"
      style={{ boxShadow: '2px 2px 0 rgba(13,31,60,0.08)' }}
    >
      <div className="flex items-center justify-between gap-2 bg-[var(--color-chrome)] px-3 py-1.5">
        <span className="crispy font-[family-name:var(--font-playfair)] text-base text-[var(--color-text)] min-w-0 truncate">
          {name}
        </span>
        <span className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-accent)] shrink-0">
          {price}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <span className="font-[family-name:var(--font-vt323)] text-[11px] tracking-widest text-[var(--color-muted)]">
          {tag.toUpperCase()}
        </span>
        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed mt-1 mb-2">
          {children}
        </p>
        <MapLink query={query} label="VIEW ON MAP" />
      </div>
    </div>
  )
}

function AlternativeAccommodation() {
  return (
    <>
      <StayCard
        name="The Pig at Combe"
        price="£££"
        tag="The splurge"
        query="The Pig at Combe, Gittisham, Honiton"
      >
        The boujee option, and a very short drive from Deer Park. Beautiful grounds and a fantastic restaurant,
        worth the splurge. Note they require a minimum 2-night stay on weekends, so book early.
      </StayCard>

      <StayCard
        name="The Tumbling Weir Hotel"
        price="££"
        tag="In town"
        query="The Tumbling Weir Hotel, Ottery St Mary"
      >
        A comfortable, mid-range option with a restaurant attached.
      </StayCard>

      <StayCard
        name="Premier Inn Honiton"
        price="£"
        tag="Cheap and cheerful"
        query="Premier Inn Honiton"
      >
        Reliable, no-frills, and right in Honiton. The safe bet if you just need a bed and a shower.
      </StayCard>

      <StayCard
        name="Buckley Farmhouse"
        price="££"
        tag="Country B&B"
        query="Buckley Farmhouse, Devon"
      >
        A charming farmhouse B&amp;B with excellent reviews, a little further out.
      </StayCard>

      <StayCard
        name="The White Hart Inn"
        price="££"
        tag="Village inn"
        query="The White Hart Inn, Wilmington, Honiton"
      >
        A cosy village inn a short drive away, in Wilmington.
      </StayCard>

      <div className="mt-4 px-3 py-2.5 border-l-4 rounded-r-md" style={{ borderColor: 'var(--color-primary)', background: 'rgba(23,96,176,0.06)' }}>
        <span className="font-[family-name:var(--font-vt323)] text-[11px] tracking-widest text-[var(--color-primary)]">
          ALSO WORTH A LOOK
        </span>
        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed mt-1">
          There are plenty of Airbnbs dotted around the area if you&apos;d prefer somewhere more independent,
          and if you&apos;d rather stay somewhere bigger, Exeter and Taunton are the nearest larger towns with a
          wider range of places to stay.
        </p>
      </div>
    </>
  )
}

function MapLink({ query, label }: { query: string; label: string }) {
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-primary)] underline underline-offset-2"
    >
      📍 {label}
    </a>
  )
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[var(--color-text)]/10 py-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-2 text-left cursor-pointer"
      >
        <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-muted)] w-4 shrink-0 mt-1">
          {open ? '▼' : '►'}
        </span>
        <span className="crispy font-[family-name:var(--font-playfair)] text-lg text-[var(--color-primary)] leading-snug">
          {q}
        </span>
      </button>
      {open && (
        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed mt-2 pl-6">
          {a}
        </p>
      )}
    </div>
  )
}

function EmbeddedMap({ query, label }: { query: string; label: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className="mb-2 rounded-lg overflow-hidden border-2 border-[var(--color-chrome)]"
      style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.15)' }}
    >
      <div className="bg-[var(--color-chrome)] px-3 py-1">
        <span className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-text)]">
          📍 {label}
        </span>
      </div>
      <div className="relative overflow-hidden bg-[var(--color-chrome)]" style={{ aspectRatio: '16/9' }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-muted)] animate-pulse">
              LOADING MAP...
            </span>
          </div>
        )}
        <iframe
          src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
          className="w-full h-full relative"
          style={{
            border: 0,
            filter: 'sepia(0.25) saturate(0.85) hue-rotate(-6deg) contrast(1.05)',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 250ms ease',
          }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoaded(true)}
          title={`Map of ${query}`}
        />
      </div>
    </div>
  )
}

function DayBadge({ label, variant }: { label: string; variant: 'main' | 'optional' }) {
  return (
    <span
      className="font-[family-name:var(--font-vt323)] text-xs tracking-widest px-2 py-0.5"
      style={{
        background: variant === 'main' ? 'var(--color-accent)' : 'var(--color-muted)',
        color: 'var(--color-bg)',
      }}
    >
      {label}
    </span>
  )
}

function TimelineRow({ time, event }: { time: string; event: string }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-[var(--color-text)]/10 last:border-0">
      <span className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-primary)] w-24 shrink-0">
        {time}
      </span>
      <span className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-text)] leading-snug">
        {event}
      </span>
    </div>
  )
}

function DaySection({
  day, dateLabel, badge, location, children,
}: {
  day: string; dateLabel: string; badge: 'main' | 'optional'; location: string; children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center flex-wrap gap-2 mb-0.5">
        <h3 className="font-[family-name:var(--font-vt323)] text-2xl tracking-widest text-[var(--color-primary)]">
          {day}
        </h3>
        <DayBadge label={badge === 'main' ? 'MAIN EVENT' : 'OPTIONAL IF YOU CAN MAKE IT'} variant={badge} />
      </div>
      <p className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)] mb-0.5">
        {dateLabel}
      </p>
      <p className="crispy font-[family-name:var(--font-playfair)] italic text-sm text-[var(--color-text)] mb-2">
        {location}
      </p>
      {children}
    </div>
  )
}

function WindowContent({ id, invite, onOpenWindow }: { id: string; invite: InviteData | null; onOpenWindow: (id: string) => void }) {
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
                {invite ? `CONGRATULATIONS ${invite.display_name.toUpperCase()}!` : 'CONGRATULATIONS!'}
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
      return <RsvpForm invite={invite} onOpenItinerary={() => onOpenWindow('itinerary')} />
    case 'stay': {
      const assignedTypes = Object.entries(invite?.room_counts ?? {})
        .filter(([, n]) => n > 0)
        .map(([type]) => type)
      const assignedRooms = assignedTypes.flatMap(type => {
        const info = ROOM_TYPES[type as keyof typeof ROOM_TYPES]
        return info ? [{ label: info.label as string, price: info.price as string, count: invite!.room_counts[type] }] : []
      })
      const hasDouble = assignedTypes.some(t => t === 'main_house_double' || t === 'garden_double')
      const hasSingle = assignedTypes.includes('garden_single')
      return assignedRooms.length > 0 ? (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-primary)] mb-4">Accommodation</h2>

          {/* Reserved room, framed as its own little keepsake card */}
          <div
            className="rounded-lg overflow-hidden border-2 border-[var(--color-accent)] mb-4"
            style={{ boxShadow: '3px 3px 0 rgba(224,123,90,0.25)' }}
          >
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/photos/89.jpg"
                alt="Deer Park Country House"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(13,31,60,0.55)' }}>
                <span className="font-[family-name:var(--font-vt323)] text-xl tracking-[0.2em] text-[var(--color-bg)] text-center px-4">
                  RESERVED FOR YOU
                </span>
              </div>
            </div>
            <div className="px-4 py-3 bg-[var(--color-surface)]">
              <p className="crispy font-[family-name:var(--font-playfair)] text-base text-[var(--color-muted)] leading-relaxed mb-3">
                Congrats! We&apos;ve already reserved a room for you at Deer Park on the night of Saturday 12th June 2027.
              </p>
              {assignedRooms.map((r, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-3 py-1.5 border-t border-[var(--color-text)]/10"
                >
                  <span className="crispy font-[family-name:var(--font-playfair)] text-base text-[var(--color-text)]">
                    {r.label}{r.count > 1 ? ` × ${r.count}` : ''}
                  </span>
                  <span className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-accent)] shrink-0">
                    {r.price.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="crispy font-[family-name:var(--font-playfair)] text-base text-[var(--color-muted)] leading-relaxed mb-5">
            {hasDouble && hasSingle ? (
              <>Your rooms are available at the nightly rate of £150.00 (to include breakfast) for the double, and
              £75.00 (to include breakfast) for the single. </>
            ) : hasDouble ? (
              <>Your room is available at the nightly rate of £150.00 (to include breakfast). </>
            ) : hasSingle ? (
              <>Your room is available at the nightly rate of £75.00 (to include breakfast). </>
            ) : null}
            The room is yours if you&apos;d like it, just confirm via your RSVP.
          </p>

          <h3 className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[var(--color-primary)] mb-1">
            Prefer to stay elsewhere?
          </h3>
          <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed mb-4">
            No problem at all. A few other options nearby:
          </p>
          <AlternativeAccommodation />
        </div>
      ) : (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-primary)] mb-4">Places to Stay</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] text-base text-[var(--color-muted)] mb-5 leading-relaxed">
            We don&apos;t have a room booked for you at Deer Park, but there&apos;s plenty of lovely accommodation
            nearby in and around Honiton. Here are a few options to get you started.
          </p>
          <AlternativeAccommodation />
        </div>
      )
    }
    case 'itinerary':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-primary)] mb-2">The Weekend</h2>
          <p className="crispy font-[family-name:var(--font-playfair)] italic text-xs text-[var(--color-muted)] mb-5">
            Saturday times below (other than the ceremony itself) and the Sunday time are our best guesstimates, not gospel!
          </p>

          <DaySection day="FRIDAY" dateLabel="11TH JUNE" badge="optional" location="St Andrew's Church, Broadhembury">
            <TimelineRow time="5:00pm" event="Legal wedding ceremony" />
            <TimelineRow time="Evening" event="Dinner & drinks at The Drewe Arms, Broadhembury" />
          </DaySection>

          <DaySection day="SATURDAY" dateLabel="12TH JUNE" badge="main" location="Deer Park Country House, Honiton">
            <div className="mb-2 px-3 py-2 border-l-4" style={{ borderColor: 'var(--color-accent)', background: 'rgba(224,123,90,0.08)' }}>
              <p className="font-[family-name:var(--font-vt323)] text-xs tracking-widest leading-snug text-[var(--color-accent)]">
                WE WOULD WANT THIS WARNING IF WE WERE GUESTS, SO WE&apos;RE GIVING IT TO YOU: EAT LUNCH BEFOREHAND.
                YOU WON&apos;T GET A PROPER FEED UNTIL THE EVENING.
              </p>
            </div>
            <TimelineRow time="1:30pm"  event="Wedding Ceremony Time" />
            <TimelineRow time="2:30pm"  event="Reception Drinks Time" />
            <TimelineRow time="4:00pm"  event="Dinner Time" />
            <TimelineRow time="8:30pm"  event="Party time" />
            <TimelineRow time="9:30pm"  event="Evening food top up for extra dancing fuel" />
            <TimelineRow time="Midnight" event="Carriages. Move over from the dancefloor to the nightcap bar in the main house if you're hardcore" />
          </DaySection>

          <DaySection day="SUNDAY" dateLabel="13TH JUNE" badge="optional" location={invite?.sunday_venue_short ?? 'Bechan’s family home, Broadhembury'}>
            <TimelineRow time="11:00am" event="BBQ brunch, pool time, and (possibly) a hog roast" />
          </DaySection>
        </div>
      )
    case 'travel':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-primary)] mb-4">Getting There</h2>

          <EmbeddedMap query="Deer Park Country House, Honiton, Devon" label="FIND DEER PARK" />
          <p className="text-center mb-5">
            <MapLink query="Deer Park Country House, Honiton, Devon" label="OPEN DEER PARK IN MAPS" />
          </p>

          <div className="mb-5">
            <h3 className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[var(--color-primary)] mb-1">
              I&apos;m coming from London / other places in England
            </h3>
            <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed mb-2">
              The nearest and easiest train station to the events is Tiverton Parkway, but there&apos;s also Honiton
              and Cranbrook. For Londoners, your best bet if you&apos;re not driving is the London Paddington trains
              to Tiverton Parkway and a taxi from there to proceedings.
            </p>
            <div className="flex gap-3 flex-wrap">
              <MapLink query="Tiverton Parkway railway station" label="TIVERTON PARKWAY" />
              <MapLink query="Honiton railway station" label="HONITON STATION" />
              <MapLink query="Cranbrook railway station Devon" label="CRANBROOK STATION" />
            </div>
          </div>

          <div className="mb-5">
            <h3 className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[var(--color-primary)] mb-1">
              I&apos;m coming from Belfast / other places in Ireland
            </h3>
            <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed mb-2">
              The 2 closest airports to Deer Park are Bristol and Exeter.
              In our experience it&apos;s normally easiest and cheapest to get a SleazyJet flight from Belfast to
              Bristol and a taxi from Bristol. Although Ryanair also do flights from Dublin to Bristol or Dublin to
              Exeter. For the more pampered passenger, we know you can get Aer Lingus or British Airways flights from
              Belfast or Dublin to Bristol or Exeter.
            </p>
            <div className="flex gap-3 flex-wrap">
              <MapLink query="Bristol Airport" label="BRISTOL AIRPORT" />
              <MapLink query="Exeter Airport" label="EXETER AIRPORT" />
            </div>
          </div>

          <div>
            <h3 className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[var(--color-primary)] mb-1">
              I&apos;m coming from anywhere else on Planet Earth
            </h3>
            <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
              We have a few guests representing team USA, plus others coming from the wider world.
              We reckon you&apos;ll be getting a flight to London. Then you can just get a train from London Paddington to
              Tiverton Parkway and taxi the rest of the way as per the Londoner advice above.
            </p>
          </div>

          <div className="mt-5">
            <h3 className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[var(--color-primary)] mb-1">
              Local taxis
            </h3>
            <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed mb-3">
              Deer Park is out in the countryside, so you&apos;ll want a taxi booked in advance rather than hoping one
              turns up. Book early for the Saturday night, as local firms get hammered on wedding weekends. We normally
              use Sparkys.
            </p>
            <div className="border border-[var(--color-text)]/15 rounded-md overflow-hidden">
              {[
                { name: 'Sparkys Taxis', tel: '01404 47670', note: 'Honiton. The one we use.' },
                { name: 'Millstream Taxis', tel: '01404 45825', note: 'Honiton' },
                { name: 'Regency Cars', tel: '01404 549300', note: 'Honiton Business Park' },
                { name: 'Zodiac Cars', tel: '01404 41484', note: 'Honiton' },
                { name: 'Blackdown Cars', tel: '01404 892888', note: 'Blackdown Hills' },
                { name: 'Aquarius Taxis', tel: '07882 002028', note: 'Covers wider East Devon' },
                { name: 'Otter Cabs', tel: '01404 812471', note: 'Ottery St Mary' },
              ].map((t, i) => (
                <div
                  key={t.name}
                  className={`flex items-baseline justify-between gap-3 px-3 py-2 ${i === 0 ? 'bg-[var(--color-accent)]/10' : ''} ${i > 0 ? 'border-t border-[var(--color-text)]/10' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="crispy font-[family-name:var(--font-playfair)] text-base text-[var(--color-text)]">
                      {t.name}
                    </span>
                    <span className="block font-[family-name:var(--font-vt323)] text-[11px] tracking-widest text-[var(--color-muted)]">
                      {t.note.toUpperCase()}
                    </span>
                  </span>
                  <a
                    href={`tel:${t.tel.replace(/\s/g, '')}`}
                    className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-primary)] underline underline-offset-2 shrink-0"
                  >
                    {t.tel}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    case 'faq':
      return (
        <div className="p-8">
          <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-4xl text-[var(--color-primary)] mb-4">FAQ</h2>

          <FaqItem
            q="What's the dress code?"
            a={<>The short answer is Summer suits &amp; dresses with a &ldquo;funky formal&rdquo; theme. For most of you, Bechan (and occasionally Ethan) has almost certainly turned up to one of your
              events wearing something completely ridiculous, but normally pretty cool, so take this as your opportunity
              to return the favour. Get those crazy colours or patterns out that you&apos;ve never had the right occasion
              for otherwise. Bonus points to the men attending for coloured suits, funky ties or cravats.</>}
          />

          <FaqItem
            q="Why Devon?"
            a={<>Broadhembury is pretty much Bechan&apos;s happy place. Dale &amp; Catherine bought the house there around
              30 years ago and have been taking the Thomas kids there every school holiday they possibly could to get them
              out of London. So Devon has become a direct association of all their combined childhood memories of
              Christmases, Easters and Summer holidays, spending that time among the rolling green hills and thatched
              houses of the South West. Since we started going out in 2018, we still try to get down there as often as
              possible. Ethan couldn&apos;t believe real places like that existed in England and not just in Noddy or
              Postman Pat or Enid Blyton books. The people are lovely, the scenery is gorgeous. Playing pool cricket in
              the sun in Summer or popping down to the Drewe Arms for a pint of Otter Ale and fish and chips by the fire
              on a cold Winter evening are treasured joys of our life together. If we haven&apos;t already made you visit,
              we genuinely can&apos;t wait for you to come and see why we love it so much.</>}
          />

          <FaqItem
            q="Can I buy you a present?"
            a={<>Of course the correct thing to do is to say your presence is gift enough, blah blah. But we love stuff
              too much, so yes please to any prezzies! We&apos;ll post a link to our gift registry here when we finally
              get our act together and make one.</>}
          />

          <FaqItem
            q="What shoes should I wear?"
            a={<>Bechan will be wearing the most ridiculous high heels ever conceived by mankind, but naturally as
              it&apos;s the Devon countryside, flat solid ground is by no means a guarantee. We&apos;d recommend taking
              a pair of flats as a back up for the wobbly bits.</>}
          />

          <FaqItem
            q="Can I take my kids?"
            a={<>Apologies to be a pain, but we&apos;re going adults only for this one. If you&apos;re able to wrangle
              grandparents or babysitters, we hope that allows you to relinquish all responsibility and maturity and
              properly let your hair down.</>}
          />

          {/* Keep the two website questions last — they're an easter egg for anyone who scrolls this far */}
          <FaqItem
            q="Who made the website?"
            a={<>Ethan being a weird computer guy, this was the main thing he could actually have a creative input on.
              So he&apos;s taken far too long fiddling about on weekends to make this.</>}
          />

          <FaqItem
            q="I'm also a weird basement dweller computer guy, how did you make the website?"
            a={<>Built with Next.js (React), Tailwind CSS and Supabase for the database, hosted on Vercel. The whole
              retro desktop look is a deliberate homage to (okay, fairly blatant rip off of) the Windows 95 UI. If you
              want to see exactly how questionable the code is, it&apos;s public on GitHub at{' '}
              <a
                href="https://github.com/ethan-JH/deerly-beloved"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] underline underline-offset-2"
              >
                github.com/ethan-JH/deerly-beloved
              </a>.</>}
          />
        </div>
      )
    case 'secret':
      return <BreakoutGame invite={invite} />
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
  const [phase, setPhase] = useState<'loading' | 'dissolving' | 'done'>('loading')
  const [zooming, setZooming] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({})
  const [clock, setClock] = useState<string | null>(null)
  const [invite, setInvite] = useState<InviteData | null>(null)

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
      .then((r) => (r.ok ? (r.json() as Promise<InviteData>) : null))
      .then((data) => {
        if (!data) return
        setInvite(data)
      })
      .catch(() => {})
  }, [])

  // Warm the cache for in-window photos and taskbar icons while the loading screen runs
  useEffect(() => {
    const srcs = [...WINDOW_PHOTOS, ...WINDOWS_CONFIG.map((w) => w.icon)]
    srcs.forEach((src) => { const img = new Image(); img.src = src })
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
          isOpen: false,
          zIndex: 0,
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

  // Rough target for the wireframe to expand into. The real window sizes itself
  // to its content, so this only needs to be close enough to read as the effect.
  function zoomTarget(id: string, spawn: { x: number; y: number }) {
    const availH = window.innerHeight - spawn.y - 96
    const h = Math.max(220, Math.min(id === 'home' ? 460 : 520, availH))
    return { x: spawn.x, y: spawn.y, w: getWidth(id), h }
  }

  function openWindow(id: string) {
    const win = windows.find((w) => w.id === id)
    if (!win) return
    setZooming((z) => ({ ...z, [id]: zoomTarget(id, win.spawnPosition) }))
  }

  function finishZoom(id: string) {
    setZooming((z) => {
      const next = { ...z }
      delete next[id]
      return next
    })
    maxZRef.current += 1
    const z = maxZRef.current
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, isOpen: true, zIndex: z } : w)))
  }

  function toggleWindow(id: string) {
    const win = windows.find((w) => w.id === id)
    if (win?.isOpen) {
      setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, isOpen: false } : w)))
    } else if (!zooming[id]) {
      openWindow(id)
    }
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
      {phase === 'loading' && <LoadingScreen onComplete={() => setPhase('dissolving')} />}

      {phase === 'dissolving' && (
        <PixelDissolveOut
          onDone={() => {
            setPhase('done')
            openWindow('home')
          }}
        />
      )}

      {Object.entries(zooming).map(([id, to]) => (
        <WireframeZoom key={id} to={to} onDone={() => finishZoom(id)} />
      ))}

      {phase !== 'loading' && (
        <>
          <TopBar clock={clock} invite={invite} />
          <div className="absolute inset-0 pt-7 pb-20 overflow-hidden">
            {windows.map((w) =>
              !w.isOpen ? null : (
                <DraggableWindow
                  key={w.id}
                  id={w.id}
                  title={w.title}
                  icon={w.icon}
                  initialPosition={w.spawnPosition}
                  zIndex={w.zIndex}
                  onClose={() => closeWindow(w.id)}
                  onFocus={() => focusWindow(w.id)}
                  width={getWidth(w.id)}
                  noScroll={w.id === 'secret'}
                >
                  <WindowContent id={w.id} invite={invite} onOpenWindow={toggleWindow} />
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
