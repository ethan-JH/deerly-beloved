import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const body = await request.json() as { passcode?: string }
  const passcode = body.passcode?.trim()

  if (!passcode) {
    return NextResponse.json({ error: 'Passcode required' }, { status: 400 })
  }

  const { data: invite, error } = await getSupabaseAdmin()
    .from('invites')
    .select('id')
    .eq('password', passcode)
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
  }

  const inviteId = (invite as { id: string }).id

  const response = NextResponse.json({ success: true })
  response.cookies.set('guest_session', inviteId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
