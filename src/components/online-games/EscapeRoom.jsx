// ══════════════════════════════════════════════════════════════
// FILE: EscapeRoom.jsx — Riddle & code-based escape puzzle game
// ══════════════════════════════════════════════════════════════
import React, { useState } from 'react';

const PUZZLES = [
  { room:'Server Room', icon:'💻', puzzle:'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. I have roads, but no cars. What am I?', answer:'MAP', hint:'Found in geography class', inputType:'text' },
  { room:'Vault Door', icon:'🔐', puzzle:'A three-digit code where: each digit is unique, the first digit × 2 = the third digit, and all digits sum to 9. What is the code?', answer:'234', hint:'The middle digit is between the other two', inputType:'number' },
  { room:'Generator Room', icon:'⚡', puzzle:'The more you take, the more you leave behind. What am I?', answer:'FOOTSTEPS', hint:'Think about walking on a path', inputType:'text' },
  { room:'The Library', icon:'📚', puzzle:'What 5-letter word becomes shorter when you add two letters to it?', answer:'SHORT', hint:'The answer describes its own length', inputType:'text' },
  { room:'Lab Alpha', icon:'🧪', puzzle:'I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?', answer:'ECHO', hint:'Shout into a canyon to hear me', inputType:'text' },
  { room:'Control Room', icon:'🖥', puzzle:'What has hands but cannot clap?', answer:'CLOCK', hint:'Hangs on walls, tells time', inputType:'text' },
  { room:'Storage Bay', icon:'📦', puzzle:'A 4-digit code: the last digit is the first digit doubled, second digit = 0, third digit = 7, first digit = 3. Enter code.', answer:'3073', hint:'Read the clues left to right', inputType:'number' },
  { room:'Exit Hatch', icon:'🚪', puzzle:'I am always in front of you but can never be seen. What am I?', answer:'FUTURE', hint:'Tomorrow is part of me', inputType:'text' },
];

export function EscapeRoom({game,onBack,onExit}){
  const exit=onBack||onExit||null;
  const [idx,setIdx]=useState(0);
  const [val,setVal]=useState('');
  const [status,setStatus]=useState(''); // ''|'correct'|'wrong'
  const [showHint,setShowHint]=useState(false);
  const [hintsUsed,setHintsUsed]=useState(0);
  const [errors,setErrors]=useState(0);
  const [solved,setSolved]=useState(0);
  const [done,setDone]=useState(false);

  const p=PUZZLES[idx];
  const submit=()=>{
    const clean=val.trim().toUpperCase().replace(/\s+/g,'');
    if(clean===p.answer){
      setStatus('correct');setSolved(s=>s+1);
      setTimeout(()=>{
        if(idx>=PUZZLES.length-1){setDone(true);}
        else{setIdx(i=>i+1);setVal('');setStatus('');setShowHint(false);}
      },1200);
    } else {
      setStatus('wrong');setErrors(e=>e+1);
      setTimeout(()=>setStatus(''),1000);
    }
  };

  const reset=()=>{setIdx(0);setVal('');setStatus('');setShowHint(false);setHintsUsed(0);setErrors(0);setSolved(0);setDone(false);};

  if(done) return(
    <div className="game-shell" style={{maxWidth:440,margin:'0 auto',textAlign:'center'}}>
      <div className="game-header"><h2 className="bv-title">{game?.icon||'🚪'} Escape Room</h2></div>
      <div className="winner-banner">🏆 ESCAPED! {solved}/{PUZZLES.length} rooms · {errors} errors · {hintsUsed} hints used</div>
      <button className="bv-button" style={{marginTop:20}} onClick={reset}>Try Again</button>
      {exit&&<button className="bv-button secondary" style={{marginTop:10}} onClick={exit}>Exit</button>}
    </div>
  );

  return(
    <div className="game-shell" style={{maxWidth:440,margin:'0 auto'}}>
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🚪'} Escape Room</h2>
        <div style={{display:'flex',gap:6}}><button className="bv-button" onClick={reset}>Restart</button>{exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}</div>
      </div>

      {/* Progress */}
      <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
        {PUZZLES.map((_,i)=>(
          <div key={i} style={{width:28,height:8,borderRadius:4,background:i<idx?'#4caf50':i===idx?'#e8b800':'rgba(255,255,255,.1)',transition:'background .3s'}}/>
        ))}
      </div>

      {/* Room */}
      <div className="bv-card" style={{padding:20,marginBottom:14,textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>{p.icon}</div>
        <div style={{fontSize:13,color:'#e8b800',fontWeight:'bold',letterSpacing:2,marginBottom:4}}>{p.room.toUpperCase()}</div>
        <div style={{fontSize:13,color:'#555',marginBottom:4}}>Room {idx+1} of {PUZZLES.length}</div>
      </div>

      <div className="bv-card" style={{padding:16,marginBottom:14}}>
        <div style={{fontSize:15,color:'#e0e0e0',lineHeight:1.6}}>{p.puzzle}</div>
      </div>

      {showHint&&<div style={{padding:'8px 12px',borderRadius:8,background:'rgba(232,184,0,.08)',border:'1px solid rgba(232,184,0,.2)',fontSize:12,color:'#e8b800',marginBottom:10}}>💡 {p.hint}</div>}

      {status==='correct'&&<div className="winner-banner" style={{padding:'6px',marginBottom:10}}>✓ Unlocked!</div>}
      {status==='wrong'&&<div className="winner-banner" style={{color:'#f44',padding:'6px',marginBottom:10}}>✗ Wrong code — try again</div>}

      <input
        value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>e.key==='Enter'&&submit()}
        placeholder={p.inputType==='number'?'Enter code…':'Type your answer…'}
        style={{width:'100%',boxSizing:'border-box',background:'#0f0f1a',color:'#e0e0e0',border:'1px solid #2a2a4a',borderRadius:8,padding:'12px 14px',fontSize:16,fontFamily:'monospace',outline:'none',marginBottom:10}}
      />
      <div style={{display:'flex',gap:8}}>
        <button className="bv-button" style={{flex:1}} onClick={submit}>Submit ▶</button>
        <button className="bv-button secondary" style={{fontSize:11}} onClick={()=>{setShowHint(true);setHintsUsed(h=>h+1);}}>💡 Hint</button>
      </div>
    </div>
  );
}
export default EscapeRoom;
