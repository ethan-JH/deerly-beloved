import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value
  return !!process.env.ADMIN_PASSWORD && session === process.env.ADMIN_PASSWORD
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as Record<string, unknown>

  const db = getSupabaseAdmin()
  const { error } = await db.from('invites').update(body).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()

  // Delete child rows first — FKs have no ON DELETE CASCADE
  const { error: scoreError } = await db.from('breakout_scores').delete().eq('invite_id', id)
  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 })

  const { error: guestError } = await db.from('guests').delete().eq('invite_id', id)
  if (guestError) return NextResponse.json({ error: guestError.message }, { status: 500 })

  const { error } = await db.from('invites').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
