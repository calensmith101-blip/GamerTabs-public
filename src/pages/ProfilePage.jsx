import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { deriveStats } from '../lib/scoring'
import { isOfflineSession, loadOfflineProfile, saveOfflineProfile } from '../lib/offline'

function fallbackUsername(session) {
  return session?.user?.user_metadata?.username
    || session?.user?.user_metadata?.display_name
    || session?.user?.email?.split('@')?.[0]
    || 'Player'
}

function profileToForm(data, session) {
  const username = data?.username || fallbackUsername(session)
  return {
    username,
    displayName: data?.display_name || username,
    town: data?.town || '',
    stateRegion: data?.state || '',
    country: data?.country || '',
    localDiscovery: !!data?.local_discovery_enabled,
  }
}

export default function ProfilePage({ session, navigate }) {
  const [profile, setProfile]   = useState(null)
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({
    username: '', displayName: '', town: '', stateRegion: '', country: '', localDiscovery: false,
  })
  const [status, setStatus]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [discoverySaving, setDiscoverySaving] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    if (isOfflineSession(session)) {
      const data = loadOfflineProfile(session)
      setProfile(data)
      setForm(profileToForm(data, session))
      return
    }

    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => {
        const nextProfile = data || {
          id: session.user.id,
          username: fallbackUsername(session),
          display_name: fallbackUsername(session),
          points: 0,
          crowns: 0,
          level: 1,
          wins: 0,
          losses: 0,
          local_discovery_enabled: false,
        }
        setProfile(nextProfile)
        setForm(profileToForm(nextProfile, session))
      })
  }, [session])

  const save = async () => {
    if (!session?.user?.id || saving) return
    setSaving(true)
    const username = form.username.trim() || fallbackUsername(session)
    const displayName = form.displayName.trim() || username
    const payload = {
      id: session.user.id,
      username,
      display_name: displayName,
      town: form.town.trim(),
      state: form.stateRegion.trim(),
      country: form.country.trim(),
      local_discovery_enabled: form.localDiscovery,
    }

    if (isOfflineSession(session)) {
      const data = saveOfflineProfile({ ...profile, ...payload })
      setProfile(data)
      setForm(profileToForm(data, session))
      setEditing(false)
      setStatus('Profile saved!')
      setTimeout(() => setStatus(''), 3000)
      setSaving(false)
      return
    }

    const { data, error } = await supabase.from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle()

    if (error) {
      setStatus('⚠️ Save failed — ' + error.message)
    } else {
      await supabase.auth.updateUser({ data: { username, display_name: displayName } }).catch(() => {})
      setProfile(data || { ...profile, ...payload })
      setForm(profileToForm(data || payload, session))
      setEditing(false)
      setStatus('✓ Profile saved!')
      setTimeout(() => setStatus(''), 3000)
    }
    setSaving(false)
  }

  const toggleDiscovery = async () => {
    if (!session?.user?.id || discoverySaving) return
    const next = !profile?.local_discovery_enabled
    setDiscoverySaving(true)

    if (isOfflineSession(session)) {
      const data = saveOfflineProfile({ ...profile, local_discovery_enabled: next })
      setProfile(data)
      setForm(f => ({ ...f, localDiscovery: next }))
      setStatus(next ? 'Discovery is on.' : 'Discovery is off.')
      setTimeout(() => setStatus(''), 2500)
      setDiscoverySaving(false)
      return
    }

    const { data, error } = await supabase.from('profiles')
      .upsert({
        ...profile,
        id: session.user.id,
          username: profile?.username || fallbackUsername(session),
        display_name: profile?.display_name || profile?.username || fallbackUsername(session),
        local_discovery_enabled: next,
        is_online: true,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .maybeSingle()

    if (error) {
      setStatus('Discovery update failed - ' + error.message)
    } else {
      const updated = data || { ...profile, local_discovery_enabled: next }
      setProfile(updated)
      setForm(profileToForm(updated, session))
      setStatus(next ? 'Discovery is on.' : 'Discovery is off.')
      setTimeout(() => setStatus(''), 2500)
    }
    setDiscoverySaving(false)
  }

  const pts  = profile?.points || 0
  const { crowns, level, crownProgress, ptsIntoCrown } = deriveStats(pts)
  const wins     = profile?.wins   || 0
  const losses   = profile?.losses || 0
  const total    = wins + losses
  const winRate  = total ? Math.round((wins / total) * 100) : 0

  const InputRow = ({ label, value, onChange, placeholder, maxLength }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 5 }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength || 32}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#0f0f1a', color: '#e0e0e0',
          border: '1px solid #2a2a4a', borderRadius: 8,
          padding: '10px 12px', fontSize: 14,
          outline: 'none',
        }}
      />
    </div>
  )

  return (
    <div className="page profile-page" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('home')}>← Home</button>
        <h2 className="page-title">👤 Profile</h2>
      </div>

      {!profile ? (
        <div className="loading-block">Loading profile…</div>
      ) : (
        <div className="profile-body">

          {/* Avatar + name */}
          <div style={{
            textAlign: 'center', marginBottom: 24,
            padding: '20px 16px', background: 'rgba(255,255,255,.03)',
            borderRadius: 16, border: '1px solid rgba(255,255,255,.07)',
          }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🧙</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#e0e0e0' }}>
              {profile.display_name || profile.username}
            </h2>
            {profile.display_name && (
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#888' }}>@{profile.username}</p>
            )}
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>{session.user.email}</p>
            {(profile.town || profile.state || profile.country) && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                📍 {[profile.town, profile.state, profile.country].filter(Boolean).join(', ')}
              </p>
            )}
            <p style={{ margin: '4px 0 0', fontSize: 11, color: profile.local_discovery_enabled ? '#4caf50' : '#666' }}>
              {profile.local_discovery_enabled ? '🟢 Local Discovery: On' : '⚫ Local Discovery: Off'}
            </p>
            <button
              onClick={toggleDiscovery}
              disabled={discoverySaving}
              style={{
                marginTop: 10, padding: '7px 14px', borderRadius: 8,
                background: profile.local_discovery_enabled ? 'rgba(76,175,80,.12)' : 'rgba(255,255,255,.05)',
                border: profile.local_discovery_enabled ? '1px solid rgba(76,175,80,.35)' : '1px solid rgba(255,255,255,.14)',
                color: profile.local_discovery_enabled ? '#4caf50' : '#cfcfcf',
                fontSize: 13, cursor: discoverySaving ? 'default' : 'pointer',
                opacity: discoverySaving ? 0.65 : 1,
              }}>
              {discoverySaving ? 'Updating...' : profile.local_discovery_enabled ? 'Hide me from players' : 'Show me to players'}
            </button>
            {!editing && (
              <button
                style={{
                  marginTop: 12, padding: '7px 18px', borderRadius: 8,
                  background: 'rgba(232,184,0,.1)', border: '1px solid rgba(232,184,0,.3)',
                  color: '#e8b800', fontSize: 13, cursor: 'pointer',
                }}
                onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {/* Stats grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20,
          }}>
            {[
              { val: level, lbl: 'Level' },
              { val: pts,   lbl: 'Points' },
              { val: crowns,lbl: 'Crowns 👑' },
              { val: wins,  lbl: 'Wins',   color: '#4caf50' },
              { val: losses,lbl: 'Losses', color: '#f44336' },
              { val: winRate + '%', lbl: 'Win Rate' },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} style={{
                padding: '12px 8px', textAlign: 'center',
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.07)', borderRadius: 12,
              }}>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: color || '#e8b800' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(255,255,255,.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
              <span>Level {level} → {level + 1}</span>
              <span>{crownProgress}/3 crowns · {ptsIntoCrown}/100 pts</span>
            </div>
            <div style={{ height: 8, background: '#1a1a2e', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(crownProgress / 3) * 100}%`, background: 'linear-gradient(90deg, #e8b800, #f0c040)', borderRadius: 4 }} />
            </div>
          </div>

          {/* Edit form */}
          {editing && (
            <div style={{ marginBottom: 20, padding: '18px 16px', background: 'rgba(255,255,255,.03)', borderRadius: 16, border: '1px solid rgba(232,184,0,.2)' }}>
              <div style={{ color: '#e8b800', fontSize: 14, fontWeight: 'bold', marginBottom: 16 }}>Edit Profile</div>

              <InputRow label="Username *" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} placeholder="Your username" maxLength={24} />
              <InputRow label="Display Name" value={form.displayName} onChange={v => setForm(f => ({ ...f, displayName: v }))} placeholder="How others see you" maxLength={32} />
              <InputRow label="Town / City" value={form.town} onChange={v => setForm(f => ({ ...f, town: v }))} placeholder="e.g. Sydney" maxLength={32} />
              <InputRow label="State / Region" value={form.stateRegion} onChange={v => setForm(f => ({ ...f, stateRegion: v }))} placeholder="e.g. New South Wales" maxLength={32} />
              <InputRow label="Country" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} placeholder="e.g. Australia" maxLength={32} />

              {/* Local discovery toggle */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8 }}>Local Discovery</label>
                <div
                  onClick={() => setForm(f => ({ ...f, localDiscovery: !f.localDiscovery }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: form.localDiscovery ? 'rgba(76,175,80,.1)' : 'rgba(255,255,255,.04)',
                    border: form.localDiscovery ? '1px solid rgba(76,175,80,.4)' : '1px solid rgba(255,255,255,.1)',
                    borderRadius: 10, cursor: 'pointer',
                  }}>
                  <div style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.localDiscovery ? '#4caf50' : '#333',
                    position: 'relative', transition: 'background .2s',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3,
                      left: form.localDiscovery ? 23 : 3, transition: 'left .2s',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#e0e0e0' }}>
                      {form.localDiscovery ? '🟢 Enabled' : '⚫ Disabled'}
                    </div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      Show me to nearby players sorted by location
                    </div>
                  </div>
                </div>
              </div>

              {status && (
                <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: status.startsWith('⚠') ? '#f44336' : '#4caf50', background: status.startsWith('⚠') ? 'rgba(244,67,54,.1)' : 'rgba(76,175,80,.1)' }}>
                  {status}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={save} disabled={saving}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    background: 'rgba(232,184,0,.15)', border: '1px solid rgba(232,184,0,.4)',
                    color: '#e8b800', fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}>
                  {saving ? 'Saving…' : '💾 Save Profile'}
                </button>
                <button
                  onClick={() => { setEditing(false); setStatus(''); }}
                  style={{
                    padding: '12px 20px', borderRadius: 10,
                    background: 'transparent', border: '1px solid #333',
                    color: '#888', fontSize: 14, cursor: 'pointer',
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status && !editing && (
            <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#4caf50', background: 'rgba(76,175,80,.1)' }}>
              {status}
            </div>
          )}

          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)',
              color: '#e74c3c', fontSize: 14, cursor: 'pointer',
            }}>
            🔓 Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
