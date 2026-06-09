import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useOnlineGame } from '../../hooks/useOnlineGame'

const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

const INITIAL = {
  board: Array(9).fill(null),
  currentTurn: 'X',
  winner: null,
  gameOver: false,
  moveCount: 0,
}

function checkWinner(board) {
  for (const [a,b,c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  if (board.every(Boolean)) return 'draw'
  return null
}

function getWinLine(board) {
  for (const line of LINES) {
    const [a,b,c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line
  }
  return []
}

function aiMove(board, difficulty) {
  const empty = board.reduce((acc, v, i) => { if (!v) acc.push(i); return acc }, [])
  if (!empty.length) return -1

  if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)]

  // Try to win
  for (const [a,b,c] of LINES) {
    const vals = [board[a], board[b], board[c]]
    const empties = [a,b,c].filter(i => !board[i])
    if (vals.filter(v => v === 'O').length === 2 && empties.length === 1) return empties[0]
  }
  // Block player
  if (difficulty !== 'easy') {
    for (const [a,b,c] of LINES) {
      const vals = [board[a], board[b], board[c]]
      const empties = [a,b,c].filter(i => !board[i])
      if (vals.filter(v => v === 'X').length === 2 && empties.length === 1) return empties[0]
    }
  }
  // Take centre or corner
  if (difficulty === 'expert' || difficulty === 'hard') {
    if (!board[4]) return 4
    const corners = [0,2,6,8].filter(i => !board[i])
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)]
  }
  return empty[Math.floor(Math.random() * empty.length)]
}

export default function TicTacToe({ roomCode, playerRole, gameMode, difficulty, onBack, session }) {
  const isOnline = (gameMode === 'online' || gameMode === 'localLive') && !!roomCode
  const isAI     = gameMode === 'ai'

  const { gameState, updateState, loading } = useOnlineGame(isOnline ? roomCode : null, INITIAL)
  const [localState, setLocalState] = useState(INITIAL)

  const gs    = isOnline ? gameState : localState
  const setGs = isOnline ? updateState : setLocalState

  // AI moves
  useEffect(() => {
    if (!isAI || gs.currentTurn !== 'O' || gs.gameOver) return
    const t = setTimeout(() => {
      const idx = aiMove(gs.board, difficulty || 'medium')
      if (idx !== -1) applyMove(idx)
    }, 500)
    return () => clearTimeout(t)
  }, [gs.currentTurn, isAI, gs.gameOver])

  const applyMove = async (idx) => {
    if (gs.gameOver || gs.board[idx]) return

    const newBoard = [...gs.board]
    newBoard[idx]  = gs.currentTurn
    const winner   = checkWinner(newBoard)

    const next = {
      board: newBoard,
      currentTurn: gs.currentTurn === 'X' ? 'O' : 'X',
      winner,
      gameOver: !!winner,
      moveCount: (gs.moveCount || 0) + 1,
    }

    await setGs(next)
  }

  const handleClick = (idx) => {
    if (gs.gameOver || gs.board[idx]) return
    if (isOnline && gs.currentTurn !== playerRole) return
    applyMove(idx)
  }

  const handleReset = async () => { await setGs(INITIAL) }

  const winLine = gs.winner && gs.winner !== 'draw' ? getWinLine(gs.board) : []
  const onlineSeats = gs.playerSeats && typeof gs.playerSeats === 'object' ? gs.playerSeats : {}
  const onlineSlots = Array.isArray(gs.playerSlots) ? gs.playerSlots : []
  const hasOpponent = !isOnline || Boolean(
    onlineSeats.O ||
    onlineSlots.some(slot => slot.seat === 'O' && slot.userId) ||
    gs.player_o
  )

  const myTurn = isOnline
    ? gs.currentTurn === playerRole
    : true

  const statusText = gs.gameOver
    ? gs.winner === 'draw'
      ? '🤝 It\'s a draw!'
      : `🏆 ${gs.winner} wins!`
    : isOnline
      ? myTurn ? '⚡ Your turn' : '⏳ Opponent\'s turn'
      : `Turn: ${gs.currentTurn}`

  if (loading) return <div className="game-loading">Connecting to room…</div>

  return (
    <div className="game-container">
      <div className="game-topbar">
        <button className="btn-back" onClick={onBack}>← Games</button>
        {isOnline && (
          <div className="game-meta">
            <span className="room-chip">Room: {roomCode}</span>
            <span className="role-chip">You: {playerRole}</span>
          </div>
        )}
      </div>

      <h2 className="game-title">✖️ Tic Tac Toe</h2>
      <p className={`game-status ${gs.gameOver ? 'over' : myTurn ? 'my-turn' : ''}`}>{statusText}</p>

      <div className="ttt-board">
        {gs.board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${cell || ''} ${winLine.includes(i) ? 'winning' : ''} ${!cell && !gs.gameOver && (myTurn || !isOnline) ? 'clickable' : ''}`}
            onClick={() => handleClick(i)}
          >
            {cell}
          </button>
        ))}
      </div>

      {gs.gameOver && (
        <button className="btn-primary" onClick={handleReset}>Play Again</button>
      )}

      {isOnline && !hasOpponent && (
        <p className="waiting-msg">⏳ Waiting for opponent to join…</p>
      )}
    </div>
  )
}
