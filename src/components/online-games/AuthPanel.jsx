import { useState } from 'react'
import supabase from '../supabaseClient'

export default function AuthPanel() {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [msg, setMsg]           = useState({ text: '', type: '' })
  const [loading, setLoading]   = useState(false)

  const setError   = (text) => setMsg({ text, type: 'error' })
  const setSuccess = (text) => setMsg({ text, type: 'success' })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setMsg({ text: '', type: '' })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setMsg({ text: '', type: '' })

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.trim() || email.split('@')[0],
        points: 0, crowns: 0, level: 1, wins: 0, losses: 0,
      }, { onConflict: 'id' })
      setSuccess('Account created! Check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-panel">
        <div className="auth-logo">
          <span className="auth-logo-icon">🏛️</span>
          <h1 className="auth-title">GamerTab</h1>
          <p className="auth-subtitle">Black Vault</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode==='login'?'active':''}`}    onClick={() => { setMode('login');    setMsg({text:'',type:''}) }}>Sign In</button>
          <button className={`auth-tab ${mode==='register'?'active':''}`} onClick={() => { setMode('register'); setMsg({text:'',type:''}) }}>Register</button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} maxLength={24} />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'} value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {msg.text && <p className={`auth-message ${msg.type}`}>{msg.text}</p>}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <button className="auth-switch" onClick={() => { setMode(mode==='login'?'register':'login'); setMsg({text:'',type:''}) }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
