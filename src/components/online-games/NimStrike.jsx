// ══════════════════════════════════════════
// FILE: NimStrike.jsx
// ══════════════════════════════════════════
import React, { useState, useEffect } from 'react';

const INIT_ROWS = [3, 5, 7];

function initState() { return { rows: [...INIT_ROWS], turn: 'player', over: false, winner: null, lastMove: null }; }

// Nim AI: calculate nim-value (XOR of all rows), pick move that makes XOR = 0
function nimAIMove(rows) {
  const xor = rows.reduce((a, b) => a ^ b, 0);
  if (xor === 0) {
    // Losing position: take 1 from largest row
    const maxIdx = rows.indexOf(Math.max(...rows));
    return { row: maxIdx, take: 1 };
  }
  for (let i = 0; i < rows.length; i++) {
    const target = rows[i] ^ xor;
    if (target < rows[i]) return { row: i, take: rows[i] - target };
  }
  return { row: 0, take: 1 };
}

export function NimStrike(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;
  const [gs, setGs] = useState(initState);
  const [selRow, setSelRow] = useState(null);
  const [selTake, setSelTake] = useState(1);
  const [showHelp, setShowHelp] = useState(false);

  const reset = () => { setGs(initState()); setSelRow(null); setSelTake(1); };

  const playerMove = () => {
    if (gs.turn !== 'player' || selRow === null || gs.over) return;
    const newRows = [...gs.rows];
    if (selTake > newRows[selRow] || selTake < 1) return;
    newRows[selRow] -= selTake;
    const allZero = newRows.every(r => r === 0);
    setGs({ rows: newRows, turn: allZero ? 'player' : 'ai', over: allZero, winner: allZero ? 'ai' : null, lastMove: `You took ${selTake} from row ${selRow + 1}` });
    setSelRow(null); setSelTake(1);
  };

  useEffect(() => {
    if (gs.turn !== 'ai' || gs.over) return;
    const t = setTimeout(() => {
      const { row, take } = nimAIMove(gs.rows);
      const newRows = [...gs.rows];
      newRows[row] -= take;
      const allZero = newRows.every(r => r === 0);
      setGs({ rows: newRows, turn: 'player', over: allZero, winner: allZero ? 'player' : null, lastMove: `🤖 AI took ${take} from row ${row + 1}` });
    }, 700);
    return () => clearTimeout(t);
  }, [gs.turn, gs.over]);

  return (
    <div className="game-shell" style={{ maxWidth: 380, margin: '0 auto' }}>
      {showHelp && (
        <div className="htp-overlay" onClick={() => setShowHelp(false)}>
          <div className="htp-box" onClick={e => e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Nim Strike</p><button className="bv-button secondary" onClick={() => setShowHelp(false)}>✕</button></div>
            <div className="htp-body">
              <h4>Objective</h4><p>Force your opponent to take the <b>last stone</b>.</p>
              <h4>Rules</h4><ul>
                <li>3 rows of stones: 3, 5, 7.</li>
                <li>On your turn, pick a row and take 1 or more stones from it.</li>
                <li>You must take at least 1. You can only take from one row per turn.</li>
                <li>Player who takes the <b>last stone loses</b>.</li>
              </ul>
              <h4>Tip</h4><p>The AI plays perfectly. Study the XOR strategy to beat it!</p>
            </div>
          </div>
        </div>
      )}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🪨'} Nim Strike</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>
      {gs.over && <div className="winner-banner">{gs.winner === 'player' ? '🏆 You Win!' : '🤖 AI Wins!'}</div>}
      <div className="turn-indicator">
        {!gs.over && (gs.turn === 'player' ? '🎯 Pick a row and how many to take' : '🤖 AI thinking…')}
        {gs.lastMove && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{gs.lastMove}</div>}
      </div>
      {gs.rows.map((count, ri) => (
        <div key={ri} onClick={() => !gs.over && gs.turn === 'player' && setSelRow(ri)} style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 8, cursor: !gs.over && gs.turn === 'player' ? 'pointer' : 'default',
          background: selRow === ri ? 'rgba(232,184,0,.12)' : 'rgba(255,255,255,.03)',
          border: selRow === ri ? '2px solid rgba(232,184,0,.5)' : '1px solid rgba(255,255,255,.08)',
        }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Row {ri + 1}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array(count).fill(0).map((_, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: '#e8b800', opacity: selRow === ri && i < selTake ? 0.3 : 1 }} />
            ))}
            {count === 0 && <span style={{ color: '#444', fontSize: 13 }}>Empty</span>}
          </div>
        </div>
      ))}
      {gs.turn === 'player' && !gs.over && selRow !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 13, color: '#e0e0e0' }}>Take:</span>
          <input type="number" min="1" max={gs.rows[selRow]} value={selTake} onChange={e => setSelTake(Math.min(gs.rows[selRow], Math.max(1, +e.target.value)))}
            style={{ width: 60, background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4a', borderRadius: 6, padding: '6px 8px', fontSize: 14 }} />
          <button className="bv-button" onClick={playerMove}>Take ✓</button>
        </div>
      )}
    </div>
  );
}
export default NimStrike;
