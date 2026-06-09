/**
 * GamerTab: Black Vault — Room Utilities
 * Drop-in replacement. Adjust the supabase import path if needed.
 */
import { supabase } from '../supabaseClient';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_OPEN_ROOMS_PER_HOST = 3;


export function generateRoomCode(len = 6) {
  return Array.from({ length: len }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

export function normaliseCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}


export async function cleanupStaleRooms(userId = null) {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  try {
    let q1 = supabase
      .from('game_rooms')
      .update({ status: 'expired', is_public: false })
      .in('status', ['waiting', 'ready', 'open'])
      .lt('created_at', dayAgo);
    if (userId) q1 = q1.eq('host_id', userId);
    await q1;
  } catch (_) {}

  try {
    let q2 = supabase
      .from('game_rooms')
      .update({ status: 'paused', is_public: false })
      .eq('status', 'active')
      .lt('updated_at', twoWeeksAgo);
    if (userId) q2 = q2.eq('host_id', userId);
    await q2;
  } catch (_) {}
}

export async function closeMyOpenRooms(userId) {
  if (!userId) return 0;

  // Prefer SECURITY DEFINER RPC so hidden old rooms cannot block new invites
  // because of strict RLS. Direct update remains as a fallback.
  try {
    const { data, error } = await supabase.rpc('close_my_open_rooms_safe');
    if (!error) return Number(data || 0);
    console.warn('[closeMyOpenRooms] RPC failed, trying direct fallback:', error.message);
  } catch (rpcErr) {
    console.warn('[closeMyOpenRooms] RPC unavailable, trying direct fallback:', rpcErr?.message || rpcErr);
  }

  try {
    const { data, error } = await supabase
      .from('game_rooms')
      .update({ status: 'expired', is_public: false, updated_at: new Date().toISOString() })
      .eq('host_id', userId)
      .in('status', ['waiting', 'ready', 'open'])
      .select('id');
    if (error) throw error;
    return (data || []).length;
  } catch (err) {
    console.warn('[closeMyOpenRooms] Could not auto-close old rooms:', err?.message || err);
    return 0;
  }
}

export async function createRoom({ userId, username, gameType, isPublic = true, initialState = {} }) {
  if (!userId) throw new Error('userId required');
  await cleanupStaleRooms(userId);
  const { count } = await supabase
    .from('game_rooms')
    .select('*', { count: 'exact', head: true })
    .eq('host_id', userId)
    .in('status', ['waiting', 'ready', 'open']);
  if ((count || 0) >= MAX_OPEN_ROOMS_PER_HOST) {
    // The Rooms page is no longer the required play gate, so do not trap the
    // user behind invisible old rooms. Close the host's stale/open lobby shells
    // and try again before throwing. This preserves finished/active history.
    await closeMyOpenRooms(userId);
    const { count: recount } = await supabase
      .from('game_rooms')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', userId)
      .in('status', ['waiting', 'ready', 'open']);
    if ((recount || 0) >= MAX_OPEN_ROOMS_PER_HOST) {
      throw new Error('You already have 3 open games. I tried to auto-close old lobbies but Supabase blocked it. Use Clear Old Live Games, then try again.');
    }
  }
  let attempts = 0;
  while (attempts < 4) {
    const roomCode = generateRoomCode();
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        room_code:     roomCode,
        host_id:       userId,
        player_x:      userId,
        player_x_name: username || userId,
        player_o:      null,
        player_o_name: null,
        game_type:     gameType || 'unknown',
        status:        'waiting',
        is_public:     isPublic,
        state:         initialState,
      })
      .select()
      .single();
    if (!error && data) return Array.isArray(data) ? data[0] : data;
    const message = error.message || '';
    if (message.toLowerCase().includes('duplicate') || error.code === '23505') {
      attempts += 1;
      continue;
    }
    throw new Error(message || 'Could not create room');
  }
  throw new Error('Could not generate a unique room code. Please try again.');
}

export async function joinRoom(roomCode, userId, username) {
  const code = normaliseCode(roomCode);
  if (!code) throw new Error('Room code required.');

  // Prefer RPC when available (atomic join). If RPC is missing or fails, fall back
  // to a safe update: load room, ensure not full, and set player_o.
  try {
    const { data, error } = await supabase.rpc('join_game_room', {
      p_room_code: code,
      p_user_id:   userId,
      p_username:  username || userId,
    });
    if (!error && data) return Array.isArray(data) ? data[0] : data;
    console.warn('[joinRoom] rpc error, falling back:', error.message || error);
  } catch (rpcErr) {
    console.warn('[joinRoom] rpc call failed, falling back:', rpcErr?.message || rpcErr);
  }

  const room = await loadRoom(code);
  if (!room) throw new Error('Room not found. Check the code.');
  if (room.player_x === userId || room.player_o === userId) return room;
  if (room.player_o) throw new Error('Room is full.');

  const { data, error } = await supabase
    .from('game_rooms')
    .update({ player_o: userId, player_o_name: username || userId, status: 'ready' })
    .eq('room_code', code)
    .is('player_o', null)
    .select()
    .single();
  if (error || !data) throw new Error(error.message || 'Room is full or no longer available.');
  return data;
}

export async function loadRoom(roomCode) {
  if (!roomCode) return null;
  const { data, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', normaliseCode(roomCode))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listOpenRooms(gameType = null) {
  await cleanupStaleRooms();
  let q = supabase
    .from('game_rooms')
    .select('*')
    .in('status', ['waiting', 'ready', 'open'])
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(25);
  if (gameType) q = q.eq('game_type', gameType);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateRoomState(roomCode, newState, extra = {}) {
  const code = normaliseCode(roomCode);
  const current = await loadRoom(code).catch(() => null);
  const currentState = current?.state && typeof current.state === 'object' ? current.state : {};
  const nextGameState = newState && typeof newState === 'object' ? newState : {};

  // IMPORTANT: game updates must not wipe room metadata. Several games write a
  // whole game state object, while the room also stores members/seats/slots.
  // Merging here keeps online users connected while moves sync live.
  const mergedState = {
    ...currentState,
    ...nextGameState,
    roomKind: currentState.roomKind,
    activeGameId: currentState.activeGameId || current?.game_type,
    members: currentState.members,
    playerSeats: currentState.playerSeats,
    playerSlots: currentState.playerSlots,
    setup: currentState.setup,
    _gameUpdatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('game_rooms')
    .update({ state: mergedState, updated_at: new Date().toISOString(), ...extra })
    .eq('room_code', code)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRoomStatus(roomCode, status) {
  const { data, error } = await supabase
    .from('game_rooms')
    .update({ status })
    .eq('room_code', normaliseCode(roomCode))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function leaveRoom(roomCode, userId) {
  if (!roomCode || !userId) return;
  await supabase.rpc('leave_game_room', {
    p_room_code: normaliseCode(roomCode),
    p_user_id:   userId,
  });
}

export async function deleteRoom(roomCode, userId) {
  if (!roomCode) throw new Error('Room code required');
  const room = await loadRoom(roomCode);
  if (!room) throw new Error('Room not found.');
  if (userId && room.player_x !== userId) throw new Error('Only the room host can delete this room.');

  const { error } = await supabase
    .from('game_rooms')
    .delete()
    .eq('room_code', normaliseCode(roomCode));
  if (error) throw new Error(error.message || 'Could not delete room');
  return true;
}

export async function setOnlineStatus(userId, isOnline, localDiscoveryEnabled = false) {
  if (!userId) return;
  await supabase.from('profiles').upsert({
    id: userId,
    is_online: isOnline,
    last_seen: new Date().toISOString(),
    local_discovery_enabled: localDiscoveryEnabled,
  }, { onConflict: 'id' });
}
