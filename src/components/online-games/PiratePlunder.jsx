import React, { useState, useEffect } from 'react';

/* Pirate Plunder — Push Your Luck
 * Deck of treasure + hazard cards. Each round, flip cards one at a time.
 * Collect treasure or "bank" it before a hazard card wipes your haul.
 * 5 rounds. Most gold wins.
 */

const DECK_TEMPLATE = [
  ...Array(8).fill({ type:'gold',    value:10,  icon:'💰', label:'Gold Coin' }),
  ...Array(5).fill({ type:'silver',  value:5,   icon:'🪙',  label:'Silver' }),
  ...Array(4).fill({ type:'gem',     value:15,  icon:'💎',  label:'Gem' }),
  ...Array(4).fill({ type:'pearl',   value:8,   icon:'🫧',  label:'Pearl' }),
  ...Array(2).fill({ type:'kraken',  value:0,   icon:'🦑',  label:'Kraken!', hazard:true }),
  ...Array(2).fill({ type:'storm',   value:0,   icon:'⛈️',  label:'Storm!',  hazard:true }),
  ...Array(2).fill({ type:'siren',   value:0,   icon:'🧜',  label:'Siren!',  hazard:true }),
  ...Array(1).fill({ type:'anchor',  value:0,   icon:'⚓',  label:'Anchor!', hazard:true }),
];

function shuffle(a) {
  const b = a.map((c, i) => ({ ...c, id: i }));
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

const AI_THRESHOLD = 30; // AI banks when haul > this value

export default function PiratePlunder(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;

  const [round, setRound]     = useState(1);
  const [phase, setPhase]     = useState('idle'); // idle | flipping | banked | hazard | gameover
  const [deck, setDeck]       = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [playerHaul, setPlayerHaul] = useState(0);
  const [aiHaul, setAiHaul]   = useState(0);
  const [pScore, setPScore]   = useState(0);
  const [aScore, setAScore]   = useState(0);
  const [message, setMessage] = useState('');
  const [aiFlipping, setAiFlipping] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const ROUNDS = 5;

  const startRound = () => {
    setDeck(shuffle(DECK_TEMPLATE));
    setRevealed([]);
    setPlayerHaul(0);
    setAiHaul(0);
    setPhase('flipping');
    setMessage('');
  };

  const reset = () => {
    setRound(1); setPhase('idle'); setDeck([]); setRevealed([]); setPlayerHaul(0); setAiHaul(0);
    setPScore(0); setAScore(0); setMessage('');
  };

  const flipCard = () => {
    if (phase !== 'flipping' || deck.length === 0) return;
    const [card, ...rest] = deck;
    const newRevealed = [...revealed, card];
    setDeck(rest);
    setRevealed(newRevealed);

    if (card.hazard) {
      setMessage(`${card.icon} ${card.label}! Your haul of 💰${playerHaul} is lost!`);
      setPlayerHaul(0);
      // After a hazard, continue with remaining deck for AI phase or end round
      setPhase('hazard');
    } else {
      const newHaul = playerHaul + card.value;
      setPlayerHaul(newHaul);
      setMessage(`${card.icon} +${card.value} gold → your haul: 💰${newHaul}`);
    }
  };

  const bank = () => {
    if (phase !== 'flipping' && phase !== 'hazard') return;
    const banked = playerHaul;
    setPScore(s => s + banked);
    setMessage(`✅ Banked 💰${banked}! Starting AI turn…`);
    setPlayerHaul(0);
    setPhase('banked');
  };

  // AI turn after player banks or gets hazarded
  useEffect(() => {
    if (phase !== 'banked' && phase !== 'hazard') return;
    setAiFlipping(true);
    let aiHaul = 0;
    let deckForAI = [...deck];
    let revForAI  = [...revealed];

    const runAI = async () => {
      while (deckForAI.length > 0) {
        await new Promise(r => setTimeout(r, 500));
        const [card, ...rest] = deckForAI;
        deckForAI = rest;
        revForAI = [...revForAI, card];
        setRevealed([...revForAI]);

        if (card.hazard) {
          setAiHaul(0);
          setMessage(prev => prev + ` · 🤖 AI got ${card.icon} — haul lost!`);
          aiHaul = 0;
          break;
        } else {
          aiHaul += card.value;
          setAiHaul(aiHaul);
          if (aiHaul >= AI_THRESHOLD) {
            setMessage(prev => prev + ` · 🤖 AI banks 💰${aiHaul}!`);
            break;
          }
        }
      }
      setAScore(s => s + aiHaul);
      await new Promise(r => setTimeout(r, 600));
      // End round
      if (round >= ROUNDS) {
        setPhase('gameover');
      } else {
        setRound(r => r + 1);
        setPhase('idle');
      }
      setAiFlipping(false);
    };
    runAI();
  }, [phase]);

  const pTotal = pScore, aTotal = aScore;
  const winner = phase === 'gameover' ? (pTotal > aTotal ? 'You' : aTotal > pTotal ? 'AI' : 'Draw') : null;

  return (
    <div className="game-shell" style={{ maxWidth: 480, margin: '0 auto' }}>
      {showHelp && (
        <div className="htp-overlay" onClick={() => setShowHelp(false)}>
          <div className="htp-box" onClick={e => e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Pirate Plunder</p><button className="bv-button secondary" onClick={() => setShowHelp(false)}>✕</button></div>
            <div className="htp-body">
              <h4>Objective</h4><p>Collect more gold than the AI across {ROUNDS} rounds.</p>
              <h4>Each Round</h4><ul>
                <li>Flip cards from the shared treasure deck one by one.</li>
                <li>Treasure cards add gold to your haul.</li>
                <li>Hazard cards (Kraken, Storm, Siren, Anchor) wipe your <b>unbanked</b> haul!</li>
                <li>Click <b>Bank It!</b> to safely secure your haul before risking a hazard.</li>
                <li>After you bank or get hazarded, the AI takes its turn from remaining cards.</li>
              </ul>
              <h4>Scoring</h4><p>Banked gold accumulates over {ROUNDS} rounds. Most total gold wins!</p>
            </div>
          </div>
        </div>
      )}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🏴‍☠️'} Pirate Plunder</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {winner && (
        <div className="winner-banner">
          {winner === 'Draw' ? `⚖️ Draw! Both scored 💰${pTotal}` :
           winner === 'You' ? `🏆 You Win! 💰${pTotal} vs 💰${aTotal}` :
           `🤖 AI Wins! 💰${aTotal} vs 💰${pTotal}`}
        </div>
      )}

      {/* Scores */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="bv-card" style={{ padding: '8px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#888' }}>You</div>
          <div style={{ fontSize: 22, color: '#e8b800', fontWeight: 'bold' }}>💰{pScore}</div>
          {phase === 'flipping' && playerHaul > 0 && <div style={{ fontSize: 11, color: '#4caf50' }}>+{playerHaul} at risk</div>}
        </div>
        <div style={{ alignSelf: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888' }}>Round {Math.min(round, ROUNDS)}/{ROUNDS}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{deck.length} cards left</div>
        </div>
        <div className="bv-card" style={{ padding: '8px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#888' }}>🤖 AI</div>
          <div style={{ fontSize: 22, color: '#c0392b', fontWeight: 'bold' }}>💰{aScore}</div>
          {aiFlipping && aiHaul > 0 && <div style={{ fontSize: 11, color: '#f39c12' }}>+{aiHaul} at risk</div>}
        </div>
      </div>

      {message && (
        <div style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(232,184,0,.06)', border: '1px solid rgba(232,184,0,.2)', borderRadius: 8, marginBottom: 10, fontSize: 13, color: '#e0e0e0' }}>
          {message}
        </div>
      )}

      {/* Revealed cards */}
      <div className="bv-card" style={{ padding: 10, marginBottom: 12, minHeight: 80 }}>
        <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>Flipped Cards</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {revealed.map((c, i) => (
            <div key={c.id} style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 11,
              background: c.hazard ? 'rgba(192,57,43,.2)' : 'rgba(39,174,96,.12)',
              border: c.hazard ? '1px solid rgba(192,57,43,.4)' : '1px solid rgba(39,174,96,.3)',
              color: '#e0e0e0',
            }}>
              {c.icon} {c.hazard ? c.label : `+${c.value}`}
            </div>
          ))}
          {!revealed.length && <span style={{ color: '#444', fontSize: 12 }}>No cards flipped yet.</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {phase === 'idle' && !winner && (
          <button className="bv-button" style={{ fontSize: 15, padding: '12px 32px' }} onClick={startRound}>
            ⚔️ Start Round {round}
          </button>
        )}
        {phase === 'flipping' && (
          <>
            <button className="bv-button" style={{ fontSize: 14, padding: '10px 24px' }} onClick={flipCard} disabled={deck.length === 0}>
              🃏 Flip Card
            </button>
            {playerHaul > 0 && (
              <button className="bv-button" style={{ fontSize: 14, padding: '10px 24px', background: 'rgba(39,174,96,.2)', borderColor: 'rgba(39,174,96,.5)', color: '#4caf50' }} onClick={bank}>
                🏦 Bank 💰{playerHaul}
              </button>
            )}
          </>
        )}
        {phase === 'hazard' && (
          <button className="bv-button secondary" onClick={bank}>Continue →</button>
        )}
        {aiFlipping && <div style={{ color: '#888', alignSelf: 'center', fontSize: 13 }}>🤖 AI taking turn…</div>}
      </div>
    </div>
  );
}
