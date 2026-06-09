import React, { useEffect, useMemo, useState } from 'react'

const SAVE_KEY = 'gamertab_kingdom_conquest_risk_map_v2'
const PLAYER_NAMES = ['Red Army', 'Blue Army', 'Green Army', 'Gold Army', 'Purple Army', 'Black Army']
const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#111827']
const CONTINENT_COLORS = {
  'North America': '#d8c36a',
  'South America': '#c98247',
  Europe: '#7d8fc8',
  Africa: '#9f7a4a',
  Asia: '#93b46f',
  Australia: '#b78cc8',
}
const CONTINENTS = {
  'North America': { bonus: 5, territories: ['Alaska', 'Northwest Territory', 'Greenland', 'Alberta', 'Ontario', 'Quebec', 'Western United States', 'Eastern United States', 'Central America'] },
  'South America': { bonus: 2, territories: ['Venezuela', 'Peru', 'Brazil', 'Argentina'] },
  Europe: { bonus: 5, territories: ['Iceland', 'Scandinavia', 'Ukraine', 'Great Britain', 'Northern Europe', 'Western Europe', 'Southern Europe'] },
  Africa: { bonus: 3, territories: ['North Africa', 'Egypt', 'East Africa', 'Congo', 'South Africa', 'Madagascar'] },
  Asia: { bonus: 7, territories: ['Ural', 'Siberia', 'Yakutsk', 'Kamchatka', 'Irkutsk', 'Mongolia', 'Japan', 'Afghanistan', 'Middle East', 'India', 'Siam', 'China'] },
  Australia: { bonus: 2, territories: ['Indonesia', 'New Guinea', 'Western Australia', 'Eastern Australia'] },
}
const ADJ = {
'Alaska':['Northwest Territory','Alberta','Kamchatka'],'Northwest Territory':['Alaska','Alberta','Ontario','Greenland'],'Greenland':['Northwest Territory','Ontario','Quebec','Iceland'],'Alberta':['Alaska','Northwest Territory','Ontario','Western United States'],'Ontario':['Northwest Territory','Greenland','Quebec','Eastern United States','Western United States','Alberta'],'Quebec':['Greenland','Ontario','Eastern United States'],'Western United States':['Alberta','Ontario','Eastern United States','Central America'],'Eastern United States':['Western United States','Ontario','Quebec','Central America'],'Central America':['Western United States','Eastern United States','Venezuela'],
'Venezuela':['Central America','Peru','Brazil'],'Peru':['Venezuela','Brazil','Argentina'],'Brazil':['Venezuela','Peru','Argentina','North Africa'],'Argentina':['Peru','Brazil'],
'Iceland':['Greenland','Great Britain','Scandinavia'],'Scandinavia':['Iceland','Great Britain','Northern Europe','Ukraine'],'Ukraine':['Scandinavia','Northern Europe','Southern Europe','Ural','Afghanistan','Middle East'],'Great Britain':['Iceland','Scandinavia','Northern Europe','Western Europe'],'Northern Europe':['Great Britain','Scandinavia','Ukraine','Western Europe','Southern Europe'],'Western Europe':['Great Britain','Northern Europe','Southern Europe','North Africa'],'Southern Europe':['Western Europe','Northern Europe','Ukraine','Middle East','Egypt','North Africa'],
'North Africa':['Brazil','Western Europe','Southern Europe','Egypt','East Africa','Congo'],'Egypt':['Southern Europe','Middle East','East Africa','North Africa'],'East Africa':['Egypt','Middle East','Madagascar','South Africa','Congo','North Africa'],'Congo':['North Africa','East Africa','South Africa'],'South Africa':['Congo','East Africa','Madagascar'],'Madagascar':['South Africa','East Africa'],
'Ural':['Ukraine','Siberia','China','Afghanistan'],'Siberia':['Ural','Yakutsk','Irkutsk','Mongolia','China'],'Yakutsk':['Siberia','Irkutsk','Kamchatka'],'Kamchatka':['Yakutsk','Irkutsk','Mongolia','Japan','Alaska'],'Irkutsk':['Siberia','Yakutsk','Kamchatka','Mongolia'],'Mongolia':['Siberia','Irkutsk','Kamchatka','Japan','China'],'Japan':['Kamchatka','Mongolia'],'Afghanistan':['Ukraine','Ural','China','India','Middle East'],'Middle East':['Ukraine','Afghanistan','India','East Africa','Egypt','Southern Europe'],'India':['Middle East','Afghanistan','China','Siam'],'Siam':['India','China','Indonesia'],'China':['Ural','Siberia','Mongolia','Afghanistan','India','Siam'],
'Indonesia':['Siam','New Guinea','Western Australia'],'New Guinea':['Indonesia','Western Australia','Eastern Australia'],'Western Australia':['Indonesia','New Guinea','Eastern Australia'],'Eastern Australia':['Western Australia','New Guinea']
}
const TERR = Object.keys(ADJ)
const POS = {
  'Alaska':[82,112],'Northwest Territory':[168,95],'Greenland':[335,70],'Alberta':[160,150],'Ontario':[245,150],'Quebec':[315,155],'Western United States':[170,210],'Eastern United States':[265,218],'Central America':[210,285],
  'Venezuela':[280,350],'Peru':[300,425],'Brazil':[390,405],'Argentina':[335,515],
  'Iceland':[430,130],'Scandinavia':[520,105],'Ukraine':[625,150],'Great Britain':[470,190],'Northern Europe':[540,205],'Western Europe':[485,270],'Southern Europe':[570,285],
  'North Africa':[515,365],'Egypt':[610,350],'East Africa':[650,430],'Congo':[585,475],'South Africa':[610,555],'Madagascar':[700,575],
  'Ural':[710,145],'Siberia':[795,110],'Yakutsk':[875,80],'Kamchatka':[980,110],'Irkutsk':[850,165],'Mongolia':[875,230],'Japan':[1015,245],'Afghanistan':[705,235],'Middle East':[650,305],'India':[760,330],'Siam':[830,385],'China':[805,270],
  'Indonesia':[835,475],'New Guinea':[965,460],'Western Australia':[895,555],'Eastern Australia':[1010,555]
}
const BLOB = {
  'North America': 'M50,70 C110,22 235,35 345,55 C378,90 360,165 320,205 C285,260 282,315 220,320 C150,322 85,285 58,220 C25,145 15,105 50,70 Z',
  'South America': 'M280,335 C350,318 430,350 445,410 C458,475 390,570 340,590 C285,538 265,450 270,390 C272,365 274,348 280,335 Z',
  Europe: 'M420,105 C505,70 650,85 675,145 C700,200 660,270 580,300 C505,325 425,280 425,210 C425,165 400,135 420,105 Z',
  Africa: 'M500,325 C590,292 710,330 735,420 C760,520 675,625 595,605 C510,585 480,505 490,430 C495,380 478,350 500,325 Z',
  Asia: 'M665,70 C800,20 1015,45 1060,125 C1115,225 1010,350 900,410 C790,470 675,400 655,315 C630,220 610,120 665,70 Z',
  Australia: 'M812,450 C910,415 1060,438 1085,530 C1115,610 1010,650 905,625 C825,605 785,500 812,450 Z'
}
const CARD_VALUES = [4,6,8,10,12,15,20,25,30,35,40,45,50]
const TROOPS = ['Infantry','Cavalry','Artillery']
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function owned(pid,terr){return Object.entries(terr).filter(([,v])=>v.owner===pid).map(([k])=>k)}
function continentOf(t){return Object.entries(CONTINENTS).find(([,c])=>c.territories.includes(t))?.[0]}
function continentBonus(pid,terr){return Object.values(CONTINENTS).reduce((sum,c)=>sum+(c.territories.every(t=>terr[t]?.owner===pid)?c.bonus:0),0)}
function calcReinforce(pid,terr){return Math.max(3,Math.floor(owned(pid,terr).length/3))+continentBonus(pid,terr)}
function roll(n){return Array.from({length:n},()=>1+Math.floor(Math.random()*6)).sort((a,b)=>b-a)}
function nextAlive(players,turn){let i=turn;do{i=(i+1)%players.length}while(!players[i].alive);return i}
function winner(players){const alive=players.filter(p=>p.alive);return alive.length===1?alive[0].id:null}
function makeDeck(){return shuffle([...TERR.map((t,i)=>({territory:t,type:TROOPS[i%3]})),{territory:'Wild',type:'Wild'},{territory:'Wild',type:'Wild'}])}
function cardSetValue(gs){return CARD_VALUES[Math.min(gs.trades, CARD_VALUES.length-1)] || 50}
function hasTradeSet(cards){if(cards.length<3)return null;const counts=TROOPS.map(t=>cards.filter(c=>c.type===t).length);const wild=cards.filter(c=>c.type==='Wild').length;const same=TROOPS.find((t,i)=>counts[i]+wild>=3);if(same)return cards.filter(c=>c.type===same||c.type==='Wild').slice(0,3);if(TROOPS.every((t,i)=>counts[i]>0)||wild){const set=[];TROOPS.forEach(t=>{const c=cards.find(x=>x.type===t); if(c)set.push(c)});while(set.length<3)set.push(cards.find(c=>c.type==='Wild'&&!set.includes(c)));return set}return null}
function initGame(count=4, ai=true){const terr={};shuffle(TERR).forEach((t,i)=>terr[t]={owner:i%count,armies:1});const players=Array.from({length:count},(_,i)=>({id:i,name:i===0?'You':ai?`CPU ${i}`:`Player ${i+1}`,ai:i!==0&&ai,alive:true,cards:[]}));return{players,territories:terr,turn:0,phase:'reinforce',reinforcements:calcReinforce(0,terr),selected:null,target:null,captured:false,deck:makeDeck(),discard:[],trades:0,log:['World map deployed. Conquer every territory to win.'],message:'Place reinforcements on your territories.',winner:null,privacy:true,lastRoll:null,lastCard:null}}
function ArmyPiece({color, armies }){return <g><circle r="18" fill={color} stroke="#fff" strokeWidth="3"/><path d="M-8 6h16l-2 10h-12zM-4 6v-11a4 4 0 0 1 8 0V6" fill="rgba(255,255,255,.75)"/><text y="7" textAnchor="middle" fontSize="16" fontWeight="900" fill="#111827">{armies}</text></g>}
function RiskMap({gs, onPick}){const activeOwner=gs.turn;return <div style={{overflow:'auto',borderRadius:24,border:'1px solid rgba(255,255,255,.12)',background:'linear-gradient(180deg,#e7d7ab,#b7d7dc)',boxShadow:'inset 0 0 50px rgba(0,0,0,.24)'}}><svg viewBox="0 0 1140 680" style={{minWidth:900,width:'100%',display:'block'}} role="img" aria-label="Risk-style world map board">
  <rect width="1140" height="680" rx="28" fill="#d9c490"/><rect x="18" y="18" width="1104" height="644" rx="24" fill="#b9d7d2" opacity=".92"/>
  <text x="570" y="42" textAnchor="middle" fontSize="32" fontWeight="900" fill="#7c2d12">KINGDOM CONQUEST</text><text x="570" y="67" textAnchor="middle" fontSize="14" fill="#7c2d12">World Map Board · 42 Territories · 6 Regions</text>
  {Object.entries(BLOB).map(([name,d])=><path key={name} d={d} fill={CONTINENT_COLORS[name]} stroke="#7c5a24" strokeWidth="3" opacity=".88"/>)}
  {Object.entries(ADJ).flatMap(([a,ns])=>ns.filter(b=>a<b).map(b=>{const [x1,y1]=POS[a], [x2,y2]=POS[b];return <line key={a+b} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b4f25" strokeWidth="2" strokeDasharray={Math.abs(x1-x2)>250?'8 8':'0'} opacity=".42"/>}))}
  {Object.entries(CONTINENTS).map(([name,c],i)=><g key={name}><text x={[180,355,540,600,830,965][i]} y={[62,610,92,640,62,640][i]} textAnchor="middle" fontSize="16" fontWeight="900" fill="#4a2d13">{name} +{c.bonus}</text></g>)}
  {TERR.map(t=>{const data=gs.territories[t];const [x,y]=POS[t];const selected=gs.selected===t,target=gs.target===t;const legal=gs.phase==='attack'&&gs.selected&&ADJ[gs.selected].includes(t)&&data.owner!==activeOwner;return <g key={t} transform={`translate(${x} ${y})`} onClick={()=>onPick(t)} style={{cursor:'pointer'}}>
    <circle r={selected?31:target?31:legal?29:25} fill={selected?'#fde047':target?'#fb7185':legal?'#f97316':'rgba(255,255,255,.7)'} stroke={COLORS[data.owner]} strokeWidth="5" opacity=".95"/>
    <ArmyPiece color={COLORS[data.owner]} armies={data.armies}/>
    <text y="38" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1f2937" stroke="#fef3c7" strokeWidth="3" paintOrder="stroke">{t}</text>
  </g>})}
  <g transform="translate(42 590)"><rect width="185" height="54" rx="12" fill="rgba(120,53,15,.8)"/><text x="92" y="23" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff">RISK CARDS</text><text x="92" y="42" textAnchor="middle" fontSize="12" fill="#fde68a">Deck {gs.deck.length} · Trade {cardSetValue(gs)} armies</text></g>
  <g transform="translate(920 28)"><rect width="180" height="64" rx="12" fill="rgba(15,23,42,.75)"/><text x="90" y="24" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">Dice Battle</text><text x="90" y="46" textAnchor="middle" fontSize="12" fill="#bfdbfe">Red attacks · White defends</text></g>
</svg></div>}

const PLAYER_SEATS = ['X', 'O', 'P3', 'P4', 'P5', 'P6']

function playerNameForSlot(slot, index, userId) {
  if (!slot) return PLAYER_NAMES[index] || `Player ${index + 1}`
  if (slot.kind === 'ai') return `CPU ${index + 1}`
  if (slot.kind === 'local') return index === 0 ? 'You' : `Local Player ${index + 1}`
  if (slot.userId && userId && String(slot.userId) === String(userId)) return 'You'
  if (slot.userId) return `Online Player ${index + 1}`
  return PLAYER_NAMES[index] || `Player ${index + 1}`
}

function initGameFromSlots(slots = [], fallbackCount = 4, currentUserId = null, fallbackAi = true) {
  const count = Math.max(2, Math.min(6, slots.length || Number(fallbackCount) || 4))
  const resolvedSlots = PLAYER_SEATS.slice(0, count).map((seat, index) => slots[index] || {
    seat,
    userId: index === 0 ? currentUserId : null,
    kind: index === 0 ? 'human' : (fallbackAi ? 'ai' : 'local'),
  })
  const terr = {}
  shuffle(TERR).forEach((t, i) => terr[t] = { owner: i % count, armies: 1 })
  const players = resolvedSlots.map((slot, i) => ({
    id: i,
    seat: slot.seat || PLAYER_SEATS[i],
    userId: slot.userId || null,
    name: playerNameForSlot(slot, i, currentUserId),
    ai: slot.kind === 'ai' || (!slot.userId && slot.kind !== 'local' && i > 0 && fallbackAi),
    local: slot.kind === 'local',
    online: !!slot.userId,
    alive: true,
    cards: [],
  }))
  return {
    players,
    territories: terr,
    turn: 0,
    phase: 'reinforce',
    reinforcements: calcReinforce(0, terr),
    selected: null,
    target: null,
    captured: false,
    deck: makeDeck(),
    discard: [],
    trades: 0,
    log: ['World map deployed. Conquer every territory to win.'],
    message: 'Place reinforcements on your territories.',
    winner: null,
    privacy: true,
    lastRoll: null,
    lastCard: null,
  }
}

function hasRiskState(state) {
  return !!(state && state.territories && state.players && Array.isArray(state.players))
}

function stripRoomMeta(state) {
  const { roomKind, activeGameId, members, playerSeats, playerSlots, setup, _gameUpdatedAt, ...game } = state || {}
  return game
}

export default function KingdomConquest({ gameMode = 'ai', onBack, roomCode, playerRole = 'X', playerSlots = [], playerCount = 4, session, onlineRoom, makeMove }) {
  const online = String(gameMode).includes('online') || !!roomCode
  const currentUserId = session?.user?.id || null
  const initialMode = online ? 'online' : String(gameMode).includes('local') ? 'local' : 'ai'
  const initialSlots = Array.isArray(playerSlots) && playerSlots.length ? playerSlots : onlineRoom?.state?.playerSlots || []

  const [mode, setMode] = useState(initialMode)
  const [gs, setGs] = useState(() => {
    if (online && hasRiskState(onlineRoom?.state)) return stripRoomMeta(onlineRoom.state)
    if (online) return initGameFromSlots(initialSlots, playerCount, currentUserId, true)
    if (initialSlots.length) return initGameFromSlots(initialSlots, playerCount, currentUserId, initialMode === 'ai')
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY)) || initGameFromSlots(initialSlots, playerCount, currentUserId, initialMode === 'ai')
    } catch {
      return initGameFromSlots(initialSlots, playerCount, currentUserId, initialMode === 'ai')
    }
  })
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (!online) localStorage.setItem(SAVE_KEY, JSON.stringify(gs))
  }, [gs, online])

  useEffect(() => {
    if (!online) return
    if (hasRiskState(onlineRoom?.state)) {
      setGs(stripRoomMeta(onlineRoom.state))
    }
  }, [online, onlineRoom?.state?._gameUpdatedAt, onlineRoom?.updated_at])

  useEffect(() => {
    if (!online || hasRiskState(onlineRoom?.state) || !makeMove) return
    const start = initGameFromSlots(initialSlots, playerCount, currentUserId, true)
    setGs(start)
    makeMove(start).catch(err => console.warn('[KingdomConquest] initial online sync failed:', err?.message || err))
  }, [online, roomCode])

  function applyUpdate(updater, sync = true) {
    setGs(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (online && sync && makeMove && next !== prev) {
        makeMove(next).catch(err => console.warn('[KingdomConquest] sync failed:', err?.message || err))
      }
      return next
    })
  }

  const active = gs.players[gs.turn]
  const mine = owned(gs.turn, gs.territories)
  const tradeSet = hasTradeSet(active?.cards || [])
  const activeSeat = active?.seat || PLAYER_SEATS[gs.turn] || 'X'
  const canControlActive = !!active && !active.ai && (!online || String(playerRole) === String(activeSeat))

  function reset(m = mode, c = playerCount || 4) {
    const nextSlots = m === 'online' ? (initialSlots.length ? initialSlots : playerSlots) : []
    const next = initGameFromSlots(nextSlots, c, currentUserId, m === 'ai' || m === 'online')
    setMode(m)
    applyUpdate(next)
  }

  function pick(t) {
    if (!canControlActive) return
    applyUpdate(prev => {
      const data = prev.territories[t]
      if (prev.phase === 'reinforce' && data.owner === prev.turn) return { ...prev, selected: t, message: `Selected ${t}. Place reinforcements here.` }
      if (prev.phase === 'attack') {
        if (data.owner === prev.turn && data.armies > 1) return { ...prev, selected: t, target: null, message: `Attack from ${t}. Choose an adjacent enemy territory.` }
        if (prev.selected && ADJ[prev.selected].includes(t) && data.owner !== prev.turn) return { ...prev, target: t, message: `Target ${t}. Roll the attack dice.` }
      }
      if (prev.phase === 'fortify') {
        if (data.owner === prev.turn && !prev.selected && data.armies > 1) return { ...prev, selected: t, message: `Move armies from ${t}.` }
        if (prev.selected && ADJ[prev.selected].includes(t) && data.owner === prev.turn) return { ...prev, target: t, message: `Fortify ${t}.` }
      }
      return prev
    })
  }

  function tradeCards() {
    if (!canControlActive && !active?.ai) return
    applyUpdate(prev => {
      const p = prev.players[prev.turn]
      const set = hasTradeSet(p.cards)
      if (!set) return prev
      const value = cardSetValue(prev)
      const players = prev.players.map(x => x.id === p.id ? { ...x, cards: x.cards.filter(c => !set.includes(c)) } : x)
      return { ...prev, players, discard: [...prev.discard, ...set], trades: prev.trades + 1, reinforcements: prev.reinforcements + value, message: `Traded cards for ${value} extra armies.`, log: [`🃏 ${p.name} traded Risk cards for ${value} armies.`, ...prev.log].slice(0, 40) }
    })
  }

  function place() {
    if (!canControlActive && !active?.ai) return
    applyUpdate(prev => {
      if (prev.phase !== 'reinforce' || !prev.selected || prev.reinforcements <= 0) return prev
      const terr = { ...prev.territories, [prev.selected]: { ...prev.territories[prev.selected], armies: prev.territories[prev.selected].armies + 1 } }
      const left = prev.reinforcements - 1
      return { ...prev, territories: terr, reinforcements: left, phase: left ? 'reinforce' : 'attack', message: left ? `${left} reinforcements left.` : 'Attack phase. Select one of your border territories.', log: [`🪖 Reinforced ${prev.selected}.`, ...prev.log].slice(0, 40) }
    })
  }

  function attack() {
    if (!canControlActive && !active?.ai) return
    applyUpdate(prev => {
      if (prev.phase !== 'attack' || !prev.selected || !prev.target) return prev
      let terr = { ...prev.territories }
      const from = { ...terr[prev.selected] }, to = { ...terr[prev.target] }
      const ad = roll(Math.min(3, from.armies - 1)), dd = roll(Math.min(2, to.armies))
      let lostA = 0, lostD = 0
      for (let i = 0; i < Math.min(ad.length, dd.length); i++) { if (ad[i] > dd[i]) lostD++; else lostA++ }
      from.armies -= lostA; to.armies -= lostD
      let msg = `${prev.selected} attacks ${prev.target}: ${ad.join('-')} vs ${dd.join('-')}.`
      let captured = prev.captured
      let deck = prev.deck, players = prev.players.map(p => ({ ...p, cards: [...(p.cards || [])] }))
      if (to.armies <= 0) {
        to.owner = prev.turn
        const moveIn = Math.max(1, Math.min(from.armies - 1, ad.length - lostA || 1))
        to.armies = moveIn; from.armies -= moveIn; captured = true; msg += ` Captured ${prev.target}!`
      }
      terr[prev.selected] = from; terr[prev.target] = to
      players.forEach(p => { p.alive = Object.values(terr).some(x => x.owner === p.id) })
      const win = winner(players)
      return { ...prev, players, territories: terr, deck, captured, selected: null, target: null, lastRoll: { ad, dd }, winner: win, message: win !== null ? `${players[win].name} conquers the world!` : msg, log: [msg, ...prev.log].slice(0, 40) }
    })
  }

  function endAttack() {
    if (!canControlActive && !active?.ai) return
    applyUpdate(p => ({ ...p, phase: 'fortify', selected: null, target: null, message: 'Fortify one adjacent friendly territory, or end turn.' }))
  }

  function fortify() {
    if (!canControlActive && !active?.ai) return
    applyUpdate(prev => {
      if (prev.phase !== 'fortify' || !prev.selected || !prev.target) return prev
      const terr = { ...prev.territories }
      terr[prev.selected] = { ...terr[prev.selected], armies: terr[prev.selected].armies - 1 }
      terr[prev.target] = { ...terr[prev.target], armies: terr[prev.target].armies + 1 }
      return { ...prev, territories: terr, message: `Moved 1 army to ${prev.target}.`, log: [`🛡 Fortified ${prev.target}.`, ...prev.log].slice(0, 40), selected: null, target: null }
    })
  }

  function endTurn() {
    if (!canControlActive && !active?.ai) return
    applyUpdate(prev => {
      let players = prev.players.map(p => ({ ...p, cards: [...(p.cards || [])] }))
      let deck = prev.deck, lastCard = null
      if (prev.captured && deck.length) { lastCard = deck[0]; deck = deck.slice(1); players[prev.turn].cards = [...players[prev.turn].cards, lastCard] }
      const n = nextAlive(players, prev.turn)
      return { ...prev, players, deck, lastCard, turn: n, phase: 'reinforce', reinforcements: calcReinforce(n, prev.territories), selected: null, target: null, captured: false, message: `${players[n].name} receives reinforcements.`, privacy: true, log: [prev.captured ? `🃏 ${players[prev.turn].name} earned a Risk card.` : `➡️ Turn ended.`, ...prev.log].slice(0, 40) }
    })
  }

  useEffect(() => {
    if (!active?.ai || gs.winner) return
    const t = setTimeout(() => {
      if (gs.phase === 'reinforce') {
        if (tradeSet) tradeCards()
        const borders = mine.filter(t => ADJ[t].some(n => gs.territories[n].owner !== gs.turn))
        const choice = borders.sort((a, b) => gs.territories[a].armies - gs.territories[b].armies)[0] || mine[0]
        applyUpdate(p => ({ ...p, selected: choice }))
        setTimeout(place, 90)
      } else if (gs.phase === 'attack') {
        const moves = mine.flatMap(t => ADJ[t].filter(n => gs.territories[n].owner !== gs.turn && gs.territories[t].armies > 1).map(n => [t, n])).sort((a, b) => (gs.territories[a[1]].armies - gs.territories[b[1]].armies) || (gs.territories[b[0]].armies - gs.territories[a[0]].armies))
        if (moves[0] && gs.territories[moves[0][0]].armies > gs.territories[moves[0][1]].armies) {
          applyUpdate(p => ({ ...p, selected: moves[0][0], target: moves[0][1] }))
          setTimeout(attack, 100)
        } else endAttack()
      } else if (gs.phase === 'fortify') endTurn()
    }, 600)
    return () => clearTimeout(t)
  }, [gs.turn, gs.phase, gs.reinforcements, gs.winner])

  return <div className="page game-page"><button className="btn-back" onClick={onBack}>← Games</button><div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'start'}}><div><h1>Kingdom Conquest</h1><p className="muted">Classic Risk-style tabletop map: reinforce, attack, fortify and control continents.</p>{online&&<p className="muted">Online room: <b>{roomCode}</b> · Your seat: <b>{playerRole}</b> · Active seat: <b>{activeSeat}</b></p>}</div><button onClick={()=>setShowHelp(true)}>Rules</button></div><div className="game-actions"><button onClick={()=>reset(mode, Math.max(4, playerCount || 4))}>New Map</button><button onClick={()=>reset(mode,5)}>5 Players</button><button onClick={()=>reset(mode,6)}>6 Players</button></div><div className="game-card"><h2>{gs.message}</h2><div>Phase: <b>{gs.phase}</b> · Reinforcements: <b>{gs.reinforcements}</b> · Cards: <b>{active?.cards?.length||0}</b></div>{online&&!canControlActive&&!active?.ai&&<p className="muted">Waiting for {active?.name || activeSeat}. You can watch the map live.</p>}<div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>{gs.players.map(p=><div key={p.id} style={{padding:10,borderRadius:14,background:p.id===gs.turn?'rgba(250,204,21,.18)':'rgba(255,255,255,.06)',border:`1px solid ${COLORS[p.id]}55`}}><b style={{color:COLORS[p.id]}}>● {p.name}</b><div>Seat {p.seat || PLAYER_SEATS[p.id]} · {p.ai?'CPU':p.online?'Online':'Local'}</div><div>{owned(p.id,gs.territories).length} territories · {owned(p.id,gs.territories).reduce((s,t)=>s+gs.territories[t].armies,0)} armies</div><div>{p.alive?'Alive':'Out'} · Cards {p.cards?.length||0}</div></div>)}</div>{gs.lastRoll&&<div style={{marginTop:10}}>🎲 Attack dice: <b style={{color:'#ef4444'}}>{gs.lastRoll.ad.join(', ')}</b> · Defence dice: <b>{gs.lastRoll.dd.join(', ')}</b></div>}</div>{gs.privacy&&!active.ai&&mode==='local'?<div className="game-card" style={{textAlign:'center'}}><h2>Pass to {active.name}</h2><p className="muted">Hide the map and card hand until the next commander is ready.</p><button onClick={()=>applyUpdate(p=>({...p,privacy:false}))}>Reveal map</button></div>:<><div className="game-actions">{gs.phase==='reinforce'&&<><button disabled={!gs.selected||!canControlActive} onClick={place}>Place 1 Army</button><button disabled={!tradeSet||!canControlActive} onClick={tradeCards}>Trade Cards +{cardSetValue(gs)}</button></>}{gs.phase==='attack'&&<><button disabled={!gs.selected||!gs.target||!canControlActive} onClick={attack}>Roll Attack Dice</button><button disabled={!canControlActive} onClick={endAttack}>Stop Attacking</button></>}{gs.phase==='fortify'&&<><button disabled={!gs.selected||!gs.target||!canControlActive} onClick={fortify}>Move 1 Army</button><button disabled={!canControlActive} onClick={endTurn}>End Turn</button></>}</div><RiskMap gs={gs} onPick={pick}/></>}<div className="game-card"><h3>Risk Cards</h3><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(active?.cards||[]).map((c,i)=><span key={i} style={{padding:'8px 10px',borderRadius:10,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.14)'}}>🃏 {c.territory} · {c.type}</span>)}{!(active?.cards||[]).length&&<span className="muted">Capture at least one territory before ending your turn to earn a card.</span>}</div></div><div className="game-card"><h3>Battle Log</h3>{gs.log.slice(0,10).map((l,i)=><p className="muted" key={i}>{l}</p>)}</div>{showHelp&&<div className="modal-backdrop" onClick={()=>setShowHelp(false)}><div className="modal" onClick={e=>e.stopPropagation()}><h2>Classic Risk-style rules</h2><p>Each turn has three steps: get and place new armies, attack adjacent enemy territories with dice, then fortify once. Reinforcements are territories divided by 3, minimum 3, plus continent bonuses. Attacker rolls up to 3 dice, defender up to 2; dice are compared highest to highest and defender wins ties. Capture at least one territory during your turn to earn one Risk card. Conquer every territory to win.</p><button onClick={()=>setShowHelp(false)}>Close</button></div></div>}</div>
}
