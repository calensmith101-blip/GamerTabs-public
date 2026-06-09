// ══════════════════════════════════════════════════════
// FILE: ShadowSpades.jsx — Spades (2-team, 4-player)
// ══════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';

const SUITS=['♠','♥','♦','♣'],RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANK_IDX=Object.fromEntries(RANKS.map((r,i)=>[r,i]));
const RED=new Set(['♥','♦']);

function makeDeck(){const d=[];let id=0;for(const s of SUITS)for(const r of RANKS)d.push({id:id++,suit:s,rank:r});return shuffle(d);}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

function cardBeats(challenger,champion,ledSuit){
  if(challenger.suit===champion.suit) return RANK_IDX[challenger.rank]>RANK_IDX[champion.rank];
  if(challenger.suit==='♠'&&champion.suit!=='♠') return true;
  return false;
}
function trickWin(trick,ledSuit){
  return trick.reduce((best,c)=>cardBeats(c,best,ledSuit)?c:best,trick[0]).player;
}
function canFollow(hand,suit){return hand.some(c=>c.suit===suit);}
function aiBid(hand){return Math.max(1,hand.filter(c=>c.suit==='♠'||(c.rank==='A'||c.rank==='K')).length);}
function aiPlayCard(hand,ledSuit,spadesBroken){
  if(!ledSuit){
    const nonSpade=hand.filter(c=>c.suit!=='♠');
    const pool=nonSpade.length>0?nonSpade:hand;
    return pool.reduce((a,b)=>RANK_IDX[a.rank]>RANK_IDX[b.rank]?a:b);
  }
  const matching=hand.filter(c=>c.suit===ledSuit);
  if(matching.length) return matching.reduce((a,b)=>RANK_IDX[a.rank]>RANK_IDX[b.rank]?a:b);
  const spades=hand.filter(c=>c.suit==='♠');
  if(spades.length) return spades.reduce((a,b)=>RANK_IDX[a.rank]<RANK_IDX[b.rank]?a:b);
  return hand.reduce((a,b)=>RANK_IDX[a.rank]<RANK_IDX[b.rank]?a:b);
}

function calcScore(bids,tricks){
  // Teams: [0,2] NS, [1,3] EW
  const scores={ns:0,ew:0};
  const nsBid=bids[0]+bids[2],nsTricks=tricks[0]+tricks[2];
  const ewBid=bids[1]+bids[3],ewTricks=tricks[1]+tricks[3];
  if(nsTricks>=nsBid) scores.ns=nsBid*10+(nsTricks-nsBid);
  else scores.ns=-(nsBid*10);
  if(ewTricks>=ewBid) scores.ew=ewBid*10+(ewTricks-ewBid);
  else scores.ew=-(ewBid*10);
  return scores;
}

function initGame(){
  const deck=makeDeck();
  const hands=[deck.slice(0,13),deck.slice(13,26),deck.slice(26,39),deck.slice(39,52)];
  return{hands,bids:[null,null,null,null],tricks:[0,0,0,0],trick:[],ledSuit:null,turn:0,phase:'bid',scores:{ns:0,ew:0},round:1,spadesBroken:false,msg:'Place your bid (tricks you expect to win).'};
}

export function ShadowSpades({game,onBack,onExit}){
  const exit=onBack||onExit||null;
  const [gs,setGs]=useState(initGame);
  const [bidVal,setBidVal]=useState(3);
  const [showHelp,setShowHelp]=useState(false);

  const handleBid=()=>{
    setGs(prev=>{
      const bids=[...prev.bids];bids[0]=bidVal;
      // AI bids
      for(let p=1;p<4;p++) bids[p]=aiBid(prev.hands[p]);
      return{...prev,bids,phase:'play',turn:0,msg:`Bids: You ${bidVal}, AI1 ${bids[1]}, Partner ${bids[2]}, AI3 ${bids[3]}. Lead first!`};
    });
  };

  const playCard=(cardIdx)=>{
    if(gs.turn!==0||gs.phase!=='play') return;
    const hand=gs.hands[0];
    const card=hand[cardIdx];
    const led=gs.trick.length>0?gs.ledSuit:null;
    if(led&&canFollow(hand,led)&&card.suit!==led){setGs(prev=>({...prev,msg:'Must follow suit!'}));return;}
    if(!led&&!gs.spadesBroken&&card.suit==='♠'&&hand.some(c=>c.suit!=='♠')){setGs(prev=>({...prev,msg:'Spades not broken!'}));return;}
    setGs(prev=>{
      const newH=[...prev.hands.map(h=>[...h])];
      newH[0].splice(cardIdx,1);
      const newTrick=[...prev.trick,{...card,player:0}];
      const newSB=prev.spadesBroken||(card.suit==='♠');
      const ledS=prev.trick.length===0?card.suit:prev.ledSuit;
      if(newTrick.length===4){
        const w=trickWin(newTrick,ledS);
        const newTricks=[...prev.tricks];newTricks[w]++;
        if(newH[0].length===0){
          const sc=calcScore(prev.bids,newTricks);
          const ns=prev.scores.ns+sc.ns,ew=prev.scores.ew+sc.ew;
          const over=Math.abs(ns)>=500||Math.abs(ew)>=500;
          return{...prev,hands:newH,tricks:newTricks,trick:[],ledSuit:null,spadesBroken:false,phase:over?'gameover':'roundover',scores:{ns,ew},msg:over?'Game over!':'Round over!'};
        }
        return{...prev,hands:newH,tricks:newTricks,trick:[],ledSuit:null,spadesBroken:newSB,turn:w,msg:`Player ${w} wins trick.`};
      }
      return{...prev,hands:newH,trick:newTrick,ledSuit:ledS,spadesBroken:newSB,turn:1,msg:''};
    });
  };

  useEffect(()=>{
    if(gs.turn===0||gs.phase!=='play') return;
    const t=setTimeout(()=>{
      setGs(prev=>{
        if(prev.turn===0||prev.phase!=='play') return prev;
        const p=prev.turn;
        const hand=prev.hands[p];
        const card=aiPlayCard(hand,prev.ledSuit,prev.spadesBroken);
        const idx=hand.findIndex(c=>c.id===card.id);
        if(idx<0) return prev;
        const newH=[...prev.hands.map(h=>[...h])];newH[p].splice(idx,1);
        const newTrick=[...prev.trick,{...card,player:p}];
        const newSB=prev.spadesBroken||(card.suit==='♠');
        const ledS=prev.trick.length===0?card.suit:prev.ledSuit;
        if(newTrick.length===4){
          const w=trickWin(newTrick,ledS);
          const newTricks=[...prev.tricks];newTricks[w]++;
          if(newH[0].length===0){
            const sc=calcScore(prev.bids,newTricks);
            const ns=prev.scores.ns+sc.ns,ew=prev.scores.ew+sc.ew;
            const over=Math.abs(ns)>=500||Math.abs(ew)>=500;
            return{...prev,hands:newH,tricks:newTricks,trick:[],ledSuit:null,spadesBroken:false,phase:over?'gameover':'roundover',scores:{ns,ew},msg:over?'Game over!':'Round over!'};
          }
          return{...prev,hands:newH,tricks:newTricks,trick:[],ledSuit:null,spadesBroken:newSB,turn:w,msg:`P${w} wins trick.`};
        }
        return{...prev,hands:newH,trick:newTrick,ledSuit:ledS,spadesBroken:newSB,turn:(p+1)%4,msg:''};
      });
    },500);
    return()=>clearTimeout(t);
  },[gs.turn,gs.phase]);

  const hand=gs.hands[0]||[];
  const over=gs.phase==='gameover';

  return(
    <div className="game-shell" style={{maxWidth:540,margin:'0 auto'}}>
      {showHelp&&(<div className="htp-overlay" onClick={()=>setShowHelp(false)}><div className="htp-box" onClick={e=>e.stopPropagation()}><div className="htp-header"><p className="htp-title">Shadow Spades</p><button className="bv-button secondary" onClick={()=>setShowHelp(false)}>✕</button></div><div className="htp-body"><h4>Teams</h4><p>You + AI partner (N-S) vs 2 AI (E-W).</p><h4>Bidding</h4><p>Bid how many tricks your team will take.</p><h4>Play</h4><ul><li>♠ are always trump.</li><li>Follow suit if you can. Spade can only lead if spades are broken.</li><li>Highest card of led suit wins, unless spade played — then highest spade wins.</li></ul><h4>Scoring</h4><p>Team makes bid → 10× bid pts + bags. Fails → −10× bid.</p></div></div></div>)}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'♠️'} Shadow Spades</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={()=>setGs(initGame())}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {over&&<div className="winner-banner">{gs.scores.ns>=gs.scores.ew?'🏆 N-S (You) Win!':'🤖 E-W Wins!'}</div>}
      <div style={{display:'flex',justifyContent:'space-around',marginBottom:10}}>
        <div className="bv-card" style={{padding:'6px 18px',textAlign:'center'}}><div style={{fontSize:10,color:'#888'}}>N-S (You+P)</div><div style={{fontSize:20,color:'#e8b800',fontWeight:'bold'}}>{gs.scores.ns}</div></div>
        <div style={{alignSelf:'center',fontSize:11,color:'#555'}}>vs</div>
        <div className="bv-card" style={{padding:'6px 18px',textAlign:'center'}}><div style={{fontSize:10,color:'#888'}}>E-W (AI)</div><div style={{fontSize:20,color:'#c0392b',fontWeight:'bold'}}>{gs.scores.ew}</div></div>
      </div>

      {gs.phase==='bid'&&(
        <div className="bv-card" style={{padding:14,marginBottom:12}}>
          <div style={{fontSize:13,color:'#e8b800',marginBottom:8}}>Your Bid (0-13 tricks)</div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input type="number" min={0} max={13} value={bidVal} onChange={e=>setBidVal(+e.target.value)} style={{width:60,background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #2a2a4a',borderRadius:6,padding:'6px 8px',fontSize:14}}/>
            <button className="bv-button" onClick={handleBid}>Place Bid</button>
          </div>
        </div>
      )}

      {gs.phase==='play'&&(
        <div style={{marginBottom:10,fontSize:12,color:'#888'}}>
          Tricks: You {gs.tricks[0]} P{gs.tricks[2]} (bid {(gs.bids[0]||0)+(gs.bids[2]||0)}) · AI {gs.tricks[1]+gs.tricks[3]} (bid {(gs.bids[1]||0)+(gs.bids[3]||0)})
          · ♠{gs.spadesBroken?'broken':'not broken'}
        </div>
      )}

      {gs.msg&&<div className="turn-indicator">{gs.msg}</div>}

      <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:12,minHeight:68}}>
        {gs.trick.map((c,i)=>(
          <div key={i} style={{textAlign:'center'}}>
            <div style={{fontSize:9,color:'#888',marginBottom:2}}>P{c.player}</div>
            <div style={{width:38,height:56,borderRadius:6,background:'#f5f5f0',border:'1px solid #ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:'bold',color:RED.has(c.suit)?'#c0392b':'#1a1a2e'}}>{c.rank}{c.suit}</div>
          </div>
        ))}
      </div>

      {gs.phase==='roundover'&&<button className="bv-button" style={{width:'100%',marginBottom:10}} onClick={()=>setGs(prev=>{const d=makeDeck();const h=[d.slice(0,13),d.slice(13,26),d.slice(26,39),d.slice(39,52)];return{...prev,hands:h,bids:[null,null,null,null],tricks:[0,0,0,0],trick:[],ledSuit:null,spadesBroken:false,turn:0,phase:'bid',round:prev.round+1,msg:'New round!'};})}> Next Round →</button>}

      <div style={{marginBottom:6,fontSize:11,color:'#888'}}>Your Hand:</div>
      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
        {hand.map((card,i)=>{
          const canPlay=gs.turn===0&&gs.phase==='play';
          return(<div key={card.id} onClick={canPlay?()=>playCard(i):undefined} style={{width:38,height:56,borderRadius:6,background:'#f5f5f0',border:'1px solid #ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:'bold',color:RED.has(card.suit)?'#c0392b':'#1a1a2e',cursor:canPlay?'pointer':'default'}}>{card.rank}{card.suit}</div>);
        })}
      </div>
    </div>
  );
}
export default ShadowSpades;
