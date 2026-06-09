// GamerTab: Black Vault — AI Move Library
// Pure functions — no network, no side effects.
// Difficulty: easy | medium | hard | expert

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Pick a random item from an array. */
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Return a random legal move index from a list of available moves. */
export function randomMove(validMoves) {
  if (!validMoves || !validMoves.length) return null
  return randomChoice(validMoves)
}

// ─── Tic Tac Toe ─────────────────────────────────────────────────────────────

const TTT_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

function tttFindWinMove(board, mark) {
  for (const [a,b,c] of TTT_LINES) {
    const cells = [board[a], board[b], board[c]]
    const indices = [a, b, c]
    const marks = cells.filter(v => v === mark).length
    const blanks = indices.filter(i => !board[i])
    if (marks === 2 && blanks.length === 1) return blanks[0]
  }
  return null
}

/** Easy: random legal cell. */
export function easyTicTacToeMove(board) {
  const empty = board.map((v, i) => v ? -1 : i).filter(i => i >= 0)
  return randomMove(empty)
}

/** Medium: win > block > centre > corner > random. */
export function mediumTicTacToeMove(board) {
  const win   = tttFindWinMove(board, 'O')
  if (win !== null) return win
  const block = tttFindWinMove(board, 'X')
  if (block !== null) return block
  if (!board[4]) return 4
  const corners = [0,2,6,8].filter(i => !board[i])
  if (corners.length) return randomChoice(corners)
  return easyTicTacToeMove(board)
}

/** Hard: minimax (full depth, Tic Tac Toe is small enough). */
function minimax(board, isMax) {
  const winner = tttCheckWinner(board)
  if (winner === 'O') return 10
  if (winner === 'X') return -10
  const empty = board.map((v, i) => v ? -1 : i).filter(i => i >= 0)
  if (!empty.length) return 0

  let best = isMax ? -Infinity : Infinity
  for (const i of empty) {
    const b = [...board]; b[i] = isMax ? 'O' : 'X'
    const score = minimax(b, !isMax)
    best = isMax ? Math.max(best, score) : Math.min(best, score)
  }
  return best
}

function tttCheckWinner(board) {
  for (const [a,b,c] of TTT_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}

export function hardTicTacToeMove(board) {
  const empty = board.map((v, i) => v ? -1 : i).filter(i => i >= 0)
  let best = -Infinity, move = empty[0]
  for (const i of empty) {
    const b = [...board]; b[i] = 'O'
    const score = minimax(b, false)
    if (score > best) { best = score; move = i }
  }
  return move
}

/** Dispatcher — picks the right function by difficulty. */
export function ticTacToeAI(board, difficulty) {
  switch (difficulty) {
    case 'hard':
    case 'expert': return hardTicTacToeMove(board)
    case 'medium': return mediumTicTacToeMove(board)
    default:       return easyTicTacToeMove(board)
  }
}

// ─── Connect Four ────────────────────────────────────────────────────────────

const CF_ROWS = 6, CF_COLS = 7

function cfDrop(board, col, mark) {
  const b = board.map(r => [...r])
  for (let r = CF_ROWS - 1; r >= 0; r--) {
    if (!b[r][col]) { b[r][col] = mark; return { board: b, row: r } }
  }
  return null
}

function cfWins(board, row, col) {
  const m = board[row][col]
  const dirs = [[0,1],[1,0],[1,1],[1,-1]]
  for (const [dr, dc] of dirs) {
    let n = 1
    for (const s of [1,-1]) {
      let r = row + dr*s, c = col + dc*s
      while (r >= 0 && r < CF_ROWS && c >= 0 && c < CF_COLS && board[r][c] === m) { n++; r+=dr*s; c+=dc*s }
    }
    if (n >= 4) return true
  }
  return false
}

function cfValidCols(board) {
  return Array.from({ length: CF_COLS }, (_, c) => c).filter(c => !board[0][c])
}

function cfScoreCol(board, col, mark) {
  const res = cfDrop(board, col, mark)
  if (!res) return -Infinity
  if (cfWins(res.board, res.row, col)) return 1000
  // Prefer centre
  return 3 - Math.abs(col - 3)
}

/** Easy: random valid column. */
export function easyConnectFourMove(board) {
  return randomMove(cfValidCols(board))
}

/** Medium: win > block > centre preference. */
export function mediumConnectFourMove(board) {
  const valid = cfValidCols(board)
  for (const col of valid) {
    const res = cfDrop(board, col, 'O')
    if (res && cfWins(res.board, res.row, col)) return col
  }
  for (const col of valid) {
    const res = cfDrop(board, col, 'X')
    if (res && cfWins(res.board, res.row, col)) return col
  }
  return valid.sort((a, b) => cfScoreCol(board, b, 'O') - cfScoreCol(board, a, 'O'))[0]
}

export function connectFourAI(board, difficulty) {
  switch (difficulty) {
    case 'hard':
    case 'expert':
    case 'medium': return mediumConnectFourMove(board)
    default:       return easyConnectFourMove(board)
  }
}

// ─── Dice Duel ───────────────────────────────────────────────────────────────

/**
 * Bot always rolls — nothing to choose in Dice Duel except rolling.
 * Returns true (bot will roll).
 */
export function diceBotMove() {
  return true // always roll
}

// ─── Memory Match ─────────────────────────────────────────────────────────────

/**
 * memoryBotMove — pick two card indices to flip.
 * knownPairs: Map<symbol, indexFlippedPreviously> — bot "remembers" seen cards.
 *
 * @param {Array}  cards     - full card array
 * @param {Array}  matched   - already matched indices
 * @param {Map}    memory    - symbol → index of a previously-seen card
 * @returns {{ first: number, second: number }}
 */
export function memoryBotMove(cards, matched, memory) {
  const available = cards
    .map((c, i) => i)
    .filter(i => !matched.includes(i))

  if (available.length < 2) return { first: available[0], second: available[0] }

  // Check if we know a matching pair
  for (const idx of available) {
    const sym = cards[idx].symbol
    const partner = memory.get(sym)
    if (partner !== undefined && partner !== idx && available.includes(partner)) {
      return { first: idx, second: partner }
    }
  }

  // Else flip two random unknowns
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return { first: shuffled[0], second: shuffled[1] }
}

// ─── Sea Battle ───────────────────────────────────────────────────────────────

/**
 * Basic Sea Battle bot: random shot, avoids already-fired cells.
 * Hard mode: hunts adjacent cells after a hit.
 */
export function seaBattleAI(firedShots, lastHits, difficulty) {
  const SIZE = 6
  const total = SIZE * SIZE
  const all = Array.from({ length: total }, (_, i) => i).filter(i => !firedShots.includes(i))

  if (!all.length) return null

  if ((difficulty === 'hard' || difficulty === 'expert') && lastHits && lastHits.length) {
    const last = lastHits[lastHits.length - 1]
    const row = Math.floor(last / SIZE), col = last % SIZE
    const adjacent = [
      row > 0        ? (row-1)*SIZE + col : -1,
      row < SIZE-1   ? (row+1)*SIZE + col : -1,
      col > 0        ? row*SIZE + (col-1) : -1,
      col < SIZE-1   ? row*SIZE + (col+1) : -1,
    ].filter(i => i >= 0 && all.includes(i))
    if (adjacent.length) return randomChoice(adjacent)
  }

  return randomChoice(all)
}

// ─── Snakes & Ladders ─────────────────────────────────────────────────────────

/** Bot always rolls — pure luck game. Returns true. */
export function snakesLaddersBot() {
  return true // always roll
}
