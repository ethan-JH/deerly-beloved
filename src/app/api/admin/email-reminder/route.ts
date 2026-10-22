import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

function isAdmin(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value
  return !!process.env.ADMIN_PASSWORD && session === process.env.ADMIN_PASSWORD
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invite_id } = await request.json() as { invite_id: string }

  const db = getSupabaseAdmin()
  const { data: invite, error } = await db
    .from('invites')
    .select('display_name, email, password')
    .eq('id', invite_id)
    .single()

  if (error || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

  const { display_name, email, password } = invite as { display_name: string; email: string | null; password: string }

  if (!email) return NextResponse.json({ error: 'No email on this invite' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get('origin') ?? 'https://deerly-beloved.vercel.app'
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error: sendError } = await resend.emails.send({
    from: 'Bechan & Ethan <partytime@bechanandethan.wedding>',
    replyTo: 'eharbinson966@gmail.com',
    to: email,
    subject: "Don't forget to RSVP — Bechan & Ethan, 12 June 2027",
    text: [
      `Hi ${display_name},`,
      '',
      "We'd love to know if you can make it to our wedding on 12 June 2027 at Deer Park Country House, Devon.",
      '',
      'Please RSVP at:',
      siteUrl,
      '',
      `Your invite password: ${password}`,
      '',
      "Can't wait to celebrate with you,",
      'Bechan & Ethan',
    ].join('\n'),
  })

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
