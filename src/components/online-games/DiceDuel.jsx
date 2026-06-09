import React, { useState, useEffect } from 'react';

const roll3=()=>Array(3).fill(0).map(()=>Math.floor(Math.random()*6)+1);
const sum=a=>a.reduce((s,v)=>s+v,0);
const PIP={1:[[50,50]],2:[[25,25],[75,75]],3:[[25,25],[50,50],[75,75]],4:[[25,25],[75,25],[25,75],[75,75]],5:[[25,25],[75,25],[50,50],[25,75],[75,75]],6:[[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]]};

function Die({v,hi}){
  return(
    <div style={{width:46,height:46,borderRadius:9,background:hi?'rgba(232,184,0,.12)':'#1a1a2e',border:`2px solid ${hi?'#e8b800':'rgba(255,255,255,.12)'}`,position:'relative',flexShrink:0}}>
      {(PIP[v]||[]).map(([x,y],i)=>(
        <div key={i} style={{position:'absolute',left:`${x}%`,top:`${y}%`,width:9,height:9,borderRadius:'50%',background:hi?'#e8b800':'#7c6af7',transform:'translate(-50%,-50%)'}}/>
      ))}
    </div>
  );
}

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Vault Farkle Duel</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4><p>Win the most rounds out of 5.</p>
        <h4>Each Round</h4>
        <ul>
          <li>You and the AI each roll 3 dice.</li>
          <li>Highest total wins the round.</li>
          <li>Ties: no point awarded.</li>
        </ul>
        <h4>Winning</h4><p>After 5 rounds, most round wins = overall winner.</p>
      </div>
    </div>
  </div>
);

export default function DiceDuel(props){
  const{onBack,onExit,gameMode,game}=props||{};
  const exit=onBack||onExit||null;
  const isAI=gameMode==='ai'||gameMode==='computer';

  const ROUNDS=5;
  const[round,setRound]=useState(1);
  const[phase,setPhase]=useState('idle');
  const[pDice,setPDice]=useState([1,1,1]);
  const[aiDice,setAiDice]=useState([1,1,1]);
  const[pWins,setPWins]=useState(0);
  const[aiWins,setAiWins]=useState(0);
  const[ties,setTies]=useState(0);
  const[msg,setMsg]=useState('');
  const[over,setOver]=useState(false);
  const[rolling,setRolling]=useState(false);
  const[hist,setHist]=useState([]);
  const[showHelp,setShowHelp]=useState(false);

  const reset=()=>{setRound(1);setPhase('idle');setPDice([1,1,1]);setAiDice([1,1,1]);setPWins(0);setAiWins(0);setTies(0);setMsg('');setOver(false);setRolling(false);setHist([]);};

  const doRoll=()=>{
    if(rolling||over||phase!=='idle')return;
    setRolling(true);
    let f=0;
    const iv=setInterval(()=>{
      setPDice(roll3());
      f++;
      if(f>7){
        clearInterval(iv);
        const pd=roll3();
        setPDice(pd);
        setTimeout(()=>{
          let f2=0;
          const iv2=setInterval(()=>{
            setAiDice(roll3());
            if(++f2>7){
              clearInterval(iv2);
              const ad=roll3();
              setAiDice(ad);
              setPhase('result');
              const ps=sum(pd),as=sum(ad);
              let m='',np=pWins,na=aiWins,nt=ties;
              if(ps>as){m=`🏆 You win round ${round}! (${ps} vs ${as})`;np++;}
              else if(as>ps){m=`${isAI?'🤖 AI':'P2'} wins round ${round}! (${as} vs ${ps})`;na++;}
              else{m=`⚖️ Tie round ${round}! (${ps} = ${as})`;nt++;}
              setMsg(m);setPWins(np);setAiWins(na);setTies(nt);
              setHist(h=>[...h,{round,ps,as,m}]);
              if(round>=ROUNDS)setOver(true);
              setRolling(false);
            }
          },70);
        },300);
      }
    },70);
  };

  const next=()=>{if(over)return;setRound(r=>r+1);setPhase('idle');setPDice([1,1,1]);setAiDice([1,1,1]);setMsg('');};

  const pSum=sum(pDice),aiSum=sum(aiDice);
  const final=over?(pWins>aiWins?'You':aiWins>pWins?isAI?'AI':'P2':'Draw'):null;

  return(
    <div className="game-shell" style={{maxWidth:460,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🎯'} Vault Duel</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {over&&<div className="winner-banner">{final==='Draw'?`⚖️ Draw! ${pWins}-${aiWins}`:final==='You'?`🏆 You Win! ${pWins}-${aiWins}`:`${isAI?'🤖 AI':'P2'} Wins! ${aiWins}-${pWins}`}</div>}

      <div style={{display:'flex',justifyContent:'space-around',marginBottom:14}}>
        <div className="bv-card" style={{padding:'8px 18px',textAlign:'center'}}>
          <div style={{fontSize:11,color:'#888'}}>You</div>
          <div style={{fontSize:28,color:'#e8b800',fontWeight:'bold'}}>{pWins}</div>
        </div>
        <div style={{textAlign:'center',alignSelf:'center'}}>
          <div style={{fontSize:13,color:'#888'}}>Round {Math.min(round,ROUNDS)}/{ROUNDS}</div>
          {ties>0&&<div style={{fontSize:11,color:'#555'}}>{ties} tied</div>}
        </div>
        <div className="bv-card" style={{padding:'8px 18px',textAlign:'center'}}>
          <div style={{fontSize:11,color:'#888'}}>{isAI?'AI':'P2'}</div>
          <div style={{fontSize:28,color:'#c0392b',fontWeight:'bold'}}>{aiWins}</div>
        </div>
      </div>

      <div style={{display:'flex',gap:20,justifyContent:'center',flexWrap:'wrap',marginBottom:14}}>
        <div>
          <div style={{color:'#888',fontSize:11,textAlign:'center',marginBottom:6}}>Your Roll</div>
          <div style={{display:'flex',gap:6}}>{pDice.map((v,i)=><Die key={i} v={v} hi={phase==='result'&&pSum>aiSum}/>)}</div>
          {phase!=='idle'&&<div style={{textAlign:'center',fontSize:16,color:'#e8b800',fontWeight:'bold',marginTop:5}}>{pSum}</div>}
        </div>
        <div style={{alignSelf:'center',fontSize:18,color:'#555'}}>VS</div>
        <div>
          <div style={{color:'#888',fontSize:11,textAlign:'center',marginBottom:6}}>{isAI?'AI Roll':'P2 Roll'}</div>
          <div style={{display:'flex',gap:6}}>
            {phase==='idle'?Array(3).fill(0).map((_,i)=><div key={i} style={{width:46,height:46,borderRadius:9,background:'#0a0a12',border:'2px solid #1a1a2a'}}/>):
              aiDice.map((v,i)=><Die key={i} v={v} hi={phase==='result'&&aiSum>pSum}/>)
            }
          </div>
          {phase==='result'&&<div style={{textAlign:'center',fontSize:16,color:'#c0392b',fontWeight:'bold',marginTop:5}}>{aiSum}</div>}
        </div>
      </div>

      {msg&&<div style={{textAlign:'center',padding:'8px 14px',background:'rgba(232,184,0,.06)',border:'1px solid rgba(232,184,0,.2)',borderRadius:8,marginBottom:12,fontSize:13,color:'#e0e0e0'}}>{msg}</div>}

      <div style={{display:'flex',gap:8,justifyContent:'center'}}>
        {phase==='idle'&&!over&&<button className="bv-button" style={{minWidth:130}} onClick={doRoll} disabled={rolling}>{rolling?'Rolling…':'🎲 Roll Dice'}</button>}
        {phase==='result'&&!over&&<button className="bv-button" style={{minWidth:130}} onClick={next}>Next Round →</button>}
        {over&&<button className="bv-button" onClick={reset}>Play Again</button>}
      </div>

      {hist.length>0&&(
        <div className="bv-card" style={{marginTop:14,padding:10}}>
          <div style={{color:'#888',fontSize:11,marginBottom:5}}>Round History</div>
          {hist.map((h,i)=><div key={i} style={{fontSize:11,color:'#555',marginBottom:2}}>R{h.round}: You {h.ps} vs {isAI?'AI':'P2'} {h.as} — {h.ps>h.as?'You win':h.as>h.ps?'They win':'Tie'}</div>)}
        </div>
      )}
    </div>
  );
}
