import React, { useState, useEffect, useCallback } from 'react';

/* Gin Rummy — RummyRun
 * Deal 10 cards each. Draw from stock or discard pile.
 * Discard one card. Knock when deadwood ≤ 10. Gin = 0 deadwood.
 * Score = opponent deadwood − your deadwood (+ 25 gin bonus).
 * First to 100 wins.
 */

const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RED = new Set(['♥','♦']);
const VAL = { A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:10,Q:10,K:10 };
const RANK_IDX = Object.fromEntries(RANKS.map((r,i)=>[r,i]));

function makeDeck() {
  const d = [];
  let id = 0;
  for (const s of SUITS) for (const r of RANKS) d.push({ id: id++, suit: s, rank: r });
  return shuffle(d);
}
function shuffle(a) { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }

// Find all melds in a hand
function findMelds(hand) {
  const melds = [];
  // Sets: 3+ of same rank
  const byRank = {};
  hand.forEach(c => { if (!byRank[c.rank]) byRank[c.rank] = []; byRank[c.rank].push(c); });
  Object.values(byRank).forEach(group => { if (group.length >= 3) melds.push(group.slice(0,Math.min(group.length,4))); });
  // Runs: 3+ consecutive same suit
  const bySuit = {};
  hand.forEach(c => { if (!bySuit[c.suit]) bySuit[c.suit] = []; bySuit[c.suit].push(c); });
  Object.values(bySuit).forEach(group => {
    const sorted = group.sort((a,b) => RANK_IDX[a.rank] - RANK_IDX[b.rank]);
    let run = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (RANK_IDX[sorted[i].rank] === RANK_IDX[sorted[i-1].rank] + 1) {
        run.push(sorted[i]);
      } else {
        if (run.length >= 3) melds.push([...run]);
        run = [sorted[i]];
      }
    }
    if (run.length >= 3) melds.push([...run]);
  });
  return melds;
}

function deadwood(hand) {
  // Try to maximally meld to minimize deadwood
  const melds = findMelds(hand);
  let minDW = hand.reduce((s,c) => s + VAL[c.rank], 0);
  // Try each combination of non-overlapping melds
  const tryMelds = (remaining, usedIds) => {
    const dw = remaining.filter(c => !usedIds.has(c.id)).reduce((s,c) => s + VAL[c.rank], 0);
    minDW = Math.min(minDW, dw);
    for (const meld of melds) {
      if (meld.every(c => !usedIds.has(c.id))) {
        const next = new Set([...usedIds, ...meld.map(c => c.id)]);
        tryMelds(remaining, next);
      }
    }
  };
  tryMelds(hand, new Set());
  return minDW;
}

function initGame() {
  const deck = makeDeck();
  const playerHand = deck.splice(0, 10);
  const aiHand = deck.splice(0, 10);
  const discard = [deck.pop()];
  return { deck, playerHand, aiHand, discard, turn: 'player', phase: 'draw', over: false, winner: null, pScore: 0, aScore: 0, round: 1 };
}

function CardFace({ card, selected, onClick, dimmed }) {
  const red = RED.has(card.suit);
  return (
    <div onClick={onClick} style={{
      width: 44, height: 64, borderRadius: 7,
      background: '#f5f5f0', border: selected ? '2.5px solid #e8b800' : '1.5px solid #ccc',
      cursor: onClick ? 'pointer' : 'default', flexShrink: 0,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '3px 4px', userSelect: 'none',
      opacity: dimmed ? 0.45 : 1,
      boxShadow: selected ? '0 0 10px rgba(232,184,0,.6)' : '0 1px 3px rgba(0,0,0,.4)',
      transform: selected ? 'translateY(-8px)' : 'none',
      transition: 'transform .15s, opacity .15s',
    }}>
      <span style={{ fontSize: 11, fontWeight: 'bold', color: red ? '#c0392b' : '#1a1a2e', lineHeight: 1 }}>{card.rank}{card.suit}</span>
      <span style={{ fontSize: 11, fontWeight: 'bold', color: red ? '#c0392b' : '#1a1a2e', textAlign: 'right', transform: 'rotate(180deg)', lineHeight: 1 }}>{card.rank}{card.suit}</span>
    </div>
  );
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Rummy Run — Gin Rummy</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Knock or go Gin before the AI, and score more points.</p>
        <h4>Melds</h4><ul>
          <li><b>Sets:</b> 3–4 cards of the same rank (e.g. 7♠ 7♥ 7♦).</li>
          <li><b>Runs:</b> 3+ consecutive cards of the same suit (e.g. 4♥ 5♥ 6♥).</li>
        </ul>
        <h4>A Turn</h4><ul>
          <li>Draw from the <b>stock</b> (face-down) or top of the <b>discard pile</b>.</li>
          <li>Click a card in your hand to select it, then click <b>Discard</b>.</li>
          <li>When your unmelded cards (deadwood) total ≤ 10 pts, click <b>Knock</b>.</li>
          <li>0 deadwood = <b>Gin!</b> (+25 bonus).</li>
        </ul>
        <h4>Scoring</h4><p>Your score = opponent deadwood − your deadwood. First to 100 wins.</p>
      </div>
    </div>
  </div>
);

export default function RummyRun({ game, gameMode, onBack, onExit }) {
  const exit = onBack || onExit || null;
  const isAI = gameMode !== 'local';

  const [gs, setGs] = useState(initGame);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('Draw a card to start.');
  const [showHelp, setShowHelp] = useState(false);
  const [aiThink, setAiThink] = useState(false);

  const reset = () => { setGs(initGame()); setSelected(null); setMsg('Draw a card to start.'); };

  const pDW = deadwood(gs.playerHand);
  const aDW = deadwood(gs.aiHand);

  const drawStock = () => {
    if (gs.turn !== 'player' || gs.phase !== 'draw' || gs.over) return;
    const d = [...gs.deck];
    if (!d.length) { setMsg('Stock empty.'); return; }
    const card = d.pop();
    setGs(prev => ({ ...prev, deck: d, playerHand: [...prev.playerHand, card], phase: 'discard' }));
    setMsg(`Drew ${card.rank}${card.suit}. Now discard a card.`);
  };

  const drawDiscard = () => {
    if (gs.turn !== 'player' || gs.phase !== 'draw' || gs.over || !gs.discard.length) return;
    const dis = [...gs.discard];
    const card = dis.pop();
    setGs(prev => ({ ...prev, discard: dis, playerHand: [...prev.playerHand, card], phase: 'discard' }));
    setMsg(`Took ${card.rank}${card.suit} from discard. Now discard.`);
  };

  const handleDiscard = () => {
    if (gs.turn !== 'player' || gs.phase !== 'discard' || selected === null || gs.over) return;
    const card = gs.playerHand[selected];
    const newHand = gs.playerHand.filter((_, i) => i !== selected);
    setGs(prev => ({ ...prev, playerHand: newHand, discard: [...prev.discard, card], turn: 'ai', phase: 'draw' }));
    setSelected(null);
    setMsg('AI turn…');
  };

  const handleKnock = () => {
    if (gs.turn !== 'player' || gs.phase !== 'discard' || gs.over) return;
    const dw = deadwood(gs.playerHand);
    if (dw > 10) { setMsg(`Deadwood too high (${dw}). Need ≤ 10.`); return; }
    const gin = dw === 0;
    const roundScore = Math.max(0, aDW - dw) + (gin ? 25 : 0);
    const newPS = gs.pScore + roundScore;
    setGs(prev => ({
      ...prev, over: newPS >= 100, winner: newPS >= 100 ? 'player' : null,
      pScore: newPS, phase: 'result',
    }));
    setMsg(gin ? `🎉 GIN! You score ${roundScore} pts!` : `Knock! AI had ${aDW} deadwood. You score ${roundScore} pts.`);
  };

  // AI turn
  useEffect(() => {
    if (!isAI || gs.turn !== 'ai' || gs.over || gs.phase !== 'draw' || aiThink) return;
    setAiThink(true);
    const t = setTimeout(() => {
      setGs(prev => {
        const topDiscard = prev.discard[prev.discard.length - 1];
        let hand = [...prev.aiHand];
        let deck = [...prev.deck];
        let discard = [...prev.discard];

        // Draw: take discard if it improves, else stock
        let drawn;
        if (topDiscard) {
          const withDiscard = [...hand, topDiscard];
          if (deadwood(withDiscard) < deadwood(hand)) {
            drawn = topDiscard;
            discard = discard.slice(0, -1);
          }
        }
        if (!drawn) {
          if (!deck.length) return { ...prev, turn: 'player', phase: 'draw' };
          drawn = deck.pop();
        }
        hand = [...hand, drawn];

        // Discard highest deadwood card
        let worstIdx = 0, worstDW = -1;
        for (let i = 0; i < hand.length; i++) {
          const without = hand.filter((_, j) => j !== i);
          const dw = deadwood(without);
          if (dw > worstDW) { worstDW = dw; worstIdx = i; }
        }
        const discarded = hand[worstIdx];
        hand = hand.filter((_, i) => i !== worstIdx);
        discard = [...discard, discarded];

        // Knock if possible
        const aiDW = deadwood(hand);
        if (aiDW <= 10) {
          const playerDW = deadwood(prev.playerHand);
          const gin = aiDW === 0;
          const roundScore = Math.max(0, playerDW - aiDW) + (gin ? 25 : 0);
          const newAS = prev.aScore + roundScore;
          return {
            ...prev, deck, aiHand: hand, discard, turn: 'player', phase: 'result',
            aScore: newAS, over: newAS >= 100, winner: newAS >= 100 ? 'ai' : null,
          };
        }

        return { ...prev, deck, aiHand: hand, discard, turn: 'player', phase: 'draw' };
      });
      setMsg(prev => prev.includes('AI') ? 'Your turn. Draw a card.' : prev);
      setAiThink(false);
    }, 900);
    return () => clearTimeout(t);
  }, [gs.turn, gs.over, gs.phase, isAI, aiThink]);

  const nextRound = () => {
    const { pScore, aScore } = gs;
    setGs({ ...initGame(), pScore, aScore, round: gs.round + 1 });
    setSelected(null); setMsg('Draw a card to start.');
  };

  const topDiscard = gs.discard[gs.discard.length - 1];

  return (
    <div className="game-shell" style={{ maxWidth: 560, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🃏'} Rummy Run</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {gs.over && <div className="winner-banner">{gs.winner === 'player' ? `🏆 You Win! ${gs.pScore}–${gs.aScore}` : `🤖 AI Wins! ${gs.aScore}–${gs.pScore}`}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
        <span style={{ color: '#e8b800' }}>You: {gs.pScore} pts · DW: {pDW}</span>
        <span style={{ color: '#888', fontSize: 11 }}>Round {gs.round} · First to 100</span>
        {isAI && <span style={{ color: '#c0392b' }}>🤖 AI: {gs.aScore} pts · DW: {aDW}</span>}
      </div>

      {msg && <div className="turn-indicator">{aiThink ? '🤖 AI thinking…' : msg}</div>}

      {/* AI hand (face down) */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>🤖 AI Hand ({gs.aiHand.length})</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {gs.aiHand.map((_, i) => (
            <div key={i} style={{ width: 44, height: 64, borderRadius: 7, background: 'linear-gradient(135deg,#1a1a3e,#2a2a5a)', border: '1.5px solid #3a3a6a' }} />
          ))}
        </div>
      </div>

      {/* Stock + discard */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
        <div onClick={gs.turn === 'player' && gs.phase === 'draw' && !gs.over ? drawStock : undefined} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Stock ({gs.deck.length})</div>
          <div style={{ width: 44, height: 64, borderRadius: 7, background: 'linear-gradient(135deg,#1a1a3e,#2a2a5a)', border: '1.5px solid rgba(232,184,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: gs.turn === 'player' && gs.phase === 'draw' && !gs.over ? 'pointer' : 'default' }}>🃏</div>
          {gs.turn === 'player' && gs.phase === 'draw' && <div style={{ fontSize: 9, color: '#e8b800', textAlign: 'center', marginTop: 2 }}>Click</div>}
        </div>
        <div onClick={gs.turn === 'player' && gs.phase === 'draw' && topDiscard && !gs.over ? drawDiscard : undefined}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Discard</div>
          {topDiscard ? <CardFace card={topDiscard} onClick={gs.turn === 'player' && gs.phase === 'draw' && !gs.over ? drawDiscard : undefined} /> : <div style={{ width: 44, height: 64, borderRadius: 7, border: '1.5px dashed #333' }} />}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          {gs.turn === 'player' && gs.phase === 'discard' && !gs.over && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end' }}>
              <button className="bv-button" onClick={handleDiscard} disabled={selected === null} style={{ fontSize: 12 }}>
                Discard Selected
              </button>
              <button className="bv-button" onClick={handleKnock} style={{ fontSize: 12, background: pDW === 0 ? 'rgba(76,175,80,.2)' : undefined }}>
                {pDW === 0 ? '🎉 GIN!' : pDW <= 10 ? `Knock (DW: ${pDW})` : `DW: ${pDW} — too high`}
              </button>
            </div>
          )}
          {gs.phase === 'result' && !gs.over && (
            <button className="bv-button" onClick={nextRound}>Next Round →</button>
          )}
        </div>
      </div>

      {/* Player hand */}
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Your Hand</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {gs.playerHand.map((card, i) => (
            <CardFace key={card.id} card={card} selected={selected === i}
              onClick={gs.turn === 'player' && !gs.over ? () => setSelected(selected === i ? null : i) : undefined}
              dimmed={gs.turn !== 'player'} />
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#555', marginTop: 6 }}>Deadwood: {pDW} pts · Tap to select · Tap again to deselect</div>
      </div>
    </div>
  );
}
