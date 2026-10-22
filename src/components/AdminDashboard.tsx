'use client'

import { useCallback, useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Guest {
  id: string
  invite_id: string
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

interface Invite {
  id: string
  password: string
  display_name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  room_counts: Record<string, number>
  friday_invited: boolean
  guests: Guest[]
}

type InviteFields = Omit<Invite, 'id' | 'guests'>

type NewDraft = InviteFields & { guestNames: { first_name: string; last_name: string }[] }

interface GuestRsvpDraft {
  attending_saturday: boolean
  attending_friday: boolean
  attending_sunday: boolean
  dietary: string
  song_request: string
  message: string
  rsvp_submitted: boolean
}

const ROOM_TYPES = {
  main_house_double: { label: 'Main House Double', shortLabel: 'MH DBL',    price: '£150/night', capacity: 14 },
  garden_double:     { label: 'Garden Double',      shortLabel: 'GDN DBL',   price: '£150/night', capacity: 14 },
  garden_single:     { label: 'Garden Single',      shortLabel: 'GDN SGL',   price: '£75/night',  capacity: 2  },
  treehouse:         { label: 'The Treehouse',       shortLabel: 'TREEHOUSE', price: 'Bridal Suite', capacity: 1  },
} as const
type RoomType = keyof typeof ROOM_TYPES

// ── Constants ─────────────────────────────────────────────────────────────────

const RAISED = 'inset -2px -2px 0 rgba(23,96,176,0.45), inset 2px 2px 0 rgb(250,244,198)'

const BLANK_DRAFT: NewDraft = {
  display_name: '', password: '', email: null, phone: null,
  address: null, notes: null, room_counts: {}, friday_invited: true,
  guestNames: [{ first_name: '', last_name: '' }, { first_name: '', last_name: '' }],
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function rsvpStatus(invite: Invite): 'done' | 'partial' | 'none' {
  if (invite.guests.length === 0) return 'none'
  const done = invite.guests.filter(g => g.rsvp_submitted_at).length
  if (done === invite.guests.length) return 'done'
  if (done > 0) return 'partial'
  return 'none'
}

function RsvpBadge({ status }: { status: 'done' | 'partial' | 'none' }) {
  const cfg = {
    done:    { label: "✓ RSVP'D", color: '#22c55e' },
    partial: { label: '◑ PARTIAL', color: '#f59e0b' },
    none:    { label: '○ PENDING', color: '#9A8898' },
  } as const
  const { label, color } = cfg[status]
  return <span className="font-[family-name:var(--font-vt323)] text-xs tracking-widest shrink-0" style={{ color }}>{label}</span>
}

function RoomBreakdown({ mh, gd, gs, th }: { mh: number; gd: number; gs: number; th: number }) {
  const item = (label: string, count: number, cap: number) => (
    <span key={label} className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">
      {label}: <span className="text-[var(--color-text)]">{count}/{cap}</span>
    </span>
  )
  return (
    <div className="flex gap-4 px-1 flex-wrap">
      {item('MH DBL', mh, 14)}
      {item('GDN DBL', gd, 14)}
      {item('GDN SGL', gs, 2)}
      {item('TREEHOUSE', th, 1)}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[var(--color-text)]/10 py-2.5 px-1 text-center min-w-0">
      <div className="font-[family-name:var(--font-vt323)] text-xl md:text-3xl text-[var(--color-primary)] leading-none truncate">{value}</div>
      <div className="font-[family-name:var(--font-vt323)] text-[10px] md:text-xs tracking-widest text-[var(--color-muted)] mt-0.5 truncate">{label}</div>
    </div>
  )
}

function StatGroup({ title, cols, children }: { title: string; cols: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-vt323)] text-[10px] tracking-widest text-[var(--color-muted)] mb-1">{title}</div>
      <div className={`grid gap-1.5 ${cols}`}>{children}</div>
    </div>
  )
}

// ── Inline field editor ───────────────────────────────────────────────────────

function InviteForm({
  draft,
  onChange,
  guestNames,
  onChangeGuestName,
  onAddGuestRow,
  onRemoveGuestRow,
  showGuests,
}: {
  draft: InviteFields
  onChange: (patch: Partial<InviteFields>) => void
  guestNames?: { first_name: string; last_name: string }[]
  onChangeGuestName?: (i: number, patch: Partial<{ first_name: string; last_name: string }>) => void
  onAddGuestRow?: () => void
  onRemoveGuestRow?: (i: number) => void
  showGuests: boolean
}) {
  // text-base on mobile stops iOS zooming the viewport when a field is focused
  const inp = 'border border-[var(--color-primary)]/40 bg-transparent px-2 py-2 font-[family-name:var(--font-vt323)] text-base sm:text-sm tracking-wide text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] w-full'
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input className={inp} placeholder="Display name *" value={draft.display_name}
          onChange={e => onChange({ display_name: e.target.value })} />
        <input className={inp} placeholder="Password *" value={draft.password}
          onChange={e => onChange({ password: e.target.value })} />
        <input className={inp} placeholder="Email" value={draft.email ?? ''}
          onChange={e => onChange({ email: e.target.value || null })} />
        <input className={inp} placeholder="Phone" value={draft.phone ?? ''}
          onChange={e => onChange({ phone: e.target.value || null })} />
      </div>
      <input className={inp} placeholder="Mailing address" value={draft.address ?? ''}
        onChange={e => onChange({ address: e.target.value || null })} />
      <textarea className={inp} placeholder="Admin notes (private)" rows={2} value={draft.notes ?? ''}
        onChange={e => onChange({ notes: e.target.value || null })} />
      <div className="space-y-1">
        <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">ROOMS</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {(Object.entries(ROOM_TYPES) as [RoomType, typeof ROOM_TYPES[RoomType]][]).map(([type, info]) => {
            const count = ((draft.room_counts ?? {}) as Record<string, number>)[type] ?? 0
            return (
              <div key={type} className="flex items-center gap-2 py-0.5">
                <span className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)] flex-1 sm:flex-none sm:w-20">
                  {info.shortLabel}
                </span>
                <button type="button" disabled={count === 0}
                  className="font-[family-name:var(--font-vt323)] text-lg px-3 py-1 leading-none cursor-pointer text-[var(--color-primary)] disabled:opacity-30"
                  style={{ boxShadow: RAISED }}
                  onClick={() => onChange({ room_counts: { ...(draft.room_counts as Record<string, number>), [type]: count - 1 } })}>
                  −
                </button>
                <span className="font-[family-name:var(--font-vt323)] text-base text-[var(--color-text)] w-5 text-center tabular-nums">{count}</span>
                <button type="button"
                  className="font-[family-name:var(--font-vt323)] text-lg px-3 py-1 leading-none cursor-pointer text-[var(--color-primary)]"
                  style={{ boxShadow: RAISED }}
                  onClick={() => onChange({ room_counts: { ...(draft.room_counts as Record<string, number>), [type]: count + 1 } })}>
                  +
                </button>
              </div>
            )
          })}
        </div>
      </div>
      {showGuests && guestNames && onChangeGuestName && onAddGuestRow && onRemoveGuestRow && (
        <div className="space-y-1.5 pt-1">
          <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">GUESTS</div>
          {guestNames.map((g, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="border border-[var(--color-primary)]/40 bg-transparent px-2 py-1 font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] flex-1"
                placeholder="First name" value={g.first_name}
                onChange={e => onChangeGuestName(i, { first_name: e.target.value })} />
              <input className="border border-[var(--color-primary)]/40 bg-transparent px-2 py-1 font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] flex-1"
                placeholder="Last name" value={g.last_name}
                onChange={e => onChangeGuestName(i, { last_name: e.target.value })} />
              {guestNames.length > 1 && (
                <button className="font-[family-name:var(--font-vt323)] text-xs text-[#E07B5A] cursor-pointer px-1"
                  onClick={() => onRemoveGuestRow(i)}>✕</button>
              )}
            </div>
          ))}
          <button className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-primary)] cursor-pointer px-2 py-0.5"
            style={{ boxShadow: RAISED }} onClick={onAddGuestRow}>
            + GUEST
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [invites, setInvites]       = useState<Invite[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editDraft, setEditDraft]   = useState<InviteFields | null>(null)
  const [addingGuest, setAddingGuest] = useState<string | null>(null)
  const [newGuestName, setNewGuestName] = useState({ first_name: '', last_name: '' })
  const [showNew, setShowNew]       = useState(false)
  const [newDraft, setNewDraft]     = useState<NewDraft>(BLANK_DRAFT)
  const [showDietary, setShowDietary] = useState(false)
  const [copiedId, setCopiedId]     = useState<string | null>(null)
  const [reminderSent, setReminderSent] = useState<string | null>(null)
  const [editingGuestId, setEditingGuestId]       = useState<string | null>(null)
  const [guestDraft, setGuestDraft]               = useState<GuestRsvpDraft>({
    attending_saturday: false, attending_friday: false, attending_sunday: false,
    dietary: '', song_request: '', message: '', rsvp_submitted: false,
  })
  const [editingGuestNameId, setEditingGuestNameId] = useState<string | null>(null)
  const [guestNameDraft, setGuestNameDraft]         = useState({ first_name: '', last_name: '' })
  const [search, setSearch]                         = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/invites')
    if (res.ok) setInvites(((await res.json()) as { invites: Invite[] }).invites)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  // ── Stats (computed client-side, no extra fetch) ──────────────────────────
  const allGuests        = invites.flatMap(i => i.guests)
  const totalInvites     = invites.length
  const totalGuests      = allGuests.length
  const guestsRsvped      = allGuests.filter(g => g.rsvp_submitted_at).length
  const guestsOutstanding = allGuests.filter(g => !g.rsvp_submitted_at).length
  const attendingSat      = allGuests.filter(g => g.attending_saturday === true).length
  const attendingFri      = allGuests.filter(g => g.attending_friday === true).length
  const attendingSun      = allGuests.filter(g => g.attending_sunday === true).length
  const mainHouseRooms    = invites.reduce((s, i) => s + (i.room_counts?.main_house_double ?? 0), 0)
  const gardenDblRooms    = invites.reduce((s, i) => s + (i.room_counts?.garden_double ?? 0), 0)
  const gardenSglRooms    = invites.reduce((s, i) => s + (i.room_counts?.garden_single ?? 0), 0)
  const treehouseRooms    = invites.reduce((s, i) => s + (i.room_counts?.treehouse ?? 0), 0)
  const dietaryGuests     = allGuests.filter(g => g.dietary)

  // ── Actions ───────────────────────────────────────────────────────────────

  async function copyPassword(invite: Invite) {
    await navigator.clipboard.writeText(invite.password)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  async function createInvite() {
    if (!newDraft.display_name.trim() || !newDraft.password.trim()) return
    setSaving(true)
    const guests = newDraft.guestNames.filter(g => g.first_name.trim())
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newDraft, guests }),
    })
    if (res.ok) { setShowNew(false); setNewDraft(BLANK_DRAFT); await load() }
    setSaving(false)
  }

  async function saveEdit(id: string) {
    if (!editDraft) return
    setSaving(true)
    await fetch(`/api/admin/invites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft),
    })
    setEditingId(null); setEditDraft(null)
    await load()
    setSaving(false)
  }

  async function deleteInvite(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all their guests? This cannot be undone.`)) return
    await fetch(`/api/admin/invites/${id}`, { method: 'DELETE' })
    await load()
  }

  async function resetRsvp(id: string, name: string) {
    if (!confirm(`Clear all RSVP data for "${name}"? Guests will need to re-submit.`)) return
    await fetch(`/api/admin/invites/${id}/reset-rsvp`, { method: 'POST' })
    await load()
  }

  async function sendReminder(invite_id: string) {
    await fetch('/api/admin/email-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id }),
    })
    setReminderSent(invite_id)
    setTimeout(() => setReminderSent(null), 2000)
  }

  async function addGuest(invite_id: string) {
    if (!newGuestName.first_name.trim()) return
    setSaving(true)
    await fetch('/api/admin/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id, ...newGuestName }),
    })
    setAddingGuest(null); setNewGuestName({ first_name: '', last_name: '' })
    await load(); setSaving(false)
  }

  async function deleteGuest(id: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return
    await fetch(`/api/admin/guests/${id}`, { method: 'DELETE' })
    await load()
  }

  async function saveGuestName(id: string) {
    setSaving(true)
    await fetch(`/api/admin/guests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestNameDraft),
    })
    setEditingGuestNameId(null)
    await load()
    setSaving(false)
  }

  function startGuestEdit(g: Guest) {
    setEditingGuestId(g.id)
    setGuestDraft({
      attending_saturday: g.attending_saturday ?? false,
      attending_friday:   g.attending_friday   ?? false,
      attending_sunday:   g.attending_sunday   ?? false,
      dietary:            g.dietary            ?? '',
      song_request:       g.song_request       ?? '',
      message:            g.message            ?? '',
      rsvp_submitted:     !!g.rsvp_submitted_at,
    })
  }

  async function saveGuestRsvp(g: Guest) {
    setSaving(true)
    const patch = {
      attending_saturday: guestDraft.attending_saturday,
      attending_friday:   guestDraft.attending_friday,
      attending_sunday:   guestDraft.attending_sunday,
      dietary:            guestDraft.dietary      || null,
      song_request:       guestDraft.song_request || null,
      message:            guestDraft.message      || null,
      rsvp_submitted_at:  guestDraft.rsvp_submitted
        ? (g.rsvp_submitted_at ?? new Date().toISOString())
        : null,
    }
    await fetch(`/api/admin/guests/${g.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setEditingGuestId(null)
    await load()
    setSaving(false)
  }

  const filteredInvites = search.trim()
    ? invites.filter(i => {
        const q = search.trim().toLowerCase()
        return (
          i.display_name.toLowerCase().includes(q) ||
          i.guests.some(g => `${g.first_name} ${g.last_name}`.toLowerCase().includes(q))
        )
      })
    : invites

  // ── Shared styles ─────────────────────────────────────────────────────────
  // Padding sized for thumbs, not mice — these are tapped on a phone constantly
  const btn    = 'font-[family-name:var(--font-vt323)] text-xs tracking-widest px-3 py-1.5 cursor-pointer text-[var(--color-primary)]'
  const danger = 'font-[family-name:var(--font-vt323)] text-xs tracking-widest px-3 py-1.5 cursor-pointer text-[#E07B5A]'
  const inpSm  = 'border border-[var(--color-primary)]/40 bg-transparent px-2 py-1.5 font-[family-name:var(--font-vt323)] text-base sm:text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]'

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-8 font-[family-name:var(--font-vt323)] text-[var(--color-muted)] tracking-widest animate-pulse">
      LOADING...
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Stats — grouped so they stay readable at phone width instead of squashing */}
      <div className="space-y-3">
        <StatGroup title="PEOPLE" cols="grid-cols-3 md:grid-cols-6">
          <StatCard label="GUESTS"    value={totalGuests} />
          <StatCard label="RSVP'D"    value={`${guestsRsvped}/${totalGuests}`} />
          <StatCard label="INVITES"   value={totalInvites} />
          <StatCard label="SAT"       value={attendingSat} />
          <StatCard label="FRI"       value={attendingFri} />
          <StatCard label="SUN"       value={attendingSun} />
        </StatGroup>
        <StatGroup title="ROOMS" cols="grid-cols-2 md:grid-cols-4">
          <StatCard label="MH DBL"    value={`${mainHouseRooms}/14`} />
          <StatCard label="GDN DBL"   value={`${gardenDblRooms}/14`} />
          <StatCard label="GDN SGL"   value={`${gardenSglRooms}/2`} />
          <StatCard label="TREEHOUSE" value={`${treehouseRooms}/1`} />
        </StatGroup>
      </div>

      {/* Toolbar — search first, it's the thing you reach for on a phone */}
      <div className="space-y-2">
        <input
          className="w-full border border-[var(--color-primary)]/40 bg-transparent px-3 py-2 font-[family-name:var(--font-vt323)] text-base tracking-wide text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          placeholder="SEARCH GUESTS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowNew(v => !v)}
            className="font-[family-name:var(--font-vt323)] text-sm px-3 py-2 tracking-widest text-[var(--color-primary)] cursor-pointer"
            style={{ background: 'var(--color-surface)', boxShadow: RAISED }}
          >
            {showNew ? '✕ CANCEL' : '+ NEW INVITE'}
          </button>
          <button
            onClick={() => setShowDietary(v => !v)}
            className="font-[family-name:var(--font-vt323)] text-sm px-3 py-2 tracking-widest text-[var(--color-muted)] cursor-pointer border border-[var(--color-text)]/15"
          >
            {showDietary ? 'HIDE DIETARY' : `DIETARY (${dietaryGuests.length})`}
          </button>
          <a
            href="/api/admin/export"
            className="font-[family-name:var(--font-vt323)] text-sm px-3 py-2 tracking-widest text-[var(--color-primary)] cursor-pointer"
            style={{ background: 'var(--color-surface)', boxShadow: RAISED }}
          >
            EXPORT CSV ↓
          </a>
        </div>
      </div>

      {/* Dietary summary */}
      {showDietary && (
        <div className="border border-[var(--color-text)]/10 p-3 space-y-1">
          <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)] mb-1">DIETARY REQUIREMENTS</div>
          {dietaryGuests.length === 0
            ? <div className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-muted)]">None recorded yet.</div>
            : dietaryGuests.map(g => (
              <div key={g.id} className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)]">
                {g.first_name} {g.last_name}:&nbsp;
                <span className="text-[var(--color-accent)]">{g.dietary}</span>
              </div>
            ))
          }
        </div>
      )}

      {/* New invite form */}
      {showNew && (
        <div className="border-2 border-[var(--color-primary)]/30 p-4 space-y-3">
          <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">NEW INVITE</div>
          <InviteForm
            draft={newDraft}
            onChange={patch => setNewDraft(d => ({ ...d, ...patch }))}
            guestNames={newDraft.guestNames}
            onChangeGuestName={(i, patch) =>
              setNewDraft(d => ({ ...d, guestNames: d.guestNames.map((g, j) => j === i ? { ...g, ...patch } : g) }))
            }
            onAddGuestRow={() => setNewDraft(d => ({ ...d, guestNames: [...d.guestNames, { first_name: '', last_name: '' }] }))}
            onRemoveGuestRow={i => setNewDraft(d => ({ ...d, guestNames: d.guestNames.filter((_, j) => j !== i) }))}
            showGuests
          />
          <button
            onClick={createInvite} disabled={saving || !newDraft.display_name.trim() || !newDraft.password.trim()}
            className="font-[family-name:var(--font-vt323)] text-sm px-3 py-1 tracking-widest text-[var(--color-primary)] cursor-pointer disabled:opacity-40"
            style={{ background: 'var(--color-surface)', boxShadow: RAISED }}
          >
            {saving ? 'CREATING...' : 'CREATE INVITE'}
          </button>
        </div>
      )}

      {/* Invite list */}
      <div className="border border-[var(--color-text)]/10 divide-y divide-[var(--color-text)]/10">
        {filteredInvites.length === 0 && (
          <div className="p-4 font-[family-name:var(--font-vt323)] text-sm text-[var(--color-muted)] tracking-widest">
            {search.trim() ? `NO RESULTS FOR "${search.toUpperCase()}"` : 'NO INVITES YET. USE “+ NEW INVITE” ABOVE.'}
          </div>
        )}

        {filteredInvites.map(invite => {
          const status   = rsvpStatus(invite)
          const isExpanded = expandedId === invite.id
          const isEditing  = editingId  === invite.id

          // ── Edit mode ────────────────────────────────────────────────────
          if (isEditing && editDraft) return (
            <div key={invite.id} className="p-4 space-y-3 bg-[var(--color-chrome)]/40">
              <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">
                EDITING: {invite.display_name}
              </div>
              <InviteForm
                draft={editDraft}
                onChange={patch => setEditDraft(d => d ? { ...d, ...patch } : d)}
                showGuests={false}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(invite.id)} disabled={saving}
                  className="font-[family-name:var(--font-vt323)] text-sm px-3 py-1 tracking-widest text-[var(--color-primary)] cursor-pointer disabled:opacity-40"
                  style={{ background: 'var(--color-surface)', boxShadow: RAISED }}
                >
                  {saving ? 'SAVING...' : 'SAVE'}
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditDraft(null) }}
                  className={`${btn}`} style={{ boxShadow: RAISED }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )

          // ── Normal row ───────────────────────────────────────────────────
          return (
            <div key={invite.id}>
              {/* Collapsed header — stacks on phones, single row from md up */}
              <div className={`px-3 py-2.5 ${Object.values(invite.room_counts ?? {}).some(n => n > 0) ? 'bg-[#FAF4C6]/60 hover:bg-[#FAF4C6]/80' : 'hover:bg-[var(--color-chrome)]/20'}`}>
                {/* Name + status */}
                <div className="flex items-center gap-2">
                  <button
                    className="font-[family-name:var(--font-vt323)] text-base text-[var(--color-muted)] w-5 shrink-0 cursor-pointer text-left"
                    onClick={() => setExpandedId(isExpanded ? null : invite.id)}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? '▼' : '►'}
                  </button>
                  <span className="font-[family-name:var(--font-vt323)] text-base tracking-wide text-[var(--color-text)] flex-1 min-w-0 truncate">
                    {invite.display_name}
                  </span>
                  <RsvpBadge status={status} />
                </div>

                {/* Meta line */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 pl-7">
                  <button
                    title="Tap to copy password"
                    onClick={() => copyPassword(invite)}
                    className="font-[family-name:var(--font-vt323)] text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] cursor-pointer tracking-widest"
                  >
                    {copiedId === invite.id ? '✓ COPIED' : `🔑 ${invite.password}`}
                  </button>

                  <span className="font-[family-name:var(--font-vt323)] text-xs text-[var(--color-muted)]">
                    {invite.guests.length}p
                  </span>

                  {(Object.entries(invite.room_counts ?? {}) as [RoomType, number][])
                    .filter(([, n]) => n > 0)
                    .map(([type, n]) => (
                      <span key={type} className="font-[family-name:var(--font-vt323)] text-xs tracking-widest" style={{ color: '#1760B0' }}>
                        🏠 {ROOM_TYPES[type]?.shortLabel ?? type}{n > 1 ? ` ×${n}` : ''}
                      </span>
                    ))
                  }

                  {invite.email && (
                    <span className="font-[family-name:var(--font-vt323)] text-xs text-[var(--color-muted)] truncate max-w-full hidden sm:block">
                      {invite.email}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5 mt-2 pl-7">
                  <button
                    className={btn} style={{ boxShadow: RAISED }}
                    onClick={() => {
                      setEditingId(invite.id)
                      setEditDraft({
                        display_name: invite.display_name, password: invite.password,
                        email: invite.email, phone: invite.phone, address: invite.address,
                        notes: invite.notes, room_counts: invite.room_counts,
                        friday_invited: invite.friday_invited,
                      })
                      setExpandedId(null)
                    }}
                  >EDIT</button>

                  {invite.email && status !== 'done' && (
                    <button className={btn} style={{ boxShadow: RAISED }}
                      onClick={() => sendReminder(invite.id)}>
                      {reminderSent === invite.id ? '✓ SENT' : 'REMIND'}
                    </button>
                  )}

                  <button className={danger} style={{ boxShadow: RAISED }}
                    onClick={() => resetRsvp(invite.id, invite.display_name)}>
                    RESET RSVP
                  </button>

                  <button className={danger} style={{ boxShadow: RAISED }}
                    onClick={() => deleteInvite(invite.id, invite.display_name)}>DEL</button>
                </div>
              </div>

              {/* Expanded: contact details + guests */}
              {isExpanded && (
                <div className="pl-4 sm:pl-9 pr-3 pb-3 bg-[var(--color-chrome)]/10 space-y-1">
                  {/* Contact fields */}
                  {(invite.address || invite.phone || invite.notes) && (
                    <div className="py-1.5 space-y-0.5 border-b border-[var(--color-text)]/5 mb-2">
                      {invite.address && (
                        <div className="font-[family-name:var(--font-vt323)] text-xs text-[var(--color-muted)]">📮 {invite.address}</div>
                      )}
                      {invite.phone && (
                        <div className="font-[family-name:var(--font-vt323)] text-xs text-[var(--color-muted)]">📞 {invite.phone}</div>
                      )}
                      {invite.notes && (
                        <div className="font-[family-name:var(--font-vt323)] text-xs text-[var(--color-muted)] italic">📝 {invite.notes}</div>
                      )}
                    </div>
                  )}

                  {/* Guests */}
                  {invite.guests.length === 0
                    ? <div className="font-[family-name:var(--font-vt323)] text-xs text-[var(--color-muted)] py-1">No guests on this invite yet.</div>
                    : invite.guests.map(g => (
                      <div key={g.id} className="py-1.5 border-b border-[var(--color-text)]/5">
                        {editingGuestId === g.id ? (
                          /* ── RSVP edit form ── */
                          <div className="space-y-2">
                            <div className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)]">
                              {g.first_name} {g.last_name}
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {([ ['attending_saturday', 'SATURDAY'], ['attending_friday', 'FRIDAY'], ['attending_sunday', 'SUNDAY'], ['rsvp_submitted', 'RSVP SUBMITTED'] ] as const).map(([field, label]) => (
                                <label key={field} className="flex items-center gap-1.5 font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-text)] cursor-pointer select-none">
                                  <input type="checkbox"
                                    checked={guestDraft[field]}
                                    onChange={e => setGuestDraft(d => ({ ...d, [field]: e.target.checked }))} />
                                  {label}
                                </label>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {([ ['dietary', 'Dietary requirements'], ['song_request', 'Song request'], ['message', 'Message'] ] as const).map(([field, placeholder]) => (
                                <input key={field} className={inpSm} placeholder={placeholder}
                                  value={guestDraft[field]}
                                  onChange={e => setGuestDraft(d => ({ ...d, [field]: e.target.value }))} />
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button className={btn} style={{ boxShadow: RAISED }}
                                onClick={() => saveGuestRsvp(g)} disabled={saving}>
                                {saving ? 'SAVING...' : 'SAVE'}
                              </button>
                              <button className={danger} onClick={() => setEditingGuestId(null)}>CANCEL</button>
                            </div>
                          </div>
                        ) : editingGuestNameId === g.id ? (
                          /* ── Name edit form ── */
                          <div className="flex gap-2 items-center flex-wrap">
                            <input className={`${inpSm} flex-1 min-w-[80px]`} placeholder="First name"
                              value={guestNameDraft.first_name}
                              onChange={e => setGuestNameDraft(d => ({ ...d, first_name: e.target.value }))} />
                            <input className={`${inpSm} flex-1 min-w-[80px]`} placeholder="Last name"
                              value={guestNameDraft.last_name}
                              onChange={e => setGuestNameDraft(d => ({ ...d, last_name: e.target.value }))} />
                            <button className={btn} style={{ boxShadow: RAISED }}
                              onClick={() => saveGuestName(g.id)} disabled={saving}>
                              {saving ? '...' : 'SAVE'}
                            </button>
                            <button className={danger} onClick={() => setEditingGuestNameId(null)}>CANCEL</button>
                          </div>
                        ) : (
                          /* ── Display row ── */
                          <div className="flex items-start gap-3 flex-wrap">
                            <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)] w-full sm:w-auto sm:min-w-[130px]">
                              {g.first_name} {g.last_name}
                            </span>
                            {g.rsvp_submitted_at ? (
                              <div className="flex flex-wrap gap-x-3 gap-y-0 font-[family-name:var(--font-vt323)] text-xs text-[var(--color-muted)] flex-1 min-w-0">
                                <span>SAT: <b className="text-[var(--color-text)]">{g.attending_saturday ? '✓' : '✗'}</b></span>
                                <span>FRI: <b className="text-[var(--color-text)]">{g.attending_friday ? '✓' : '✗'}</b></span>
                                <span>SUN: <b className="text-[var(--color-text)]">{g.attending_sunday ? '✓' : '✗'}</b></span>
                                {g.dietary      && <span>🍽 <span className="text-[var(--color-accent)]">{g.dietary}</span></span>}
                                {g.song_request && <span>🎵 {g.song_request}</span>}
                                {g.message      && <span className="italic">"{g.message}"</span>}
                              </div>
                            ) : (
                              <span className="font-[family-name:var(--font-vt323)] text-xs text-[#9A8898] flex-1">Not yet RSVPed</span>
                            )}
                            <div className="flex gap-1 flex-wrap w-full sm:w-auto sm:ml-auto">
                              <button className={btn} style={{ boxShadow: RAISED }}
                                onClick={() => { setEditingGuestNameId(g.id); setGuestNameDraft({ first_name: g.first_name, last_name: g.last_name }) }}>
                                RENAME
                              </button>
                              <button className={btn} style={{ boxShadow: RAISED }}
                                onClick={() => startGuestEdit(g)}>EDIT RSVP</button>
                              <button className={danger}
                                onClick={() => deleteGuest(g.id, `${g.first_name} ${g.last_name}`)}>✕</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  }

                  {/* Add guest inline */}
                  {addingGuest === invite.id ? (
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <input className={`${inpSm} flex-1 min-w-[80px]`} placeholder="First name"
                        value={newGuestName.first_name}
                        onChange={e => setNewGuestName(n => ({ ...n, first_name: e.target.value }))} />
                      <input className={`${inpSm} flex-1 min-w-[80px]`} placeholder="Last name"
                        value={newGuestName.last_name}
                        onChange={e => setNewGuestName(n => ({ ...n, last_name: e.target.value }))} />
                      <button className={btn} style={{ boxShadow: RAISED }}
                        onClick={() => addGuest(invite.id)} disabled={saving}>
                        {saving ? '...' : 'ADD'}
                      </button>
                      <button className={danger}
                        onClick={() => { setAddingGuest(null); setNewGuestName({ first_name: '', last_name: '' }) }}>
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <button className={`${btn} mt-1.5`} style={{ boxShadow: RAISED }}
                      onClick={() => setAddingGuest(invite.id)}>
                      + ADD GUEST
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
