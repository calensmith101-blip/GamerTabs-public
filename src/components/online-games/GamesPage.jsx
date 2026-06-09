import { useState } from 'react'
import { GAMES, CONSTRUCTION_GAMES, CATEGORIES } from '../lib/games'

export default function GamesPage({ navigate }) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('main')

  const activeList = folder === 'construction' ? CONSTRUCTION_GAMES : GAMES
  const filtered = activeList.filter(g => {
    const matchCat    = folder === 'construction' || filter === 'All' || g.type === filter
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="page games-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('home')}>← Home</button>
        <h2 className="page-title">🎮 Game Vault</h2>
        <span className="game-count">{folder === 'construction' ? CONSTRUCTION_GAMES.length : GAMES.length} games</span>
      </div>

      <div className="games-toolbar">
        <div className="category-tabs" style={{ marginBottom: 10 }}>
          <button className={`cat-tab ${folder === 'main' ? 'active' : ''}`} onClick={() => setFolder('main')}>⭐ Featured Games</button>
          <button className={`cat-tab ${folder === 'construction' ? 'active' : ''}`} onClick={() => setFolder('construction')}>🚧 Construction Folder</button>
        </div>

        {folder === 'construction' && (
          <div className="bv-card" style={{ padding: 12, marginBottom: 10, border: '1px solid rgba(232,184,0,.25)' }}>
            <b style={{ color: '#e8b800' }}>Construction Folder</b>
            <p style={{ margin: '6px 0 0', color: '#aaa', fontSize: 13 }}>
              These games are parked for salvage/rebuild later. They are not deleted — they are just kept away from the main featured list so GamerTab feels cleaner.
            </p>
          </div>
        )}

        <input
          className="games-search"
          type="text"
          placeholder={folder === 'construction' ? 'Search construction games…' : 'Search games…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {folder === 'main' && (
          <div className="category-tabs">
            {['All', ...CATEGORIES].map(cat => (
              <button key={cat} className={`cat-tab ${filter===cat?'active':''}`} onClick={() => setFilter(cat)}>{cat}</button>
            ))}
          </div>
        )}
      </div>

      <div className="games-grid">
        {filtered.map(game => (
          <button
            key={game.id}
            className={`game-card ${game.status}`}
            onClick={() => navigate('setup', { gameId: game.id })}
          >
            <span className="game-card-emoji">{game.icon}</span>
            <span className="game-card-name">{game.title}</span>
            <div className="game-card-meta">
              <span className="game-card-players">👥 {game.players}</span>
              <span className="game-card-type">{game.type}</span>
            </div>
            {game.desc && <p style={{ color: '#777', fontSize: 11, margin: '6px 0 0', lineHeight: 1.35 }}>{game.desc}</p>}
            <div className="game-card-modes">
              {game.supportsOnline && <span className="mode-dot online" title="Online">🌐</span>}
              {game.supportsAI     && <span className="mode-dot ai"     title="vs AI">🤖</span>}
              {game.supportsLocal  && <span className="mode-dot local"  title="Local">👥</span>}
            </div>
            {game.status === 'scaffold' && <span className="game-card-badge">Soon</span>}
            {game.status === 'construction' && <span className="game-card-badge">Construction</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="empty-state">No games found for "{search}"</p>
      )}
    </div>
  )
}
