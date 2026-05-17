import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type GuestRow = {
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

export async function GET(request: NextRequest) {
  const guestId = request.cookies.get('guest_session')?.value
  if (!guestId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('guests')
    .select('id, first_name, last_name, has_deer_park_room, friday_invited, plus_one_allowed, rsvp_submitted_at, attending_saturday, attending_friday')
    .eq('id', guestId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 401 })
  }

  return NextResponse.json(data as GuestRow)
}
