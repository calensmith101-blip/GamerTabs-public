import { useEffect, useMemo, useState } from 'react'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const VALUES = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]))
const SAVE_KEY = 'gamertab_texas_holdem_vault_v2'

function shuffle(cards) {
  const d = [...cards]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}
function makeDeck() { return shuffle(SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank, value: VALUES[rank], id: `${rank}${suit}-${Math.random()}` })))) }
function isRed(c) { return c?.suit === '♥' || c?.suit === '♦' }
function cardName(c) { return c ? `${c.rank}${c.suit}` : 'Hidden card' }

function evaluate(cards) {
  const vals = cards.map(c => c.value).sort((a, b) => b - a)
  const suits = {}
  const counts = {}
  cards.forEach(c => { suits[c.suit] = (suits[c.suit] || 0) + 1; counts[c.value] = (counts[c.value] || 0) + 1 })
  const unique = [...new Set(vals)].sort((a, b) => b - a)
  if (unique.includes(14)) unique.push(1)
  let straight = 0
  for (let i = 0; i <= unique.length - 5; i++) {
    const run = unique.slice(i, i + 5)
    if (run[0] - run[4] === 4) { straight = run[0]; break }
  }
  const flushSuit = Object.keys(suits).find(s => suits[s] >= 5)
  const flushVals = flushSuit ? cards.filter(c => c.suit === flushSuit).map(c => c.value).sort((a, b) => b - a) : []
  let straightFlush = 0
  if (flushSuit) {
    const u = [...new Set(flushVals)].sort((a, b) => b - a)
    if (u.includes(14)) u.push(1)
    for (let i = 0; i <= u.length - 5; i++) {
      const run = u.slice(i, i + 5)
      if (run[0] - run[4] === 4) { straightFlush = run[0]; break }
    }
  }
  const groups = Object.entries(counts).map(([v, n]) => ({ v: +v, n })).sort((a, b) => b.n - a.n || b.v - a.v)
  const four = groups.find(g => g.n === 4)
  const threes = groups.filter(g => g.n === 3)
  const pairs = groups.filter(g => g.n === 2)
  const kick = exclude => vals.filter(v => !exclude.includes(v))
  if (straightFlush) return { name: 'Straight Flush', score: [8, straightFlush] }
  if (four) return { name: 'Four of a Kind', score: [7, four.v, ...kick([four.v]).slice(0, 1)] }
  if (threes.length && (pairs.length || threes.length > 1)) return { name: 'Full House', score: [6, threes[0].v, pairs[0]?.v || threes[1].v] }
  if (flushSuit) return { name: 'Flush', score: [5, ...flushVals.slice(0, 5)] }
  if (straight) return { name: 'Straight', score: [4, straight] }
  if (threes.length) return { name: 'Three of a Kind', score: [3, threes[0].v, ...kick([threes[0].v]).slice(0, 2)] }
  if (pairs.length >= 2) return { name: 'Two Pair', score: [2, pairs[0].v, pairs[1].v, ...kick([pairs[0].v, pairs[1].v]).slice(0, 1)] }
  if (pairs.length) return { name: 'Pair', score: [1, pairs[0].v, ...kick([pairs[0].v]).slice(0, 3)] }
  return { name: 'High Card', score: [0, ...vals.slice(0, 5)] }
}
function compareHands(a, b) {
  for (let i = 0; i < Math.max(a.score.length, b.score.length); i++) {
    const diff = (a.score[i] || 0) - (b.score[i] || 0)
    if (diff) return diff
  }
  return 0
}

function newHand(mode = 'ai', playerCount = 2) {
  let deck = makeDeck()
  const count = Math.max(2, Math.min(4, Number(playerCount) || 2))
  const players = Array.from({ length: count }, (_, i) => ({
    id: i,
    name: i === 0 ? 'You' : String(mode).includes('local') ? `Player ${i + 1}` : `CPU ${i}`,
    chips: 1000,
    bet: 0,
    folded: false,
    cpu: i > 0 && !String(mode).includes('local'),
    hand: [],
    acted: false,
  }))
  for (let round = 0; round < 2; round++) players.forEach(p => p.hand.push(deck.shift()))
  players[0].chips -= 10; players[0].bet = 10
  if (players[1]) { players[1].chips -= 20; players[1].bet = 20 }
  return {
    deck,
    players,
    community: [],
    pot: 30,
    phase: 'preflop',
    current: 0,
    minBet: 20,
    winner: null,
    message: 'Cards dealt. Player cards are now large and visible.',
    dealStep: 2,
    log: ['Hole cards dealt face down/up around the table.', 'Small blind 10, big blind 20.'],
  }
}

function revealNextStreet(g) {
  const deck = [...g.deck]
  let community = [...g.community]
  let phase = g.phase
  if (phase === 'river') return showdown(g)
  const amount = phase === 'preflop' ? 3 : 1
  for (let i = 0; i < amount; i++) community.push(deck.shift())
  phase = phase === 'preflop' ? 'flop' : phase === 'flop' ? 'turn' : 'river'
  return { ...g, deck, community, phase, current: 0, minBet: 20, players: g.players.map(p => ({ ...p, bet: 0, acted: false })), message: `${phase.toUpperCase()} dealt to the centre.`, log: [`${phase.toUpperCase()} dealt.`, ...g.log].slice(0, 30) }
}

function showdown(g) {
  const active = g.players.filter(p => !p.folded)
  const ranked = active.map(p => ({ p, hand: evaluate([...p.hand, ...g.community]) })).sort((a, b) => compareHands(b.hand, a.hand))
  const winner = ranked[0]
  const players = g.players.map(p => p.id === winner.p.id ? { ...p, chips: p.chips + g.pot } : p)
  return { ...g, players, winner: winner.p.id, phase: 'showdown', message: `${winner.p.name} wins with ${winner.hand.name}.`, log: [`${winner.p.name} wins ${g.pot} with ${winner.hand.name}.`, ...g.log].slice(0, 30) }
}

function act(g, action) {
  if (g.winner) return g
  const players = g.players.map(p => ({ ...p }))
  let p = players[g.current]
  if (!p || p.folded) return { ...g, current: (g.current + 1) % players.length }
  let pot = g.pot
  let minBet = g.minBet
  let note = action
  if (action === 'fold') p.folded = true
  if (action === 'raise') {
    const amount = Math.min(80, p.chips)
    p.chips -= amount; p.bet += amount; pot += amount; minBet = Math.max(minBet, p.bet); note = `raises ${amount}`
  }
  if (action === 'call') {
    const need = Math.min(Math.max(minBet - p.bet, 0), p.chips)
    p.chips -= need; p.bet += need; pot += need; note = need ? `calls ${need}` : 'checks'
  }
  if (action === 'check') note = 'checks'
  p.acted = true

  const alive = players.filter(x => !x.folded)
  if (alive.length === 1) {
    const survivor = alive[0]
    const paid = players.map(x => x.id === survivor.id ? { ...x, chips: x.chips + pot } : x)
    return { ...g, players: paid, pot, winner: survivor.id, phase: 'showdown', message: `${survivor.name} wins after everyone else folded.`, log: [`${p.name} ${note}. ${survivor.name} wins.`, ...g.log].slice(0, 30) }
  }
  const next = (g.current + 1) % players.length
  const roundDone = next === 0
  const updated = { ...g, players, pot, minBet, current: next, message: `${p.name} ${note}.`, log: [`${p.name} ${note}.`, ...g.log].slice(0, 30) }
  return roundDone ? revealNextStreet(updated) : updated
}

function Card({ card, hidden = false, delay = 0 }) {
  const red = isRed(card)
  return <div style={{
    width: 76, height: 108, borderRadius: 12, background: hidden ? 'linear-gradient(135deg,#111827,#7f1d1d)' : '#f8fafc',
    color: hidden ? '#facc15' : red ? '#dc2626' : '#111827', border: hidden ? '2px solid #f59e0b' : '2px solid #e5e7eb',
    boxShadow: '0 10px 24px rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
    padding: 8, fontWeight: 900, fontFamily: 'Georgia, serif', transform: 'translateY(0)', animation: `dealIn .28s ease ${delay}ms both`,
  }}>
    {hidden ? <><span style={{ fontSize: 24 }}>🂠</span><span style={{ fontSize: 10 }}>VAULT</span></> : <><span style={{ alignSelf: 'flex-start', fontSize: 20 }}>{card.rank}</span><span style={{ fontSize: 34 }}>{card.suit}</span><span style={{ alignSelf: 'flex-end', fontSize: 20 }}>{card.rank}</span></>}
  </div>
}

function PlayerSeat({ player, active, community, showCards }) {
  const handName = player.hand?.length && community.length ? evaluate([...player.hand, ...community]).name : 'Waiting'
  return <div className={`player-card ${active ? 'active' : ''}`} style={{ padding: 12, borderRadius: 14, border: active ? '2px solid #facc15' : '1px solid rgba(255,255,255,.12)', background: player.folded ? 'rgba(80,20,20,.45)' : 'rgba(15,23,42,.88)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: '#fff' }}><b>{player.name}</b><span>${player.chips}</span></div>
    <div style={{ color: '#facc15', fontSize: 12 }}>Bet ${player.bet} {player.folded ? '· Folded' : ''}</div>
    <div style={{ display: 'flex', gap: 8, marginTop: 8, minHeight: 112 }}>{player.hand.map((c, i) => <Card key={i} card={c} hidden={!showCards} delay={i * 80} />)}</div>
    <small style={{ color: '#cbd5e1' }}>{showCards ? handName : 'Cards hidden'}</small>
  </div>
}

export default function TexasHoldemVault({ gameMode = 'ai', playerCount = 2, difficulty = 'medium', game }) {
  const [g, setG] = useState(() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || newHand(gameMode, playerCount) } catch { return newHand(gameMode, playerCount) } })
  const [rules, setRules] = useState(false)
  const [revealLocal, setRevealLocal] = useState(true)
  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(g)) }, [g])
  useEffect(() => {
    const p = g.players[g.current]
    if (!p?.cpu || g.winner) return
    const t = setTimeout(() => {
      const strength = evaluate([...p.hand, ...g.community]).score[0]
      const action = strength >= 2 ? 'raise' : strength >= 1 || Math.random() > 0.35 ? 'call' : 'fold'
      setG(prev => act(prev, action))
    }, difficulty === 'hard' ? 650 : 900)
    return () => clearTimeout(t)
  }, [g, difficulty])

  const current = g.players[g.current]
  const localMode = String(gameMode).includes('local')

  return <div className="vault-game" style={{ maxWidth: 1050, margin: '0 auto' }}>
    <style>{`@keyframes dealIn{from{opacity:0;transform:translateY(-28px) rotate(-4deg)}to{opacity:1;transform:translateY(0) rotate(0)}}`}</style>
    <div className="game-header"><h2>{game?.icon || '🃏'} Texas Hold'em</h2><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={() => setRules(!rules)}>Rules</button><button onClick={() => setG(newHand(gameMode, playerCount))}>New Hand</button>{localMode && <button onClick={() => setRevealLocal(v => !v)}>{revealLocal ? 'Hide Cards' : 'Reveal Cards'}</button>}</div></div>
    {rules && <div className="rules-card"><b>Texas Hold’em:</b> each player gets two hole cards. The table deals the flop, turn and river. Use your two cards plus the five community cards to make the best five-card poker hand. Cards are now large and visible; CPU/other player cards stay hidden until showdown.</div>}

    <div style={{ borderRadius: 28, padding: 22, background: 'radial-gradient(circle at center,#065f46,#022c22 68%,#020617)', border: '3px solid #92400e', boxShadow: 'inset 0 0 45px rgba(0,0,0,.55)', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12, color: '#fef3c7' }}>
        <b>Pot: ${g.pot}</b><b>{g.phase.toUpperCase()}</b><b>Deck: {g.deck.length}</b>
      </div>
      <div style={{ textAlign: 'center', color: '#fde68a', marginBottom: 8 }}>Community Cards</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, minHeight: 116 }}>
        {[0, 1, 2, 3, 4].map(i => g.community[i] ? <Card key={i} card={g.community[i]} delay={i * 100} /> : <Card key={i} hidden delay={i * 100} />)}
      </div>
      <p style={{ textAlign: 'center', color: '#fff', fontWeight: 700 }}>{g.message}</p>
    </div>

    <div className="players-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
      {g.players.map((p, i) => <PlayerSeat key={p.id} player={p} active={i === g.current && !g.winner} community={g.community} showCards={g.phase === 'showdown' || p.id === 0 || (localMode && revealLocal && i === g.current)} />)}
    </div>

    {!current?.cpu && !g.winner && <div className="action-row" style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
      <button onClick={() => setG(prev => act(prev, 'fold'))}>Fold</button>
      <button onClick={() => setG(prev => act(prev, 'check'))}>Check</button>
      <button onClick={() => setG(prev => act(prev, 'call'))}>Call</button>
      <button onClick={() => setG(prev => act(prev, 'raise'))}>Raise</button>
    </div>}

    {g.winner !== null && <div className="winner-banner">🏆 {g.players.find(p => p.id === g.winner)?.name} wins this hand.</div>}
    <div className="log-panel"><h4>Table Log</h4>{g.log.map((l, i) => <p key={i}>{l}</p>)}</div>
  </div>
}
