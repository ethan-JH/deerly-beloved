import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  await getSupabaseAdmin()
    .from('guests')
    .select('id', { count: 'exact', head: true })

  return NextResponse.json({ ok: true })
}
