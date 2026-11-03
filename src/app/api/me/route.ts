import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getRoomShareName } from '@/lib/room-share'

export async function GET(request: NextRequest) {
  const inviteId = request.cookies.get('guest_session')?.value
  if (!inviteId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const db = getSupabaseAdmin()

  const { data: invite, error: inviteError } = await db
    .from('invites')
    .select('id, display_name, email, room_counts, room_accepted, friday_invited, room_share_id')
    .eq('id', inviteId)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 401 })
  }

  // Whoever this invite is sharing a room with. Only their display name is
  // resolved and sent — never their id or passcode.
  const room_share_with = await getRoomShareName(db, invite.room_share_id, inviteId)

  const { data: guests } = await db
    .from('guests')
    .select('id, first_name, last_name, rsvp_submitted_at, attending_saturday, attending_friday, attending_sunday, dietary, song_request, message')
    .eq('invite_id', inviteId)
    .order('created_at', { ascending: true })

  const { data: config } = await db
    .from('app_config')
    .select('key, value')
    .in('key', ['sunday_venue_short', 'sunday_venue_address'])

  const configMap = Object.fromEntries((config ?? []).map(c => [c.key, c.value]))

  return NextResponse.json({
    ...invite,
    room_share_with,
    guests: guests ?? [],
    sunday_venue_short: configMap.sunday_venue_short ?? null,
    sunday_venue_address: configMap.sunday_venue_address ?? null,
  })
}
