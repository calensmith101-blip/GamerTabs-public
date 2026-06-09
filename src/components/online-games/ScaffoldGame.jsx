import { useState } from 'react'

/**
 * ScaffoldGame — safe placeholder for games not yet fully implemented.
 * No external hooks or lib imports — won't break if dependencies are missing.
 * Shows a clearly styled "coming soon" state with basic turn-pass interactivity.
 */
export default function ScaffoldGame({ gameMode, game, onBack, onExit }) {
  const exit = onBack || onExit || null
  const [turn, setTurn]   = useState('X')
  const [moves, setMoves] = useState(0)

  return (
    <div className="game-shell" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <div className="game-header">
        <h2 className="bv-title">
          {game?.icon || '🎮'} {game?.title || 'Game'}
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {exit && (
            <button className="bv-button secondary" onClick={exit}>Exit</button>
          )}
        </div>
      </div>

      <div style={{
        padding: '48px 24px',
        borderRadius: 14,
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.07)',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>{game?.icon || '🎮'}</div>
        <h3 style={{ color: '#e8b800', margin: '0 0 8px', fontSize: 18 }}>
          {game?.title || 'Game'}
        </h3>
        <p style={{ color: '#666', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
          {game?.desc || 'This game is being built — check back soon.'}
        </p>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: 20,
          background: 'rgba(200,16,16,.1)',
          border: '1px solid rgba(200,16,16,.25)',
          fontSize: 11,
          color: '#c0392b',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          In Development
        </div>
        <div style={{ fontSize: 12, color: '#444' }}>
          Mode: {gameMode || 'local'} · Moves: {moves}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          className="bv-button"
          onClick={() => { setTurn(t => t === 'X' ? 'O' : 'X'); setMoves(m => m + 1); }}
        >
          Pass Turn ({turn}'s turn)
        </button>
        <button
          className="bv-button secondary"
          onClick={() => { setTurn('X'); setMoves(0); }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
