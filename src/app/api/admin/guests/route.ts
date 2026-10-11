import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value
  return !!process.env.ADMIN_PASSWORD && session === process.env.ADMIN_PASSWORD
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { invite_id: string; first_name: string; last_name: string }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('guests')
    .insert({ invite_id: body.invite_id, first_name: body.first_name.trim(), last_name: body.last_name.trim() })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: (data as { id: string }).id })
}
