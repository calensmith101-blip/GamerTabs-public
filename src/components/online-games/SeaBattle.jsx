import React, { useEffect, useMemo, useState } from 'react'
import { useOnlineGame } from '../../hooks/useOnlineGame'

const SIZE = 10
const COLS = 'ABCDEFGHIJ'.split('')
const SHIPS = [
  { id: 'carrier', name: 'Carrier', size: 5, icon: '▰', color: '#94a3b8' },
  { id: 'battleship', name: 'Battleship', size: 4, icon: '▰', color: '#cbd5e1' },
  { id: 'cruiser', name: 'Cruiser', size: 3, icon: '▰', color: '#7dd3fc' },
  { id: 'submarine', name: 'Submarine', size: 3, icon: '▰', color: '#38bdf8' },
  { id: 'destroyer', name: 'Destroyer', size: 2, icon: '▰', color: '#e2e8f0' },
]

const SAVE_KEY = 'gamertab_sea_battle_v3'

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => ({ shipId: null })))
}

function cloneGrid(grid) {
  return (grid || emptyGrid()).map(row => row.map(cell => ({ ...cell })))
}

function cellsFor(r, c, size, dir) {
  return Array.from({ length: size }, (_, i) => dir === 'h' ? [r, c + i] : [r + i, c])
}

function canPlace(grid, cells) {
  return cells.every(([r, c]) => r >= 0 && r < SIZE && c >= 0 && c < SIZE && !grid[r][c].shipId)
}

function placeFleetRandom() {
  let grid = emptyGrid()
  for (const ship of SHIPS) {
    let placed = false
    let tries = 0
    while (!placed && tries < 2000) {
      tries += 1
      const dir = Math.random() > 0.5 ? 'h' : 'v'
      const r = Math.floor(Math.random() * SIZE)
      const c = Math.floor(Math.random() * SIZE)
      const cells = cellsFor(r, c, ship.size, dir)
      if (canPlace(grid, cells)) {
        const next = cloneGrid(grid)
        cells.forEach(([rr, cc]) => { next[rr][cc].shipId = ship.id })
        grid = next
        placed = true
      }
    }
  }
  return grid
}

function createState(mode = 'ai') {
  const aiMode = String(mode || '').includes('ai') || String(mode || '').includes('alone')
  return {
    phase: 'placement',
    grids: { X: emptyGrid(), O: aiMode ? placeFleetRandom() : emptyGrid() },
    ready: { X: false, O: aiMode },
    shots: { X: [], O: [] },
    currentTurn: 'X',
    winner: null,
    message: aiMode ? 'Randomise your fleet, press Ready, then fire one shot per turn.' : 'Both players must ready their fleets before battle.',
    log: ['Sea Battle loaded. One shot only per turn — hit or miss.'],
  }
}

function normalizeState(s, mode) {
  if (!s || !s.grids || !s.shots) return createState(mode)
  return {
    ...createState(mode),
    ...s,
    grids: { X: cloneGrid(s.grids?.X), O: cloneGrid(s.grids?.O) },
    ready: { X: !!s.ready?.X, O: !!s.ready?.O },
    shots: { X: Array.isArray(s.shots?.X) ? s.shots.X : [], O: Array.isArray(s.shots?.O) ? s.shots.O : [] },
  }
}

function shotAt(shots, r, c) {
  return (shots || []).find(s => s.r === r && s.c === c)
}

function shipCells(grid, shipId) {
  const out = []
  grid.forEach((row, r) => row.forEach((cell, c) => { if (cell.shipId === shipId) out.push([r, c]) }))
  return out
}

function isShipSunk(grid, incomingShots, shipId) {
  const cells = shipCells(grid, shipId)
  return cells.length > 0 && cells.every(([r, c]) => !!shotAt(incomingShots, r, c)?.hit)
}

function allShipsSunk(grid, incomingShots) {
  return SHIPS.every(ship => isShipSunk(grid, incomingShots, ship.id))
}

function openTargets(myShots) {
  const list = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!shotAt(myShots, r, c)) list.push([r, c])
    }
  }
  return list
}

function chooseAiShot(state) {
  const shots = state.shots.O || []
  const hits = shots.filter(s => s.hit && !isShipSunk(state.grids.X, shots, s.shipId))
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (const h of hits.slice().reverse()) {
    for (const [dr, dc] of dirs) {
      const r = h.r + dr
      const c = h.c + dc
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && !shotAt(shots, r, c)) return [r, c]
    }
  }
  const checker = []
  const all = openTargets(shots)
  all.forEach(([r, c]) => { if ((r + c) % 2 === 0) checker.push([r, c]) })
  const pool = checker.length ? checker : all
  return pool[Math.floor(Math.random() * pool.length)] || null
}

function fireShot(state, shooter, r, c) {
  if (state.phase !== 'battle' || state.winner || state.currentTurn !== shooter) return state
  if (shotAt(state.shots[shooter], r, c)) return state
  const target = shooter === 'X' ? 'O' : 'X'
  const cell = state.grids[target][r][c]
  const hit = !!cell.shipId
  const nextShots = { ...state.shots, [shooter]: [...state.shots[shooter], { r, c, hit, shipId: cell.shipId || null }] }
  const sunk = hit && isShipSunk(state.grids[target], nextShots[shooter], cell.shipId)
  const winner = allShipsSunk(state.grids[target], nextShots[shooter]) ? shooter : null
  const msg = hit
    ? `${shooter === 'X' ? 'Player 1' : 'Player 2'} hit ${COLS[c]}${r + 1}${sunk ? ' and sunk a ship' : ''}!`
    : `${shooter === 'X' ? 'Player 1' : 'Player 2'} missed ${COLS[c]}${r + 1}.`
  return {
    ...state,
    shots: nextShots,
    currentTurn: winner ? shooter : target,
    winner,
    phase: winner ? 'gameover' : 'battle',
    message: winner ? `${shooter === 'X' ? 'Player 1' : 'Player 2'} wins — fleet destroyed!` : `${msg} Turn passes.`,
    log: [winner ? `${msg} Game over.` : msg, ...state.log].slice(0, 40),
  }
}

function fleetStatus(grid, incomingShots) {
  return SHIPS.map(ship => {
    const cells = shipCells(grid, ship.id)
    const hits = cells.filter(([r, c]) => !!shotAt(incomingShots, r, c)?.hit).length
    return { ...ship, hits, sunk: hits >= ship.size }
  })
}


function WarshipIcon({ shipId, hit = false, sunk = false, hidden = false }) {
  const ship = SHIPS.find(s => s.id === shipId)
  if (!shipId || hidden) return null
  const fill = sunk ? '#7f1d1d' : hit ? '#ef4444' : (ship?.color || '#cbd5e1')
  const stroke = sunk ? '#fecaca' : '#e0f2fe'
  if (shipId === 'submarine') {
    return (
      <svg viewBox="0 0 64 36" width="27" height="20" aria-hidden="true">
        <ellipse cx="32" cy="22" rx="24" ry="8" fill={fill} stroke={stroke} strokeWidth="2" />
        <rect x="28" y="8" width="9" height="11" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <circle cx="22" cy="22" r="2" fill="#0f172a" /><circle cx="32" cy="22" r="2" fill="#0f172a" /><circle cx="42" cy="22" r="2" fill="#0f172a" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 72 38" width="29" height="22" aria-hidden="true">
      <path d="M8 25 L58 25 L68 17 L62 31 L16 31 Z" fill={fill} stroke={stroke} strokeWidth="2" />
      <rect x="23" y="12" width="13" height="12" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <rect x="39" y="15" width="10" height="9" rx="2" fill={fill} stroke={stroke} strokeWidth="1.3" />
      {shipId === 'carrier' && <rect x="12" y="9" width="48" height="5" rx="2" fill={fill} stroke={stroke} strokeWidth="1" />}
      {hit && <text x="36" y="24" textAnchor="middle" fontSize="18" fill="#fff">✹</text>}
    </svg>
  )
}

function Cell({ children, onClick, bg = '#12395c', title = '' }) {
  return <button title={title} onClick={onClick} style={{ width: 34, height: 34, padding: 0, border: '1px solid rgba(255,255,255,.12)', background: bg, color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, cursor: onClick ? 'pointer' : 'default', overflow: 'hidden' }}>{children}</button>
}

function Grid({ title, grid, shots, own, onFire, disabled }) {
  return <div style={{ minWidth: 330 }}>
    <h3 style={{ color: own ? '#7dd3fc' : '#fca5a5', textAlign: 'center', margin: '6px 0 8px' }}>{title}</h3>
    <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(10, 34px)', gap: 2, justifyContent: 'center' }}>
      <div />{COLS.map(c => <div key={c} style={{ color: '#aaa', fontSize: 11, textAlign: 'center' }}>{c}</div>)}
      {grid.map((row, r) => <React.Fragment key={r}>
        <div style={{ color: '#aaa', fontSize: 11, textAlign: 'right', paddingRight: 3, lineHeight: '34px' }}>{r + 1}</div>
        {row.map((cell, c) => {
          const shot = shotAt(shots, r, c)
          const shipVisible = own && cell.shipId
          let bg = shipVisible ? 'linear-gradient(135deg,#075985,#0f172a)' : 'linear-gradient(135deg,#0f2d4a,#082f49)'
          let mark = ''
          if (shot?.hit) {
            bg = 'linear-gradient(135deg,#7f1d1d,#111827)'
            mark = (cell.shipId || shot.shipId) ? <WarshipIcon shipId={cell.shipId || shot.shipId} hit sunk={(cell.shipId || shot.shipId) && isShipSunk(grid, shots, cell.shipId || shot.shipId)} /> : <span style={{ fontSize: 22, color: '#fff' }}>💥</span>
          } else if (shot && !shot.hit) {
            bg = 'linear-gradient(135deg,#334155,#0f172a)'
            mark = <span style={{ fontSize: 18, opacity: .9 }}>•</span>
          } else if (shipVisible) {
            mark = <WarshipIcon shipId={cell.shipId} />
          }
          return <Cell key={c} bg={bg} title={`${COLS[c]}${r + 1}`} onClick={!own && !disabled && !shot ? () => onFire(r, c) : undefined}>{mark}</Cell>
        })}
      </React.Fragment>)}
    </div>
  </div>
}

export default function SeaBattle({ gameMode = 'ai', roomCode, playerRole = 'X', game, onBack, onExit }) {
  const modeText = String(gameMode || '').toLowerCase()
  const online = (modeText.includes('online') || modeText.includes('live')) && roomCode
  const aiMode = modeText.includes('ai') || modeText.includes('alone')
  const initial = useMemo(() => createState(gameMode), [gameMode, roomCode])
  const onlineGame = useOnlineGame(online ? roomCode : null, initial)
  const [localState, setLocalState] = useState(() => {
    try { return normalizeState(JSON.parse(localStorage.getItem(SAVE_KEY)), gameMode) } catch { return createState(gameMode) }
  })
  const [rules, setRules] = useState(false)
  const state = normalizeState(online ? onlineGame.gameState : localState, gameMode)
  const myRole = online ? (playerRole === 'O' ? 'O' : 'X') : (aiMode ? 'X' : state.currentTurn)
  const enemyRole = myRole === 'X' ? 'O' : 'X'
  const exit = onBack || onExit

  const save = (next) => {
    if (online) onlineGame.updateState(next)
    else {
      setLocalState(next)
      localStorage.setItem(SAVE_KEY, JSON.stringify(next))
    }
  }

  const reset = () => {
    const next = createState(gameMode)
    save(next)
  }

  const randomiseFleet = () => {
    const next = { ...state, grids: { ...state.grids, [myRole]: placeFleetRandom() }, ready: { ...state.ready, [myRole]: false }, message: `${myRole === 'X' ? 'Player 1' : 'Player 2'} fleet randomised. Press Ready when happy.` }
    save(next)
  }

  const readyUp = () => {
    let next = { ...state, ready: { ...state.ready, [myRole]: true }, message: `${myRole === 'X' ? 'Player 1' : 'Player 2'} is ready.` }
    if (aiMode) next.ready.O = true
    if (next.ready.X && next.ready.O) next = { ...next, phase: 'battle', currentTurn: 'X', message: 'Battle started. Player 1 fires first. One shot per turn.' }
    next.log = [next.message, ...next.log].slice(0, 40)
    save(next)
  }

  const fire = (r, c) => {
    if (online && myRole !== state.currentTurn) return
    if (!online && !aiMode && myRole !== state.currentTurn) return
    save(fireShot(state, myRole, r, c))
  }

  useEffect(() => {
    if (!aiMode || online || state.phase !== 'battle' || state.currentTurn !== 'O' || state.winner) return
    const t = setTimeout(() => {
      const pick = chooseAiShot(state)
      if (pick) save(fireShot(state, 'O', pick[0], pick[1]))
    }, 850)
    return () => clearTimeout(t)
  }, [aiMode, online, state])

  const canAct = state.phase === 'battle' && !state.winner && state.currentTurn === myRole && (!aiMode || myRole === 'X')
  const ownShotsIncoming = state.shots[enemyRole]
  const myTargetShots = state.shots[myRole]

  return <div className="game-shell" style={{ maxWidth: 980, margin: '0 auto' }}>
    <div className="game-header">
      <h2 className="bv-title">{game?.icon || '⚓'} Sea Battle</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="bv-button secondary" onClick={() => setRules(!rules)}>Rules</button>
        <button className="bv-button" onClick={reset}>New Game</button>
        {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
      </div>
    </div>

    {rules && <div className="rules-card"><b>Sea Battle rules:</b> Randomise your fleet, ready up, then fire at the opponent grid. A red warship/explosion means hit, grey • means miss. Unlike the old broken version, every shot now passes the turn whether it hits or misses, so nobody gets unlimited shots.</div>}

    <div className="turn-indicator">
      {online ? `You are Player ${myRole === 'X' ? '1' : '2'} · ` : ''}{state.message}
    </div>

    {state.phase === 'placement' && <div className="bv-card" style={{ padding: 14, margin: '10px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <b style={{ color: '#e8b800' }}>Fleet setup</b>
      <span style={{ color: '#aaa', fontSize: 13 }}>Player 1: {state.ready.X ? 'Ready' : 'Not ready'} · Player 2: {state.ready.O ? 'Ready' : aiMode ? 'CPU ready' : 'Not ready'}</span>
      <button className="bv-button" onClick={randomiseFleet}>Randomise My Fleet</button>
      <button className="bv-button" onClick={readyUp}>Ready</button>
    </div>}

    {state.winner && <div className="winner-banner">🏆 Player {state.winner === 'X' ? '1' : '2'} wins — enemy fleet destroyed!</div>}

    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
      <Grid title="Your Waters" grid={state.grids[myRole]} shots={ownShotsIncoming} own />
      <Grid title={canAct ? 'Enemy Waters — fire one shot' : 'Enemy Waters'} grid={state.grids[enemyRole]} shots={myTargetShots} onFire={fire} disabled={!canAct} />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 14 }}>
      <div className="bv-card" style={{ padding: 12 }}>
        <h4 style={{ color: '#7dd3fc', marginTop: 0 }}>Your fleet</h4>
        {fleetStatus(state.grids[myRole], ownShotsIncoming).map(s => <div key={s.id} style={{ fontSize: 12, color: s.sunk ? '#f87171' : '#ddd' }}><span style={{display:'inline-flex',alignItems:'center',gap:6}}>{s.sunk ? '🔥' : <WarshipIcon shipId={s.id} sunk={s.sunk} />} {s.name}: {s.hits}/{s.size}</span></div>)}
      </div>
      <div className="bv-card" style={{ padding: 12 }}>
        <h4 style={{ color: '#fca5a5', marginTop: 0 }}>Enemy fleet</h4>
        {fleetStatus(state.grids[enemyRole], myTargetShots).map(s => <div key={s.id} style={{ fontSize: 12, color: s.sunk ? '#f87171' : '#ddd' }}><span style={{display:'inline-flex',alignItems:'center',gap:6}}>{s.sunk ? <WarshipIcon shipId={s.id} sunk /> : '○ Hidden'} {s.name}: {s.hits}/{s.size}</span></div>)}
      </div>
      <div className="bv-card" style={{ padding: 12 }}>
        <h4 style={{ color: '#fca5a5', marginTop: 0 }}>Your shots</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {myTargetShots.slice(-18).map((s, i) => <span key={i} style={{ padding: '3px 6px', borderRadius: 7, background: s.hit ? 'rgba(239,68,68,.25)' : 'rgba(148,163,184,.18)', color: s.hit ? '#fecaca' : '#cbd5e1', fontSize: 11 }}>{COLS[s.c]}{s.r + 1} {s.hit ? 'HIT' : 'MISS'}</span>)}
          {!myTargetShots.length && <span style={{ color: '#888', fontSize: 12 }}>No shots fired yet.</span>}
        </div>
      </div>
      <div className="bv-card" style={{ padding: 12, maxHeight: 170, overflowY: 'auto' }}>
        <h4 style={{ color: '#e8b800', marginTop: 0 }}>Battle log</h4>
        {state.log.map((l, i) => <div key={i} style={{ fontSize: 12, color: i ? '#888' : '#fff', marginBottom: 4 }}>{l}</div>)}
      </div>
    </div>
  </div>
}
