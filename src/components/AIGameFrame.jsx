import { useState, useEffect, useCallback, useRef } from 'react'
import { createInitialState } from '../lib/roomState'
import {
  ticTacToeAI,
  connectFourAI,
  diceBotMove,
  memoryBotMove,
  seaBattleAI,
  snakesLaddersBot,
} from '../lib/aiPlayers'

// Map game IDs to their AI move functions
const AI_MOVE_FNS = {
  'tic-tac-toe':   (state, diff) => ({ type: 'board', idx: ticTacToeAI(state.board, diff) }),
  'connect-four':  (state, diff) => ({ type: 'col',   col: connectFourAI(state.board, diff) }),
  'dice-duel':     ()            => ({ type: 'roll' }),
  'snakes-ladders':()            => ({ type: 'roll' }),
  'sea-battle':    (state, diff) => ({
    type: 'shot',
    idx: seaBattleAI(state.shotsO || [], [], diff),
  }),
  'memory-match':  (state, _d, memory) => ({
    type: 'memory',
    ...memoryBotMove(state.cards, state.matched, memory),
  }),
}

/**
 * AIGameFrame
 * ───────────
 * Wraps a game for single-player vs AI.
 * Manages local state, fires AI moves automatically when it's the bot's turn.
 *
 * Props:
 *  - gameId       string
 *  - difficulty   'easy' | 'medium' | 'hard' | 'expert'
 *  - onBack       () => void
 *  - children     (frameProps) => ReactElement
 *
 * AI is always 'O'. Player is always 'X'.
 */
export default function AIGameFrame({ gameId, difficulty = 'medium', onBack, children }) {
  const [gameState, setGameState] = useState(() => createInitialState(gameId))
  const aiMemory = useRef(new Map()) // for memory match bot
  const [aiThinking, setAiThinking] = useState(false)

  const updateState = useCallback((newState) => {
    setGameState(newState)
  }, [])

  const resetGame = useCallback(() => {
    setGameState(createInitialState(gameId))
    aiMemory.current = new Map()
  }, [gameId])

  // AI auto-move trigger
  useEffect(() => {
    if (!gameState || gameState.gameOver) return
    if (gameState.currentTurn !== 'O') return
    if (aiThinking) return

    const aiDelay = difficulty === 'easy' ? 400 : difficulty === 'medium' ? 700 : 300

    setAiThinking(true)
    const t = setTimeout(() => {
      const moveFn = AI_MOVE_FNS[gameId]
      if (moveFn) {
        const move = moveFn(gameState, difficulty, aiMemory.current)
        // We expose the move via aiMoveEvent so the child component can apply it
        setGameState(prev => ({ ...prev, _aiMove: move, _aiMoveAt: Date.now() }))
      }
      setAiThinking(false)
    }, aiDelay)

    return () => { clearTimeout(t); setAiThinking(false) }
  }, [gameState?.currentTurn, gameState?.gameOver, gameState?.rollsLeft, gameId, difficulty])

  // Clear the _aiMove signal after the child consumes it
  const consumeAIMove = useCallback(() => {
    setGameState(prev => {
      const s = { ...prev }
      delete s._aiMove
      delete s._aiMoveAt
      return s
    })
  }, [])

  const frameProps = {
    gameState,
    updateState,
    resetGame,
    consumeAIMove,
    playerRole: 'X',
    isMyTurn: gameState?.currentTurn === 'X',
    roomCode: null,
    opponentPresent: true,
    isSpectator: false,
    gameMode: 'ai',
    difficulty,
    aiThinking,
    aiMemory: aiMemory.current,
  }

  const gameOver = gameState?.gameOver

  return (
    <div className="game-container">
      {/* Top bar */}
      <div className="game-topbar">
        <button className="btn-back" onClick={onBack}>← Games</button>
        <div className="game-meta">
          <span className="mode-chip">🤖 vs AI</span>
          <span className="role-chip">You: X</span>
          <span className={`diff-chip diff-${difficulty}`}>{difficulty}</span>
        </div>
      </div>

      {/* Thinking indicator */}
      {aiThinking && (
        <div className="ai-thinking-bar">🤖 AI is thinking…</div>
      )}

      {/* Turn indicator */}
      {!gameOver && (
        <div className={`turn-indicator ${frameProps.isMyTurn ? 'my-turn' : 'their-turn'}`}>
          {frameProps.isMyTurn ? '⚡ Your turn' : '🤖 AI\'s turn…'}
        </div>
      )}

      {/* Game */}
      {children(frameProps)}

      {gameOver && (
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={resetGame}>
          Play Again
        </button>
      )}
    </div>
  )
}
