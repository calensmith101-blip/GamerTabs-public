import React, { useState, useEffect, useCallback } from 'react';

// Player = 'r' (red, rows 5-7, moves toward row 0)
// AI/P2  = 'b' (black, rows 0-2, moves toward row 7)

function initBoard(){
  const b=Array(8).fill(null).map(()=>Array(8).fill(null));
  for(let r=0;r<3;r++) for(let c=0;c<8;c++) if((r+c)%2===1) b[r][c]={col:'b',king:false};
  for(let r=5;r<8;r++) for(let c=0;c<8;c++) if((r+c)%2===1) b[r][c]={col:'r',king:false};
  return b;
}

function caps(board,r,c){
  const p=board[r][c];if(!p)return[];
  const op=p.col==='r'?'b':'r';
  const dirs=p.king?[[-1,-1],[-1,1],[1,-1],[1,1]]:p.col==='r'?[[-1,-1],[-1,1]]:[[1,-1],[1,1]];
  const result=[];
  for(const[dr,dc]of dirs){
    const mr=r+dr,mc=c+dc,lr=r+2*dr,lc=c+2*dc;
    if(mr>=0&&mr<8&&mc>=0&&mc<8&&lr>=0&&lr<8&&lc>=0&&lc<8)
      if(board[mr][mc]?.col===op&&!board[lr][lc])result.push({to:[lr,lc],cap:[mr,mc]});
  }
  return result;
}

function moves(board,r,c){
  const p=board[r][c];if(!p)return[];
  const dirs=p.king?[[-1,-1],[-1,1],[1,-1],[1,1]]:p.col==='r'?[[-1,-1],[-1,1]]:[[1,-1],[1,1]];
  return dirs.map(([dr,dc])=>[r+dr,c+dc]).filter(([nr,nc])=>nr>=0&&nr<8&&nc>=0&&nc<8&&!board[nr][nc]).map(([nr,nc])=>({to:[nr,nc],cap:null}));
}

function allCaps(board,col){
  const all=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++)
    if(board[r][c]?.col===col) caps(board,r,c).forEach(m=>all.push({from:[r,c],...m}));
  return all;
}

function allMoves(board,col){
  const ac=allCaps(board,col);if(ac.length)return ac;
  const all=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++)
    if(board[r][c]?.col===col) moves(board,r,c).forEach(m=>all.push({from:[r,c],...m}));
  return all;
}

function applyMove(board,from,to,cap){
  const nb=board.map(r=>r.map(c=>c?{...c}:null));
  const p={...nb[from[0]][from[1]]};
  nb[to[0]][to[1]]=p; nb[from[0]][from[1]]=null;
  if(cap)nb[cap[0]][cap[1]]=null;
  if(p.col==='r'&&to[0]===0)nb[to[0]][to[1]].king=true;
  if(p.col==='b'&&to[0]===7)nb[to[0]][to[1]].king=true;
  return nb;
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">How to Play — Shadow Draughts</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Capture all opponent pieces, or leave them with no moves.</p>
        <h4>Movement</h4>
        <ul>
          <li>Pieces move diagonally on dark squares only.</li>
          <li>Regular pieces move forward. <b>Kings (♛)</b> move any diagonal direction.</li>
          <li>Reach the back row to become a King.</li>
        </ul>
        <h4>Captures</h4>
        <ul>
          <li>Jump over an adjacent enemy to capture. Landing square must be empty.</li>
          <li>Captures are <b>forced</b> — if you can capture, you must.</li>
          <li>Multi-jump: if you can capture again after landing, you must continue.</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function Checkers(props){
  const{onBack,onExit,gameMode,game}=props||{};
  const exit=onBack||onExit||null;
  const isAI=gameMode==='ai'||gameMode==='computer';

  const[board,setBoard]=useState(initBoard);
  const[turn,setTurn]=useState('r');
  const[sel,setSel]=useState(null);
  const[legal,setLegal]=useState([]);
  const[mj,setMj]=useState(null);
  const[winner,setWinner]=useState(null);
  const[thinking,setThinking]=useState(false);
  const[cnt,setCnt]=useState({r:12,b:12});
  const[showHelp,setShowHelp]=useState(false);

  const reset=()=>{setBoard(initBoard());setTurn('r');setSel(null);setLegal([]);setMj(null);setWinner(null);setThinking(false);setCnt({r:12,b:12});};

  const countPieces=nb=>{let r=0,b=0;nb.flat().forEach(c=>{if(c?.col==='r')r++;if(c?.col==='b')b++;});setCnt({r,b});};

  const checkWin=useCallback((nb,col)=>{
    const op=col==='r'?'b':'r';
    if(allMoves(nb,op).length===0){setWinner(col);return true;}
    return false;
  },[]);

  const handleSq=useCallback((r,c)=>{
    if(winner||thinking)return;
    if(isAI&&turn==='b')return;
    const p=board[r][c];

    if(sel){
      const mv=legal.find(m=>m.to[0]===r&&m.to[1]===c);
      if(mv){
        const nb=applyMove(board,sel,mv.to,mv.cap);
        countPieces(nb);
        if(checkWin(nb,turn)){setBoard(nb);setSel(null);setLegal([]);setMj(null);return;}
        if(mv.cap){
          const fc=caps(nb,mv.to[0],mv.to[1]);
          if(fc.length){setBoard(nb);setSel(mv.to);setLegal(fc);setMj(mv.to);return;}
        }
        setBoard(nb);setSel(null);setLegal([]);setMj(null);setTurn(turn==='r'?'b':'r');
        return;
      }
      if(p?.col===turn&&!mj){
        const ac=allCaps(board,turn);
        if(ac.length){const mc=ac.filter(m=>m.from[0]===r&&m.from[1]===c);if(mc.length){setSel([r,c]);setLegal(mc);return;}}
        else{setSel([r,c]);setLegal(moves(board,r,c));}
        return;
      }
      setSel(null);setLegal([]);
      return;
    }

    if(p?.col!==turn)return;
    const ac=allCaps(board,turn);
    if(ac.length){const mc=ac.filter(m=>m.from[0]===r&&m.from[1]===c);if(mc.length){setSel([r,c]);setLegal(mc);}return;}
    const mv=moves(board,r,c);if(mv.length){setSel([r,c]);setLegal(mv);}
  },[board,turn,sel,legal,mj,winner,thinking,isAI,checkWin]);

  useEffect(()=>{
    if(!isAI||turn!=='b'||winner)return;
    setThinking(true);
    const t=setTimeout(()=>{
      const mv=allMoves(board,'b');
      if(!mv.length){setWinner('r');setThinking(false);return;}
      const pick=mv[Math.floor(Math.random()*mv.length)];
      const nb=applyMove(board,pick.from,pick.to,pick.cap);
      countPieces(nb);
      if(!checkWin(nb,'b'))setTurn('r');
      setBoard(nb);setThinking(false);
    },500);
    return()=>clearTimeout(t);
  },[turn,isAI,board,winner,checkWin]);

  const CS=50;

  return(
    <div className="game-shell" style={{maxWidth:480,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'⬛'} Shadow Draughts</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {winner&&<div className="winner-banner">{winner==='r'?'🏆 Red Wins!':isAI?'🤖 AI (Black) Wins!':'⬛ Black Wins!'}</div>}
      {!winner&&(
        <div className="turn-indicator">
          {thinking?'🤖 AI thinking…':turn==='r'?'🔴 Red\'s turn':`${isAI?'🤖 AI':'⬛ Black'}'s turn`}
          {allCaps(board,turn).length>0&&!thinking&&<span style={{color:'#f44',marginLeft:6}}>— Must capture!</span>}
        </div>
      )}

      <div style={{display:'flex',gap:14,alignItems:'flex-start',justifyContent:'center',flexWrap:'wrap',marginTop:8}}>
        <div style={{background:'#0a0a0f',border:'2px solid #2a2a3a',borderRadius:8,overflow:'hidden'}} className="checkers-grid">
          {board.map((row,r)=>(
            <div key={r} style={{display:'flex'}}>
              {row.map((cell,c)=>{
                const dark=(r+c)%2===1;
                const isSel=sel&&sel[0]===r&&sel[1]===c;
                const isDest=legal.some(m=>m.to[0]===r&&m.to[1]===c);
                return(
                  <div key={c} onClick={()=>dark&&handleSq(r,c)} style={{
                    width:CS,height:CS,
                    background:isSel?'#4a4a10':dark?'#2d2d2d':'#999',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    cursor:dark&&!winner?'pointer':'default',position:'relative',
                  }}>
                    {isDest&&<div style={{position:'absolute',inset:0,background:'rgba(232,184,0,.22)',border:'2px solid rgba(232,184,0,.5)'}}/>}
                    {cell&&(
                      <div style={{
                        width:42,height:42,borderRadius:'50%',zIndex:1,
                        background:cell.col==='r'?'#c0392b':'#222',
                        border:cell.col==='r'?'2px solid #e74c3c':'2px solid #666',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:isSel?`0 0 10px ${cell.col==='r'?'#e74c3c':'#aaa'}`:'none',
                      }}>
                        {cell.king&&<span style={{color:'#e8b800',fontSize:18,lineHeight:1}}>♛</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bv-card" style={{padding:12,minWidth:110}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:14,height:14,borderRadius:'50%',background:'#c0392b'}}/>
            <span style={{fontSize:13,color:'#e0e0e0'}}>Red: {cnt.r}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:14,height:14,borderRadius:'50%',background:'#222',border:'1px solid #666'}}/>
            <span style={{fontSize:13,color:'#e0e0e0'}}>{isAI?'AI':'Black'}: {cnt.b}</span>
          </div>
          <div style={{fontSize:10,color:'#555',marginTop:4}}>♛ = King</div>
          <div style={{fontSize:10,color:'#555',marginTop:2}}>Captures forced</div>
        </div>
      </div>
    </div>
  );
}
