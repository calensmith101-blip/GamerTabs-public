import React, { useState, useEffect } from 'react';
import { isAiMode } from '../../lib/gameMode';

const PIECE_DEFS=[
  {type:'COM',label:'Commander',rank:10,count:1,sym:'★'},
  {type:'LT', label:'Lieutenant', rank:9, count:1,sym:'9'},
  {type:'STR',label:'Striker',    rank:8, count:2,sym:'8'},
  {type:'ENF',label:'Enforcer',   rank:7, count:3,sym:'7'},
  {type:'OPR',label:'Operative',  rank:6, count:4,sym:'6'},
  {type:'SCT',label:'Scout',      rank:5, count:4,sym:'5'},
  {type:'FAG',label:'Field Agent',rank:4, count:4,sym:'4'},
  {type:'COR',label:'Courier',    rank:3, count:3,sym:'3',ghost:false},
  {type:'GHO',label:'Ghost',      rank:2, count:1,sym:'G',ghostKill:true},
  {type:'DCY',label:'Decoy',      rank:1, count:6,sym:'D',immobile:true},
  {type:'IFL',label:'Intel File', rank:0, count:1,sym:'⚑',immobile:true,isFlag:true},
  {type:'MNE',label:'Mine',       rank:-1,count:6,sym:'✕',immobile:true,isMine:true},
];
const LAKES=[[4,2],[4,3],[5,2],[5,3],[4,6],[4,7],[5,6],[5,7]];
const isLake=(r,c)=>LAKES.some(([lr,lc])=>lr===r&&lc===c);
const info=(type)=>PIECE_DEFS.find(p=>p.type===type)||null;

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

function autoArrange(side){
  const board={};
  const startRow=side==='player'?6:0;
  const pos=[];
  for(let r=startRow;r<startRow+4;r++) for(let c=0;c<10;c++) if(!isLake(r,c)) pos.push([r,c]);
  const shuffled=shuffle(pos);
  let idx=0;
  for(const pd of PIECE_DEFS) for(let n=0;n<pd.count;n++){
    if(idx>=shuffled.length)break;
    const[r,c]=shuffled[idx++];
    board[`${r},${c}`]={type:pd.type,side,revealed:false};
  }
  return board;
}

function getMoves(board,r,c){
  const key=`${r},${c}`;const piece=board[key];
  if(!piece)return[];
  const inf=info(piece.type);if(!inf||inf.immobile)return[];
  const mv=[];const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
  for(const[dr,dc]of dirs){
    // Scout can move multiple squares
    if(inf.type==='SCT'){
      let nr=r+dr,nc=c+dc;
      while(nr>=0&&nr<10&&nc>=0&&nc<10&&!isLake(nr,nc)){
        const nk=`${nr},${nc}`;
        if(board[nk]){if(board[nk].side!==piece.side)mv.push([nr,nc]);break;}
        mv.push([nr,nc]);nr+=dr;nc+=dc;
      }
    } else {
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<10&&nc>=0&&nc<10&&!isLake(nr,nc)){
        const nk=`${nr},${nc}`;
        if(!board[nk]||board[nk].side!==piece.side)mv.push([nr,nc]);
      }
    }
  }
  return mv;
}

function resolveBattle(attT,defT){
  const a=info(attT),d=info(defT);
  if(!a||!d)return'attacker';
  if(d.isFlag)return'attacker';
  if(d.isMine)return a.ghostKill?'attacker':'defender';
  if(a.ghostKill&&d.rank===10)return'attacker';
  if(a.rank>d.rank)return'attacker';
  if(a.rank<d.rank)return'defender';
  return'both';
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">How to Play — Covert Ranks</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Capture the enemy <b>Intel File (⚑)</b>.</p>
        <h4>Movement</h4><ul>
          <li>Click a piece, then a highlighted square to move.</li>
          <li>Immobile pieces (Mine, Decoy, Intel File) cannot move.</li>
          <li>Scouts (5) move any number of squares in a straight line.</li>
          <li>Lakes block movement.</li>
        </ul>
        <h4>Combat</h4><ul>
          <li>Move onto an enemy square to attack. Both pieces are revealed.</li>
          <li>Higher rank wins. Equal rank: both removed.</li>
          <li>Ghost (G) defeats the Commander (★). Mine defeats all except Ghost.</li>
        </ul>
        <h4>Piece Key</h4>
        <ul>{PIECE_DEFS.map(p=><li key={p.type}><b>{p.sym}</b> {p.label} — rank {p.rank>=0?p.rank:'Mine'}</li>)}</ul>
      </div>
    </div>
  </div>
);

export default function FlagFront(props){
  const{onBack,onExit,game}=props||{};
  const aiMode=isAiMode([props?.gameMode, props?.mode, props?.selectedMode]);
  const exit=onBack||onExit||null;

  const[phase,setPhase]=useState('setup');
  const[board,setBoard]=useState({});
  const[sel,setSel]=useState(null);
  const[legal,setLegal]=useState([]);
  const[turn,setTurn]=useState('player');
  const[winner,setWinner]=useState(null);
  const[lastBattle,setLastBattle]=useState(null);
  const[log,setLog]=useState([]);
  const[thinking,setThinking]=useState(false);
  const[showHelp,setShowHelp]=useState(false);

  const addLog=m=>setLog(p=>[m,...p].slice(0,14));

  const startGame=()=>{
    const pp=autoArrange('player');const ap=autoArrange('ai');
    setBoard({...pp,...ap});setPhase('battle');setTurn('player');
    setSel(null);setLegal([]);setLastBattle(null);setLog(['Game started — find and capture the Intel File!']);
  };

  const reset=()=>{setPhase('setup');setBoard({});setSel(null);setLegal([]);setTurn('player');setWinner(null);setLastBattle(null);setLog([]);setThinking(false);};

  const doMove=(from,to)=>{
    const[fr,fc]=from,[tr,tc]=to;
    const fk=`${fr},${fc}`,tk=`${tr},${tc}`;
    const nb={...board};
    const att={...nb[fk],revealed:true};
    const def=nb[tk];

    if(!def){nb[tk]=att;delete nb[fk];setBoard(nb);setTurn(turn==='player'?'ai':'player');return;}

    // Battle
    const result=resolveBattle(att.type,def.type);
    const ai=info(att.type),di=info(def.type);
    const msg=`⚔️ ${ai?.label}(${ai?.rank}) vs ${di?.label}(${di?.rank}) → ${result==='attacker'?'Attacker wins':result==='defender'?'Defender wins':'Both eliminated'}`;
    addLog(msg);
    setLastBattle({att,def:{...def,revealed:true},result,fk,tk});

    if(di?.isFlag){
      delete nb[fk];delete nb[tk];setBoard(nb);
      setWinner(att.side==='player'?'player':'ai');
      addLog(att.side==='player'?'🏆 You captured the Intel File!':'🤖 AI captured your Intel File!');
      setPhase('gameover');return;
    }
    if(result==='attacker'){nb[tk]={...att};delete nb[fk];}
    else if(result==='defender'){nb[tk]={...def,revealed:true};delete nb[fk];}
    else{delete nb[fk];delete nb[tk];}
    setBoard(nb);setTurn(turn==='player'?'ai':'player');
  };

  const handleClick=(r,c)=>{
    if(phase!=='battle'||winner||thinking)return;
    if(aiMode&&turn!=='player')return;
    const key=`${r},${c}`;const piece=board[key];

    if(sel){
      if(legal.some(([lr,lc])=>lr===r&&lc===c)){doMove(sel,[r,c]);setSel(null);setLegal([]);return;}
      if(piece?.side===turn){setSel([r,c]);setLegal(getMoves(board,r,c));return;}
      setSel(null);setLegal([]);return;
    }
    if(piece?.side===turn){setSel([r,c]);setLegal(getMoves(board,r,c));}
  };

  // AI turn
  useEffect(()=>{
    if(!aiMode||turn!=='ai'||phase!=='battle'||winner)return;
    setThinking(true);
    const t=setTimeout(()=>{
      const aiPieces=Object.entries(board).filter(([,p])=>p.side==='ai'&&!info(p.type)?.immobile);
      const mv=aiPieces.flatMap(([key,p])=>{const[r,c]=key.split(',').map(Number);return getMoves(board,r,c).map(([tr,tc])=>({from:[r,c],to:[tr,tc]}));});
      if(mv.length){
        const attacks=mv.filter(({to:[tr,tc]})=>board[`${tr},${tc}`]);
        const pick=attacks.length?attacks[Math.floor(Math.random()*attacks.length)]:mv[Math.floor(Math.random()*mv.length)];
        doMove(pick.from,pick.to);
      } else {setWinner('player');addLog('AI has no moves — you win!');}
      setThinking(false);
    },600);
    return()=>clearTimeout(t);
  },[turn,phase,winner,board]);

  const CS=38;
  const piecesByType=PIECE_DEFS.reduce((m,p)=>{m[p.type]=p;return m;},{});

  return(
    <div className="game-shell" style={{maxWidth:660,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🏴'} Covert Ranks</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          {phase==='setup'&&<button className="bv-button" onClick={startGame}>Deploy &amp; Start</button>}
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {phase==='setup'&&<div className="turn-indicator">Pieces will be auto-arranged. Click <b style={{color:'#e8b800'}}>Deploy &amp; Start</b> to begin.</div>}
      {winner&&<div className="winner-banner">{winner==='player'?'🏆 You captured the Intel File!':'🤖 AI captured your Intel File!'}</div>}
      {!winner&&phase==='battle'&&<div className="turn-indicator">{thinking?'🤖 AI moving…':turn==='player'?'Your turn — click a piece':aiMode?'AI turn':'Player 2 turn'}</div>}

      {lastBattle&&(
        <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
          <div className="bv-card" style={{padding:'6px 14px',fontSize:12,color:'#e0e0e0'}}>
            {info(lastBattle.att.type)?.label}({info(lastBattle.att.type)?.rank}) vs {info(lastBattle.def.type)?.label}({info(lastBattle.def.type)?.rank})
            — <b style={{color:lastBattle.result==='attacker'?'#4caf50':lastBattle.result==='defender'?'#f44':'#888'}}>
              {lastBattle.result==='attacker'?'Attacker wins':lastBattle.result==='defender'?'Defender wins':'Both gone'}
            </b>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
        <div>
          {/* Column labels */}
          <div style={{display:'flex',paddingLeft:18,marginBottom:2}}>
            {Array(10).fill(0).map((_,c)=><div key={c} style={{width:CS,textAlign:'center',fontSize:8,color:'#444'}}>{c}</div>)}
          </div>
          <div style={{border:'2px solid #2a2a4a',borderRadius:7,overflow:'hidden',background:'#0a0a14'}}>
            {Array(10).fill(0).map((_,r)=>(
              <div key={r} style={{display:'flex'}}>
                <div style={{width:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#444'}}>{r}</div>
                {Array(10).fill(0).map((_,c)=>{
                  const key=`${r},${c}`;const piece=board[key];const lake=isLake(r,c);
                  const isSel=sel&&sel[0]===r&&sel[1]===c;
                  const isDest=legal.some(([lr,lc])=>lr===r&&lc===c);
                  const showInfo=piece&&(piece.side==='player'||piece.revealed);
                  const pinf=showInfo?info(piece?.type):null;
                  return(
                    <div key={c} onClick={()=>handleClick(r,c)} style={{
                      width:CS,height:CS,border:'1px solid rgba(255,255,255,.04)',
                      background:lake?'linear-gradient(135deg,#0a1830,#152040)':isSel?'#4a3010':isDest?'rgba(232,184,0,.12)':
                        piece?.side==='ai'&&!piece.revealed?'#12121e':piece?.side==='player'?'#0f100f':'#0c0c14',
                      display:'flex',alignItems:'center',justifyContent:'center',cursor:lake?'default':'pointer',position:'relative',
                    }}>
                      {isDest&&!lake&&<div style={{position:'absolute',inset:0,background:'rgba(232,184,0,.1)',border:'1px solid rgba(232,184,0,.4)'}}/>}
                      {!lake&&piece&&(
                        <div style={{
                          width:CS-6,height:CS-6,borderRadius:4,
                          background:piece.side==='player'?'rgba(192,57,43,.85)':piece.revealed?'rgba(41,128,185,.9)':'rgba(30,30,50,.9)',
                          border:`1px solid ${piece.side==='player'?'#e74c3c':piece.revealed?'#3498db':'#333'}`,
                          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:1,
                          boxShadow:isSel?'0 0 8px #e8b800':'none',
                        }}>
                          {showInfo?<>
                            <span style={{fontSize:CS*.3,lineHeight:1,color:'#fff',fontWeight:'bold'}}>{pinf?.sym||'?'}</span>
                            <span style={{fontSize:7,color:'rgba(255,255,255,.6)',lineHeight:1}}>{pinf?.rank>=0?pinf.rank:'M'}</span>
                          </>:<span style={{fontSize:14,color:'#444'}}>?</span>}
                        </div>
                      )}
                      {!lake&&!piece&&isDest&&<div style={{width:8,height:8,borderRadius:'50%',background:'rgba(232,184,0,.5)'}}/>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:14,marginTop:6,fontSize:11}}>
            <span style={{color:'#c0392b'}}>■ You</span>
            <span style={{color:'#2980b9'}}>■ Enemy</span>
            <span style={{color:'#1a4060'}}>■ Lake</span>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:8,minWidth:160,maxWidth:200}}>
          <div className="bv-card" style={{padding:10}}>
            <div style={{color:'#e8b800',fontSize:11,fontWeight:'bold',marginBottom:6}}>Piece Key</div>
            {PIECE_DEFS.map(p=>(
              <div key={p.type} style={{display:'flex',gap:6,marginBottom:3,alignItems:'center'}}>
                <span style={{fontSize:11,color:'#7c6af7',width:16,textAlign:'center',fontWeight:'bold'}}>{p.sym}</span>
                <span style={{fontSize:10,color:'#888'}}>{p.label}</span>
                <span style={{fontSize:10,color:'#555',marginLeft:'auto'}}>{p.rank>=0?p.rank:'M'}</span>
              </div>
            ))}
          </div>
          <div className="bv-card" style={{padding:8,maxHeight:200,overflowY:'auto'}}>
            <div style={{color:'#e8b800',fontSize:11,marginBottom:4}}>Battle Log</div>
            {log.map((l,i)=><div key={i} style={{fontSize:10,color:i===0?'#e0e0e0':'#555',marginBottom:2}}>{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
