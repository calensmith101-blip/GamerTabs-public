import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { GAMES, getGame, getGamePlayModes } from '../lib/games'
import { sendNudgeToUser } from '../lib/nudges'
import { createInitialState } from '../lib/roomState'
import { createRoom, normaliseCode, closeMyOpenRooms } from '../lib/roomUtils'
import {
  searchPlayers,
  listFriends,
  sendFriendRequest,
  listFriendRequests,
  respondFriendRequest,
  getProfilesByIds,
  listMessages,
  sendMessage,
  setDiscovery,
  ensureProfile,
  listActiveLiveGames,
} from '../lib/socialUtils'

function displayUser(u) { return u?.display_name || u?.username || u?.email || 'Player' }
function placeLabel(u) { return [u?.suburb || u?.town, u?.state, u?.country].filter(Boolean).join(', ') || 'Location not set' }
function onlineNow(u) { return !!(u?.is_online && u?.last_seen && Date.now() - new Date(u.last_seen).getTime() < 3 * 60 * 1000) }
function seenLabel(value) {
  if (!value) return 'unknown'
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (mins <= 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

export default function PlayWithFriendsPage({ session, navigate }) {
  const userId = session?.user?.id
  const [tab, setTab] = useState('friends')
  const [gameId, setGameId] = useState('tictactoe')
  const [players, setPlayers] = useState([])
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] })
  const [profiles, setProfiles] = useState({})
  const [activeGames, setActiveGames] = useState([])
  const [profile, setProfile] = useState(null)
  const [chatUser, setChatUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [stateRegion, setStateRegion] = useState('')
  const [suburb, setSuburb] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const liveGames = useMemo(() => GAMES.filter(g => getGamePlayModes(g.id).includes('localLive')), [])
  const selectedGame = getGame(gameId) || liveGames[0]

  useEffect(() => {
    if (!userId) return
    boot()
    const timer = setInterval(() => {
      refreshFriends()
      refreshActiveGames()
      if (tab === 'discover') refreshPlayers()
      if (tab === 'requests') refreshRequests()
    }, 10000)
    return () => clearInterval(timer)
  }, [userId, tab, gameId])

  useEffect(() => {
    if (!chatUser || !userId) return
    refreshMessages()
    const timer = setInterval(refreshMessages, 5000)
    return () => clearInterval(timer)
  }, [chatUser?.id, userId])

  async function boot() {
    try {
      const p = await ensureProfile(session?.user)
      setProfile(p)
      await Promise.all([refreshFriends(), refreshPlayers(), refreshRequests(), refreshActiveGames()])
    } catch (e) { setStatus(e.message || 'Could not load social hub') }
  }

  async function refreshPlayers() {
    if (!userId) return
    try { setPlayers(await searchPlayers({ userId, query: search, country, state: stateRegion, suburb })) }
    catch (e) { setStatus(e.message || 'Could not search players') }
  }
  async function refreshFriends() {
    if (!userId) return
    try { setFriends(await listFriends(userId)) }
    catch (e) { setStatus(e.message || 'Could not load friends') }
  }
  async function refreshActiveGames() {
    if (!userId) return
    try { setActiveGames(await listActiveLiveGames(userId)) }
    catch (_) {}
  }
  async function refreshRequests() {
    if (!userId) return
    try {
      const data = await listFriendRequests(userId)
      setRequests(data)
      const ids = [...data.incoming.map(r => r.sender_id), ...data.outgoing.map(r => r.receiver_id)]
      setProfiles(await getProfilesByIds(ids))
    } catch (e) { setStatus(e.message || 'Could not load requests') }
  }
  async function refreshMessages() {
    if (!userId || !chatUser?.id) return
    try { setMessages(await listMessages(userId, null, chatUser.id)) }
    catch (e) { setStatus(e.message || 'Could not load messages') }
  }

  async function createInvite(player) {
    if (!userId || !player?.id) return
    setLoading(true); setStatus('')
    try {
      await closeMyOpenRooms(userId).catch(() => 0)
      const room = await createRoom({
        userId,
        username: displayUser(session?.user?.user_metadata || { display_name: session?.user?.email || userId }),
        gameType: selectedGame.id,
        isPublic: true,
        initialState: {
          ...createInitialState(selectedGame.id),
          activeGameId: selectedGame.id,
          roomKind: 'live-match',
          members: [userId],
          invitedUserId: player.id,
          invitedUserIds: [player.id],
          playerSeats: { X: userId },
          playerSlots: [
            { seat: 'X', kind: 'human', userId, label: 'You' },
            { seat: 'O', kind: 'open', userId: null, invitedUserId: player.id, label: displayUser(player) },
          ],
          setup: { mode: 'localLive', playerCount: 2, difficulty: 'medium' },
        },
      })
      await sendNudgeToUser(supabase, userId, player.id, selectedGame.id, room.room_code, `${displayUser(profile)} invited you to ${selectedGame.title}`)
      setStatus(`Invite sent to ${displayUser(player)} for ${selectedGame.title}.`)
      navigate('play', { gameId: selectedGame.id, mode: 'localLive', roomCode: room.room_code, playerRole: 'X', playerCount: 2 })
    } catch (e) { setStatus(e.message || 'Could not send invite') }
    finally { setLoading(false) }
  }

  async function addFriend(player) {
    try { await sendFriendRequest(userId, player.id); setStatus(`Friend request sent to ${displayUser(player)}`); await refreshRequests() }
    catch (e) { setStatus(e.message || 'Could not send friend request') }
  }
  async function openChat(player) { setChatUser(player); setTab('chat'); setTimeout(refreshMessages, 0) }
  async function sendChat() {
    if (!messageText.trim() || !chatUser) return
    try { await sendMessage({ senderId: userId, recipientId: chatUser.id, body: messageText }); setMessageText(''); await refreshMessages() }
    catch (e) { setStatus(e.message || 'Could not send message') }
  }
  async function respond(req, accept) {
    try { await respondFriendRequest(req, userId, accept); setStatus(accept ? 'Friend request accepted' : 'Friend request declined'); await refreshRequests(); await refreshFriends() }
    catch (e) { setStatus(e.message || 'Could not update request') }
  }
  async function toggleDiscovery() {
    const next = !profile?.local_discovery_enabled
    try { await setDiscovery(userId, next); setProfile({ ...profile, local_discovery_enabled: next, is_online: true, last_seen: new Date().toISOString() }); setStatus(next ? 'You are visible to other players.' : 'You are hidden from discovery.') }
    catch (e) { setStatus(e.message || 'Could not update visibility. Check that VITE_SUPABASE_ANON_KEY is the public anon key.') }
  }

  function UserTile({ user, friend = false }) {
    const on = onlineNow(user)
    return <div className="gt-social-user-tile">
      <div className={`gt-online-dot ${on ? 'on' : ''}`} />
      <div className="gt-social-user-main">
        <b>{displayUser(user)}</b>
        <span>{on ? 'Online now' : `Offline · ${seenLabel(user.last_seen)}`}</span>
        <small>{placeLabel(user)}</small>
      </div>
      <div className="gt-social-actions">
        <button className="btn-primary small" disabled={loading} onClick={() => createInvite(user)}>Invite</button>
        <button className="btn-primary small" onClick={() => openChat(user)}>Message</button>
        {!friend && <button className="btn-ghost small" onClick={() => addFriend(user)}>Friend</button>}
      </div>
    </div>
  }

  return <div className="page gt-social-page">
    <div className="page-header"><button className="btn-back" onClick={() => navigate('home')}>← Home</button><h2 className="page-title">👥 Friends & Players</h2></div>
    <p className="setup-desc">This is only for people: friends, discovery, chat, requests and saved live games. To play from a game, open Games → choose a game → Play With People.</p>
    {status && <p className="setup-status">{status}</p>}

    <div className="gt-social-topbar">
      <select className="games-search" value={gameId} onChange={e => setGameId(e.target.value)}>{liveGames.map(g => <option key={g.id} value={g.id}>{g.icon} {g.title}</option>)}</select>
      <button className="btn-ghost" onClick={() => navigate('setup', { gameId, prefillMode: 'localLive' })}>Open this game invite screen</button>
    </div>

    <div className="gt-social-tabs">
      <button className={tab === 'friends' ? 'active' : ''} onClick={() => { setTab('friends'); refreshFriends() }}>Friends</button>
      <button className={tab === 'discover' ? 'active' : ''} onClick={() => { setTab('discover'); refreshPlayers() }}>Players Online</button>
      <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>Chat</button>
      <button className={tab === 'requests' ? 'active' : ''} onClick={() => { setTab('requests'); refreshRequests() }}>Requests</button>
      <button className={tab === 'saved' ? 'active' : ''} onClick={() => { setTab('saved'); refreshActiveGames() }}>Saved Games</button>
      <button className={tab === 'visibility' ? 'active' : ''} onClick={() => setTab('visibility')}>Visibility</button>
    </div>

    {tab === 'friends' && <section className="gt-social-panel"><h3>Friends</h3><p>Invite or message friends. Online friends show first.</p><div className="gt-user-list">{friends.map(f => <UserTile key={f.id} user={f} friend />)}{friends.length === 0 && <p className="empty-state">No friends yet. Search players or accept requests.</p>}</div></section>}

    {tab === 'discover' && <section className="gt-social-panel"><h3>Players Online</h3><div className="finder-toolbar simple"><input className="games-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username, email, suburb" /><button className="btn-primary" onClick={refreshPlayers}>Search</button></div><div className="finder-filters simple"><input className="games-search" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" /><input className="games-search" value={stateRegion} onChange={e => setStateRegion(e.target.value)} placeholder="State" /><input className="games-search" value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="Suburb" /></div><div className="gt-user-list">{players.map(p => <UserTile key={p.id} user={p} />)}{players.length === 0 && <p className="empty-state">No players found.</p>}</div></section>}

    {tab === 'chat' && <section className="gt-social-panel"><h3>Chat</h3><p>Chatting with: <b>{chatUser ? displayUser(chatUser) : 'choose someone from Friends or Players Online'}</b></p><div className="gt-chat-box">{messages.map(m => <div key={m.id || `${m.created_at}-${m.sender_id}`} className={`gt-chat-bubble ${m.sender_id === userId ? 'mine' : ''}`}>{m.body}</div>)}{messages.length === 0 && <p className="empty-state">No messages yet.</p>}</div><div className="join-inline"><input className="games-search" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type a message" onKeyDown={e => { if (e.key === 'Enter') sendChat() }} /><button className="btn-primary" disabled={!chatUser || !messageText.trim()} onClick={sendChat}>Send</button></div></section>}

    {tab === 'requests' && <section className="gt-social-panel"><h3>Friend Requests</h3><h4>Incoming</h4><div className="gt-user-list">{requests.incoming.map(r => { const p = profiles[r.sender_id] || { id: r.sender_id, username: r.sender_id }; return <div key={r.id} className="gt-social-user-tile"><div className="gt-social-user-main"><b>{displayUser(p)}</b><span>{r.status || 'pending'}</span></div><div className="gt-social-actions"><button className="btn-primary small" onClick={() => respond(r, true)}>Accept</button><button className="btn-ghost small" onClick={() => respond(r, false)}>Decline</button></div></div> })}{requests.incoming.length === 0 && <p className="empty-state">No incoming requests.</p>}</div><h4>Sent</h4><div className="gt-user-list">{requests.outgoing.map(r => { const p = profiles[r.receiver_id] || { id: r.receiver_id, username: r.receiver_id }; return <div key={r.id} className="gt-social-user-tile"><div className="gt-social-user-main"><b>{displayUser(p)}</b><span>{r.status || 'pending'}</span></div></div> })}{requests.outgoing.length === 0 && <p className="empty-state">No sent requests.</p>}</div></section>}

    {tab === 'saved' && <section className="gt-social-panel"><h3>Saved Live Games</h3><p>Leave a live game and come back here to resume it.</p><div className="gt-user-list">{activeGames.map(r => <div key={r.id || r.room_code} className="gt-social-user-tile"><div className="gt-social-user-main"><b>{getGame(r.game_type)?.title || r.game_type || 'Game'} · {r.room_code}</b><span>{r.status} · updated {seenLabel(r.updated_at || r.created_at)}</span></div><button className="btn-primary small" onClick={() => navigate('play', { gameId: r.game_type, mode: 'localLive', roomCode: r.room_code, playerCount: r.state?.playerSlots?.length || 2 })}>Resume</button></div>)}{activeGames.length === 0 && <p className="empty-state">No saved live games yet.</p>}</div></section>}

    {tab === 'visibility' && <section className="gt-social-panel"><h3>Visibility</h3><p>Online status: <b>{profile?.is_online ? 'Online' : 'Offline'}</b></p><p>Discovery: <b>{profile?.local_discovery_enabled ? 'Visible' : 'Hidden'}</b></p><button className="btn-primary" onClick={toggleDiscovery}>{profile?.local_discovery_enabled ? 'Hide me from discovery' : 'Show me to other players'}</button></section>}
  </div>
}
