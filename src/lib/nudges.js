// GamerTab: Black Vault — Nudge System
// Invite/alert other app users to play via Supabase `nudges` table.
// No Firebase dependency yet — pure Supabase realtime.

/**
 * Send a nudge to ALL app users (broadcast invite).
 * to_user_id is null for broadcast.
 */
export async function sendNudgeToAllUsers(supabase, fromUserId, gameId, roomCode, message = '') {
  const { data, error } = await supabase.from('nudges').insert({
    from_user_id: fromUserId,
    to_user_id:   null,
    game_id:      gameId,
    room_code:    roomCode,
    message:      message || `Come play ${gameId}! Room: ${roomCode}`,
    status:       'unread',
  }).select().single()

  if (error) throw error
  return data
}

/**
 * Send a nudge to a specific user.
 */
export async function sendNudgeToUser(supabase, fromUserId, toUserId, gameId, roomCode, message = '') {
  const { data, error } = await supabase.from('nudges').insert({
    from_user_id: fromUserId,
    to_user_id:   toUserId,
    game_id:      gameId,
    room_code:    roomCode,
    message:      message || `You've been invited to play ${gameId}! Room: ${roomCode}`,
    status:       'unread',
  }).select().single()

  if (error) throw error
  return data
}

/**
 * Mark a nudge as read.
 */
export async function markNudgeRead(supabase, nudgeId) {
  const { data, error } = await supabase
    .from('nudges')
    .update({ status: 'read' })
    .eq('id', nudgeId)
    .select().single()

  if (error) throw error
  return data
}

/**
 * Accept a nudge (player is joining the room).
 */
export async function acceptNudge(supabase, nudgeId) {
  const { data, error } = await supabase
    .from('nudges')
    .update({ status: 'accepted' })
    .eq('id', nudgeId)
    .select().single()

  if (error) throw error
  return data
}

/**
 * Decline a nudge.
 */
export async function declineNudge(supabase, nudgeId) {
  const { data, error } = await supabase
    .from('nudges')
    .update({ status: 'declined' })
    .eq('id', nudgeId)
    .select().single()

  if (error) throw error
  return data
}

/**
 * Fetch pending nudges for a user (direct + broadcast).
 */
export async function fetchPendingNudges(supabase, userId) {
  const { data, error } = await supabase
    .from('nudges')
    .select('*')
    .or(`to_user_id.eq.${userId},to_user_id.is.null`)
    .neq('from_user_id', userId)   // don't show your own nudges
    .in('status', ['unread', 'read'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return data || []
}

/**
 * Subscribe to incoming nudges for a user via Supabase realtime.
 * @param {Object}   supabase
 * @param {string}   userId
 * @param {Function} onNudge - called with new nudge row
 * @returns {Function} unsubscribe function
 */
export function subscribeToNudges(supabase, userId, onNudge) {
  const channel = supabase
    .channel(`nudges-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'nudges' },
      (payload) => {
        const n = payload.new
        // Accept if broadcast or directed at this user, and not from self
        if (n.from_user_id !== userId && (n.to_user_id === null || n.to_user_id === userId) && ['unread','read'].includes(n.status || 'unread')) {
          onNudge(n)
        }
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
