// ============================================================
// FILE: DominoDash.jsx → src/components/online-games/DominoDash.jsx
// ============================================================
import React, { useState, useEffect } from 'react';

const genTiles=()=>{const t=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)t.push({id:`${a}|${b}`,a,b});return t;};
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const handPips=h=>h.reduce((s,t)=>s+t.a+t.b,0);

function initGame(){
  const tiles=shuffle(genTiles());
  const pH=tiles.splice(0,7);const aH=tiles.splice(0,7);
  return{pH,aH,bone:tiles,chain:[],left:-1,right:-1,cur:0,over:false,winner:null};
}

function canPlay(t,l,r){if(l===-1)return true;return t.a===l||t.b===l||t.a===r||t.b===r;}
function playable(hand,l,r){return hand.filter(t=>canPlay(t,l,r));}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">How to Play — Chain Code</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Play all your tiles first. If blocked, lowest total pips wins.</p>
        <h4>Rules</h4><ul><li>Play a tile whose number matches an open end of the chain.</li><li>If you cannot play, draw from the boneyard until you can (or it's empty).</li><li>If no draw possible, pass. Game ends when both pass consecutively.</li></ul>
      </div>
    </div>
  </div>
);

export default function DominoDash(props){
  const{onBack,onExit,gameMode,game}=props||{};
  const exit=onBack||onExit||null;
  const isAI=gameMode==='ai'||gameMode==='computer';
  const[g,setG]=useState(initGame);
  const[msg,setMsg]=useState('');
  const[passes,setPasses]=useState(0);
  const[showHelp,setShowHelp]=useState(false);

  const reset=()=>{setG(initGame());setMsg('');setPasses(0);};

  // Auto-place first tile
  useEffect(()=>{
    if(g.chain.length===0){
      // Find highest double
      let first=null,who=0;
      for(let d=6;d>=0;d--){
        const t=g.pH.find(t=>t.a===d&&t.b===d);
        if(t){first=t;who=0;break;}
        const t2=g.aH.find(t=>t.a===d&&t.b===d);
        if(t2){first=t2;who=1;break;}
      }
      if(first){
        setG(prev=>{
          const hand=who===0?[...prev.pH]:[...prev.aH];
          const idx=hand.findIndex(t=>t.id===first.id);hand.splice(idx,1);
          const ns={...prev,chain:[first],left:first.a,right:first.b,cur:who===0?1:0};
          if(who===0)ns.pH=hand;else ns.aH=hand;
          if(hand.length===0){ns.over=true;ns.winner=who;}
          return ns;
        });
      }
    }
  },[]);

  const doPlay=(tile,end)=>{
    setG(prev=>{
      const hand=[...(prev.cur===0?prev.pH:prev.aH)];
      const idx=hand.findIndex(t=>t.id===tile.id);if(idx===-1)return prev;
      hand.splice(idx,1);
      let newLeft=prev.left,newRight=prev.right,placed=tile;
      if(end==='left'){
        if(tile.b===prev.left){newLeft=tile.a;placed={...tile};}
        else{newLeft=tile.b;placed={...tile,a:tile.b,b:tile.a};}
      } else {
        if(tile.a===prev.right){newRight=tile.b;}
        else{newRight=tile.a;placed={...tile,a:tile.b,b:tile.a};}
      }
      const chain=end==='left'?[placed,...prev.chain]:[...prev.chain,placed];
      const ns={...prev,chain,left:newLeft,right:newRight};
      if(prev.cur===0)ns.pH=hand;else ns.aH=hand;
      ns.cur=prev.cur===0?1:0;setPasses(0);
      if(hand.length===0){ns.over=true;ns.winner=prev.cur;}
      return ns;
    });setMsg('');
  };

  const doDraw=()=>{
    setG(prev=>{
      if(!prev.bone.length){setMsg('Boneyard empty — pass!');return prev;}
      const bone=[...prev.bone];const drawn=bone.shift();
      const hand=prev.cur===0?[...prev.pH,drawn]:[...prev.aH,drawn];
      const ns={...prev,bone};
      if(prev.cur===0)ns.pH=hand;else ns.aH=hand;
      if(canPlay(drawn,prev.left,prev.right))setMsg(`Drew: ${drawn.a}|${drawn.b}`);
      return ns;
    });
  };

  const doPass=()=>{
    setG(prev=>{
      const np=passes+1;setPasses(np);
      if(np>=2){
        const pw=handPips(prev.pH)<handPips(prev.aH)?0:1;
        return{...prev,over:true,winner:pw};
      }
      return{...prev,cur:prev.cur===0?1:0};
    });setMsg('Passed turn.');
  };

  // AI turn
  useEffect(()=>{
    if(!isAI||g.cur!==1||g.over||g.chain.length===0)return;
    const t=setTimeout(()=>{
      const pl=playable(g.aH,g.left,g.right);
      if(pl.length){
        const tile=pl[0];
        const leftOk=tile.a===g.left||tile.b===g.left;
        doPlay(tile,leftOk?'left':'right');
      } else if(g.bone.length){doDraw();}
      else doPass();
    },700);
    return()=>clearTimeout(t);
  },[g.cur,isAI,g.over,g.chain.length]);

  const myPlay=playable(g.pH,g.left,g.right);
  const canDraw=g.cur===0&&myPlay.length===0&&g.bone.length>0&&!g.over;
  const canPass=g.cur===0&&myPlay.length===0&&g.bone.length===0&&!g.over;

  return(
    <div className="game-shell" style={{maxWidth:600,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🀱'} Chain Code</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>
      {g.over&&<div className="winner-banner">{g.winner===0?'🏆 You Win!':isAI?'🤖 AI Wins!':'P2 Wins!'}</div>}
      {!g.over&&<div className="turn-indicator">{g.cur===0?'Your turn':isAI?'🤖 AI playing…':'P2 turn'}{msg&&<span style={{color:'#e8b800',marginLeft:8}}>{msg}</span>}</div>}
      <div className="bv-card" style={{padding:10,marginBottom:10,overflowX:'auto',minHeight:70}}>
        <div style={{fontSize:11,color:'#888',marginBottom:5}}>Chain ends: [{g.left}…{g.right}] · {g.bone.length} in boneyard</div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          {g.chain.length===0?<span style={{color:'#444',fontSize:12}}>Starting…</span>:
            g.chain.slice(-10).map((t,i)=>(
              <div key={t.id+i} style={{display:'inline-flex',flexDirection:'column',alignItems:'center',border:'1px solid #2a2a4a',borderRadius:5,background:'#12121e',padding:'2px 5px',fontSize:12,color:'#7c6af7',flexShrink:0}}>
                <span>{t.a}</span><div style={{width:'80%',height:1,background:'#2a2a4a',margin:'1px 0'}}/>
                <span>{t.b}</span>
              </div>
            ))
          }
        </div>
      </div>
      <div className="bv-card" style={{padding:10,marginBottom:10}}>
        <div style={{fontSize:12,color:'#4caf50',marginBottom:6}}>Your Hand ({g.pH.length} tiles)</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {g.pH.map(tile=>{
            const isP=g.cur===0&&!g.over&&canPlay(tile,g.left,g.right)&&g.chain.length>0;
            const leftOk=tile.a===g.left||tile.b===g.left;
            return(
              <div key={tile.id} onClick={isP?()=>doPlay(tile,leftOk?'left':'right'):undefined} style={{
                display:'inline-flex',flexDirection:'column',alignItems:'center',
                border:`2px solid ${isP?'#e8b800':'rgba(255,255,255,.12)'}`,
                borderRadius:7,background:isP?'rgba(232,184,0,.08)':'#1a1a2e',
                padding:'4px 8px',fontSize:14,color:'#7c6af7',cursor:isP?'pointer':'default',flexShrink:0,
              }}>
                <span>{tile.a}</span><div style={{width:'80%',height:1,background:'#2a2a4a',margin:'2px 0'}}/><span>{tile.b}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        {canDraw&&<button className="bv-button" onClick={doDraw}>Draw ({g.bone.length})</button>}
        {canPass&&<button className="bv-button secondary" onClick={doPass}>Pass Turn</button>}
      </div>
      <div style={{marginTop:8,fontSize:12,color:'#555'}}>{isAI?'AI':'P2'}: {g.aH.length} tiles</div>
    </div>
  );
}
