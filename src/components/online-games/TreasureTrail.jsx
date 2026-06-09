import React, { useState, useEffect, useCallback } from 'react';

/* Treasure Trail — Grid exploration game
 * 8×8 map, fog of war. Move to reveal tiles.
 * Tiles: treasure 💰 trap 💀 empty . rival 🤖
 * First to collect 5 treasures wins.
 */

const W = 8, H = 8;
const TREASURE_COUNT = 8;
const TRAP_COUNT     = 6;

function initMap() {
  const cells = Array.from({ length: H }, (_, r) =>
    Array.from({ length: W }, (_, c) => ({ r, c, type: 'empty', revealed: false }))
  );
  // Place treasures
  let placed = 0;
  while (placed < TREASURE_COUNT) {
    const r = Math.floor(Math.random() * H), c = Math.floor(Math.random() * W);
    if (cells[r][c].type === 'empty' && !(r === 0 && c === 0) && !(r === H-1 && c === W-1)) {
      cells[r][c].type = 'treasure'; placed++;
    }
  }
  // Place traps
  placed = 0;
  while (placed < TRAP_COUNT) {
    const r = Math.floor(Math.random() * H), c = Math.floor(Math.random() * W);
    if (cells[r][c].type === 'empty' && !(r === 0 && c === 0) && !(r === H-1 && c === W-1)) {
      cells[r][c].type = 'trap'; placed++;
    }
  }
  return cells;
}

function adj(r, c) {
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([nr,nc])=>nr>=0&&nr<H&&nc>=0&&nc<W);
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Treasure Trail</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Collect 5 treasures before the AI rival does.</p>
        <h4>How to Play</h4><ul>
          <li>Click an adjacent cell (up/down/left/right) to move there.</li>
          <li>The map starts hidden — explore to reveal tiles.</li>
          <li>💰 Treasure = +1 to your haul.</li>
          <li>💀 Trap = lose a turn (skip next move).</li>
          <li>🤖 AI rival moves on its own — race to the treasure!</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function TreasureTrail({ game, gameMode, onBack, onExit }) {
  const exit = onBack || onExit || null;
  const isAI = gameMode !== 'local';

  const [map, setMap]       = useState(initMap);
  const [playerPos, setPlayerPos] = useState([0, 0]);
  const [aiPos, setAiPos]   = useState([H-1, W-1]);
  const [pScore, setPScore]  = useState(0);
  const [aScore, setAScore]  = useState(0);
  const [over, setOver]      = useState(false);
  const [winner, setWinner]  = useState(null);
  const [skips, setSkips]    = useState(0);
  const [log, setLog]        = useState(['Game started. Find the treasures!']);
  const [showHelp, setShowHelp] = useState(false);
  const [aiThink, setAiThink] = useState(false);

  const addLog = m => setLog(prev => [m, ...prev].slice(0, 12));

  const reset = () => {
    setMap(initMap()); setPlayerPos([0,0]); setAiPos([H-1,W-1]);
    setPScore(0); setAScore(0); setOver(false); setWinner(null);
    setSkips(0); setLog(['Game started. Find the treasures!']);
  };

  // Reveal cell + apply effect
  const applyCell = useCallback((r, c, player, mapState) => {
    const cell = mapState[r][c];
    const nm = mapState.map(row => row.map(x => ({ ...x })));
    nm[r][c].revealed = true;

    let scoreD = 0, msg = '';
    if (cell.type === 'treasure') {
      nm[r][c].type = 'collected';
      scoreD = 1;
      msg = `${player === 'P' ? '🧑 You' : '🤖 AI'} found a treasure at ${r},${c}! (+1)`;
    } else if (cell.type === 'trap') {
      msg = `${player === 'P' ? '🧑 You' : '🤖 AI'} hit a trap! 💀 Turn skipped.`;
    } else {
      msg = `${player === 'P' ? '🧑 You' : '🤖 AI'} moved to ${r},${c}.`;
    }

    return { nm, scoreD, trap: cell.type === 'trap', msg };
  }, []);

  const handleMove = (r, c) => {
    if (over || aiThink) return;
    if (skips > 0) { setSkips(s => s - 1); addLog('⏭ Skipping trapped turn…'); doAI(); return; }
    const [pr, pc] = playerPos;
    if (!adj(pr, pc).some(([ar,ac]) => ar === r && ac === c)) return;

    const { nm, scoreD, trap, msg } = applyCell(r, c, 'P', map);
    setMap(nm);
    setPlayerPos([r, c]);
    addLog(msg);

    const newPS = pScore + scoreD;
    setPScore(newPS);
    if (newPS >= 5) { setOver(true); setWinner('player'); return; }
    if (trap) { setSkips(1); }

    doAI(nm);
  };

  const doAI = useCallback((currentMap) => {
    const m = currentMap || map;
    setAiThink(true);
    setTimeout(() => {
      const [ar, ac] = aiPos;
      const moves = adj(ar, ac).filter(([nr, nc]) => {
        const cell = m[nr][nc];
        return cell.type !== 'collected';
      });
      if (!moves.length) { setAiThink(false); return; }

      // AI prefers treasure cells it knows about (revealed)
      const treasures = moves.filter(([nr,nc]) => m[nr][nc].type === 'treasure' && m[nr][nc].revealed);
      const pick = treasures.length ? treasures[0] : moves[Math.floor(Math.random() * moves.length)];

      const { nm: nm2, scoreD, trap, msg } = applyCell(pick[0], pick[1], 'A', m);
      setMap(nm2);
      setAiPos([pick[0], pick[1]]);
      addLog(msg);

      const newAS = aScore + scoreD;
      setAScore(newAS);
      if (newAS >= 5) { setOver(true); setWinner('ai'); }
      setAiThink(false);
    }, 700);
  }, [map, aiPos, aScore, applyCell]);

  const [pr, pc] = playerPos;
  const adjCells = adj(pr, pc);

  const cellBg = (cell) => {
    if (!cell.revealed) return 'rgba(255,255,255,.04)';
    if (cell.type === 'treasure')  return 'rgba(232,184,0,.2)';
    if (cell.type === 'trap')      return 'rgba(192,57,43,.2)';
    if (cell.type === 'collected') return 'rgba(76,175,80,.1)';
    return 'rgba(255,255,255,.06)';
  };

  return (
    <div className="game-shell" style={{ maxWidth: 520, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🗺️'} Treasure Trail</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {over && <div className="winner-banner">{winner === 'player' ? '🏆 You found 5 treasures!' : '🤖 AI wins the trail!'}</div>}
      {!over && <div className="turn-indicator">{aiThink ? '🤖 AI exploring…' : `🧑 Your move · ${skips > 0 ? 'Skip pending (trapped)' : 'Click an adjacent cell'}`}</div>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
        <span style={{ color: '#e8b800', fontWeight: 'bold', fontSize: 14 }}>💰 You: {pScore}/5</span>
        {isAI && <span style={{ color: '#c0392b', fontWeight: 'bold', fontSize: 14 }}>🤖 AI: {aScore}/5</span>}
      </div>

      <div style={{ border: '2px solid #2a2a4a', borderRadius: 10, overflow: 'hidden', display: 'inline-block', width: '100%' }}>
        {map.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((cell, c) => {
              const isPlayer = pr === r && pc === c;
              const isAIHere = isAI && aiPos[0] === r && aiPos[1] === c;
              const isAdj    = !isPlayer && adjCells.some(([ar,ac]) => ar === r && ac === c);
              const canClick = isAdj && !over && !aiThink;
              return (
                <div key={c} onClick={() => canClick && handleMove(r, c)} style={{
                  flex: 1, aspectRatio: '1', minWidth: 0,
                  background: isPlayer ? 'rgba(232,184,0,.25)' : isAIHere ? 'rgba(192,57,43,.25)' : cellBg(cell),
                  border: `1px solid ${isAdj && !isPlayer ? 'rgba(232,184,0,.4)' : 'rgba(255,255,255,.05)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: canClick ? 'pointer' : 'default',
                  fontSize: 18, transition: 'background .1s',
                }}>
                  {isPlayer ? '🧑' :
                   isAIHere ? '🤖' :
                   !cell.revealed ? (isAdj ? '❔' : '') :
                   cell.type === 'treasure'  ? '💰' :
                   cell.type === 'trap'      ? '💀' :
                   cell.type === 'collected' ? '✓'  : '·'}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="bv-card" style={{ padding: 8, marginTop: 10, maxHeight: 80, overflowY: 'auto' }}>
        {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: i === 0 ? '#e0e0e0' : '#555', marginBottom: 2 }}>{l}</div>)}
      </div>
    </div>
  );
}
