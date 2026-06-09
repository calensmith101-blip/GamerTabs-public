// ══════════════════════════════════════════════════════════════
// FILE: FarmClaimers.jsx — Carcassonne-lite tile claiming game
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';

const TILE_TYPES = [
  { id:'farm',   icon:'🌾', label:'Farm',    pts:1, color:'rgba(82,196,26,.2)' },
  { id:'city',   icon:'🏰', label:'City',    pts:3, color:'rgba(41,128,185,.2)' },
  { id:'forest', icon:'🌲', label:'Forest',  pts:2, color:'rgba(39,174,96,.2)' },
  { id:'mine',   icon:'⛏️',  label:'Mine',   pts:4, color:'rgba(165,113,18,.2)' },
  { id:'road',   icon:'🛤️',  label:'Road',   pts:1, color:'rgba(100,100,100,.2)' },
  { id:'river',  icon:'🌊', label:'River',   pts:2, color:'rgba(52,152,219,.2)' },
];

const GRID_W=6, GRID_H=5;
const TOTAL_CELLS=GRID_W*GRID_H;

function rndTile(){return TILE_TYPES[Math.floor(Math.random()*TILE_TYPES.length)];}

function initGame(){
  const board=Array(GRID_H).fill(null).map(()=>Array(GRID_W).fill(null));
  const tiles=Array.from({length:TOTAL_CELLS},rndTile);
  return{board,tiles,tileIdx:0,turn:'red',scores:{red:0,blue:0},over:false,aiThink:false};
}

function adjacent(board,r,c){
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([nr,nc])=>nr>=0&&nr<GRID_H&&nc>=0&&nc<GRID_W&&board[nr][nc]);
}

function getBonus(board,r,c,tile){
  // Count adjacent tiles of same type for adjacency bonus
  const adj=adjacent(board,r,c);
  const sameType=adj.filter(([ar,ac])=>board[ar][ac]?.tile.id===tile.id).length;
  return sameType;
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Farm Claimers</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Claim the most valuable land on the board!</p>
        <h4>How to Play</h4><ul>
          <li>On your turn, click any empty cell to claim it with the current tile.</li>
          <li>Claim adjacent matching tiles for bonus points.</li>
          <li>City (🏰) tiles are worth most, Farms (🌾) & Roads (🛤️) least.</li>
          <li>Fill the board, then most points wins!</li>
        </ul>
      </div>
    </div>
  </div>
);

export function FarmClaimers({game,gameMode,onBack,onExit}){
  const exit=onBack||onExit||null;
  const isAI=gameMode!=='local';
  const [gs,setGs]=useState(initGame);
  const [showHelp,setShowHelp]=useState(false);

  const current=gs.tiles[gs.tileIdx];
  const emptyCells=gs.board.flat().filter(c=>!c).length;

  const handleCell=(r,c)=>{
    if(gs.over||gs.aiThink||(isAI&&gs.turn==='blue')) return;
    if(gs.board[r][c]) return;
    setGs(prev=>{
      const nb=prev.board.map(row=>[...row]);
      const bonus=getBonus(prev.board,r,c,current);
      const pts=current.pts+bonus;
      nb[r][c]={tile:current,owner:prev.turn,pts};
      const ns={...prev,board:nb,scores:{...prev.scores,[prev.turn]:prev.scores[prev.turn]+pts},tileIdx:prev.tileIdx+1};
      const remaining=nb.flat().filter(x=>!x).length;
      if(remaining===0||ns.tileIdx>=prev.tiles.length) return{...ns,over:true};
      return{...ns,turn:prev.turn==='red'?'blue':'red'};
    });
  };

  useEffect(()=>{
    if(!isAI||gs.turn!=='blue'||gs.over) return;
    const t=setTimeout(()=>{
      const empties=[];
      gs.board.forEach((row,r)=>row.forEach((c,ci)=>{if(!c)empties.push([r,ci]);}));
      if(!empties.length) return;
      // AI picks highest scoring cell
      let best=null,bestScore=-1;
      empties.forEach(([r,c])=>{
        const b=getBonus(gs.board,r,c,current);
        const s=current.pts+b;
        if(s>bestScore){bestScore=s;best=[r,c];}
      });
      if(best) handleCell(best[0],best[1]);
    },700);
    return()=>clearTimeout(t);
  },[gs.turn,gs.over,isAI]);

  const winner=gs.over?(gs.scores.red>gs.scores.blue?'Red':gs.scores.blue>gs.scores.red?'Blue':'Draw'):null;

  return(
    <div className="game-shell" style={{maxWidth:500,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🌾'} Farm Claimers</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={()=>setGs(initGame())}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>
      {gs.over&&<div className="winner-banner">{winner==='Draw'?'⚖️ Draw!':winner==='Red'?'🔴 Red Wins!':'🤖 Blue Wins!'} Red:{gs.scores.red} Blue:{gs.scores.blue}</div>}
      {!gs.over&&(
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{display:'flex',gap:10}}>
            <span style={{fontSize:13,color:'#c0392b',fontWeight:'bold'}}>🔴 {gs.scores.red}</span>
            <span style={{fontSize:13,color:'#2980b9',fontWeight:'bold'}}>🔵 {gs.scores.blue}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:11,color:'#888'}}>Next tile:</span>
            <div style={{padding:'4px 12px',borderRadius:8,background:current?.color||'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.15)',fontSize:14}}>{current?.icon} {current?.label} ({current?.pts}pts)</div>
          </div>
          <span style={{fontSize:11,color:'#888'}}>{gs.turn==='red'?'🔴':'🔵'} turn</span>
        </div>
      )}
      <div style={{border:'2px solid #2a2a4a',borderRadius:10,overflow:'hidden',background:'#0a0a14'}}>
        {gs.board.map((row,r)=>(
          <div key={r} style={{display:'flex'}}>
            {row.map((cell,c)=>(
              <div key={c} onClick={()=>handleCell(r,c)} style={{
                flex:1,aspectRatio:'1',
                background:cell?cell.tile.color:'rgba(255,255,255,.03)',
                border:`1px solid ${cell?'rgba(255,255,255,.1)':'rgba(255,255,255,.05)'}`,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                cursor:!cell&&!gs.over&&(!isAI||gs.turn==='red')?'pointer':'default',fontSize:20,
                borderTop:cell&&cell.owner==='red'?'3px solid #c0392b':cell&&cell.owner==='blue'?'3px solid #2980b9':undefined,
              }}>
                {cell&&<span>{cell.tile.icon}</span>}
                {cell&&<span style={{fontSize:9,color:'#888'}}>+{cell.pts}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{textAlign:'center',fontSize:11,color:'#555',marginTop:8}}>{emptyCells} cells remaining</div>
    </div>
  );
}
export default FarmClaimers;
