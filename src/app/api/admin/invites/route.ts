import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value
  return !!process.env.ADMIN_PASSWORD && session === process.env.ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('invites')
    .select('*, guests(*)')
    .order('display_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invites: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    display_name: string
    password: string
    email?: string | null
    phone?: string | null
    address?: string | null
    notes?: string | null
    room_counts: Record<string, number>
    friday_invited: boolean
    guests: { first_name: string; last_name: string }[]
  }

  const db = getSupabaseAdmin()

  const { data: invite, error: inviteError } = await db
    .from('invites')
    .insert({
      display_name: body.display_name,
      password: body.password,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      notes: body.notes ?? null,
      room_counts: body.room_counts ?? {},
      friday_invited: body.friday_invited,
    })
    .select('id')
    .single()

  if (inviteError || !invite) return NextResponse.json({ error: inviteError?.message }, { status: 500 })

  const inviteId = (invite as { id: string }).id

  if (body.guests?.length > 0) {
    const guestRows = body.guests
      .filter(g => g.first_name.trim())
      .map(g => ({ invite_id: inviteId, first_name: g.first_name.trim(), last_name: g.last_name.trim() }))

    if (guestRows.length > 0) {
      await db.from('guests').insert(guestRows)
    }
  }

  return NextResponse.json({ id: inviteId })
}
