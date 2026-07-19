import { useState } from 'react'
import { GAMES, CONSTRUCTION_GAMES, CATEGORIES, getGamePlayModes, PLAY_MODE_LABELS } from '../lib/games'


export default function GamesPage({ navigate, access }) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('main')
  const [secretTaps, setSecretTaps] = useState(0)
  const [showCasinoUnlock, setShowCasinoUnlock] = useState(false)
  const [casinoCode, setCasinoCode] = useState('')
  const [casinoError, setCasinoError] = useState('')

  const activeList = folder === 'construction' ? CONSTRUCTION_GAMES : GAMES

  const filtered = activeList.filter(game => {
    const searchText = search.trim().toLowerCase()
    const matchCategory = folder !== 'main' || filter === 'All' || game.type === filter
    const matchSearch = !searchText ||
      game.title?.toLowerCase().includes(searchText) ||
      game.desc?.toLowerCase().includes(searchText) ||
      game.type?.toLowerCase().includes(searchText)
    return matchCategory && matchSearch
  })

  const count = folder === 'construction' ? CONSTRUCTION_GAMES.length : GAMES.length

  function openGame(game) {
    if (!game?.id) return
    navigate('setup', { gameId: game.id })
  }

  function handleSecretCountClick() {
    const next = secretTaps + 1
    setSecretTaps(next)
    if (next >= 5) {
      setShowCasinoUnlock(true)
      setSecretTaps(0)
      setCasinoError('')
      setCasinoCode('')
    }
  }

  function unlockCasino(event) {
    event?.preventDefault?.()
    if (!access?.isFull) {
      setShowCasinoUnlock(false)
      setCasinoCode('')
      setCasinoError('')
      navigate('account')
      return
    }
    if (casinoCode.trim().toLowerCase() === 'confirm') {
      setShowCasinoUnlock(false)
      setCasinoCode('')
      setCasinoError('')
      navigate('play', { gameId: 'vault-casino', mode: 'alone', playerRole: 'X' })
      return
    }
    setCasinoError('Type CONFIRM to open this subscriber-only room.')
  }

  return (
    <div className="page games-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('home')}>← Home</button>
        <h2 className="page-title">🎮 Game Vault</h2>
        <button
          type="button"
          className="game-count"
          onClick={handleSecretCountClick}
          title="Game count"
          style={{ cursor: 'pointer', background: 'transparent' }}
        >
          {count} {count === 1 ? 'game' : 'games'}
        </button>
      </div>

      {showCasinoUnlock && (
        <div className="modal-backdrop" style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,.72)', display:'grid', placeItems:'center', padding:18 }}>
          <form onSubmit={unlockCasino} className="bv-card" style={{ width:'min(420px, 92vw)', padding:18, border:'1px solid rgba(239,68,68,.45)' }}>
            <h2 style={{ marginTop:0, color:'#fca5a5' }}>Restricted Room</h2>
            <p style={{ color:'#aaa', fontSize:13 }}>Subscriber-only virtual-credit room. Type CONFIRM to continue.</p>
            <input
              className="games-search"
              autoFocus
              type="password"
              value={casinoCode}
              onChange={e => setCasinoCode(e.target.value)}
              placeholder="Type CONFIRM"
            />
            {casinoError && <p style={{ color:'#f87171', fontSize:13 }}>{casinoError}</p>}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button className="btn-primary" type="submit">Unlock</button>
              <button className="btn-ghost" type="button" onClick={() => setShowCasinoUnlock(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}


      {!access?.isFull && <p className="demo-inline-note">Demo mode: online rooms, friends, chat, cloud saves and permanent game saves are locked until subscription is active.</p>}
      <div className="games-toolbar">
        <div className="category-tabs" style={{ marginBottom: 10 }}>
          <button className={`cat-tab ${folder === 'main' ? 'active' : ''}`} onClick={() => { setFolder('main'); setSearch('') }}>⭐ Featured Games</button>
          <button className={`cat-tab ${folder === 'construction' ? 'active' : ''}`} onClick={() => { setFolder('construction'); setSearch('') }}>🚧 Vault Workshop</button>
        </div>

        {folder === 'construction' && (
          <div className="bv-card" style={{ padding: 12, marginBottom: 10, border: '1px solid rgba(232,184,0,.25)' }}>
            <b style={{ color: '#e8b800' }}>Vault Workshop</b>
            <p style={{ margin: '6px 0 0', color: '#aaa', fontSize: 13 }}>
              These games are parked for salvage or rebuild later. They are not deleted; they are just kept away from the featured list so GamerTab feels cleaner.
            </p>
          </div>
        )}

        <input
          className="games-search"
          type="text"
          placeholder={folder === 'construction' ? 'Search workshop games…' : 'Search games…'}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        {folder === 'main' && (
          <div className="category-tabs">
            {['All', ...CATEGORIES].map(category => (
              <button key={category} className={`cat-tab ${filter === category ? 'active' : ''}`} onClick={() => setFilter(category)}>{category}</button>
            ))}
          </div>
        )}
      </div>

      <div className="games-grid">
        {filtered.map(game => (
          <button key={game.id} className={`game-card ${game.status || 'live'}`} onClick={() => openGame(game)}>
            <span className="game-card-emoji">{game.icon || '🎮'}</span>
            <span className="game-card-name">{game.title}</span>
            <div className="game-card-meta">
              <span className="game-card-players">👥 {game.players || '1+'}</span>
              <span className="game-card-type">{game.type || 'Game'}</span>
            </div>
            {game.desc && <p style={{ color: '#777', fontSize: 11, margin: '6px 0 0', lineHeight: 1.35 }}>{game.desc}</p>}
            <div className="game-card-modes full-five" title="Each game only shows the modes it actually supports">
              {getGamePlayModes(game.id).map(modeId => {
                const mode = PLAY_MODE_LABELS[modeId]
                return mode ? <span key={modeId} className={`mode-dot ${modeId}`}>{mode.icon} {mode.title.replace(' / Computer', '').replace('Multiplayer: ', '')}</span> : null
              })}
            </div>
            {game.status === 'scaffold' && <span className="game-card-badge">Soon</span>}
            {game.status === 'construction' && <span className="game-card-badge">Workshop</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="empty-state">No games found{search ? ` for "${search}"` : ''}.</p>}
    </div>
  )
}
