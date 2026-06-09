import React, { useState, useCallback, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   MYSTERY FACES — Guess Who? style game
   • 24 character cards on a visual board
   • Click a card to flip it down (eliminate)
   • Ask yes/no questions — AI answers truthfully
   • AI also eliminates from its own board
   • First player to correctly name the secret character wins
───────────────────────────────────────────────────────────────────────────── */

const CHARS = [
  { id:1,  name:'Aria',    f:'👩',   hair:'brown', eyes:'blue',  glasses:false, beard:false, hat:false,  bg:'#c0392b' },
  { id:2,  name:'Boris',   f:'🧔',   hair:'black', eyes:'brown', glasses:false, beard:true,  hat:false,  bg:'#8e44ad' },
  { id:3,  name:'Clara',   f:'👩‍🦳',  hair:'white', eyes:'blue',  glasses:true,  beard:false, hat:false,  bg:'#2980b9' },
  { id:4,  name:'Diego',   f:'👨‍🦲',  hair:'bald',  eyes:'brown', glasses:false, beard:true,  hat:true,   bg:'#27ae60' },
  { id:5,  name:'Elara',   f:'👩‍🦰',  hair:'red',   eyes:'green', glasses:false, beard:false, hat:false,  bg:'#e67e22' },
  { id:6,  name:'Felix',   f:'👨',   hair:'brown', eyes:'blue',  glasses:true,  beard:false, hat:false,  bg:'#16a085' },
  { id:7,  name:'Grace',   f:'👱‍♀️',  hair:'blond', eyes:'green', glasses:false, beard:false, hat:true,   bg:'#d35400' },
  { id:8,  name:'Hiro',    f:'🧑‍🦱',  hair:'black', eyes:'brown', glasses:true,  beard:false, hat:false,  bg:'#1abc9c' },
  { id:9,  name:'Iris',    f:'👩‍🦱',  hair:'brown', eyes:'brown', glasses:false, beard:false, hat:false,  bg:'#9b59b6' },
  { id:10, name:'Jake',    f:'👨‍🦰',  hair:'red',   eyes:'blue',  glasses:false, beard:true,  hat:false,  bg:'#2c3e50' },
  { id:11, name:'Kira',    f:'👧',   hair:'blond', eyes:'blue',  glasses:false, beard:false, hat:false,  bg:'#f39c12' },
  { id:12, name:'Leo',     f:'🧓',   hair:'white', eyes:'brown', glasses:true,  beard:true,  hat:false,  bg:'#7f8c8d' },
  { id:13, name:'Mia',     f:'👩‍🦲',  hair:'bald',  eyes:'brown', glasses:false, beard:false, hat:true,   bg:'#e74c3c' },
  { id:14, name:'Noel',    f:'👴',   hair:'white', eyes:'blue',  glasses:true,  beard:true,  hat:true,   bg:'#3498db' },
  { id:15, name:'Olive',   f:'👵',   hair:'white', eyes:'green', glasses:false, beard:false, hat:false,  bg:'#1abc9c' },
  { id:16, name:'Pedro',   f:'👨‍🦱',  hair:'black', eyes:'brown', glasses:false, beard:false, hat:true,   bg:'#e67e22' },
  { id:17, name:'Quinn',   f:'🧑‍🦰',  hair:'red',   eyes:'brown', glasses:false, beard:false, hat:false,  bg:'#8e44ad' },
  { id:18, name:'Rosa',    f:'👱',   hair:'blond', eyes:'brown', glasses:true,  beard:false, hat:false,  bg:'#27ae60' },
  { id:19, name:'Sam',     f:'🧑',   hair:'brown', eyes:'blue',  glasses:false, beard:false, hat:true,   bg:'#c0392b' },
  { id:20, name:'Tanya',   f:'👩‍🦱',  hair:'black', eyes:'green', glasses:true,  beard:false, hat:false,  bg:'#2980b9' },
  { id:21, name:'Umar',    f:'🧔‍♂️',  hair:'black', eyes:'brown', glasses:false, beard:true,  hat:true,   bg:'#16a085' },
  { id:22, name:'Vera',    f:'👩‍🦰',  hair:'red',   eyes:'blue',  glasses:true,  beard:false, hat:false,  bg:'#d35400' },
  { id:23, name:'Walt',    f:'👨‍🦳',  hair:'white', eyes:'brown', glasses:false, beard:true,  hat:false,  bg:'#7f8c8d' },
  { id:24, name:'Xena',    f:'👱‍♀️',  hair:'blond', eyes:'green', glasses:false, beard:false, hat:true,   bg:'#9b59b6' },
];

const QUESTIONS = [
  { id:'hair_brown',  text:'Does your person have brown hair?',   attr:'hair',    val:'brown'  },
  { id:'hair_blond',  text:'Does your person have blond hair?',   attr:'hair',    val:'blond'  },
  { id:'hair_black',  text:'Does your person have black hair?',   attr:'hair',    val:'black'  },
  { id:'hair_red',    text:'Does your person have red hair?',     attr:'hair',    val:'red'    },
  { id:'hair_white',  text:'Does your person have white hair?',   attr:'hair',    val:'white'  },
  { id:'hair_bald',   text:'Is your person bald?',               attr:'hair',    val:'bald'   },
  { id:'eyes_blue',   text:'Does your person have blue eyes?',    attr:'eyes',    val:'blue'   },
  { id:'eyes_brown',  text:'Does your person have brown eyes?',   attr:'eyes',    val:'brown'  },
  { id:'eyes_green',  text:'Does your person have green eyes?',   attr:'eyes',    val:'green'  },
  { id:'glasses',     text:'Does your person wear glasses?',      attr:'glasses', val:true     },
  { id:'beard',       text:'Does your person have a beard?',      attr:'beard',   val:true     },
  { id:'hat',         text:'Does your person wear a hat?',        attr:'hat',     val:true     },
];

function answers(char, q) {
  return char[q.attr] === q.val;
}

// Characters remaining after AI eliminates based on answers
function filterByAnswer(chars, q, ans) {
  return chars.filter(c => answers(c, q) === ans);
}

// ── Face Card ─────────────────────────────────────────────────────────────────
function FaceCard({ char, flipped, onClick, highlight, secret }) {
  return (
    <div
      onClick={!flipped ? onClick : undefined}
      style={{
        width: 76, height: 100,
        borderRadius: 10,
        background: flipped ? '#111' : char.bg + '22',
        border: highlight ? '2px solid #e8b800'
              : flipped   ? '1px solid #222'
              : `2px solid ${char.bg}55`,
        cursor: flipped ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all .2s',
        flexShrink: 0,
        boxShadow: highlight ? `0 0 16px ${char.bg}88` : 'none',
      }}
      title={`${char.name}${flipped ? ' (eliminated)' : ''}`}
    >
      {/* Colour bar at top */}
      <div style={{
        height: 8, background: flipped ? '#333' : char.bg,
        transition: 'background .3s',
      }}/>

      {/* Face */}
      <div style={{
        textAlign: 'center', padding: '6px 2px 2px',
        fontSize: 34, lineHeight: 1,
        opacity: flipped ? 0.1 : 1,
        filter: flipped ? 'grayscale(1)' : 'none',
        transition: 'all .3s',
      }}>
        {char.f}
      </div>

      {/* Name */}
      <div style={{
        textAlign: 'center', fontSize: 9, fontWeight: 'bold',
        color: flipped ? '#333' : '#e0e0e0',
        padding: '2px 3px 4px',
        letterSpacing: 0.3,
        transition: 'color .3s',
      }}>
        {char.name.toUpperCase()}
      </div>

      {/* Attribute dots */}
      {!flipped && (
        <div style={{ display:'flex', gap:2, justifyContent:'center', paddingBottom:4 }}>
          {char.glasses && <span style={{fontSize:8}}>👓</span>}
          {char.beard   && <span style={{fontSize:8}}>🧔</span>}
          {char.hat     && <span style={{fontSize:8}}>🎩</span>}
        </div>
      )}

      {/* Flipped overlay — shows the "fold" */}
      {flipped && (
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(160deg,#0a0a0a 60%,#181818)',
          display:'flex', alignItems:'center', justifyContent:'center',
          borderRadius: 10,
        }}>
          <div style={{ fontSize:20, opacity:0.15 }}>╳</div>
        </div>
      )}

      {/* Secret indicator */}
      {secret && !flipped && (
        <div style={{
          position:'absolute', top:10, right:4,
          width:12, height:12, borderRadius:'50%',
          background:'#e8b800',
          boxShadow:'0 0 6px #e8b800',
        }}/>
      )}
    </div>
  );
}

// ── HTP ──────────────────────────────────────────────────────────────────────
function HTP({ onClose }) {
  return (
    <div className="htp-overlay" onClick={onClose}>
      <div className="htp-box" onClick={e => e.stopPropagation()}>
        <div className="htp-header">
          <p className="htp-title">How to Play — Mystery Faces</p>
          <button className="bv-button secondary" onClick={onClose}>✕</button>
        </div>
        <div className="htp-body">
          <h4>Objective</h4>
          <p>Find out which of the 24 mystery faces the AI has secretly chosen.</p>
          <h4>How to Play</h4>
          <ul>
            <li>The AI picks a <b>secret character</b> (the glowing gold dot on your board shows which faces are still possible for you to guess).</li>
            <li>Click a question from the list — the AI answers <b>Yes</b> or <b>No</b>.</li>
            <li>If the answer is No, click any faces on your board that don't match to <b>flip them down</b> (eliminate them). You can also flip manually.</li>
            <li>When only one face is left standing, you know who it is!</li>
            <li>Click <b>Make Guess</b> and choose who you think it is.</li>
          </ul>
          <h4>Tips</h4>
          <ul>
            <li>Ask about hair colour first — eliminates ~⅙ of the board per question.</li>
            <li>Glasses and beard questions are powerful eliminations.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MysteryFaces(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;

  const pickSecret = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  const [secret, setSecret] = useState(pickSecret);
  const [flipped, setFlipped] = useState(new Set());       // eliminated by player
  const [asked, setAsked]   = useState([]);                // [{q, ans}]
  const [guessing, setGuessing] = useState(false);
  const [guess, setGuess]   = useState(CHARS[0]);
  const [result, setResult] = useState(null);              // 'win' | 'lose'
  const [showHelp, setShowHelp] = useState(false);
  const [lastQA, setLastQA] = useState(null);              // {q, ans} for the last question
  const [aiElim, setAiElim] = useState(new Set());         // AI eliminated from ITS board
  const [aiRemaining, setAiRemaining] = useState([...CHARS]);

  const reset = () => {
    const s = pickSecret();
    setSecret(s);
    setFlipped(new Set());
    setAsked([]);
    setGuessing(false);
    setGuess(CHARS[0]);
    setResult(null);
    setLastQA(null);
    setAiElim(new Set());
    setAiRemaining([...CHARS]);
  };

  // ── Ask a question ──────────────────────────────────────────────────────────
  const handleAsk = useCallback((q) => {
    if (result || asked.some(a => a.q.id === q.id)) return;
    const ans = answers(secret, q);
    const newAsked = [...asked, { q, ans }];
    setAsked(newAsked);
    setLastQA({ q, ans });

    // AI eliminates from its own board
    setAiRemaining(prev => filterByAnswer(prev, q, answers(secret, q)));

    // Auto-flip player's board cards that are eliminated by this answer
    const newFlipped = new Set(flipped);
    CHARS.forEach(c => {
      if (newFlipped.has(c.id)) return;  // already flipped
      const charMatches = answers(c, q) === ans;
      if (!charMatches) newFlipped.add(c.id); // this char is ruled out
    });
    setFlipped(newFlipped);
  }, [secret, asked, flipped, result]);

  // ── Flip a card manually ───────────────────────────────────────────────────
  const handleFlip = (char) => {
    if (result) return;
    const nf = new Set(flipped);
    if (nf.has(char.id)) nf.delete(char.id); // unflip
    else nf.add(char.id);
    setFlipped(nf);
  };

  // ── Final guess ────────────────────────────────────────────────────────────
  const handleGuess = () => {
    setResult(guess.id === secret.id ? 'win' : 'lose');
    setGuessing(false);
  };

  // Active (non-flipped) chars
  const active = CHARS.filter(c => !flipped.has(c.id));

  return (
    <div className="game-shell" style={{ maxWidth: 860, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🕵️'} Mystery Faces</h2>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {/* Result banner */}
      {result === 'win' && (
        <div className="winner-banner">🏆 Correct! It was <b>{secret.name}</b> {secret.f}</div>
      )}
      {result === 'lose' && (
        <div className="winner-banner" style={{ color:'#f44' }}>
          ❌ Wrong! The mystery face was <b>{secret.name}</b> {secret.f}
        </div>
      )}

      {!result && (
        <div className="turn-indicator">
          {active.length === 1
            ? `Only 1 face remaining — make your guess!`
            : `${active.length} faces remaining · Click a question to narrow it down`}
        </div>
      )}

      {/* Last answer */}
      {lastQA && !result && (
        <div style={{
          padding:'8px 14px', borderRadius:8, marginBottom:10,
          background: lastQA.ans ? 'rgba(76,175,80,.12)' : 'rgba(244,67,54,.1)',
          border: `1px solid ${lastQA.ans ? 'rgba(76,175,80,.3)' : 'rgba(244,67,54,.3)'}`,
          fontSize:13,
        }}>
          {lastQA.q.text}
          <span style={{
            marginLeft:10, fontWeight:'bold',
            color: lastQA.ans ? '#4caf50' : '#f44336',
            fontSize:15,
          }}>
            {lastQA.ans ? 'YES ✓' : 'NO ✗'}
          </span>
        </div>
      )}

      <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-start' }}>

        {/* ── FACE BOARD ──────────────────────────────────────────────── */}
        <div style={{ flex:'1 1 460px' }}>
          {/* Board frame */}
          <div style={{
            background:'linear-gradient(160deg,#12121e,#0a0a14)',
            border:'2px solid rgba(232,184,0,.25)',
            borderRadius:16, padding:'16px 12px',
            boxShadow:'inset 0 0 60px rgba(0,0,0,.5)',
          }}>
            <div style={{ color:'#e8b800', fontSize:11, fontWeight:'bold', letterSpacing:2, marginBottom:12, textAlign:'center' }}>
              MYSTERY FACES BOARD
            </div>

            {/* 6-column grid of face cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
              {CHARS.map(char => (
                <FaceCard
                  key={char.id}
                  char={char}
                  flipped={flipped.has(char.id)}
                  onClick={() => handleFlip(char)}
                  highlight={false}
                />
              ))}
            </div>

            <div style={{ textAlign:'center', fontSize:10, color:'#555', marginTop:10 }}>
              Click a face to flip it down · Click again to restore
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Questions + Controls ──────────────────────── */}
        <div style={{ flex:'0 0 260px', display:'flex', flexDirection:'column', gap:10 }}>

          {!guessing && !result && (
            <div className="bv-card" style={{ padding:12 }}>
              <div style={{ color:'#e8b800', fontSize:12, fontWeight:'bold', marginBottom:8 }}>
                Ask a Question
              </div>
              {QUESTIONS.map(q => {
                const alreadyAsked = asked.some(a => a.q.id === q.id);
                return (
                  <button key={q.id} onClick={() => !alreadyAsked && handleAsk(q)}
                    disabled={alreadyAsked}
                    style={{
                      display:'block', width:'100%', textAlign:'left',
                      marginBottom:5, padding:'7px 10px', borderRadius:7,
                      fontSize:11,
                      background: alreadyAsked ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.05)',
                      border: alreadyAsked ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(255,255,255,.1)',
                      color: alreadyAsked ? '#444' : '#e0e0e0',
                      cursor: alreadyAsked ? 'default' : 'pointer',
                    }}>
                    {q.text}
                    {alreadyAsked && (
                      <span style={{
                        marginLeft:8, fontWeight:'bold',
                        color: asked.find(a=>a.q.id===q.id)?.ans ? '#4caf50' : '#f44',
                      }}>
                        {asked.find(a=>a.q.id===q.id)?.ans ? 'YES' : 'NO'}
                      </span>
                    )}
                  </button>
                );
              })}

              <button className="bv-button" style={{ width:'100%', marginTop:10 }}
                onClick={() => setGuessing(true)}>
                🔍 Make Guess
              </button>
            </div>
          )}

          {/* Guess panel */}
          {guessing && !result && (
            <div className="bv-card" style={{ padding:12, borderColor:'rgba(232,184,0,.3)' }}>
              <div style={{ color:'#e8b800', fontSize:13, fontWeight:'bold', marginBottom:10 }}>
                Who is it?
              </div>
              <select
                value={guess.id}
                onChange={e => setGuess(CHARS.find(c => c.id === +e.target.value))}
                style={{
                  width:'100%', background:'#1a1a2e', color:'#e0e0e0',
                  border:'1px solid #2a2a4a', borderRadius:8, padding:'8px 10px', fontSize:13, marginBottom:10,
                }}
              >
                {CHARS.filter(c => !flipped.has(c.id)).map(c => (
                  <option key={c.id} value={c.id}>{c.f} {c.name}</option>
                ))}
              </select>
              <button className="bv-button" style={{ width:'100%' }} onClick={handleGuess}>
                Confirm Guess!
              </button>
              <button className="bv-button secondary" style={{ width:'100%', marginTop:6 }}
                onClick={() => setGuessing(false)}>
                ← Back
              </button>
            </div>
          )}

          {/* Q&A History */}
          {asked.length > 0 && (
            <div className="bv-card" style={{ padding:10, maxHeight:200, overflowY:'auto' }}>
              <div style={{ color:'#888', fontSize:11, marginBottom:6 }}>Q&amp;A Log</div>
              {[...asked].reverse().map((a,i) => (
                <div key={i} style={{ fontSize:11, marginBottom:4, color:'#e0e0e0' }}>
                  {a.q.text}
                  <span style={{ marginLeft:6, fontWeight:'bold', color:a.ans?'#4caf50':'#f44' }}>
                    {a.ans?'YES':'NO'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Active count */}
          <div className="bv-card" style={{ padding:10 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>Board Status</div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
              <span style={{ color:'#e0e0e0' }}>Still standing:</span>
              <span style={{ color: active.length===1?'#e8b800':'#4caf50', fontWeight:'bold' }}>{active.length}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginTop:4 }}>
              <span style={{ color:'#e0e0e0' }}>Eliminated:</span>
              <span style={{ color:'#888', fontWeight:'bold' }}>{flipped.size}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginTop:4 }}>
              <span style={{ color:'#e0e0e0' }}>Questions asked:</span>
              <span style={{ color:'#888', fontWeight:'bold' }}>{asked.length}</span>
            </div>
          </div>

          {/* Reveal after game */}
          {result && (
            <div className="bv-card" style={{ padding:14, textAlign:'center', borderColor:`${secret.bg}55` }}>
              <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>The secret was:</div>
              <div style={{ fontSize:52 }}>{secret.f}</div>
              <div style={{ fontSize:16, color:secret.bg, fontWeight:'bold' }}>{secret.name}</div>
              <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, color:'#888', background:'rgba(255,255,255,.05)', padding:'2px 6px', borderRadius:4 }}>
                  {secret.hair} hair
                </span>
                <span style={{ fontSize:10, color:'#888', background:'rgba(255,255,255,.05)', padding:'2px 6px', borderRadius:4 }}>
                  {secret.eyes} eyes
                </span>
                {secret.glasses && <span style={{ fontSize:10, color:'#888', background:'rgba(255,255,255,.05)', padding:'2px 6px', borderRadius:4 }}>glasses</span>}
                {secret.beard   && <span style={{ fontSize:10, color:'#888', background:'rgba(255,255,255,.05)', padding:'2px 6px', borderRadius:4 }}>beard</span>}
                {secret.hat     && <span style={{ fontSize:10, color:'#888', background:'rgba(255,255,255,.05)', padding:'2px 6px', borderRadius:4 }}>hat</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
