import { SPACES, getSpaceByIndex } from './cityTycoonSpaces'
import {
  rollDice,
  getRentAmount,
  getBuildCost,
  isOwnableSpace,
  isBuildableSpace,
  canAfford,
  canBuildOnSpace,
} from './cityTycoonRules'
import { drawOutbreakCard, applyOutbreakCard } from './cityTycoonEvents'

const DEFAULT_PLAYERS = ['X', 'O']

function createPlayerMap(players, valueFactory) {
  return Object.fromEntries(players.map((player, index) => [player, valueFactory(player, index)]))
}

export function createCityTycoonState(players = DEFAULT_PLAYERS) {
  const cleanPlayers = Array.from(new Set((players || DEFAULT_PLAYERS).filter(Boolean))).slice(0, 5)
  const finalPlayers = cleanPlayers.length >= 2 ? cleanPlayers : DEFAULT_PLAYERS
  return {
    players: finalPlayers,
    turn: finalPlayers[0],
    cash: createPlayerMap(finalPlayers, () => 1500),
    positions: createPlayerMap(finalPlayers, () => 0),
    owned: {},
    buildings: {},
    phase: 'build',
    selectedSpace: null,
    pendingPosition: null,
    landedSpace: null,
    lastRoll: null,
    rollsLeft: 1,
    doublesCount: createPlayerMap(finalPlayers, () => 0),
    inJail: createPlayerMap(finalPlayers, () => false),
    jailTurns: createPlayerMap(finalPlayers, () => 0),
    getOutOfJailCards: createPlayerMap(finalPlayers, () => 0),
    outbreakCard: null,
    message: 'Ready to upgrade your holdings before you roll.',
    winner: null,
    lapCounts: createPlayerMap(finalPlayers, () => 0),
    tradeAuctionAvailable: false,
    tradeAuctionUsed: false,
  }
}

export const initialCityTycoonState = createCityTycoonState()

function getPlayers(state) {
  return state?.players?.length ? state.players : DEFAULT_PLAYERS
}

function nextTurn(state) {
  const players = getPlayers(state)
  const currentIndex = Math.max(0, players.indexOf(state.turn))
  for (let step = 1; step <= players.length; step += 1) {
    const candidate = players[(currentIndex + step) % players.length]
    if ((state.cash?.[candidate] || 0) > 0) return candidate
  }
  return players[(currentIndex + 1) % players.length] || players[0]
}

function winnerIfOnlyOneSolvent(state) {
  const alive = getPlayers(state).filter(player => (state.cash?.[player] || 0) > 0)
  return alive.length === 1 ? alive[0] : null
}

function startNewTurn(state) {
  const next = nextTurn(state)
  return {
    ...state,
    turn: next,
    phase: 'build',
    selectedSpace: null,
    pendingPosition: null,
    landedSpace: null,
    lastRoll: null,
    rollsLeft: 1,
    outbreakCard: null,
    message: `${next} begins the turn and may build first.`,
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getOwnablePropertyCount() {
  return SPACES.filter(space => isOwnableSpace(space)).length
}

function getSoldOwnableCount(owned = {}) {
  return Object.entries(owned).filter(([pos, owner]) => owner && isOwnableSpace(getSpaceByIndex(Number(pos)))).length
}

function shouldUnlockTradeAuction(state, owned = state?.owned || {}) {
  if (state?.tradeAuctionUsed || state?.tradeAuctionAvailable) return false
  const total = getOwnablePropertyCount()
  if (!total) return false
  return getSoldOwnableCount(owned) / total >= 0.9
}


function sendPlayerToJail(state, reason = 'went to jail') {
  return {
    ...state,
    phase: 'end',
    positions: { ...state.positions, [state.turn]: 10 },
    landedSpace: 10,
    pendingPosition: null,
    doublesCount: { ...state.doublesCount, [state.turn]: 0 },
    inJail: { ...state.inJail, [state.turn]: true },
    jailTurns: { ...state.jailTurns, [state.turn]: 0 },
    message: `${state.turn} ${reason}.`,
  }
}

function normaliseCardResult(state, card, fallbackMessage) {
  const winner = winnerIfOnlyOneSolvent(state)
  return {
    ...state,
    winner: winner || state.winner,
    phase: 'end',
    pendingPosition: null,
    outbreakCard: card || state.outbreakCard || null,
    message: fallbackMessage || state.message,
  }
}

export function cityTycoonReducer(state, action) {
  if (!state) return initialCityTycoonState
  switch (action.type) {
    case 'RESET':
      return { ...createCityTycoonState(state.players || DEFAULT_PLAYERS), message: 'City Tycoon campaign restarted.' }

    case 'SET_PLAYERS': {
      const count = Math.min(5, Math.max(2, Number(action.count) || 2))
      const players = ['X', 'O', 'P3', 'P4', 'P5'].slice(0, count)
      return { ...createCityTycoonState(players), message: `New ${count}-player City Tycoon game ready.` }
    }

    case 'SELECT_SPACE':
      return { ...state, selectedSpace: action.index, message: `Selected ${getSpaceByIndex(action.index)?.name || 'space'}.` }

    case 'SKIP_BUILD': {
      if (state.inJail?.[state.turn]) {
        return { ...state, phase: 'roll', selectedSpace: null, rollsLeft: 1, message: `${state.turn} is in jail. Use a Get Out of Jail Free card or pay ⬡50 to leave.` }
      }
      return { ...state, phase: 'roll', selectedSpace: null, rollsLeft: 1, message: 'Build phase skipped. Roll the dice.' }
    }

    case 'PAY_TO_LEAVE_JAIL': {
      if (!state.inJail?.[state.turn]) return state
      if (!canAfford(state.turn, 50, state)) return { ...state, message: 'Not enough credits to pay jail release.' }
      return {
        ...state,
        cash: { ...state.cash, [state.turn]: (state.cash[state.turn] || 0) - 50 },
        inJail: { ...state.inJail, [state.turn]: false },
        jailTurns: { ...state.jailTurns, [state.turn]: 0 },
        phase: 'roll',
        message: `${state.turn} paid ⬡50 and left jail. Roll now.`,
      }
    }

    case 'USE_GET_OUT_OF_JAIL_CARD': {
      if (!state.inJail?.[state.turn]) return state
      const cards = state.getOutOfJailCards?.[state.turn] || 0
      if (cards <= 0) return { ...state, message: 'No Get Out of Jail Free card available.' }
      return {
        ...state,
        getOutOfJailCards: { ...state.getOutOfJailCards, [state.turn]: cards - 1 },
        inJail: { ...state.inJail, [state.turn]: false },
        jailTurns: { ...state.jailTurns, [state.turn]: 0 },
        phase: 'roll',
        message: `${state.turn} used a Get Out of Jail Free card. Roll now.`,
      }
    }

    case 'ROLL_DICE': {
      if (state.phase !== 'roll' || state.winner) return state
      const die1 = rollDice()
      const die2 = rollDice()
      const roll = die1 + die2
      const isDouble = die1 === die2
      const current = state.positions[state.turn] || 0
      const jailed = Boolean(state.inJail?.[state.turn])
      if (jailed) {
        return {
          ...state,
          phase: 'roll',
          message: `${state.turn} is in jail. Use a Get Out of Jail Free card or pay ⬡50 to leave before rolling.`,
        }
      }

      const releaseCost = 0
      const nextDoubles = isDouble ? (state.doublesCount?.[state.turn] || 0) + 1 : 0
      if (nextDoubles >= 3) {
        return {
          ...state,
          phase: 'end',
          positions: { ...state.positions, [state.turn]: 10 },
          lastRoll: [die1, die2],
          doublesCount: { ...state.doublesCount, [state.turn]: 0 },
          inJail: { ...state.inJail, [state.turn]: true },
          jailTurns: { ...state.jailTurns, [state.turn]: 0 },
          message: `${state.turn} rolled three doubles and went straight to jail.`,
        }
      }

      const passedGo = current + roll >= 40
      const next = (current + roll) % 40
      const nextLapCounts = { ...(state.lapCounts || {}), [state.turn]: (state.lapCounts?.[state.turn] || 0) + (passedGo ? 1 : 0) }
      return {
        ...state,
        phase: 'move',
        pendingPosition: next,
        lastRoll: [die1, die2],
        rollsLeft: 0,
        doublesCount: { ...state.doublesCount, [state.turn]: nextDoubles },
        inJail: { ...state.inJail, [state.turn]: false },
        jailTurns: { ...state.jailTurns, [state.turn]: 0 },
        message: `${state.turn} rolled ${die1} and ${die2} for ${roll}${isDouble ? ' — doubles!' : ''}. Moving to the next sector...`,
        lapCounts: nextLapCounts,
        tradeAuctionAvailable: state.tradeAuctionAvailable,
        cash: {
          ...state.cash,
          [state.turn]: (state.cash[state.turn] || 0) + (passedGo ? 200 : 0) - releaseCost,
        },
      }
    }

    case 'MOVE_PIECE': {
      if (state.phase !== 'move' || state.pendingPosition === null) return state
      const landedSpace = getSpaceByIndex(state.pendingPosition)
      if (state.pendingPosition === 30 || state.pendingPosition === 10) {
        return sendPlayerToJail(
          { ...state, landedSpace: state.pendingPosition },
          state.pendingPosition === 30 ? 'landed on GO TO JAIL and was sent straight to Jail' : 'landed on Jail and is now locked up'
        )
      }
      const landedBase = {
        ...state,
        phase: 'land',
        positions: { ...state.positions, [state.turn]: state.pendingPosition },
        landedSpace: state.pendingPosition,
        pendingPosition: null,
        message: `${state.turn} landed on ${landedSpace?.name || 'a sector'}.`,
      }
      if (landedSpace?.type === 'event') {
        const card = drawOutbreakCard()
        const afterCard = applyOutbreakCard(landedBase, card)
        return normaliseCardResult(
          { ...afterCard, landedSpace: state.pendingPosition },
          card,
          `${state.turn} drew ${card.title}: ${afterCard.message || card.text}`
        )
      }
      return landedBase
    }

    case 'BUY_PROPERTY': {
      if (state.phase !== 'land' || state.winner) return state
      const index = state.landedSpace
      const space = getSpaceByIndex(index)
      if (!space || !isOwnableSpace(space)) return { ...state, phase: 'end', message: 'This space cannot be bought.' }
      if (state.owned[index]) return { ...state, phase: 'end', message: 'Already owned.' }
      if (!canAfford(state.turn, space.price, state)) {
        return { ...state, phase: 'end', message: 'Insufficient credits to purchase this sector.' }
      }
      const nextOwned = { ...state.owned, [index]: state.turn }
      const unlockTradeAuction = shouldUnlockTradeAuction(state, nextOwned)
      return {
        ...state,
        owned: nextOwned,
        cash: { ...state.cash, [state.turn]: (state.cash[state.turn] || 0) - space.price },
        phase: 'end',
        tradeAuctionAvailable: state.tradeAuctionAvailable || unlockTradeAuction,
        message: unlockTradeAuction
          ? `${state.turn} acquired ${space.name}. 90% of properties are now sold — the one-time trade auction is unlocked.`
          : `${state.turn} acquired ${space.name} for ⬡${space.price}.`,
      }
    }

    case 'PAY_RENT': {
      if (state.phase !== 'land') return state
      const index = state.landedSpace
      const space = getSpaceByIndex(index)
      if (!space) return { ...state, phase: 'end', message: 'No rent due here.' }
      const owner = state.owned[index]
      if (!owner || owner === state.turn) {
        return { ...state, phase: 'end', message: `No rent owed on ${space.name}.` }
      }
      const ownerCount = Object.entries(state.owned).reduce((count, [pos, value]) => {
        if (value !== owner) return count
        const ownedSpace = getSpaceByIndex(Number(pos))
        if (!ownedSpace) return count
        if (ownedSpace.type === 'transport' && space.type === 'transport') return count + 1
        if (ownedSpace.type === 'utility' && space.type === 'utility') return count + 1
        return count
      }, 0)
      const rent = getRentAmount(space, state.buildings[index] || 0, ownerCount || 1, state.lastRoll, state)
      const payer = state.turn
      const receiver = owner
      const nextCash = { ...state.cash }
      nextCash[payer] = (nextCash[payer] || 0) - rent
      nextCash[receiver] = (nextCash[receiver] || 0) + rent
      const loser = nextCash[payer] <= 0 ? payer : null
      const nextState = { ...state, cash: nextCash }
      const winner = loser ? winnerIfOnlyOneSolvent(nextState) : state.winner
      return {
        ...state,
        cash: nextCash,
        phase: 'end',
        winner,
        message: loser
          ? `${payer} paid ⬡${rent} and went bankrupt.`
          : `${payer} paid ⬡${rent} to ${receiver}.`,
      }
    }

    case 'BUILD_PROPERTY': {
      if (state.phase !== 'build') return state
      const index = action.index ?? state.selectedSpace
      const space = getSpaceByIndex(index)
      if (!space || !isBuildableSpace(space)) return { ...state, message: 'Select a buildable property first.' }
      if (state.owned[index] !== state.turn) return { ...state, message: 'You must own that property to build on it.' }
      if (!canBuildOnSpace(space, state.turn, state)) {
        return { ...state, message: 'You can only build on a complete district evenly owned by you.' }
      }
      const buildCost = getBuildCost(space)
      if (!canAfford(state.turn, buildCost, state)) {
        return { ...state, message: 'Not enough credits to build an upgrade.' }
      }
      const nextCount = Math.min(5, (state.buildings[index] || 0) + 1)
      return {
        ...state,
        phase: 'build',
        buildings: { ...state.buildings, [index]: nextCount },
        cash: { ...state.cash, [state.turn]: (state.cash[state.turn] || 0) - buildCost },
        message: `${state.turn} built upgrade ${nextCount} on ${space.name}.`,
      }
    }

    case 'AUCTION_PROPERTY': {
      if (state.phase !== 'land') return state
      const index = state.landedSpace
      const space = getSpaceByIndex(index)
      if (!space || !isOwnableSpace(space)) return { ...state, phase: 'end', message: 'Nothing to auction here.' }
      return { ...state, phase: 'end', message: `Auction is not available yet for ${space.name}.` }
    }


    case 'RUN_TRADE_AUCTION': {
      if (!state.tradeAuctionAvailable || state.tradeAuctionUsed) return { ...state, message: 'The one-time trade auction is not available.' }
      const players = getPlayers(state)
      const nextOwned = { ...state.owned }
      const nextCash = { ...state.cash }
      const deals = []

      for (const buyer of players) {
        for (const district of Array.from(new Set(SPACES.filter(s => s.type === 'property' && s.district).map(s => s.district)))) {
          const group = SPACES.filter(s => s.type === 'property' && s.district === district)
          const buyerOwned = group.filter(s => nextOwned[s.pos] === buyer)
          const missing = group.filter(s => nextOwned[s.pos] && nextOwned[s.pos] !== buyer)
          if (buyerOwned.length === group.length - 1 && missing.length === 1) {
            const prop = missing[0]
            const seller = nextOwned[prop.pos]
            const price = Math.max(prop.price || 100, Math.floor((prop.price || 100) * 1.25))
            if ((nextCash[buyer] || 0) >= price) {
              nextCash[buyer] -= price
              nextCash[seller] = (nextCash[seller] || 0) + price
              nextOwned[prop.pos] = buyer
              deals.push(`${buyer} bought ${prop.name} from ${seller} for ⬡${price}`)
              break
            }
          }
        }
      }

      return {
        ...state,
        owned: nextOwned,
        cash: nextCash,
        tradeAuctionAvailable: false,
        tradeAuctionUsed: true,
        message: deals.length ? `Trade auction complete: ${deals.join('; ')}.` : 'Trade auction complete. No useful set-completing trades were affordable.',
      }
    }

    case 'DRAW_OUTBREAK': {
      if (state.phase !== 'land') return state
      const card = drawOutbreakCard()
      const nextState = applyOutbreakCard(state, card)
      return normaliseCardResult(nextState, card, nextState.message || card.text)
    }

    case 'RESOLVE_LAND': {
      if (state.phase !== 'land') return state
      const index = state.landedSpace
      const space = getSpaceByIndex(index)
      if (!space) return { ...state, phase: 'end', message: 'Nothing to resolve.' }
      if (space.type === 'tax') {
        const amount = space.amount || 0
        const nextCash = { ...state.cash, [state.turn]: (state.cash[state.turn] || 0) - amount }
        const loser = nextCash[state.turn] <= 0 ? state.turn : null
        return {
          ...state,
          cash: nextCash,
          phase: 'end',
          winner: loser ? winnerIfOnlyOneSolvent({ ...state, cash: nextCash }) : state.winner,
          message: `${state.turn} paid ⬡${amount} tax.`,
        }
      }
      return { ...state, phase: 'end', message: `No action required for ${space.name}.` }
    }

    case 'END_TURN': {
      if (state.phase !== 'end') return state
      // Doubles grant one extra roll after the landed-space action resolves.
      const [die1, die2] = Array.isArray(state.lastRoll) ? state.lastRoll : []
      const earnedExtraRoll = die1 && die1 === die2 && (state.doublesCount?.[state.turn] || 0) > 0 && !state.inJail?.[state.turn]
      if (earnedExtraRoll && !state.winner) {
        return {
          ...state,
          phase: 'roll',
          selectedSpace: null,
          pendingPosition: null,
          landedSpace: null,
          outbreakCard: null,
          rollsLeft: 1,
          message: `${state.turn} rolled doubles and gets one extra roll.`,
        }
      }

      return startNewTurn({
        ...state,
        doublesCount: { ...state.doublesCount, [state.turn]: 0 },
      })
    }

    default:
      return state
  }
}
