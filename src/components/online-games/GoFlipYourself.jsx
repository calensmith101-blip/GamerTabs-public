import React, { useEffect, useMemo, useState } from 'react'

const RANKS = [
  'Bad Decisions','Awkward Silence','Dodgy Texts','Drama Magnet','Hot Mess','Lazy Excuses','Main Character','No Regrets','Petty Revenge','Questionable Choices','Red Flags','Total Stitch-Up','Walk of Shame'
]
const COLORS = ['#f97316','#ec4899','#8b5cf6','#06b6d4','#22c55e','#eab308']
const SAVE_KEY = 'gamertab_go_flip_yourself_v1'

function shuffle(list){ const a=[...list]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
function makeDeck(){ return shuffle(RANKS.flatMap(rank=>[0,1,2,3].map(copy=>({ id:`${rank}-${copy}`, rank, color:COLORS[RANKS.indexOf(rank)%COLORS.length] })))) }
function dealGame(playerCount=4, ai=false){
  const deck=makeDeck(); const dealCount=playerCount<=3?7:5
  const players=Array.from({length:playerCount},(_,i)=>({ id:i, name:i===0?'You': ai?`CPU ${i}`:`Player ${i+1}`, ai:i!==0&&ai, hand:[], books:[] }))
  for(let r=0;r<dealCount;r++) players.forEach(p=>{ if(deck.length) p.hand.push(deck.pop()) })
  return { players, deck, turn:0, asked:null, message:'Ask another player for a card type you already hold.', log:['New game started.'], gameOver:false, privacy:true }
}
function countRanks(hand){ return hand.reduce((m,c)=>({ ...m, [c.rank]:(m[c.rank]||0)+1 }),{}) }
function clearBooks(players, log){
  const updated=players.map(p=>({ ...p, hand:[...p.hand], books:[...p.books] }))
  updated.forEach(p=>{
    const counts=countRanks(p.hand)
    Object.entries(counts).forEach(([rank,n])=>{
      if(n>=4){
        p.hand=p.hand.filter(c=>c.rank!==rank)
        p.books.push(rank)
        log.unshift(`📚 ${p.name} laid down ${rank}.`)
      }
    })
  })
  return updated
}
function nextActive(gs, from=gs.turn){
  for(let i=1;i<=gs.players.length;i++){ const idx=(from+i)%gs.players.length; if(gs.players[idx].hand.length || gs.deck.length) return idx }
  return from
}
function Card({ card, small=false, hidden=false, onClick, selected }){
  return <button onClick={onClick} disabled={!onClick} style={{width:small?78:112,height:small?108:150,borderRadius:14,border:selected?'3px solid #fef08a':'2px solid rgba(255,255,255,.3)',background:hidden?'linear-gradient(135deg,#111827,#7f1d1d)':`linear-gradient(135deg,${card?.color||'#333'},#111827)`,color:'#fff',boxShadow:'0 10px 24px rgba(0,0,0,.35)',padding:8,fontWeight:900,textAlign:'center',display:'inline-flex',alignItems:'center',justifyContent:'center',margin:4,cursor:onClick?'pointer':'default'}}>{hidden?'GO FLIP':card?.rank}</button>
}
export default function GoFlipYourself({ gameMode='local', difficulty='normal', onBack }){
  const [mode,setMode]=useState(gameMode?.includes('ai')?'ai':'local')
  const [count,setCount]=useState(4)
  const [gs,setGs]=useState(()=>{ try{ return JSON.parse(localStorage.getItem(SAVE_KEY))||dealGame(4,false) }catch{ return dealGame(4,false) } })
  const [target,setTarget]=useState(1)
  const [rank,setRank]=useState('')
  const [showHelp,setShowHelp]=useState(false)
  useEffect(()=>localStorage.setItem(SAVE_KEY,JSON.stringify(gs)),[gs])
  const active=gs.players[gs.turn]
  const handRanks=Object.keys(countRanks(active?.hand||[]))
  useEffect(()=>{ if(!rank && handRanks.length) setRank(handRanks[0]) },[gs.turn, handRanks.join('|')])
  function newGame(nextMode=mode,nextCount=count){ setMode(nextMode); setCount(nextCount); const s=dealGame(nextMode==='ai'?Math.max(2,nextCount):nextCount,nextMode==='ai'); setGs(s); setTarget(1); setRank('') }
  function finishIfNeeded(state){
    const playable=state.deck.length>0 || state.players.some(p=>p.hand.length>0)
    if(!playable){ const max=Math.max(...state.players.map(p=>p.books.length)); const winners=state.players.filter(p=>p.books.length===max).map(p=>p.name).join(', '); return {...state, gameOver:true, message:`Game over. Winner: ${winners}`, log:[`🏆 ${winners} wins with ${max} sets.`,...state.log]} }
    return state
  }
  function ask(t=target, r=rank){
    setGs(prev=>{
      if(prev.gameOver) return prev
      const log=[...prev.log]
      const players=prev.players.map(p=>({...p, hand:[...p.hand], books:[...p.books]}))
      const asker=players[prev.turn], other=players[t]
      if(!asker.hand.some(c=>c.rank===r)) return {...prev,message:'You can only ask for a card type you already hold.'}
      const matches=other.hand.filter(c=>c.rank===r)
      let deck=[...prev.deck], turn=prev.turn, msg=''
      log.unshift(`${asker.name} asked ${other.name} for ${r}.`)
      if(matches.length){
        other.hand=other.hand.filter(c=>c.rank!==r); asker.hand.push(...matches); msg=`${other.name} had ${matches.length}. ${asker.name} goes again.`; log.unshift(`✅ ${other.name}: “Yes, hand them over.”`)
      } else {
        log.unshift(`😈 ${other.name}: “Go Flip Yourself!”`)
        const drawn=deck.pop(); if(drawn){ asker.hand.push(drawn); if(drawn.rank===r){ msg=`Lucky draw — ${asker.name} drew ${r} and goes again.`; log.unshift(`🎣 Lucky draw: ${r}.`) } else { msg=`${asker.name} drew a card. Turn passes.`; turn=nextActive({...prev,players},prev.turn) } } else { msg='Fishing pile empty. Turn passes.'; turn=nextActive({...prev,players},prev.turn) }
      }
      const withBooks=clearBooks(players,log)
      return finishIfNeeded({...prev,players:withBooks,deck,turn,message:msg,log:log.slice(0,30),privacy:true})
    })
  }
  useEffect(()=>{ if(active?.ai && !gs.gameOver){ const timer=setTimeout(()=>{ const ranks=Object.keys(countRanks(active.hand)); const r=ranks[Math.floor(Math.random()*ranks.length)]; const targets=gs.players.filter(p=>p.id!==active.id && (p.hand.length||gs.deck.length)); const t=targets[Math.floor(Math.random()*targets.length)]?.id; if(r && t!==undefined) ask(t,r) },700); return()=>clearTimeout(timer)} },[gs.turn, gs.gameOver])
  return <div className="page game-page"><button className="btn-back" onClick={onBack}>← Games</button><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><div><h1>Go Flip Yourself</h1><p className="muted">Adult Go Fish-style party card game. Collect the most four-card sets.</p></div><button className="btn-secondary" onClick={()=>setShowHelp(true)}>Rules</button></div>
    <div className="game-actions"><button onClick={()=>newGame('local',2)}>2 Same Device</button><button onClick={()=>newGame('local',4)}>4 Same Device</button><button onClick={()=>newGame('ai',4)}>Vs CPUs</button><button onClick={()=>newGame(mode,count)}>Reset</button></div>
    <div className="game-card"><h2>{gs.message}</h2><div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{gs.players.map(p=><div key={p.id} style={{padding:10,borderRadius:14,background:p.id===gs.turn?'rgba(250,204,21,.18)':'rgba(255,255,255,.06)',minWidth:150}}><b>{p.name}</b><div>{p.hand.length} cards · {p.books.length} sets</div><div style={{fontSize:12,color:'#fbbf24'}}>{p.books.join(', ')}</div></div>)}</div></div>
    {gs.privacy && !active?.ai && <div className="game-card" style={{textAlign:'center'}}><h2>Pass to {active?.name}</h2><p>Hide the hand before passing the device.</p><button onClick={()=>setGs(p=>({...p,privacy:false}))}>Reveal hand</button></div>}
    {!gs.privacy && active && !active.ai && !gs.gameOver && <div className="game-card"><h2>{active.name}'s turn</h2><div><label>Ask player: </label><select value={target} onChange={e=>setTarget(Number(e.target.value))}>{gs.players.filter(p=>p.id!==active.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label style={{marginLeft:12}}>For: </label><select value={rank} onChange={e=>setRank(e.target.value)}>{handRanks.map(r=><option key={r}>{r}</option>)}</select><button style={{marginLeft:12}} onClick={()=>ask()}>Ask</button></div><div style={{marginTop:14}}>{active.hand.map(c=><Card key={c.id} card={c} small />)}</div></div>}
    <div className="game-card"><h3>Fishing pile: {gs.deck.length}</h3><h3>Log</h3>{gs.log.slice(0,8).map((l,i)=><p key={i} className="muted">{l}</p>)}</div>
    {showHelp&&<div className="modal-backdrop" onClick={()=>setShowHelp(false)}><div className="modal" onClick={e=>e.stopPropagation()}><h2>How to play</h2><p>2–3 players get 7 cards. 4+ players get 5. Ask a specific player for a rank you already hold. If they have it, they hand over all matching cards and you go again. If not, you draw from the fishing pile. If the draw matches your request, go again. Four matching cards make a set. Most sets wins.</p><button onClick={()=>setShowHelp(false)}>Close</button></div></div>}
  </div>
}
