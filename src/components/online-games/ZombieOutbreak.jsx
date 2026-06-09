// ══════════════════════════════════════════════════════════════
// FILE: ZombieOutbreak.jsx — Grid-based zombie survival strategy
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';

const GRID_W=8, GRID_H=8;
const ZOMBIE_EMOJI=['🧟','🧟‍♀️','🧟‍♂️'];
const SURVIVOR_EMOJI=['🧑','👩','👨','🧔','👱'];

function rnd(n){return Math.floor(Math.random()*n);}

function initGame(){
  const cells=Array.from({length:GRID_H},(_,r)=>Array.from({length:GRID_W},(_,c)=>({
    type:'empty',entity:null,r,c
  })));
  // Place survivors (3)
  const survivorPositions=[];
  while(survivorPositions.length<3){
    const r=GRID_H-1-rnd(3),c=rnd(GRID_W);
    if(!survivorPositions.some(p=>p[0]===r&&p[1]===c)){survivorPositions.push([r,c]);}
  }
  survivorPositions.forEach(([r,c],i)=>{cells[r][c]={type:'survivor',entity:{hp:3,emoji:SURVIVOR_EMOJI[i]},r,c};});
  // Place zombies (4 at top)
  const zombiePositions=[];
  while(zombiePositions.length<4){
    const r=rnd(2),c=rnd(GRID_W);
    if(!zombiePositions.some(p=>p[0]===r&&p[1]===c)){zombiePositions.push([r,c]);}
  }
  zombiePositions.forEach(([r,c],i)=>{cells[r][c]={type:'zombie',entity:{hp:2,emoji:ZOMBIE_EMOJI[i%3]},r,c};});
  // Barricades
  for(let i=0;i<6;i++){
    let r,c;
    do{r=2+rnd(4);c=rnd(GRID_W);}while(cells[r][c].type!=='empty');
    cells[r][c]={type:'barricade',entity:{hp:2},r,c};
  }
  return {cells,turn:1,phase:'select',selected:null,log:['Outbreak detected. Hold the line!'],over:false,winner:null,zombiesSpawned:0};
}

function getCellKey(r,c){return `${r},${c}`;}
function neighbors8(r,c){const n=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const nr=r+dr,nc=c+dc;if(nr>=0&&nr<GRID_H&&nc>=0&&nc<GRID_W)n.push([nr,nc]);}return n;}

export function ZombieOutbreak({game,onBack,onExit}){
  const exit=onBack||onExit||null;
  const [gs,setGs]=useState(initGame);
  const [showHelp,setShowHelp]=useState(false);

  const dispatch=fn=>setGs(prev=>{
    const ns=fn(prev);
    // Check win/lose
    const survivors=ns.cells.flat().filter(c=>c.type==='survivor');
    const zombies=ns.cells.flat().filter(c=>c.type==='zombie');
    if(!survivors.length) return {...ns,over:true,winner:'zombies',log:['💀 All survivors fell...GAME OVER',...ns.log].slice(0,15)};
    if(!zombies.length&&ns.turn>5) return {...ns,over:true,winner:'survivors',log:['🏆 Outbreak contained! You survived!',...ns.log].slice(0,15)};
    return ns;
  });

  const handleCellClick=(r,c)=>{
    if(gs.over) return;
    const cell=gs.cells[r][c];
    if(gs.phase==='select'){
      if(cell.type==='survivor') dispatch(prev=>({...prev,selected:{r,c},phase:'action',log:[`Selected survivor at ${r},${c}`,...prev.log].slice(0,15)}));
    } else if(gs.phase==='action'&&gs.selected){
      const sel=gs.selected;
      const isAdj=Math.abs(r-sel.r)<=1&&Math.abs(c-sel.c)<=1&&!(r===sel.r&&c===sel.c);
      if(!isAdj){dispatch(prev=>({...prev,selected:null,phase:'select'}));return;}
      if(cell.type==='zombie'){
        // Attack zombie
        dispatch(prev=>{
          const nc2=prev.cells.map(row=>row.map(x=>({...x})));
          const z=nc2[r][c];
          z.entity.hp--;
          if(z.entity.hp<=0) nc2[r][c]={type:'empty',entity:null,r,c};
          const msg=z.entity?.hp<=0?`🗡 Zombie at ${r},${c} eliminated!`:`🗡 Hit zombie (${z.entity?.hp||0}HP left)`;
          return zombiesTurn({...prev,cells:nc2,selected:null,phase:'select',log:[msg,...prev.log].slice(0,15)});
        });
      } else if(cell.type==='empty'){
        // Move survivor
        dispatch(prev=>{
          const nc2=prev.cells.map(row=>row.map(x=>({...x})));
          const s=nc2[sel.r][sel.c];
          nc2[r][c]={...s,r,c}; nc2[sel.r][sel.c]={type:'empty',entity:null,r:sel.r,c:sel.c};
          return zombiesTurn({...prev,cells:nc2,selected:null,phase:'select',log:[`Moved to ${r},${c}`,...prev.log].slice(0,15)});
        });
      } else {
        dispatch(prev=>({...prev,selected:null,phase:'select'}));
      }
    }
  };

  const zombiesTurn=(state)=>{
    // Each zombie moves toward nearest survivor
    let ns={...state,turn:state.turn+1};
    const cells=ns.cells.map(row=>row.map(x=>({...x})));
    const zombies=cells.flat().filter(c=>c.type==='zombie');
    const survivors=cells.flat().filter(c=>c.type==='survivor');
    zombies.forEach(z=>{
      const target=survivors.reduce((best,s)=>{
        const d=Math.abs(s.r-z.r)+Math.abs(s.c-z.c);
        return(!best||d<best.d)?{...s,d}:best;
      },null);
      if(!target) return;
      if(Math.abs(target.r-z.r)<=1&&Math.abs(target.c-z.c)<=1){
        // Attack survivor
        cells[target.r][target.c].entity.hp--;
        if(cells[target.r][target.c].entity.hp<=0) cells[target.r][target.c]={type:'empty',entity:null,r:target.r,c:target.c};
      } else {
        // Move toward survivor
        const dr=Math.sign(target.r-z.r), dc=Math.sign(target.c-z.c);
        const nr=z.r+dr, nc2=z.c+dc;
        if(nr>=0&&nr<GRID_H&&nc2>=0&&nc2<GRID_W&&cells[nr][nc2].type==='empty'){
          cells[nr][nc2]={...cells[z.r][z.c],r:nr,c:nc2};
          cells[z.r][z.c]={type:'empty',entity:null,r:z.r,c:z.c};
        }
      }
    });
    // Spawn zombie every 3 turns
    if(ns.turn%3===0){
      for(let i=0;i<GRID_W;i++){
        if(cells[0][i].type==='empty'){cells[0][i]={type:'zombie',entity:{hp:2,emoji:ZOMBIE_EMOJI[rnd(3)]},r:0,c:i};break;}
      }
    }
    return {...ns,cells};
  };

  const cellColor={survivor:'rgba(76,175,80,.2)',zombie:'rgba(192,57,43,.2)',barricade:'rgba(100,80,0,.3)',empty:'rgba(255,255,255,.03)'};

  return(
    <div className="game-shell" style={{maxWidth:480,margin:'0 auto'}}>
      {showHelp&&(
        <div className="htp-overlay" onClick={()=>setShowHelp(false)}>
          <div className="htp-box" onClick={e=>e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Zombie Outbreak</p><button className="bv-button secondary" onClick={()=>setShowHelp(false)}>✕</button></div>
            <div className="htp-body"><h4>Objective</h4><p>Keep your survivors alive and eliminate all zombies.</p><h4>How to Play</h4><ul><li>Click a survivor (🧑) to select.</li><li>Click an adjacent zombie to attack, or empty cell to move.</li><li>After your move, zombies take their turn automatically.</li><li>Zombies spawn from the top every 3 turns.</li><li>Barricades (🧱) block movement.</li></ul></div>
          </div>
        </div>
      )}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🧟'} Zombie Outbreak</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={()=>setGs(initGame())}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>
      {gs.over&&<div className="winner-banner" style={{color:gs.winner==='survivors'?'#e8b800':'#f44'}}>{gs.cells.flat().filter(c=>c.type==='survivor').length?'🏆 Outbreak Contained!':'💀 Overrun! Game Over.'}</div>}
      {!gs.over&&<div className="turn-indicator">Turn {gs.turn} · {gs.phase==='select'?'Select a survivor':'Select target (adjacent)'}</div>}

      <div style={{display:'flex',gap:10,marginBottom:10}}>
        <span style={{fontSize:12,color:'#4caf50'}}>🧑 Survivors: {gs.cells.flat().filter(c=>c.type==='survivor').length}</span>
        <span style={{fontSize:12,color:'#f44'}}>🧟 Zombies: {gs.cells.flat().filter(c=>c.type==='zombie').length}</span>
      </div>

      <div style={{border:'2px solid #2a2a4a',borderRadius:8,overflow:'hidden',display:'inline-block'}}>
        {gs.cells.map((row,r)=>(
          <div key={r} style={{display:'flex'}}>
            {row.map((cell,c)=>{
              const isSel=gs.selected?.r===r&&gs.selected?.c===c;
              return(
                <div key={c} onClick={()=>handleCellClick(r,c)} style={{
                  width:54,height:54,background:isSel?'rgba(232,184,0,.25)':cellColor[cell.type],
                  border:`1px solid ${isSel?'rgba(232,184,0,.5)':'rgba(255,255,255,.05)'}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  cursor:!gs.over?'pointer':'default',fontSize:22,
                  flexDirection:'column',
                }}>
                  {cell.type==='survivor'&&<span>{cell.entity.emoji}<span style={{fontSize:8,color:'#4caf50',display:'block',textAlign:'center'}}>{cell.entity.hp}❤</span></span>}
                  {cell.type==='zombie'&&<span>{cell.entity.emoji}<span style={{fontSize:8,color:'#f44',display:'block',textAlign:'center'}}>{cell.entity.hp}❤</span></span>}
                  {cell.type==='barricade'&&<span style={{fontSize:18}}>🪨</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="bv-card" style={{padding:8,marginTop:10,maxHeight:90,overflowY:'auto'}}>
        {gs.log.slice(0,6).map((l,i)=><div key={i} style={{fontSize:11,color:i===0?'#e0e0e0':'#555',marginBottom:2}}>{l}</div>)}
      </div>
    </div>
  );
}
export default ZombieOutbreak;
