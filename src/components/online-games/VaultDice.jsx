import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Scoring ──────────────────────────────────────────────────────────────────
function counts(dice) {
  const ct = Array(7).fill(0);
  dice.forEach(d => ct[d]++);
  return ct;
}
function sum(dice) { return dice.reduce((a,b)=>a+b,0); }

function calcScore(cat, dice) {
  const ct = counts(dice), s = sum(dice);
  switch(cat) {
    case 'ones':   return ct[1]*1;
    case 'twos':   return ct[2]*2;
    case 'threes': return ct[3]*3;
    case 'fours':  return ct[4]*4;
    case 'fives':  return ct[5]*5;
    case 'sixes':  return ct[6]*6;
    case 'threeKind':  return ct.some(c=>c>=3) ? s : 0;
    case 'fourKind':   return ct.some(c=>c>=4) ? s : 0;
    case 'fullHouse':  return (ct.some(c=>c===3) && ct.some(c=>c===2)) ? 25 : 0;
    case 'smStraight': {
      const v=new Set(dice);
      return [[1,2,3,4],[2,3,4,5],[3,4,5,6]].some(r=>r.every(x=>v.has(x))) ? 30 : 0;
    }
    case 'lgStraight': {
      const v=new Set(dice);
      return ([[1,2,3,4,5],[2,3,4,5,6]].some(r=>r.every(x=>v.has(x)))) ? 40 : 0;
    }
    case 'yahtzee': return ct.some(c=>c>=5) ? 50 : 0;
    case 'chance':  return s;
    default: return 0;
  }
}

function upperTotal(sc) {
  return ['ones','twos','threes','fours','fives','sixes'].reduce((a,k)=>a+(sc[k]??0),0);
}

function grandTotal(sc, yahtzeeBonuses) {
  const upper = upperTotal(sc);
  const bonus = upper >= 63 ? 35 : 0;
  const lower = ['threeKind','fourKind','fullHouse','smStraight','lgStraight','yahtzee','chance'].reduce((a,k)=>a+(sc[k]??0),0);
  return upper + bonus + lower + (yahtzeeBonuses||0)*100;
}

// ─── AI strategy ─────────────────────────────────────────────────────────────
function aiBestScore(hand, dice) {
  let best = { cat:null, sc:-1 };
  for (const { key } of CATS) {
    if (hand[key] !== undefined) continue;
    const s = calcScore(key, dice);
    if (s > best.sc || (s===best.sc && Math.random()>.5)) best = { cat:key, sc:s };
  }
  if (!best.cat) {
    const uf = CATS.find(c=>hand[c.key]===undefined);
    if (uf) best.cat = uf.key;
  }
  return best;
}
function aiChooseHold(dice) {
  // Keep most frequent value, or straight partial
  const ct = counts(dice);
  const maxCt = Math.max(...ct.slice(1));
  const bestVal = ct.indexOf(maxCt);
  if (maxCt >= 3) return dice.map(d=>d===bestVal);
  // Look for straight potential
  const vals = new Set(dice);
  const runs = [[1,2,3,4,5],[2,3,4,5,6],[1,2,3,4],[2,3,4,5],[3,4,5,6]];
  for (const run of runs) {
    const has = run.filter(v=>vals.has(v)).length;
    if (has >= 3) return dice.map(d=>run.includes(d));
  }
  return dice.map(d=>d===bestVal);
}

// ─── Categories list ─────────────────────────────────────────────────────────
const CATS = [
  { key:'ones',       label:'Ones',            sec:'upper', hint:'Sum of all 1s' },
  { key:'twos',       label:'Twos',            sec:'upper', hint:'Sum of all 2s' },
  { key:'threes',     label:'Threes',          sec:'upper', hint:'Sum of all 3s' },
  { key:'fours',      label:'Fours',           sec:'upper', hint:'Sum of all 4s' },
  { key:'fives',      label:'Fives',           sec:'upper', hint:'Sum of all 5s' },
  { key:'sixes',      label:'Sixes',           sec:'upper', hint:'Sum of all 6s' },
  { key:'threeKind',  label:'3 of a Kind',     sec:'lower', hint:'Sum all dice' },
  { key:'fourKind',   label:'4 of a Kind',     sec:'lower', hint:'Sum all dice' },
  { key:'fullHouse',  label:'Full House',      sec:'lower', hint:'25 pts' },
  { key:'smStraight', label:'Sm. Straight',    sec:'lower', hint:'30 pts' },
  { key:'lgStraight', label:'Lg. Straight',    sec:'lower', hint:'40 pts' },
  { key:'yahtzee',    label:'YAHTZEE!',        sec:'lower', hint:'50 pts' },
  { key:'chance',     label:'Chance',          sec:'lower', hint:'Sum all dice' },
];

// ─── Pip die SVG ─────────────────────────────────────────────────────────────
const PIP_POS = {
  1: [[50,50]],
  2: [[25,25],[75,75]],
  3: [[25,25],[50,50],[75,75]],
  4: [[25,25],[75,25],[25,75],[75,75]],
  5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
  6: [[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]],
};
function DieSVG({ value, held, rolling, onClick, size=56 }) {
  const pips = PIP_POS[value] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" onClick={onClick}
      style={{
        cursor: onClick?'pointer':'default', flexShrink:0,
        borderRadius:14, overflow:'visible',
        filter: held ? 'drop-shadow(0 0 10px #e8b800) drop-shadow(0 0 2px #e8b800)' : rolling ? 'none' : 'drop-shadow(0 2px 5px rgba(0,0,0,.6))',
        transition:'filter .15s, transform .15s',
        transform: held ? 'translateY(-10px)' : 'none',
        animation: rolling ? `dieRoll .08s ease-in-out infinite` : 'none',
      }}>
      {/* Die body */}
      <rect x="4" y="4" width="92" height="92" rx="16"
        fill={held ? '#2a2a0a' : '#f0ede6'} stroke={held ? '#e8b800' : '#c8c0b0'} strokeWidth={held?3:2}/>
      {/* Pips */}
      {pips.map(([px,py],i)=>(
        <circle key={i} cx={px} cy={py} r="8.5" fill={held?'#e8b800':'#1a1a2a'}/>
      ))}
    </svg>
  );
}

// ─── HTP ─────────────────────────────────────────────────────────────────────
const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Yahtzee</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4><p>Fill all 13 categories with the highest scores. Most points wins.</p>
        <h4>Each Turn</h4>
        <ul>
          <li>Roll up to 3 times.</li>
          <li>After each roll, click dice to <b>hold</b> them (gold = held, lifted).</li>
          <li>Held dice are kept on your next roll.</li>
          <li>After rolling at least once, click a score row to lock it in.</li>
        </ul>
        <h4>Upper Bonus</h4>
        <p>Score ≥ 63 in the top section → +35 bonus!</p>
        <h4>Yahtzee Bonus</h4>
        <p>If you roll a Yahtzee again after already scoring 50 in the Yahtzee box, you get +100 bonus per additional Yahtzee!</p>
        <h4>Scoring Tips</h4>
        <ul>
          <li><b>Full House:</b> 3 of one number + 2 of another = 25 pts.</li>
          <li><b>Sm. Straight:</b> 4 consecutive numbers (e.g. 1-2-3-4) = 30 pts.</li>
          <li><b>Lg. Straight:</b> 5 consecutive (e.g. 2-3-4-5-6) = 40 pts.</li>
          <li><b>YAHTZEE:</b> All 5 the same = 50 pts!</li>
        </ul>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function VaultDice(props) {
  const { onBack, onExit, gameMode, game } = props || {};
  const exit = onBack || onExit || null;
  const isAI = gameMode === 'ai' || gameMode === 'computer';

  const [dice, setDice]   = useState([1,2,3,4,5]);
  const [held, setHeld]   = useState([false,false,false,false,false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [rolling, setRolling] = useState(false);
  const [pSc, setPSc]     = useState({});
  const [aSc, setASc]     = useState({});
  const [pBon, setPBon]   = useState(0); // Yahtzee bonus count player
  const [aBon, setABon]   = useState(0); // Yahtzee bonus count AI
  const [cp, setCp]       = useState(0); // 0=player, 1=ai
  const [rd, setRd]       = useState(1); // round number (triggers AI)
  const [hasRolled, setHasRolled] = useState(false);
  const [aiThink, setAiThink] = useState(false);
  const [over, setOver]   = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const rollIntvRef = useRef(null);

  const allDone = (ps, as) => CATS.every(c=>ps[c.key]!==undefined) && (!isAI || CATS.every(c=>as[c.key]!==undefined));

  const reset = () => {
    setDice([1,2,3,4,5]); setHeld([false,false,false,false,false]); setRollsLeft(3);
    setRolling(false); setPSc({}); setASc({}); setPBon(0); setABon(0); setCp(0);
    setRd(1); setHasRolled(false); setAiThink(false); setOver(false);
  };

  const randomDice = (h) => dice.map((v,i)=>h[i]?v:Math.floor(Math.random()*6)+1);

  // ── Roll dice ────────────────────────────────────────────────────────────────
  const doRoll = useCallback(() => {
    if (rollsLeft<=0 || rolling || over || (isAI && cp===1)) return;
    setRolling(true);
    let f=0;
    rollIntvRef.current = setInterval(()=>{
      setDice(d=>d.map((v,i)=>held[i]?v:Math.floor(Math.random()*6)+1));
      if(++f>7){
        clearInterval(rollIntvRef.current);
        const finalDice = randomDice(held);
        setDice(finalDice);
        setRollsLeft(r=>r-1);
        setHasRolled(true);
        setRolling(false);
      }
    }, 65);
  }, [rollsLeft, rolling, over, cp, isAI, held, dice]);

  useEffect(()=>()=>clearInterval(rollIntvRef.current),[]);

  // ── Score a category ─────────────────────────────────────────────────────────
  const doScore = (key) => {
    if (!hasRolled || over || (isAI && cp===1)) return;
    const sc = cp===0 ? pSc : aSc;
    if (sc[key]!==undefined) return;
    const s = calcScore(key, dice);

    // Yahtzee bonus check
    let bonusAdd = 0;
    if (key==='yahtzee' && s===50) { /* first yahtzee */ }
    else if (s===50 && calcScore('yahtzee',dice)===50 && sc['yahtzee']===50) { bonusAdd=1; }

    if (cp===0) {
      const ns={...pSc,[key]:s}; setPSc(ns); if(bonusAdd) setPBon(b=>b+bonusAdd);
      nextTurn(ns, aSc);
    } else {
      const ns={...aSc,[key]:s}; setASc(ns); if(bonusAdd) setABon(b=>b+bonusAdd);
      nextTurn(pSc, ns);
    }
  };

  const nextTurn = (ps, as) => {
    if (allDone(ps,as)) { setOver(true); return; }
    const nx=(cp+1)%2;
    if(!isAI && nx===1){
      // 2P local: AI slot becomes P2
    }
    setCp(nx);
    setDice([1,2,3,4,5]); setHeld([false,false,false,false,false]);
    setRollsLeft(3); setHasRolled(false); setRd(r=>r+1);
  };

  // ── AI turn ──────────────────────────────────────────────────────────────────
  useEffect(()=>{
    if (!isAI || cp!==1 || over) return;
    let myDice=[1,2,3,4,5], myHeld=[false,false,false,false,false];
    let cancelled=false;
    setAiThink(true);
    (async()=>{
      for(let roll=0;roll<3&&!cancelled;roll++){
        // Roll animation
        for(let f=0;f<6;f++){
          await new Promise(r=>setTimeout(r,55));
          if(cancelled) return;
          myDice = myDice.map((v,i)=>myHeld[i]?v:Math.floor(Math.random()*6)+1);
          setDice([...myDice]);
        }
        setRollsLeft(3-roll-1);
        setHasRolled(true);
        // Hold best
        myHeld = aiChooseHold(myDice);
        setHeld([...myHeld]);
        // Check if best score is good enough
        const {sc:bs} = aiBestScore(aSc, myDice);
        if (bs>=30) break;
        await new Promise(r=>setTimeout(r,350));
      }
      if(cancelled) return;
      await new Promise(r=>setTimeout(r,400));
      if(cancelled) return;
      const {cat,sc:s} = aiBestScore(aSc, myDice);
      if(cat){
        setASc(prev=>{
          const ns={...prev,[cat]:s};
          nextTurn(pSc, ns);
          return ns;
        });
      }
      setAiThink(false);
    })();
    return ()=>{cancelled=true;};
  },[cp,isAI,over,rd]);

  // ── Computed totals ───────────────────────────────────────────────────────────
  const pTotal = grandTotal(pSc, pBon);
  const aTotal = grandTotal(aSc, aBon);
  const upP = upperTotal(pSc);
  const upA = upperTotal(aSc);

  // potential scores for current dice
  const potential = {};
  if (hasRolled && cp===0) {
    CATS.forEach(c=>{ if(pSc[c.key]===undefined) potential[c.key]=calcScore(c.key,dice); });
  }

  return (
    <div className="game-shell" style={{ maxWidth:560, margin:'0 auto' }}>
      {showHelp && <HTP onClose={()=>setShowHelp(false)} />}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🎲'} Yahtzee</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {over && (
        <div className="winner-banner">
          {!isAI
            ? `Game over! Player 1: ${pTotal} · Player 2: ${aTotal} · ${pTotal>aTotal?'P1 Wins!':aTotal>pTotal?'P2 Wins!':'Draw!'}`
            : pTotal>aTotal ? `🏆 You Win! ${pTotal} vs ${aTotal}`
            : aTotal>pTotal ? `🤖 AI Wins! ${aTotal} vs ${pTotal}`
            : `⚖️ Draw! ${pTotal} each`}
        </div>
      )}

      {/* Score totals */}
      <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:12,flexWrap:'wrap'}}>
        <div className="bv-card" style={{padding:'8px 18px',textAlign:'center',border:cp===0&&!over?'1px solid #e8b800':''}}>
          <div style={{fontSize:10,color:'#888'}}>You{cp===0&&!over?' ←':''}</div>
          <div style={{fontSize:26,color:'#e8b800',fontWeight:'bold'}}>{pTotal}</div>
          {pBon>0&&<div style={{fontSize:10,color:'#f39c12'}}>+{pBon*100} bonus</div>}
        </div>
        {isAI && (
          <div className="bv-card" style={{padding:'8px 18px',textAlign:'center',border:cp===1&&!over?'1px solid #c0392b':''}}>
            <div style={{fontSize:10,color:'#888'}}>🤖 AI{cp===1&&!over?' ←':''}</div>
            <div style={{fontSize:26,color:'#c0392b',fontWeight:'bold'}}>{aTotal}</div>
            {aBon>0&&<div style={{fontSize:10,color:'#f39c12'}}>+{aBon*100} bonus</div>}
          </div>
        )}
      </div>

      {/* Turn indicator */}
      {!over && (
        <div className="turn-indicator">
          {aiThink ? '🤖 AI rolling…' :
           cp===0 ? `🎲 Your turn — ${rollsLeft} roll${rollsLeft!==1?'s':''} left` :
           '🤖 AI turn'}
        </div>
      )}

      {/* Dice */}
      <div style={{display:'flex',gap:10,justifyContent:'center',margin:'18px 0',flexWrap:'wrap'}}>
        {dice.map((v,i)=>(
          <DieSVG key={i} value={v} held={held[i]} rolling={rolling&&!held[i]}
            size={58}
            onClick={cp===0&&hasRolled&&!over&&!rolling ? ()=>setHeld(h=>{const n=[...h];n[i]=!n[i];return n;}) : undefined}
          />
        ))}
      </div>

      {held.some(h=>h) && (
        <div style={{textAlign:'center',fontSize:11,color:'#888',marginBottom:6}}>
          ✋ Gold = held · tap to release
        </div>
      )}

      {/* Roll button */}
      {cp===0&&!over&&(
        <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
          <button className="bv-button" style={{fontSize:15,padding:'10px 36px'}}
            onClick={doRoll} disabled={rollsLeft<=0||rolling||aiThink}>
            {rolling?'Rolling…':rollsLeft<=0?'Score a category':'Roll Dice 🎲'}
          </button>
        </div>
      )}

      {/* Score sheet */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
        {['upper','lower'].map(sec=>(
          <div key={sec} className="bv-card" style={{flex:1,minWidth:220,padding:10}}>
            <div style={{color:'#e8b800',fontSize:12,fontWeight:'bold',marginBottom:6,borderBottom:'1px solid #2a2a3a',paddingBottom:4}}>
              {sec==='upper'
                ? `UPPER SECTION — ${upP}/63${upP>=63?' ✓ +35 BONUS':''}`
                : `LOWER SECTION${pBon||aBon?' (Yahtzee bonus: +'+(pBon?pBon*100:aBon*100)+')':''}`}
            </div>
            {CATS.filter(c=>c.sec===sec).map(cat=>{
              const pv=pSc[cat.key], av=aSc[cat.key];
              const pot=potential[cat.key];
              const canScore=cp===0&&hasRolled&&pv===undefined&&!over;
              return (
                <div key={cat.key} onClick={()=>canScore&&doScore(cat.key)}
                  title={cat.hint}
                  style={{
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'5px 6px',borderRadius:5,marginBottom:2,
                    background:canScore?'rgba(232,184,0,.06)':'transparent',
                    border:canScore?'1px solid rgba(232,184,0,.2)':'1px solid transparent',
                    cursor:canScore?'pointer':'default',transition:'background .1s',
                  }}>
                  <span style={{fontSize:12,color:pv!==undefined||av!==undefined?'#e0e0e0':'#777'}}>
                    {cat.label}
                  </span>
                  <div style={{display:'flex',gap:14}}>
                    <span style={{
                      fontSize:12,minWidth:28,textAlign:'right',fontWeight:'bold',
                      color:pv!==undefined?'#4caf50':pot!==undefined?(pot>0?'rgba(76,175,80,.65)':'rgba(255,80,80,.4)'):'#444',
                    }}>
                      {pv!==undefined?pv:pot!==undefined?`(${pot})`:'—'}
                    </span>
                    {isAI&&(
                      <span style={{fontSize:12,minWidth:28,textAlign:'right',fontWeight:'bold',color:av!==undefined?'#f44336':'#444'}}>
                        {av!==undefined?av:'—'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {sec==='upper'&&(
              <div style={{display:'flex',justifyContent:'flex-end',gap:14,marginTop:4,paddingTop:4,borderTop:'1px solid #2a2a3a',fontSize:11,color:'#555'}}>
                <span>You: {upP}</span>
                {isAI&&<span>AI: {upA}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{textAlign:'center',fontSize:11,color:'#444',marginTop:8}}>
        Green scores = locked in · ( grey ) = potential this roll · click to score
      </div>
      <style>{`@keyframes dieRoll{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}`}</style>
    </div>
  );
}
