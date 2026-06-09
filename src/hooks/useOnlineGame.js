import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const ROOM_META_KEYS = [
  'roomKind', 'name', 'activeGameId', 'members', 'playerSeats', 'playerSlots',
  'createdAt', 'invitedUserId', 'invitedUserIds', 'lastJoinedAt', 'setup',
  'lastActivity'
]

function splitRoomState(rawState, initialState) {
  const state = rawState && typeof rawState === 'object' ? rawState : {}
  const gameState = state.gameState && typeof state.gameState === 'object' ? state.gameState : state
  return { ...initialState, ...gameState }
}

function preserveRoomMeta(rawState) {
  const state = rawState && typeof rawState === 'object' ? rawState : {}
  const meta = {}
  ROOM_META_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(state, key)) meta[key] = state[key]
  })
  return meta
}

export function useOnlineGame(roomCode, initialState) {
  const normalizedCode = roomCode?.toString().trim().toUpperCase() || null
  const [gameState, setGameState] = useState(initialState)
  const [roomMeta, setRoomMeta] = useState({})
  const [loading, setLoading] = useState(!!normalizedCode)
  const [error, setError] = useState(null)

  useEffect(() => {
    setGameState(initialState)
  }, [normalizedCode])

  useEffect(() => {
    let cancelled = false
    if (!normalizedCode) {
      setLoading(false)
      setError(null)
      return
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from('game_rooms')
          .select('state')
          .eq('room_code', normalizedCode)
          .maybeSingle()
        if (cancelled) return
        if (err) {
          setError(err.message)
          return
        }
        if (data?.state && typeof data.state === 'object') {
          setRoomMeta(preserveRoomMeta(data.state))
          setGameState(splitRoomState(data.state, initialState))
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not load room')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [normalizedCode])

  useEffect(() => {
    if (!normalizedCode) return
    const ch = supabase
      .channel(`uog-${normalizedCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${normalizedCode}` },
        (payload) => {
          if (payload.new?.state && typeof payload.new.state === 'object') {
            setRoomMeta(preserveRoomMeta(payload.new.state))
            setGameState(splitRoomState(payload.new.state, initialState))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [normalizedCode])

  const updateState = useCallback(async (newState) => {
    setGameState(newState)
    if (!normalizedCode) return { data: newState }
    try {
      // Preserve room membership, player seats, game choice and other room-level
      // fields so a game move cannot wipe out the multiplayer connection state.
      const { data: current } = await supabase
        .from('game_rooms')
        .select('state')
        .eq('room_code', normalizedCode)
        .maybeSingle()

      const meta = { ...roomMeta, ...preserveRoomMeta(current?.state) }
      const nextRoomState = {
        ...meta,
        ...newState,
        gameState: newState,
        lastActivity: new Date().toISOString(),
        _gameUpdatedAt: new Date().toISOString(),
      }

      const { data, error: err } = await supabase
        .from('game_rooms')
        .update({ state: nextRoomState, status: 'active', updated_at: new Date().toISOString() })
        .eq('room_code', normalizedCode)
        .select('state')
        .maybeSingle()
      if (err) {
        setError(err.message)
        return { error: err }
      }
      if (data?.state) setRoomMeta(preserveRoomMeta(data.state))
      return { data }
    } catch (e) {
      setError(e?.message || 'Could not save game')
      return { error: e }
    }
  }, [normalizedCode, roomMeta])

  return { gameState, setGameState, updateState, loading, error }
}
