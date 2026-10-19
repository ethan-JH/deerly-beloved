import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value
  return !!process.env.ADMIN_PASSWORD && session === process.env.ADMIN_PASSWORD
}

function esc(val: string | null | undefined | boolean): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function roomsSummary(room_counts: Record<string, number> | null): string {
  if (!room_counts) return ''
  return Object.entries(room_counts)
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `${type} x${n}`)
    .join('; ')
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('invites')
    .select('*, guests(*)')
    .order('display_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = [
    'Invite', 'Password', 'Email', 'Phone', 'Address',
    'Rooms', 'Friday Invited', 'Notes',
    'Guest First Name', 'Guest Last Name',
    'RSVP Submitted', 'Attending Sat', 'Attending Fri', 'Attending Sun',
    'Dietary', 'Song Request', 'Message',
  ]

  type InviteRow = {
    display_name: string; password: string; email: string | null; phone: string | null
    address: string | null; room_counts: Record<string, number> | null; friday_invited: boolean; notes: string | null
    guests: Array<{
      first_name: string; last_name: string; rsvp_submitted_at: string | null
      attending_saturday: boolean | null; attending_friday: boolean | null; attending_sunday: boolean | null
      dietary: string | null; song_request: string | null; message: string | null
    }>
  }

  const rows: string[] = [headers.join(',')]

  for (const inv of (data ?? []) as InviteRow[]) {
    const rooms = roomsSummary(inv.room_counts)
    if (inv.guests.length === 0) {
      rows.push([
        esc(inv.display_name), esc(inv.password), esc(inv.email), esc(inv.phone),
        esc(inv.address), esc(rooms), esc(inv.friday_invited), esc(inv.notes),
        '', '', '', '', '', '', '', '', '',
      ].join(','))
    } else {
      for (const g of inv.guests) {
        rows.push([
          esc(inv.display_name), esc(inv.password), esc(inv.email), esc(inv.phone),
          esc(inv.address), esc(rooms), esc(inv.friday_invited), esc(inv.notes),
          esc(g.first_name), esc(g.last_name),
          esc(g.rsvp_submitted_at ? new Date(g.rsvp_submitted_at).toLocaleDateString('en-GB') : null),
          esc(g.attending_saturday), esc(g.attending_friday), esc(g.attending_sunday),
          esc(g.dietary), esc(g.song_request), esc(g.message),
        ].join(','))
      }
    }
  }

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="guests.csv"',
    },
  })
}
