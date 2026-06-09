import React, { useState, useCallback } from 'react';

const COLORS = [
  { id:'red',    label:'Red',    hex:'#c0392b' },
  { id:'blue',   label:'Blue',   hex:'#2980b9' },
  { id:'green',  label:'Green',  hex:'#27ae60' },
  { id:'yellow', label:'Yellow', hex:'#f39c12' },
  { id:'purple', label:'Purple', hex:'#8e44ad' },
  { id:'orange', label:'Orange', hex:'#e67e22' },
];

const CODE_LEN = 4;
const MAX_GUESSES = 10;

function makeSecret() {
  const secret = [];
  for (let i = 0; i < CODE_LEN; i++) {
    secret.push(COLORS[Math.floor(Math.random() * COLORS.length)].id);
  }
  return secret;
}

function score(secret, guess) {
  let blacks = 0, whites = 0;
  const sLeft = [], gLeft = [];
  for (let i = 0; i < CODE_LEN; i++) {
    if (secret[i] === guess[i]) blacks++;
    else { sLeft.push(secret[i]); gLeft.push(guess[i]); }
  }
  for (const g of gLeft) {
    const idx = sLeft.indexOf(g);
    if (idx >= 0) { whites++; sLeft.splice(idx, 1); }
  }
  return { blacks, whites };
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Mastermind</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4>
        <p>Crack the secret 4-colour code in {MAX_GUESSES} guesses.</p>
        <h4>Making a Guess</h4>
        <ul>
          <li>Click the coloured buttons to fill each position in your guess row.</li>
          <li>Click <b>Submit</b> when all 4 positions are filled.</li>
        </ul>
        <h4>Feedback Pegs</h4>
        <ul>
          <li>⚫ <b>Black peg</b> = right colour, right position.</li>
          <li>⬜ <b>White peg</b> = right colour, wrong position.</li>
          <li>No peg = colour not in the code at all.</li>
        </ul>
        <p>4 black pegs = you cracked the code!</p>
      </div>
    </div>
  </div>
);

export default function Mastermind(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;

  const [secret, setSecret]     = useState(makeSecret);
  const [guesses, setGuesses]   = useState([]); // [{guess:[], blacks, whites}]
  const [current, setCurrent]   = useState(Array(CODE_LEN).fill(null));
  const [selectedColor, setSelectedColor] = useState(COLORS[0].id);
  const [won, setWon]           = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showHelp, setShowHelp]  = useState(false);

  const reset = () => {
    setSecret(makeSecret());
    setGuesses([]);
    setCurrent(Array(CODE_LEN).fill(null));
    setSelectedColor(COLORS[0].id);
    setWon(false);
    setShowSecret(false);
  };

  const over = won || guesses.length >= MAX_GUESSES;

  const fillPos = (pos) => {
    if (over) return;
    setCurrent(c => { const n = [...c]; n[pos] = selectedColor; return n; });
  };

  const clearPos = (pos) => {
    if (over) return;
    setCurrent(c => { const n = [...c]; n[pos] = null; return n; });
  };

  const submit = () => {
    if (over || current.some(c => !c)) return;
    const { blacks, whites } = score(secret, current);
    const newGuess = { guess: [...current], blacks, whites };
    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);
    if (blacks === CODE_LEN) { setWon(true); setShowSecret(true); return; }
    if (newGuesses.length >= MAX_GUESSES) { setShowSecret(true); }
    setCurrent(Array(CODE_LEN).fill(null));
  };

  const colorOf = (id) => COLORS.find(c => c.id === id)?.hex || '#333';

  return (
    <div className="game-shell" style={{ maxWidth: 480, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🔐'} Mastermind</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {won  && <div className="winner-banner">🏆 Code cracked in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}!</div>}
      {!won && over && <div className="winner-banner" style={{ color: '#f44' }}>💀 Out of guesses! Secret was:</div>}

      {showSecret && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          {secret.map((c, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: colorOf(c), border: '2px solid rgba(255,255,255,.3)' }} />
          ))}
        </div>
      )}

      <div className="turn-indicator">
        {over ? '' : `Guess ${guesses.length + 1} / ${MAX_GUESSES}`}
      </div>

      {/* Color selector */}
      {!over && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          {COLORS.map(col => (
            <div key={col.id} onClick={() => setSelectedColor(col.id)} style={{
              width: 36, height: 36, borderRadius: '50%', background: col.hex,
              border: selectedColor === col.id ? '3px solid #fff' : '2px solid rgba(255,255,255,.2)',
              cursor: 'pointer', boxShadow: selectedColor === col.id ? '0 0 10px rgba(255,255,255,.5)' : 'none',
              transition: 'all .15s',
            }} title={col.label} />
          ))}
        </div>
      )}

      {/* Current guess row */}
      {!over && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {current.map((c, i) => (
            <div key={i} onClick={() => c ? clearPos(i) : fillPos(i)} style={{
              width: 46, height: 46, borderRadius: '50%', cursor: 'pointer',
              background: c ? colorOf(c) : 'rgba(255,255,255,.05)',
              border: '2px dashed rgba(232,184,0,.5)',
              transition: 'background .15s',
            }} />
          ))}
          <button className="bv-button" onClick={submit} disabled={current.some(c => !c)} style={{ marginLeft: 8 }}>
            Submit
          </button>
        </div>
      )}

      {/* Past guesses */}
      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 8 }}>
        {guesses.map((g, gi) => (
          <div key={gi} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: g.blacks === CODE_LEN ? 'rgba(76,175,80,.1)' : 'rgba(255,255,255,.03)',
            borderRadius: 10, border: g.blacks === CODE_LEN ? '1px solid rgba(76,175,80,.4)' : '1px solid rgba(255,255,255,.07)',
          }}>
            <span style={{ fontSize: 11, color: '#555', width: 20 }}>#{gi + 1}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {g.guess.map((c, i) => (
                <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: colorOf(c), border: '1px solid rgba(255,255,255,.2)' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3, marginLeft: 8 }}>
              {Array(g.blacks).fill('⚫').map((p, i) => <span key={`b${i}`} style={{ fontSize: 12 }}>{p}</span>)}
              {Array(g.whites).fill('⬜').map((p, i) => <span key={`w${i}`} style={{ fontSize: 12 }}>{p}</span>)}
              {g.blacks === 0 && g.whites === 0 && <span style={{ fontSize: 11, color: '#555' }}>✗ No match</span>}
            </div>
            {g.blacks === CODE_LEN && <span style={{ fontSize: 13, color: '#4caf50', marginLeft: 4 }}>✓</span>}
          </div>
        ))}
      </div>

      {guesses.length === 0 && (
        <div style={{ textAlign: 'center', color: '#444', fontSize: 13, marginTop: 20 }}>
          Fill 4 positions above and press Submit to start
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 11, color: '#444', marginTop: 16 }}>
        ⚫ = right place · ⬜ = right colour wrong place
      </div>
    </div>
  );
}
