
const DEFAULT_RULES = {
  objective: 'Be the player or team that reaches the win condition shown in the game status panel.',
  setup: [
    'Choose a mode on the setup page.',
    'Press New Game or Reset if you want a fresh round.',
  ],
  turn: [
    'Follow the highlighted turn and use only the legal controls shown on screen.',
    'In AI mode, wait for the computer move after your turn.',
  ],
  tips: [
    'Use the status panel to see whose turn it is and what action is expected next.',
    'Most games include a reset button and a move log or summary panel.',
  ],
};

export const GAME_RULES = {
  'mansion-mystery': {
    objective: 'Solve the case by correctly identifying the suspect, weapon, and room before your rival.',
    setup: [
      'One suspect, one weapon, and one room are hidden in the confidential case file.',
      'The remaining cards are split between the players.',
      'Roll to move between rooms on the mansion graph.',
    ],
    turn: [
      'Roll the dice, then move to any reachable room exactly that many steps away.',
      'While in a room, make a suggestion naming a suspect, a weapon, and the room you are in.',
      'The other player must reveal one matching card if possible.',
      'When you are confident, make a full accusation. A wrong accusation loses immediately.',
    ],
    tips: [
      'Mark every card you hold in your notes so you never accuse with your own evidence.',
      'Suggestions that cannot be disproved are the strongest clues.',
    ],
  },
  'ludo-quest': {
    objective: 'Get all four of your tokens from the yard to home before the other side.',
    setup: [
      'Each side begins with four tokens in the yard.',
      'Tokens enter the track only by rolling a 6.',
      'Safe squares protect tokens from capture.',
    ],
    turn: [
      'Roll one die and move a legal token exactly that many spaces.',
      'Rolling a 6 grants another turn, but three 6s in a row lose the turn.',
      'Landing on an enemy token on a non-safe square sends that token back to the yard.',
      'Exact count is required to move into the home lane and the final home square.',
    ],
    tips: [
      'Bringing more tokens into play helps, but advanced tokens can score quickly.',
      'Use safe squares to avoid being knocked back to the yard.',
    ],
  },
  'kingdom-conquest': {
    objective: 'Control every territory on the map through reinforcements, attacks, and fortification.',
    setup: [
      'The map begins split between the two sides.',
      'At the start of each turn, count reinforcements based on territories owned and full regions.',
      'The current player must place all reinforcements before attacking.',
    ],
    turn: [
      'Attack from an adjacent territory with at least two armies.',
      'The attacker rolls up to 3 dice and the defender up to 2, comparing highest dice pairs like Risk.',
      'Captured territories are occupied immediately by moving armies in from the attack source.',
      'After attacking, you may fortify one adjacent friendly territory before ending the turn.',
    ],
    tips: [
      'Borders matter more than deep interior territories.',
      'Attack only when you have a clear army advantage or a key region bonus is in reach.',
    ],
  },
  'blackjack-vault': {
    objective: 'Beat the dealer without busting by finishing closer to 21.',
    setup: [
      'The shoe is shuffled and each side receives two cards.',
      'The dealer keeps one hole card hidden until the player stands or busts.',
      'Choose a bet before dealing the next hand.',
    ],
    turn: [
      'Hit to take another card.',
      'Stand to lock your total and let the dealer play.',
      'Double to double your bet, take exactly one more card, and then stand automatically.',
      'Dealer hits until at least 17, including soft 17 in this version.',
    ],
    tips: [
      'Aces count as 1 or 11, whichever keeps the hand best under 21.',
      'Doubling is strongest when you already have a solid total and expect one good finishing card.',
    ],
  },
  'flag-front': {
    objective: 'Capture the enemy flag while protecting your own hidden ranks.',
    setup: [
      'Each side places its hidden army on its back ranks.',
      'Bombs and the flag cannot move.',
      'Lakes in the middle of the board block movement.',
    ],
    turn: [
      'Move one legal piece one square orthogonally unless it is a Scout or another special mover.',
      'Attack by moving into an enemy square.',
      'When pieces fight, the stronger rank wins unless a special rule applies.',
      'Capturing the flag wins immediately.',
    ],
    tips: [
      'Keep your flag protected by bombs and high ranks.',
      'Use scouts to probe enemy lines before committing stronger pieces.',
    ],
  },
  'farm-claimers': {
    objective: 'Draft the best scoring farm tableau from the shared market.',
    setup: [
      'A shared card market is dealt face up.',
      'Players take turns drafting one card at a time.',
      'Each card has a base point value plus combo text.',
    ],
    turn: [
      'Choose one card from the market and add it to your farm.',
      'The market refills from the deck after each pick.',
      'When the draft ends, score all cards plus combo bonuses.',
    ],
    tips: [
      'Variety helps, but focused sets can outscore random picks.',
      'Buildings often pay off only if you also draft the matching crop or animal cards.',
    ],
  },
  'trivia-blitz': {
    objective: 'Score more points than your rival by answering alternating quiz questions correctly.',
    setup: [
      'A shuffled set of category questions is loaded for the match.',
      'Players answer one question per turn.',
    ],
    turn: [
      'Choose one of the available answer options.',
      'Correct answers score points and build a streak bonus.',
      'After the final question, the highest score wins.',
    ],
    tips: [
      'Consistency matters more than guessing every category perfectly.',
      'A long streak creates a quick scoring swing.',
    ],
  },
  'word-quest': {
    objective: 'Find valid words on the shared grid and outscore your rival before the turn limit expires.',
    setup: [
      'A 4x4 letter grid is generated.',
      'Words must be traced through adjacent letters, including diagonals.',
      'A tile cannot be reused within the same word.',
    ],
    turn: [
      'Enter one valid word formed from connected letters on the board.',
      'Longer words score more points.',
      'Each valid word can only be claimed once.',
    ],
    tips: [
      'Scan for common word endings and prefixes first.',
      'Short words are safe, but longer chains create the best scoring burst.',
    ],
  },
  'mystery-faces': {
    objective: 'Discover the opponent’s hidden face before they discover yours.',
    setup: [
      'Each side is assigned one hidden face from the character roster.',
      'Both players begin with every face card still standing.',
    ],
    turn: [
      'On your turn, either ask one yes/no attribute question or make one final guess.',
      'Use the answer to fold down faces that cannot match.',
      'A wrong final face guess loses immediately.',
    ],
    tips: [
      'Ask split questions that eliminate roughly half the board.',
      'Do not guess a face until the candidate list is very small.',
    ],
  },
  'royal-dice-5': {
    objective: 'Score the best total across the full Yahtzee-style score sheet.',
    setup: [
      'Each side takes turns rolling five dice.',
      'A turn allows up to three rolls with holds between rolls.',
    ],
    turn: [
      'After any roll, hold or release dice before rolling again.',
      'When satisfied, score one unused category on the sheet.',
      'Upper section scores are based on matching die faces. Lower section scores follow the classic category rules.',
    ],
    tips: [
      'Build toward the upper bonus, but do not waste a strong lower-category roll.',
      'Sometimes scratching a weak category early preserves stronger options later.',
    ],
  },
  'yahtzee-vault': {
    objective: 'Score the best total across the full Yahtzee-style score sheet.',
    setup: [
      'Each side takes turns rolling five dice.',
      'A turn allows up to three rolls with holds between rolls.',
    ],
    turn: [
      'After any roll, hold or release dice before rolling again.',
      'When satisfied, score one unused category on the sheet.',
      'A Yahtzee is five of a kind and is one of the biggest point swings in the game.',
    ],
    tips: [
      'Keep track of which categories are still open before choosing your holds.',
      'A low roll is sometimes best used as a strategic scratch.',
    ],
  },
  'sea-battle': {
    objective: 'Sink the entire enemy fleet before your own ships are destroyed.',
    setup: [
      'Place your ships on the 10x10 grid manually or use Auto Place.',
      'Ships cannot overlap or extend beyond the board.',
      'Once both fleets are set, battle begins.',
    ],
    turn: [
      'Choose one untargeted enemy square to fire on.',
      'Hits mark ships, misses mark water, and complete ship destruction counts as sunk.',
      'Continue alternating shots until one fleet is fully sunk.',
    ],
    tips: [
      'After a hit, probe adjacent cells to finish the ship efficiently.',
      'Spread your own ships to reduce chain discoveries.',
    ],
  },
  'city-tycoon': {
    objective: 'Outlast the table and build the strongest property empire using Monopoly-style rules.',
    setup: [
      'Each player starts with $1500 at Boot Up / Start.',
      'All players roll to decide who goes first.',
      'A turn begins with a dice roll, not a build prompt.',
    ],
    turn: [
      'Roll two dice, move clockwise, and collect $200 for passing Boot Up.',
      'Buy unowned properties, pay rent, and build only when you hold the full colour set.',
      'Rolling doubles gives another turn unless a special rule stops it.',
      'Forced liquidation and auction-style selling only happen when a debt cannot be paid.',
    ],
    tips: [
      'Complete sets are worth much more than scattered ownership.',
      'Keep enough cash to survive heavy rent hits before overbuilding.',
    ],
  },
};

export function getRulesForGame(gameId) {
  return GAME_RULES[gameId] || DEFAULT_RULES;
}
