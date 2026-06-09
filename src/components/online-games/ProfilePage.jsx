import { useState, useEffect } from 'react'
import supabase from '../supabaseClient'
import { deriveStats } from '../lib/scoring'

export default function ProfilePage({ session, navigate }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [status, setStatus]   = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { setProfile(data); setUsername(data?.username || '') })
  }, [session])

  const save = async () => {
    const { data, error } = await supabase.from('profiles')
      .update({ username: username.trim() }).eq('id', session.user.id).select().single()
    if (error) { setStatus('Save failed'); return }
    setProfile(data); setEditing(false); setStatus('Saved!')
    setTimeout(() => setStatus(''), 2000)
  }

  const signOut = async () => { await supabase.auth.signOut() }

  const pts  = profile?.points || 0
  const { crowns, level, crownProgress, ptsIntoCrown } = deriveStats(pts)
  const wins   = profile?.wins   || 0
  const losses = profile?.losses || 0
  const total  = wins + losses
  const winRate = total ? Math.round((wins / total) * 100) : 0

  return (
    <div className="page profile-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('home')}>← Home</button>
        <h2 className="page-title">👤 Profile</h2>
      </div>

      {profile ? (
        <div className="profile-body">
          <div className="profile-avatar-block">
            <span className="profile-avatar-icon">🧙</span>
            {editing ? (
              <div className="profile-edit-row">
                <input value={username} onChange={e => setUsername(e.target.value)} className="profile-name-input" maxLength={24} autoFocus />
                <button className="btn-primary" onClick={save}>Save</button>
                <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            ) : (
              <div className="profile-name-row">
                <h2>{profile.username}</h2>
                <button className="btn-ghost small" onClick={() => setEditing(true)}>✏️ Edit</button>
              </div>
            )}
            <p className="profile-email">{session.user.email}</p>
            {status && <p className="profile-status">{status}</p>}
          </div>

          <div className="profile-stats-grid">
            <div className="profile-stat"><span className="ps-val">{level}</span><span className="ps-lbl">Level</span></div>
            <div className="profile-stat"><span className="ps-val">{pts}</span><span className="ps-lbl">Points</span></div>
            <div className="profile-stat"><span className="ps-val">{crowns}</span><span className="ps-lbl">Crowns 👑</span></div>
            <div className="profile-stat"><span className="ps-val wins">{wins}</span><span className="ps-lbl">Wins</span></div>
            <div className="profile-stat"><span className="ps-val losses">{losses}</span><span className="ps-lbl">Losses</span></div>
            <div className="profile-stat"><span className="ps-val">{winRate}%</span><span className="ps-lbl">Win Rate</span></div>
          </div>

          <div className="profile-progress-section">
            <div className="progress-label-row">
              <span>Progress to Level {level + 1}</span>
              <span>{crownProgress}/3 crowns</span>
            </div>
            <div className="profile-crown-bar">
              <div className="profile-crown-fill" style={{ width: `${(crownProgress / 3) * 100}%` }} />
            </div>
            <p className="progress-note">{ptsIntoCrown}/100 pts to next crown</p>
          </div>

          <div className="recent-match" style={{ marginTop: '1rem' }}>
            <span className="recent-label">Recent Matches</span>
            <span className="recent-value">No matches recorded yet</span>
          </div>

          <button className="btn-ghost danger-outline" style={{ marginTop: '2rem' }} onClick={signOut}>
            🔓 Sign Out
          </button>
        </div>
      ) : (
        <div className="loading-block">Loading profile…</div>
      )}
    </div>
  )
}
