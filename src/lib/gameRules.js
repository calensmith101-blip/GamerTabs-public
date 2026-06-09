
export const GAME_RULES = {
  "city-tycoon": {
    summary: "A Monopoly-style property race. Roll, move, buy, collect rent, build houses, and avoid bankruptcy.",
    details: [
      "Each player starts with 1500 credits. Players roll to decide the first turn order at the start of a fresh game.",
      "On your turn, roll two dice, move that total, and resolve the space you land on. Passing Boot Up pays 200 credits.",
      "Rolling doubles gives another turn. Three doubles in a row sends that player to Security Lockup.",
      "Unowned properties can be bought immediately if you can afford them. Rent is charged automatically when another player lands there.",
      "A full district set unlocks building. Houses and hotels increase rent. Build only if you can afford the upgrade.",
      "Auction flow is only used here as an emergency liquidation style sale when a player cannot pay rent from cash alone.",
      "The compact property bar shows owned sites. Click a player's property tab to open the full portfolio sheet with rent and build costs."
    ]
  },
  "sea-battle": {
    summary: "A Battleship-style duel. Place ships, then fire shots until one fleet is sunk.",
    details: [
      "Each fleet uses ships of sizes 5, 4, 3, 3, and 2.",
      "Use New Game to enter placement mode. Drag a ship from the tray to your grid, or use Auto Place.",
      "Ships cannot overlap and must stay inside the 10x10 board.",
      "After placement, take turns firing at untargeted enemy cells. Hits, misses, and sunk ships are tracked.",
      "The AI never fires at the same cell twice and will probe around a recent hit when possible."
    ]
  },
  "reversi-lockdown": {
    summary: "A Reversi/Othello battle. Place a disc to flank enemy discs and flip them.",
    details: [
      "A move is legal only if it traps one or more opponent discs in a straight line.",
      "All trapped discs flip to your colour immediately.",
      "If a player has no legal move, that player must pass.",
      "The winner is the player with the most discs when both players cannot move."
    ]
  },
  "kingdom-conquest": {
    summary: "A Risk-style territory game. Reinforce, attack adjacent territories, and fortify your empire.",
    details: [
      "At the start of your turn you receive reinforcements based on territory count and holdings.",
      "You may attack adjacent enemy territories with at least two armies. Attackers and defenders roll dice; highest pairs compare.",
      "If the defender loses all armies, the territory is captured and one or more attacking armies move in.",
      "After attacking, you may fortify between connected friendly territories.",
      "The AI reinforces borders and attacks weaker adjacent territories first."
    ]
  },
  "royal-dice-5": {
    summary: "A Yahtzee-style game with five dice, up to three rolls per turn, and category scoring.",
    details: [
      "Roll up to three times, choosing which dice to hold between rolls.",
      "After rolling, choose one open category to score. The game ends when the sheet is full.",
      "The AI aims for the highest potential category and scratches weak categories when needed."
    ]
  },
  "uno-vault": {
    summary: "A streamlined Uno-style game. Match by colour or value, use action cards, and empty your hand first.",
    details: [
      "Play one card matching the current colour or value, or use a wild card.",
      "Skip skips the next player, Reverse changes direction, and Draw Two makes the next player draw and miss a turn.",
      "Wild and Wild Draw Four let you choose the next colour.",
      "If you cannot play, draw one card and play it immediately if legal."
    ]
  },
  "scrabble-vault": {
    summary: "A Scrabble-style word board. Place connected words using your rack and score letter values.",
    details: [
      "The first word must touch the centre tile. Later words must connect to existing tiles.",
      "Each placed tile scores its face value. This prototype focuses on connected placement and rack play, not premium-square bonuses.",
      "After a valid play, refill your rack from the bag.",
      "If both players repeatedly pass and the bag is nearly empty, the higher score wins."
    ]
  },
  "wizard-towers": {
    summary: "Build tower paths, collect arcane crystals, and control the highest spires.",
    details: [
      "Move a mage to an adjacent tower node, claim crystals, and build influence on visited towers.",
      "Special tower nodes give extra mana or teleport options.",
      "Highest total influence at game end wins."
    ]
  },
  "pirate-plunder": {
    summary: "Sail between islands, collect treasure, and return loot safely to your hold.",
    details: [
      "Move your ship along sea lanes, explore islands, and claim treasure tokens.",
      "Storms and rival ships can slow you down or steal tempo.",
      "The richest captain after the final round wins."
    ]
  },
  "treasure-trail": {
    summary: "A race through a trapped map. Advance along the trail, collect relics, and reach the vault first.",
    details: [
      "Each turn, move along connected trail spaces and resolve hazards or loot.",
      "Relics boost score and may unlock shortcuts.",
      "Reach the vault or lead on relic score when the trail deck runs out."
    ]
  }
}

export function getGameRules(gameId, fallbackTitle = "this game") {
  return GAME_RULES[gameId] || {
    summary: `${fallbackTitle} is playable in Black Vault with local play and safe fallback behaviour for online mode.`,
    details: [
      "Use the on-screen actions to take your turn.",
      "Single and local modes are safe to play without online services.",
      "Open the game panel actions to reset or start a new match."
    ]
  }
}
