import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { getGame } from '../lib/games'
import { acceptNudge, declineNudge, fetchPendingNudges, subscribeToNudges } from '../lib/nudges'
import { joinUniversalRoom, normaliseCode, playerRoleForRoom, setRoomGame } from '../lib/socialUtils'

function isInvite(n) {
  return !!(n?.room_code || n?.game_id)
}

function timeLabel(value) {
  try {
    const d = value ? new Date(value) : null
    if (!d || Number.isNaN(d.getTime())) return 'now'
    const mins = Math.round((Date.now() - d.getTime()) / 60000)
    if (mins <= 1) return 'now'
    if (mins < 60) return `${mins}m`
    if (mins < 1440) return `${Math.round(mins / 60)}h`
    return `${Math.round(mins / 1440)}d`
  } catch {
    return 'now'
  }
}

function playInviteSound(kind = 'vault') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const master = ctx.createGain()
    master.gain.value = 0.08
    master.connect(ctx.destination)

    const patterns = {
      vault: [440, 660, 520],
      pulse: [700, 700, 420],
      retro: [330, 495, 990],
    }
    const notes = patterns[kind] || patterns.vault
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = i === 1 ? 'triangle' : 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.11)
      gain.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + i * 0.11 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.11 + 0.1)
      osc.connect(gain)
      gain.connect(master)
      osc.start(ctx.currentTime + i * 0.11)
      osc.stop(ctx.currentTime + i * 0.11 + 0.12)
    })
    setTimeout(() => ctx.close?.(), 700)
  } catch (_) {}
}

async function showBrowserNotification(nudge) {
  try {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    const game = getGame(nudge.game_id)
    const note = new Notification('GamerTabs invite', {
      body: nudge.message || `${game?.title || 'Game'} invite received`,
      tag: `gt-invite-${nudge.id || nudge.room_code}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
    setTimeout(() => note.close?.(), 9000)
  } catch (_) {}
}

export default function InviteCenter({ session, navigate }) {
  const userId = session?.user?.id
  const [open, setOpen] = useState(false)
  const [nudges, setNudges] = useState([])
  const [status, setStatus] = useState('')
  const [sound, setSound] = useState(() => localStorage.getItem('gtInviteSound') || 'vault')
  const loadedRef = useRef(false)

  const pendingInvites = useMemo(() => nudges.filter(n => isInvite(n) && ['unread', 'read'].includes(n.status || 'unread')), [nudges])

  useEffect(() => {
    localStorage.setItem('gtInviteSound', sound)
  }, [sound])

  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false
    async function load() {
      try {
        const data = await fetchPendingNudges(supabase, userId)
        if (!cancelled) setNudges(Array.isArray(data) ? data : [])
      } catch (_) {}
      loadedRef.current = true
    }
    load()
    const timer = setInterval(load, 5000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [userId])

  useEffect(() => {
    if (!userId) return undefined
    try {
      return subscribeToNudges(supabase, userId, (nudge) => {
        setNudges(prev => [nudge, ...prev.filter(n => n.id !== nudge.id)])
        setOpen(true)
        playInviteSound(sound)
        showBrowserNotification(nudge)
      })
    } catch (_) {
      return undefined
    }
  }, [userId, sound])

  async function enableBrowserAlerts() {
    setStatus('')
    try {
      if (!('Notification' in window)) return setStatus('This browser does not support notifications.')
      const result = await Notification.requestPermission()
      setStatus(result === 'granted' ? 'Phone/browser notifications enabled while the app is active.' : 'Notification permission was not enabled.')
    } catch (e) {
      setStatus(e.message || 'Could not enable notifications.')
    }
  }

  async function acceptInvite(nudge) {
    setStatus('Joining invite…')
    try {
      const code = normaliseCode(nudge.room_code)
      let room = await joinUniversalRoom(code, userId)
      const gameId = getGame(room.game_type) && room.game_type !== 'room' ? room.game_type : nudge.game_id
      room = await setRoomGame(code, gameId)
      try { await acceptNudge(supabase, nudge.id) } catch (_) {}
      const role = playerRoleForRoom(room, userId)
      const slots = Array.isArray(room.state?.playerSlots) ? room.state.playerSlots : []
      setNudges(prev => prev.map(n => n.id === nudge.id ? { ...n, status: 'accepted' } : n))
      setOpen(false)
      navigate('play', {
        gameId,
        mode: 'localLive',
        roomCode: room.room_code || code,
        playerRole: role,
        playerCount: Math.max(slots.length || 2, Number(room.state?.setup?.playerCount) || 2),
      })
    } catch (e) {
      setStatus(e.message || 'Could not join invite.')
    }
  }

  async function dismissInvite(nudge) {
    try {
      await declineNudge(supabase, nudge.id)
      setNudges(prev => prev.map(n => n.id === nudge.id ? { ...n, status: 'declined' } : n))
    } catch (e) {
      setStatus(e.message || 'Could not dismiss invite.')
    }
  }

  return (
    <>
      <button className="invite-fab" onClick={() => setOpen(v => !v)} aria-label="Game invites">
        🔔
        {pendingInvites.length > 0 && <span>{pendingInvites.length}</span>}
      </button>
      {open && <div className="invite-drawer">
        <div className="invite-drawer-head">
          <div><b>Live Invites</b><small>Sent and received game alerts</small></div>
          <button className="btn-ghost small" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="invite-settings-row">
          <button className="btn-primary small" onClick={enableBrowserAlerts}>Enable phone alerts</button>
          <select value={sound} onChange={e => setSound(e.target.value)}>
            <option value="vault">Vault ping</option>
            <option value="pulse">Pulse chirp</option>
            <option value="retro">Retro blip</option>
          </select>
          <button className="btn-ghost small" onClick={() => playInviteSound(sound)}>Test</button>
        </div>
        {status && <p className="invite-status">{status}</p>}
        <div className="invite-list">
          {pendingInvites.length === 0 && <p className="empty-state">No live invites yet. Invite friends from inside a game.</p>}
          {pendingInvites.map(n => {
            const game = getGame(n.game_id)
            return <div className="invite-card" key={n.id || `${n.room_code}-${n.created_at}`}>
              <div className="invite-game-icon">{game?.icon || '🎮'}</div>
              <div className="invite-card-main">
                <b>{game?.title || 'Game invite'}</b>
                <span>{n.message || 'You have been invited to play.'}</span>
                <small>{n.room_code ? `Code ${n.room_code} · ` : ''}{timeLabel(n.created_at)}</small>
              </div>
              <div className="invite-actions">
                {n.room_code && <button className="btn-primary small" onClick={() => acceptInvite(n)}>Join</button>}
                <button className="btn-ghost small" onClick={() => dismissInvite(n)}>Dismiss</button>
              </div>
            </div>
          })}
        </div>
      </div>}
    </>
  )
}
