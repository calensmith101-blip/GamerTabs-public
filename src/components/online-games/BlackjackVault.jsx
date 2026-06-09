import React, { useEffect, useState } from 'react';

const SUITS = ['♠️','♥️','♦️','♣️'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const CHIP_BUTTONS = [5, 10, 25, 50, 100];

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function makeDeck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push({suit:s,rank:r});return shuffle(d)}
function cardValue(r){if(['J','Q','K'].includes(r))return 10;if(r==='A')return 11;return parseInt(r,10)}
function total(hand){let t=hand.reduce((s,c)=>s+cardValue(c.rank),0), aces=hand.filter(c=>c.rank==='A').length;while(t>21&&aces>0){t-=10;aces--}return t}
function bust(h){return total(h)>21}
function bj(h){return h.length===2&&total(h)===21}
function Card({card,hidden}){if(hidden)return <div className="bj-card back">🂠</div>;const red=card.suit==='♥️'||card.suit==='♦️';return <div className="bj-card" style={{color:red?'#b91c1c':'#111827'}}><b>{card.rank}</b><span>{card.suit}</span><b style={{transform:'rotate(180deg)'}}>{card.rank}</b></div>}
function emptyPlayers(n, aiMode=false){return Array.from({length:n},(_,i)=>({id:i,name:i===0?'You':aiMode?`CPU ${i}`:`Player ${i+1}`,cpu:aiMode&&i>0,chips:10000,bet:10,hand:[],done:false,result:''}))}

export default function BlackjackVault(props){
  const { onBack, onExit, game, playerCount=2, gameMode='ai', difficulty='medium' } = props || {};
  const exit=onBack||onExit||null;
  const aiMode = String(gameMode || '').toLowerCase().includes('ai') || String(gameMode || '').toLowerCase().includes('computer');
  const [seatCount,setSeatCount]=useState(Math.min(4,Math.max(1,Number(playerCount)||2)));
  const [players,setPlayers]=useState(()=>emptyPlayers(Math.min(4,Math.max(1,Number(playerCount)||2)), aiMode));
  const [deck,setDeck]=useState(makeDeck);
  const [dealer,setDealer]=useState([]);
  const [phase,setPhase]=useState('bet');
  const [active,setActive]=useState(0);
  const [message,setMessage]=useState(aiMode?'AI blackjack restored. Set seats and deal.':'Place bets, then deal.');
  const [showHelp,setShowHelp]=useState(false);

  const resize=(n)=>{setSeatCount(n);setPlayers(emptyPlayers(n,aiMode));setDealer([]);setPhase('bet');setActive(0);setMessage(`${n} player blackjack table ready${aiMode?' with AI seats':''}.`);setDeck(makeDeck())}
  const setBet=(i,bet)=>setPlayers(ps=>ps.map((p,idx)=>idx===i?{...p,bet:Math.max(5,Math.min(bet,p.chips))}:p));
  const deal=()=>{let d=deck.length<20?makeDeck():[...deck];const ps=players.map(p=>{const h=[d.pop(),d.pop()];return {...p,hand:h,done:bj(h),result:bj(h)?'Blackjack!':''}});const dl=[d.pop(),d.pop()];setDeck(d);setPlayers(ps);setDealer(dl);setActive(Math.max(0,ps.findIndex(p=>!p.done)));setPhase('play');setMessage(aiMode?'You play first. CPU seats will auto-play after your hand.':'Play each hand. Dealer reveals after all players finish.');if(ps.every(p=>p.done)) finishDealer(ps,dl,d)}
  const finishDealer=(ps=players,dl=dealer,dk=deck)=>{let d=[...dk], dh=[...dl];while(total(dh)<17)dh.push(d.pop());const dt=total(dh);const settled=ps.map(p=>{const pt=total(p.hand);let chips=p.chips-p.bet,result='';if(bust(p.hand)){result='Bust — lose'}else if(bj(p.hand)&&!bj(dh)){const win=Math.floor(p.bet*2.5);chips=p.chips-p.bet+win;result=`Blackjack wins $${win-p.bet}`}else if(bust(dh)||pt>dt){chips=p.chips+p.bet;result=`Win ${pt} vs ${bust(dh)?'dealer bust':dt}`}else if(pt===dt){chips=p.chips;result=`Push ${pt}`}else{result=`Lose ${pt} vs ${dt}`}return {...p,chips,done:true,result}});setDealer(dh);setDeck(d);setPlayers(settled);setPhase('result');setMessage('Round complete. Adjust bets or deal again.')}
  const nextPlayer=(ps,dl=dealer,dk=deck)=>{const next=ps.findIndex(p=>!p.done);if(next>=0){setActive(next);return}finishDealer(ps,dl,dk)}
  const hit=()=>{if(phase!=='play')return;let d=[...deck];const ps=players.map((p,i)=>i===active?{...p,hand:[...p.hand,d.pop()]}:p);if(bust(ps[active].hand)){ps[active].done=true;ps[active].result='Bust'}setDeck(d);setPlayers(ps);if(ps[active].done)nextPlayer(ps,dealer,d)}
  const stand=()=>{if(phase!=='play')return;const ps=players.map((p,i)=>i===active?{...p,done:true,result:'Stand'}:p);setPlayers(ps);nextPlayer(ps)}
  const doubleDown=()=>{if(phase!=='play')return;const p=players[active];if(p.hand.length!==2||p.chips<p.bet*2)return;let d=[...deck];const ps=players.map((pl,i)=>i===active?{...pl,bet:pl.bet*2,hand:[...pl.hand,d.pop()],done:true,result:'Double'}:pl);setDeck(d);setPlayers(ps);nextPlayer(ps,dealer,d)}
  const newRound=()=>{setDealer([]);setPlayers(ps=>ps.map(p=>({...p,hand:[],done:false,result:''})));setPhase('bet');setActive(0);setMessage('Place bets, then deal.')}
  const reset=()=>resize(seatCount);

  useEffect(()=>{
    if(phase!=='play') return;
    const p=players[active];
    if(!p?.cpu || p.done) return;
    const delay = difficulty === 'hard' ? 450 : 700;
    const t=setTimeout(()=>{
      const score=total(p.hand);
      if(score < 16 || (difficulty === 'hard' && score < 17)) hit();
      else stand();
    }, delay);
    return ()=>clearTimeout(t);
  },[phase,active,players,difficulty]);

  return <div className="game-shell blackjack-game-shell" style={{maxWidth:900,margin:'0 auto'}}>
    <style>{`.bj-table{background:radial-gradient(circle at center,#0f5132,#052e1c 70%);border:3px solid #6b3f16;border-radius:22px;padding:16px;box-shadow:0 0 30px #000 inset}.bj-card{width:50px;height:70px;border-radius:8px;background:#f8fafc;border:2px solid #d1d5db;padding:5px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;font-size:15px}.bj-card.back{background:linear-gradient(135deg,#111827,#312e81);color:#e8b800;align-items:center;justify-content:center;font-size:28px}.bj-hand{display:flex;gap:6px;flex-wrap:wrap;min-height:76px}.bj-seat{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px;background:rgba(0,0,0,.22)}.bj-seat.active{border-color:#e8b800;box-shadow:0 0 0 2px rgba(232,184,0,.12)}`}</style>
    {showHelp&&<div className="htp-overlay" onClick={()=>setShowHelp(false)}><div className="htp-box" onClick={e=>e.stopPropagation()}><div className="htp-header"><p className="htp-title">Blackjack Rules</p><button className="bv-button secondary" onClick={()=>setShowHelp(false)}>✕</button></div><div className="htp-body"><p>1–4 players. AI mode makes Player 2+ CPU seats. Dealer hits to 17. Blackjack pays 3:2. Double doubles the bet and draws one card.</p></div></div></div>}
    <div className="game-header"><h2 className="bv-title">{game?.icon||'🃏'} Blackjack Vault</h2><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button><button className="bv-button" onClick={reset}>Reset Table</button>{exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}</div></div>
    <div className="bv-card" style={{padding:10,marginBottom:10,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}><span style={{color:'#aaa'}}>Seats:</span>{[1,2,3,4].map(n=><button key={n} className={seatCount===n?'bv-button':'bv-button secondary'} disabled={phase==='play'} onClick={()=>resize(n)}>{n}</button>)}<span style={{color:'#e8b800',marginLeft:'auto'}}>{message}</span></div>
    <div className="bj-table">
      <div style={{textAlign:'center',marginBottom:18}}><div style={{color:'#e8b800',fontWeight:900}}>Dealer {phase==='play'?`(${dealer[0]?total([dealer[0]]):0}+?)`:dealer.length?`(${total(dealer)})`:''}</div><div className="bj-hand" style={{justifyContent:'center'}}>{dealer.map((c,i)=><Card key={i} card={c} hidden={phase==='play'&&i===1}/>)}</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>{players.map((p,i)=><div key={p.id} className={`bj-seat ${active===i&&phase==='play'?'active':''}`}><div style={{display:'flex',justifyContent:'space-between',color:'#e8b800',fontWeight:800}}><span>{p.cpu?'🤖 ':''}{p.name}</span><span>${p.chips}</span></div><div style={{fontSize:12,color:'#aaa'}}>Bet ${p.bet} {p.hand.length?`· ${total(p.hand)}`:''}</div><div className="bj-hand">{p.hand.map((c,idx)=><Card key={idx} card={c}/>)}</div>{phase==='bet'&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6}}>{CHIP_BUTTONS.map(v=><button key={v} className="bv-button secondary" style={{fontSize:11,padding:'5px 7px'}} onClick={()=>setBet(i,v)}>${v}</button>)}</div>}{p.result&&<div style={{fontSize:12,color:p.result.includes('Lose')||p.result.includes('Bust')?'#f87171':'#4ade80'}}>{p.result}</div>}</div>)}</div>
      <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap',marginTop:14}}>{phase==='bet'&&<button className="bv-button" onClick={deal}>Deal</button>}{phase==='play'&&!players[active]?.cpu&&<><button className="bv-button" onClick={hit}>Hit</button><button className="bv-button secondary" onClick={stand}>Stand</button><button className="bv-button secondary" onClick={doubleDown}>Double</button></>}{phase==='play'&&players[active]?.cpu&&<span style={{color:'#e8b800',fontWeight:900}}>CPU thinking…</span>}{phase==='result'&&<button className="bv-button" onClick={newRound}>Next Round</button>}</div>
    </div>
  </div>
}
