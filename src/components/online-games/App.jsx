import { useState, useEffect } from 'react'
import supabase from './supabaseClient'
import AuthPanel     from './components/AuthPanel'
import NudgePanel    from './components/NudgePanel'
import HomePage      from './pages/HomePage'
import GamesPage     from './pages/GamesPage'
import GameSetupPage from './pages/GameSetupPage'
import GamePlayPage  from './pages/GamePlayPage'
import ProfilePage   from './pages/ProfilePage'
import { subscribeToNudges } from './lib/nudges'

export default function App() {
  const [session, setSession]         = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage]               = useState('home')
  const [pageParams, setPageParams]   = useState({})
  const [nudgeBadge, setNudgeBadge]   = useState(0)
  const [showNudges, setShowNudges]   = useState(false)

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Nudge badge counter
  useEffect(() => {
    if (!session) return
    const unsub = subscribeToNudges(supabase, session.user.id, () => {
      setNudgeBadge(n => n + 1)
    })
    return unsub
  }, [session])

  const navigate = (pageName, params = {}) => {
    setPage(pageName)
    setPageParams(params)
    window.scrollTo(0, 0)
  }

  const handleJoinFromNudge = (gameId, roomCode) => {
    navigate('setup', { gameId, prefillRoomCode: roomCode, prefillMode: 'online' })
  }

  const clearBadge = () => { setNudgeBadge(0) }

  if (authLoading) {
    return (
      <div className="auth-wrapper">
        <div className="loading-block">Entering the Vault…</div>
      </div>
    )
  }

  if (!session) return <AuthPanel />

  return (
    <div className="app-root">
      {/* Global nudge badge button (shown on all pages except play) */}
      {page !== 'play' && (
        <button
          className={`nudge-fab ${nudgeBadge > 0 ? 'has-badge' : ''}`}
          onClick={() => { setShowNudges(true); clearBadge() }}
          aria-label="Game invites"
        >
          🔔
          {nudgeBadge > 0 && <span className="nudge-fab-badge">{nudgeBadge}</span>}
        </button>
      )}

      {/* Nudge overlay */}
      {showNudges && (
        <div className="nudge-overlay">
          <NudgePanel
            session={session}
            onJoinGame={handleJoinFromNudge}
            onClose={() => setShowNudges(false)}
          />
        </div>
      )}

      {/* Pages */}
      {page === 'home'    && <HomePage      session={session} navigate={navigate} nudgeBadge={nudgeBadge} onOpenNudges={() => { setShowNudges(true); clearBadge() }} />}
      {page === 'games'   && <GamesPage                      navigate={navigate} />}
      {page === 'setup'   && <GameSetupPage session={session} navigate={navigate} params={pageParams} />}
      {page === 'play'    && <GamePlayPage  session={session} navigate={navigate} params={pageParams} />}
      {page === 'profile' && <ProfilePage   session={session} navigate={navigate} />}
    </div>
  )
}
