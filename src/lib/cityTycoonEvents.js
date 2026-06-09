export const OUTBREAK_CARDS = [
  {
    id: 'power_surge',
    title: 'Power Surge',
    text: 'Emergency grid repairs drain ⬡100 from the current player.',
    apply: (state) => {
      const player = state.turn
      const nextCash = { ...state.cash, [player]: Math.max(0, (state.cash[player] || 0) - 100) }
      return {
        ...state,
        cash: nextCash,
        message: `${player} pays ⬡100 for a power surge.`,
      }
    },
  },
  {
    id: 'vault_windfall',
    title: 'Vault Windfall',
    text: 'A hidden credit cache grants ⬡120 to the current player.',
    apply: (state) => {
      const player = state.turn
      return {
        ...state,
        cash: { ...state.cash, [player]: (state.cash[player] || 0) + 120 },
        message: `${player} found a vault windfall and gains ⬡120.`,
      }
    },
  },
  {
    id: 'transit_strike',
    title: 'Transit Strike',
    text: 'Your transport link fails. Move back 2 spaces and lose your end phase.',
    apply: (state) => {
      const player = state.turn
      const current = state.positions[player] || 0
      const nextPos = Math.max(0, current - 2)
      return {
        ...state,
        positions: { ...state.positions, [player]: nextPos },
        message: `${player} is delayed by a transit strike and moves back 2 spaces.`,
      }
    },
  },
  {
    id: 'black_market_leak',
    title: 'Black Market Leak',
    text: 'A rival loses credits. Gain ⬡80 from the opponent.',
    apply: (state) => {
      const player = state.turn
      const players = state.players?.length ? state.players : ['X', 'O']
      const opponent = players.find(p => p !== player && (state.cash?.[p] || 0) > 0) || players.find(p => p !== player)
      const transfer = Math.min(80, state.cash?.[opponent] || 0)
      return {
        ...state,
        cash: {
          ...state.cash,
          [opponent]: Math.max(0, (state.cash[opponent] || 0) - transfer),
          [player]: (state.cash[player] || 0) + transfer,
        },
        message: `${player} siphoned ⬡${transfer} from ${opponent} in the black market leak.`,
      }
    },
  },
  {
    id: 'asset_seizure',
    title: 'Asset Seizure',
    text: 'A forced seizure costs ⬡90. If you cannot pay, lose one upgrade.',
    apply: (state) => {
      const player = state.turn
      const nextCash = Math.max(0, (state.cash[player] || 0) - 90)
      const nextBuildings = { ...state.buildings }
      if (nextCash === 0) {
        const ownedKeys = Object.keys(state.owned).filter((idx) => state.owned[idx] === player)
        if (ownedKeys.length) {
          const targetKey = ownedKeys[ownedKeys.length - 1]
          nextBuildings[targetKey] = Math.max(0, (nextBuildings[targetKey] || 0) - 1)
        }
      }
      return {
        ...state,
        cash: { ...state.cash, [player]: nextCash },
        buildings: nextBuildings,
        message: `${player} paid ⬡90 for asset seizure relief.`,
      }
    },
  },
  {
    id: 'supply_drop',
    title: 'Supply Drop',
    text: 'A supply drop restores ⬡70 to your reserves.',
    apply: (state) => {
      const player = state.turn
      return {
        ...state,
        cash: { ...state.cash, [player]: (state.cash[player] || 0) + 70 },
        message: `${player} received a supply drop and gains ⬡70.`,
      }
    },
  },
  {
    id: 'get_out_of_jail_free',
    title: 'Get Out of Jail Free',
    text: 'Keep this card. Use it later to leave Jail without paying ⬡50.',
    apply: (state) => {
      const player = state.turn
      return {
        ...state,
        getOutOfJailCards: {
          ...(state.getOutOfJailCards || {}),
          [player]: ((state.getOutOfJailCards || {})[player] || 0) + 1,
        },
        message: `${player} collected a Get Out of Jail Free card.`,
      }
    },
  },

]

export function drawOutbreakCard() {
  const index = Math.floor(Math.random() * OUTBREAK_CARDS.length)
  return OUTBREAK_CARDS[index]
}

export function applyOutbreakCard(state, card) {
  if (!card || typeof card.apply !== 'function') return state
  return { ...card.apply(state), outbreakCard: card }
}
