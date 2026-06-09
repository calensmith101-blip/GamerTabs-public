import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { createInitialState, deriveRole } from '../lib/roomState'
import { sendNudgeToAllUsers } from '../lib/nudges'

/**
 * OnlineGameFrame
 * ───────────────
 * Wraps any online game component. Handles:
 *  - Loading room + player roles from Supabase
 *  - Realtime subscription to game_rooms.state
 *  - Exposing gameState / updateState / playerRole / isMyTurn to child
 *  - Room code display, turn indicator, back button
 *  - Optional nudge-to-invite button
 *
 * Props:
 *  - gameId        string
 *  - roomCode      string
 *  - session       Supabase session
 *  - onBack        () => void
 *  - children      (frameProps) => ReactElement   — render prop pattern
 */
export default function OnlineGameFrame({ gameId, roomCode, session, onBack, children }) {
  const [room, setRoom]           = useState(null)
  const [gameState, setGameState] = useState(null)
  const [playerRole, setPlayerRole] = useState('spectator')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [nudgeSent, setNudgeSent] = useState(false)

  const userId = session?.user?.id

  // Load room + initial state
  useEffect(() => {
    if (!roomCode) return
    const load = async () => {
      const { data, error: err } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (err || !data) { setError('Room not found'); setLoading(false); return }

      setRoom(data)
      setGameState(data.state || createInitialState(gameId))

      const role = data.player_x === userId ? 'X'
        : data.player_o === userId ? 'O'
        : 'spectator'
      setPlayerRole(role)
      setLoading(false)
    }
    load()
  }, [roomCode, userId, gameId])

  // Realtime subscription
  useEffect(() => {
    if (!roomCode) return
    const ch = supabase
      .channel(`ogf-${roomCode}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.new?.state) setGameState(payload.new.state)
          if (payload.new) setRoom(payload.new)
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [roomCode])

  const updateState = useCallback(async (newState) => {
    setGameState(newState) // optimistic
    const { error: err } = await supabase
      .from('game_rooms')
      .update({ state: newState })
      .eq('room_code', roomCode)
    if (err) setError(err.message)
  }, [roomCode])

  const resetGame = useCallback(async () => {
    const fresh = createInitialState(gameId)
    await updateState(fresh)
  }, [gameId, updateState])

  const handleNudge = async () => {
    if (!userId || nudgeSent) return
    try {
      await sendNudgeToAllUsers(supabase, userId, gameId, roomCode)
      setNudgeSent(true)
      setTimeout(() => setNudgeSent(false), 30000)
    } catch { /* silent */ }
  }

  const isMyTurn = gameState?.currentTurn === playerRole
  const opponentPresent = !!(room?.player_x && room?.player_o)

  if (loading) return <div className="game-loading">Connecting to room…</div>
  if (error)   return (
    <div className="game-error">
      <p>⚠️ {error}</p>
      <button className="btn-ghost" onClick={onBack}>← Back</button>
    </div>
  )

  const frameProps = {
    gameState,
    updateState,
    resetGame,
    playerRole,
    isMyTurn,
    roomCode,
    opponentPresent,
    isSpectator: playerRole === 'spectator',
    gameMode: 'online',
  }

  return (
    <div className="game-container">
      {/* Top bar */}
      <div className="game-topbar">
        <button className="btn-back" onClick={onBack}>← Games</button>
        <div className="game-meta">
          <span className="room-chip">Room: {roomCode}</span>
          {playerRole !== 'spectator' && (
            <span className="role-chip">You: {playerRole}</span>
          )}
          {playerRole === 'spectator' && (
            <span className="role-chip spectator">👁 Spectating</span>
          )}
        </div>
      </div>

      {/* Waiting banner */}
      {!opponentPresent && playerRole !== 'spectator' && (
        <div className="waiting-banner">
          <span>⏳ Waiting for opponent…</span>
          <div className="waiting-actions">
            <span className="share-code">Share code: <strong>{roomCode}</strong></span>
            <button
              className={`btn-ghost small ${nudgeSent ? 'sent' : ''}`}
              onClick={handleNudge}
              disabled={nudgeSent}
            >
              {nudgeSent ? '🔔 Invite sent!' : '🔔 Nudge players'}
            </button>
          </div>
        </div>
      )}

      {/* Turn indicator */}
      {gameState && !gameState.gameOver && opponentPresent && (
        <div className={`turn-indicator ${isMyTurn ? 'my-turn' : 'their-turn'}`}>
          {isMyTurn ? '⚡ Your turn' : '⏳ Opponent\'s turn'}
        </div>
      )}

      {/* Game content via render prop */}
      {children(frameProps)}
    </div>
  )
}
