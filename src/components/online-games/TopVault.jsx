import React, { useMemo, useState } from "react";

const CARDS = [
  { name: "Iron Wraith", icon: "👻", strength: 91, stealth: 70, tech: 64, luck: 55, speed: 62 },
  { name: "Cipher Fox", icon: "🦊", strength: 45, stealth: 94, tech: 88, luck: 72, speed: 81 },
  { name: "Vault Medic", icon: "⚕️", strength: 52, stealth: 60, tech: 83, luck: 90, speed: 58 },
  { name: "The Warden", icon: "🛡️", strength: 88, stealth: 48, tech: 76, luck: 50, speed: 54 },
  { name: "Breach Drone", icon: "🤖", strength: 61, stealth: 75, tech: 97, luck: 42, speed: 86 },
  { name: "Viper", icon: "🐍", strength: 66, stealth: 91, tech: 58, luck: 68, speed: 93 },
  { name: "Steel Broker", icon: "💼", strength: 57, stealth: 73, tech: 79, luck: 95, speed: 46 },
  { name: "Crimson Runner", icon: "🏃", strength: 49, stealth: 77, tech: 55, luck: 62, speed: 99 },
  { name: "Obsidian Knight", icon: "♞", strength: 94, stealth: 50, tech: 67, luck: 60, speed: 48 },
  { name: "Ghost Signal", icon: "📡", strength: 40, stealth: 89, tech: 96, luck: 66, speed: 74 },
  { name: "Blackout Queen", icon: "👑", strength: 78, stealth: 86, tech: 84, luck: 88, speed: 72 },
  { name: "Rust Jackal", icon: "🦴", strength: 72, stealth: 69, tech: 41, luck: 80, speed: 79 },
];

const STATS = ["strength", "stealth", "tech", "luck", "speed"];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function splitDeck() {
  const deck = shuffle(CARDS);
  return [deck.filter((_, i) => i % 2 === 0), deck.filter((_, i) => i % 2 === 1)];
}

function bestStat(card) {
  return STATS.reduce((best, stat) => (card[stat] > card[best] ? stat : best), STATS[0]);
}

function CardView({ card, hidden = false }) {
  if (!card) return <div className="topvault-card empty">No Card</div>;

  return (
    <div className={`topvault-card ${hidden ? "hidden" : ""}`}>
      <div className="topvault-card-top">
        <span className="topvault-icon">{hidden ? "❔" : card.icon}</span>
        <h3>{hidden ? "Hidden Card" : card.name}</h3>
      </div>

      {!hidden && (
        <div className="topvault-stats">
          {STATS.map((stat) => (
            <div className="topvault-stat" key={stat}>
              <span>{stat.toUpperCase()}</span>
              <strong>{card[stat]}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopVault({ gameMode, mode, selectedMode, onExit }) {
  const modeText = `${gameMode || ""} ${mode || ""} ${selectedMode || ""}`.toLowerCase();
  const aiMode = modeText.includes("ai") || modeText.includes("computer") || modeText.includes("bot") || !modeText.includes("same");

  const initial = useMemo(() => splitDeck(), []);
  const [playerDeck, setPlayerDeck] = useState(initial[0]);
  const [aiDeck, setAiDeck] = useState(initial[1]);
  const [pot, setPot] = useState([]);
  const [roundResult, setRoundResult] = useState("Choose a stat from your top card.");
  const [revealed, setRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const playerCard = playerDeck[0];
  const aiCard = aiDeck[0];

  function resetGame() {
    const [p, a] = splitDeck();
    setPlayerDeck(p);
    setAiDeck(a);
    setPot([]);
    setRoundResult("Choose a stat from your top card.");
    setRevealed(false);
    setGameOver(false);
  }

  function playStat(stat) {
    if (gameOver || !playerCard || !aiCard) return;

    setRevealed(true);

    const pVal = playerCard[stat];
    const aVal = aiCard[stat];
    const battleCards = [playerCard, aiCard, ...pot];

    setTimeout(() => {
      if (pVal > aVal) {
        setPlayerDeck((d) => [...d.slice(1), ...battleCards]);
        setAiDeck((d) => d.slice(1));
        setPot([]);
        setRoundResult(`You won with ${stat.toUpperCase()} ${pVal} vs ${aVal}.`);
      } else if (aVal > pVal) {
        setAiDeck((d) => [...d.slice(1), ...battleCards]);
        setPlayerDeck((d) => d.slice(1));
        setPot([]);
        setRoundResult(`Opponent won with ${stat.toUpperCase()} ${aVal} vs ${pVal}.`);
      } else {
        setPlayerDeck((d) => d.slice(1));
        setAiDeck((d) => d.slice(1));
        setPot((old) => [...old, ...battleCards]);
        setRoundResult(`Draw on ${stat.toUpperCase()} ${pVal}. Cards go to the vault pot.`);
      }

      setRevealed(false);
    }, 900);
  }

  React.useEffect(() => {
    if (playerDeck.length === 0 || aiDeck.length === 0) {
      setGameOver(true);
      setRoundResult(playerDeck.length > aiDeck.length ? "You win the deck!" : "Opponent wins the deck!");
    }
  }, [playerDeck.length, aiDeck.length]);

  React.useEffect(() => {
    if (!aiMode || gameOver || !playerCard || !aiCard) return;
    // AI only picks when player isn't meant to manually choose. In normal AI mode, human still chooses stat.
  }, [aiMode, gameOver]);

  return (
    <div className="topvault-page game-shell">
      <div className="game-top-actions">
        <button onClick={onExit}>Back to Lobby</button>
        <button onClick={resetGame}>New Game</button>
        <button onClick={resetGame}>Reset</button>
        <button onClick={() => setShowRules((s) => !s)}>How to Play</button>
      </div>

      <header className="topvault-header">
        <h1>🃏 Top Vault</h1>
        <p>Classic stat-card battle. Choose your best stat and take the cards.</p>
      </header>

      {showRules && (
        <section className="game-panel">
          <h2>How to Play</h2>
          <p>Your top card faces the opponent’s top card. Choose one stat: Strength, Stealth, Tech, Luck, or Speed.</p>
          <p>Highest number wins both cards. A draw sends cards into the pot for the next winner.</p>
          <p>Win by taking the full deck.</p>
        </section>
      )}

      <section className="topvault-scorebar game-panel">
        <strong>Your Cards: {playerDeck.length}</strong>
        <strong>Vault Pot: {pot.length}</strong>
        <strong>Opponent Cards: {aiDeck.length}</strong>
      </section>

      <main className="topvault-table">
        <CardView card={playerCard} />
        <div className="topvault-battle-panel game-panel">
          <h2>{roundResult}</h2>
          {!gameOver && playerCard && (
            <div className="topvault-stat-buttons">
              {STATS.map((stat) => (
                <button key={stat} onClick={() => playStat(stat)} disabled={revealed}>
                  {stat.toUpperCase()} {playerCard[stat]}
                </button>
              ))}
            </div>
          )}
          {gameOver && <button onClick={resetGame}>Play Again</button>}
        </div>
        <CardView card={aiCard} hidden={!revealed} />
      </main>
    </div>
  );
}