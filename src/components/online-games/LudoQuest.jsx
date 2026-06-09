import React, { useState, useEffect, useRef } from 'react';

/**
 * Vault Run (LudoQuest) — simplified 2-player Ludo-style race.
 * Track: 40 squares in a loop. Home stretch: 5 dedicated squares per player.
 * Tokens start off-board (-1 = base). Roll 6 to enter at square 0/20.
 * First to get both tokens to square 60 (vault) wins.
 */

const TRACK_LEN = 40;
const HOME_LEN = 5;
const VAULT_SQ = 60; // finish
const PLAYER_ENTRY = [0, 20]; // track entry square for each player
const PLAYER_COLORS = ['#c0392b', '#2980b9'];
const SAFE_SQUARES = new Set([0, 10, 20, 30]);

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

function tokenFinalPos(pos) { return pos >= VAULT_SQ; }

// Move a token: returns new position or original if invalid
function moveToken(pos, die, pid) {
  if (pos === -1) {
    return die === 6 ? PLAYER_ENTRY[pid] : -1;
  }
  const np = pos + die;
  if (np >= VAULT_SQ) return VAULT_SQ; // reached home
  return np;
}

function initState() {
  return {
    tokens: [[-1, -1], [-1, -1]],
    turn: 0,
    die: null,
    rolled: false,
    winner: null,
    log: [],
    consec6: 0,
  };
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Vault Run</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4>
        <p>Race both your tokens around the track and into the <b>Vault</b> (🏠) before your opponent.</p>
        <h4>Rules</h4>
        <ul>
          <li>Tokens start in <b>Base</b>. Roll a <b>6</b> to launch one onto the track.</li>
          <li>Rolling 6 earns you another roll. Three 6s in a row forfeits your turn.</li>
          <li>Click a token (highlighted in gold) to move it after rolling.</li>
          <li>Landing on an opponent token on a non-safe square sends it back to base.</li>
          <li>Safe squares (marked ★) protect tokens from capture.</li>
          <li>Tokens reaching 🏠 are safe. Both in vault = you win!</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function LudoQuest(props) {
  const { onBack, onExit, gameMode, game } = props || {};
  const exit = onBack || onExit || null;
  const isAI = gameMode === 'ai' || gameMode === 'computer';

  const [gs, setGs] = useState(initState);
  const [showHelp, setShowHelp] = useState(false);
  const gsRef = useRef(gs);
  useEffect(() => { gsRef.current = gs; }, [gs]);

  const addLog = (msg, state) => ({
    ...state,
    log: [msg, ...(state.log || [])].slice(0, 14),
  });

  const reset = () => setGs(initState());

  // ── Check win ─────────────────────────────────────────────────────────────
  const checkWin = (tokens, pid) => tokens[pid].every(t => t >= VAULT_SQ);

  // ── Execute move for playerIdx / tokenIdx ─────────────────────────────────
  const doMove = (state, pid, tid) => {
    const { tokens, die, consec6 } = state;
    const pos = tokens[pid][tid];
    const np = moveToken(pos, die, pid);
    if (np === pos && pos !== -1) return state; // Can't move

    let s = { ...state };
    const newTokens = s.tokens.map(row => [...row]);
    newTokens[pid][tid] = np;

    // Capture: if landing on opponent and not safe
    if (np >= 0 && np < VAULT_SQ && !SAFE_SQUARES.has(np % TRACK_LEN)) {
      const op = 1 - pid;
      newTokens[op] = newTokens[op].map(t => {
        if (t === np) {
          s = addLog(`💥 ${pid === 0 ? 'You' : 'AI'} captured opponent token!`, s);
          return -1;
        }
        return t;
      });
    }

    const whoStr = pid === 0 ? 'You' : (isAI ? '🤖 AI' : 'P2');
    s = addLog(`${whoStr}: Token ${tid + 1} → ${np >= VAULT_SQ ? '🏠 Vault!' : `sq.${np}`}`, s);
    s = { ...s, tokens: newTokens };

    if (checkWin(newTokens, pid)) {
      return { ...s, winner: pid };
    }

    // Extra roll on 6
    if (die === 6) {
      const nc = consec6 + 1;
      if (nc >= 3) {
        s = addLog('3 sixes in a row — turn lost!', s);
        return { ...s, turn: 1 - pid, rolled: false, die: null, consec6: 0 };
      }
      return { ...s, rolled: false, die: null, consec6: nc };
    }

    return { ...s, turn: 1 - pid, rolled: false, die: null, consec6: 0 };
  };

  // ── Player rolls ──────────────────────────────────────────────────────────
  const handleRoll = () => {
    setGs(prev => {
      if (prev.rolled || prev.winner !== null || (isAI && prev.turn === 1)) return prev;
      const d = rollDie();
      return { ...prev, die: d, rolled: true };
    });
  };

  // ── Player clicks a token ─────────────────────────────────────────────────
  const handleToken = (pid, tid) => {
    setGs(prev => {
      if (!prev.rolled || prev.winner !== null || prev.turn !== pid) return prev;
      if (pid !== 0) return prev; // only human can click
      const pos = prev.tokens[pid][tid];
      const np = moveToken(pos, prev.die, pid);
      if (np === pos && pos !== -1) return prev; // Invalid move
      return doMove(prev, pid, tid);
    });
  };

  // ── AI turn ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAI || gs.turn !== 1 || gs.winner !== null) return;

    if (!gs.rolled) {
      // Roll
      const t = setTimeout(() => {
        setGs(prev => {
          if (prev.rolled || prev.winner !== null || prev.turn !== 1) return prev;
          const d = rollDie();
          return { ...prev, die: d, rolled: true };
        });
      }, 700);
      return () => clearTimeout(t);
    }

    // Pick best token to move
    const t = setTimeout(() => {
      setGs(prev => {
        if (!prev.rolled || prev.winner !== null || prev.turn !== 1) return prev;
        const { tokens, die } = prev;

        // Prefer: enter base, then capture, then furthest moveable
        let best = -1;
        if (die === 6) {
          const baseIdx = tokens[1].findIndex(t => t === -1);
          if (baseIdx !== -1) best = baseIdx;
        }
        if (best === -1) {
          const moves = tokens[1].map((pos, i) => {
            if (pos === -1 && die !== 6) return { i, score: -1 };
            if (pos >= VAULT_SQ) return { i, score: -1 };
            const np = moveToken(pos, die, 1);
            if (np === pos && pos !== -1) return { i, score: -1 };
            return { i, score: np };
          }).filter(m => m.score >= 0).sort((a, b) => b.score - a.score);
          if (moves.length) best = moves[0].i;
        }

        if (best === -1) {
          // No valid move — pass
          return addLog('🤖 AI has no valid moves — passed.', { ...prev, turn: 0, rolled: false, die: null });
        }
        return doMove(prev, 1, best);
      });
    }, 500);
    return () => clearTimeout(t);
  }, [gs.turn, gs.rolled, gs.winner, isAI]);

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const canMoveToken = (pid, tid) => {
    if (!gs.rolled || gs.winner !== null || gs.turn !== pid) return false;
    const pos = gs.tokens[pid][tid];
    const np = moveToken(pos, gs.die, pid);
    return np !== pos || pos === -1;
  };

  const posLabel = p => p === -1 ? 'Base' : p >= VAULT_SQ ? '🏠' : `sq.${p}`;

  return (
    <div className="game-shell" style={{ maxWidth: 500, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🎮'} Vault Run</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {gs.winner !== null && (
        <div className="winner-banner">
          {gs.winner === 0 ? '🏆 You Win! Both tokens in the Vault!' : isAI ? '🤖 AI Wins!' : 'Player 2 Wins!'}
        </div>
      )}

      <div className="turn-indicator">
        {gs.winner === null && (gs.rolled
          ? `${gs.turn === 0 ? 'Click a token to move' : '🤖 AI choosing…'} — rolled ${gs.die}`
          : gs.turn === 0 ? '🎲 Your turn — Roll Dice' : '🤖 AI rolling…'
        )}
      </div>

      {gs.die !== null && (
        <div style={{ textAlign: 'center', fontSize: 42, margin: '6px 0' }}>
          {['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][gs.die]}
        </div>
      )}

      {/* Token panels */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        {[0, 1].map(pid => (
          <div key={pid} className="bv-card" style={{ padding: 12, minWidth: 180, borderLeft: `3px solid ${PLAYER_COLORS[pid]}` }}>
            <div style={{ color: PLAYER_COLORS[pid], fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
              {pid === 0 ? 'You (Red)' : isAI ? '🤖 AI (Blue)' : 'Player 2 (Blue)'}
              {gs.tokens[pid].every(t => t >= VAULT_SQ) && ' 🏠'}
            </div>
            {gs.tokens[pid].map((pos, ti) => {
              const moveable = canMoveToken(pid, ti) && pid === 0;
              return (
                <div key={ti}
                  onClick={() => moveable && handleToken(pid, ti)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7,
                    padding: '6px 8px', borderRadius: 7,
                    background: moveable ? 'rgba(232,184,0,.12)' : 'transparent',
                    border: moveable ? '1px solid rgba(232,184,0,.35)' : '1px solid rgba(255,255,255,.06)',
                    cursor: moveable ? 'pointer' : 'default',
                    transition: 'all .15s',
                  }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: PLAYER_COLORS[pid],
                    border: '2px solid rgba(255,255,255,.35)',
                    fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 'bold',
                  }}>{ti + 1}</div>
                  <span style={{ fontSize: 13, color: pos >= VAULT_SQ ? '#4caf50' : '#e0e0e0' }}>
                    {posLabel(pos)}
                    {pos >= 0 && pos < VAULT_SQ && SAFE_SQUARES.has(pos % TRACK_LEN) ? ' ★' : ''}
                  </span>
                  {moveable && <span style={{ color: '#e8b800', fontSize: 11, marginLeft: 'auto' }}>← tap</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Roll button */}
      {!gs.winner && gs.turn === 0 && !gs.rolled && (
        <button className="bv-button" style={{ width: '100%', marginBottom: 12, fontSize: 15 }} onClick={handleRoll}>
          🎲 Roll Dice
        </button>
      )}

      {/* Track visual */}
      <div className="bv-card" style={{ padding: 10 }}>
        <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>Track — {TRACK_LEN} squares · ★ = safe</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {Array.from({ length: TRACK_LEN }, (_, sq) => {
            const isSafe = SAFE_SQUARES.has(sq);
            const tokens = [];
            gs.tokens[0].forEach((t, ti) => { if (t === sq) tokens.push({ pid: 0, ti }); });
            gs.tokens[1].forEach((t, ti) => { if (t === sq) tokens.push({ pid: 1, ti }); });
            return (
              <div key={sq} style={{
                width: 22, height: 22, borderRadius: 4,
                background: isSafe ? 'rgba(232,184,0,.15)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${isSafe ? 'rgba(232,184,0,.4)' : 'rgba(255,255,255,.07)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, color: '#444', position: 'relative',
              }}>
                {tokens.length === 0 && <span>{sq}</span>}
                {tokens.map((tk, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%', background: PLAYER_COLORS[tk.pid],
                    position: 'absolute', top: i * 5, right: 1,
                  }} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Log */}
      <div className="bv-card" style={{ padding: 8, marginTop: 10, maxHeight: 120, overflowY: 'auto' }}>
        <div style={{ color: '#e8b800', fontSize: 10, marginBottom: 4 }}>Game Log</div>
        {gs.log.map((l, i) => <div key={i} style={{ fontSize: 11, color: i === 0 ? '#e0e0e0' : '#555', marginBottom: 2 }}>{l}</div>)}
        {!gs.log.length && <div style={{ color: '#444', fontSize: 11 }}>No moves yet. Roll to start!</div>}
      </div>
    </div>
  );
}
