// GamerTab: Black Vault — Scoring System
// 10 pts base win, bonus pts for quality
// 100 pts = 1 crown  |  3 crowns = 1 level

export const BASE_WIN = 10
export const POINTS_PER_CROWN = 100
export const CROWNS_PER_LEVEL = 3

// ─── Bonus conditions ───────────────────────────────────────────────────────
export const BONUSES = {
  fastWin:       { pts: 5,  label: '⚡ Fast Win'       },
  fewerMoves:    { pts: 5,  label: '🧠 Efficient'      },
  flawless:      { pts: 10, label: '✨ Flawless'        },
  comeback:      { pts: 8,  label: '🔥 Comeback'        },
  smartStrategy: { pts: 6,  label: '🎯 Smart Play'      },
}

/**
 * Calculate total points earned for a win.
 * @param {Object} opts  - keys matching BONUSES (e.g. { fastWin: true })
 * @returns {{ points: number, bonuses: string[] }}
 */
export function calculateWinPoints(opts = {}) {
  let points = BASE_WIN
  const bonuses = []
  for (const [key, val] of Object.entries(BONUSES)) {
    if (opts[key]) { points += val.pts; bonuses.push(val.label) }
  }
  return { points, bonuses }
}

/**
 * How many crowns has the player earned from total points?
 * @param {number} totalPoints
 * @returns {number}
 */
export function pointsToCrowns(totalPoints) {
  return Math.floor(totalPoints / POINTS_PER_CROWN)
}

/**
 * What level is the player at given crown count?
 * @param {number} crowns
 * @returns {number}
 */
export function crownsToLevel(crowns) {
  return Math.floor(crowns / CROWNS_PER_LEVEL) + 1
}

/**
 * Convenience — all derived stats from raw points.
 */
export function deriveStats(totalPoints) {
  const crowns           = pointsToCrowns(totalPoints)
  const level            = crownsToLevel(crowns)
  const crownProgress    = crowns % CROWNS_PER_LEVEL
  const ptsIntoCrown     = totalPoints % POINTS_PER_CROWN
  const ptsToNextCrown   = POINTS_PER_CROWN - ptsIntoCrown
  return { crowns, level, crownProgress, ptsIntoCrown, ptsToNextCrown }
}

/**
 * Build a match summary object for display / storage.
 * @param {Object} params
 * @param {string} params.gameId
 * @param {string} params.result     - 'win' | 'loss' | 'draw'
 * @param {number} params.ptsEarned
 * @param {string[]} params.bonuses
 * @param {string} params.opponentName
 * @param {string} params.mode       - 'online' | 'ai' | 'local'
 * @returns {Object}
 */
export function buildMatchSummary({ gameId, result, ptsEarned, bonuses = [], opponentName = '', mode = 'online' }) {
  return {
    gameId,
    result,
    ptsEarned,
    bonuses,
    opponentName,
    mode,
    playedAt: new Date().toISOString(),
  }
}

/**
 * Persist game result to Supabase profiles table (best-effort, won't throw).
 */
export async function recordGameResult(supabase, userId, won, bonusOpts = {}) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points, wins, losses')
      .eq('id', userId)
      .single()

    if (!profile) return null

    const base   = { points: profile.points || 0, wins: profile.wins || 0, losses: profile.losses || 0 }
    let newPoints = base.points
    let earnedBonuses = []

    if (won) {
      const { points, bonuses } = calculateWinPoints(bonusOpts)
      newPoints += points
      earnedBonuses = bonuses
      base.wins += 1
    } else {
      base.losses += 1
    }

    const { crowns, level } = deriveStats(newPoints)
    const { data } = await supabase
      .from('profiles')
      .update({ points: newPoints, crowns, level, wins: base.wins, losses: base.losses })
      .eq('id', userId)
      .select().single()

    return { profile: data, bonuses: earnedBonuses }
  } catch { return null }
}
