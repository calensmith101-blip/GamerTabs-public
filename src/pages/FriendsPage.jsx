import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { GAMES, getGame } from '../lib/games'
import { sendNudgeToUser, fetchPendingNudges, acceptNudge, declineNudge } from '../lib/nudges'
import { createInitialState } from '../lib/roomState'
import { createRoom, normaliseCode, closeMyOpenRooms } from '../lib/roomUtils'
import {
  blockUser,
  closeUniversalRoom,
  ensureProfile,
  getProfilesByIds,
  joinUniversalRoom,
  leaveUniversalRoom,
  listActiveLiveGames,
  listFriendRequests,
  listFriends,
  listMessages,
  playerRoleForRoom,
  removeFriend,
  respondFriendRequest,
  searchPlayers,
  sendMessage,
  sendFriendRequest,
  setDiscovery,
} from '../lib/socialUtils'

const TABS = ['friends', 'online', 'requests', 'chat', 'resume', 'visibility']
const SEATS = ['X', 'O', 'P3', 'P4', 'P5', 'P6']

function displayUser(user) {
  return user?.display_name || user?.username || user?.email || 'Player'
}

function placeLabel(user) {
  return [user?.country, user?.state, user?.suburb || user?.town].filter(Boolean).join(', ') || 'Country not set'
}

function onlineNow(user) {
  return !!(user?.is_online && user?.last_seen && Date.now() - new Date(user.last_seen).getTime() < 3 * 60 * 1000)
}

function seenLabel(value) {
  if (!value) return 'unknown'
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (mins <= 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

function maxPlayersForGame(game) {
  const raw = String(game?.players || '')
  if (raw.includes('6')) return 6
  if (raw.includes('5')) return 5
  if (raw.includes('4')) return 4
  if (raw.includes('3')) return 3
  return 2
}

function liveGameList() {
  return GAMES.filter(game => game.supportsOnline !== false && maxPlayersForGame(game) >= 2)
}

function clampSeatCount(value, game) {
  const min = String(game?.players || '').startsWith('1') ? 1 : 2
  const max = Math.min(5, maxPlayersForGame(game))
  return Math.max(min, Math.min(max, Number(value) || min))
}

function buildLiveSlots({ userId, target, playerCount, aiSeats }) {
  const total = Math.max(2, Math.min(5, Number(playerCount) || 2))
  const aiCount = Math.max(0, Math.min(total - 1, Number(aiSeats) || 0))
  const humanOpenSeats = Math.max(1, total - 1 - aiCount)
  return SEATS.slice(0, total).map((seat, index) => {
    if (index === 0) return { seat, kind: 'human', userId, label: 'You' }
    if (index <= humanOpenSeats) {
      const invited = index === 1 ? target : null
      return {
        seat,
        kind: 'open',
        userId: null,
        invitedUserId: invited?.id || null,
        label: invited ? displayUser(invited) : 'Open player',
      }
    }
    return { seat, kind: 'ai', userId: null, label: 'AI Player' }
  })
}

export default function FriendsPage({ session, navigate, params = {} }) {
  const userId = session?.user?.id
  const games = useMemo(liveGameList, [])
  const [tab, setTab] = useState(params.tab || 'friends')
  const [gameId, setGameId] = useState(params.gameId || games[0]?.id || 'tictactoe')
  const [profile, setProfile] = useState(null)
  const [players, setPlayers] = useState([])
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] })
  const [requestProfiles, setRequestProfiles] = useState({})
  const [invites, setInvites] = useState([])
  const [activeGames, setActiveGames] = useState([])
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [chatTarget, setChatTarget] = useState(null)
  const [chatText, setChatText] = useState('')
  const [messages, setMessages] = useState([])
  const [playerCount, setPlayerCount] = useState(2)
  const [aiSeats, setAiSeats] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedGame = getGame(gameId) || games[0]
  const maxPlayers = Math.min(5, maxPlayersForGame(selectedGame))
  const seats = buildLiveSlots({ userId, target: null, playerCount, aiSeats })

  useEffect(() => {
    if (params.gameId) setGameId(params.gameId)
  }, [params.gameId])

  useEffect(() => {
    if (params.tab) setTab(params.tab)
  }, [params.tab])

  useEffect(() => {
    if (!selectedGame) return
    const start = clampSeatCount(playerCount, selectedGame)
    if (start !== playerCount) setPlayerCount(start)
    if (aiSeats > start - 1) setAiSeats(Math.max(0, start - 1))
  }, [selectedGame?.id])

  useEffect(() => {
    if (!userId) return
    boot()
    const timer = setInterval(() => {
      refreshInvites()
      refreshActiveGames()
      if (tab === 'online') refreshPlayers()
      if (tab === 'friends') refreshFriends()
      if (tab === 'requests') refreshRequests()
      if (tab === 'chat') refreshMessages()
    }, 10000)
    return () => clearInterval(timer)
  }, [userId, tab, gameId])

  async function boot() {
    try {
      const nextProfile = await ensureProfile(session?.user)
      setProfile(nextProfile)
      await Promise.all([refreshPlayers(), refreshFriends(), refreshInvites(), refreshRequests(), refreshActiveGames(), refreshMessages()])
    } catch (err) {
      setStatus(err.message || 'Could not load players.')
    }
  }

  async function refreshPlayers() {
    if (!userId) return
    try {
      setPlayers(await searchPlayers({ userId, query: search, country }))
    } catch (err) {
      setStatus(err.message || 'Could not load world players.')
    }
  }

  async function refreshFriends() {
    if (!userId) return
    try {
      setFriends(await listFriends(userId))
    } catch (err) {
      setStatus(err.message || 'Could not load friends.')
    }
  }

  async function refreshRequests() {
    if (!userId) return
    try {
      const data = await listFriendRequests(userId)
      setRequests(data)
      const ids = [...data.incoming.map(r => r.sender_id), ...data.outgoing.map(r => r.receiver_id)]
      setRequestProfiles(await getProfilesByIds(ids))
    } catch (err) {
      setStatus(err.message || 'Could not load friend requests.')
    }
  }

  async function refreshInvites() {
    if (!userId) return
    try {
      setInvites(await fetchPendingNudges(supabase, userId))
    } catch (_) {}
  }

  async function refreshActiveGames() {
    if (!userId) return
    try {
      setActiveGames(await listActiveLiveGames(userId))
    } catch (_) {}
  }

  async function refreshMessages() {
    if (!userId) return
    try {
      setMessages(await listMessages(userId, null, chatTarget?.id || null))
    } catch (_) {}
  }

  function launch(room, role = 'X') {
    const game = getGame(room.game_type) ? room.game_type : gameId
    navigate('play', {
      gameId: game,
      mode: 'localLive',
      roomCode: room.room_code,
      playerRole: role,
      playerCount: room.state?.playerSlots?.length || 2,
      playerSlots: room.state?.playerSlots || [],
    })
  }

  async function createInvite(target = null) {
    if (!userId || !selectedGame) return
    setLoading(true)
    setStatus('')
    try {
      const total = clampSeatCount(playerCount, selectedGame)
      const aiCount = Math.max(0, Math.min(total - 1, Number(aiSeats) || 0))
      const slots = buildLiveSlots({ userId, target, playerCount: total, aiSeats: aiCount })
      const targetName = target ? displayUser(target) : 'open player'
      const room = await createRoom({
        userId,
        username: displayUser(profile || session?.user),
        gameType: selectedGame.id,
        isPublic: !target,
        initialState: {
          ...createInitialState(selectedGame.id),
          activeGameId: selectedGame.id,
          roomKind: 'live-match',
          members: [userId],
          invitedUserId: target?.id || null,
          invitedUserIds: target?.id ? [target.id] : [],
          playerSeats: { X: userId },
          playerSlots: slots,
          setup: { mode: 'localLive', playerCount: total, aiSeats: aiCount, difficulty: 'medium' },
        },
      })
      if (target?.id) {
        await sendNudgeToUser(supabase, userId, target.id, selectedGame.id, room.room_code, `${displayUser(profile)} invited you to ${selectedGame.title}`)
      }
      setStatus(target ? `Invite sent to ${targetName}. Room ${room.room_code}.` : `Open room ${room.room_code} created.`)
      launch(room, 'X')
    } catch (err) {
      setStatus(err.message || 'Could not create invite.')
    } finally {
      setLoading(false)
    }
  }

  async function joinByCode(code = joinCode) {
    const clean = normaliseCode(code)
    if (!clean) return
    setLoading(true)
    setStatus('')
    try {
      const room = await joinUniversalRoom(clean, userId)
      launch(room, playerRoleForRoom(room, userId))
    } catch (err) {
      setStatus(err.message || 'Could not join room.')
    } finally {
      setLoading(false)
    }
  }

  async function acceptInvite(invite) {
    try {
      if (invite.id) await acceptNudge(supabase, invite.id)
      await joinByCode(invite.room_code)
    } catch (err) {
      setStatus(err.message || 'Could not accept invite.')
    }
  }

  async function dismissInvite(invite) {
    try {
      if (invite.id) await declineNudge(supabase, invite.id)
      await refreshInvites()
    } catch (err) {
      setStatus(err.message || 'Could not dismiss invite.')
    }
  }

  async function addFriend(player) {
    try {
      await sendFriendRequest(userId, player.id)
      setStatus(`Friend request sent to ${displayUser(player)}.`)
      await refreshRequests()
    } catch (err) {
      setStatus(err.message || 'Could not send friend request.')
    }
  }

  async function removeSavedFriend(player) {
    try {
      await removeFriend(userId, player.id)
      setStatus(`${displayUser(player)} removed from friends.`)
      await refreshFriends()
    } catch (err) {
      setStatus(err.message || 'Could not remove friend.')
    }
  }

  async function blockPlayer(player) {
    try {
      await blockUser(userId, player.id)
      setStatus(`${displayUser(player)} blocked.`)
      await Promise.all([refreshPlayers(), refreshFriends()])
    } catch (err) {
      setStatus(err.message || 'Could not block player.')
    }
  }

  async function openChat(player) {
    setChatTarget(player)
    setTab('chat')
    try {
      setMessages(await listMessages(userId, null, player?.id || null))
    } catch (err) {
      setStatus(err.message || 'Could not load chat.')
    }
  }

  async function sendChat() {
    if (!chatTarget?.id || !chatText.trim()) return
    try {
      await sendMessage({ senderId: userId, recipientId: chatTarget.id, body: chatText })
      setChatText('')
      await refreshMessages()
    } catch (err) {
      setStatus(err.message || 'Could not send message.')
    }
  }

  async function leaveGame(room) {
    try {
      await leaveUniversalRoom(room.room_code, userId)
      setStatus(`Left room ${room.room_code}.`)
      await refreshActiveGames()
    } catch (err) {
      setStatus(err.message || 'Could not leave game.')
    }
  }

  async function closeGame(room) {
    try {
      await closeUniversalRoom(room.room_code, userId)
      setStatus(`Closed room ${room.room_code}.`)
      await refreshActiveGames()
    } catch (err) {
      setStatus(err.message || 'Could not close room.')
    }
  }

  async function clearWaitingGames() {
    try {
      const count = await closeMyOpenRooms(userId)
      setStatus(count ? `Closed ${count} waiting/open game${count === 1 ? '' : 's'}.` : 'No waiting/open games needed closing.')
      await refreshActiveGames()
    } catch (err) {
      setStatus(err.message || 'Could not clear old waiting games.')
    }
  }

  async function respond(request, accept) {
    try {
      await respondFriendRequest(request, userId, accept)
      await Promise.all([refreshRequests(), refreshFriends()])
      setStatus(accept ? 'Friend request accepted.' : 'Friend request declined.')
    } catch (err) {
      setStatus(err.message || 'Could not update request.')
    }
  }

  async function toggleDiscovery() {
    const next = !profile?.local_discovery_enabled
    try {
      await setDiscovery(userId, next)
      setProfile({ ...profile, local_discovery_enabled: next, is_online: true, last_seen: new Date().toISOString() })
      setStatus(next ? 'You are visible to world players.' : 'You are hidden from discovery.')
    } catch (err) {
      setStatus(err.message || 'Could not update visibility.')
    }
  }

  function UserRow({ user, friend = false }) {
    const online = onlineNow(user)
    return <div className="gt-social-user-tile">
      <div className={`gt-online-dot ${online ? 'on' : ''}`} />
      <div className="gt-social-user-main">
        <b>{displayUser(user)}</b>
        <span>{online ? 'Online now' : `Last seen ${seenLabel(user.last_seen)}`}</span>
        <small>{placeLabel(user)}</small>
      </div>
      <div className="gt-social-actions">
        <button className="btn-primary small" disabled={loading} onClick={() => createInvite(user)}>Invite</button>
        <button className="btn-ghost small" onClick={() => openChat(user)}>Message</button>
        {!friend && <button className="btn-ghost small" onClick={() => addFriend(user)}>Friend</button>}
        {friend && <button className="btn-ghost small" onClick={() => removeSavedFriend(user)}>Remove</button>}
        <button className="btn-ghost small" onClick={() => blockPlayer(user)}>Block</button>
      </div>
    </div>
  }

  return <div className="page gt-social-page">
    <div className="page-header">
      <button className="btn-back" onClick={() => navigate('home')}>Home</button>
      <h2 className="page-title">Friends & Live Play</h2>
    </div>

    <section className="gt-social-panel">
      <div className="gt-social-topbar">
        <select className="games-search" value={gameId} onChange={e => setGameId(e.target.value)}>
          {games.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
        </select>
        <button className="btn-primary" disabled={loading} onClick={() => createInvite(null)}>Create Open Room</button>
      </div>
      <div className="gt-match-builder">
        <div>
          <b>Total seats</b>
          <div className="gt-seat-buttons">
            {Array.from({ length: Math.max(1, maxPlayers - 1) }, (_, i) => i + 2).map(count => (
              <button
                key={count}
                className={playerCount === count ? 'active' : ''}
                onClick={() => {
                  setPlayerCount(count)
                  setAiSeats(prev => Math.min(prev, count - 1))
                }}>
                {count}
              </button>
            ))}
          </div>
        </div>
        <div>
          <b>AI seats</b>
          <div className="gt-seat-buttons">
            {Array.from({ length: playerCount }, (_, i) => i).map(count => (
              <button key={count} className={aiSeats === count ? 'active' : ''} onClick={() => setAiSeats(count)}>{count}</button>
            ))}
          </div>
        </div>
        <div className="gt-seat-preview">
          {seats.map(slot => <span key={slot.seat} className={`slot-pill ${slot.kind}`}><b>{slot.seat}</b> {slot.kind === 'ai' ? 'AI' : slot.label}</span>)}
        </div>
      </div>
      <div className="join-inline">
        <input className="games-search" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter room code" />
        <button className="btn-primary" disabled={loading || !joinCode.trim()} onClick={() => joinByCode()}>Join</button>
      </div>
      <p className="setup-desc">
        Discovery is {profile?.local_discovery_enabled ? 'on' : 'off'}.
        <button className="btn-ghost small" style={{ marginLeft: 8 }} onClick={toggleDiscovery}>
          {profile?.local_discovery_enabled ? 'Hide me' : 'Show me'}
        </button>
      </p>
      {status && <p className="setup-status">{status}</p>}
    </section>

    <div className="gt-social-tabs">
      {TABS.map(id => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{id === 'online' ? 'Online Players' : id === 'resume' ? 'Resume Games' : id}</button>)}
    </div>

    {tab === 'online' && <section className="gt-social-panel">
      <h3>Online Players</h3>
      <div className="finder-toolbar simple">
        <input className="games-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username or town" />
        <input className="games-search" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" />
        <button className="btn-primary" onClick={refreshPlayers}>Search</button>
      </div>
      <div className="gt-user-list">{players.map(player => <UserRow key={player.id} user={player} />)}{players.length === 0 && <p className="empty-state">No players found.</p>}</div>
    </section>}

    {tab === 'friends' && <section className="gt-social-panel">
      <h3>Friends</h3>
      <div className="gt-user-list">{friends.map(friend => <UserRow key={friend.id} user={friend} friend />)}{friends.length === 0 && <p className="empty-state">No friends yet. Add players from World Players or accept requests.</p>}</div>
    </section>}

    {tab === 'requests' && <section className="gt-social-panel">
      <h3>Requests</h3>
      <h4>Game Invites</h4>
      <div className="gt-user-list">{invites.map(invite => {
        const game = getGame(invite.game_id)
        return <div key={invite.id || `${invite.room_code}-${invite.created_at}`} className="gt-social-user-tile">
          <div className="gt-social-user-main"><b>{game?.title || 'Game invite'}</b><span>Room {invite.room_code}</span><small>{invite.message || 'You were invited to play.'}</small></div>
          <div className="gt-social-actions"><button className="btn-primary small" onClick={() => acceptInvite(invite)}>Join</button><button className="btn-ghost small" onClick={() => dismissInvite(invite)}>Dismiss</button></div>
        </div>
      })}{invites.length === 0 && <p className="empty-state">No live invites yet.</p>}</div>
      <h4>Friend Requests</h4>
      <h4>Incoming</h4>
      <div className="gt-user-list">{requests.incoming.map(request => {
        const sender = requestProfiles[request.sender_id] || { id: request.sender_id, username: request.sender_id }
        return <div key={request.id} className="gt-social-user-tile"><div className="gt-social-user-main"><b>{displayUser(sender)}</b><span>{request.status || 'pending'}</span></div><div className="gt-social-actions"><button className="btn-primary small" onClick={() => respond(request, true)}>Accept</button><button className="btn-ghost small" onClick={() => respond(request, false)}>Decline</button></div></div>
      })}{requests.incoming.length === 0 && <p className="empty-state">No incoming requests.</p>}</div>
      <h4>Sent</h4>
      <div className="gt-user-list">{requests.outgoing.map(request => {
        const receiver = requestProfiles[request.receiver_id] || { id: request.receiver_id, username: request.receiver_id }
        return <div key={request.id} className="gt-social-user-tile"><div className="gt-social-user-main"><b>{displayUser(receiver)}</b><span>{request.status || 'pending'}</span></div></div>
      })}{requests.outgoing.length === 0 && <p className="empty-state">No sent requests.</p>}</div>
    </section>}

    {tab === 'resume' && <section className="gt-social-panel">
      <h3>My Active Games / Open Rooms</h3>
      <p className="setup-desc">You can have up to 3 waiting/open games. Active and paused games stay here so you can resume them later.</p>
      <button className="btn-ghost small" onClick={clearWaitingGames}>Clear Old Waiting Games</button>
      <div className="gt-user-list">{activeGames.map(room => <div key={room.id || room.room_code} className="gt-social-user-tile">
        <div className="gt-social-user-main"><b>{getGame(room.game_type)?.title || room.game_type || 'Game'} - {room.room_code}</b><span>{room.status} - updated {seenLabel(room.updated_at || room.created_at)}</span></div>
        <div className="gt-social-actions">
          <button className="btn-primary small" onClick={() => launch(room, playerRoleForRoom(room, userId))}>Resume</button>
          <button className="btn-ghost small" onClick={() => leaveGame(room)}>Leave</button>
          {(room.host_id === userId || room.player_x === userId) && <button className="btn-ghost small" onClick={() => closeGame(room)}>Close Room</button>}
        </div>
      </div>)}{activeGames.length === 0 && <p className="empty-state">No saved live games yet.</p>}</div>
    </section>}

    {tab === 'chat' && <section className="gt-social-panel">
      <h3>Chat</h3>
      <p className="setup-desc">{chatTarget ? `Messaging ${displayUser(chatTarget)}` : 'Choose Message on a friend or online player.'}</p>
      <div className="gt-user-list">
        {messages.map(message => <div key={message.id || `${message.created_at}-${message.body}`} className="gt-social-user-tile">
          <div className="gt-social-user-main"><b>{message.sender_id === userId ? 'You' : displayUser(chatTarget)}</b><span>{seenLabel(message.created_at)}</span><small>{message.body}</small></div>
        </div>)}
        {messages.length === 0 && <p className="empty-state">No messages yet.</p>}
      </div>
      <div className="join-inline">
        <input className="games-search" value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Message" disabled={!chatTarget} />
        <button className="btn-primary" disabled={!chatTarget || !chatText.trim()} onClick={sendChat}>Send</button>
      </div>
    </section>}

    {tab === 'visibility' && <section className="gt-social-panel">
      <h3>Visibility / Online Status</h3>
      <p className="setup-desc">Discovery controls whether other app users can find you for live local play. Your friends can still invite you when they already know you.</p>
      <button className="btn-primary" onClick={toggleDiscovery}>{profile?.local_discovery_enabled ? 'Turn Discovery Off' : 'Turn Discovery On'}</button>
      <p className="setup-desc">Status: {profile?.local_discovery_enabled ? 'visible' : 'hidden'} - last seen {seenLabel(profile?.last_seen)}</p>
    </section>}
  </div>
}
