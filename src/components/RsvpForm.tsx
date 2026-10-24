'use client'

import { useState, useEffect, useRef } from 'react'
import { COPY } from '@/content/copy'
import { renderCopy, flow } from '@/content/render'

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
  attending_sunday: boolean | null
  dietary: string | null
}

interface RsvpInvite {
  email: string | null
  room_counts: Record<string, number>
  room_accepted: Record<string, (boolean | null)[]>
  friday_invited: boolean
  guests: GuestMember[]
  sunday_venue_address: string | null
}

interface GuestState {
  attending_saturday: boolean | null
  attending_friday: boolean | null
  attending_sunday: boolean | null
  dietary: string
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

function StatusLine({ label, value }: { label: string; value: boolean | null }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] flex-1 leading-snug">
        {label}
      </span>
      <span
        className="font-[family-name:var(--font-vt323)] text-xs tracking-widest shrink-0"
        style={{ color: value === null ? 'var(--color-muted)' : value ? 'var(--color-accent)' : 'var(--color-muted)' }}
      >
        {value === null ? 'NOT ANSWERED' : value ? '✓ YES' : '✗ NO'}
      </span>
    </div>
  )
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
  const [wasUpdate, setWasUpdate]       = useState(false)
  const [emailSent, setEmailSent]       = useState(false)
  const successRef                      = useRef<HTMLDivElement>(null)
  const [initialized, setInitialized]   = useState(false)
  const [editMode, setEditMode]         = useState(true)
  const [hasRsvped, setHasRsvped]       = useState(false)

  useEffect(() => {
    if (invite && !initialized) {
      const states: Record<string, GuestState> = {}
      for (const g of invite.guests) {
        states[g.id] = {
          attending_saturday: g.attending_saturday,
          attending_friday:   g.attending_friday,
          attending_sunday:   g.attending_sunday,
          dietary:            g.dietary ?? '',
        }
      }
      setGuestStates(states)
      setEmail(invite.email ?? '')
      setRoomAccepted(invite.room_accepted)
      const submitted = invite.guests.some(g => g.attending_saturday !== null || g.attending_friday !== null || g.attending_sunday !== null)
      setHasRsvped(submitted)
      setEditMode(!submitted)
      setInitialized(true)
    }
  }, [invite, initialized])

  // The form is long; without this the confirmation can land off-screen entirely
  // when someone submits from the bottom
  useEffect(() => {
    if (saved) successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [saved])

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
  const multipleGuests = invite.guests.length > 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invite) return
    const startedAt = Date.now()
    setSaving(true)
    const guests = invite.guests.map(g => ({
      id: g.id,
      attending_saturday: guestStates[g.id]?.attending_saturday ?? null,
      attending_friday:   guestStates[g.id]?.attending_friday   ?? null,
      attending_sunday:   guestStates[g.id]?.attending_sunday   ?? null,
      dietary:            guestStates[g.id]?.dietary.trim()     || null,
    }))
    let emailed = false
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests, email: email || null, room_accepted: roomAccepted }),
      })
      const data = await res.json().catch(() => null) as { emailed?: boolean } | null
      emailed = !!data?.emailed
    } catch {
      // Save errors are rare and the server is the source of truth; fall through
      // to the confirmation rather than leaving the button stuck on SAVING
    }

    // Hold "SAVING..." for a beat so a fast response doesn't flash past unnoticed
    const elapsed = Date.now() - startedAt
    if (elapsed < 650) await new Promise(r => setTimeout(r, 650 - elapsed))

    setSaving(false)
    setWasUpdate(hasRsvped)
    setEmailSent(emailed)
    setSaved(true)
    setHasRsvped(true)
    setEditMode(false)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">

      {/* Title */}
      <h2 className="crispy font-[family-name:var(--font-playfair)] italic text-3xl text-[var(--color-primary)] leading-tight">
        {COPY.rsvp.title}
      </h2>

      {/* Intro */}
      <div className="space-y-3">
        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
          {renderCopy(COPY.rsvp.saturday, onOpenItinerary)}
        </p>

        <Photo src="/photos/89.jpg" caption="Deer Park Country House" className="max-w-[220px] mx-auto" />

        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
          {renderCopy(COPY.rsvp.friday)}
        </p>

        <div className="flex gap-3 justify-center">
          <Photo src="/photos/91.jpg" caption="St Andrew's Church" className="w-[45%]" objectPosition="bottom" />
          <Photo src="/photos/90.jpg" caption="The Drewe Arms" className="w-[45%]" />
        </div>

        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
          {renderCopy(COPY.rsvp.sundayBeforeAddress)}
        </p>
        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-text)] leading-relaxed text-center">
          {invite.sunday_venue_address
            ? invite.sunday_venue_address.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)
            : 'Address details coming soon.'}
        </p>
        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
          {renderCopy(COPY.rsvp.sundayAfterAddress)}
        </p>

        <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
          {renderCopy(COPY.rsvp.closing)}
        </p>
      </div>

      <Divider />

      {saved && (
        <div
          ref={successRef}
          className="rounded-lg overflow-hidden border-2 border-[var(--color-accent)]"
          style={{ boxShadow: '3px 3px 0 rgba(224,123,90,0.3)' }}
        >
          <div className="bg-[var(--color-accent)] px-3 py-1.5 flex items-center justify-between gap-2">
            <span className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-bg)]">
              ✓ {wasUpdate ? COPY.rsvp.confirmUpdatedTitle : COPY.rsvp.confirmSentTitle}
            </span>
            <button
              type="button"
              onClick={() => setSaved(false)}
              className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-bg)] cursor-pointer px-1 leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <div className="px-4 py-3 bg-[var(--color-surface)]">
            <p className="crispy font-[family-name:var(--font-playfair)] italic text-lg text-[var(--color-text)] leading-snug">
              {wasUpdate ? COPY.rsvp.confirmUpdatedHeadline : COPY.rsvp.confirmSentHeadline}
            </p>
            <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed mt-1">
              {emailSent
                ? flow(COPY.rsvp.confirmWithEmail)
                : flow(COPY.rsvp.confirmWithoutEmail)}
            </p>
          </div>
        </div>
      )}

      {!editMode ? (
        /* ── Summary view — shown once RSVPed, to stop accidental resubmission ── */
        <div className="space-y-5">
          <p className="crispy font-[family-name:var(--font-playfair)] italic text-base text-[var(--color-text)]">
            {COPY.rsvp.summaryIntro}
          </p>

          <div className="space-y-4">
            {invite.guests.map(g => (
              <div key={g.id} className="space-y-0.5">
                {multipleGuests && (
                  <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-primary)]">
                    {g.first_name.toUpperCase()} {g.last_name.toUpperCase()}
                  </div>
                )}
                <StatusLine label="Saturday 12th June — Deer Park" value={guestStates[g.id]?.attending_saturday ?? null} />
                <StatusLine label="Friday 11th June — St Andrew's Church" value={guestStates[g.id]?.attending_friday ?? null} />
                <StatusLine label="Sunday 13th June — BBQ brunch" value={guestStates[g.id]?.attending_sunday ?? null} />
                {guestStates[g.id]?.dietary && (
                  <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">
                    DIETARY: {guestStates[g.id].dietary}
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasRooms && (
            <div className="space-y-0.5">
              <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-primary)]">ROOMS</div>
              {assignedRooms.flatMap(([type, count]) => {
                const info = ROOM_TYPES[type]
                if (!info) return []
                return Array.from({ length: count }, (_, i) => (
                  <StatusLine
                    key={`${type}-${i}`}
                    label={`${info.label}${count > 1 ? ` #${i + 1}` : ''}`}
                    value={roomAccepted[type]?.[i] ?? null}
                  />
                ))
              })}
            </div>
          )}

          {email && (
            <p className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">
              EMAIL ON FILE: {email}
            </p>
          )}

          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] py-3 font-[family-name:var(--font-vt323)] text-xl tracking-widest cursor-pointer"
            style={{ boxShadow: '3px 3px 0 var(--color-accent)' }}
          >
            {COPY.rsvp.updateMyRsvpButton}
          </button>
        </div>
      ) : (
        /* ── Editable form ── */
        <>
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
                  label={COPY.rsvp.saturdayQuestion}
                  value={guestStates[g.id]?.attending_saturday ?? null}
                  onChange={v => setGuestStates(s => ({ ...s, [g.id]: { ...s[g.id], attending_saturday: v } }))}
                />
                <YesNo
                  label={COPY.rsvp.fridayQuestion}
                  value={guestStates[g.id]?.attending_friday ?? null}
                  onChange={v => setGuestStates(s => ({ ...s, [g.id]: { ...s[g.id], attending_friday: v } }))}
                />
                <YesNo
                  label={COPY.rsvp.sundayQuestion}
                  value={guestStates[g.id]?.attending_sunday ?? null}
                  onChange={v => setGuestStates(s => ({ ...s, [g.id]: { ...s[g.id], attending_sunday: v } }))}
                />
                <div className="pt-1">
                  <label className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">
                    {COPY.rsvp.dietaryLabel}
                  </label>
                  <input
                    type="text"
                    value={guestStates[g.id]?.dietary ?? ''}
                    onChange={e => setGuestStates(s => ({ ...s, [g.id]: { ...s[g.id], dietary: e.target.value } }))}
                    placeholder={COPY.rsvp.dietaryPlaceholder}
                    className="w-full mt-1 border border-[var(--color-primary)]/40 bg-transparent px-3 py-2 font-[family-name:var(--font-vt323)] text-sm tracking-wide text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Room section */}
          {hasRooms && (
            <>
              <Divider />
              <div className="space-y-3">
                <p className="crispy font-[family-name:var(--font-playfair)] text-sm text-[var(--color-muted)] leading-relaxed">
                  {renderCopy(COPY.rsvp.roomsIntro)}
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
              {COPY.rsvp.emailLabel}
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
              {saving ? 'SAVING…' : hasRsvped ? COPY.rsvp.updateButton : COPY.rsvp.sendButton}
            </button>
            {hasRsvped && (
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="w-full font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)] cursor-pointer py-1"
              >
                CANCEL
              </button>
            )}
          </div>
        </>
      )}

    </form>
  )
}
