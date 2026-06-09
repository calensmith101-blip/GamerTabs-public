import React, { useState, useEffect } from 'react';

/* Mancala (Kalah rules):
 * 6 pits per side + 1 mancala (score bin) per player.
 * Layout: [0..5] = AI pits (top, right-to-left), [6] = AI mancala,
 *         [7..12] = Player pits (bottom, left-to-right), [13] = Player mancala
 * Player = bottom (indices 7-12), mancala = 13
 * AI     = top   (indices 0-5),  mancala = 6
 */

const PLAYER_STORE = 13;
const AI_STORE = 6;

function initPits() {
  // 4 stones per pit, mancalas start at 0
  const pits = Array(14).fill(4);
  pits[PLAYER_STORE] = 0;
  pits[AI_STORE] = 0;
  return pits;
}

function isPlayerPit(i) { return i >= 7 && i <= 12; }
function isAIPit(i)     { return i >= 0 && i <= 5; }

// Distribute stones from pit i, return new pits + did extra turn
function sow(pits, idx, player) {
  const next = [...pits];
  let stones = next[idx];
  next[idx] = 0;
  let cur = idx;
  while (stones > 0) {
    cur = (cur + 1) % 14;
    // Skip opponent's store
    if (player === 'player' && cur === AI_STORE) continue;
    if (player === 'ai'     && cur === PLAYER_STORE) continue;
    next[cur]++;
    stones--;
  }
  // Capture: if last stone lands in empty pit on player's side, opposite pit captured
  const myStore = player === 'player' ? PLAYER_STORE : AI_STORE;
  const myPits = player === 'player' ? [7,8,9,10,11,12] : [0,1,2,3,4,5];
  if (myPits.includes(cur) && next[cur] === 1 && pits[cur] === 0) {
    const opp = 12 - cur; // mirror index (7↔5, 8↔4, etc.)
    if (next[opp] > 0) {
      next[myStore] += next[opp] + 1;
      next[opp] = 0;
      next[cur] = 0;
    }
  }
  const extraTurn = cur === myStore;
  return { pits: next, extraTurn };
}

function collectRemaining(pits) {
  const next = [...pits];
  for (let i = 7; i <= 12; i++) { next[PLAYER_STORE] += next[i]; next[i] = 0; }
  for (let i = 0; i <= 5; i++)  { next[AI_STORE]     += next[i]; next[i] = 0; }
  return next;
}

function hasMoves(pits, player) {
  const range = player === 'player' ? [7,8,9,10,11,12] : [0,1,2,3,4,5];
  return range.some(i => pits[i] > 0);
}

// AI strategy: prefer moves that give extra turn, then most stones
function aiChoose(pits) {
  const candidates = [0,1,2,3,4,5].filter(i => pits[i] > 0);
  // Extra turn moves
  for (const idx of candidates) {
    const { extraTurn } = sow(pits, idx, 'ai');
    if (extraTurn) return idx;
  }
  // Capture moves
  for (const idx of candidates) {
    const { pits: np } = sow(pits, idx, 'ai');
    if (np[AI_STORE] > pits[AI_STORE] + pits[idx]) return idx; // captured extra
  }
  // Most stones to store
  let best = candidates[0], bestGain = -1;
  for (const idx of candidates) {
    const { pits: np } = sow(pits, idx, 'ai');
    const gain = np[AI_STORE] - pits[AI_STORE];
    if (gain > bestGain) { bestGain = gain; best = idx; }
  }
  return best;
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Mancala Vault</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4><p>Collect more stones in your Vault (score bin) than your opponent.</p>
        <h4>On Your Turn</h4>
        <ul>
          <li>Click any of your pits (bottom row, must have stones).</li>
          <li>Stones are distributed counter-clockwise, one per pit.</li>
          <li>Stones passing your Vault go in. Opponent's Vault is skipped.</li>
          <li>If the last stone lands in your Vault → play again!</li>
          <li>If the last stone lands in an empty pit on your side → capture the opposite pit's stones + yours.</li>
        </ul>
        <h4>Game Over</h4><p>When one side is empty, remaining stones go to the opposing player's Vault. Most stones wins.</p>
      </div>
    </div>
  </div>
);

export default function MancalaVault(props) {
  const { onBack, onExit, gameMode, game } = props || {};
  const exit = onBack || onExit || null;
  const isAI = gameMode !== 'local' && gameMode !== 'alone';

  const [pits, setPits] = useState(initPits);
  const [turn, setTurn] = useState('player');
  const [over, setOver] = useState(false);
  const [aiThink, setAiThink] = useState(false);
  const [lastMoved, setLastMoved] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const reset = () => { setPits(initPits()); setTurn('player'); setOver(false); setAiThink(false); setLastMoved(null); };

  const checkOver = (p) => {
    const playerEmpty = [7,8,9,10,11,12].every(i => p[i] === 0);
    const aiEmpty     = [0,1,2,3,4,5].every(i => p[i] === 0);
    if (playerEmpty || aiEmpty) {
      const final = collectRemaining(p);
      setPits(final);
      setOver(true);
    }
  };

  const handlePlayerMove = (idx) => {
    if (turn !== 'player' || over || pits[idx] === 0 || !isPlayerPit(idx)) return;
    const { pits: np, extraTurn } = sow(pits, idx, 'player');
    setLastMoved(idx);
    setPits(np);
    checkOver(np);
    if (!over) setTurn(extraTurn ? 'player' : 'ai');
  };

  useEffect(() => {
    if (!isAI || turn !== 'ai' || over) return;
    if (!hasMoves(pits, 'ai')) { checkOver(pits); return; }
    setAiThink(true);
    const t = setTimeout(() => {
      const idx = aiChoose(pits);
      const { pits: np, extraTurn } = sow(pits, idx, 'ai');
      setLastMoved(idx);
      setPits(np);
      checkOver(np);
      if (!over) setTurn(extraTurn ? 'ai' : 'player');
      setAiThink(false);
    }, 700);
    return () => clearTimeout(t);
  }, [turn, isAI, over, pits]);

  const playerScore = pits[PLAYER_STORE];
  const aiScore = pits[AI_STORE];
  const winner = over ? (playerScore > aiScore ? 'player' : aiScore > playerScore ? 'ai' : 'draw') : null;

  // Pit display: top row (AI) left-to-right in UI = indices 5,4,3,2,1,0
  const aiPitOrder = [5, 4, 3, 2, 1, 0];
  const playerPitOrder = [7, 8, 9, 10, 11, 12];

  const PitCell = ({ idx, isPlayer }) => {
    const stones = pits[idx];
    const active = isPlayer && turn === 'player' && !over && stones > 0;
    const wasLast = lastMoved === idx;
    return (
      <div onClick={() => isPlayer && handlePlayerMove(idx)} style={{
        width: 56, height: 56, borderRadius: '50%', cursor: active ? 'pointer' : 'default',
        background: wasLast ? 'rgba(232,184,0,.3)' : active ? 'rgba(232,184,0,.1)' : 'rgba(255,255,255,.05)',
        border: active ? '2px solid rgba(232,184,0,.5)' : wasLast ? '2px solid rgba(232,184,0,.5)' : '1px solid rgba(255,255,255,.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: stones > 9 ? 13 : 17, fontWeight: 'bold', color: stones === 0 ? '#333' : '#e0e0e0',
        transition: 'all .15s', flexShrink: 0,
      }}>
        {stones > 0 ? stones : '·'}
      </div>
    );
  };

  const StoreBin = ({ value, label, highlight }) => (
    <div style={{
      width: 60, height: 140, borderRadius: 30,
      background: highlight ? 'rgba(232,184,0,.15)' : 'rgba(255,255,255,.04)',
      border: highlight ? '2px solid rgba(232,184,0,.5)' : '1px solid rgba(255,255,255,.1)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#e8b800' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div className="game-shell" style={{ maxWidth: 500, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🪨'} Mancala Vault</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {winner && (
        <div className="winner-banner">
          {winner === 'player' ? `🏆 You Win! ${playerScore} – ${aiScore}` :
           winner === 'ai'     ? `🤖 AI Wins! ${aiScore} – ${playerScore}` :
           `⚖️ Draw! ${playerScore} each`}
        </div>
      )}

      {!over && (
        <div className="turn-indicator">
          {aiThink ? '🤖 AI thinking…' : turn === 'player' ? '🟡 Your turn — click a pit' : '🤖 AI turn'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '16px 0' }}>
        {/* AI store (left) */}
        <StoreBin value={aiScore} label={isAI ? 'AI' : 'P2'} highlight={turn === 'ai'} />

        {/* Pit grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* AI pits (top, right-to-left visually) */}
          <div style={{ display: 'flex', gap: 6 }}>
            {aiPitOrder.map(idx => <PitCell key={idx} idx={idx} isPlayer={false} />)}
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#444' }}>
            ← AI stones flow this way
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#444' }}>
            Your stones flow this way →
          </div>
          {/* Player pits (bottom, left-to-right) */}
          <div style={{ display: 'flex', gap: 6 }}>
            {playerPitOrder.map(idx => <PitCell key={idx} idx={idx} isPlayer={true} />)}
          </div>
        </div>

        {/* Player store (right) */}
        <StoreBin value={playerScore} label="You" highlight={turn === 'player'} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 8 }}>
        <span>AI: {aiPitOrder.reduce((s, i) => s + pits[i], 0)} stones in pits</span>
        <span>You: {playerPitOrder.reduce((s, i) => s + pits[i], 0)} stones in pits</span>
      </div>
    </div>
  );
}
