import React, { useState, useEffect, useCallback } from 'react';

/* Stone War — Go-lite on 9×9 board
 * Place stones, capture groups with no liberties, score by territory.
 * Simplified: no Ko rule, no superko, pass to end game.
 */

const N = 9;
function empty() { return Array(N).fill(null).map(() => Array(N).fill(null)); }

function neighbors(r, c) {
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([nr,nc])=>nr>=0&&nr<N&&nc>=0&&nc<N);
}

// Get the group containing (r,c) and its liberties
function getGroup(board, r, c) {
  const color = board[r][c];
  if (!color) return null;
  const group = new Set(), libs = new Set();
  const q = [[r,c]];
  const seen = new Set([`${r},${c}`]);
  while (q.length) {
    const [cr,cc] = q.shift();
    group.add(`${cr},${cc}`);
    for (const [nr,nc] of neighbors(cr,cc)) {
      const k = `${nr},${nc}`;
      if (!board[nr][nc]) { libs.add(k); }
      else if (board[nr][nc]===color && !seen.has(k)) { seen.add(k); q.push([nr,nc]); }
    }
  }
  return { group, libs };
}

// Apply move: place stone, capture opponent groups with 0 liberties, return new board or null if suicide
function applyMove(board, r, c, color) {
  if (board[r][c]) return null; // occupied
  const nb = board.map(row=>[...row]);
  nb[r][c] = color;
  const opp = color==='b'?'w':'b';

  // Capture opponent groups
  let captured = 0;
  for (const [nr,nc] of neighbors(r,c)) {
    if (nb[nr][nc]===opp) {
      const g = getGroup(nb,nr,nc);
      if (g && g.libs.size===0) {
        g.group.forEach(k=>{ const [gr,gc]=k.split(','); nb[gr][gc]=null; captured++; });
      }
    }
  }

  // Check suicide (player's own group has 0 liberties after capture)
  const pg = getGroup(nb,r,c);
  if (pg && pg.libs.size===0 && captured===0) return null;

  return { board:nb, captured };
}

// Count territory (flood fill empty regions, determine owner)
function scoreBoard(board) {
  const visited = Array(N).fill(null).map(()=>Array(N).fill(false));
  let bScore=0, wScore=0;
  // Count stones
  board.flat().forEach(c=>{ if(c==='b') bScore++; if(c==='w') wScore++; });
  // Count territory
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) {
    if(!board[r][c]&&!visited[r][c]) {
      const region=[], q=[[r,c]]; let bAdj=0,wAdj=0;
      const vs=new Set();
      while(q.length){
        const[cr,cc]=q.shift(); const k=`${cr},${cc}`;
        if(vs.has(k)) continue; vs.add(k); visited[cr][cc]=true;
        region.push([cr,cc]);
        for(const[nr,nc] of neighbors(cr,cc)){
          if(board[nr][nc]==='b') bAdj++;
          else if(board[nr][nc]==='w') wAdj++;
          else if(!vs.has(`${nr},${nc}`)) q.push([nr,nc]);
        }
      }
      if(bAdj>0&&wAdj===0) bScore+=region.length;
      else if(wAdj>0&&bAdj===0) wScore+=region.length;
    }
  }
  return {b:bScore,w:wScore};
}

// Simple AI: pick random empty valid move, prefer captures
function aiMove(board, color) {
  const opp = color==='b'?'w':'b';
  const candidates=[], captures=[];
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) {
    if(!board[r][c]) {
      const result=applyMove(board,r,c,color);
      if(result) {
        if(result.captured>0) captures.push([r,c]);
        else candidates.push([r,c]);
      }
    }
  }
  if(captures.length) return captures[Math.floor(Math.random()*captures.length)];
  if(candidates.length) {
    // Prefer center/edges
    const sorted = candidates.sort(([ar,ac],[br,bc])=>{
      const da=Math.abs(ar-4)+Math.abs(ac-4), db=Math.abs(br-4)+Math.abs(bc-4);
      return da-db;
    });
    return sorted[Math.floor(Math.random()*Math.min(8,sorted.length))];
  }
  return null; // must pass
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Stone War (Go)</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Control more territory than your opponent at game end.</p>
        <h4>Rules</h4><ul>
          <li>Click any empty intersection to place a stone.</li>
          <li>Stones are captured when all their adjacent spaces (liberties) are occupied by the opponent.</li>
          <li>Groups of connected stones share liberties — a whole group is captured at once.</li>
          <li>Pass your turn when you have no good moves. Both passing ends the game.</li>
        </ul>
        <h4>Scoring</h4><p>Your stones + empty territory you surround = your score. Most points wins. Black (you) gets no komi handicap in this version.</p>
      </div>
    </div>
  </div>
);

export default function StoneWar({ gameMode, game, onBack, onExit }) {
  const exit = onBack||onExit||null;
  const isAI = gameMode!=='local';

  const [board,setBoard]=useState(empty);
  const [turn,setTurn]=useState('b'); // b=black(player), w=white
  const [passes,setPasses]=useState(0);
  const [captured,setCaptured]=useState({b:0,w:0});
  const [over,setOver]=useState(false);
  const [score,setScore]=useState(null);
  const [hoverCell,setHoverCell]=useState(null);
  const [showHelp,setShowHelp]=useState(false);
  const [aiThink,setAiThink]=useState(false);
  const [lastStone,setLastStone]=useState(null);

  const reset=()=>{ setBoard(empty()); setTurn('b'); setPasses(0); setCaptured({b:0,w:0}); setOver(false); setScore(null); setHoverCell(null); setLastStone(null); };

  const handlePlace=(r,c)=>{
    if(over||aiThink||(isAI&&turn==='w')) return;
    const result=applyMove(board,r,c,turn);
    if(!result) return;
    setBoard(result.board);
    setCaptured(prev=>({...prev,[turn===turn?'w':'b']:prev[turn==='b'?'w':'b']+result.captured}));
    setLastStone({r,c,color:turn});
    setPasses(0);
    setTurn(t=>t==='b'?'w':'b');
  };

  const handlePass=()=>{
    if(over||(isAI&&turn==='w')) return;
    const np=passes+1;
    if(np>=2) { const s=scoreBoard(board); setScore(s); setOver(true); return; }
    setPasses(np);
    setTurn(t=>t==='b'?'w':'b');
  };

  // AI turn
  useEffect(()=>{
    if(!isAI||turn!=='w'||over) return;
    setAiThink(true);
    const t=setTimeout(()=>{
      const move=aiMove(board,'w');
      if(!move) {
        const np=passes+1;
        if(np>=2){const s=scoreBoard(board);setScore(s);setOver(true);}
        else{setPasses(np);setTurn('b');}
      } else {
        const result=applyMove(board,move[0],move[1],'w');
        if(result){
          setBoard(result.board);
          setCaptured(prev=>({...prev,b:prev.b+result.captured}));
          setLastStone({r:move[0],c:move[1],color:'w'});
          setPasses(0); setTurn('b');
        }
      }
      setAiThink(false);
    },700);
    return()=>clearTimeout(t);
  },[turn,isAI,over,board,passes]);

  const cs=42; // cell size
  const pad=20;
  const sz=N*cs+pad*2;

  return(
    <div className="game-shell" style={{maxWidth:500,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🪨'} Stone War</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {over&&score&&(
        <div className="winner-banner">
          {score.b>score.w?'⚫ Black Wins!':score.w>score.b?'⚪ White Wins!':'⚖️ Draw!'}
          {' '}Black: {score.b} · White: {score.w}
        </div>
      )}
      {!over&&<div className="turn-indicator">
        {aiThink?'🤖 AI thinking…':turn==='b'?'⚫ Your turn (Black)':'⚪ White turn'}
        {' — passes: '}{passes}
      </div>}

      <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start'}}>
        {/* Board */}
        <svg width={sz} height={sz} style={{display:'block',background:'#1e1a0a',borderRadius:8,border:'2px solid #3a3010',flexShrink:0}}>
          {/* Grid lines */}
          {Array.from({length:N},(_,i)=>(
            <g key={i}>
              <line x1={pad+i*cs} y1={pad} x2={pad+i*cs} y2={pad+(N-1)*cs} stroke="rgba(255,255,255,.15)" strokeWidth={0.5}/>
              <line x1={pad} y1={pad+i*cs} x2={pad+(N-1)*cs} y2={pad+i*cs} stroke="rgba(255,255,255,.15)" strokeWidth={0.5}/>
            </g>
          ))}
          {/* Star points */}
          {[2,4,6].flatMap(r=>[2,4,6].map(c=>(
            <circle key={`${r},${c}`} cx={pad+c*cs} cy={pad+r*cs} r={3} fill="rgba(255,255,255,.3)"/>
          )))}
          {/* Hover indicator */}
          {hoverCell&&!board[hoverCell[0]][hoverCell[1]]&&!over&&!aiThink&&(!isAI||turn==='b')&&(
            <circle cx={pad+hoverCell[1]*cs} cy={pad+hoverCell[0]*cs} r={cs/2-3}
              fill={turn==='b'?'rgba(0,0,0,.4)':'rgba(255,255,255,.3)'} stroke="rgba(255,255,255,.4)" strokeWidth={1}/>
          )}
          {/* Stones */}
          {board.map((row,r)=>row.map((cell,c)=>cell&&(
            <circle key={`${r},${c}`} cx={pad+c*cs} cy={pad+r*cs} r={cs/2-3}
              fill={cell==='b'?'#1a1a1a':'#f0f0f0'}
              stroke={cell==='b'?'rgba(255,255,255,.2)':'rgba(0,0,0,.3)'} strokeWidth={1.5}
              opacity={lastStone?.r===r&&lastStone?.c===c?1:0.9}
            />
          )))}
          {/* Last move marker */}
          {lastStone&&(
            <circle cx={pad+lastStone.c*cs} cy={pad+lastStone.r*cs} r={4}
              fill={lastStone.color==='b'?'rgba(255,255,255,.8)':'rgba(0,0,0,.6)'}/>
          )}
          {/* Click areas */}
          {Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>(
            <rect key={`${r},${c}`} x={pad+c*cs-cs/2} y={pad+r*cs-cs/2} width={cs} height={cs}
              fill="transparent" style={{cursor:'pointer'}}
              onClick={()=>handlePlace(r,c)}
              onMouseEnter={()=>setHoverCell([r,c])}
              onMouseLeave={()=>setHoverCell(null)}/>
          )))}
        </svg>

        {/* Info panel */}
        <div style={{display:'flex',flexDirection:'column',gap:10,minWidth:140}}>
          <div className="bv-card" style={{padding:10}}>
            {[{col:'b',name:'Black',isAI:false},{col:'w',name:'White',isAI:isAI}].map(({col,name,isAI:ai})=>(
              <div key={col} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,opacity:turn===col&&!over?1:0.6}}>
                <div style={{width:14,height:14,borderRadius:'50%',background:col==='b'?'#1a1a1a':'#f0f0f0',border:col==='b'?'1px solid #444':'1px solid #aaa'}}/>
                <span style={{fontSize:12,color:'#e0e0e0',flex:1}}>{ai?'🤖 AI':name}</span>
                <span style={{fontSize:11,color:'#888'}}>Cap:{captured[col==='b'?'w':'b']}</span>
              </div>
            ))}
          </div>
          {!over&&(!isAI||turn==='b')&&(
            <button className="bv-button secondary" onClick={handlePass}>Pass Turn</button>
          )}
          {over&&score&&(
            <div className="bv-card" style={{padding:10,textAlign:'center'}}>
              <div style={{fontSize:11,color:'#888',marginBottom:4}}>Final Score</div>
              <div style={{color:'#333',fontSize:13}}>⚫ {score.b}</div>
              <div style={{color:'#e0e0e0',fontSize:13}}>⚪ {score.w}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
