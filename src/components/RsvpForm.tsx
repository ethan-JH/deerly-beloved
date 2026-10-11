'use client'

import { useState, useEffect } from 'react'

const ROOM_TYPES: Record<string, { label: string; price: string }> = {
  main_house_double: { label: 'Main House Double', price: '£150 per night' },
  garden_double:     { label: 'Garden Double',      price: '£150 per night' },
  garden_single:     { label: 'Garden Single',      price: '£75 per night'  },
  treehouse:         { label: 'The Treehouse',       price: 'Bridal Suite'   },
}

interface GuestMember {
  id: string
  first_name: string
  last_name: string
  attending_saturday: boolean | null
  attending_friday: boolean | null
}

interface RsvpInvite {
  email: string | null
  room_counts: Record<string, number>
  room_accepted: Record<string, (boolean | null)[]>
  friday_invited: boolean
  guests: GuestMember[]
}

interface GuestState {
  attending_saturday: boolean | null
  attending_friday: boolean | null
}

const RAISED  = 'inset -2px -2px 0 rgba(23,96,176,0.45), inset 2px 2px 0 rgb(250,244,198)'
const PRESSED = 'inset 2px 2px 0 rgba(23,96,176,0.6), inset -1px -1px 0 rgb(250,244,198)'

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <span className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] flex-1 leading-snug">
        {label}
      </span>
      <div className="flex gap-1.5 shrink-0">
        {([true, false] as const).map(v => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className="font-[family-name:var(--font-vt323)] text-sm tracking-widest px-3 py-0.5 cursor-pointer transition-colors"
            style={{
              background: value === v ? 'var(--color-primary)' : 'var(--color-surface)',
              color: value === v ? 'var(--color-bg)' : 'var(--color-text)',
              boxShadow: value === v ? PRESSED : RAISED,
            }}
          >
            {v ? 'YES' : 'NO'}
          </button>
        ))}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="w-full h-px bg-[var(--color-text)]/10" />
}

function Photo({ src, caption, className = '', objectPosition = 'center' }: { src: string; caption: string; className?: string; objectPosition?: string }) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded border border-[var(--color-text)]/15" style={{ aspectRatio: '4/3' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption} className="w-full h-full object-cover" style={{ objectPosition }} />
      </div>
      <figcaption className="font-[family-name:var(--font-vt323)] text-[11px] tracking-widest text-[var(--color-muted)] text-center mt-1">
        {caption.toUpperCase()}
      </figcaption>
    </figure>
  )
}

export function RsvpForm({ invite, onOpenItinerary }: { invite: RsvpInvite | null; onOpenItinerary: () => void }) {
  const [guestStates, setGuestStates]   = useState<Record<string, GuestState>>({})
  const [email, setEmail]               = useState('')
  const [roomAccepted, setRoomAccepted] = useState<Record<string, (boolean | null)[]>>({})
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [initialized, setInitialized]   = useState(false)

  useEffect(() => {
    if (invite && !initialized) {
      const states: Record<string, GuestState> = {}
      for (const g of invite.guests) {
        states[g.id] = {
          attending_saturday: g.attending_saturday,
          attending_friday:   g.attending_friday,
        }
      }
      setGuestStates(states)
      setEmail(invite.email ?? '')
      setRoomAccepted(invite.room_accepted)
      setInitialized(true)
    }
  }, [invite, initialized])

  if (!invite) {
    return (
      <div className="p-8">
        <p className="crispy font-[family-name:var(--font-playfair)] text-lg text-[var(--color-muted)] animate-pulse">
          Loading…
        </p>
      </div>
    )
  }

  const hasRooms     = Object.values(invite.room_counts ?? {}).some(n => n > 0)
  const assignedRooms = Object.entries(invite.room_counts ?? {}).filter(([, n]) => n > 0)
  const alreadyRsvped = invite.guests.some(g => g.attending_saturday !== null || g.attending_friday !== null)
  const multipleGuests = invite.guests.length > 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invite) return
    setSaving(true)
    const guests = invite.guests.map(g => ({
      id: g.id,
      attending_saturday: guestStates[g.id]?.attending_saturday ?? null,
      attending_friday:   guestStates[g.id]?.attending_friday   ?? null,
    }))
    await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guests, email: email || null, room_accepted: roomAccepted }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3500)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">

      {/* Title */}
      <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-3xl text-[var(--color-primary)] leading-tight">
        Let us know if you can make it!
      </h2>

      {/* Intro */}
      <div className="space-y-3">
        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
          You can read the exact details in the{' '}
          <button
            type="button"
            onClick={onOpenItinerary}
            className="text-[var(--color-primary)] underline underline-offset-2 cursor-pointer"
          >
            itinerary
          </button>
          , but the big day — which is hopefully already on your calendar — is on{' '}
          <span className="text-[var(--color-text)]">Saturday 12th June at Deer Park Country House, Honiton, starting at 1:30pm</span>.
          That&apos;ll be the main ceremony followed by the reception, wedding breakfast, dancing, the whole shebang.
        </p>

        <Photo src="/photos/89.jpg" caption="Deer Park Country House" className="max-w-[220px] mx-auto" />

        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
          But as an optional bonus for any of our guests willing to watch us get married twice, our legal wedding ceremony
          is the evening before, starting{' '}
          <span className="text-[var(--color-text)]">5pm Friday 11th June, at St Andrew&apos;s Church in Broadhembury village</span>.
          Broadhembury is near and dear to Bechan and the Thomas family, where they spent almost every school holiday
          throughout Bechan&apos;s childhood. It&apos;s very special for us to be getting (legally) married there, and we thought it
          would be lovely to extend the invite to everyone. With that said, there&apos;s absolutely no pressure to come down for the
          Friday if you can&apos;t make it or don&apos;t fancy it. We know even getting up for 1 day of a wedding is a big ask, so
          don&apos;t worry at all if you can only do the Saturday. We can&apos;t offer you accommodation for the Friday but we are
          booking out the Drewe Arms for dinner and drinks after the church ceremony. The Drewe Arms is not only a 30 second
          walk away from the church, but our panel of incredibly biased judges do regard it as the best pub in Devon, and
          possibly the World.
        </p>

        <div className="flex gap-3 justify-center">
          <Photo src="/photos/91.jpg" caption="St Andrew's Church" className="w-[45%]" objectPosition="bottom" />
          <Photo src="/photos/90.jpg" caption="The Drewe Arms" className="w-[45%]" />
        </div>

        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
          If you can make it we can&apos;t wait to welcome you to Devon!
        </p>
      </div>

      <Divider />

      {/* Per-guest attendance */}
      <div className="space-y-5">
        {invite.guests.map(g => (
          <div key={g.id} className="space-y-2">
            {multipleGuests && (
              <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-primary)]">
                {g.first_name.toUpperCase()} {g.last_name.toUpperCase()}
              </div>
            )}
            <YesNo
              label="Saturday 12th June — Deer Park Country House?"
              value={guestStates[g.id]?.attending_saturday ?? null}
              onChange={v => setGuestStates(s => ({ ...s, [g.id]: { ...s[g.id], attending_saturday: v } }))}
            />
            <YesNo
              label="Friday 11th June — St Andrew's Church, Broadhembury?"
              value={guestStates[g.id]?.attending_friday ?? null}
              onChange={v => setGuestStates(s => ({ ...s, [g.id]: { ...s[g.id], attending_friday: v } }))}
            />
          </div>
        ))}
      </div>

      {/* Room section */}
      {hasRooms && (
        <>
          <Divider />
          <div className="space-y-3">
            <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
              You lucky duck{multipleGuests ? 's' : ''}! We have limited rooms at Deer Park for the Saturday night but we love
              you so much / want you to stay up late so we prioritised giving you a room. Please brag loudly at the wedding
              about how much better you are than the other guests and how much more we like you. We&apos;ve put the price per
              night of the room beside the input, but if you&apos;d rather sort out your own accommodation that&apos;s equally no
              issue. Just let us know and we&apos;ll give someone else the bragging rights.
            </p>
            <div className="space-y-1.5">
              {assignedRooms.flatMap(([type, count]) => {
                const info = ROOM_TYPES[type]
                if (!info) return []
                return Array.from({ length: count }, (_, i) => (
                  <YesNo
                    key={`${type}-${i}`}
                    label={`${info.label}${count > 1 ? ` #${i + 1}` : ''} — ${info.price}`}
                    value={roomAccepted[type]?.[i] ?? null}
                    onChange={v => setRoomAccepted(r => {
                      const arr = [...(r[type] ?? Array(count).fill(null))]
                      arr[i] = v
                      return { ...r, [type]: arr }
                    })}
                  />
                ))
              })}
            </div>
          </div>
        </>
      )}

      <Divider />

      {/* Email */}
      <div className="space-y-1.5">
        <label className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">
          EMAIL — WE&apos;LL SEND YOUR RSVP CONFIRMATION HERE
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border border-[var(--color-primary)]/40 bg-transparent px-3 py-2 font-[family-name:var(--font-vt323)] text-sm tracking-wide text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {/* Submit */}
      <div className="space-y-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-3 font-[family-name:var(--font-vt323)] text-xl tracking-widest cursor-pointer disabled:opacity-50 transition-opacity"
          style={{ boxShadow: '3px 3px 0 var(--color-accent)' }}
        >
          {saving ? 'SAVING…' : alreadyRsvped ? 'UPDATE RSVP' : 'SEND RSVP'}
        </button>
        {saved && (
          <p className="crispy text-center font-[family-name:var(--font-playfair)] italic text-sm text-[var(--color-accent)]">
            Thanks! We can&apos;t wait to see you. ✓
          </p>
        )}
      </div>

    </form>
  )
}
