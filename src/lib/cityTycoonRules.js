import { SPACES, getSpaceByIndex } from './cityTycoonSpaces'
import { DISTRICTS, TRANSPORT_RENTS, UTILITY_RENT } from './cityTycoonDistricts'

export function rollDice() {
  return 1 + Math.floor(Math.random() * 6)
}

export function isOwnableSpace(space) {
  return ['property', 'transport', 'utility'].includes(space?.type)
}

export function isBuildableSpace(space) {
  return space?.type === 'property'
}

export function getPropertyPrice(space) {
  return space?.price || 0
}

export function getBuildCost(space) {
  if (!space || space.type !== 'property') return 0
  return space.buildCost || Math.max(50, Math.floor((space.price || 100) * 0.25))
}

export function getDistrictSpaces(district) {
  return SPACES.filter(space => space.type === 'property' && space.district === district)
}

export function ownsFullDistrict(owner, district, state) {
  if (!owner || !district || !state) return false
  const districtSpaces = getDistrictSpaces(district)
  return districtSpaces.length > 0 && districtSpaces.every(space => state.owned?.[space.pos] === owner)
}

export function getDistrictBuildingCounts(district, state) {
  return getDistrictSpaces(district).map(space => state.buildings?.[space.pos] || 0)
}

export function canBuildOnSpace(space, player, state) {
  if (!space || space.type !== 'property' || !player || !state) return false
  if (state.owned?.[space.pos] !== player) return false
  if (!ownsFullDistrict(player, space.district, state)) return false
  const counts = getDistrictBuildingCounts(space.district, state)
  const current = state.buildings?.[space.pos] || 0
  const minCount = Math.min(...counts)
  return current < 5 && current <= minCount
}

export function getPlayerProperties(player, state) {
  if (!player || !state) return []
  return Object.entries(state.owned)
    .filter(([, owner]) => owner === player)
    .map(([index]) => getSpaceByIndex(Number(index)))
    .filter(Boolean)
}

export function getPropertyLabel(space) {
  if (!space) return 'Unknown'
  return space.name
}

export function getRentAmount(space, buildings = 0, ownerCount = 1, roll = 1, state = null) {
  if (!space) return 0
  const rollValue = Array.isArray(roll) ? roll.reduce((sum, die) => sum + (Number(die) || 0), 0) : Number(roll) || 0

  if (space.type === 'property') {
    const district = DISTRICTS[space.district]
    if (district && district.rents && district.rents[space.name]) {
      const rentLevels = district.rents[space.name]
      const base = rentLevels[Math.min(buildings, rentLevels.length - 1)]
      if (buildings === 0 && district.groupBonusRent && state) {
        const owner = state.owned?.[space.pos]
        if (owner && ownsFullDistrict(owner, space.district, state)) {
          return base * 2
        }
      }
      return base
    }
    return Math.max(10, Math.floor((space.price || 100) * (0.25 + buildings * 0.15)))
  }

  if (space.type === 'transport') {
    return TRANSPORT_RENTS[Math.min(Math.max(ownerCount, 1), 4)] || 25
  }

  if (space.type === 'utility') {
    const multiplier = ownerCount === 2 ? UTILITY_RENT[2] : UTILITY_RENT[1]
    return Math.max(rollValue * multiplier, 20)
  }

  if (space.type === 'tax') {
    return space.amount || 0
  }

  return 0
}

export function getSpaceLabel(space) {
  if (!space) return 'Unknown'
  return space.name
}

export function getOwnerCountForType(owner, state, type) {
  if (!owner || !state?.owned) return 0
  return Object.entries(state.owned).reduce((count, [idx, value]) => {
    const space = getSpaceByIndex(Number(idx))
    if (value === owner && space?.type === type) return count + 1
    return count
  }, 0)
}

export function formatCredits(amount) {
  return `⬡${amount}`
}

export function isPositionOwnedByOpponent(position, state) {
  const owner = state.owned?.[position]
  return owner && owner !== state.turn
}

export function isPositionOwnedByPlayer(position, state) {
  return state.owned?.[position] === state.turn
}

export function canAfford(player, amount, state) {
  return (state.cash?.[player] || 0) >= amount
}
