import { useState, useEffect, useCallback } from 'react'
import { supabase, hasSupabaseConfig } from './supabaseClient'
import AuthPanel         from './components/AuthPanel'
import OfflineBanner     from './components/OfflineBanner'
import OfflineGuard      from './components/OfflineGuard'
import HomePage          from './pages/HomePage'
import GamesPage         from './pages/GamesPage'
import GameSetupPage     from './pages/GameSetupPage'
import GamePlayPage      from './pages/GamePlayPage'
import ProfilePage       from './pages/ProfilePage'
import FriendsPage       from './pages/FriendsPage'
import InviteCenter      from './components/InviteCenter'
import { useLocation }   from './hooks/useLocation'
import { useOffline }    from './hooks/useOffline'
import { createOfflineSession } from './lib/offline'

export default function App() {
  const [session, setSession]         = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage]               = useState('home')
  const [pageParams, setPageParams]   = useState({})
  const [navStack, setNavStack]         = useState([{ page: 'home', params: {} }])
  const offline = useOffline()

  // ── Auth state ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthLoading(false)
      return undefined
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setAuthLoading(false)
      })
      .catch(() => {
        // Auth session read from localStorage — this should not fail, but be safe
        setAuthLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Online presence heartbeat ────────────────────────────────────────────────
  useEffect(() => {
    if (!session || offline || !hasSupabaseConfig || !supabase) return

    const touchOnline = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', session.user.id)
      } catch (_) {}
    }

    touchOnline()
    const interval = setInterval(() => {
      if (navigator.onLine) touchOnline()
    }, 60_000)

    const handleBeforeUnload = () => {
      try {
        supabase
          .from('profiles')
          .update({ is_online: false })
          .eq('id', session.user.id)
          .then?.(() => {})
      } catch (_) {}
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      try {
        supabase
          .from('profiles')
          .update({ is_online: false })
          .eq('id', session.user.id)
          .then?.(() => {})
      } catch (_) {}
    }
  }, [session, offline])

  // Location tracking (online-only — hook already guards internally)
  useLocation(session?.user?.id)

  // ── Navigation ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.history.state?.gamertab) {
      window.history.replaceState({ gamertab: true, page: 'home' }, '')
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setNavStack(prev => {
        if (prev.length <= 1) return prev
        const next = prev.slice(0, -1)
        const target = next[next.length - 1] || { page: 'home', params: {} }
        setPage(target.page)
        setPageParams(target.params || {})
        window.scrollTo(0, 0)
        return next
      })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((pageName, params = {}, options = {}) => {
    const entry = { page: pageName, params: params || {} }
    setPage(pageName)
    setPageParams(params || {})
    setNavStack(prev => options.replace ? [...prev.slice(0, -1), entry] : [...prev, entry])
    if (!options.replace) {
      window.history.pushState({ gamertab: true, page: pageName }, '')
    } else {
      window.history.replaceState({ gamertab: true, page: pageName }, '')
    }
    window.scrollTo(0, 0)
  }, [])

  // ── Loading / auth guard ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-wrapper">
        <div className="loading-block">Entering the Vault…</div>
      </div>
    )
  }

  if (!session) {
    return (
      <AuthPanel
        offlineAvailable={!hasSupabaseConfig || offline}
        onContinueOffline={() => setSession(createOfflineSession())}
      />
    )
  }

  // ── Determine if current gameMode requires internet ─────────────────────────
  const isOnlineGameMode = pageParams?.mode === 'online' || pageParams?.mode === 'localLive'

  return (
    <div className="app-root">
      {/* Offline banner — fixed top, appears automatically */}
      <OfflineBanner />

      {/* Push content down when banner is visible */}
      {offline && <div style={{ height: 38 }} aria-hidden="true" />}

      {/* ── Pages ─────────────────────────────────────────────────────────── */}

      {page === 'home' && (
        <HomePage
          session={session}
          navigate={navigate}
        />
      )}

      {page === 'games' && (
        <GamesPage navigate={navigate} />
      )}

      {/* Setup page: soft-block when offline + online mode selected */}
      {page === 'setup' && (
        <OfflineGuard
          softBlock={!isOnlineGameMode}   // only hard-block if already in online mode
          message="Multiplayer rooms require an internet connection"
          onBack={() => navigate('games')}
        >
          <GameSetupPage session={session} navigate={navigate} params={pageParams} />
        </OfflineGuard>
      )}

      {/* Play page: hard-block online mode when offline; local/AI always work */}
      {page === 'play' && (
        isOnlineGameMode && offline ? (
          <OfflineGuard
            message="Multiplayer games require an internet connection"
            onBack={() => navigate('games')}
          />
        ) : (
          <GamePlayPage session={session} navigate={navigate} params={pageParams} />
        )
      )}

      {page === 'profile' && (
        <ProfilePage session={session} navigate={navigate} />
      )}


      {(page === 'friends' || page === 'friends-hub' || page === 'rooms') && (
        <FriendsPage session={session} navigate={navigate} params={pageParams} />
      )}

      {!offline && session && <InviteCenter session={session} navigate={navigate} />}
    </div>
  )
}
