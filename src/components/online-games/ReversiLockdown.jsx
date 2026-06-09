// ══════════════════════════════════════════════════════════════
// FILE: ReversiLockdown.jsx  — Reversi/Othello, improved version
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';

const DIRS=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
function initBoard(){const b=Array(8).fill(null).map(()=>Array(8).fill(null));b[3][3]='w';b[3][4]='b';b[4][3]='b';b[4][4]='w';return b;}
function getFlips(board,r,c,col){const op=col==='b'?'w':'b',flips=[];for(const[dr,dc]of DIRS){const line=[];let nr=r+dr,nc=c+dc;while(nr>=0&&nr<8&&nc>=0&&nc<8&&board[nr][nc]===op){line.push([nr,nc]);nr+=dr;nc+=dc;}if(line.length>0&&nr>=0&&nr<8&&nc>=0&&nc<8&&board[nr][nc]===col)flips.push(...line);}return flips;}
function getValid(board,col){const moves=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(!board[r][c]&&getFlips(board,r,c,col).length>0)moves.push([r,c]);return moves;}
function apply(board,r,c,col){const nb=board.map(row=>[...row]);nb[r][c]=col;getFlips(nb,r,c,col).forEach(([fr,fc])=>nb[fr][fc]=col);return nb;}
function count(board){let b=0,w=0;board.flat().forEach(c=>{if(c==='b')b++;if(c==='w')w++;});return{b,w};}
function aiPick(board,col){const moves=getValid(board,col);if(!moves.length)return null;const corners=moves.filter(([r,c])=>(r===0||r===7)&&(c===0||c===7));if(corners.length)return corners[0];const safe=moves.filter(([r,c])=>r>1&&r<6&&c>1&&c<6);if(safe.length)return safe[Math.floor(Math.random()*safe.length)];return moves[Math.floor(Math.random()*moves.length)];}

export function ReversiLockdown({gameMode,game,onBack,onExit}){
  const exit=onBack||onExit||null;
  const isAI=gameMode!=='local';
  const playerCol='b';
  const [board,setBoard]=useState(initBoard);
  const [turn,setTurn]=useState('b');
  const [thinking,setThinking]=useState(false);
  const [lastFlipped,setLastFlipped]=useState([]);
  const [showHelp,setShowHelp]=useState(false);

  const valid=getValid(board,turn);
  const {b,w}=count(board);
  const totalEmpty=board.flat().filter(c=>!c).length;
  const gameOver=getValid(board,'b').length===0&&getValid(board,'w').length===0;
  const winner=gameOver?(b>w?'Black':w>b?'White':'Draw'):null;

  const handleClick=useCallback((r,c)=>{
    if(thinking||gameOver||!valid.some(([vr,vc])=>vr===r&&vc===c)) return;
    if(isAI&&turn!==playerCol) return;
    const flips=getFlips(board,r,c,turn);
    const nb=apply(board,r,c,turn);
    setBoard(nb);setLastFlipped(flips.map(([fr,fc])=>`${fr},${fc}`));
    const next=turn==='b'?'w':'b';
    const nextValid=getValid(nb,next);
    if(!nextValid.length){const nn=turn;setTurn(nn);}else setTurn(next);
  },[board,turn,valid,thinking,gameOver,isAI,playerCol]);

  useEffect(()=>{
    if(!isAI||turn!==('b'===playerCol?'w':'b')||gameOver) return;
    setThinking(true);
    const t=setTimeout(()=>{
      const move=aiPick(board,turn);
      if(move){
        const flips=getFlips(board,move[0],move[1],turn);
        const nb=apply(board,move[0],move[1],turn);
        setBoard(nb);setLastFlipped(flips.map(([fr,fc])=>`${fr},${fc}`));
        const next=turn==='b'?'w':'b';
        const nv=getValid(nb,next);
        if(!nv.length){setTurn(turn);}else setTurn(next);
      } else {setTurn(t=>t==='b'?'w':'b');}
      setThinking(false);
    },650);
    return()=>clearTimeout(t);
  },[turn,isAI,board,gameOver,playerCol]);

  const reset=()=>{setBoard(initBoard());setTurn('b');setThinking(false);setLastFlipped([]);};

  return(
    <div className="game-shell" style={{maxWidth:440,margin:'0 auto'}}>
      {showHelp&&(
        <div className="htp-overlay" onClick={()=>setShowHelp(false)}>
          <div className="htp-box" onClick={e=>e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Reversi Lockdown</p><button className="bv-button secondary" onClick={()=>setShowHelp(false)}>✕</button></div>
            <div className="htp-body"><h4>Objective</h4><p>Have the most discs when the board is full.</p><h4>Rules</h4><ul><li>You play Black (⬛).</li><li>Place a disc to "sandwich" one or more opponent discs between your new disc and another of yours — captured discs flip to your colour.</li><li>You must make a valid move or pass. No moves left = game over.</li></ul></div>
          </div>
        </div>
      )}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'⚫'} Reversi Lockdown</h2>
        <div style={{display:'flex',gap:6}}><button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button><button className="bv-button" onClick={reset}>New</button>{exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}</div>
      </div>
      {winner&&<div className="winner-banner">{winner==='Draw'?'⚖️ Draw!':winner==='Black'?isAI?'Black Wins':'🏆 You Win!':'🤖 AI Wins (White)!'}</div>}
      {!gameOver&&<div className="turn-indicator">{thinking?'🤖 AI thinking…':turn==='b'?'⬛ Your turn':'⬜ White'}</div>}
      <div style={{display:'flex',gap:14,justifyContent:'center',alignItems:'flex-start'}}>
        <div style={{background:'#0a1a0a',borderRadius:8,padding:8,border:'2px solid #1a3a1a'}}>
          {board.map((row,r)=>(
            <div key={r} style={{display:'flex',gap:2,marginBottom:2}}>
              {row.map((cell,c)=>{
                const isV=!gameOver&&valid.some(([vr,vc])=>vr===r&&vc===c);
                const wasF=lastFlipped.includes(`${r},${c}`);
                return(
                  <div key={c} onClick={()=>handleClick(r,c)} style={{width:48,height:48,borderRadius:4,background:'#0d1f0d',border:'1px solid #1a3a1a',display:'flex',alignItems:'center',justifyContent:'center',cursor:isV&&!gameOver?'pointer':'default',position:'relative'}}>
                    {cell&&<div style={{width:36,height:36,borderRadius:'50%',background:cell==='b'?'#111':'#f0f0f0',border:cell==='b'?'2px solid #444':'2px solid #bbb',boxShadow:wasF?`0 0 10px ${cell==='b'?'rgba(100,100,255,.8)':'rgba(255,255,100,.8)'}`:undefined,transition:'box-shadow .3s'}}/>}
                    {isV&&!cell&&<div style={{width:14,height:14,borderRadius:'50%',background:'rgba(100,200,100,.35)',border:'1px solid rgba(100,200,100,.5)'}}/>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10,minWidth:100}}>
          {[{col:'b',label:isAI?'You':'Black',val:b},{col:'w',label:isAI?'🤖 AI':'White',val:w}].map(({col,label,val})=>(
            <div key={col} className="bv-card" style={{padding:10,textAlign:'center',opacity:turn===col&&!gameOver?1:0.6}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:col==='b'?'#111':'#f0f0f0',border:col==='b'?'2px solid #444':'2px solid #aaa',margin:'0 auto 4px'}}/>
              <div style={{fontSize:22,fontWeight:'bold',color:'#e8b800'}}>{val}</div>
              <div style={{fontSize:10,color:'#888'}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ReversiLockdown;
