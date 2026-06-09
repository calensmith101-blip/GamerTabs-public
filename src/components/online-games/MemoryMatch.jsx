import React, { useState, useEffect, useRef } from 'react';

const ICONS=['🗝️','📁','🔐','🕵️','💼','📡','🧬','🔭','⚗️','💎','🎯','🛡️','⚙️','🔬','💻','📟','🗂️','🎲'];
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const mkCards=(n=8)=>shuffle([...ICONS.slice(0,n),...ICONS.slice(0,n)]).map((t,i)=>({id:i,type:t,up:false,matched:false}));

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Cipher Match</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4><p>Find all matching pairs. Most pairs wins.</p>
        <h4>Your Turn</h4>
        <ul>
          <li>Tap two face-down cards to flip them.</li>
          <li>Match = cards stay face-up, you score 1 pair and go again.</li>
          <li>No match = cards flip back, opponent's turn.</li>
        </ul>
        <h4>AI Mode</h4><p>The AI remembers every card it has seen.</p>
      </div>
    </div>
  </div>
);

export default function MemoryMatch(props){
  const{onBack,onExit,gameMode,game}=props||{};
  const exit=onBack||onExit||null;
  const isAI=gameMode==='ai'||gameMode==='computer';

  const[cards,setCards]=useState(()=>mkCards(8));
  const[flipped,setFlipped]=useState([]);
  const[scores,setScores]=useState([0,0]);
  const[cur,setCur]=useState(0);
  const[locked,setLocked]=useState(false);
  const[over,setOver]=useState(false);
  const[turns,setTurns]=useState(0);
  const[showHelp,setShowHelp]=useState(false);
  const mem=useRef(new Map());

  const reset=()=>{
    setCards(mkCards(8));setFlipped([]);setScores([0,0]);setCur(0);
    setLocked(false);setOver(false);setTurns(0);mem.current=new Map();
  };

  const flip=(idx)=>{
    if(locked||over||cur!==0&&isAI)return;
    const c=cards[idx];
    if(c.up||c.matched||flipped.includes(idx))return;
    if(flipped.length>=2)return;
    mem.current.set(idx,c.type);
    const nf=[...flipped,idx];
    setCards(cs=>cs.map((x,i)=>i===idx?{...x,up:true}:x));
    setFlipped(nf);
    if(nf.length===2){
      setLocked(true);
      const[a,b]=nf;
      if(cards[a].type===cards[b].type){
        setTimeout(()=>{
          const nc=cards.map((x,i)=>i===a||i===b?{...x,matched:true,up:false}:x);
          setCards(nc);
          const ns=[...scores];ns[cur]++;setScores(ns);
          setFlipped([]);setLocked(false);setTurns(t=>t+1);
          if(nc.every(x=>x.matched))setOver(true);
        },500);
      } else {
        setTimeout(()=>{
          setCards(cs=>cs.map((x,i)=>i===a||i===b?{...x,up:false}:x));
          setFlipped([]);setLocked(false);setCur(p=>p===0?1:0);setTurns(t=>t+1);
        },1100);
      }
    }
  };

  // AI turn
  useEffect(()=>{
    if(!isAI||cur!==1||over||locked||flipped.length>0)return;
    const t=setTimeout(()=>{
      const unmatched=cards.map((c,i)=>!c.matched&&!c.up?i:-1).filter(i=>i>=0);
      if(!unmatched.length)return;
      const memList=[...mem.current.entries()].filter(([i])=>!cards[i].matched);
      let first=-1,second=-1;
      for(const[ia,ta] of memList){
        const m=memList.find(([ib,tb])=>ib!==ia&&tb===ta);
        if(m){first=ia;second=m[0];break;}
      }
      if(first===-1){
        const unseen=unmatched.filter(i=>!mem.current.has(i));
        first=unseen.length?unseen[Math.floor(Math.random()*unseen.length)]:unmatched[Math.floor(Math.random()*unmatched.length)];
      }
      if(second===-1){
        const others=unmatched.filter(i=>i!==first);
        second=others[Math.floor(Math.random()*others.length)]??first;
      }
      mem.current.set(first,cards[first].type);
      const c1=cards.map((c,i)=>i===first?{...c,up:true}:c);
      setCards(c1);setFlipped([first]);
      setTimeout(()=>{
        mem.current.set(second,c1[second].type);
        const c2=c1.map((c,i)=>i===second?{...c,up:true}:c);
        setCards(c2);setFlipped([first,second]);
        if(c2[first].type===c2[second].type){
          setTimeout(()=>{
            const mc=c2.map((c,i)=>i===first||i===second?{...c,matched:true,up:false}:c);
            setCards(mc);
            const ns=[...scores];ns[1]++;setScores(ns);
            setFlipped([]);setLocked(false);setTurns(t=>t+1);
            if(mc.every(x=>x.matched))setOver(true);
          },500);
        } else {
          setTimeout(()=>{
            setCards(c2.map((c,i)=>i===first||i===second?{...c,up:false}:c));
            setFlipped([]);setLocked(false);setCur(0);setTurns(t=>t+1);
          },1100);
        }
      },600);
    },700);
    return()=>clearTimeout(t);
  },[cur,isAI,over,locked,flipped.length,cards,turns]);

  const winner=over?(scores[0]>scores[1]?'You':scores[1]>scores[0]?isAI?'AI':'P2':'Draw'):null;

  return(
    <div className="game-shell" style={{maxWidth:420,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🃏'} Cipher Match</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:22,color:'#e8b800',fontWeight:'bold'}}>{scores[0]}</div>
          <div style={{fontSize:11,color:'#888'}}>You</div>
        </div>
        {over
          ?<div className="winner-banner" style={{margin:0,padding:'6px 14px',fontSize:14}}>
            {winner==='Draw'?'⚖️ Draw!':winner==='You'?'🏆 You Win!':winner==='AI'?'🤖 AI Wins!':'P2 Wins!'}
          </div>
          :<div className="turn-indicator" style={{margin:0,fontSize:13}}>
            {locked?'Checking…':cur===0?'🧠 Your turn':isAI?'🤖 AI thinking…':'🔄 P2 turn'}
          </div>
        }
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:22,color:'#c0392b',fontWeight:'bold'}}>{scores[1]}</div>
          <div style={{fontSize:11,color:'#888'}}>{isAI?'AI':'P2'}</div>
        </div>
      </div>

      <div className="game-board" style={{justifyContent:'center'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {cards.map((card,i)=>(
            <div key={card.id} onClick={()=>flip(i)} style={{
              width:80,height:80,borderRadius:10,
              display:'flex',alignItems:'center',justifyContent:'center',
              cursor:!card.up&&!card.matched&&!locked&&!over&&cur===0?'pointer':'default',
              background:card.matched?'rgba(76,175,80,.12)':card.up?'#1a1a3a':'#0f0f1a',
              border:card.matched?'2px solid rgba(76,175,80,.4)':card.up?'2px solid #4a4a8a':'2px solid rgba(255,255,255,.06)',
              fontSize:32,transition:'all .2s',userSelect:'none',
            }}>
              {card.up||card.matched?card.type:(
                <div style={{width:24,height:24,borderRadius:5,background:'rgba(124,106,247,.18)',border:'1px solid rgba(124,106,247,.3)'}}/>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{textAlign:'center',fontSize:12,color:'#444',marginTop:10}}>
        {cards.filter(c=>c.matched).length/2} / 8 pairs found · Turn {turns}
      </div>
    </div>
  );
}
