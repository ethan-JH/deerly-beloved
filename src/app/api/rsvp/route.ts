import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { buildRsvpEmail } from '@/lib/rsvp-email'

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

  // Was there any RSVP data before this submission? Determines confirmation vs. update email.
  const { data: beforeGuests } = await db
    .from('guests')
    .select('attending_saturday, attending_friday, attending_sunday')
    .eq('invite_id', inviteId)
  const isUpdate = (beforeGuests ?? []).some(
    g => g.attending_saturday !== null || g.attending_friday !== null || g.attending_sunday !== null
  )

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

  const { data: invite } = await db
    .from('invites')
    .update({
      email: body.email ?? null,
      room_accepted: body.room_accepted ?? {},
    })
    .eq('id', inviteId)
    .select('display_name, email, room_counts, room_accepted')
    .single()

  if (invite?.email) {
    const { data: guests } = await db
      .from('guests')
      .select('first_name, last_name, attending_saturday, attending_friday, attending_sunday, dietary')
      .eq('invite_id', inviteId)
      .order('created_at', { ascending: true })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get('origin') ?? 'https://bechanandethan.wedding'
    const { subject, html, text } = buildRsvpEmail({
      displayName: invite.display_name,
      isUpdate,
      guests: guests ?? [],
      roomCounts: invite.room_counts ?? {},
      roomAccepted: invite.room_accepted ?? {},
      siteUrl,
    })

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Bechan & Ethan <donotreply@bechanandethan.wedding>',
      to: invite.email,
      replyTo: 'eharbinson966@gmail.com',
      subject,
      html,
      text,
    })
  }

  return NextResponse.json({ ok: true })
}
