import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
  fetchPendingNudges,
  subscribeToNudges,
  markNudgeRead,
  acceptNudge,
  declineNudge,
} from '../lib/nudges'
import { getGame } from '../lib/games'

function formatNudgeDate(value) {
  try {
    const d = value ? new Date(value) : null
    if (!d || Number.isNaN(d.getTime())) return 'Just now'
    return d.toLocaleString()
  } catch {
    return 'Just now'
  }
}

export default function NudgePanel({ session, onJoinGame, onClose }) {
  const [nudges, setNudges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!session?.user?.id) {
          if (!cancelled) setError('You need to be signed in to view notifications.')
          return
        }
        if (!supabase) {
          if (!cancelled) setError('Notifications need Supabase config. Local/offline play still works.')
          return
        }
        const data = await fetchPendingNudges(supabase, session.user.id)
        if (!cancelled) setNudges(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Notifications could not be loaded.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [session])

  useEffect(() => {
    if (!session?.user?.id || !supabase) return undefined
    try {
      const unsub = subscribeToNudges(supabase, session.user.id, (nudge) => {
        if (!nudge) return
        setNudges(prev => [nudge, ...prev])
        setToast(nudge)
        setTimeout(() => setToast(null), 6000)
      })
      return typeof unsub === 'function' ? unsub : undefined
    } catch (err) {
      setError(err?.message || 'Realtime notifications are not available right now.')
      return undefined
    }
  }, [session])

  const safeAction = async (fn, fallbackMessage = 'Notification action failed.') => {
    try { await fn() } catch (err) { setError(err?.message || fallbackMessage) }
  }

  const handleAccept = async (nudge) => {
    await safeAction(async () => {
      await acceptNudge(supabase, nudge.id)
      setNudges(prev => prev.map(n => n.id === nudge.id ? { ...n, status: 'accepted' } : n))
      if (nudge.room_code) onJoinGame && onJoinGame(nudge.game_id, nudge.room_code)
      onClose && onClose()
    }, 'Could not accept invite.')
  }

  const handleDecline = async (nudge) => {
    await safeAction(async () => {
      await declineNudge(supabase, nudge.id)
      setNudges(prev => prev.map(n => n.id === nudge.id ? { ...n, status: 'declined' } : n))
    }, 'Could not dismiss notification.')
  }

  const handleRead = async (nudge) => {
    await safeAction(async () => {
      await markNudgeRead(supabase, nudge.id)
      setNudges(prev => prev.map(n => n.id === nudge.id ? { ...n, status: 'read' } : n))
    }, 'Could not mark notification as read.')
  }

  const filtered = nudges.filter((nudge) => {
    const isInvite = !!nudge.room_code || !!nudge.game_id
    if (tab === 'messages') return !isInvite
    if (tab === 'invites') return isInvite
    return true
  })

  return (
    <>
      {toast && (
        <div className="nudge-toast">
          <span className="nudge-toast-icon">{toast.room_code ? '🎮' : '💬'}</span>
          <div className="nudge-toast-body">
            <strong>{toast.room_code ? 'Game invite' : 'New message'}</strong>
            <p>{toast.message || 'New notification'}</p>
          </div>
          <button className="nudge-toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className="nudge-panel">
        <div className="nudge-panel-header">
          <h3>🔔 Notifications</h3>
          {onClose && <button className="btn-ghost small" onClick={onClose}>✕ Close</button>}
        </div>

        <div className="rooms-tabs notifications-tabs">
          <button className={`rooms-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All</button>
          <button className={`rooms-tab ${tab === 'invites' ? 'active' : ''}`} onClick={() => setTab('invites')}>Invites</button>
          <button className={`rooms-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>Messages</button>
        </div>

        {loading && <p className="nudge-empty">Loading notifications…</p>}
        {!loading && error && (
          <div className="nudge-empty" style={{ color: '#fca5a5' }}>
            <b>Notifications unavailable</b><br />{error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="nudge-empty">No notifications yet. Invites and direct room messages will appear here.</p>
        )}

        <div className="nudge-list">
          {!error && filtered.map((nudge) => {
            const game = getGame(nudge.game_id)
            const isUnread = nudge.status === 'unread'
            const isInvite = !!nudge.room_code || !!nudge.game_id
            return (
              <div
                key={nudge.id || `${nudge.game_id}-${nudge.created_at}`}
                className={`nudge-item ${isUnread ? 'unread' : ''}`}
                onClick={() => isUnread && handleRead(nudge)}
              >
                <div className="nudge-item-icon">{isInvite ? (game?.icon || '🎮') : '💬'}</div>
                <div className="nudge-item-body">
                  <p className="nudge-item-msg">{nudge.message || 'Game invite'}</p>
                  <span className="nudge-item-game">{game?.title || (isInvite ? 'Game invite' : 'Message')}</span>
                  {nudge.room_code && <span className="nudge-item-room">Room: {nudge.room_code}</span>}
                  <span className="nudge-item-time">{formatNudgeDate(nudge.created_at)}</span>
                </div>
                <div className="nudge-item-actions">
                  {isInvite && nudge.room_code && nudge.status !== 'accepted' && (
                    <button className="btn-primary small" onClick={(e) => { e.stopPropagation(); handleAccept(nudge) }}>Join</button>
                  )}
                  {nudge.status !== 'declined' && (
                    <button className="btn-ghost small" onClick={(e) => { e.stopPropagation(); handleDecline(nudge) }}>
                      {isInvite ? 'Dismiss' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
