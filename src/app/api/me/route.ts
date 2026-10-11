import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const inviteId = request.cookies.get('guest_session')?.value
  if (!inviteId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const db = getSupabaseAdmin()

  const { data: invite, error: inviteError } = await db
    .from('invites')
    .select('id, display_name, email, room_counts, room_accepted, friday_invited')
    .eq('id', inviteId)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 401 })
  }

  const { data: guests } = await db
    .from('guests')
    .select('id, first_name, last_name, rsvp_submitted_at, attending_saturday, attending_friday, dietary, song_request, message')
    .eq('invite_id', inviteId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ ...invite, guests: guests ?? [] })
}
