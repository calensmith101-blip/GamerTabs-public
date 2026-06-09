import React, { useState, useEffect, useCallback } from 'react';
import { useOnlineGame } from '../../hooks/useOnlineGame';

const ROWS=6,COLS=7,EMPTY=0,P1=1,P2=2;
const mkBoard=()=>Array(ROWS).fill(null).map(()=>Array(COLS).fill(EMPTY));

function checkWin(board){
  const segs=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<=COLS-4;c++) segs.push([[r,c],[r,c+1],[r,c+2],[r,c+3]]);
  for(let r=0;r<=ROWS-4;r++) for(let c=0;c<COLS;c++) segs.push([[r,c],[r+1,c],[r+2,c],[r+3,c]]);
  for(let r=0;r<=ROWS-4;r++) for(let c=0;c<=COLS-4;c++) segs.push([[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]]);
  for(let r=0;r<=ROWS-4;r++) for(let c=3;c<COLS;c++) segs.push([[r,c],[r+1,c-1],[r+2,c-2],[r+3,c-3]]);
  for(const cells of segs){
    const v=board[cells[0][0]][cells[0][1]];
    if(v!==EMPTY&&cells.every(([r,c])=>board[r][c]===v)) return{winner:v,cells};
  }
  return null;
}
const isDraw=b=>b[0].every(c=>c!==EMPTY);
const validCols=b=>Array.from({length:COLS},(_,i)=>i).filter(c=>b[0][c]===EMPTY);
function drop(board,col,p){
  const nb=board.map(r=>[...r]);
  for(let r=ROWS-1;r>=0;r--){if(nb[r][col]===EMPTY){nb[r][col]=p;break;}}
  return nb;
}
function aiMove(board){
  const v=validCols(board);
  for(const c of v){if(checkWin(drop(board,c,P2)))return c;}
  for(const c of v){if(checkWin(drop(board,c,P1)))return c;}
  for(const c of[3,2,4,1,5,0,6])if(v.includes(c))return c;
  return v[0]??null;
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Drop Lock</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4>
        <p>Connect 4 of your discs in a row — horizontal, vertical, or diagonal — before your opponent does.</p>
        <h4>Your Turn</h4>
        <ul>
          <li>Click any column to drop your disc.</li>
          <li>Discs fall to the lowest empty slot.</li>
          <li>Players alternate turns.</li>
        </ul>
        <h4>Winning</h4>
        <ul>
          <li>4 in a row = win. Winning cells light up.</li>
          <li>Board full with no winner = draw.</li>
        </ul>
        <h4>AI Mode</h4>
        <p>The AI blocks your wins and tries to win. It prefers the centre columns.</p>
      </div>
    </div>
  </div>
);

export default function ConnectFour(props){
  const {onBack,onExit,gameMode,game,roomCode,playerRole='X'}=props||{};
  const exit=onBack||onExit||null;
  const isAI=gameMode==='ai'||gameMode==='computer';
  const isOnline=(gameMode==='online'||gameMode==='localLive') && !!roomCode;
  const onlineInitial={ board: mkBoard(), turn: P1, result: null };
  const onlineGame=useOnlineGame(isOnline ? roomCode : null, onlineInitial);

  const [boardLocal,setBoardLocal]=useState(mkBoard);
  const [turnLocal,setTurnLocal]=useState(P1);
  const [resultLocal,setResultLocal]=useState(null);
  const ogs=onlineGame.gameState || onlineInitial;
  const board=isOnline ? (ogs.board || mkBoard()) : boardLocal;
  const turn=isOnline ? (ogs.turn || P1) : turnLocal;
  const result=isOnline ? (ogs.result || null) : resultLocal;
  const myPiece=playerRole==='O'?P2:P1;
  const setOnlineState=(next)=>onlineGame.updateState(next);
  const setBoard=(nextBoard)=>{ if(isOnline) setOnlineState({ ...ogs, board: nextBoard }); else setBoardLocal(nextBoard); };
  const setTurn=(nextTurn)=>{ if(isOnline) setOnlineState({ ...ogs, turn: nextTurn }); else setTurnLocal(nextTurn); };
  const setResult=(nextResult)=>{ if(isOnline) setOnlineState({ ...ogs, result: nextResult }); else setResultLocal(nextResult); };
  const [hover,setHover]=useState(null);
  const [busy,setBusy]=useState(false);
  const [showHelp,setShowHelp]=useState(false);

  const reset=()=>{
    const next={ board: mkBoard(), turn: P1, result: null }
    if(isOnline) onlineGame.updateState(next)
    else { setBoardLocal(next.board); setTurnLocal(next.turn); setResultLocal(next.result) }
    setBusy(false)
  };

  const doMove=useCallback((col)=>{
    if(result||busy)return;
    if(isOnline && turn!==myPiece)return;
    if(isAI&&turn===P2)return;
    if(!validCols(board).includes(col))return;
    const nb=drop(board,col,turn);
    const win=checkWin(nb);
    const next={ board: nb, turn: turn===P1?P2:P1, result: null };
    if(win) next.result=win;
    else if(isDraw(nb)) next.result='draw';
    if(isOnline) onlineGame.updateState(next);
    else { setBoardLocal(next.board); setTurnLocal(next.turn); setResultLocal(next.result); }
  },[board,turn,result,busy,isAI,isOnline,myPiece,ogs,onlineGame]);

  useEffect(()=>{
    if(!isAI||turn!==P2||result)return;
    setBusy(true);
    const t=setTimeout(()=>{
      const col=aiMove(board);
      if(col!==null){
        const nb=drop(board,col,P2);
        const win=checkWin(nb);
        setBoard(nb);
        if(win){setResult(win);setBusy(false);return;}
        if(isDraw(nb)){setResult('draw');setBusy(false);return;}
        setTurn(P1);
      }
      setBusy(false);
    },400);
    return()=>clearTimeout(t);
  },[isAI,turn,board,result]);

  const winCells=result&&result!=='draw'?result.cells:[];
  const isW=(r,c)=>winCells.some(([wr,wc])=>wr===r&&wc===c);

  return(
    <div className="game-shell" style={{maxWidth:480,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🔴'} Drop Lock</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {isOnline&&<div className="bv-notice">Online mode — Room {roomCode}. You are Player {myPiece===P1?'1 red':'2 yellow'}.</div>}

      {result
        ?<div className="winner-banner">
          {result==='draw'?'⚖️ Draw!':result.winner===P1?'🔴 Player 1 Wins!':isAI?'🤖 AI Wins!':'🟡 Player 2 Wins!'}
        </div>
        :<div className="turn-indicator">
          {busy?'🤖 AI thinking…':isOnline&&turn!==myPiece?`Waiting for Player ${turn===P1?'1':'2'}…`:turn===P1?'🔴 Player 1 — choose a column':isAI?'🤖 AI turn':'🟡 Player 2 — choose a column'}
        </div>
      }

      <div className="game-board connect-four-board" style={{flexDirection:'column',alignItems:'center'}}>
        {/* Drop arrows */}
        <div style={{display:'flex',gap:4,marginBottom:2}}>
          {Array.from({length:COLS},(_,c)=>(
            <div key={c} style={{width:50,height:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}
              onMouseEnter={()=>!result&&setHover(c)}
              onMouseLeave={()=>setHover(null)}
              onClick={()=>doMove(c)}>
              {hover===c&&!result&&<span style={{color:turn===P1?'#c0392b':'#e8b800',fontSize:13,lineHeight:1}}>▼</span>}
            </div>
          ))}
        </div>
        {/* Board */}
        <div style={{background:'#0d0d1a',borderRadius:12,padding:8,border:'2px solid #2a2a4a',boxShadow:'0 0 24px rgba(232,184,0,.08)'}}>
          {board.map((row,r)=>(
            <div key={r} style={{display:'flex',gap:4,marginBottom:4}}>
              {row.map((cell,c)=>(
                <div key={c}
                  onClick={()=>doMove(c)}
                  onMouseEnter={()=>!result&&setHover(c)}
                  onMouseLeave={()=>setHover(null)}
                  style={{
                    width:50,height:50,borderRadius:'50%',cursor:!result?'pointer':'default',
                    background:cell===P1?'#c0392b':cell===P2?'#e8b800':'rgba(255,255,255,.04)',
                    border:isW(r,c)?'3px solid #fff':'2px solid rgba(255,255,255,.07)',
                    boxShadow:isW(r,c)?'0 0 14px #fff':cell?'inset 0 -3px 6px rgba(0,0,0,.5)':'none',
                    transition:'background .1s',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:10,fontSize:13}}>
        <span style={{color:'#c0392b'}}>🔴 Player 1</span>
        <span style={{color:'#555'}}>vs</span>
        <span style={{color:'#e8b800'}}>{isAI?'🤖 Vault AI':'🟡 Player 2'}</span>
      </div>
    </div>
  );
}
