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

  const inviteId = request.cookies.get('guest_session')?.value

  // The whole board, not a top five. Guests want to find themselves on it and
  // see who they're behind, and with roughly 130 invites the full list is small
  // enough to send in one go. invite_id is selected only to mark the player's
  // own row and is stripped before the response.
  const { data: allScores } = await db
    .from('breakout_scores')
    .select('invite_id, display_name, score, time_seconds')
    .order('score', { ascending: false })
    .order('achieved_at', { ascending: true })

  const top = (allScores ?? []).map(row => {
    const r = row as { invite_id: string; display_name: string; score: number; time_seconds: number | null }
    return {
      display_name: r.display_name,
      score: r.score,
      time_seconds: r.time_seconds,
      is_me: !!inviteId && r.invite_id === inviteId,
    }
  })

  // Rank and total both come off the list we already have, rather than three
  // more round trips. Taking the rank from the row's position also guarantees
  // the "YOUR RANK" line agrees with the number printed beside that row, which
  // separate counting queries wouldn't on a tie.
  const meIndex = top.findIndex(e => e.is_me)
  const myRank = meIndex === -1 ? null : meIndex + 1
  const myScore = meIndex === -1 ? null : top[meIndex].score
  const totalPlayers = top.length

  return NextResponse.json({ top, myRank, myScore, totalPlayers })
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
