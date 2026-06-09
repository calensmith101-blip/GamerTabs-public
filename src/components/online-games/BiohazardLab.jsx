// ══════════════════════════════════════════════════════════════
// FILE: BiohazardLab.jsx — Pattern memory containment game
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';

const GRID=4, CONTAMINATION_LIMIT=12;

function rndPattern(size){
  const cells=new Set();
  while(cells.size<size) cells.add(Math.floor(Math.random()*GRID*GRID));
  return [...cells];
}

export function BiohazardLab({game,onBack,onExit}){
  const exit=onBack||onExit||null;
  const [level,setLevel]=useState(1);
  const [phase,setPhase]=useState('show'); // show|input|result
  const [pattern,setPattern]=useState([]);
  const [player,setPlayer]=useState([]);
  const [contaminated,setContaminated]=useState([]);
  const [score,setScore]=useState(0);
  const [over,setOver]=useState(false);
  const [showHint,setShowHint]=useState(true);
  const timerRef=useRef(null);

  const startLevel=()=>{
    const size=Math.min(3+level,12);
    const p=rndPattern(size);
    setPattern(p); setPlayer([]); setPhase('show'); setShowHint(true);
    timerRef.current=setTimeout(()=>{ setPhase('input'); setShowHint(false); }, 2000+level*300);
  };

  useEffect(()=>{ startLevel(); return()=>clearTimeout(timerRef.current); },[level]);

  const handleCell=(idx)=>{
    if(phase!=='input'||over) return;
    if(player.includes(idx)) return;
    const np=[...player,idx];
    setPlayer(np);
    if(np.length===pattern.length){
      // Check
      const correct=pattern.every(p=>np.includes(p))&&np.every(p=>pattern.includes(p));
      setPhase('result');
      if(correct){
        setScore(s=>s+level*10);
        setTimeout(()=>setLevel(l=>l+1),1200);
      } else {
        const missed=pattern.filter(p=>!np.includes(p));
        const wrong=np.filter(p=>!pattern.includes(p));
        setContaminated(prev=>[...prev,...wrong,...missed.slice(0,2)].slice(0,CONTAMINATION_LIMIT));
        const newCont=[...contaminated,...wrong,...missed.slice(0,2)];
        if(newCont.length>=CONTAMINATION_LIMIT){setOver(true);}
        else{setTimeout(()=>startLevel(),1500);}
      }
    }
  };

  const reset=()=>{setLevel(1);setScore(0);setContaminated([]);setOver(false);startLevel();};

  return(
    <div className="game-shell" style={{maxWidth:380,margin:'0 auto'}}>
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'☣️'} Biohazard Lab</h2>
        <div style={{display:'flex',gap:6}}><button className="bv-button" onClick={reset}>New</button>{exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}</div>
      </div>
      {over&&<div className="winner-banner" style={{color:'#f44'}}>☣ Lab compromised! Score: {score}</div>}
      {!over&&<div className="turn-indicator">{phase==='show'?`Level ${level} — memorise pattern…`:phase==='input'?'Select the contaminated cells!':'Checking…'}</div>}
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:12,color:'#888'}}>
        <span>Level {level} · Score {score}</span>
        <span style={{color:'#f44'}}>☣ Contamination: {contaminated.length}/{CONTAMINATION_LIMIT}</span>
      </div>
      <div style={{background:'#1a1a2e',borderRadius:10,padding:10,display:'inline-block',border:'2px solid #2a2a4a'}}>
        {Array.from({length:GRID},(_,r)=>(
          <div key={r} style={{display:'flex',gap:6,marginBottom:6}}>
            {Array.from({length:GRID},(_,c)=>{
              const idx=r*GRID+c;
              const inPattern=pattern.includes(idx);
              const inPlayer=player.includes(idx);
              const isContam=contaminated.includes(idx);
              let bg='rgba(255,255,255,.05)';
              if(phase==='show'&&inPattern) bg='rgba(244,67,54,.6)';
              if(phase==='input'&&inPlayer) bg='rgba(232,184,0,.4)';
              if(phase==='result'){
                if(inPattern&&inPlayer) bg='rgba(76,175,80,.5)';
                else if(inPattern&&!inPlayer) bg='rgba(244,67,54,.7)';
                else if(!inPattern&&inPlayer) bg='rgba(255,165,0,.5)';
              }
              return(
                <div key={c} onClick={()=>handleCell(idx)} style={{
                  width:68,height:68,borderRadius:8,background:bg,
                  border:`1px solid ${isContam?'rgba(244,67,54,.4)':'rgba(255,255,255,.08)'}`,
                  cursor:phase==='input'?'pointer':'default',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,
                  transition:'background .2s',
                }}>
                  {phase==='show'&&inPattern&&'☣'}
                  {phase==='input'&&inPlayer&&'✓'}
                  {phase==='result'&&inPattern&&(inPlayer?'✓':'☣')}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{textAlign:'center',fontSize:11,color:'#555',marginTop:8}}>
        {phase==='show'?'Memorise the highlighted cells':'Click all contaminated cells from memory'}
      </div>
    </div>
  );
}
export default BiohazardLab;
