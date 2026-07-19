import { useEffect, useMemo, useState } from 'react'
import { Bot, Shuffle, UserRoundPlus } from 'lucide-react'
import { getGame, getGamePlayModes } from '../lib/games'

const SEATS = ['X', 'O', 'P3', 'P4', 'P5', 'P6']
const PLAY_CHOICES = ['ai', 'random', 'friend']

const MODE_COPY = {
  ai: { Icon: Bot, title: 'Play vs AI', desc: 'Computer opponents with one clear setup.' },
  random: { Icon: Shuffle, title: 'Play Online — Random Match', desc: 'Find another player looking for this game.' },
  friend: { Icon: UserRoundPlus, title: 'Play Friend', desc: 'Invite friends, add players, and rematch.' },
}

function normaliseSetupMode(value) {
  if (value === 'random' || value === 'onlineRandom') return 'random'
  if (value === 'friend' || value === 'online' || value === 'localLive') return 'friend'
  return 'ai'
}

function maxPlayersForGame(game) {
  const raw = String(game?.players || '')
  if (raw.includes('6')) return 6
  if (raw.includes('5')) return 5
  if (raw.includes('4')) return 4
  if (raw.includes('3')) return 3
  if (raw.includes('2')) return 2
  if (raw.trim().startsWith('1')) return 1
  return 2
}

function clampPlayerCount(value, game) {
  const max = Math.min(5, maxPlayersForGame(game))
  return Math.max(2, Math.min(max, Number(value) || 2))
}

function makeSlots({ count, mode, aiSeats = 0 }) {
  if (count <= 1) return [{ seat: 'X', kind: 'local', label: 'You' }]
  const total = Math.max(2, Math.min(5, Number(count) || 2))
  const aiCount = Math.max(0, Math.min(total - 1, Number(aiSeats) || 0))

  return SEATS.slice(0, total).map((seat, index) => {
    if (index === 0) return { seat, kind: 'local', label: 'You' }
    if (mode === 'ai') return { seat, kind: 'ai', label: 'Computer' }
    if (index >= total - aiCount) return { seat, kind: 'ai', label: 'AI' }
    return { seat, kind: 'open', label: index === 1 ? 'Friend' : `Player ${index + 1}` }
  })
}

function SlotPreview({ slots }) {
  return (
    <div className="slot-preview friendly-slot-preview">
      {slots.map(slot => (
        <span key={slot.seat} className={`slot-pill ${slot.kind}`}>
          <b>{slot.seat}</b> {slot.kind === 'ai' ? 'AI' : slot.label || 'Player'}
        </span>
      ))}
    </div>
  )
}

export default function GameSetupPage({ navigate, params = {}, access }) {
  const game = getGame(params.gameId)
  const [mode, setMode] = useState(() => normaliseSetupMode(params.prefillMode))
  const [difficulty, setDifficulty] = useState('medium')
  const [playerCount, setPlayerCount] = useState(2)
  const [aiSeats, setAiSeats] = useState(1)

  const allowedModes = useMemo(() => getGamePlayModes(game?.id), [game?.id])

  useEffect(() => {
    if (!game) return
    const max = Math.min(5, maxPlayersForGame(game))
    const start = Math.max(2, Math.min(max || 2, 2))
    setPlayerCount(start)
    setAiSeats(start > 1 ? 1 : 0)
    setMode(current => normaliseSetupMode(current))
  }, [game?.id])

  if (!game) {
    return (
      <div className="page">
        <button className="btn-back" onClick={() => navigate('games')}>Back</button>
        <p>Game not found.</p>
      </div>
    )
  }

  const maxPlayers = Math.min(5, maxPlayersForGame(game))
  const hasAiMode = allowedModes.includes('ai')
  const hasSoloMode = allowedModes.includes('single')
  const canPlayAi = hasAiMode || hasSoloMode
  const soloOnly = !hasAiMode && hasSoloMode
  const onlineReady = game.supportsOnline && maxPlayers >= 2
  const selectedCopy = MODE_COPY[mode]
  const SelectedIcon = selectedCopy.Icon

  const aiOpponentCount = soloOnly ? 0 : Math.max(1, Math.min(Math.max(1, maxPlayers - 1), Number(aiSeats) || 1))
  const aiTotalPlayers = soloOnly ? 1 : Math.max(2, Math.min(maxPlayers, aiOpponentCount + 1))
  const friendAiSeats = Math.max(0, Math.min(playerCount - 1, Number(aiSeats) || 0))
  const modeUnavailable = (mode === 'ai' && !canPlayAi) || (mode !== 'ai' && !onlineReady)

  const slots = mode === 'ai'
    ? makeSlots({ count: aiTotalPlayers, mode: 'ai', aiSeats: aiOpponentCount })
    : mode === 'random'
      ? makeSlots({ count: 2, mode: 'friend', aiSeats: 0 })
      : makeSlots({ count: playerCount, mode: 'friend', aiSeats: friendAiSeats })

  function updateFriendCount(next) {
    const count = clampPlayerCount(next, game)
    setPlayerCount(count)
    setAiSeats(prev => Math.max(0, Math.min(prev, count - 1)))
  }

  function setAiOpponents(count) {
    const next = Math.max(1, Math.min(Math.max(1, maxPlayers - 1), Number(count) || 1))
    setAiSeats(next)
    setPlayerCount(Math.max(2, Math.min(maxPlayers, next + 1)))
  }

  function startAiGame() {
    const count = soloOnly ? 1 : aiTotalPlayers
    navigate('play', {
      gameId: game.id,
      mode: soloOnly ? 'single' : 'ai',
      difficulty,
      playerCount: count,
      playerRole: 'X',
      roomCode: null,
      playerSlots: makeSlots({ count, mode: soloOnly ? 'single' : 'ai', aiSeats: aiOpponentCount }),
    })
  }

  function openPeople(tab = 'friends', extra = {}) {
    if (!access?.isFull) {
      navigate('account')
      return
    }
    navigate('friends', {
      gameId: game.id,
      tab,
      fromSetup: true,
      playerCount: mode === 'random' ? 2 : playerCount,
      aiSeats: mode === 'random' ? 0 : friendAiSeats,
      difficulty,
      ...extra,
    })
  }

  function primaryAction() {
    if (mode === 'ai') startAiGame()
    if (mode === 'random') openPeople('random', { autoRandom: true, playerCount: 2, aiSeats: 0 })
    if (mode === 'friend') openPeople('friends')
  }

  const primaryLabel = mode === 'ai'
    ? (soloOnly ? 'Start Game' : 'Start AI Game')
    : mode === 'random'
      ? (access?.isFull ? 'Find Random Match' : 'Sign In / Upgrade')
      : (access?.isFull ? 'Continue to Friends' : 'Sign In / Upgrade')

  return (
    <div className="page setup-page gt-simple-setup gt-one-menu-setup">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('games')}>Games</button>
        <h2 className="page-title">{game.icon} {game.title}</h2>
      </div>

      <section className="setup-section gt-play-console">
        <div className="gt-console-head">
          <div>
            <h3 className="setup-heading">Game Play Settings</h3>
            <p className="setup-desc">{game.desc}</p>
          </div>
          <div className="gt-console-game-chip">{game.players} players</div>
        </div>

        <div className="gt-play-choice-grid gt-play-choice-grid-compact">
          {PLAY_CHOICES.map(id => {
            const copy = MODE_COPY[id]
            const Icon = copy.Icon
            const disabled = id === 'ai' ? !canPlayAi : !onlineReady
            return (
              <button
                key={id}
                type="button"
                className={`gt-play-choice ${mode === id ? 'active' : ''}`}
                disabled={disabled}
                onClick={() => setMode(id)}
              >
                <Icon aria-hidden="true" />
                <b>{copy.title}</b>
                <small>{disabled ? (id === 'ai' ? 'AI play is not available for this game yet.' : 'Online play is not available for this game yet.') : copy.desc}</small>
              </button>
            )
          })}
        </div>

        <div className="gt-settings-board">
          <div className="gt-settings-main">
            <div className="gt-settings-title-row">
              <SelectedIcon aria-hidden="true" />
              <div>
                <h3>{selectedCopy.title}</h3>
                <p>{modeUnavailable ? 'This mode is not available for this game.' : selectedCopy.desc}</p>
              </div>
            </div>

            {mode === 'ai' && <>
              <div className="gt-setting-row">
                <b>Difficulty</b>
                <div className="setup-difficulty-row compact">
                  {['easy', 'medium', 'hard', 'expert'].map(d => (
                    <button key={d} className={`diff-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>
                  ))}
                </div>
              </div>
              {soloOnly ? (
                <div className="gt-setting-row gt-setting-note">
                  <b>Players</b>
                  <span>Solo mode</span>
                </div>
              ) : (
                <div className="gt-setting-row">
                  <b>AI opponents</b>
                  <div className="clean-chip-row">
                    {Array.from({ length: Math.max(1, maxPlayers - 1) }, (_, i) => i + 1).map(n => (
                      <button key={n} className={`count-btn ${aiOpponentCount === n ? 'active' : ''}`} onClick={() => setAiOpponents(n)}>{n}</button>
                    ))}
                  </div>
                </div>
              )}
            </>}

            {mode === 'random' && (
              <div className="gt-setting-row gt-setting-note">
                <b>Match size</b>
                <span>2 players · no AI fill</span>
              </div>
            )}

            {mode === 'friend' && <>
              <div className="gt-setting-row">
                <b>Total seats</b>
                <div className="clean-chip-row">
                  {Array.from({ length: Math.max(1, maxPlayers - 1) }, (_, i) => i + 2).map(n => (
                    <button key={n} className={`count-btn ${playerCount === n ? 'active' : ''}`} onClick={() => updateFriendCount(n)}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="gt-setting-row">
                <b>AI fill</b>
                <div className="clean-chip-row">
                  {Array.from({ length: playerCount }, (_, i) => i).map(n => (
                    <button key={n} className={`count-btn ${friendAiSeats === n ? 'active' : ''}`} onClick={() => setAiSeats(n)}>{n}</button>
                  ))}
                </div>
              </div>
            </>}
          </div>

          <aside className="gt-seat-summary">
            <b>Players</b>
            <SlotPreview slots={slots} />
            {mode !== 'ai' && !access?.isFull && <p className="setup-desc">Online play needs a signed-in full access account.</p>}
          </aside>
        </div>

        <button className="btn-primary setup-go gt-start-setup" disabled={modeUnavailable} onClick={primaryAction}>
          {primaryLabel}
        </button>
      </section>
    </div>
  )
}
