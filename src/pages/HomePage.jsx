import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { deriveStats } from '../lib/scoring'
import { clearOfflineProfile, isOfflineSession, loadOfflineProfile } from '../lib/offline'

export default function HomePage({ session, navigate }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [localDiscoveryEnabled, setLocalDiscoveryEnabled] = useState(() => localStorage.getItem('gamertab_local_discovery') === 'true')
  const offline = isOfflineSession(session)

  useEffect(() => {
    const load = async () => {
      if (offline) {
        setProfile(loadOfflineProfile(session))
        setLoading(false)
        return
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!data) {
        const uname = session.user.email.split('@')[0]
        const { data: created } = await supabase.from('profiles')
          .upsert({ id: session.user.id, username: uname, points: 0, crowns: 0, level: 1, wins: 0, losses: 0 }, { onConflict: 'id' })
          .select().single()
        setProfile(created)
        if (created?.local_discovery_enabled !== undefined) setLocalDiscoveryEnabled(!!created.local_discovery_enabled)
      } else {
        setProfile(data)
        if (data?.local_discovery_enabled !== undefined) setLocalDiscoveryEnabled(!!data.local_discovery_enabled)
      }
      setLoading(false)
    }
    load()
  }, [session, offline])

  const pts = profile?.points || 0
  const { crowns, level, ptsIntoCrown } = deriveStats(pts)
  const crownPct = Math.round((ptsIntoCrown / 100) * 100)
  const wins = profile?.wins || 0
  const losses = profile?.losses || 0
  const total = wins + losses
  const winRate = total ? Math.round((wins / total) * 100) : 0


  const toggleLocalDiscovery = async () => {
    const next = !localDiscoveryEnabled
    setLocalDiscoveryEnabled(next)
    localStorage.setItem('gamertab_local_discovery', String(next))
    setProfile(prev => prev ? { ...prev, local_discovery_enabled: next } : prev)
    if (!offline && session?.user?.id) {
      await supabase.from('profiles').update({
        local_discovery_enabled: next,
        last_seen: new Date().toISOString(),
      }).eq('id', session.user.id).then().catch(() => {})
    }
  }

  const handleSignOut = async () => {
    if (offline) {
      clearOfflineProfile()
      window.location.reload()
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <div className="page home-page">
      <div className="home-header">
        <div className="home-logo">
          <span className="logo-icon">🏛️</span>
          <div>
            <h1 className="logo-title">GamerTab</h1>
            <p className="logo-sub">Black Vault</p>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-block">Loading vault…</div> : (
        <div className="home-body">
          <div className="stats-card">
            <div className="stats-avatar">
              <span className="avatar-icon">🧙</span>
              <div className="avatar-info">
                <h2 className="avatar-name">{profile?.username || session?.user?.email}</h2>
                <span className="avatar-level">Level {level} · {crowns} 👑 {offline ? '· Offline' : ''}</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item"><span className="stat-value">{pts}</span><span className="stat-label">Points</span></div>
              <div className="stat-item"><span className="stat-value">{crowns}</span><span className="stat-label">Crowns</span></div>
              <div className="stat-item"><span className="stat-value stat-wins">{wins}</span><span className="stat-label">Wins</span></div>
              <div className="stat-item"><span className="stat-value stat-losses">{losses}</span><span className="stat-label">Losses</span></div>
            </div>

            <div className="crown-progress-wrap">
              <div className="crown-progress-bar"><div className="crown-progress-fill" style={{ width: `${crownPct}%` }} /></div>
              <span className="crown-progress-label">{ptsIntoCrown}/100 pts to next crown · {winRate}% win rate</span>
            </div>

            <div className="recent-match">
              <span className="recent-label">Mode</span>
              <span className="recent-value">{offline ? 'Offline local / AI play ready' : 'Online vault connected'}</span>
            </div>

          </div>

          <div className="home-nav">
            <button className="home-nav-btn primary" onClick={() => navigate('games')}>
              <span className="nav-btn-icon">🎮</span><span>Play Games</span>
            </button>
            <button className="home-nav-btn" onClick={() => navigate('profile')}>
              <span className="nav-btn-icon">👤</span><span>My Profile</span>
            </button>
            <button className="home-nav-btn danger" onClick={handleSignOut}>
              <span className="nav-btn-icon">🔓</span><span>{offline ? 'Leave Offline Mode' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
