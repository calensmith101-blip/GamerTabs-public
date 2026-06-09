// ══════════════════════════════════════════════════════════════
// FILE: WordQuest.jsx — Anagram word puzzle game
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';

const WORD_POOL = [
  {word:'CASTLE',hint:'Medieval fortress'},
  {word:'PLANET',hint:'Orbits a star'},
  {word:'MARKET',hint:'Place of trade'},
  {word:'GARDEN',hint:'Grow plants here'},
  {word:'BRIDGE',hint:'Crosses a gap'},
  {word:'GUITAR',hint:'Stringed instrument'},
  {word:'JUNGLE',hint:'Dense tropical forest'},
  {word:'PIRATE',hint:'Plunders at sea'},
  {word:'FROZEN',hint:'Turned to ice'},
  {word:'SILVER',hint:'Precious grey metal'},
  {word:'COBALT',hint:'Deep blue element'},
  {word:'PILLAR',hint:'Structural column'},
  {word:'MIRROR',hint:'Reflects your face'},
  {word:'CANDLE',hint:'Wax light source'},
  {word:'GRAVEL',hint:'Small stones on path'},
  {word:'CACTUS',hint:'Desert spiky plant'},
  {word:'DRAGON',hint:'Mythical fire breather'},
  {word:'FINGER',hint:'Part of a hand'},
  {word:'WINTER',hint:'Coldest season'},
  {word:'HUNTER',hint:'Pursues prey'},
  {word:'BRANCH',hint:'Part of a tree'},
  {word:'PARROT',hint:'Colourful talking bird'},
  {word:'FROZEN',hint:'Turned to ice'},
  {word:'FOREST',hint:'Woodland area'},
  {word:'ISLAND',hint:'Land surrounded by water'},
  {word:'TEMPLE',hint:'Place of worship'},
  {word:'PLAGUE',hint:'Deadly epidemic'},
  {word:'KNIGHT',hint:'Armoured warrior'},
  {word:'SHADOW',hint:'Dark silhouette'},
  {word:'BARREL',hint:'Cylindrical container'},
];

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function scramble(w){const a=w.split('');do{shuffle(a);}while(a.join('')===w);return a;}

export function WordQuest({game,onBack,onExit,gameMode}){
  const exit=onBack||onExit||null;
  const [pool]=useState(()=>shuffle([...WORD_POOL]));
  const [qIdx,setQIdx]=useState(0);
  const [letters,setLetters]=useState([]);
  const [selected,setSelected]=useState([]);
  const [input,setInput]=useState('');
  const [score,setScore]=useState(0);
  const [streak,setStreak]=useState(0);
  const [result,setResult]=useState(null); // null|'correct'|'wrong'
  const [showHint,setShowHint]=useState(false);
  const [over,setOver]=useState(false);
  const [showHelp,setShowHelp]=useState(false);

  const current=pool[qIdx];

  useEffect(()=>{
    if(!current) return;
    setLetters(scramble(current.word));
    setSelected([]);setInput('');setResult(null);setShowHint(false);
  },[qIdx,current]);

  const handleLetter=(i)=>{
    if(result||selected.includes(i)) return;
    const ns=[...selected,i];
    setSelected(ns);
    setInput(ns.map(idx=>letters[idx]).join(''));
  };

  const handleUndo=()=>{
    if(!selected.length||result) return;
    const ns=selected.slice(0,-1);
    setSelected(ns);setInput(ns.map(idx=>letters[idx]).join(''));
  };

  const handleSubmit=()=>{
    if(!input||result) return;
    const correct=input===current.word;
    setResult(correct?'correct':'wrong');
    if(correct){
      const bonus=streak>=2?2:1;
      setScore(s=>s+bonus);setStreak(st=>st+1);
    } else {
      setStreak(0);
    }
    setTimeout(()=>{
      if(qIdx>=Math.min(pool.length-1,19)){setOver(true);}
      else{setQIdx(i=>i+1);}
    },1500);
  };

  const reset=()=>{setQIdx(0);setScore(0);setStreak(0);setOver(false);};

  if(over) return(
    <div className="game-shell" style={{maxWidth:400,margin:'0 auto',textAlign:'center'}}>
      <div className="game-header"><h2 className="bv-title">{game?.icon||'📝'} Word Quest</h2></div>
      <div className="winner-banner">🏆 Done! Score: {score}/20</div>
      <button className="bv-button" style={{marginTop:20}} onClick={reset}>Play Again</button>
      {exit&&<button className="bv-button secondary" style={{marginTop:10}} onClick={exit}>Exit</button>}
    </div>
  );

  return(
    <div className="game-shell" style={{maxWidth:400,margin:'0 auto'}}>
      {showHelp&&(
        <div className="htp-overlay" onClick={()=>setShowHelp(false)}>
          <div className="htp-box" onClick={e=>e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Word Quest</p><button className="bv-button secondary" onClick={()=>setShowHelp(false)}>✕</button></div>
            <div className="htp-body"><h4>Objective</h4><p>Unscramble the word from the shuffled letters.</p><h4>How to Play</h4><ul><li>Click letters in order to spell the correct word.</li><li>Use the hint if stuck (costs a streak bonus).</li><li>Streak bonuses for consecutive correct answers!</li></ul></div>
          </div>
        </div>
      )}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'📝'} Word Quest</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#888',marginBottom:14}}>
        <span>Word {qIdx+1}/20</span>
        <span style={{color:'#e8b800',fontWeight:'bold'}}>Score: {score}{streak>=2&&` 🔥×${streak}`}</span>
      </div>

      {result==='correct'&&<div className="winner-banner" style={{padding:'6px',marginBottom:8}}>✓ Correct! {streak>=2?`+2 (streak ×${streak})`:''}  </div>}
      {result==='wrong'&&<div className="winner-banner" style={{color:'#f44',padding:'6px',marginBottom:8}}>✗ The word was: {current?.word}</div>}

      {/* Hint */}
      <div className="bv-card" style={{padding:10,marginBottom:12,textAlign:'center'}}>
        {showHint?<span style={{color:'#e8b800',fontSize:13}}>{current?.hint}</span>
        :<button className="bv-button secondary" style={{fontSize:11}} onClick={()=>setShowHint(true)}>💡 Show Hint</button>}
      </div>

      {/* Input display */}
      <div style={{height:48,display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:16}}>
        {current?.word.split('').map((_,i)=>{
          const ch=selected[i]!==undefined?letters[selected[i]]:'_';
          return(
            <div key={i} style={{width:36,height:40,borderRadius:6,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:'bold',color:ch==='_'?'#444':'#e8b800',fontFamily:'monospace'}}>
              {ch}
            </div>
          );
        })}
      </div>

      {/* Scrambled letters */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center',marginBottom:14}}>
        {letters.map((l,i)=>{
          const used=selected.includes(i);
          return(
            <div key={i} onClick={()=>!used&&handleLetter(i)} style={{
              width:44,height:52,borderRadius:8,cursor:used?'default':'pointer',
              background:used?'rgba(255,255,255,.02)':'rgba(232,184,0,.1)',
              border:`2px solid ${used?'rgba(255,255,255,.05)':'rgba(232,184,0,.4)'}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:18,fontWeight:'bold',color:used?'#333':'#e8b800',
              opacity:used?0.3:1,transition:'all .15s',fontFamily:'monospace',
              boxShadow:used?'none':'0 2px 8px rgba(232,184,0,.2)',
            }}>{l}</div>
          );
        })}
      </div>

      <div style={{display:'flex',gap:8,justifyContent:'center'}}>
        <button className="bv-button secondary" onClick={handleUndo} disabled={!selected.length||!!result}>⌫ Undo</button>
        <button className="bv-button" onClick={handleSubmit} disabled={selected.length!==current?.word.length||!!result}>
          Submit ✓
        </button>
      </div>
    </div>
  );
}
export default WordQuest;
