import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { createRoom } from '../lib/roomUtils'
import { createInitialState } from '../lib/roomState'
import { sendNudgeToUser } from '../lib/nudges'

function labelSeen(iso) {
  if (!iso) return 'not seen yet'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins <= 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  return `${Math.round(mins / 60)} hr ago`
}

export default function FindMatchLobby({ session, navigate, gameId }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [suburb, setSuburb] = useState('')

  const displayName = session?.user?.user_metadata?.display_name || session?.user?.email || session?.user?.id

  const loadPlayers = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    setStatus('')
    try {
      let q = supabase
        .from('profiles')
        .select('id, username, display_name, town, suburb, state, country, is_online, last_seen, local_discovery_enabled')
        .neq('id', session.user.id)
        .order('last_seen', { ascending: false, nullsFirst: false })
        .limit(80)

      const term = search.trim().replace(/[,()]/g, ' ')
      if (term) q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%,town.ilike.%${term}%,suburb.ilike.%${term}%,state.ilike.%${term}%,country.ilike.%${term}%`)
      if (country.trim()) q = q.ilike('country', `%${country.trim()}%`)
      if (state.trim()) q = q.ilike('state', `%${state.trim()}%`)
      if (suburb.trim()) q = q.or(`town.ilike.%${suburb.trim()}%,suburb.ilike.%${suburb.trim()}%`)

      const { data, error } = await q
      if (error) throw error
      setPlayers(data || [])
    } catch (e) {
      setStatus(e.message || 'Could not load players. Check profiles RLS/policies.')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPlayers() }, [session?.user?.id])

  const invitePlayer = async (targetId, targetName) => {
    if (!session?.user?.id) return
    setLoading(true)
    setStatus('')
    try {
      const room = await createRoom({
        userId: session.user.id,
        username: displayName,
        gameType: gameId,
        isPublic: false,
        initialState: {
          ...createInitialState(gameId),
          activeGameId: gameId,
          members: [session.user.id],
          playerSeats: { X: session.user.id },
          playerSlots: [
            { seat: 'X', userId: session.user.id, kind: 'human' },
            { seat: 'O', userId: null, kind: 'open' },
          ],
        },
      })

      try {
        await sendNudgeToUser(
          supabase,
          session.user.id,
          targetId,
          gameId,
          room.room_code,
          `${displayName || 'Someone'} invited you to play. Room: ${room.room_code}`
        )
      } catch (_) {}

      setStatus(`Private room ${room.room_code} created for ${targetName || 'player'}. Share the code if invite alerts are not enabled.`)
      navigate('play', { gameId, mode: 'online', roomCode: room.room_code, playerRole: 'X' })
    } catch (e) {
      setStatus(e.message || 'Could not create invite room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="simple-player-finder">
      <div className="finder-toolbar">
        <input className="games-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, username or suburb" />
        <button className="btn-primary" onClick={loadPlayers} disabled={loading}>Search</button>
      </div>
      <div className="finder-filters">
        <input className="games-search" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" />
        <input className="games-search" value={state} onChange={e => setState(e.target.value)} placeholder="State" />
        <input className="games-search" value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="Suburb" />
      </div>

      {status && <div className="rooms-status">{status}</div>}

      {loading ? (
        <div className="rooms-loading">Finding app users…</div>
      ) : players.length === 0 ? (
        <div className="rooms-empty">No users found. Clear filters or ask the other player to sign in once so their profile exists.</div>
      ) : (
        <div className="simple-player-list">
          {players.map(player => {
            const name = player.display_name || player.username || 'Player'
            const place = [player.suburb || player.town, player.state, player.country].filter(Boolean).join(', ')
            return (
              <div key={player.id} className="simple-player-row">
                <div className="player-avatar">👤</div>
                <div className="simple-player-main">
                  <b>{name}</b>
                  <span>{place || 'No location set'}</span>
                  <small>{player.is_online ? '🟢 Online now' : `Last seen ${labelSeen(player.last_seen)}`}</small>
                </div>
                <button className="btn-primary small" onClick={() => invitePlayer(player.id, name)} disabled={loading}>Invite</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
