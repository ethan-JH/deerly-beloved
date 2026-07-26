import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type ScoreRow = {
  invite_id: string
  display_name: string
  score: number
  time_seconds: number | null
  achieved_at: string
}

async function getRank(inviteId: string, score: number): Promise<{ rank: number; totalPlayers: number }> {
  const db = getSupabaseAdmin()
  const { count: totalPlayers } = await db
    .from('breakout_scores')
    .select('*', { count: 'exact', head: true })
  const { count: above } = await db
    .from('breakout_scores')
    .select('*', { count: 'exact', head: true })
    .neq('invite_id', inviteId)
    .gt('score', score)
  return {
    rank: (above ?? 0) + 1,
    totalPlayers: totalPlayers ?? 0,
  }
}

export async function GET(request: NextRequest) {
  const db = getSupabaseAdmin()

  const { data: top } = await db
    .from('breakout_scores')
    .select('display_name, score, time_seconds')
    .order('score', { ascending: false })
    .order('achieved_at', { ascending: true })
    .limit(5)

  const { count: totalPlayers } = await db
    .from('breakout_scores')
    .select('*', { count: 'exact', head: true })

  const inviteId = request.cookies.get('guest_session')?.value
  let myRank: number | null = null
  let myScore: number | null = null

  if (inviteId) {
    const { data: myRow } = await db
      .from('breakout_scores')
      .select('score')
      .eq('invite_id', inviteId)
      .single()

    if (myRow) {
      myScore = (myRow as { score: number }).score
      const { count: above } = await db
        .from('breakout_scores')
        .select('*', { count: 'exact', head: true })
        .gt('score', myScore)
      myRank = (above ?? 0) + 1
    }
  }

  return NextResponse.json({
    top: top ?? [],
    myRank,
    myScore,
    totalPlayers: totalPlayers ?? 0,
  })
}

export async function POST(request: NextRequest) {
  const inviteId = request.cookies.get('guest_session')?.value
  if (!inviteId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const db = getSupabaseAdmin()

  const { data: invite, error: inviteError } = await db
    .from('invites')
    .select('display_name')
    .eq('id', inviteId)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 401 })
  }

  const { display_name } = invite as { display_name: string }

  const body = await request.json() as { score: number; time_seconds?: number }
  const { score, time_seconds } = body

  const { data: existing } = await db
    .from('breakout_scores')
    .select('score')
    .eq('invite_id', inviteId)
    .single()

  const existingScore = existing ? (existing as { score: number }).score : null
  const isNewHiScore = existingScore === null || score > existingScore

  if (isNewHiScore) {
    await db.from('breakout_scores').upsert({
      invite_id: inviteId,
      display_name,
      score,
      time_seconds: time_seconds ?? null,
      achieved_at: new Date().toISOString(),
    } as ScoreRow)
  }

  const bestScore = isNewHiScore ? score : (existingScore ?? score)
  const { rank, totalPlayers } = await getRank(inviteId, bestScore)

  return NextResponse.json({ isNewHiScore, rank, totalPlayers })
}
