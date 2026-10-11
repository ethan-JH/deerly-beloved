import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value
  return !!process.env.ADMIN_PASSWORD && session === process.env.ADMIN_PASSWORD
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()

  const { error } = await db
    .from('guests')
    .update({
      rsvp_submitted_at: null,
      attending_saturday: null,
      attending_friday: null,
      dietary: null,
      song_request: null,
      message: null,
    })
    .eq('invite_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
