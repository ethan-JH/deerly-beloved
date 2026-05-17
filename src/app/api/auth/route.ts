import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { passcode?: string }
  const passcode = body.passcode?.trim()

  if (!passcode) {
    return NextResponse.json({ error: 'Passcode required' }, { status: 400 })
  }

  const { data: guest, error } = await getSupabaseAdmin()
    .from('guests')
    .select('id')
    .eq('password', passcode)
    .single()

  if (error || !guest) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
  }

  const guestId = (guest as { id: string }).id

  const response = NextResponse.json({ success: true })
  response.cookies.set('guest_session', guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
