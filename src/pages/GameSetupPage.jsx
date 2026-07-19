import { useEffect, useMemo, useState } from 'react'
import { Bot, Shuffle, UserRoundPlus } from 'lucide-react'
import { getGame, getGamePlayModes } from '../lib/games'

const SEATS = ['X', 'O', 'P3', 'P4', 'P5', 'P6']

const MODE_COPY = {
  ai: { Icon: Bot, title: 'Play vs AI', desc: 'Practice against computer opponents.' },
  random: { Icon: Shuffle, title: 'Play Online — Random Match', desc: 'Match with another player looking for this game.' },
  friend: { Icon: UserRoundPlus, title: 'Play Friend', desc: 'Choose friends, add players, invite, challenge or rematch.' },
  single: { icon: '1P', title: 'Solo', desc: 'Single-player mode.' },
  local: { icon: '1D', title: 'Same Device', desc: 'Offline pass-and-play on one phone, tablet or computer.' },
}

function maxPlayersForGame(game) {
  const raw = String(game?.players || '')
  if (raw.includes('6')) return 6
  if (raw.includes('5')) return 5
  if (raw.includes('4')) return 4
  if (raw.includes('3')) return 3
  return 2
}

function clampPlayerCount(value, game) {
  const min = String(game?.players || '').startsWith('1') ? 1 : 2
  const max = Math.min(5, maxPlayersForGame(game))
  return Math.max(min, Math.min(max, Number(value) || min))
}

function makeSlots({ count, mode, aiSeats = 0, localHumans = 1 }) {
  if (mode === 'single') return [{ seat: 'X', kind: 'local', label: 'You' }]
  const total = Math.max(2, Math.min(5, Number(count) || 2))
  const humans = mode === 'ai' ? 1 : Math.max(1, Math.min(total, Number(localHumans) || total))
  return SEATS.slice(0, total).map((seat, index) => {
    if (index < humans) return { seat, kind: 'local', label: index === 0 ? 'You' : `Player ${index + 1}` }
    return { seat, kind: 'ai', label: 'Computer' }
  }).map((slot, index) => {
    if (mode === 'ai' && index > 0) return { ...slot, kind: 'ai', label: 'Computer' }
    if (mode === 'local' && index >= total - aiSeats) return { ...slot, kind: 'ai', label: 'Computer' }
    return slot
  })
}

function SlotPreview({ slots }) {
  return <div className="slot-preview friendly-slot-preview">
    {slots.map(slot => <span key={slot.seat} className={`slot-pill ${slot.kind}`}><b>{slot.seat}</b> {slot.kind === 'ai' ? 'AI' : slot.label || 'Player'}</span>)}
  </div>
}

export default function GameSetupPage({ navigate, params = {}, access }) {
  const game = getGame(params.gameId)
  const [mode, setMode] = useState(params.prefillMode || null)
  const [difficulty, setDifficulty] = useState('medium')
  const [playerCount, setPlayerCount] = useState(2)
  const [aiSeats, setAiSeats] = useState(1)
  const [localHumans, setLocalHumans] = useState(2)

  const allowedModes = useMemo(() => getGamePlayModes(game?.id), [game?.id])

  useEffect(() => {
    if (!game) return
    const start = clampPlayerCount(String(game.players || '').startsWith('1') ? 1 : 2, game)
    setPlayerCount(start)
    setLocalHumans(Math.min(2, Math.max(1, start)))
    setAiSeats(start > 1 ? 1 : 0)
  }, [game?.id])

  if (!game) return <div className="page"><button className="btn-back" onClick={() => navigate('games')}>Back</button><p>Game not found.</p></div>

  const maxPlayers = Math.min(5, maxPlayersForGame(game))
  const slots = makeSlots({ count: playerCount, mode: mode || 'local', aiSeats, localHumans })
  const canPlayAi = allowedModes.includes('ai') || allowedModes.includes('single')
  const onlineReady = game.supportsOnline && maxPlayers >= 2

  function updateCount(next) {
    const count = clampPlayerCount(next, game)
    setPlayerCount(count)
    setLocalHumans(prev => Math.max(1, Math.min(prev, count)))
    setAiSeats(prev => Math.max(0, Math.min(prev, Math.max(0, count - 1))))
  }

  function startOffline(selectedMode) {
    const count = selectedMode === 'single' ? 1 : playerCount
    navigate('play', {
      gameId: game.id,
      mode: selectedMode,
      difficulty,
      playerCount: count,
      playerRole: 'X',
      roomCode: null,
      playerSlots: makeSlots({ count, mode: selectedMode, aiSeats, localHumans }),
    })
  }

  function openPeople(tab = 'friends', extra = {}) {
    if (!access?.isFull) {
      navigate('account')
      return
    }
    navigate('friends', { gameId: game.id, tab, ...extra })
  }

  const CountControls = ({ includeLocal = false }) => <div className="gt-setup-controls">
    {mode !== 'single' && <div><b>Players</b><div className="clean-chip-row">{Array.from({ length: Math.max(1, maxPlayers - 1) }, (_, i) => i + 2).map(n => <button key={n} className={`count-btn ${playerCount === n ? 'active' : ''}`} onClick={() => updateCount(n)}>{n}</button>)}</div></div>}
    {includeLocal && <div><b>People on this device</b><div className="clean-chip-row">{Array.from({ length: playerCount }, (_, i) => i + 1).map(n => <button key={n} className={`count-btn ${localHumans === n ? 'active' : ''}`} onClick={() => { setLocalHumans(n); setAiSeats(Math.min(aiSeats, playerCount - n)) }}>{n}</button>)}</div></div>}
    {mode !== 'single' && <div><b>AI fill</b><div className="clean-chip-row">{Array.from({ length: playerCount }, (_, i) => i).map(n => <button key={n} className={`count-btn ${aiSeats === n ? 'active' : ''}`} onClick={() => setAiSeats(n)}>{n}</button>)}</div></div>}
    <SlotPreview slots={slots} />
  </div>

  return <div className="page setup-page gt-simple-setup">
    <div className="page-header"><button className="btn-back" onClick={() => mode ? setMode(null) : navigate('games')}>{mode ? 'Modes' : 'Games'}</button><h2 className="page-title">{game.icon} {game.title}</h2></div>
    <p className="setup-game-desc">{game.desc}</p>

    {!mode && <section className="setup-section gt-play-menu">
      <h3 className="setup-heading">How do you want to play?</h3>
      <p className="setup-desc">Pick a match type for {game.title}.</p>
      <div className="gt-play-choice-grid">
        <button className="gt-play-choice" disabled={!canPlayAi} onClick={() => setMode(allowedModes.includes('ai') ? 'ai' : 'single')}>
          <MODE_COPY.ai.Icon aria-hidden="true" />
          <b>{MODE_COPY.ai.title}</b>
          <small>{canPlayAi ? MODE_COPY.ai.desc : 'AI play is not available for this game yet.'}</small>
        </button>
        <button className="gt-play-choice" disabled={!onlineReady} onClick={() => openPeople('random', { autoRandom: true })}>
          <MODE_COPY.random.Icon aria-hidden="true" />
          <b>{MODE_COPY.random.title}</b>
          <small>{onlineReady ? MODE_COPY.random.desc : 'Online play is not available for this game yet.'}</small>
        </button>
        <button className="gt-play-choice" disabled={!onlineReady} onClick={() => openPeople('friends')}>
          <MODE_COPY.friend.Icon aria-hidden="true" />
          <b>{MODE_COPY.friend.title}</b>
          <small>{onlineReady ? MODE_COPY.friend.desc : 'Friend play is not available for this game yet.'}</small>
        </button>
      </div>
    </section>}

    {mode === 'single' && <section className="setup-section gt-setup-card"><h3>Solo</h3><div className="setup-difficulty-row">{['easy','medium','hard','expert'].map(d => <button key={d} className={`diff-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>)}</div><button className="btn-primary setup-go" onClick={() => startOffline('single')}>Start Solo</button></section>}

    {mode === 'ai' && <section className="setup-section gt-setup-card"><h3>Play vs AI</h3><div className="setup-difficulty-row">{['easy','medium','hard','expert'].map(d => <button key={d} className={`diff-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>)}</div><CountControls /><button className="btn-primary setup-go" onClick={() => startOffline('ai')}>Start AI Game</button></section>}

    {mode === 'local' && <section className="setup-section gt-setup-card"><h3>Same Device</h3><p className="setup-desc">Offline turns on this device.</p><CountControls includeLocal /><button className="btn-primary setup-go" onClick={() => startOffline('local')}>Start Same Device Game</button></section>}
  </div>
}
