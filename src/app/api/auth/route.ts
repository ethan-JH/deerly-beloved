import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json() as { passcode: string }

  if (body.passcode !== process.env.SITE_PASSCODE) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('site-auth', body.passcode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return response
}
