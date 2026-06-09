import React, { useState, useEffect, useCallback, useRef } from 'react';

const CONFIGS = {
  easy:   { rows:9,  cols:9,  mines:10 },
  medium: { rows:12, cols:12, mines:25 },
  hard:   { rows:16, cols:16, mines:48 },
};

function buildGrid(rows, cols, mines, safeR, safeC) {
  const flat = Array(rows*cols).fill(false);
  const safe = new Set();
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) {
    const nr=safeR+dr, nc=safeC+dc;
    if(nr>=0&&nr<rows&&nc>=0&&nc<cols) safe.add(nr*cols+nc);
  }
  let placed=0;
  while(placed<mines) {
    const idx=Math.floor(Math.random()*rows*cols);
    if(!flat[idx]&&!safe.has(idx)) { flat[idx]=true; placed++; }
  }
  return Array.from({length:rows},(_,r)=>
    Array.from({length:cols},(_,c)=>({
      mine: flat[r*cols+c], revealed:false, flagged:false,
      count:0, r, c,
    }))
  ).map((row,r)=>row.map((cell,c)=>{
    if(!cell.mine) {
      let n=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) {
        const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<row.length&&nc>=0&&nc<row.length&&flat[nr*cols+nc]) n++;
      }
      cell.count=n;
    }
    return cell;
  }));
}

function floodReveal(grid,r,c) {
  const rows=grid.length, cols=grid[0].length;
  const ng=grid.map(row=>row.map(x=>({...x})));
  const q=[[r,c]];
  while(q.length) {
    const [cr,cc]=q.shift();
    if(cr<0||cr>=rows||cc<0||cc>=cols) continue;
    const cell=ng[cr][cc];
    if(cell.revealed||cell.flagged) continue;
    cell.revealed=true;
    if(cell.count===0&&!cell.mine) {
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) {
        if(dr===0&&dc===0) continue;
        q.push([cr+dr,cc+dc]);
      }
    }
  }
  return ng;
}

const CELL_SIZE=32;
const COUNT_COLORS=['','#3498db','#27ae60','#e74c3c','#8e44ad','#c0392b','#1abc9c','#2c3e50','#7f8c8d'];

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Minefield</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Reveal all cells that don't contain mines. Don't detonate anything!</p>
        <h4>How to Play</h4><ul>
          <li>Click to reveal a cell.</li>
          <li>Numbers show how many adjacent mines there are.</li>
          <li>Right-click (or long-press) to place/remove a flag 🚩.</li>
          <li>Empty cells auto-reveal their neighbours.</li>
          <li>Flag all mines and reveal everything else to win.</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function Minefield({gameMode,difficulty:diff,game,onBack,onExit}) {
  const exit=onBack||onExit||null;
  const level = diff==='hard'?'hard':diff==='medium'?'medium':'easy';
  const cfg=CONFIGS[level];

  const [grid,setGrid]=useState(null);
  const [phase,setPhase]=useState('idle'); // idle|playing|won|lost
  const [flags,setFlags]=useState(0);
  const [seconds,setSeconds]=useState(0);
  const [showHelp,setShowHelp]=useState(false);
  const timerRef=useRef(null);

  const startTimer=useCallback(()=>{
    clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>setSeconds(s=>s+1),1000);
  },[]);

  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  const reset=()=>{
    setGrid(null); setPhase('idle'); setFlags(0); setSeconds(0);
    clearInterval(timerRef.current);
  };

  const handleClick=(r,c)=>{
    if(phase==='won'||phase==='lost') return;
    setGrid(prev=>{
      let g=prev;
      if(!g) {
        g=buildGrid(cfg.rows,cfg.cols,cfg.mines,r,c);
        setPhase('playing');
        startTimer();
      }
      const cell=g[r][c];
      if(cell.revealed||cell.flagged) return g;
      if(cell.mine) {
        // Reveal all mines
        const ng=g.map(row=>row.map(x=>x.mine?{...x,revealed:true}:{...x}));
        ng[r][c]={...ng[r][c],detonated:true};
        setPhase('lost');
        clearInterval(timerRef.current);
        return ng;
      }
      const ng=floodReveal(g,r,c);
      // Check win
      const unrevealed=ng.flat().filter(x=>!x.revealed&&!x.mine).length;
      if(unrevealed===0) { setPhase('won'); clearInterval(timerRef.current); }
      return ng;
    });
  };

  const handleFlag=(e,r,c)=>{
    e.preventDefault();
    if(phase==='won'||phase==='lost') return;
    setGrid(prev=>{
      if(!prev) return prev;
      const ng=prev.map(row=>row.map(x=>({...x})));
      const cell=ng[r][c];
      if(cell.revealed) return prev;
      cell.flagged=!cell.flagged;
      setFlags(f=>cell.flagged?f+1:f-1);
      return ng;
    });
  };

  const minesLeft=cfg.mines-flags;

  return(
    <div className="game-shell" style={{maxWidth:600,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'💣'} Minefield</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {phase==='won'&&<div className="winner-banner">🏆 Field Cleared! Time: {seconds}s</div>}
      {phase==='lost'&&<div className="winner-banner" style={{color:'#f44'}}>💥 DETONATED! Game over.</div>}

      {/* HUD */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'rgba(255,255,255,.03)',borderRadius:8,marginBottom:10}}>
        <div style={{fontSize:13,color:'#e8b800',fontWeight:'bold'}}>🚩 {minesLeft}</div>
        <div style={{fontSize:11,color:'#888',textTransform:'uppercase',letterSpacing:2}}>{level}</div>
        <div style={{fontSize:13,color:'#e8b800',fontWeight:'bold'}}>⏱ {seconds}s</div>
      </div>

      {/* Grid */}
      <div style={{overflowX:'auto'}}>
        <div style={{display:'inline-block',border:'2px solid #2a2a4a',borderRadius:6,overflow:'hidden',background:'#0f0f18'}}>
          {(grid||Array.from({length:cfg.rows},(_,r)=>Array.from({length:cfg.cols},(_,c)=>({r,c,revealed:false,flagged:false,mine:false,count:0})))).map((row,r)=>(
            <div key={r} style={{display:'flex'}}>
              {row.map((cell,c)=>{
                const bg=cell.revealed
                  ?cell.detonated?'#8b0000':cell.mine?'#5a0000':'#1a1a2e'
                  :'rgba(255,255,255,.06)';
                return(
                  <div key={c}
                    onClick={()=>handleClick(r,c)}
                    onContextMenu={e=>handleFlag(e,r,c)}
                    style={{
                      width:CELL_SIZE,height:CELL_SIZE,
                      background:bg,
                      border:'1px solid rgba(255,255,255,.05)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      cursor:cell.revealed?'default':'pointer',
                      fontSize:cell.flagged?16:cell.mine&&cell.revealed?14:13,
                      fontWeight:'bold',
                      color:COUNT_COLORS[cell.count]||'#e0e0e0',
                      userSelect:'none',
                      transition:'background .1s',
                    }}>
                    {cell.flagged&&!cell.revealed?'🚩'
                    :cell.revealed&&cell.mine?'💣'
                    :cell.revealed&&cell.count>0?cell.count
                    :''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{textAlign:'center',fontSize:11,color:'#555',marginTop:8}}>Right-click or long-press to flag · Click to reveal</div>
    </div>
  );
}
