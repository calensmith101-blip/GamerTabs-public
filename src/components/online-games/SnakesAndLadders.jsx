import React, { useState, useEffect, useRef, useCallback } from 'react';

const VIPERS = { 99:41, 89:53, 76:32, 66:24, 54:19, 45:12, 38:8, 27:6 };
const VAULTS = { 4:56, 17:76, 20:42, 28:84, 36:52, 51:67, 62:81, 71:91, 80:99 };
const CLASSIC_COLORS = ['#fef3c7','#dbeafe','#dcfce7','#fee2e2','#ede9fe'];

function sqPos(sq) {
  const rfb = Math.floor((sq - 1) / 10);
  const pir = (sq - 1) % 10;
  return { row: 9 - rfb, col: rfb % 2 === 0 ? pir : 9 - pir };
}

const roll = () => Math.floor(Math.random() * 6) + 1;
const COLORS = ['#c0392b', '#e8b800'];

function applyMove(pos, die) {
  let np = pos + die;
  let note = '';
  if (np > 100) {
    np = 100 - (np - 100);
    note = `bounced → sq.${np}`;
  } else if (VAULTS[np]) {
    note = `🏦 Vault! ${np} → ${VAULTS[np]}`;
    np = VAULTS[np];
  } else if (VIPERS[np]) {
    note = `🐍 Viper! ${np} → ${VIPERS[np]}`;
    np = VIPERS[np];
  }
  return { np, note };
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Snakes & Ladders</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4><p>Race from square 1 to 100 first.</p>
        <h4>Rules</h4>
        <ul>
          <li>Click Roll Dice on your turn.</li>
          <li>Move exactly that many squares.</li>
          <li>Land at the bottom of a <b style={{ color: '#4caf50' }}>ladder</b> — climb up.</li>
          <li>Land on a <b style={{ color: '#f44336' }}>snake head</b> — slide down.</li>
          <li>Must land <i>exactly</i> on 100. Overshoot = bounce back.</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function SnakesAndLadders(props) {
  const { onBack, onExit, gameMode, game } = props || {};
  const exit = onBack || onExit || null;
  const isAI = gameMode === 'ai' || gameMode === 'computer';

  const [pos, setPos] = useState([0, 0]);
  const [turn, setTurn] = useState(0);
  const [die, setDie] = useState(null);
  const [winner, setWinner] = useState(null);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false); // prevents double-fire
  const [showHelp, setShowHelp] = useState(false);

  // ref so AI timeout always reads current positions
  const posRef = useRef([0, 0]);
  useEffect(() => { posRef.current = pos; }, [pos]);

  const addLog = m => setLog(p => [m, ...p].slice(0, 18));

  const reset = () => {
    setPos([0, 0]);
    setTurn(0);
    setDie(null);
    setWinner(null);
    setLog([]);
    setBusy(false);
  };

  // ── Execute one turn for playerIdx using current positions ──────────────
  const execTurn = useCallback((playerIdx, currentPos, dieVal) => {
    const { np, note } = applyMove(currentPos, dieVal);
    const who = playerIdx === 0 ? 'Player 1' : (isAI ? '🤖 AI' : 'Player 2');
    addLog(`${who} rolled ${dieVal} → sq.${np}${note ? ' (' + note + ')' : ''}`);
    return np;
  }, [isAI]);

  // ── Player roll ─────────────────────────────────────────────────────────
  const handleRoll = () => {
    if (busy || winner !== null || (isAI && turn === 1)) return;
    setBusy(true);
    const d = roll();
    setDie(d);
    const np = execTurn(0, pos[0], d);
    setPos(prev => { const next = [...prev]; next[0] = np; return next; });
    if (np >= 100) { setWinner(0); setBusy(false); return; }
    setTurn(1);
    setBusy(false);
  };

  const handleRollP2 = () => {
    if (busy || winner !== null || isAI || turn !== 1) return;
    setBusy(true);
    const d = roll();
    setDie(d);
    const np = execTurn(1, pos[1], d);
    setPos(prev => { const next = [...prev]; next[1] = np; return next; });
    if (np >= 100) { setWinner(1); setBusy(false); return; }
    setTurn(0);
    setBusy(false);
  };

  // ── AI turn — uses posRef to read latest position, not stale closure ────
  useEffect(() => {
    if (!isAI || turn !== 1 || winner !== null || busy) return;
    setBusy(true);
    const t = setTimeout(() => {
      const d = roll();
      setDie(d);
      const currentPos = posRef.current[1]; // always fresh
      const np = execTurn(1, currentPos, d);
      setPos(prev => { const next = [...prev]; next[1] = np; return next; });
      if (np >= 100) { setWinner(1); setBusy(false); return; }
      setTurn(0);
      setBusy(false);
    }, 900);
    return () => clearTimeout(t);
  }, [turn, isAI, winner]); // NOT busy or pos in deps — posRef handles freshness

  // ── Board render ────────────────────────────────────────────────────────
  const CS = 42, BSZ = CS * 10;

  const renderBoard = () => {
    const cells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const rfb = 9 - row;
        const pir = rfb % 2 === 0 ? col : 9 - col;
        const sq = rfb * 10 + pir + 1;
        const isVB = VAULTS[sq] !== undefined;
        const isVH = VIPERS[sq] !== undefined;
        let bg = CLASSIC_COLORS[(row + col) % CLASSIC_COLORS.length];
        if (isVB) bg = '#bbf7d0';
        if (isVH) bg = '#fecaca';
        const tokens = pos.map((p, i) => p === sq ? i : -1).filter(i => i >= 0);
        cells.push(
          <div key={`${row}-${col}`} style={{
            position: 'absolute', left: col * CS, top: row * CS,
            width: CS, height: CS, background: bg, border: '1px solid rgba(120,53,15,.35)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <span style={{ fontSize: 9, color: '#3f2a13', lineHeight: 1, fontWeight: '900' }}>{sq}</span>
            {isVB && <span style={{ fontSize: 17, color: '#15803d', lineHeight: 1 }}>🪜</span>}
            {isVH && <span style={{ fontSize: 17, color: '#b91c1c', lineHeight: 1 }}>🐍</span>}
            <div style={{ display: 'flex', gap: 1 }}>
              {tokens.map(pi => (
                <div key={pi} style={{
                  width: 14, height: 14, borderRadius: '50%', background: COLORS[pi],
                  fontSize: 7, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', border: '1px solid rgba(255,255,255,.4)',
                }}>{pi + 1}</div>
              ))}
            </div>
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="game-shell" style={{ maxWidth: 640, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}

      <style>{`.classic-snl-board{box-shadow:0 10px 30px rgba(0,0,0,.45), inset 0 0 0 6px rgba(120,53,15,.3);background:#fff7ed}.classic-snl-cell{font-family:system-ui;border:1px solid rgba(120,53,15,.35)!important}.snake-line{stroke:#15803d;stroke-width:7;stroke-linecap:round;fill:none;filter:drop-shadow(0 1px 1px #0008)}.snake-line-bad{stroke:#b91c1c;stroke-width:8;stroke-linecap:round;fill:none;filter:drop-shadow(0 1px 1px #0008)}@media(max-width:700px){.classic-snl-wrap{transform:scale(.78);transform-origin:top center;height:340px}}`}</style>
      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🎲'} Snakes &amp; Ladders</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {winner !== null && (
        <div className="winner-banner">
          {winner === 0 ? '🏆 Player 1 Wins!' : isAI ? '🤖 AI Wins!' : '🏆 Player 2 Wins!'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        {/* Board */}
        <div className="classic-snl-wrap">
          <div className="classic-snl-board" style={{ position: 'relative', width: BSZ, height: BSZ, border: '4px solid #92400e', borderRadius: 12, overflow: 'hidden' }}>
            {renderBoard()}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox={`0 0 ${BSZ} ${BSZ}`}>
              {Object.entries(VAULTS).map(([f, t]) => {
                const fp = sqPos(+f), tp = sqPos(t);
                return <line key={`v${f}`} x1={fp.col * CS + CS / 2} y1={fp.row * CS + CS / 2}
                  x2={tp.col * CS + CS / 2} y2={tp.row * CS + CS / 2}
                  className="snake-line" opacity=".88" />;
              })}
              {Object.entries(VIPERS).map(([f, t]) => {
                const fp = sqPos(+f), tp = sqPos(t);
                return <line key={`s${f}`} x1={fp.col * CS + CS / 2} y1={fp.row * CS + CS / 2}
                  x2={tp.col * CS + CS / 2} y2={tp.row * CS + CS / 2}
                  className="snake-line-bad" opacity=".88" />;
              })}
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 11 }}>
            <span style={{ color: '#4caf50' }}>🪜 Ladder climb</span>
            <span style={{ color: '#f44336' }}>🐍 Snake slide</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 170 }}>
          <div className="bv-card" style={{ padding: 12 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: turn === i && !winner ? 1 : 0.55 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: COLORS[i] }} />
                <span style={{ color: '#e0e0e0', fontSize: 13 }}>{isAI && i === 1 ? '🤖 AI' : `Player ${i + 1}`}: sq.{pos[i] || 'Start'}</span>
                {turn === i && !winner && <span style={{ color: '#e8b800', fontSize: 11 }}>◄</span>}
              </div>
            ))}

            {die !== null && (
              <div style={{ textAlign: 'center', fontSize: 26, color: '#e8b800', margin: '6px 0' }}>
                {['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][die]}
              </div>
            )}

            {!winner && turn === 0 && (
              <button className="bv-button" style={{ width: '100%' }} onClick={handleRoll} disabled={busy}>
                {busy ? 'Rolling…' : 'Roll Dice 🎲'}
              </button>
            )}
            {!winner && turn === 1 && !isAI && (
              <button className="bv-button" style={{ width: '100%' }} onClick={handleRollP2} disabled={busy}>
                {busy ? 'Rolling…' : 'Roll Dice 🎲'}
              </button>
            )}
            {!winner && turn === 1 && isAI && (
              <div style={{ color: '#888', textAlign: 'center', fontSize: 13 }}>🤖 AI rolling…</div>
            )}
          </div>

          <div className="bv-card" style={{ padding: 10, flex: 1, overflowY: 'auto', maxHeight: 240 }}>
            <div style={{ color: '#e8b800', fontSize: 11, marginBottom: 5 }}>Move Log</div>
            {log.map((l, i) => <div key={i} style={{ color: i === 0 ? '#e0e0e0' : '#555', fontSize: 11, marginBottom: 3 }}>{l}</div>)}
            {!log.length && <div style={{ color: '#444', fontSize: 11 }}>No moves yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
