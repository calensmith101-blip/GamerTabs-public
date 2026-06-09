import React, { useEffect, useMemo, useRef, useState } from 'react'

const SAVE_KEY = 'gamertab_vault_casino_lobby_v5'
const AGE_KEY = 'gamertab_vault_casino_age_ok'
const STARTING_CREDITS = 10000

const MACHINES = [
  { id: 'dream-spirits', title: 'Dream Spirits', icon: '🪶', glow: '#f59e0b', bg: 'linear-gradient(160deg,#050505,#2b1608 38%,#b8860b)', wild: '⛺', scatter: '🧿', symbols: ['9','10','J','Q','K','A','🦬','🪶','🪓','💎','⛺','🧿'] },
  { id: 'ninja-moon', title: 'Ninja Moon', icon: '🥷', glow: '#38bdf8', bg: 'linear-gradient(160deg,#020617,#172554 45%,#38bdf8)', wild: '🥷', scatter: '🌙', symbols: ['9','10','J','Q','K','A','⚔️','🏮','🐉','💎','🥷','🌙'] },
  { id: 'pirate-gold', title: 'Pirate Gold', icon: '🏴‍☠️', glow: '#facc15', bg: 'linear-gradient(160deg,#050505,#4a1d0f 45%,#ca8a04)', wild: '🏴‍☠️', scatter: '🧭', symbols: ['9','10','J','Q','K','A','⚓','🦜','💰','💎','🏴‍☠️','🧭'] },
  { id: 'jewels-arabia', title: 'Jewels of Arabia', icon: '🧞', glow: '#c084fc', bg: 'linear-gradient(160deg,#120617,#581c87 45%,#f59e0b)', wild: '🧞', scatter: '🕌', symbols: ['9','10','J','Q','K','A','🛕','💍','🔮','💎','🧞','🕌'] },
  { id: 'outback-lightning', title: 'Outback Lightning', icon: '⚡', glow: '#fb923c', bg: 'linear-gradient(160deg,#020617,#422006 42%,#f97316)', wild: '⚡', scatter: '🌩️', symbols: ['9','10','J','Q','K','A','🦘','🌵','🔥','💎','⚡','🌩️'] },
]

const TABLES = [
  { id: 'blackjack', title: 'Blackjack', icon: '🃏', subtitle: 'Bet, hit, stand. Simple casino table.' },
  { id: 'texas', title: "Texas Hold'em", icon: '♠️', subtitle: 'Bet round with AI table cards.' },
]

const rand = n => Math.floor(Math.random() * n)
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const money = n => Number(n || 0).toLocaleString()
const CARD_RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const CARD_SUITS = ['S','H','D','C']
const drawCard = () => `${CARD_RANKS[rand(CARD_RANKS.length)]}${CARD_SUITS[rand(CARD_SUITS.length)]}`
const cardRank = card => String(card || '').replace(/[SHDC]$/, '')
const cardSuit = card => ({ S: '♠', H: '♥', D: '♦', C: '♣' }[String(card || '').slice(-1)] || '')
const cardRed = card => ['H', 'D'].includes(String(card || '').slice(-1))

function makeGrid(machine) {
  return Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => machine.symbols[rand(machine.symbols.length)]))
}

function defaultState() {
  const m = MACHINES[0]
  return {
    balance: STARTING_CREDITS,
    selected: null,
    bet: 9,
    lines: 9,
    grid: makeGrid(m),
    lastWin: 0,
    message: 'Choose a machine from the lobby.',
    muted: false,
    history: [],
    table: {
      bet: 100,
      hand: [],
      dealer: [],
      result: '',
      inHand: false,
      texasHand: [],
      texasBoard: [],
      texasResult: '',
    },
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
    return saved ? { ...defaultState(), ...saved, balance: Number(saved.balance ?? STARTING_CREDITS) } : defaultState()
  } catch {
    return defaultState()
  }
}

function Card({ children, className = '', style }) {
  return <div className={`vault-card ${className}`} style={style}>{children}</div>
}

function PlayingCard({ card, hidden = false }) {
  if (hidden) return <div className="casino-card back">?</div>
  return <div className={`casino-card ${cardRed(card) ? 'red' : ''}`}><b>{cardRank(card)}</b><span>{cardSuit(card)}</span></div>
}

function CardRow({ cards = [], hiddenSecond = false }) {
  return <div className="casino-card-row">
    {cards.length ? cards.map((card, index) => <PlayingCard key={`${card}-${index}`} card={card} hidden={hiddenSecond && index === 1} />) : <span className="casino-empty-cards">No cards yet</span>}
  </div>
}

function requestLandscape() {
  try {
    const el = document.documentElement
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {})
    const orientation = window.screen?.orientation
    if (orientation?.lock) orientation.lock('landscape').catch(() => {})
  } catch {}
}

function releaseLandscape() {
  try {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    window.screen?.orientation?.unlock?.()
  } catch {}
}

function evaluate(grid, machine, totalBet) {
  let win = 0
  const wins = []
  const lines = [0, 1, 2]
  lines.forEach(row => {
    const symbols = grid[row]
    const base = symbols.find(s => s !== machine.wild && s !== machine.scatter) || symbols[0]
    let count = 0
    for (const s of symbols) {
      if (s === base || s === machine.wild) count += 1
      else break
    }
    if (count >= 3) {
      const amount = Math.floor((count === 5 ? 22 : count === 4 ? 8 : 3) * totalBet)
      win += amount
      wins.push(`Row ${row + 1}: ${count} × ${base} = ${amount}`)
    }
  })
  const scatters = grid.flat().filter(s => s === machine.scatter).length
  if (scatters >= 3) {
    const amount = totalBet * scatters * 8
    win += amount
    wins.push(`${scatters} scatters = ${amount}`)
  }
  return { win, wins }
}

function ReelGrid({ grid, machine, spinning }) {
  return <div className="casino-reel-window">
    {Array.from({ length: 5 }).map((_, col) => <div key={col} className={`casino-reel ${spinning ? 'spinning' : ''}`}>
      {Array.from({ length: 3 }).map((_, row) => {
        const sym = grid[row]?.[col] || 'A'
        const special = sym === machine.wild || sym === machine.scatter
        return <div key={`${row}-${col}`} className={`casino-symbol ${special ? 'special' : ''}`}>{sym}</div>
      })}
    </div>)}
  </div>
}

export default function VaultCasino({ game, onBack, onExit }) {
  const [ageOk, setAgeOk] = useState(() => localStorage.getItem(AGE_KEY) === 'yes')
  const [state, setState] = useState(loadState)
  const [spinning, setSpinning] = useState(false)
  const [autoHold, setAutoHold] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [code, setCode] = useState('')
  const holdTimer = useRef(null)
  const exit = onBack || onExit

  const selectedMachine = useMemo(() => MACHINES.find(m => m.id === state.selected), [state.selected])
  const selectedTable = useMemo(() => TABLES.find(t => t.id === state.selected), [state.selected])

  useEffect(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) } catch {} }, [state])
  useEffect(() => () => { releaseLandscape(); if (holdTimer.current) clearInterval(holdTimer.current) }, [])

  function acceptAge() {
    localStorage.setItem(AGE_KEY, 'yes')
    setAgeOk(true)
  }

  function openGame(id) {
    const machine = MACHINES.find(m => m.id === id)
    setState(s => ({ ...s, selected: id, grid: machine ? makeGrid(machine) : s.grid, lastWin: 0, message: machine ? `${machine.title} loaded.` : 'Table opened.' }))
    setTimeout(requestLandscape, 100)
  }

  function backToLobby() {
    releaseLandscape()
    setAutoHold(false)
    if (holdTimer.current) clearInterval(holdTimer.current)
    setState(s => ({ ...s, selected: null, message: 'Back in the casino lobby.' }))
  }

  function addCredits(amount, label = 'Added credits') {
    setState(s => ({ ...s, balance: clamp(s.balance + amount, 0, 9999999), message: `${label}: +${money(amount)} credits.` }))
  }

  function redeemCode() {
    if (code.trim().toLowerCase() === 'cash') {
      addCredits(5000, 'Secret code accepted')
      setCode('')
      setShowCode(false)
    } else {
      setState(s => ({ ...s, message: 'Code not accepted.' }))
    }
  }

  function spin() {
    if (!selectedMachine || spinning) return
    const totalBet = clamp(state.bet, 1, 500)
    if (state.balance < totalBet) {
      setState(s => ({ ...s, message: 'Not enough credits. Visit the cashier or use a code.' }))
      return
    }
    setSpinning(true)
    let ticks = 0
    const spinInterval = setInterval(() => {
      ticks += 1
      setState(s => ({ ...s, grid: makeGrid(selectedMachine), message: 'Spinning…' }))
      if (ticks >= 12) {
        clearInterval(spinInterval)
        const grid = makeGrid(selectedMachine)
        const { win, wins } = evaluate(grid, selectedMachine, totalBet)
        setState(s => ({
          ...s,
          grid,
          balance: clamp(s.balance - totalBet + win, 0, 9999999),
          lastWin: win,
          message: win ? `WIN ${money(win)} credits!` : 'No win. Try again.',
          history: [`${selectedMachine.title}: bet ${totalBet}, ${win ? `won ${win}` : 'no win'}${wins.length ? ` (${wins.join(', ')})` : ''}`, ...s.history].slice(0, 20),
        }))
        setSpinning(false)
      }
    }, 70)
  }

  function startHoldSpin() {
    if (holdTimer.current) return
    setAutoHold(true)
    spin()
    holdTimer.current = setInterval(() => {
      setState(s => {
        if (s.balance < s.bet) return { ...s, message: 'Auto spin stopped: not enough credits.' }
        return s
      })
      spin()
    }, 1450)
  }

  function stopHoldSpin() {
    setAutoHold(false)
    if (holdTimer.current) clearInterval(holdTimer.current)
    holdTimer.current = null
  }

  function dealBlackjack() {
    const bet = clamp(state.table.bet, 5, 5000)
    if (state.balance < bet) return setState(s => ({ ...s, message: 'Not enough credits for that bet.' }))
    const hand = [drawCard(), drawCard()]
    const dealer = [drawCard(), drawCard()]
    const playerTotal = cardValue(hand)
    const dealerTotal = cardValue(dealer)
    if (playerTotal === 21 || dealerTotal === 21) {
      const win = playerTotal === 21 && dealerTotal !== 21
      const push = playerTotal === dealerTotal
      const payout = win ? Math.floor(bet * 2.5) : push ? bet : 0
      return setState(s => ({
        ...s,
        balance: clamp(s.balance - bet + payout, 0, 9999999),
        table: { ...s.table, hand, dealer, inHand: false, result: win ? `Blackjack! Won ${money(payout - bet)}.` : push ? 'Both blackjack. Push.' : 'Dealer blackjack.' },
        message: win ? `Blackjack pays ${money(payout - bet)} credits.` : push ? 'Blackjack push.' : 'Dealer blackjack.',
      }))
    }
    setState(s => ({
      ...s,
      balance: s.balance - bet,
      table: { ...s.table, hand, dealer, inHand: true, result: 'Hand dealt. Hit or stand.' },
      message: `Blackjack bet ${money(bet)}.`,
    }))
  }

  function cardValue(hand) {
    let total = 0; let aces = 0
    hand.forEach(c => {
      const r = cardRank(c)
      if (r === 'A') { aces += 1; total += 11 }
      else total += ['J','Q','K'].includes(r) ? 10 : Number(r)
    })
    while (total > 21 && aces) { total -= 10; aces -= 1 }
    return total
  }

  function hit() {
    setState(s => {
      if (!s.table.inHand) return s
      const hand = [...s.table.hand, drawCard()]
      const total = cardValue(hand)
      return { ...s, table: { ...s.table, hand, result: total > 21 ? 'Bust.' : 'Hit or stand.', inHand: total <= 21 }, message: total > 21 ? 'Bust. Dealer wins.' : 'Card drawn.' }
    })
  }

  function stand() {
    setState(s => {
      if (!s.table.inHand) return s
      let dealer = [...s.table.dealer]
      while (cardValue(dealer) < 17) dealer.push(drawCard())
      const player = cardValue(s.table.hand)
      const d = cardValue(dealer)
      const bet = clamp(s.table.bet, 5, 5000)
      const win = player <= 21 && (d > 21 || player > d)
      const push = player === d && player <= 21
      const payout = win ? bet * 2 : push ? bet : 0
      return { ...s, balance: s.balance + payout, table: { ...s.table, dealer, inHand: false, result: win ? `You win ${bet}` : push ? 'Push. Bet returned.' : 'Dealer wins.' }, message: win ? `Blackjack win ${bet}.` : push ? 'Push.' : 'Dealer wins.' }
    })
  }

  function texasBet() {
    const bet = clamp(state.table.bet, 5, 5000)
    if (state.balance < bet) return setState(s => ({ ...s, message: 'Not enough credits for that bet.' }))
    const texasHand = [drawCard(), drawCard()]
    const texasBoard = [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()]
    const ranks = [...texasHand, ...texasBoard].map(cardRank)
    const counts = ranks.reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {})
    const pairs = Object.values(counts).filter(v => v === 2).length
    const trips = Object.values(counts).some(v => v === 3)
    const quads = Object.values(counts).some(v => v >= 4)
    const madeHand = quads ? 'Four of a kind' : trips ? 'Three of a kind' : pairs >= 2 ? 'Two pair' : pairs === 1 ? 'Pair' : 'High card'
    const win = quads || trips || pairs >= 2 || (pairs === 1 && Math.random() > 0.35) || Math.random() > 0.72
    const multiplier = quads ? 8 : trips ? 4 : pairs >= 2 ? 3 : pairs === 1 ? 2 : 2
    const payout = win ? bet * multiplier : 0
    setState(s => ({
      ...s,
      balance: clamp(s.balance - bet + payout, 0, 9999999),
      lastWin: payout,
      table: { ...s.table, texasHand, texasBoard, texasResult: `${madeHand}. ${win ? `Won ${money(payout - bet)}.` : 'Lost.'}` },
      message: win ? `Texas Hold'em paid ${money(payout)} credits.` : `Texas Hold'em lost ${money(bet)} credits.`,
      history: [`Texas Hold'em: bet ${bet}, ${win ? `paid ${payout}` : 'lost'} (${madeHand})`, ...s.history].slice(0, 20),
    }))
  }

  if (!ageOk) {
    return <div className="game-shell vault-page"><Card><h2>🎰 Hidden Vault 18+</h2><p>This is virtual-credit entertainment only. No real-money deposits, withdrawals, prizes or cash value.</p><button className="bv-button" onClick={acceptAge}>I am 18+ and understand</button>{exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}</Card></div>
  }

  if (!state.selected) {
    return <div className="game-shell vault-page casino-lobby">
      <div className="vault-lobby-header">
        <div><h2>{game?.icon || '🎰'} Hidden Vault Casino</h2><p>One shared wallet. Virtual credits only.</p></div>
        <div className="vault-wallet" onClick={() => setShowCode(v => !v)}>Credits: ${money(state.balance)}</div>
        {exit && <button className="bv-button secondary" onClick={exit}>Exit Vault</button>}
      </div>

      {showCode && <Card className="vault-cashier"><h3>Cashier / Secret Code</h3><div className="vault-row"><input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter code" /><button className="bv-button" onClick={redeemCode}>Redeem</button></div><div className="vault-pack-row"><button onClick={() => addCredits(3000, '$2 demo pack')} className="bv-button secondary">$3k = $2</button><button onClick={() => addCredits(6000, '$4 demo pack')} className="bv-button secondary">$6k = $4</button><button onClick={() => addCredits(9000, '$5 demo pack')} className="bv-button secondary">$9k = $5</button></div></Card>}

      <h3 className="vault-section-title">Pokie Machines</h3>
      <div className="vault-lobby-grid">
        {MACHINES.map(m => <button key={m.id} className="vault-machine-tile" style={{ '--glow': m.glow, background: m.bg }} onClick={() => openGame(m.id)}><span className="vault-machine-icon">{m.icon}</span><b>{m.title}</b><small>5 reels • shared wallet • fullscreen landscape</small></button>)}
      </div>
      <h3 className="vault-section-title">Table Games</h3>
      <div className="vault-lobby-grid table-grid">
        {TABLES.map(t => <button key={t.id} className="vault-machine-tile table" onClick={() => openGame(t.id)}><span className="vault-machine-icon">{t.icon}</span><b>{t.title}</b><small>{t.subtitle}</small></button>)}
      </div>
      <p className="vault-disclaimer">Virtual credits only. No cash value, deposits, withdrawals or real-money gambling.</p>
    </div>
  }

  if (selectedTable) {
    return <div className="casino-play-fullscreen table-play">
      <div className="casino-topbar"><button className="bv-button secondary" onClick={backToLobby}>Lobby</button><b>{selectedTable.icon} {selectedTable.title}</b><span>Credits: ${money(state.balance)}</span></div>
      <Card className="casino-table-card casino-table-layout">
        <div className="casino-table-head">
          <h2>{selectedTable.title}</h2>
          <div className="casino-bet-control"><label>Bet</label><input type="number" min="5" max="5000" value={state.table.bet} onChange={e => setState(s => ({ ...s, table: { ...s.table, bet: clamp(Number(e.target.value) || 5, 5, 5000) } }))} /></div>
        </div>
        {selectedTable.id === 'blackjack' ? <>
          <div className="casino-table-grid">
            <section className="casino-hand-panel"><h3>Dealer <span>{state.table.dealer.length && !state.table.inHand ? cardValue(state.table.dealer) : state.table.dealer.length ? `${cardValue([state.table.dealer[0]])}+?` : 0}</span></h3><CardRow cards={state.table.dealer} hiddenSecond={state.table.inHand} /></section>
            <section className="casino-hand-panel"><h3>You <span>{state.table.hand.length ? cardValue(state.table.hand) : 0}</span></h3><CardRow cards={state.table.hand} /></section>
          </div>
          <p className="casino-table-result">{state.table.result || 'Set your bet and deal.'}</p>
          <div className="casino-button-deck"><button className="bv-button" onClick={dealBlackjack} disabled={state.table.inHand}>Deal</button><button className="bv-button secondary" disabled={!state.table.inHand} onClick={hit}>Hit</button><button className="bv-button secondary" disabled={!state.table.inHand} onClick={stand}>Stand</button></div>
        </> : <>
          <div className="casino-table-grid texas-grid">
            <section className="casino-hand-panel"><h3>Your hand</h3><CardRow cards={state.table.texasHand} /></section>
            <section className="casino-hand-panel"><h3>Board</h3><CardRow cards={state.table.texasBoard} /></section>
          </div>
          <p className="casino-table-result">{state.table.texasResult || 'Set your bet and play a hand.'}</p>
          <div className="casino-button-deck"><button className="bv-button" onClick={texasBet}>Play Hand</button></div>
        </>}
        <p className="casino-message">{state.message}</p>
      </Card>
    </div>
  }

  return <div className="casino-play-fullscreen" style={{ '--machine-glow': selectedMachine.glow, background: selectedMachine.bg }}>
    <div className="casino-topbar"><button className="bv-button secondary" onClick={backToLobby}>← Lobby</button><b>{selectedMachine.icon} {selectedMachine.title}</b><span>Credits: ${money(state.balance)}</span></div>
    <div className="casino-machine-body">
      <div className="casino-machine-title"><h2>{selectedMachine.title}</h2><p>Wild {selectedMachine.wild} • Scatter {selectedMachine.scatter}</p></div>
      <ReelGrid grid={state.grid} machine={selectedMachine} spinning={spinning} />
      <div className="casino-meters"><span>CREDITS<br/><b>{money(state.balance)}</b></span><span>BET<br/><b>{money(state.bet)}</b></span><span>WIN<br/><b>{money(state.lastWin)}</b></span><span>LINES<br/><b>{state.lines}</b></span></div>
      <div className="casino-message">{state.message}</div>
      <div className="casino-button-deck">
        <button className="bv-button secondary" onClick={() => setState(s => ({ ...s, bet: clamp(s.bet - 1, 1, 500) }))}>Bet -</button>
        <button className="bv-button secondary" onClick={() => setState(s => ({ ...s, bet: clamp(s.bet + 1, 1, 500) }))}>Bet +</button>
        <button className="bv-button spin-main" onClick={spin} disabled={spinning}>{spinning ? 'SPINNING' : 'SPIN'}</button>
        <button className={`bv-button secondary ${autoHold ? 'active' : ''}`} onMouseDown={startHoldSpin} onMouseUp={stopHoldSpin} onMouseLeave={stopHoldSpin} onTouchStart={startHoldSpin} onTouchEnd={stopHoldSpin}>{autoHold ? 'AUTO SPINNING' : 'HOLD SPIN'}</button>
        <button className="bv-button secondary" onClick={() => setState(s => ({ ...s, muted: !s.muted }))}>{state.muted ? 'Muted' : 'Sound'}</button>
      </div>
    </div>
  </div>
}
