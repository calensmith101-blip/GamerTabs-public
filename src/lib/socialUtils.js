import { supabase } from '../supabaseClient'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function normaliseCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim()
}
export function generateRoomCode(len = 6) {
  return Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
}

function uniqueCode() { return generateRoomCode(6) }

export async function ensureProfile(user) {
  if (!user?.id) return null
  const email = user.email || ''
  const username = user.user_metadata?.username || user.user_metadata?.display_name || email.split('@')[0] || 'Player'
  const payload = {
    id: user.id,
    email,
    username,
    display_name: user.user_metadata?.display_name || username,
    is_online: true,
    last_seen: new Date().toISOString(),
  }
  try {
    await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
  } catch (_) {}
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return data || payload
}

export async function setDiscovery(userId, enabled) {
  if (!userId) return
  const { error } = await supabase.from('profiles').update({
    local_discovery_enabled: !!enabled,
    is_online: true,
    last_seen: new Date().toISOString(),
  }).eq('id', userId)
  if (error) throw error
}

export async function searchPlayers({ userId, query = '', mode = 'search', country = '', state = '', suburb = '' }) {
  let q = supabase
    .from('profiles')
    .select('id,email,username,display_name,town,suburb,state,country,is_online,last_seen,local_discovery_enabled')
    .neq('id', userId)
    .limit(80)

  // Local means app-user discovery/search. Show all app users, with online/discoverable users first.
  // Do not hide everyone just because local discovery is off; filters still narrow by country/state/suburb.
  if (country.trim()) q = q.ilike('country', `%${country.trim()}%`)
  if (state.trim()) q = q.ilike('state', `%${state.trim()}%`)
  if (suburb.trim()) q = q.or(`town.ilike.%${suburb.trim()}%,suburb.ilike.%${suburb.trim()}%`)

  const search = query.trim()
  if (search) {
    const safe = search.replace(/[,()]/g, ' ')
    q = q.or(`username.ilike.%${safe}%,display_name.ilike.%${safe}%,email.ilike.%${safe}%,town.ilike.%${safe}%,suburb.ilike.%${safe}%,state.ilike.%${safe}%,country.ilike.%${safe}%`)
  }

  q = q.order('last_seen', { ascending: false, nullsFirst: false })
  const { data, error } = await q
  if (error) throw error
  const now = Date.now()
  return (data || []).sort((a, b) => {
    const aOnline = a.is_online && a.last_seen && (now - new Date(a.last_seen).getTime()) < 3 * 60 * 1000
    const bOnline = b.is_online && b.last_seen && (now - new Date(b.last_seen).getTime()) < 3 * 60 * 1000
    if (aOnline !== bOnline) return aOnline ? -1 : 1
    if (!!a.local_discovery_enabled !== !!b.local_discovery_enabled) return a.local_discovery_enabled ? -1 : 1
    return new Date(b.last_seen || 0).getTime() - new Date(a.last_seen || 0).getTime()
  })
}

export async function createUniversalRoom({ userId, name = 'GamerTab Room', isPublic = false }) {
  if (!userId) throw new Error('Sign in first')
  let roomCode = uniqueCode()
  for (let i = 0; i < 5; i += 1) {
    const { data, error } = await supabase.from('game_rooms').insert({
      room_code: roomCode,
      host_id: userId,
      player_x: userId,
      game_type: 'room',
      status: 'open',
      is_public: !!isPublic,
      state: { roomKind: 'universal', name, activeGameId: null, members: [userId], playerSeats: { X: userId }, playerSlots: [{ seat: 'X', userId, kind: 'human' }, { seat: 'O', userId: null, kind: 'open' }], createdAt: new Date().toISOString() },
    }).select().single()
    if (!error && data) {
      await upsertRoomMember(roomCode, userId, 'host')
      return data
    }
    if (!String(error?.message || '').toLowerCase().includes('duplicate')) throw error
    roomCode = uniqueCode()
  }
  throw new Error('Could not create unique room code')
}

export async function upsertRoomMember(roomCode, userId, role = 'member') {
  const code = normaliseCode(roomCode)
  if (!code || !userId) return null

  // IMPORTANT: do membership writes through an RPC first. Direct inserts/upserts
  // can be blocked by older/stricter RLS policies on room_members, which causes
  // the exact Supabase error: "new row violates row-level security policy".
  // The RPC is SECURITY DEFINER in the SQL patch and only writes auth.uid().
  try {
    const { data, error } = await supabase.rpc('upsert_room_member_safe', {
      p_room_code: code,
      p_role: role,
    })
    if (!error) return data
    console.warn('[upsertRoomMember] RPC failed, trying direct fallback:', error.message)
  } catch (err) {
    console.warn('[upsertRoomMember] RPC unavailable, trying direct fallback:', err?.message || err)
  }

  let roomId = null
  try {
    const { data: room } = await supabase
      .from('game_rooms')
      .select('id')
      .eq('room_code', code)
      .maybeSingle()
    roomId = room?.id || null
  } catch (_) {}

  const payload = {
    ...(roomId ? { room_id: roomId } : {}),
    room_code: code,
    user_id: userId,
    role,
    joined_at: new Date().toISOString(),
  }

  // Fallback only. Membership is helpful for private-room listing, but it must
  // never be allowed to break gameplay or joining.
  let res = await supabase
    .from('room_members')
    .upsert(payload, { onConflict: 'room_code,user_id' })
    .select()
    .maybeSingle()

  if (!res.error) return res.data

  console.warn('[upsertRoomMember] non-fatal membership write failed:', res.error.message)
  return null
}


function buildPlayerSeats(room, joiningUserId) {
  const previous = room?.state?.playerSeats && typeof room.state.playerSeats === 'object' ? room.state.playerSeats : {}
  const members = Array.isArray(room?.state?.members) ? room.state.members : []
  const ordered = []
  ;[room?.player_x, room?.player_o, ...members, joiningUserId].forEach(id => {
    if (id && !ordered.includes(id)) ordered.push(id)
  })
  const seats = { ...previous }
  const ids = ['X', 'O', 'P3', 'P4', 'P5', 'P6']
  ordered.forEach((id, index) => {
    const seat = ids[index]
    if (!seat) return
    if (!Object.values(seats).includes(id)) seats[seat] = id
  })
  return seats
}

export function buildDefaultSlotConfig(room, playerCount = 2) {
  const ids = ['X', 'O', 'P3', 'P4', 'P5', 'P6']
  const seats = room?.state?.playerSeats || {}
  const count = Math.max(2, Math.min(6, Number(playerCount) || Object.keys(seats).length || 2))
  return ids.slice(0, count).map((seat, index) => ({
    seat,
    userId: seats[seat] || null,
    kind: seats[seat] ? 'human' : (index >= 2 ? 'ai' : 'open'),
  }))
}

export async function joinUniversalRoom(roomCode, userId) {
  const code = normaliseCode(roomCode)
  if (!code) throw new Error('Enter a room code')
  const { data: room, error } = await supabase.from('game_rooms').select('*').eq('room_code', code).maybeSingle()
  if (error) throw error
  if (!room) throw new Error('Room not found')

  const isHost = room.host_id === userId || room.player_x === userId
  await upsertRoomMember(code, userId, isHost ? 'host' : 'member')

  const previousState = room.state && typeof room.state === 'object' ? room.state : {}
  const maxSeats = Math.max(2, Math.min(6, Number(previousState?.setup?.playerCount) || previousState?.playerSlots?.length || 2))
  const baseSlots = Array.isArray(previousState.playerSlots) && previousState.playerSlots.length
    ? previousState.playerSlots.slice(0, maxSeats).map((slot, index) => ({
        seat: slot.seat || ['X', 'O', 'P3', 'P4', 'P5', 'P6'][index],
        kind: slot.kind || (slot.userId ? 'human' : 'open'),
        userId: slot.userId || null,
        label: slot.label || null,
      }))
    : buildDefaultSlotConfig(room, maxSeats)

  const alreadySeat = baseSlots.find(slot => String(slot.userId) === String(userId))
  let nextSlots = baseSlots
  if (!alreadySeat) {
    const firstOpen = nextSlots.findIndex(slot => slot.kind === 'open' || (!slot.userId && slot.kind !== 'ai' && slot.kind !== 'local'))
    if (firstOpen === -1) throw new Error('No open online seat in this game. Ask the host to make a seat open.')
    nextSlots = nextSlots.map((slot, index) => index === firstOpen ? { ...slot, kind: 'human', userId } : slot)
  }

  const playerSeats = {}
  nextSlots.forEach(slot => {
    if (slot.userId) playerSeats[slot.seat] = slot.userId
  })

  const members = Array.isArray(previousState.members) ? previousState.members : []
  const nextMembers = members.includes(userId) ? members : [...members, userId]
  const patch = {
    status: room.status === 'expired' ? 'open' : room.status,
    state: {
      ...previousState,
      members: nextMembers,
      playerSeats,
      playerSlots: nextSlots,
    },
    updated_at: new Date().toISOString(),
  }

  if (!room.player_o) {
    const oSlot = nextSlots.find(slot => slot.seat === 'O' && String(slot.userId) === String(userId))
    if (oSlot) {
      patch.player_o = userId
      patch.player_o_name = userId
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('game_rooms')
    .update(patch)
    .eq('room_code', code)
    .select()
    .single()

  if (updateError) throw updateError
  return updated || room
}


export function playerRoleForRoom(room, userId) {
  if (!room || !userId) return 'spectator'
  const seats = room.state?.playerSeats || {}
  const found = Object.entries(seats).find(([, id]) => String(id) === String(userId))
  if (found) return found[0]
  if (String(room.player_x) === String(userId) || String(room.host_id) === String(userId)) return 'X'
  if (String(room.player_o) === String(userId)) return 'O'
  return 'spectator'
}

export async function loadUniversalRoom(roomCode) {
  const code = normaliseCode(roomCode)
  if (!code) return null
  const { data, error } = await supabase.from('game_rooms').select('*').eq('room_code', code).maybeSingle()
  if (error) throw error
  return data
}

export async function listUniversalRooms(userId) {
  const { data: publicRooms, error: pubErr } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('is_public', true)
    .in('status', ['open', 'waiting', 'ready', 'active'])
    .order('created_at', { ascending: false })
    .limit(50)
  if (pubErr) throw pubErr

  let privateRooms = []
  try {
    const { data: memberships } = await supabase.from('room_members').select('room_code').eq('user_id', userId)
    const codes = [...new Set((memberships || []).map(m => m.room_code).filter(Boolean))]
    if (codes.length) {
      const { data } = await supabase.from('game_rooms').select('*').in('room_code', codes).order('created_at', { ascending: false })
      privateRooms = data || []
    }
  } catch (_) {
    const { data } = await supabase.from('game_rooms').select('*').or(`host_id.eq.${userId},player_x.eq.${userId},player_o.eq.${userId}`).order('created_at', { ascending: false })
    privateRooms = data || []
  }

  const byCode = new Map()
  ;[...(privateRooms || []), ...(publicRooms || [])].forEach(r => byCode.set(r.room_code, r))
  return [...byCode.values()]
}

export async function deleteUniversalRoom(roomCode, userId) {
  const code = normaliseCode(roomCode)
  const { data: room } = await supabase.from('game_rooms').select('*').eq('room_code', code).maybeSingle()
  if (!room) throw new Error('Room not found')
  if (room.host_id !== userId && room.player_x !== userId) throw new Error('Only the host can delete this room')
  try {
    const { error } = await supabase.from('room_members').delete().eq('room_code', code)
    if (error) console.warn('[socialUtils] room member cleanup failed:', error.message)
  } catch (_) {}
  const { error } = await supabase.from('game_rooms').delete().eq('room_code', code)
  if (error) throw error
}

export async function leaveUniversalRoom(roomCode, userId) {
  const code = normaliseCode(roomCode)
  try {
    const { error } = await supabase.from('room_members').delete().eq('room_code', code).eq('user_id', userId)
    if (error) console.warn('[socialUtils] room member leave failed:', error.message)
  } catch (_) {}
  const { data: room } = await supabase.from('game_rooms').select('*').eq('room_code', code).maybeSingle()
  if (!room) return
  const members = (Array.isArray(room.state?.members) ? room.state.members : []).filter(id => id !== userId)
  if (room.host_id === userId || room.player_x === userId) {
    await deleteUniversalRoom(code, userId)
  } else {
    try { await supabase.from('game_rooms').update({ state: { ...(room.state || {}), members }, updated_at: new Date().toISOString() }).eq('room_code', code) } catch (_) {}
  }
}


export async function updateRoomSlots(roomCode, slots) {
  const code = normaliseCode(roomCode)
  const { data: room, error: loadError } = await supabase.from('game_rooms').select('*').eq('room_code', code).maybeSingle()
  if (loadError) throw loadError
  if (!room) throw new Error('Room not found')
  const playerSeats = {}
  ;(slots || []).forEach(slot => {
    if (slot?.kind === 'human' && slot.userId) playerSeats[slot.seat] = slot.userId
  })
  const { data, error } = await supabase.from('game_rooms').update({
    state: { ...(room.state || {}), playerSlots: slots, playerSeats },
    updated_at: new Date().toISOString(),
  }).eq('room_code', code).select().single()
  if (error) throw error
  return data
}

export async function setRoomGame(roomCode, gameId) {
  const code = normaliseCode(roomCode)
  const { data: room, error: loadError } = await supabase.from('game_rooms').select('*').eq('room_code', code).maybeSingle()
  if (loadError) throw loadError
  if (!room) throw new Error('Room not found')
  const { data, error } = await supabase.from('game_rooms').update({
    game_type: gameId,
    state: { ...(room.state || {}), activeGameId: gameId },
    status: 'active',
    updated_at: new Date().toISOString(),
  }).eq('room_code', code).select().single()
  if (error) throw error
  return data
}


async function tryQuery(builders) {
  let lastError = null
  for (const build of builders) {
    const result = await build()
    if (!result.error) return result
    lastError = result.error
    const msg = String(result.error.message || '').toLowerCase()
    if (!(msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('column') || msg.includes('constraint') || msg.includes('unique'))) break
  }
  return { data: null, error: lastError }
}

export async function sendFriendRequest(fromUserId, toUserId) {
  if (!fromUserId || !toUserId) return null
  const { data, error } = await tryQuery([
    () => supabase.from('friend_requests').upsert({ sender_id: fromUserId, receiver_id: toUserId, status: 'pending' }, { onConflict: 'sender_id,receiver_id' }).select().maybeSingle(),
    () => supabase.from('friend_requests').insert({ sender_id: fromUserId, receiver_id: toUserId, status: 'pending' }).select().maybeSingle(),
    () => supabase.from('friends').upsert({ user_id: fromUserId, friend_id: toUserId }, { onConflict: 'user_id,friend_id' }).select().maybeSingle(),
  ])
  if (error) throw error
  return data
}

export async function blockUser(blockerId, blockedId) {
  if (!blockerId || !blockedId) return null
  const { data, error } = await tryQuery([
    () => supabase.from('blocked_users').upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' }).select().maybeSingle(),
    () => supabase.from('user_blocks').upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' }).select().maybeSingle(),
  ])
  if (error) throw error
  return data
}

export async function listMessages(userId, roomCode = null, otherUserId = null) {
  const code = roomCode ? normaliseCode(roomCode) : null
  const builders = []
  if (code) {
    builders.push(
      async () => {
        const { data, error } = await supabase.from('messages').select('*').eq('room_code', code).order('created_at', { ascending: true }).limit(150)
        return { data: (data || []).map(m => ({ ...m, body: m.body ?? m.message, sender_id: m.sender_id ?? m.user_id })), error }
      },
      async () => {
        const { data, error } = await supabase.from('chat_messages').select('*').eq('room_code', code).order('created_at', { ascending: true }).limit(150)
        return { data: (data || []).map(m => ({ ...m, body: m.message ?? m.body, sender_id: m.user_id ?? m.sender_id })), error }
      },
    )
  } else if (otherUserId) {
    builders.push(
      async () => {
        const { data, error } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`).order('created_at', { ascending: true }).limit(150)
        return { data: (data || []).map(m => ({ ...m, body: m.body ?? m.message, sender_id: m.sender_id ?? m.user_id })), error }
      },
      async () => {
        const { data, error } = await supabase.from('direct_messages').select('*').or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`).order('created_at', { ascending: true }).limit(150)
        return { data: (data || []).map(m => ({ ...m, body: m.body ?? m.message, sender_id: m.sender_id ?? m.user_id })), error }
      },
    )
  } else {
    builders.push(
      async () => {
        const { data, error } = await supabase.from('messages').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: true }).limit(150)
        return { data: (data || []).map(m => ({ ...m, body: m.body ?? m.message, sender_id: m.sender_id ?? m.user_id })), error }
      },
      async () => {
        const { data, error } = await supabase.from('direct_messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: true }).limit(150)
        return { data: (data || []).map(m => ({ ...m, body: m.body ?? m.message, sender_id: m.sender_id ?? m.user_id })), error }
      },
    )
  }
  const { data, error } = await tryQuery(builders)
  if (error) throw error
  return data || []
}

export async function sendMessage({ senderId, recipientId = null, roomCode = null, body }) {
  const text = String(body || '').trim()
  if (!text) return null
  const code = roomCode ? normaliseCode(roomCode) : null
  const builders = code ? [
    () => supabase.from('messages').insert({ sender_id: senderId, recipient_id: null, room_code: code, body: text }).select().maybeSingle(),
    () => supabase.from('chat_messages').insert({ room_code: code, user_id: senderId, message: text }).select().maybeSingle(),
  ] : [
    () => supabase.from('messages').insert({ sender_id: senderId, recipient_id: recipientId, body: text }).select().maybeSingle(),
    () => supabase.from('direct_messages').insert({ sender_id: senderId, receiver_id: recipientId, body: text }).select().maybeSingle(),
  ]
  const { data, error } = await tryQuery(builders)
  if (error) throw error
  return data
}


export async function listFriendRequests(userId) {
  if (!userId) return { incoming: [], outgoing: [] }
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = data || []
  return {
    incoming: rows.filter(r => r.receiver_id === userId && r.status !== 'accepted'),
    outgoing: rows.filter(r => r.sender_id === userId && r.status !== 'accepted'),
  }
}

export async function respondFriendRequest(request, userId, accept = true) {
  if (!request?.id || !userId) return null
  if (String(request.receiver_id) !== String(userId)) throw new Error('Only the receiver can respond to this request')

  const now = new Date().toISOString()
  const nextStatus = accept ? 'accepted' : 'declined'

  const { data: updated, error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: nextStatus, updated_at: now })
    .eq('id', request.id)
    .eq('receiver_id', userId)
    .select()
    .maybeSingle()

  if (updateError) throw updateError
  if (!updated) throw new Error('Request was not updated. Check friend_requests RLS policies.')
  if (!accept) return { status: 'declined' }

  const first = await tryQuery([
    () => supabase.from('friends').upsert({ user_id: request.sender_id, friend_id: request.receiver_id, created_at: now }, { onConflict: 'user_id,friend_id' }).select().maybeSingle(),
    () => supabase.from('friends').insert({ user_id: request.sender_id, friend_id: request.receiver_id, created_at: now }).select().maybeSingle(),
  ])
  const second = await tryQuery([
    () => supabase.from('friends').upsert({ user_id: request.receiver_id, friend_id: request.sender_id, created_at: now }, { onConflict: 'user_id,friend_id' }).select().maybeSingle(),
    () => supabase.from('friends').insert({ user_id: request.receiver_id, friend_id: request.sender_id, created_at: now }).select().maybeSingle(),
  ])

  // If the friends table is more locked down than requests, do not make the UI
  // look frozen. The request is accepted, and the SQL patch below fixes the
  // reciprocal friends rows permanently.
  if (first.error || second.error) {
    console.warn('[respondFriendRequest] accepted request but friends insert was blocked:', first.error?.message || second.error?.message)
  }
  return { status: 'accepted' }
}


export async function getProfilesByIds(ids = []) {
  const clean = [...new Set((ids || []).filter(Boolean))]
  if (!clean.length) return {}
  const { data, error } = await supabase.from('profiles').select('id,username,display_name,email,suburb,town,state,country,is_online,last_seen').in('id', clean)
  if (error) return {}
  return Object.fromEntries((data || []).map(p => [p.id, p]))
}


export async function listFriends(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('friends')
    .select('friend_id,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  const ids = [...new Set((data || []).map(row => row.friend_id).filter(Boolean))]
  if (!ids.length) return []
  const profiles = await getProfilesByIds(ids)
  return ids.map(id => ({ ...(profiles[id] || { id, username: id }), friendship_created_at: (data || []).find(row => row.friend_id === id)?.created_at }))
}

export async function listActiveLiveGames(userId, gameId = null) {
  if (!userId) return []
  const statuses = ['waiting', 'ready', 'open', 'active', 'paused']
  const byRoom = new Map()

  async function addRows(rows = []) {
    ;(rows || []).forEach(row => {
      if (!row?.room_code) return
      byRoom.set(row.room_code, row)
    })
  }

  try {
    let q = supabase
      .from('game_rooms')
      .select('*')
      .or(`host_id.eq.${userId},player_x.eq.${userId},player_o.eq.${userId}`)
      .in('status', statuses)
      .order('updated_at', { ascending: false })
      .limit(50)
    if (gameId) q = q.eq('game_type', gameId)
    const { data } = await q
    await addRows(data)
  } catch (_) {}

  try {
    const { data: memberships } = await supabase
      .from('room_members')
      .select('room_code')
      .eq('user_id', userId)
      .limit(80)
    const codes = [...new Set((memberships || []).map(m => normaliseCode(m.room_code)).filter(Boolean))]
    if (codes.length) {
      let q = supabase.from('game_rooms').select('*').in('room_code', codes).in('status', statuses).order('updated_at', { ascending: false }).limit(80)
      if (gameId) q = q.eq('game_type', gameId)
      const { data } = await q
      await addRows(data)
    }
  } catch (_) {}

  return [...byRoom.values()].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
}
