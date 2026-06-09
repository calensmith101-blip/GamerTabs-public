import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { GAMES } from '../lib/games'
import { sendNudgeToUser } from '../lib/nudges'
import { useRoomsList } from '../hooks/useRoomsList'
import { useOnlinePresence } from '../hooks/useOnlinePresence'
import { createRoom, deleteRoom, joinRoom, normaliseCode } from '../lib/roomUtils'
import { createInitialState } from '../lib/roomState'
import { isOfflineSession } from '../lib/offline'

export default function RoomsPage({ session, navigate }) {
  const offline = isOfflineSession(session)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [localPlayers, setLocalPlayers] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('search')
  const { rooms: openRooms = [], loading: roomsLoading = false, refetch: refreshRooms = () => {} } = offline
    ? {}
    : useRoomsList(selectedGame?.id)
  const { onlineUsers = [], refetch: refreshPlayers = () => {} } = offline
    ? {}
    : useOnlinePresence(session.user.id, true)

  useEffect(() => {
    if (!offline) setLocalPlayers(onlineUsers)
  }, [onlineUsers, offline])

  if (offline) {
    return (
      <div className="page rooms-page">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('home')}>← Home</button>
          <h2 className="page-title">👥 Rooms / Players</h2>
        </div>
        <div className="setup-section">
          <h3 className="setup-heading">Offline mode</h3>
          <p className="setup-desc">Rooms, players, and invites need a live connection. Your local and AI games still work.</p>
          <button className="btn-primary" onClick={() => navigate('games')}>Browse Games</button>
        </div>
      </div>
    )
  }

  const getPlayerStatusLabel = (player) => {
    if (player.is_online) return { label: '🟢 Online', className: 'online' }
    if (player.local_discovery_enabled) return { label: '📍 Nearby', className: 'nearby' }
    return { label: '⚫ Offline', className: 'offline' }
  }

  const getRoomActionState = (room) => {
    const isHost = room.player_x === session.user.id
    const isOpponent = room.player_o === session.user.id
    const isParticipant = isHost || isOpponent
    const hasOpponent = !!room.player_o
    if (isParticipant) return { label: 'Enter', disabled: false }
    if (!hasOpponent) return { label: 'Join', disabled: false }
    return { label: 'Full', disabled: true }
  }

  const handleJoinOpenRoom = async (room) => {
    if (!session?.user?.id) {
      setStatus('Sign in before joining a room')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      const joined = await joinRoom(room.room_code, session.user.id, session.user.email)
      const role = String(joined.player_x) === String(session.user.id) || String(joined.host_id) === String(session.user.id)
        ? 'X'
        : String(joined.player_o) === String(session.user.id)
          ? 'O'
          : 'spectator'
      navigate('play', {
        gameId: joined.game_type || selectedGame?.id,
        mode: 'online',
        roomCode: joined.room_code,
        playerRole: role,
      })
    } catch (error) {
      setStatus(error.message || 'Unable to join room')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!selectedGame) {
      setStatus('Select a game first')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      const room = await createRoom({
        userId: session.user.id,
        username: session.user.email,
        gameType: selectedGame.id,
        initialState: createInitialState(selectedGame.id),
      })
      setStatus(`Room created: ${room.room_code}`)
      refreshRooms()
      navigate('play', { gameId: selectedGame.id, mode: 'online', roomCode: room.room_code, playerRole: 'X' })
    } catch (error) {
      setStatus(error.message || 'Unable to create room')
    } finally {
      setLoading(false)
    }
  }

  const searchPlayers = async () => {
    const query = searchQuery.trim()
    if (!query) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, username, is_online, local_discovery_enabled')
      .ilike('username', `%${query}%`)
      .limit(20)

    setSearchResults(data || [])
  }

  return (
    <div className="page rooms-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('home')}>← Home</button>
        <h2 className="page-title">👥 Rooms / Players</h2>
      </div>

      <div className="category-tabs">
        {['search', 'local', 'rooms', 'create'].map(name => (
          <button key={name} className={`cat-tab ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}>
            {name === 'search' ? 'Find Players' : name === 'local' ? 'Online Players' : name === 'rooms' ? 'Open Rooms' : 'Create Room'}
          </button>
        ))}
      </div>

      {status && <p className="setup-status">{status}</p>}

      {tab === 'search' && (
        <div className="setup-section">
          <div className="games-toolbar">
            <input className="games-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search usernames…" />
            <button className="btn-primary" onClick={searchPlayers}>Search</button>
          </div>
          <div className="games-grid">
            {searchResults.map(player => {
              const badge = getPlayerStatusLabel(player)
              return (
                <div key={player.id} className="game-card live">
                  <span className="game-card-name">{player.username}</span>
                  <span className={`game-card-type ${badge.className}`}>{badge.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'local' && (
        <div className="setup-section">
          <div className="setup-heading">Players online</div>
          <div className="games-grid">
            {localPlayers.map(player => {
              const badge = getPlayerStatusLabel(player)
              return (
                <div key={player.id} className="game-card live">
                  <span className="game-card-name">{player.username}</span>
                  <span className={`game-card-type ${badge.className}`}>{badge.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'rooms' && (
        <div className="setup-section">
          {roomsLoading ? <div className="loading-block">Loading rooms…</div> : (
            <div className="games-grid">
              {openRooms.map(room => {
                const game = GAMES.find(item => item.id === room.game_type)
                const action = getRoomActionState(room)
                return (
                  <div key={room.id} className="game-card live">
                    <span className="game-card-name">{game?.title || room.game_type}</span>
                    <span className="game-card-type">Room {room.room_code}</span>
                    <button className="btn-primary" disabled={action.disabled || loading} onClick={() => handleJoinOpenRoom(room)}>
                      {action.label}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div className="setup-section">
          <div className="games-grid">
            {GAMES.filter(game => game.supportsOnline).map(game => (
              <button key={game.id} className={`game-card ${selectedGame?.id === game.id ? 'live' : 'scaffold'}`} onClick={() => setSelectedGame(game)}>
                <span className="game-card-emoji">{game.icon}</span>
                <span className="game-card-name">{game.title}</span>
              </button>
            ))}
          </div>
          <button className="btn-primary setup-go" onClick={handleCreateRoom} disabled={loading || !selectedGame}>
            {loading ? 'Creating…' : 'Create Room'}
          </button>
        </div>
      )}
    </div>
  )
}
