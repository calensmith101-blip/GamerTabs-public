import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOnlineGame } from '../../hooks/useOnlineGame'

const SEATS = ['X', 'O', 'P3', 'P4', 'P5']
const EMPTY_BOARD = () => Array.from({ length: 9 }, () => null)

function createTemplateState(players = ['X', 'O']) {
  return {
    board: EMPTY_BOARD(),
    players,
    turn: players[0] || 'X',
    phase: 'playing',
    moveCount: 0,
    winner: null,
    message: 'Template game ready.',
  }
}

function nextSeat(players, current) {
  const list = players?.length ? players : ['X', 'O']
  const index = Math.max(0, list.indexOf(current))
  return list[(index + 1) % list.length] || list[0]
}

function findWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]
  for (const line of lines) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  if (board.every(Boolean)) return 'draw'
  return null
}

function chooseAiMove(board) {
  const open = board.map((value, index) => value ? null : index).filter(value => value !== null)
  if (!open.length) return null
  return open[Math.floor(Math.random() * open.length)]
}

function normaliseSlots(playerSlots, playerCount) {
  const count = Math.max(2, Math.min(5, Number(playerCount) || playerSlots?.length || 2))
  if (Array.isArray(playerSlots) && playerSlots.length) return playerSlots.slice(0, count)
  return SEATS.slice(0, count).map((seat, index) => ({
    seat,
    kind: index === 0 ? 'human' : 'local',
    userId: null,
    label: index === 0 ? 'You' : `Player ${index + 1}`,
  }))
}

export default function GenericGameTemplate({
  roomCode,
  playerRole = 'X',
  playerSlots = [],
  playerCount = 2,
  gameMode,
  difficulty,
  game,
  session,
  onBack,
  onExit,
}) {
  const mode = String(gameMode || '').toLowerCase()
  const isOnline = !!roomCode && (mode.includes('online') || mode.includes('live'))
  const isAiMode = mode.includes('ai') || mode.includes('computer')
  const slots = useMemo(() => normaliseSlots(playerSlots, playerCount), [playerSlots, playerCount])
  const players = useMemo(() => slots.map(slot => slot.seat).filter(Boolean), [slots])
  const initialState = useMemo(() => createTemplateState(players), [players.join('|')])
  const onlineGame = useOnlineGame(isOnline ? roomCode : null, initialState)
  const [localState, setLocalState] = useState(initialState)
  const state = isOnline ? (onlineGame.gameState || initialState) : localState
  const exit = onBack || onExit || null

  const roomSeatUsers = state.playerSeats && typeof state.playerSeats === 'object' ? state.playerSeats : {}
  const activeSlots = Array.isArray(state.playerSlots) && state.playerSlots.length ? state.playerSlots : slots
  const aiSeats = activeSlots.filter(slot => slot.kind === 'ai').map(slot => slot.seat)
  const localHumanSeats = isAiMode ? [players[0] || 'X'] : players
  const isAiSeat = useCallback((seat) => {
    if (isOnline) return aiSeats.includes(seat)
    return isAiMode && !localHumanSeats.includes(seat)
  }, [aiSeats.join('|'), isAiMode, isOnline, localHumanSeats.join('|')])

  const ownsSeat = useCallback((seat) => {
    if (!isOnline) return true
    return String(playerRole) === String(seat) || String(roomSeatUsers?.[seat]) === String(session?.user?.id)
  }, [isOnline, playerRole, roomSeatUsers, session?.user?.id])

  const commit = useCallback(async (next) => {
    if (isOnline) {
      await onlineGame.updateState(next)
    } else {
      setLocalState(next)
    }
  }, [isOnline, onlineGame])

  const playCell = useCallback(async (index, forcedSeat = null) => {
    const seat = forcedSeat || state.turn
    if (state.winner || state.phase !== 'playing') return
    if (state.board[index]) return
    if (!isAiSeat(seat) && !ownsSeat(seat)) return

    const nextBoard = [...state.board]
    nextBoard[index] = seat
    const winner = findWinner(nextBoard)
    const next = {
      ...state,
      board: nextBoard,
      turn: winner ? state.turn : nextSeat(state.players || players, seat),
      moveCount: (state.moveCount || 0) + 1,
      winner,
      phase: winner ? 'complete' : 'playing',
      message: winner
        ? winner === 'draw' ? 'Game ended in a draw.' : `${winner} wins.`
        : `${nextSeat(state.players || players, seat)} to move.`,
    }
    await commit(next)
  }, [commit, isAiSeat, ownsSeat, players, state])

  useEffect(() => {
    if (state.winner || state.phase !== 'playing') return undefined
    if (!isAiSeat(state.turn)) return undefined
    const timer = setTimeout(() => {
      const move = chooseAiMove(state.board)
      if (move !== null) playCell(move, state.turn)
    }, difficulty === 'easy' ? 700 : 450)
    return () => clearTimeout(timer)
  }, [difficulty, isAiSeat, playCell, state.board, state.phase, state.turn, state.winner])

  async function reset() {
    await commit(createTemplateState(players))
  }

  const myTurn = !isAiSeat(state.turn) && ownsSeat(state.turn)

  return (
    <div className="game-shell" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="game-header">
        <h2 className="bv-title">{game?.icon || 'GT'} {game?.title || 'Generic Game Template'}</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {isOnline && (
        <div className="bv-notice">
          Live room {roomCode}. You are {playerRole || 'spectator'}.
        </div>
      )}

      <div className={`game-status ${myTurn ? 'my-turn' : ''}`}>
        {onlineGame.loading ? 'Connecting...' : state.message}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(72px, 1fr))',
        gap: 8,
        maxWidth: 360,
        margin: '16px auto',
      }}>
        {state.board.map((cell, index) => (
          <button
            key={index}
            className="bv-button secondary"
            disabled={!!cell || !!state.winner || (!myTurn && !isAiSeat(state.turn))}
            onClick={() => playCell(index)}
            style={{
              aspectRatio: '1 / 1',
              fontSize: 24,
              borderColor: cell ? 'rgba(232,184,0,.45)' : 'rgba(255,255,255,.12)',
            }}
          >
            {cell || ''}
          </button>
        ))}
      </div>

      <div className="slot-preview friendly-slot-preview">
        {activeSlots.map(slot => (
          <span key={slot.seat} className={`slot-pill ${slot.kind}`}>
            <b>{slot.seat}</b> {slot.kind === 'ai' ? 'AI' : slot.label || 'Player'}
          </span>
        ))}
      </div>
    </div>
  )
}
