import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const inviteId = request.cookies.get('guest_session')?.value
  if (!inviteId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json() as {
    guests: { id: string; attending_saturday: boolean | null; attending_friday: boolean | null; attending_sunday: boolean | null; dietary: string | null }[]
    email: string | null
    room_accepted: Record<string, (boolean | null)[]>
  }

  const db = getSupabaseAdmin()
  const now = new Date().toISOString()

  await Promise.all(
    body.guests.map(g =>
      db.from('guests').update({
        attending_saturday: g.attending_saturday,
        attending_friday: g.attending_friday,
        attending_sunday: g.attending_sunday,
        dietary: g.dietary,
        rsvp_submitted_at: now,
      }).eq('id', g.id).eq('invite_id', inviteId)
    )
  )

  await db.from('invites').update({
    email: body.email ?? null,
    room_accepted: body.room_accepted ?? {},
  }).eq('id', inviteId)

  return NextResponse.json({ ok: true })
}
