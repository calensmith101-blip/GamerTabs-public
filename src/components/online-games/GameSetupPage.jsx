import { useState, useEffect } from 'react'
import supabase from '../supabaseClient'
import { getGame } from '../lib/games'
import { createInitialState } from '../lib/roomState'
import { sendNudgeToAllUsers } from '../lib/nudges'

function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase() }

export default function GameSetupPage({ session, navigate, params }) {
  const game = getGame(params.gameId)

  const [mode, setMode]             = useState(params.prefillMode || null)
  const [difficulty, setDifficulty] = useState('medium')
  const [roomAction, setRoomAction] = useState(null)
  const [joinCode, setJoinCode]     = useState(params.prefillRoomCode || '')
  const [playerCount, setPlayerCount] = useState(2)
  const [status, setStatus]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [nudgeSent, setNudgeSent]   = useState(false)

  // Auto-advance if prefilled from a nudge
  useEffect(() => {
    if (params.prefillRoomCode && params.prefillMode === 'online') {
      setMode('online'); setRoomAction('join')
    }
  }, [])

  if (!game) return <div className="page"><button className="btn-back" onClick={() => navigate('games')}>← Games</button><p>Game not found.</p></div>

  const createRoom = async () => {
    setLoading(true); setStatus('')
    const code = genCode()
    const { error } = await supabase.from('game_rooms').insert({
      room_code: code,
      game_type: game.id,
      player_x:  session.user.id,
      state:     createInitialState(game.id),
    })
    if (error) { setStatus('Error: ' + error.message); setLoading(false); return }
    navigate('play', { gameId: game.id, mode: 'online', difficulty, roomCode: code, playerRole: 'X' })
    setLoading(false)
  }

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) { setStatus('Enter a room code'); return }
    setLoading(true); setStatus('')

    const { data: room, error } = await supabase.from('game_rooms').select('*').eq('room_code', code).single()
    if (error || !room) { setStatus('Room not found'); setLoading(false); return }
    if (room.player_o) { setStatus('Room is full'); setLoading(false); return }
    if (room.player_x === session.user.id) { setStatus('You created this room — share the code!'); setLoading(false); return }

    const { error: joinErr } = await supabase.from('game_rooms').update({ player_o: session.user.id }).eq('room_code', code)
    if (joinErr) { setStatus('Join failed: ' + joinErr.message); setLoading(false); return }

    navigate('play', { gameId: room.game_type, mode: 'online', difficulty, roomCode: code, playerRole: 'O' })
    setLoading(false)
  }

  const handleNudge = async (roomCode) => {
    if (nudgeSent) return
    try {
      await sendNudgeToAllUsers(supabase, session.user.id, game.id, roomCode)
      setNudgeSent(true)
      setTimeout(() => setNudgeSent(false), 30000)
      setStatus('🔔 Invite sent to all players!')
    } catch { setStatus('Could not send invite') }
  }

  return (
    <div className="page setup-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('games')}>← Games</button>
        <h2 className="page-title">{game.icon} {game.title}</h2>
      </div>

      <p className="setup-game-desc">{game.desc}</p>

      <div className="setup-body">
        {/* Step 1: Mode */}
        {!mode && (
          <section className="setup-section">
            <h3 className="setup-heading">How do you want to play?</h3>
            <div className="setup-mode-grid">
              {game.supportsOnline && (
                <button className="mode-card" onClick={() => setMode('online')}>
                  <span className="mode-icon">🌐</span>
                  <span className="mode-name">Online</span>
                  <span className="mode-desc">Play with others on any device</span>
                </button>
              )}
              {game.supportsAI && (
                <button className="mode-card" onClick={() => setMode('ai')}>
                  <span className="mode-icon">🤖</span>
                  <span className="mode-name">vs Computer</span>
                  <span className="mode-desc">Single player, choose difficulty</span>
                </button>
              )}
              {game.supportsLocal && (
                <button className="mode-card" onClick={() => setMode('local')}>
                  <span className="mode-icon">👥</span>
                  <span className="mode-name">Same Device</span>
                  <span className="mode-desc">Pass &amp; play local multiplayer</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* AI: difficulty */}
        {mode === 'ai' && (
          <section className="setup-section">
            <h3 className="setup-heading">🤖 vs Computer — Choose Difficulty</h3>
            <div className="setup-difficulty-row">
              {['easy','medium','hard','expert'].map(d => (
                <button key={d} className={`diff-btn ${difficulty===d?'active':''}`} onClick={() => setDifficulty(d)}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn-primary setup-go" onClick={() => navigate('play', { gameId: game.id, mode:'ai', difficulty, roomCode:null, playerRole:'X' })}>
              Start Game
            </button>
            <button className="btn-ghost" onClick={() => setMode(null)}>← Back</button>
          </section>
        )}

        {/* Local: player count */}
        {mode === 'local' && (
          <section className="setup-section">
            <h3 className="setup-heading">👥 Local Pass &amp; Play</h3>
            {game.players !== '2' && (
              <div className="player-count-row">
                <span>Players:</span>
                {[2,3,4].map(n => (
                  <button key={n} className={`count-btn ${playerCount===n?'active':''}`} onClick={() => setPlayerCount(n)}>{n}</button>
                ))}
              </div>
            )}
            <p className="setup-desc">Take turns on the same device.</p>
            <button className="btn-primary setup-go" onClick={() => navigate('play', { gameId: game.id, mode:'local', difficulty, roomCode:null, playerRole:null, playerCount })}>
              Start Local Game
            </button>
            <button className="btn-ghost" onClick={() => setMode(null)}>← Back</button>
          </section>
        )}

        {/* Online: create or join */}
        {mode === 'online' && !roomAction && (
          <section className="setup-section">
            <h3 className="setup-heading">🌐 Online Multiplayer</h3>
            <div className="setup-room-grid">
              <button className="room-action-card" onClick={() => setRoomAction('create')}>
                <span className="room-action-icon">➕</span>
                <span className="room-action-name">Create Room</span>
                <span className="room-action-desc">Host a game, share the code</span>
              </button>
              <button className="room-action-card" onClick={() => setRoomAction('join')}>
                <span className="room-action-icon">🔑</span>
                <span className="room-action-name">Join Room</span>
                <span className="room-action-desc">Enter a room code to join</span>
              </button>
            </div>
            <button className="btn-ghost" onClick={() => setMode(null)}>← Back</button>
          </section>
        )}

        {mode === 'online' && roomAction === 'create' && (
          <section className="setup-section">
            <h3 className="setup-heading">Create a Room</h3>
            <p className="setup-desc">A unique room code will be generated. Share it with your opponent to invite them.</p>
            {status && <p className="setup-status">{status}</p>}
            <button className="btn-primary setup-go" onClick={createRoom} disabled={loading}>
              {loading ? 'Creating…' : '➕ Create Room'}
            </button>
            <button className="btn-ghost" onClick={() => { setRoomAction(null); setStatus('') }}>← Back</button>
          </section>
        )}

        {mode === 'online' && roomAction === 'join' && (
          <section className="setup-section">
            <h3 className="setup-heading">Join a Room</h3>
            <input
              className="room-code-input"
              type="text"
              placeholder="Enter room code…"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              autoFocus
            />
            {status && <p className="setup-status">{status}</p>}
            <button className="btn-primary setup-go" onClick={joinRoom} disabled={loading || !joinCode.trim()}>
              {loading ? 'Joining…' : '🔑 Join Room'}
            </button>
            <button className="btn-ghost" onClick={() => { setRoomAction(null); setStatus('') }}>← Back</button>
          </section>
        )}
      </div>
    </div>
  )
}
