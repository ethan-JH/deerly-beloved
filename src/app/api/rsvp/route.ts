import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { buildRsvpEmail, buildAdminRsvpEmail, CONTACT_EMAIL } from '@/lib/rsvp-email'
import { getRoomShareName } from '@/lib/room-share'

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
    .select('display_name, email, room_counts, room_accepted, room_share_id')
    .single()

  // The RSVP itself is already saved by this point. Both emails below are
  // best-effort: neither may fail the submission, but neither may fail silently
  // either. Only the guest confirmation is reported back to the browser, since
  // that's the one the form tells the guest about.
  let emailed = false
  let emailError: string | null = null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get('origin') ?? 'https://bechanandethan.wedding'

  if (!process.env.RESEND_API_KEY) {
    emailError = 'RESEND_API_KEY is not set'
    console.error('[rsvp] emails skipped:', emailError)
  } else {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = 'Bechan & Ethan <partytime@bechanandethan.wedding>'

    const { data: guests } = await db
      .from('guests')
      .select('first_name, last_name, attending_saturday, attending_friday, attending_sunday, dietary')
      .eq('invite_id', inviteId)
      .order('created_at', { ascending: true })

    const shared = {
      displayName: invite?.display_name ?? 'Guest',
      isUpdate,
      guests: guests ?? [],
      roomCounts: invite?.room_counts ?? {},
      roomAccepted: invite?.room_accepted ?? {},
      roomShareWith: await getRoomShareName(db, invite?.room_share_id, inviteId),
    }

    // 1. Confirmation to the guest, if they gave us an address.
    if (!invite?.email) {
      emailError = 'no email on invite'
    } else {
      try {
        const { subject, html, text } = buildRsvpEmail({ ...shared, siteUrl })
        const { error } = await resend.emails.send({
          from, to: invite.email, replyTo: CONTACT_EMAIL, subject, html, text,
        })
        if (error) {
          emailError = error.message
          console.error('[rsvp] resend rejected the guest confirmation:', error)
        } else {
          emailed = true
        }
      } catch (e) {
        emailError = e instanceof Error ? e.message : 'unknown error'
        console.error('[rsvp] guest confirmation threw:', e)
      }
    }

    // 2. Alert to us. Sent regardless of whether the guest left an address —
    // an RSVP from someone we can't reply to is exactly the one worth knowing
    // about. Failures are logged only; they're nothing to do with the guest.
    try {
      const { subject, html, text } = buildAdminRsvpEmail({
        ...shared,
        guestEmail: invite?.email ?? null,
        adminUrl: `${siteUrl}/admin`,
      })
      const { error } = await resend.emails.send({
        from,
        to: CONTACT_EMAIL,
        replyTo: invite?.email ?? CONTACT_EMAIL,
        subject, html, text,
      })
      if (error) console.error('[rsvp] resend rejected the admin alert:', error)
    } catch (e) {
      console.error('[rsvp] admin alert threw:', e)
    }
  }

  return NextResponse.json({ ok: true, emailed, emailError })
}
