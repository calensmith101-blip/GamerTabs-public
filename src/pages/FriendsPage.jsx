import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { GAMES, getGame } from '../lib/games'
import { sendNudgeToUser, fetchPendingNudges, acceptNudge, declineNudge } from '../lib/nudges'
import { createInitialState } from '../lib/roomState'
import { createRoom, joinRoom, normaliseCode, closeMyOpenRooms } from '../lib/roomUtils'
import {
  ensureProfile,
  getProfilesByIds,
  listActiveLiveGames,
  listFriendRequests,
  listFriends,
  playerRoleForRoom,
  respondFriendRequest,
  searchPlayers,
  sendFriendRequest,
  setDiscovery,
} from '../lib/socialUtils'

const TABS = ['world', 'friends', 'invites', 'requests', 'saved']

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

function liveGameList() {
  return GAMES.filter(game => game.supportsOnline !== false)
}

export default function FriendsPage({ session, navigate, params = {} }) {
  const userId = session?.user?.id
  const games = useMemo(liveGameList, [])
  const [tab, setTab] = useState('world')
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
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedGame = getGame(gameId) || games[0]

  useEffect(() => {
    if (params.gameId) setGameId(params.gameId)
  }, [params.gameId])

  useEffect(() => {
    if (!userId) return
    boot()
    const timer = setInterval(() => {
      refreshInvites()
      refreshActiveGames()
      if (tab === 'world') refreshPlayers()
      if (tab === 'friends') refreshFriends()
      if (tab === 'requests') refreshRequests()
    }, 10000)
    return () => clearInterval(timer)
  }, [userId, tab, gameId])

  async function boot() {
    try {
      const nextProfile = await ensureProfile(session?.user)
      setProfile(nextProfile)
      await Promise.all([refreshPlayers(), refreshFriends(), refreshInvites(), refreshRequests(), refreshActiveGames()])
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
      await closeMyOpenRooms(userId).catch(() => 0)
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
          playerSlots: [
            { seat: 'X', kind: 'human', userId, label: 'You' },
            { seat: 'O', kind: 'open', userId: null, invitedUserId: target?.id || null, label: targetName },
          ],
          setup: { mode: 'localLive', playerCount: 2, difficulty: 'medium' },
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
      const room = await joinRoom(clean, userId, displayUser(profile || session?.user))
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
        {!friend && <button className="btn-ghost small" onClick={() => addFriend(user)}>Friend</button>}
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
      {TABS.map(id => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{id}</button>)}
    </div>

    {tab === 'world' && <section className="gt-social-panel">
      <h3>World Players</h3>
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

    {tab === 'invites' && <section className="gt-social-panel">
      <h3>Invites</h3>
      <div className="gt-user-list">{invites.map(invite => {
        const game = getGame(invite.game_id)
        return <div key={invite.id || `${invite.room_code}-${invite.created_at}`} className="gt-social-user-tile">
          <div className="gt-social-user-main"><b>{game?.title || 'Game invite'}</b><span>Room {invite.room_code}</span><small>{invite.message || 'You were invited to play.'}</small></div>
          <div className="gt-social-actions"><button className="btn-primary small" onClick={() => acceptInvite(invite)}>Join</button><button className="btn-ghost small" onClick={() => dismissInvite(invite)}>Dismiss</button></div>
        </div>
      })}{invites.length === 0 && <p className="empty-state">No live invites yet.</p>}</div>
    </section>}

    {tab === 'requests' && <section className="gt-social-panel">
      <h3>Friend Requests</h3>
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

    {tab === 'saved' && <section className="gt-social-panel">
      <h3>Saved Live Games</h3>
      <div className="gt-user-list">{activeGames.map(room => <div key={room.id || room.room_code} className="gt-social-user-tile">
        <div className="gt-social-user-main"><b>{getGame(room.game_type)?.title || room.game_type || 'Game'} - {room.room_code}</b><span>{room.status} - updated {seenLabel(room.updated_at || room.created_at)}</span></div>
        <button className="btn-primary small" onClick={() => launch(room, playerRoleForRoom(room, userId))}>Resume</button>
      </div>)}{activeGames.length === 0 && <p className="empty-state">No saved live games yet.</p>}</div>
    </section>}
  </div>
}
