// ══════════════════════════════════════════════════════
// FILE: Heartbreaker.jsx — Hearts card game (4-player)
// ══════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';

const SUITS=['♠','♥','♦','♣'], RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RED=new Set(['♥','♦']), RANK_VAL=Object.fromEntries(RANKS.map((r,i)=>[r,i]));
function makeDeck(){const d=[];let id=0;for(const s of SUITS)for(const r of RANKS)d.push({id:id++,suit:s,rank:r});return shuffle(d);}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function cardPts(c){if(c.suit==='♥')return 1;if(c.suit==='♠'&&c.rank==='Q')return 13;return 0;}
function canFollow(hand,suit){return hand.some(c=>c.suit===suit);}
function aiPlay(hand,trickSuit,heartsBroken,isLeading){
  if(isLeading){
    const safe=hand.filter(c=>c.suit!=='♥'&&!(c.suit==='♠'&&c.rank==='Q'));
    const play=safe.length?safe:hand;
    return play.reduce((a,b)=>RANK_VAL[a.rank]<RANK_VAL[b.rank]?a:b);
  }
  if(trickSuit){
    const matching=hand.filter(c=>c.suit===trickSuit);
    if(matching.length){
      // Dump queen of spades or high hearts if can't win
      const dangerous=matching.filter(c=>cardPts(c)>0);
      return dangerous.length?dangerous.sort((a,b)=>cardPts(b)-cardPts(a))[0]:matching.reduce((a,b)=>RANK_VAL[a.rank]<RANK_VAL[b.rank]?a:b);
    }
    // Sluff highest point card
    const pts=hand.filter(c=>cardPts(c)>0);
    return pts.length?pts.sort((a,b)=>cardPts(b)-cardPts(a))[0]:hand.reduce((a,b)=>RANK_VAL[a.rank]>RANK_VAL[b.rank]?a:b);
  }
  const safe=hand.filter(c=>c.suit!=='♥');
  return(safe.length?safe:hand).reduce((a,b)=>RANK_VAL[a.rank]<RANK_VAL[b.rank]?a:b);
}
function trickWinner(trick,ledSuit){return trick.reduce((best,c)=>c.suit===ledSuit&&RANK_VAL[c.rank]>RANK_VAL[best.card.rank]?{idx:c.player,card:c}:best,{idx:trick[0].player,card:trick[0]}).idx;}

function initGame(){
  const deck=makeDeck();
  const hands=[deck.slice(0,13),deck.slice(13,26),deck.slice(26,39),deck.slice(39,52)];
  // Find who has 2♣ — leads first
  let leader=hands.findIndex(h=>h.some(c=>c.rank==='2'&&c.suit==='♣'));
  return{hands,scores:[0,0,0,0],trickScores:[0,0,0,0],trick:[],heartsBroken:false,leader,turn:leader,phase:'play',round:1,msg:'Player 0 (you) is south. Lowest score wins.'};
}

export function Heartbreaker({game,onBack,onExit}){
  const exit=onBack||onExit||null;
  const [gs,setGs]=useState(initGame);
  const [selected,setSelected]=useState(null);
  const [showHelp,setShowHelp]=useState(false);

  const playCard=(playerIdx,cardIdx)=>{
    setGs(prev=>{
      if(prev.turn!==playerIdx||prev.phase!=='play') return prev;
      const hand=[...prev.hands[playerIdx]];
      const card=hand[cardIdx];
      if(!card) return prev;
      const ledSuit=prev.trick.length>0?prev.trick[0].suit:null;
      if(ledSuit&&canFollow(hand,ledSuit)&&card.suit!==ledSuit) return {...prev,msg:'Must follow suit!'};
      if(!ledSuit&&!prev.heartsBroken&&hand.length<13&&card.suit==='♥'&&hand.some(c=>c.suit!=='♥')) return {...prev,msg:'Hearts not broken yet!'};
      hand.splice(cardIdx,1);
      const newHands=[...prev.hands];newHands[playerIdx]=[...hand];
      const newTrick=[...prev.trick,{...card,player:playerIdx}];
      const newHB=prev.heartsBroken||(card.suit==='♥');
      if(newTrick.length===4){
        const winnerIdx=trickWinner(newTrick,newTrick[0].suit);
        const pts=newTrick.reduce((s,c)=>s+cardPts(c),0);
        const newTS=[...prev.trickScores];newTS[winnerIdx]+=pts;
        if(newHands[0].length===0){
          // End of round — check moon shoot
          const finalTS=[...newTS];
          let moonShooter=finalTS.findIndex(s=>s===26);
          let newS=[...prev.scores];
          if(moonShooter>=0){finalTS.forEach((_,i)=>{if(i!==moonShooter)newS[i]+=26;});}
          else{finalTS.forEach((s,i)=>newS[i]+=s);}
          const over=newS.some(s=>s>=100);
          return{...prev,hands:newHands,scores:newS,trickScores:[0,0,0,0],trick:[],heartsBroken:false,leader:winnerIdx,turn:winnerIdx,phase:over?'gameover':'roundover',msg:over?'Game over!':'Round over! Click Next Round.'};
        }
        return{...prev,hands:newHands,trickScores:newTS,trick:[],heartsBroken:newHB,leader:winnerIdx,turn:winnerIdx,msg:`${winnerIdx===0?'You':('AI '+(winnerIdx))} won the trick.`};
      }
      const nextTurn=(playerIdx+1)%4;
      return{...prev,hands:newHands,trick:newTrick,heartsBroken:newHB,turn:nextTurn,msg:''};
    });
    setSelected(null);
  };

  // AI plays
  useEffect(()=>{
    if(gs.turn===0||gs.phase!=='play') return;
    const t=setTimeout(()=>{
      setGs(prev=>{
        if(prev.turn===0||prev.phase!=='play') return prev;
        const p=prev.turn;
        const hand=prev.hands[p];
        const ledSuit=prev.trick.length>0?prev.trick[0].suit:null;
        const card=aiPlay(hand,ledSuit,prev.heartsBroken,prev.trick.length===0);
        const idx=hand.findIndex(c=>c.id===card.id);
        if(idx<0) return prev;
        const dummy={target:p,cardIdx:idx};
        // Reuse playCard logic inline
        const newHands=[...prev.hands.map(h=>[...h])];
        newHands[p].splice(idx,1);
        const newTrick=[...prev.trick,{...card,player:p}];
        const newHB=prev.heartsBroken||(card.suit==='♥');
        if(newTrick.length===4){
          const winnerIdx=trickWinner(newTrick,newTrick[0].suit);
          const pts=newTrick.reduce((s,c)=>s+cardPts(c),0);
          const newTS=[...prev.trickScores];newTS[winnerIdx]+=pts;
          if(newHands[0].length===0){
            let moonShooter=newTS.findIndex(s=>s===26);
            let newS=[...prev.scores];
            if(moonShooter>=0){newTS.forEach((_,i)=>{if(i!==moonShooter)newS[i]+=26;});}
            else{newTS.forEach((s,i)=>newS[i]+=s);}
            const over=newS.some(s=>s>=100);
            return{...prev,hands:newHands,scores:newS,trickScores:[0,0,0,0],trick:[],heartsBroken:false,leader:winnerIdx,turn:winnerIdx,phase:over?'gameover':'roundover',msg:over?'Game over!':'Round over!'};
          }
          return{...prev,hands:newHands,trickScores:newTS,trick:[],heartsBroken:newHB,leader:winnerIdx,turn:winnerIdx,msg:`AI ${winnerIdx} won trick.`};
        }
        return{...prev,hands:newHands,trick:newTrick,heartsBroken:newHB,turn:(p+1)%4,msg:''};
      });
    },600);
    return()=>clearTimeout(t);
  },[gs.turn,gs.phase]);

  const nextRound=()=>setGs(prev=>{
    const deck=makeDeck();
    const hands=[deck.slice(0,13),deck.slice(13,26),deck.slice(26,39),deck.slice(39,52)];
    const leader=hands.findIndex(h=>h.some(c=>c.rank==='2'&&c.suit==='♣'));
    return{...prev,hands,trickScores:[0,0,0,0],trick:[],heartsBroken:false,leader,turn:leader,phase:'play',round:prev.round+1,msg:'New round!'};
  });

  const hand=gs.hands[0]||[];
  const minScore=Math.min(...gs.scores);
  const over=gs.phase==='gameover';

  return(
    <div className="game-shell" style={{maxWidth:540,margin:'0 auto'}}>
      {showHelp&&(<div className="htp-overlay" onClick={()=>setShowHelp(false)}><div className="htp-box" onClick={e=>e.stopPropagation()}><div className="htp-header"><p className="htp-title">Heartbreaker — Hearts</p><button className="bv-button secondary" onClick={()=>setShowHelp(false)}>✕</button></div><div className="htp-body"><h4>Objective</h4><p>Have the lowest score when someone reaches 100.</p><h4>Scoring</h4><ul><li>Each ♥ = 1 point.</li><li>Q♠ = 13 points.</li><li>Shoot the Moon: take ALL hearts + Q♠ = everyone else +26.</li></ul><h4>Play</h4><ul><li>Must follow the led suit if possible.</li><li>Can't lead hearts until broken (someone played ♥ on a trick).</li><li>Click a card to play it.</li></ul></div></div></div>)}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'💔'} Heartbreaker</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={()=>setGs(initGame())}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>
      {over&&<div className="winner-banner">{gs.scores[0]===minScore?'🏆 You Win!':'🤖 AI Wins!'} Scores: {gs.scores.join(' · ')}</div>}
      {!over&&<div className="turn-indicator">{gs.msg||`${gs.turn===0?'Your turn':'AI playing…'} · Hearts ${gs.heartsBroken?'broken':'not broken'}`}</div>}

      <div style={{display:'flex',gap:12,justifyContent:'space-around',marginBottom:10,flexWrap:'wrap'}}>
        {gs.scores.map((s,i)=>(
          <div key={i} className="bv-card" style={{padding:'6px 14px',textAlign:'center'}}>
            <div style={{fontSize:10,color:'#888'}}>{i===0?'You':'AI '+(i)}</div>
            <div style={{fontSize:18,color:'#e8b800',fontWeight:'bold'}}>{s}</div>
          </div>
        ))}
      </div>

      {/* Trick */}
      <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14,minHeight:72}}>
        {gs.trick.map((c,i)=>(
          <div key={i} style={{textAlign:'center'}}>
            <div style={{fontSize:9,color:'#888',marginBottom:2}}>P{c.player}</div>
            <div style={{width:40,height:60,borderRadius:6,background:'#f5f5f0',border:'1px solid #ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:'bold',color:RED.has(c.suit)?'#c0392b':'#1a1a2e'}}>{c.rank}{c.suit}</div>
          </div>
        ))}
      </div>

      {gs.phase==='roundover'&&<button className="bv-button" style={{width:'100%',marginBottom:10}} onClick={nextRound}>Next Round →</button>}

      <div style={{marginBottom:6,fontSize:11,color:'#888'}}>Your Hand ({hand.length} cards):</div>
      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
        {hand.map((card,i)=>{
          const ledSuit=gs.trick.length>0?gs.trick[0].suit:null;
          const canPlay=gs.turn===0&&gs.phase==='play'&&(
            !ledSuit||!canFollow(hand,ledSuit)||card.suit===ledSuit
          )&&(ledSuit||gs.heartsBroken||hand.length>=13||card.suit!=='♥'||!hand.some(c=>c.suit!=='♥'));
          return(
            <div key={card.id} onClick={canPlay?()=>playCard(0,i):undefined} style={{
              width:40,height:60,borderRadius:6,background:'#f5f5f0',border:selected===i?'2px solid #e8b800':'1px solid #ccc',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:'bold',
              color:RED.has(card.suit)?'#c0392b':'#1a1a2e',
              cursor:canPlay?'pointer':'default',opacity:!canPlay&&gs.turn===0?0.4:1,
              transform:selected===i?'translateY(-8px)':'none',transition:'transform .15s',
            }}>{card.rank}{card.suit}</div>
          );
        })}
      </div>
    </div>
  );
}
export default Heartbreaker;
