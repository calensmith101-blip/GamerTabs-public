import { useState, useEffect, useCallback } from 'react'
import supabase from '../supabaseClient'

export function useOnlineGame(roomCode, initialState) {
  const [gameState, setGameState] = useState(initialState)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!roomCode) { setLoading(false); return }
    const load = async () => {
      const { data, error: err } = await supabase
        .from('game_rooms').select('state').eq('room_code', roomCode).single()
      if (err) { setError(err.message); setLoading(false); return }
      if (data?.state) setGameState(data.state)
      setLoading(false)
    }
    load()
  }, [roomCode])

  useEffect(() => {
    if (!roomCode) return
    const ch = supabase
      .channel(`uog-${roomCode}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
        (payload) => { if (payload.new?.state) setGameState(payload.new.state) })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [roomCode])

  const updateState = useCallback(async (newState) => {
    setGameState(newState)
    const { error: err } = await supabase
      .from('game_rooms').update({ state: newState }).eq('room_code', roomCode)
    if (err) setError(err.message)
  }, [roomCode])

  return { gameState, setGameState, updateState, loading, error }
}
