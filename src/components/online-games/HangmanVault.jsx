// ═══════════════════════════════════════════════════════════════
// FILE: HangmanVault.jsx
// ═══════════════════════════════════════════════════════════════
import React, { useState, useCallback } from 'react';

const WORDS = [
  'CASTLE','KNIGHT','DRAGON','WIZARD','GOBLIN','TAVERN','DUNGEON','POTION','SHIELD','SWORD',
  'BRIDGE','FOREST','MARKET','THRONE','PLAGUE','SCROLL','BANNER','PORTAL','ORACLE','RAVEN',
  'CIPHER','VAULT','SHADOW','GHOST','FLAME','STORM','CROWN','BLADE','TOWER','QUEST',
];
const MAX_WRONG = 6;
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const HANGMAN_STAGES = [
  '',
  '😟',
  '😨',
  '😰',
  '😱',
  '💀',
  '☠️',
];

export function HangmanVault(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;

  const newWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  const [word, setWord]     = useState(newWord);
  const [guessed, setGuessed] = useState(new Set());
  const [showHelp, setShowHelp] = useState(false);

  const wrong = [...guessed].filter(l => !word.includes(l)).length;
  const won = word.split('').every(l => guessed.has(l));
  const over = won || wrong >= MAX_WRONG;

  const reset = () => { setWord(newWord()); setGuessed(new Set()); };

  const guess = (l) => {
    if (over || guessed.has(l)) return;
    setGuessed(prev => new Set([...prev, l]));
  };

  const display = word.split('').map(l => guessed.has(l) ? l : '_').join(' ');

  return (
    <div className="game-shell" style={{ maxWidth: 420, margin: '0 auto' }}>
      {showHelp && (
        <div className="htp-overlay" onClick={() => setShowHelp(false)}>
          <div className="htp-box" onClick={e => e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Hangman Vault</p><button className="bv-button secondary" onClick={() => setShowHelp(false)}>✕</button></div>
            <div className="htp-body">
              <h4>Objective</h4><p>Guess the hidden word before the vault lock closes ({MAX_WRONG} wrong guesses).</p>
              <h4>How to Play</h4><ul><li>Click any letter to guess it.</li><li>Green = correct. Red = wrong.</li><li>Guess the word before {MAX_WRONG} wrong guesses.</li></ul>
            </div>
          </div>
        </div>
      )}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🪤'} Hangman Vault</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Word</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {won  && <div className="winner-banner">🏆 Cracked it! The word was {word}</div>}
      {!won && over && <div className="winner-banner" style={{ color: '#f44' }}>💀 Vault sealed! The word was <b>{word}</b></div>}

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <div style={{ fontSize: 60 }}>{HANGMAN_STAGES[Math.min(wrong, HANGMAN_STAGES.length - 1)]}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{wrong}/{MAX_WRONG} wrong guesses</div>
        <div style={{ marginTop: 20, fontSize: 28, letterSpacing: 10, color: '#e8b800', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {display}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 360, margin: '0 auto' }}>
        {ALPHA.map(l => {
          const used = guessed.has(l);
          const correct = used && word.includes(l);
          const wrong2 = used && !word.includes(l);
          return (
            <button key={l} onClick={() => guess(l)} disabled={used || over} style={{
              width: 38, height: 38, borderRadius: 8, fontSize: 14, fontWeight: 'bold',
              background: correct ? 'rgba(76,175,80,.2)' : wrong2 ? 'rgba(244,67,54,.2)' : 'rgba(255,255,255,.05)',
              border: correct ? '1px solid rgba(76,175,80,.5)' : wrong2 ? '1px solid rgba(244,67,54,.5)' : '1px solid rgba(255,255,255,.1)',
              color: correct ? '#4caf50' : wrong2 ? '#f44336' : '#e0e0e0',
              cursor: used || over ? 'default' : 'pointer', opacity: used ? 0.6 : 1,
              padding: 0,
            }}>{l}</button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#555' }}>
        {word.split('').filter((l, i, a) => a.indexOf(l) === i).length} unique letters · {word.length} letters total
      </div>
    </div>
  );
}

export default HangmanVault;
