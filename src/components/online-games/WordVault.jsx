import React, { useState, useEffect, useCallback } from 'react';

const WORDS = [
  'VAULT','CROWN','BLADE','STORM','FLAME','GHOST','BRAVE','SHARP','NIGHT','MAGIC',
  'SWORD','POWER','TRICK','ROUGE','BLAZE','DRAFT','ANGEL','BENCH','CRAVE','DUNES',
  'EMBER','FLAIR','GROVE','HASTE','INFER','JOUST','KNAVE','LANCE','MANOR','NOBLE',
  'OAKEN','PLUME','QUEST','ROGUE','SAINT','THORN','UNDER','VICAR','WRATH','YIELD',
  'SIEGE','REALM','PLAZA','QUILL','MOURN','LIEGE','KINKY','JADED','INDEX','HYPER',
  'GLOOM','FJORD','EXILE','DREAD','CRYPT','BRASH','ARMOR','ABBEY','ZESTY','YOUTH',
];

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function score(secret, guess) {
  const result = Array(5).fill('gray');
  const secArr = secret.split('');
  const gArr   = guess.split('');
  const sLeft  = [];

  // Pass 1: greens
  for (let i = 0; i < 5; i++) {
    if (secArr[i] === gArr[i]) { result[i] = 'green'; secArr[i] = null; gArr[i] = null; }
    else sLeft.push(secArr[i]);
  }

  // Pass 2: yellows
  for (let i = 0; i < 5; i++) {
    if (gArr[i] === null) continue;
    const idx = sLeft.indexOf(gArr[i]);
    if (idx >= 0) { result[i] = 'yellow'; sLeft[idx] = null; }
  }
  return result;
}

const CELL_BG = { green: '#27ae60', yellow: '#e8b800', gray: '#2a2a3a', empty: '#1a1a2e' };
const CELL_BORDER = { green: '#27ae60', yellow: '#e8b800', gray: '#3a3a4a', empty: '#2a2a4a' };
const KEY_BG = { green: '#27ae60', yellow: '#c8940d', gray: '#3a3a4a', '': 'rgba(255,255,255,.08)' };

export default function WordVault(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;

  const [secret, setSecret]   = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guesses, setGuesses] = useState([]); // [{word, result:[]}]
  const [current, setCurrent] = useState('');
  const [over, setOver]       = useState(false);
  const [won, setWon]         = useState(false);
  const [shake, setShake]     = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const reset = () => {
    setSecret(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]); setCurrent(''); setOver(false); setWon(false); setShake(false);
  };

  const submit = useCallback(() => {
    if (current.length !== 5 || over) return;
    const result = score(secret, current);
    const newGuesses = [...guesses, { word: current, result }];
    setGuesses(newGuesses);
    setCurrent('');
    if (current === secret) { setOver(true); setWon(true); }
    else if (newGuesses.length >= 6) { setOver(true); }
  }, [current, guesses, over, secret]);

  const handleKey = useCallback((k) => {
    if (over) return;
    if (k === 'ENTER') { if (current.length === 5) submit(); else { setShake(true); setTimeout(() => setShake(false), 400); } }
    else if (k === 'BACK') { setCurrent(c => c.slice(0, -1)); }
    else if (/^[A-Z]$/.test(k) && current.length < 5) { setCurrent(c => c + k); }
  }, [current, over, submit]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('BACK');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleKey]);

  // Letter status map
  const letterStatus = {};
  guesses.forEach(({ word, result }) => {
    word.split('').forEach((l, i) => {
      const prev = letterStatus[l];
      if (result[i] === 'green') letterStatus[l] = 'green';
      else if (result[i] === 'yellow' && prev !== 'green') letterStatus[l] = 'yellow';
      else if (!prev) letterStatus[l] = 'gray';
    });
  });

  const Row = ({ guess, isActive }) => {
    const letters = isActive
      ? Array(5).fill('').map((_, i) => current[i] || '')
      : (guess ? guess.word.split('') : Array(5).fill(''));
    const result = guess ? guess.result : Array(5).fill('empty');

    return (
      <div style={{ display: 'flex', gap: 6, marginBottom: 6, animation: isActive && shake ? 'bv-shake .4s ease' : 'none' }}>
        {letters.map((l, i) => (
          <div key={i} style={{
            width: 52, height: 52, borderRadius: 8,
            background: CELL_BG[result[i]],
            border: `2px solid ${CELL_BORDER[result[i]]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace',
            transition: 'background .3s',
          }}>
            {l}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="game-shell" style={{ maxWidth: 380, margin: '0 auto' }}>
      {showHelp && (
        <div className="htp-overlay" onClick={() => setShowHelp(false)}>
          <div className="htp-box" onClick={e => e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Word Vault</p><button className="bv-button secondary" onClick={() => setShowHelp(false)}>✕</button></div>
            <div className="htp-body">
              <h4>Objective</h4><p>Guess the secret 5-letter word in 6 attempts.</p>
              <h4>Feedback Colours</h4><ul>
                <li style={{color:'#27ae60'}}>🟩 Green = right letter, right position.</li>
                <li style={{color:'#e8b800'}}>🟨 Yellow = right letter, wrong position.</li>
                <li style={{color:'#888'}}>⬛ Gray = letter not in the word.</li>
              </ul>
              <p>Type letters using keyboard or on-screen buttons. Press Enter to submit.</p>
            </div>
          </div>
        </div>
      )}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '📝'} Word Vault</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Word</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {won  && <div className="winner-banner">🏆 Cracked! The word was <b>{secret}</b> in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}!</div>}
      {!won && over && <div className="winner-banner" style={{ color: '#f44' }}>💀 The word was <b>{secret}</b></div>}

      {/* Board */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0' }}>
        {Array(6).fill(0).map((_, i) => {
          const isActive = i === guesses.length && !over;
          const guess = guesses[i];
          return <Row key={i} guess={guess} isActive={isActive} />;
        })}
      </div>

      {/* Keyboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 4 }}>
            {ri === 2 && <button onClick={() => handleKey('ENTER')} style={{ padding: '10px 8px', borderRadius: 6, fontSize: 10, fontWeight: 'bold', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e0e0e0', cursor: 'pointer' }}>ENTER</button>}
            {row.split('').map(l => (
              <button key={l} onClick={() => handleKey(l)} style={{
                width: 32, height: 40, borderRadius: 6, fontSize: 13, fontWeight: 'bold',
                background: KEY_BG[letterStatus[l] || ''],
                border: '1px solid rgba(255,255,255,.1)',
                color: '#fff', cursor: 'pointer',
              }}>{l}</button>
            ))}
            {ri === 2 && <button onClick={() => handleKey('BACK')} style={{ padding: '10px 8px', borderRadius: 6, fontSize: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e0e0e0', cursor: 'pointer' }}>⌫</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
