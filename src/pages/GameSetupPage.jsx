import { useEffect, useMemo, useState } from 'react'
import { getGame, getGamePlayModes } from '../lib/games'

const SEATS = ['X', 'O', 'P3', 'P4', 'P5', 'P6']

const MODE_COPY = {
  ai: { icon: 'AI', title: 'Play vs AI', desc: 'Computer opponents. Choose difficulty and seats.' },
  local: { icon: '1D', title: 'Same Device', desc: 'Offline pass-and-play on one phone, tablet or computer.' },
  single: { icon: '1P', title: 'Solo', desc: 'Single-player mode.' },
  friend: { icon: 'FR', title: 'Play With Friend', desc: 'Invite a saved friend on another device. AI can fill extra seats.' },
  online: { icon: 'ON', title: 'Find Online Player', desc: 'Pick an online app user and invite them into this game.' },
  code: { icon: '#', title: 'Private Code', desc: 'Create or join a room with a private code.' },
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

export default function GameSetupPage({ navigate, params = {} }) {
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

  function openPeople(tab = 'friends') {
    navigate('friends', { gameId: game.id, tab })
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
      <p className="setup-desc">Choose AI practice, same-device pass-and-play, or real users on separate devices with optional AI seats.</p>
      <div className="gt-play-choice-grid">
        {allowedModes.includes('ai') && <button className="gt-play-choice" onClick={() => setMode('ai')}>
          <span>{MODE_COPY.ai.icon}</span><b>{MODE_COPY.ai.title}</b><small>{MODE_COPY.ai.desc}</small>
        </button>}
        {allowedModes.includes('local') && <button className="gt-play-choice" onClick={() => setMode('local')}>
          <span>{MODE_COPY.local.icon}</span><b>{MODE_COPY.local.title}</b><small>{MODE_COPY.local.desc}</small>
        </button>}
        {game.supportsOnline && maxPlayers >= 2 && <button className="gt-play-choice" onClick={() => openPeople('friends')}>
          <span>{MODE_COPY.friend.icon}</span><b>{MODE_COPY.friend.title}</b><small>{MODE_COPY.friend.desc}</small>
        </button>}
        {game.supportsOnline && maxPlayers >= 2 && <button className="gt-play-choice" onClick={() => openPeople('online')}>
          <span>{MODE_COPY.online.icon}</span><b>{MODE_COPY.online.title}</b><small>{MODE_COPY.online.desc}</small>
        </button>}
        {game.supportsOnline && maxPlayers >= 2 && <button className="gt-play-choice" onClick={() => openPeople('resume')}>
          <span>{MODE_COPY.code.icon}</span><b>{MODE_COPY.code.title}</b><small>{MODE_COPY.code.desc}</small>
        </button>}
        {allowedModes.includes('single') && <button className="gt-play-choice" onClick={() => setMode('single')}>
          <span>{MODE_COPY.single.icon}</span><b>{MODE_COPY.single.title}</b><small>{MODE_COPY.single.desc}</small>
        </button>}
      </div>
    </section>}

    {mode === 'single' && <section className="setup-section gt-setup-card"><h3>Solo</h3><div className="setup-difficulty-row">{['easy','medium','hard','expert'].map(d => <button key={d} className={`diff-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>)}</div><button className="btn-primary setup-go" onClick={() => startOffline('single')}>Start Solo</button></section>}

    {mode === 'ai' && <section className="setup-section gt-setup-card"><h3>Play vs AI</h3><div className="setup-difficulty-row">{['easy','medium','hard','expert'].map(d => <button key={d} className={`diff-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>)}</div><CountControls /><button className="btn-primary setup-go" onClick={() => startOffline('ai')}>Start AI Game</button></section>}

    {mode === 'local' && <section className="setup-section gt-setup-card"><h3>Same Device</h3><p className="setup-desc">Offline turns on this device. Use Play With Friend or Find Online Player for separate devices and AI fill.</p><CountControls includeLocal /><button className="btn-primary setup-go" onClick={() => startOffline('local')}>Start Same Device Game</button></section>}
  </div>
}
