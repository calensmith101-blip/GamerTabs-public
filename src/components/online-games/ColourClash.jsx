import React, { useState, useEffect, useCallback } from 'react';

const DIRS=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
const OPP={b:'w',w:'b'};

function initBoard(){
  const b=Array(8).fill(null).map(()=>Array(8).fill(null));
  b[3][3]='w';b[3][4]='b';b[4][3]='b';b[4][4]='w';
  return b;
}

function getFlips(board,r,c,col){
  const op=OPP[col];const flips=[];
  for(const[dr,dc]of DIRS){
    const line=[];let nr=r+dr,nc=c+dc;
    while(nr>=0&&nr<8&&nc>=0&&nc<8&&board[nr][nc]===op){line.push([nr,nc]);nr+=dr;nc+=dc;}
    if(line.length&&nr>=0&&nr<8&&nc>=0&&nc<8&&board[nr][nc]===col)flips.push(...line);
  }
  return flips;
}

function validMoves(board,col){
  const mv=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(!board[r][c]&&getFlips(board,r,c,col).length)mv.push([r,c]);
  return mv;
}

function applyMove(board,r,c,col){
  const nb=board.map(row=>[...row]);
  nb[r][c]=col;
  getFlips(nb,r,c,col).forEach(([fr,fc])=>nb[fr][fc]=col);
  return nb;
}

function count(board){let b=0,w=0;board.flat().forEach(c=>{if(c==='b')b++;if(c==='w')w++;});return{b,w};}

const WEIGHTS=[[4,-3,2,2,2,2,-3,4],[-3,-4,-1,-1,-1,-1,-4,-3],[2,-1,1,0,0,1,-1,2],[2,-1,0,1,1,0,-1,2],[2,-1,0,1,1,0,-1,2],[2,-1,1,0,0,1,-1,2],[-3,-4,-1,-1,-1,-1,-4,-3],[4,-3,2,2,2,2,-3,4]];

function aiPick(board,col){
  const mv=validMoves(board,col);if(!mv.length)return null;
  const corners=mv.filter(([r,c])=>(r===0||r===7)&&(c===0||c===7));
  if(corners.length)return corners[0];
  let best=mv[0],bs=-Infinity;
  for(const[r,c]of mv){const s=getFlips(board,r,c,col).length*.5+WEIGHTS[r][c]*2;if(s>bs){bs=s;best=[r,c];}}
  return best;
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Chrome Reversal</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4><p>Control more squares than your opponent when the board fills.</p>
        <h4>Rules</h4>
        <ul>
          <li>Place a disc so that you sandwich opponent discs in a line — they flip to your colour.</li>
          <li>You must flip at least one disc. Invalid moves are not allowed.</li>
          <li>If you have no valid moves, your turn is skipped.</li>
          <li>Game ends when neither player can move or the board is full.</li>
        </ul>
        <h4>Hints</h4><p>Small dots show your valid moves. Corners are the most valuable squares.</p>
      </div>
    </div>
  </div>
);

export default function ColourClash(props){
  const{onBack,onExit,gameMode,game}=props||{};
  const exit=onBack||onExit||null;
  const isAI=gameMode==='ai'||gameMode==='computer';
  const PLAYER='b';

  const[board,setBoard]=useState(initBoard);
  const[turn,setTurn]=useState('b');
  const[vmv,setVmv]=useState(()=>validMoves(initBoard(),'b'));
  const[over,setOver]=useState(false);
  const[passes,setPasses]=useState(0);
  const[thinking,setThinking]=useState(false);
  const[lastFlip,setLastFlip]=useState([]);
  const[showHelp,setShowHelp]=useState(false);

  const reset=()=>{const b=initBoard();setBoard(b);setTurn('b');setVmv(validMoves(b,'b'));setOver(false);setPasses(0);setThinking(false);setLastFlip([]);};

  const advance=useCallback((nb,nextCol,p=0)=>{
    const vm=validMoves(nb,nextCol);
    if(vm.length){setVmv(vm);setTurn(nextCol);setPasses(0);}
    else{
      const op=OPP[nextCol];
      const ovm=validMoves(nb,op);
      if(ovm.length){setVmv(ovm);setTurn(op);setPasses(p+1);}
      else{setVmv([]);setOver(true);}
    }
  },[]);

  const handleClick=(r,c)=>{
    if(over||thinking)return;
    if(isAI&&turn!==PLAYER)return;
    if(!vmv.some(([vr,vc])=>vr===r&&vc===c))return;
    const fl=getFlips(board,r,c,turn);
    const nb=applyMove(board,r,c,turn);
    setLastFlip(fl.map(([fr,fc])=>`${fr},${fc}`));
    setBoard(nb);
    advance(nb,OPP[turn]);
  };

  useEffect(()=>{
    if(!isAI||turn===PLAYER||over)return;
    setThinking(true);
    const t=setTimeout(()=>{
      const mv=aiPick(board,OPP[PLAYER]);
      if(mv){
        const fl=getFlips(board,mv[0],mv[1],OPP[PLAYER]);
        const nb=applyMove(board,mv[0],mv[1],OPP[PLAYER]);
        setLastFlip(fl.map(([fr,fc])=>`${fr},${fc}`));
        setBoard(nb);
        advance(nb,PLAYER);
      }
      setThinking(false);
    },500);
    return()=>clearTimeout(t);
  },[turn,isAI,board,over,advance]);

  const{b,w}=count(board);
  const winner=over?(b>w?'Black':w>b?'White':'Draw'):null;

  return(
    <div className="game-shell" style={{maxWidth:480,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🎨'} Chrome Reversal</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:18,height:18,borderRadius:'50%',background:'#111',border:'2px solid #555',margin:'0 auto 2px'}}/>
          <div style={{fontSize:18,color:'#e0e0e0',fontWeight:'bold'}}>{b}</div>
          <div style={{fontSize:10,color:'#888'}}>Black{isAI?'':' (You)'}</div>
        </div>
        {over
          ?<div className="winner-banner" style={{margin:0,padding:'5px 12px',fontSize:13}}>
            {winner==='Draw'?'⚖️ Draw!':winner==='Black'?isAI?'Black Wins':'🏆 You Win!':'🤖 White Wins!'}
          </div>
          :<div className="turn-indicator" style={{margin:0,fontSize:12}}>
            {thinking?'🤖 AI thinking…':turn==='b'?isAI?'⬛ Black':'⬛ Your turn':isAI?'🤖 AI (White)':'⬜ White turn'}
          </div>
        }
        <div style={{textAlign:'center'}}>
          <div style={{width:18,height:18,borderRadius:'50%',background:'#e8e8e8',border:'2px solid #999',margin:'0 auto 2px'}}/>
          <div style={{fontSize:18,color:'#e0e0e0',fontWeight:'bold'}}>{w}</div>
          <div style={{fontSize:10,color:'#888'}}>White{isAI?' (AI)':''}</div>
        </div>
      </div>

      <div className="game-board reversi-grid">
        <div style={{background:'#1a2a1a',borderRadius:8,padding:8,border:'2px solid #2a3a2a'}}>
          {board.map((row,r)=>(
            <div key={r} style={{display:'flex',gap:2,marginBottom:2}}>
              {row.map((cell,c)=>{
                const isV=vmv.some(([vr,vc])=>vr===r&&vc===c);
                const wasFlip=lastFlip.includes(`${r},${c}`);
                return(
                  <div key={c} onClick={()=>handleClick(r,c)} style={{
                    width:50,height:50,borderRadius:4,background:'#0d1f0d',
                    border:'1px solid #1a3a1a',display:'flex',alignItems:'center',justifyContent:'center',
                    cursor:isV&&!over?'pointer':'default',position:'relative',
                  }}>
                    {cell&&<div style={{
                      width:38,height:38,borderRadius:'50%',
                      background:cell==='b'?'#111':'#e8e8e8',
                      border:cell==='b'?'2px solid #444':'2px solid #bbb',
                      boxShadow:wasFlip?`0 0 10px ${cell==='b'?'#4444ff':'#ffee88'}`:'none',
                      transition:'box-shadow .3s',
                    }}/>}
                    {isV&&!cell&&<div style={{width:14,height:14,borderRadius:'50%',background:'rgba(100,200,100,.35)',border:'1px solid rgba(100,200,100,.5)'}}/>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{textAlign:'center',fontSize:11,color:'#555',marginTop:8}}>Dots show valid moves · Corners are strongest</div>
    </div>
  );
}
