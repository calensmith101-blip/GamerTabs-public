import { useState, useCallback } from 'react'
import { createInitialState } from '../lib/roomState'

/**
 * LocalGameFrame
 * ──────────────
 * Wraps any game component for same-device pass-and-play.
 * No Supabase — pure React state.
 *
 * Props:
 *  - gameId       string
 *  - playerCount  number (default 2)
 *  - playerNames  string[]  — optional display names
 *  - onBack       () => void
 *  - children     (frameProps) => ReactElement
 */
export default function LocalGameFrame({ gameId, playerCount = 2, playerNames, onBack, children }) {
  const names = playerNames || ['Player 1', 'Player 2', 'Player 3', 'Player 4']
  const ROLES = ['X', 'O', 'A', 'B'].slice(0, playerCount)

  const [gameState, setGameState] = useState(() => createInitialState(gameId))
  const [turnIndex, setTurnIndex] = useState(0)

  const currentRole   = ROLES[turnIndex]
  const currentName   = names[turnIndex]

  const updateState = useCallback((newState) => {
    setGameState(newState)
    // Advance turn if state changed currentTurn
    if (newState.currentTurn) {
      const next = ROLES.indexOf(newState.currentTurn)
      if (next !== -1) setTurnIndex(next)
    }
  }, [ROLES])

  const resetGame = useCallback(() => {
    setGameState(createInitialState(gameId))
    setTurnIndex(0)
  }, [gameId])

  const frameProps = {
    gameState,
    updateState,
    resetGame,
    playerRole: currentRole,
    isMyTurn: true,               // local: always your turn (it's pass-and-play)
    roomCode: null,
    opponentPresent: true,
    isSpectator: false,
    gameMode: 'local',
    currentName,
    playerCount,
    playerNames: names,
    roles: ROLES,
  }

  const gameOver = gameState?.gameOver

  return (
    <div className="game-container">
      {/* Top bar */}
      <div className="game-topbar">
        <button className="btn-back" onClick={onBack}>← Games</button>
        <div className="game-meta">
          <span className="mode-chip">👥 Local</span>
          {ROLES.map((role, i) => (
            <span key={role} className={`role-chip ${role === currentRole && !gameOver ? 'active' : ''}`}>
              {names[i].split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Turn banner */}
      {!gameOver && (
        <div className="local-turn-banner">
          {currentName}'s turn ({currentRole}) — pass the device
        </div>
      )}

      {/* Game content */}
      {children(frameProps)}

      {/* Reset after game over */}
      {gameOver && (
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={resetGame}>
          Play Again
        </button>
      )}
    </div>
  )
}
