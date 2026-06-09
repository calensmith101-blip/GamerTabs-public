import React, { useState } from 'react';

/* Cribbage — CribbageCounter
 * Simplified: deal 6, discard 2 to crib, cut starter, count hands.
 * Scoring: 15s (2pts each), pairs (2pts), runs (1pt/card), flush, nobs.
 * First to 121 wins. Peg board visualization.
 */

const SUITS=['♠','♥','♦','♣'],RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RED=new Set(['♥','♦']);
const VAL=Object.fromEntries(RANKS.map((r,i)=>[r,Math.min(i+1,10)]));
const RANK_IDX=Object.fromEntries(RANKS.map((r,i)=>[r,i]));

function makeDeck(){const d=[];let id=0;for(const s of SUITS)for(const r of RANKS)d.push({id:id++,suit:s,rank:r,val:VAL[r]});return shuffle(d);}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

function combinations(arr, k){
  if(k===0) return [[]];
  return arr.flatMap((v,i)=>combinations(arr.slice(i+1),k-1).map(c=>[v,...c]));
}

function scoreHand(hand, starter, isCrib=false){
  const all=[...hand,starter];
  let pts=0, breakdown=[];

  // 15s
  for(let k=2;k<=5;k++){
    const combos=combinations(all,k);
    const fifteens=combos.filter(c=>c.reduce((s,x)=>s+x.val,0)===15).length;
    if(fifteens>0){pts+=fifteens*2;breakdown.push(`15s: ${fifteens*2}pts`);}
  }

  // Pairs (in all 5 cards)
  for(let i=0;i<all.length;i++) for(let j=i+1;j<all.length;j++){
    if(all[i].rank===all[j].rank){pts+=2;breakdown.push(`Pair: 2pts`);}
  }

  // Runs (check 5,4,3 card runs)
  const sorted=[...all].sort((a,b)=>RANK_IDX[a.rank]-RANK_IDX[b.rank]);
  let foundRun=false;
  for(let len=5;len>=3;len--){
    const rCombos=combinations(sorted,len);
    for(const c of rCombos){
      const uniq=new Set(c.map(x=>x.rank)).size===c.length;
      const consecutive=c.every((x,i)=>i===0||RANK_IDX[x.rank]===RANK_IDX[c[i-1].rank]+1);
      if(uniq&&consecutive){pts+=len;breakdown.push(`Run of ${len}: ${len}pts`);foundRun=true;}
    }
    if(foundRun) break;
  }

  // Flush: 4+ of same suit in hand (not counting starter)
  const handSuits=hand.map(c=>c.suit);
  if(handSuits.every(s=>s===handSuits[0])){
    if(starter.suit===handSuits[0]){pts+=5;breakdown.push('Flush (5): 5pts');}
    else if(!isCrib){pts+=4;breakdown.push('Flush (4): 4pts');}
  }

  // Nobs: J of same suit as starter in hand
  if(hand.some(c=>c.rank==='J'&&c.suit===starter.suit)){pts+=1;breakdown.push('Nobs: 1pt');}

  return{pts,breakdown};
}

function aiDiscard(hand){
  // Discard 2 cards that minimize hand score loss
  let bestDiscard=null,bestScore=-1;
  const combos=combinations(hand.map((_,i)=>i),4);
  combos.forEach(keep=>{
    const kHand=keep.map(i=>hand[i]);
    const discard=hand.filter((_,i)=>!keep.includes(i));
    const fakeStarter={rank:'5',suit:'♥',val:5}; // assume average starter
    const {pts}=scoreHand(kHand,fakeStarter);
    if(pts>bestScore){bestScore=pts;bestDiscard=discard;}
  });
  return bestDiscard||hand.slice(0,2);
}

function initGame(){
  const deck=makeDeck();
  const pHand=deck.splice(0,6);
  const aHand=deck.splice(0,6);
  return{deck,pHand,aHand,crib:[],starter:null,pDiscarded:[],aDiscarded:[],pScore:0,aScore:0,turn:'player',phase:'discard',msg:'Select 2 cards to discard to the crib.',dealer:'player',selected:[]};
}

const BOARD_SIZE=121;
function PegBoard({score,label,color}){
  const pct=Math.min(score/BOARD_SIZE,1);
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
        <span style={{color}}>{label}</span>
        <span style={{color:'#e8b800',fontWeight:'bold'}}>{score}/121</span>
      </div>
      <div style={{height:14,background:'#0a0a14',borderRadius:7,overflow:'hidden',border:'1px solid #2a2a4a'}}>
        <div style={{height:'100%',width:`${pct*100}%`,background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:7,transition:'width .4s'}}/>
      </div>
    </div>
  );
}

function CardFace({card,selected,onClick}){
  const red=RED.has(card.suit);
  return(
    <div onClick={onClick} style={{
      width:40,height:58,borderRadius:6,background:'#f5f5f0',
      border:selected?'2.5px solid #e8b800':'1.5px solid #ccc',
      cursor:onClick?'pointer':'default',flexShrink:0,
      display:'flex',flexDirection:'column',justifyContent:'space-between',
      padding:'2px 3px',userSelect:'none',
      opacity:1,transform:selected?'translateY(-8px)':'none',
      transition:'transform .15s',
      boxShadow:selected?'0 0 10px rgba(232,184,0,.5)':'0 1px 3px rgba(0,0,0,.4)',
    }}>
      <span style={{fontSize:10,fontWeight:'bold',color:red?'#c0392b':'#1a1a2e',lineHeight:1}}>{card.rank}{card.suit}</span>
      <span style={{fontSize:10,fontWeight:'bold',color:red?'#c0392b':'#1a1a2e',textAlign:'right',transform:'rotate(180deg)',lineHeight:1}}>{card.rank}{card.suit}</span>
    </div>
  );
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Cribbage Counter</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Reach 121 points on the peg board.</p>
        <h4>Phases</h4><ul>
          <li><b>Discard:</b> Each player sends 2 cards to the crib (the dealer's bonus hand).</li>
          <li><b>Starter:</b> A card is cut from the deck.</li>
          <li><b>Count:</b> Each player counts their 4-card hand + the starter card.</li>
          <li>The dealer also counts the crib.</li>
        </ul>
        <h4>Scoring</h4><ul>
          <li><b>15s:</b> Any combination summing to 15 = 2pts each.</li>
          <li><b>Pairs:</b> 2pts per pair.</li>
          <li><b>Runs:</b> 1pt per card in a run of 3+.</li>
          <li><b>Flush:</b> 4 same-suit hand = 4pts; +1 if starter matches.</li>
          <li><b>Nobs:</b> J of starter's suit in hand = 1pt.</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function CribbageCounter({game,onBack,onExit}){
  const exit=onBack||onExit||null;
  const [gs,setGs]=useState(initGame);
  const [showHelp,setShowHelp]=useState(false);
  const [result,setResult]=useState(null);

  const reset=()=>{setGs(initGame());setResult(null);};

  const toggleSelect=(idx)=>{
    if(gs.phase!=='discard') return;
    setGs(prev=>{
      const sel=prev.selected.includes(idx)?prev.selected.filter(i=>i!==idx):[...prev.selected,idx];
      return{...prev,selected:sel.slice(0,2)};
    });
  };

  const confirmDiscard=()=>{
    if(gs.selected.length!==2) return;
    const pCrib=gs.selected.map(i=>gs.pHand[i]);
    const newPHand=gs.pHand.filter((_,i)=>!gs.selected.includes(i));
    const aiDiscards=aiDiscard(gs.aHand);
    const aiDiscardIds=new Set(aiDiscards.map(c=>c.id));
    const newAHand=gs.aHand.filter(c=>!aiDiscardIds.has(c.id));
    const crib=[...pCrib,...aiDiscards];
    const deck=[...gs.deck];
    const starter=deck.pop();
    setGs(prev=>({...prev,pHand:newPHand,aHand:newAHand,crib,starter,deck,phase:'count',selected:[],msg:'Cards discarded. Now count your hand!'}));
  };

  const countHand=()=>{
    if(!gs.starter) return;
    const {pts:pPts,breakdown:pBD}=scoreHand(gs.pHand,gs.starter);
    const {pts:aPts,breakdown:aBD}=scoreHand(gs.aHand,gs.starter);
    const {pts:cPts,breakdown:cBD}=scoreHand(gs.crib,gs.starter,true);
    const cribOwner=gs.dealer;
    const newPS=gs.pScore+pPts+(cribOwner==='player'?cPts:0);
    const newAS=gs.aScore+aPts+(cribOwner==='ai'?cPts:0);
    const over=newPS>=BOARD_SIZE||newAS>=BOARD_SIZE;
    setResult({pPts,aPts,cPts,cribOwner,pBD,aBD,cBD});
    setGs(prev=>({...prev,pScore:newPS,aScore:newAS,phase:over?'gameover':'result',msg:over?'Game Over!':'Round complete.'}));
  };

  const nextRound=()=>{
    const d=makeDeck();
    const pHand=d.splice(0,6);
    const aHand=d.splice(0,6);
    const newDealer=gs.dealer==='player'?'ai':'player';
    setGs(prev=>({...prev,deck:d,pHand,aHand,crib:[],starter:null,pDiscarded:[],aDiscarded:[],selected:[],phase:'discard',dealer:newDealer,msg:`New round! ${newDealer==='player'?'You':'AI'} deal. Discard 2 to crib.`}));
    setResult(null);
  };

  const over=gs.phase==='gameover';

  return(
    <div className="game-shell" style={{maxWidth:500,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'📊'} Cribbage</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {over&&<div className="winner-banner">{gs.pScore>=BOARD_SIZE?'🏆 You Win!':'🤖 AI Wins!'}</div>}

      <div style={{marginBottom:12}}>
        <PegBoard score={gs.pScore} label="You" color="#e8b800"/>
        <PegBoard score={gs.aScore} label="🤖 AI" color="#c0392b"/>
      </div>

      <div style={{fontSize:11,color:'#555',marginBottom:8}}>Dealer: {gs.dealer==='player'?'You':'AI'} · Crib goes to dealer</div>
      {gs.msg&&<div className="turn-indicator">{gs.msg}</div>}

      {gs.starter&&(
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:12,color:'#888'}}>Starter card:</span>
          <CardFace card={gs.starter}/>
          {gs.starter.rank==='J'&&<span style={{fontSize:11,color:'#f39c12'}}>His Heels! Dealer +2</span>}
        </div>
      )}

      {gs.phase==='discard'&&(
        <div>
          <div style={{fontSize:12,color:'#888',marginBottom:6}}>Select 2 cards to discard ({gs.selected.length}/2):</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
            {gs.pHand.map((card,i)=>(
              <CardFace key={card.id} card={card} selected={gs.selected.includes(i)} onClick={()=>toggleSelect(i)}/>
            ))}
          </div>
          <button className="bv-button" onClick={confirmDiscard} disabled={gs.selected.length!==2}>Discard to Crib →</button>
        </div>
      )}

      {gs.phase==='count'&&(
        <div>
          <div style={{fontSize:12,color:'#888',marginBottom:6}}>Your Hand:</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
            {gs.pHand.map(card=><CardFace key={card.id} card={card}/>)}
          </div>
          <button className="bv-button" onClick={countHand}>Count Hands →</button>
        </div>
      )}

      {result&&(
        <div className="bv-card" style={{padding:12,marginTop:12}}>
          <div style={{fontSize:12,color:'#e8b800',marginBottom:6}}>Hand Results:</div>
          <div style={{fontSize:12,color:'#4caf50',marginBottom:4}}>Your hand: +{result.pPts} pts — {result.pBD.join(', ')||'0'}</div>
          <div style={{fontSize:12,color:'#c0392b',marginBottom:4}}>AI hand: +{result.aPts} pts — {result.aBD.join(', ')||'0'}</div>
          <div style={{fontSize:12,color:'#e67e22',marginBottom:8}}>Crib ({result.cribOwner==='player'?'Yours':'AI'}): +{result.cPts} pts — {result.cBD.join(', ')||'0'}</div>
          {gs.phase==='result'&&<button className="bv-button" onClick={nextRound}>Next Round →</button>}
        </div>
      )}
    </div>
  );
}
