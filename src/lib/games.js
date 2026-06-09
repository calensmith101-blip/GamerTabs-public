// GamerTab: Black Vault — Featured Game Registry
// Cull pass: only the games Calen wants visible in the main app.


export const PLAY_MODE_LABELS = {
  single: { id: 'single', icon: '🧍', title: 'Single player', subtitle: 'Solo/offline mode where this game supports it.' },
  ai: { id: 'ai', icon: '🤖', title: 'AI / Computer', subtitle: 'Play against CPU players. Choose difficulty and player count where supported.' },
  local: { id: 'local', icon: '🎮', title: 'Same Device', subtitle: 'Offline pass-and-play on one device. Mix local humans and AI where supported.' },
}

export const GAME_PLAY_MODES = {
  'tictactoe': ['ai', 'local'],
  'connect-four': ['ai', 'local'],
  'memory-match': ['single', 'ai', 'local'],
  'checkers': ['single', 'ai', 'local'],
  'snakes-ladders': ['single', 'ai', 'local'],
  'sea-battle': ['single', 'ai', 'local'],
  'chess-trainer': ['single', 'ai', 'local'],
  'mansion-mystery': ['single', 'ai', 'local'],
  'kingdom-conquest': ['ai', 'local'],
  'city-tycoon': ['ai', 'local'],
  'mystery-faces': ['single', 'ai', 'local'],
  'uno-rush': ['single', 'ai', 'local'],
  'scrabble-vault': ['single', 'ai', 'local'],
  'blackjack-vault': ['single', 'ai', 'local'],
  'texas-holdem-vault': ['single', 'ai', 'local'],
  'backgammon-alley': ['single', 'ai', 'local'],
  'vault-dice': ['ai', 'local'],
  'uno-teams': ['ai', 'local'],
  'uno-no-mercy': ['ai', 'local'],
  'vault-casino': ['single'],
}

export function getGamePlayModes(gameId) {
  return GAME_PLAY_MODES[gameId] || ['single', 'ai', 'local']
}

export const GAMES = [
  { id: 'tictactoe', title: 'Tic Tac Toe', icon: '✖️', players: '2', type: 'Classic', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Classic 3-in-a-row battle.' },
  { id: 'connect-four', title: 'Connect 4', icon: '🔴', players: '2', type: 'Classic', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Drop discs and connect four in a row.' },
  { id: 'memory-match', title: 'Memory Match', icon: '🃏', players: '1–2', type: 'Classic', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Flip cards and match hidden pairs.' },
  { id: 'sea-battle', title: 'Sea Battle', icon: '⚓', players: '2', type: 'Classic', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Battleship-style fleet battle with one shot per turn.' },
  { id: 'snakes-ladders', title: 'Snakes & Ladders', icon: '🎲', players: '2–4', type: 'Classic', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Race to the finish through snakes and ladders.' },
  { id: 'checkers', title: 'Checkers', icon: '⬛', players: '2', type: 'Classic', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Classic diagonal capture game with kings.' },
  { id: 'chess-trainer', title: 'Chess', icon: '♟️', players: '2', type: 'Classic', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Chess with legal moves, check and checkmate.' },
  { id: 'mansion-mystery', title: 'Mystery Mansion', icon: '🏚️', players: '2–6', type: 'Board', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Cluedo-style mansion mystery: suspect, weapon and room.' },
  { id: 'kingdom-conquest', title: 'Kingdom Conquest', icon: '🗺️', players: '2-5', type: 'Board', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Risk-style world conquest map game with territories, armies, dice battles and continent bonuses.' },
  { id: 'city-tycoon', title: 'City Tycoon', icon: '🏙️', players: '2-5', type: 'Board', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Monopoly-style South Adelaide property game.' },
  { id: 'mystery-faces', title: 'Mystery Faces', icon: '🕵️', players: '2', type: 'Board', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Guess Who-style yes/no face deduction game.' },
  { id: 'uno-rush', title: 'UNO', icon: '🎴', players: '2–4', type: 'Card', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'UNO-style colour and action card game.' },
  { id: 'scrabble-vault', title: 'Scrabble', icon: '🔤', players: '2–4', type: 'Word', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Scrabble-style word board and tile rack.' },
  { id: 'blackjack-vault', title: 'Blackjack', icon: '🎰', players: '1–4', type: 'Card', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Blackjack / 21 against the dealer.' },
  { id: 'texas-holdem-vault', title: "Texas Hold'em", icon: '🃏', players: '2–4', type: 'Card', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: "Texas Hold'em poker with visible cards and table flow." },
  { id: 'backgammon-alley', title: 'Backgammon', icon: '🎲', players: '2', type: 'Classic', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Classic backgammon race with dice, bar and bearing off.' },
  { id: 'vault-dice', title: 'Yahtzee', icon: '🎲', players: '1–4', type: 'Dice', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Yahtzee-style dice scorecard game.' },
  { id: 'uno-teams', title: 'UNO Teams', icon: '🤝', players: '4', type: 'Card', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'UNO-style team variant. Uses the UNO engine for now.' },
  { id: 'uno-no-mercy', title: 'UNO No Mercy', icon: '🔥', players: '2–4', type: 'Card', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Harder UNO-style variant. Uses the UNO engine for now.' },
]


// 18+ virtual-credit casino lounge. No real-money deposits or withdrawals.
export const CASINO_GAMES = [
  { id: 'vault-casino', title: 'Vault Casino 18+', icon: '🎰', players: '1', type: '18+', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Virtual-credit slot lounge with age gate, wallet, and pokie-style reels.' },
]

// Construction Folder — hidden from the main vault, kept so we can salvage/rebuild later.
export const CONSTRUCTION_GAMES = [
  { id: 'dice-duel', title: 'Dice Duel', icon: '🎲', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'royal-dice-5', title: 'Royal Dice 5', icon: '🎲', players: '1–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'colour-clash', title: 'Colour Clash', icon: '⚫', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Reversi-style game parked for review.' },
  { id: 'domino-dash', title: 'Domino Dash', icon: '🁫', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'ludo-quest', title: 'Ludo Quest', icon: '🔵', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'flag-front', title: 'Flag Front', icon: '🚩', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'mancala-vault', title: 'Mancala Vault', icon: '🪨', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'pirate-plunder', title: 'Pirate Plunder', icon: '🏴‍☠️', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'mastermind', title: 'Mastermind', icon: '🧠', players: '1–2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'hangman-vault', title: 'Hangman Vault', icon: '🔤', players: '1', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'simon-chain', title: 'Simon Chain', icon: '🌈', players: '1', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'tile-rush', title: 'Tile Rush', icon: '🧩', players: '1–2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'nim-strike', title: 'Nim Strike', icon: '➖', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'word-vault', title: 'Word Vault', icon: '🔠', players: '1–2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'top-vault', title: 'Top Vault', icon: '🃏', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'depth-charge', title: 'Depth Charge', icon: '💣', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'vault-run', title: 'Vault Run', icon: '🏃', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'uno-vault', title: 'UNO Vault', icon: '🎴', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Alias parked while UNO main stays active.' },
  { id: 'yahtzee-vault', title: 'Yahtzee Vault', icon: '🎲', players: '1–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Alias parked while Yahtzee main stays active.' },
  { id: 'farm-claimers', title: 'Farm Claimers', icon: '🌾', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'trivia-blitz', title: 'Trivia Blitz', icon: '❓', players: '1–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'treasure-trail', title: 'Treasure Trail', icon: '💎', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'wizard-towers', title: 'Wizard Towers', icon: '🧙', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'reversi-lockdown', title: 'Reversi Lockdown', icon: '🔒', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'stone-war', title: 'Stone War', icon: '⚪', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'solo-cards', title: 'Solo Cards', icon: '♠️', players: '1', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'rummy-run', title: 'Rummy Run', icon: '♦️', players: '2–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'heartbreaker', title: 'Heartbreaker', icon: '♥️', players: '4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'shadow-spades', title: 'Shadow Spades', icon: '♠️', players: '4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'cribbage-counter', title: 'Cribbage Counter', icon: '🧮', players: '2', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'minefield', title: 'Minefield', icon: '💣', players: '1', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'zombie-outbreak', title: 'Zombie Outbreak', icon: '🧟', players: '1–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'escape-room', title: 'Escape Room', icon: '🔐', players: '1–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'biohazard-lab', title: 'Biohazard Lab', icon: '☣️', players: '1–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
  { id: 'word-quest', title: 'Word Quest', icon: '📚', players: '1–4', type: 'Construction', status: 'construction', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Parked for review.' },
]

export const ALL_GAMES = [...GAMES, ...CASINO_GAMES, ...CONSTRUCTION_GAMES]

export const getGame = (id) => ALL_GAMES.find(g => g.id === id)
export const CATEGORIES = [...new Set(GAMES.map(g => g.type))]

