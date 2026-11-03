import { getSupabaseAdmin } from '@/lib/supabase-admin'

type Db = ReturnType<typeof getSupabaseAdmin>

/**
 * The display name of the invite this one is sharing a room with, or null.
 *
 * Invites sharing a room_share_id describe one physical room between them, so
 * both carry the same room_counts and each answers its yes/no separately.
 *
 * Only the partner's display name is ever returned. Their id and passcode must
 * not reach the guest, who is a different household with their own login.
 */
export async function getRoomShareName(
  db: Db,
  roomShareId: string | null | undefined,
  selfInviteId: string,
): Promise<string | null> {
  if (!roomShareId) return null

  const { data } = await db
    .from('invites')
    .select('display_name')
    .eq('room_share_id', roomShareId)
    .neq('id', selfInviteId)
    .limit(1)
    .maybeSingle()

  return (data as { display_name: string } | null)?.display_name ?? null
}
