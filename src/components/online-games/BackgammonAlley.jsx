import React, { useState, useEffect } from 'react';

/* Backgammon
 * Board: 24 points. Player = white (W), moves 24→1. AI = black (B), moves 1→24.
 * Home boards: W=1-6, B=19-24. Bear off when all checkers in home board.
 * Hit: land on single opponent = send to bar.
 * Must enter bar before other moves.
 */

const INIT_POINTS = () => {
  const p = Array(26).fill(null).map(() => ({ checkers:[], count:0 }));
  // Point 0 = W bar, Point 25 = B bar
  // Standard starting position
  [
    {pt:1,  col:'W', n:2},
    {pt:6,  col:'B', n:5},
    {pt:8,  col:'B', n:3},
    {pt:12, col:'W', n:5},
    {pt:13, col:'B', n:5},
    {pt:17, col:'W', n:3},
    {pt:19, col:'W', n:5},
    {pt:24, col:'B', n:2},
  ].forEach(({pt,col,n})=>{ p[pt].checkers=Array(n).fill(col); p[pt].count=n; });
  return p;
};

function roll(){ return 1+Math.floor(Math.random()*6); }

function isHome(pt, col){
  return col==='W'?(pt>=1&&pt<=6):(pt>=19&&pt<=24);
}

function allInHome(points, col){
  const bar = col==='W'?0:25;
  if(points[bar].count>0) return false;
  for(let i=1;i<=24;i++){
    if(points[i].checkers[0]===col){
      if(!isHome(i,col)) return false;
    }
  }
  return true;
}

function getLegalMoves(points, col, dice){
  const bar = col==='W'?0:25;
  const moves=[];
  const used=new Set();

  const check=(from,die)=>{
    const to = col==='W'?from-die:from+die;
    if(to<0||to>25) return;
    const dest=points[to];
    const opp=col==='W'?'B':'W';
    // Bear off
    if(col==='W'&&to===0&&allInHome(points,col)){
      if(from===die||(die>from&&Array.from({length:6},(_,i)=>i+1).every(p=>!points[p].checkers.some(c=>c==='W'&&p<from)))) moves.push({from,to:0,die});
      return;
    }
    if(col==='B'&&to===25&&allInHome(points,col)){
      moves.push({from,to:25,die}); return;
    }
    if(to<1||to>24) return;
    if(dest.count>1&&dest.checkers[0]===opp) return; // blocked
    moves.push({from,to,die});
  };

  if(points[bar].count>0){
    for(const d of dice){
      const to=col==='W'?25-d:d;
      if(to>=1&&to<=24){
        const dest=points[to];
        const opp=col==='W'?'B':'W';
        if(dest.count<=1||dest.checkers[0]===col) moves.push({from:bar,to,die:d});
      }
    }
  } else {
    for(let i=1;i<=24;i++){
      if(points[i].checkers[0]===col&&points[i].count>0){
        for(const d of dice) check(i,d);
      }
    }
  }
  return moves;
}

function applyMove(points, from, to, col){
  const np=points.map(p=>({...p, checkers:[...p.checkers]}));
  const opp=col==='W'?'B':'W';
  const oppBar=opp==='W'?0:25;
  // Remove from source
  const fi=np[from].checkers.lastIndexOf(col);
  if(fi>=0) np[from].checkers.splice(fi,1);
  np[from].count=np[from].checkers.length;
  // Hit?
  if(to>0&&to<25&&np[to].count===1&&np[to].checkers[0]===opp){
    np[oppBar].checkers.push(opp); np[oppBar].count++;
    np[to].checkers=[];
  }
  if(to>0&&to<25){ np[to].checkers.push(col); np[to].count++; }
  return np;
}

function checkWin(points,col){
  const home=col==='W'?(pt=>pt>=1&&pt<=6):(pt=>pt>=19&&pt<=24);
  for(let i=1;i<=24;i++) if(points[i].checkers.some(c=>c===col)) return false;
  const bar=col==='W'?0:25;
  if(points[bar].count>0) return false;
  return true;
}

// Simple AI: pick move that hits opponent, then blocks, then advances
function aiBestMove(points, dice){
  const moves=getLegalMoves(points,'B',dice);
  if(!moves.length) return null;
  const opp='W';
  // Prefer hits
  const hits=moves.filter(m=>m.to>0&&m.to<25&&points[m.to].count===1&&points[m.to].checkers[0]===opp);
  if(hits.length) return hits[0];
  // Prefer building (stacking)
  const stack=moves.filter(m=>m.to>0&&m.to<25&&points[m.to].checkers[0]==='B'&&points[m.to].count>0);
  if(stack.length) return stack[0];
  return moves[Math.floor(Math.random()*moves.length)];
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Backgammon Alley</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Bear all 15 of your checkers off the board before your opponent.</p>
        <h4>Movement</h4><ul>
          <li>You are White — move from point 24 toward point 1.</li>
          <li>Roll dice, then click a point with your checker, then click destination.</li>
          <li>Each die can move one checker.</li>
          <li>Landing on a single opponent checker hits it — it goes to the bar.</li>
          <li>A point with 2+ same-colour checkers is blocked to the opponent.</li>
          <li>Bar checkers must re-enter first (points 19-24 for you).</li>
        </ul>
        <h4>Bearing Off</h4><p>When all your checkers are in your home board (points 1-6), you can bear them off. First to bear all off wins!</p>
      </div>
    </div>
  </div>
);

export default function BackgammonAlley({game,gameMode,onBack,onExit}){
  const exit=onBack||onExit||null;
  const isAI=gameMode!=='local';

  const [points,setPoints]=useState(INIT_POINTS);
  const [turn,setTurn]=useState('W');
  const [dice,setDice]=useState([]);
  const [diceUsed,setDiceUsed]=useState([]);
  const [selected,setSelected]=useState(null);
  const [phase,setPhase]=useState('roll'); // roll|move|ai
  const [winner,setWinner]=useState(null);
  const [log,setLog]=useState(['Game start. White moves 24→1']);
  const [showHelp,setShowHelp]=useState(false);
  const [aiThink,setAiThink]=useState(false);

  const addLog=m=>setLog(prev=>[m,...prev].slice(0,12));
  const reset=()=>{setPoints(INIT_POINTS());setTurn('W');setDice([]);setDiceUsed([]);setSelected(null);setPhase('roll');setWinner(null);setLog(['Game start. White moves 24→1']);};

  const rollDice=()=>{
    if(phase!=='roll'||winner) return;
    const d1=roll(),d2=roll();
    const d=d1===d2?[d1,d2,d1,d2]:[d1,d2];
    setDice(d); setDiceUsed(Array(d.length).fill(false)); setPhase('move');
    addLog(`${turn==='W'?'You':'AI'} rolled ${d.join(', ')}`);
  };

  const remainingDice=dice.filter((_,i)=>!diceUsed[i]);

  const endTurn=()=>{
    const next=turn==='W'?'B':'W';
    setTurn(next); setDice([]); setDiceUsed([]); setSelected(null);
    setPhase(next==='B'&&isAI?'ai':'roll');
    addLog(`Turn passed to ${next==='W'?'You':'AI'}`);
  };

  const handlePointClick=(ptIdx)=>{
    if(phase!=='move'||winner) return;
    const pt=points[ptIdx];
    const validMoves=getLegalMoves(points,turn,remainingDice);

    if(selected===null){
      if(pt.checkers.some(c=>c===turn)) setSelected(ptIdx);
    } else {
      const move=validMoves.find(m=>m.from===selected&&m.to===ptIdx);
      if(move){
        const np=applyMove(points,selected,ptIdx,turn);
        const dIdx=dice.findIndex((d,i)=>!diceUsed[i]&&d===move.die);
        const nd=[...diceUsed]; nd[dIdx]=true;
        setPoints(np); setDiceUsed(nd); setSelected(null);
        if(checkWin(np,turn)){setWinner(turn);addLog(`${turn==='W'?'You':'AI'} wins!`);setPhase('roll');return;}
        const newRemaining=dice.filter((_,i)=>!nd[i]);
        if(!newRemaining.length){endTurn();}
        else{
          const nl=getLegalMoves(np,turn,newRemaining);
          if(!nl.length){addLog('No more moves!');endTurn();}
        }
      } else if(pt.checkers.some(c=>c===turn)){
        setSelected(ptIdx);
      } else {
        setSelected(null);
      }
    }
  };

  // AI turn
  useEffect(()=>{
    if(!isAI||phase!=='ai'||winner||aiThink) return;
    setAiThink(true);
    const t=setTimeout(()=>{
      const d1=roll(),d2=roll();
      const d=d1===d2?[d1,d2,d1,d2]:[d1,d2];
      addLog(`AI rolled ${d.join(', ')}`);
      let pts=[...points.map(p=>({...p,checkers:[...p.checkers]}))];
      let remaining=[...d];
      for(let iter=0;iter<d.length;iter++){
        const move=aiBestMove(pts,remaining);
        if(!move) break;
        pts=applyMove(pts,move.from,move.to,'B');
        remaining.splice(remaining.indexOf(move.die),1);
        if(checkWin(pts,'B')){setPoints(pts);setWinner('B');addLog('AI wins!');setAiThink(false);setPhase('roll');return;}
      }
      setPoints(pts);
      setTurn('W');setPhase('roll');setDice([]);setDiceUsed([]);setAiThink(false);
    },900);
    return()=>{clearTimeout(t);setAiThink(false);};
  },[phase,isAI,winner]);

  const validMoves=phase==='move'&&selected!==null?getLegalMoves(points,turn,remainingDice).filter(m=>m.from===selected).map(m=>m.to):[];

  // Render a single point
  const renderPoint=(ptIdx,isBottom)=>{
    const pt=points[ptIdx];
    const isSel=selected===ptIdx;
    const isValid=validMoves.includes(ptIdx);
    const col=pt.checkers[0];
    const ptColor=ptIdx%2===0?'rgba(139,0,0,.5)':'rgba(200,160,0,.3)';
    return(
      <div key={ptIdx} onClick={()=>handlePointClick(ptIdx)} style={{
        width:44,display:'flex',flexDirection:isBottom?'column-reverse':'column',
        alignItems:'center',position:'relative',cursor:'pointer',
        background:isValid?'rgba(76,175,80,.2)':isSel?'rgba(232,184,0,.15)':'transparent',
        border:isValid?'1px solid rgba(76,175,80,.5)':isSel?'1px solid rgba(232,184,0,.4)':'1px solid transparent',
        borderRadius:4, minHeight:100, padding:2,
      }}>
        {/* Point spike */}
        <div style={{position:'absolute',[isBottom?'top':'bottom']:0,left:0,right:0,height:90,
          background:ptColor,clipPath:isBottom?'polygon(0 0,100% 0,50% 100%)':'polygon(50% 0,0 100%,100% 100%)',
          zIndex:0,
        }}/>
        {/* Checkers */}
        {Array.from({length:Math.min(pt.count,5)}).map((_,i)=>(
          <div key={i} style={{
            width:34,height:34,borderRadius:'50%',
            background:col==='W'?'#f0f0f0':'#1a1a2e',
            border:col==='W'?'2px solid #ccc':'2px solid #555',
            zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:9,color:col==='W'?'#888':'#aaa',fontWeight:'bold',
            flexShrink:0,
          }}>{i===4&&pt.count>5?`+${pt.count-4}`:''}</div>
        ))}
        {/* Point number */}
        <div style={{fontSize:9,color:'#555',position:'absolute',[isBottom?'bottom':'top']:-14,width:'100%',textAlign:'center'}}>{ptIdx}</div>
      </div>
    );
  };

  return(
    <div className="game-shell" style={{maxWidth:600,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🎲'} Backgammon</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {winner&&<div className="winner-banner">{winner==='W'?'🏆 You Win!':'🤖 AI Wins!'}</div>}
      {!winner&&<div className="turn-indicator">{aiThink?'🤖 AI rolling…':phase==='roll'?'Roll Dice':phase==='move'?'Click a checker, then click destination':'AI turn'}</div>}

      {/* Dice */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:8}}>
          {dice.length?dice.map((d,i)=>(
            <div key={i} style={{
              width:36,height:36,borderRadius:8,background:'#f0ede6',border:'2px solid #c8c0b0',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:'bold',color:'#1a1a2e',
              opacity:diceUsed[i]?0.3:1,
            }}>{d}</div>
          )):<div style={{color:'#555',fontSize:12}}>No roll yet</div>}
        </div>
        {phase==='roll'&&!winner&&<button className="bv-button" onClick={rollDice}>🎲 Roll</button>}
        {phase==='move'&&!winner&&<button className="bv-button secondary" style={{fontSize:11}} onClick={endTurn}>Pass Turn</button>}
        <div style={{flex:1,textAlign:'right',fontSize:11,color:'#888'}}>
          White bar: {points[0].count} · Black bar: {points[25].count}
        </div>
      </div>

      {/* Board */}
      <div style={{background:'#1a1a0a',borderRadius:10,padding:'20px 8px 8px',border:'2px solid #3a3010',overflowX:'auto'}}>
        {/* Top row: points 13-24 */}
        <div style={{display:'flex',gap:2,justifyContent:'center',marginBottom:4}}>
          {Array.from({length:12},(_,i)=>renderPoint(13+i,false))}
        </div>
        {/* Middle: bar area */}
        <div style={{height:20,display:'flex',justifyContent:'center',alignItems:'center'}}>
          <span style={{fontSize:10,color:'#555'}}>← White goes this way</span>
        </div>
        {/* Bottom row: points 12-1 */}
        <div style={{display:'flex',gap:2,justifyContent:'center',marginTop:4}}>
          {Array.from({length:12},(_,i)=>renderPoint(12-i,true))}
        </div>
      </div>

      {/* Log */}
      <div className="bv-card" style={{padding:8,marginTop:10,maxHeight:80,overflowY:'auto'}}>
        {log.slice(0,5).map((l,i)=><div key={i} style={{fontSize:11,color:i===0?'#e0e0e0':'#555',marginBottom:2}}>{l}</div>)}
      </div>
    </div>
  );
}
