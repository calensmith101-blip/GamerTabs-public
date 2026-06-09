import React, { useState, useEffect, useCallback, useRef } from 'react';

const BUTTONS = [
  { id: 0, label: '🔴', color: '#c0392b', glow: '#e74c3c', sound: 261 },
  { id: 1, label: '🔵', color: '#2980b9', glow: '#3498db', sound: 329 },
  { id: 2, label: '🟡', color: '#f39c12', glow: '#f1c40f', sound: 392 },
  { id: 3, label: '🟢', color: '#27ae60', glow: '#2ecc71', sound: 523 },
];

export default function SimonChain(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;

  const [seq, setSeq]       = useState([]);
  const [playerSeq, setPlayerSeq] = useState([]);
  const [lit, setLit]       = useState(null);
  const [phase, setPhase]   = useState('idle'); // idle | showing | player | result
  const [score, setScore]   = useState(0);
  const [best, setBest]     = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [speed, setSpeed]   = useState(600); // ms per button flash
  const timeouts = useRef([]);

  const clearTimers = () => { timeouts.current.forEach(clearTimeout); timeouts.current = []; };

  const reset = () => {
    clearTimers();
    setSeq([]); setPlayerSeq([]); setLit(null); setPhase('idle'); setScore(0);
  };

  const startRound = useCallback((newSeq) => {
    setPhase('showing');
    setPlayerSeq([]);
    let delay = 400;
    newSeq.forEach((btn, i) => {
      const t1 = setTimeout(() => setLit(btn), delay);
      const t2 = setTimeout(() => setLit(null), delay + speed - 100);
      timeouts.current.push(t1, t2);
      delay += speed;
    });
    const t3 = setTimeout(() => { setPhase('player'); setLit(null); }, delay + 100);
    timeouts.current.push(t3);
  }, [speed]);

  const startGame = () => {
    clearTimers();
    const first = [Math.floor(Math.random() * 4)];
    setSeq(first);
    setScore(0);
    startRound(first);
  };

  const handleButton = (btnId) => {
    if (phase !== 'player') return;
    const newPlayerSeq = [...playerSeq, btnId];
    setLit(btnId);
    setTimeout(() => setLit(null), 200);

    const i = newPlayerSeq.length - 1;
    if (seq[i] !== btnId) {
      // Wrong!
      setPhase('result');
      setBest(b => Math.max(b, score));
      setLit('wrong');
      setTimeout(() => setLit(null), 600);
      return;
    }

    setPlayerSeq(newPlayerSeq);
    if (newPlayerSeq.length === seq.length) {
      // Correct! next round
      const newScore = score + 1;
      setScore(newScore);
      setPhase('showing');
      const sp = Math.max(250, speed - newScore * 20); // get faster
      setSpeed(sp);
      const next = [...seq, Math.floor(Math.random() * 4)];
      setSeq(next);
      setTimeout(() => startRound(next), 800);
    }
  };

  const over = phase === 'result';

  return (
    <div className="game-shell" style={{ maxWidth: 400, margin: '0 auto' }}>
      {showHelp && (
        <div className="htp-overlay" onClick={() => setShowHelp(false)}>
          <div className="htp-box" onClick={e => e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Simon Chain</p><button className="bv-button secondary" onClick={() => setShowHelp(false)}>✕</button></div>
            <div className="htp-body">
              <h4>Objective</h4><p>Repeat the growing colour sequence perfectly. How long can you go?</p>
              <h4>How to Play</h4><ul>
                <li>Press <b>Start</b> to begin.</li>
                <li>Watch the sequence flash.</li>
                <li>Repeat it exactly by clicking the buttons.</li>
                <li>Each round adds one more step. Speed increases!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🔵'} Simon Chain</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          {phase !== 'idle' && <button className="bv-button" onClick={reset}>Reset</button>}
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {over && <div className="winner-banner" style={{ color: '#f44' }}>💀 Wrong! Score: {score} · Best: {Math.max(best, score)}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
        <div className="bv-card" style={{ padding: '8px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, color: '#e8b800', fontWeight: 'bold' }}>{score}</div>
          <div style={{ fontSize: 11, color: '#888' }}>Round</div>
        </div>
        <div className="bv-card" style={{ padding: '8px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, color: '#7c6af7', fontWeight: 'bold' }}>{Math.max(best, score)}</div>
          <div style={{ fontSize: 11, color: '#888' }}>Best</div>
        </div>
      </div>

      <div className="turn-indicator">
        {phase === 'idle' ? 'Press Start to play' :
         phase === 'showing' ? '👁️ Watch the sequence…' :
         phase === 'player' ? `✋ Repeat it! (${playerSeq.length}/${seq.length})` :
         'Wrong sequence!'}
      </div>

      {/* Buttons grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '24px auto', maxWidth: 300 }}>
        {BUTTONS.map(btn => {
          const isLit = lit === btn.id;
          const isWrong = lit === 'wrong';
          return (
            <div key={btn.id} onClick={() => handleButton(btn.id)} style={{
              height: 120, borderRadius: 16,
              background: isLit ? btn.glow : isWrong ? '#8b0000' : btn.color,
              opacity: (phase === 'player') ? 1 : (phase === 'showing' && isLit) ? 1 : 0.55,
              cursor: phase === 'player' ? 'pointer' : 'default',
              boxShadow: isLit ? `0 0 30px ${btn.glow}` : 'none',
              transition: 'all 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, userSelect: 'none',
            }}>
              {btn.label}
            </div>
          );
        })}
      </div>

      {phase === 'idle' && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="bv-button" style={{ fontSize: 16, padding: '14px 40px' }} onClick={startGame}>
            ▶ Start
          </button>
        </div>
      )}
      {over && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="bv-button" onClick={startGame}>Try Again</button>
        </div>
      )}
    </div>
  );
}
