// GamerTab: Black Vault — Room State Helpers
// Centralised source of truth for all game initial states and state transitions.

// ─── Initial states ──────────────────────────────────────────────────────────

function shuffleCards() {
  const syms = ['🦁','🐯','🦊','🐺','🦝','🦔','🐸','🦎','🦋','🐬','🦅','🐙','🌸','🍄','🔮','🗡️']
  const pairs = [...syms.slice(0,8), ...syms.slice(0,8)]
    .map((sym, i) => ({ id: i, symbol: sym }))
    .sort(() => Math.random() - 0.5)
  return pairs
}

function buildScorecard() {
  return {
    ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
    threeOfKind: null, fourOfKind: null, fullHouse: null,
    smallStraight: null, largeStraight: null, fiveOfKind: null, chance: null,
  }
}

const GAME_INITIAL = {
  'tictactoe': () => ({
    board: Array(9).fill(null),
    currentTurn: 'X', winner: null, gameOver: false, moveCount: 0,
  }),

  'tic-tac-toe': () => ({
    board: Array(9).fill(null),
    currentTurn: 'X', winner: null, gameOver: false, moveCount: 0,
  }),

  'connect-four': () => ({
    board: Array(6).fill(null).map(() => Array(7).fill(null)),
    currentTurn: 'X', winner: null, gameOver: false,
  }),

  'dice-duel': () => ({
    currentTurn: 'X',
    playerXDice: [], playerODice: [],
    scores: { X: 0, O: 0 },
    round: 1, maxRounds: 5,
    rolled: { X: false, O: false },
    winner: null, gameOver: false,
  }),

  'memory-match': () => ({
    cards: shuffleCards(),
    flipped: [], matched: [],
    currentTurn: 'X', scores: { X: 0, O: 0 },
    lockBoard: false, winner: null, gameOver: false,
  }),

  'sea-battle': () => ({
    phase: 'placement',
    grids: {
      X: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ({ shipId: null }))),
      O: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ({ shipId: null }))),
    },
    ready: { X: false, O: false },
    shots: { X: [], O: [] },
    currentTurn: 'X',
    winner: null,
    message: 'Both players must ready their fleets before battle.',
    log: ['Sea Battle room created. Ready fleets, then fire one shot per turn.'],
  }),

  'snakes-ladders': () => ({
    positions: { X: 0, O: 0 },
    currentTurn: 'X', lastRoll: null, lastEvent: '',
    history: [], winner: null, gameOver: false,
  }),

  'royal-dice-5': () => ({
    currentTurn: 'X',
    dice: Array(5).fill(null),
    held: Array(5).fill(false),
    rollsLeft: 3,
    scorecard: { X: buildScorecard(), O: buildScorecard() },
    round: 1, totalRounds: 13,
    winner: null, gameOver: false,
  }),

  'colour-clash': () => ({
    board: Array(36).fill(null),
    currentTurn: 'X', scores: { X: 0, O: 0 },
    winner: null, gameOver: false,
  }),
}

/** Default scaffold state for games without specific initial state. */
const defaultInitial = () => ({
  board: Array(64).fill(null),
  currentTurn: 'X', winner: null, gameOver: false, moveCount: 0, phase: 'playing',
})

/**
 * Get the starting state for any game.
 * @param {string} gameId
 * @returns {Object}
 */
export function createInitialState(gameId) {
  const fn = GAME_INITIAL[gameId]
  return fn ? fn() : defaultInitial()
}

// ─── Turn / role helpers ──────────────────────────────────────────────────────

/**
 * Is it this player's turn?
 * @param {Object} state - game state
 * @param {string} playerRole - 'X' | 'O'
 * @returns {boolean}
 */
export function isMyTurn(state, playerRole) {
  if (!state || !playerRole) return false
  return state.currentTurn === playerRole
}

/**
 * Is this user a spectator (not X or O in the room)?
 * @param {Object} room  - game_rooms row
 * @param {string} userId
 * @returns {boolean}
 */
export function isSpectator(room, userId) {
  if (!room || !userId) return true
  return room.player_x !== userId && room.player_o !== userId
}

/**
 * Derive player role from room row and userId.
 * @returns {'X' | 'O' | 'spectator'}
 */
export function deriveRole(room, userId) {
  if (!room || !userId) return 'spectator'
  if (room.player_x === userId) return 'X'
  if (room.player_o === userId) return 'O'
  return 'spectator'
}

// ─── Move appliers ───────────────────────────────────────────────────────────

/**
 * Apply a generic cell-click move on a flat board array.
 * Returns new state or null if move is illegal.
 */
export function applyBoardMove(state, cellIndex, player) {
  if (state.gameOver || state.board[cellIndex] || state.currentTurn !== player) return null
  const newBoard = [...state.board]
  newBoard[cellIndex] = player
  return {
    ...state,
    board: newBoard,
    currentTurn: player === 'X' ? 'O' : 'X',
    moveCount: (state.moveCount || 0) + 1,
  }
}

// ─── Game-over check ─────────────────────────────────────────────────────────

/** Quick check without importing full game logic — used for scaffolds. */
export function isGameOver(state) {
  return !!(state && state.gameOver)
}
