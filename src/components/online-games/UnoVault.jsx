import React, { useEffect, useMemo, useState } from "react";
import { isAiMode } from "../../lib/gameMode";

const COLORS = ["Red", "Blue", "Green", "Yellow"];
const COLOR_HEX = {
  Red: "#d23b3b",
  Blue: "#3577d6",
  Green: "#2da45d",
  Yellow: "#d9b526",
  Wild: "#9b59b6",
};

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function buildDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ color, value: "0", key: `${color}-0-a` });
    for (let n = 1; n <= 9; n += 1) {
      deck.push({ color, value: String(n), key: `${color}-${n}-a` });
      deck.push({ color, value: String(n), key: `${color}-${n}-b` });
    }
    ["Skip", "Reverse", "Draw2"].forEach((value) => {
      deck.push({ color, value, key: `${color}-${value}-a` });
      deck.push({ color, value, key: `${color}-${value}-b` });
    });
  }
  for (let i = 0; i < 4; i += 1) {
    deck.push({ color: "Wild", value: "Wild", key: `Wild-${i}` });
    deck.push({ color: "Wild", value: "Wild+4", key: `Wild+4-${i}` });
  }
  return shuffle(deck);
}

function isPlayable(card, topCard, activeColor) {
  if (!card || !topCard) return false;
  return (
    card.color === "Wild" ||
    card.color === activeColor ||
    card.value === topCard.value
  );
}

function pickColor(hand) {
  const counts = COLORS.map((color) => [
    color,
    hand.filter((card) => card.color === color).length,
  ]).sort((a, b) => b[1] - a[1]);
  return counts[0]?.[0] || "Red";
}

function cardLabel(card) {
  if (!card) return "";
  if (card.color === "Wild") return card.value;
  return `${card.color} ${card.value}`;
}

function dealInitialHand(deck, count = 7) {
  const nextDeck = [...deck];
  const hand = [];
  while (hand.length < count && nextDeck.length) hand.push(nextDeck.shift());
  return [hand, nextDeck];
}

function ensureDiscardStarter(deck) {
  const nextDeck = [...deck];
  while (nextDeck.length) {
    const card = nextDeck.shift();
    if (card.color !== "Wild") return [card, nextDeck];
    nextDeck.push(card);
  }
  return [null, nextDeck];
}

function cardStyle(card, playable) {
  const bg = COLOR_HEX[card?.color] || "#444";
  return {
    width: 72,
    minHeight: 104,
    borderRadius: 14,
    border: playable ? "2px solid #f5d76e" : "2px solid rgba(255,255,255,0.14)",
    background: `linear-gradient(160deg, ${bg}, #111)`,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 8,
    boxShadow: playable ? "0 0 16px rgba(245,215,110,0.28)" : "0 8px 18px rgba(0,0,0,0.28)",
    transform: playable ? "translateY(-3px)" : "translateY(0)",
    transition: "all 0.18s ease",
    cursor: "pointer",
    userSelect: "none",
  };
}

function CardFace({ card, playable, onClick, small = false }) {
  const size = small ? { width: 58, minHeight: 86 } : {};
  return (
    <button type="button" onClick={onClick} title={cardLabel(card)} style={{ ...cardStyle(card, playable), ...size }}>
      <div style={{ fontSize: small ? 12 : 13, fontWeight: 700, opacity: 0.95 }}>{card.color}</div>
      <div style={{ fontSize: small ? 24 : 30, fontWeight: 900, textAlign: "center", lineHeight: 1 }}>{card.value}</div>
      <div style={{ fontSize: small ? 15 : 18, fontWeight: 800, textAlign: "right", opacity: 0.95 }}>{card.value}</div>
    </button>
  );
}

function HiddenCard({ count }) {
  return (
    <div
      title={`Draw pile: ${count}`}
      style={{
        width: 68,
        minHeight: 100,
        borderRadius: 14,
        border: "2px solid rgba(255,255,255,0.18)",
        background: "linear-gradient(160deg, #1c1c1c, #640909)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 18px rgba(0,0,0,0.28)",
        fontWeight: 800,
      }}
    >
      {count}
    </div>
  );
}

export default function UnoVault(props = {}) {
  const aiMode = isAiMode([props?.gameMode, props?.mode, props?.selectedMode]);
  const [deck, setDeck] = useState([]);
  const [hands, setHands] = useState([[], []]);
  const [discard, setDiscard] = useState([]);
  const [turn, setTurn] = useState(0);
  const [activeColor, setActiveColor] = useState("Red");
  const [status, setStatus] = useState("Deal and play a real-style UNO hand.");
  const [winner, setWinner] = useState(null);

  const topCard = discard[discard.length - 1] || null;
  const playerHand = hands[0] || [];
  const aiHand = hands[1] || [];
  const legalIndexes = useMemo(
    () => playerHand.map((card, index) => (isPlayable(card, topCard, activeColor) ? index : -1)).filter((index) => index >= 0),
    [playerHand, topCard, activeColor]
  );

  useEffect(() => {
    reset();
  }, []);

  useEffect(() => {
    if (!aiMode || turn !== 1 || winner !== null || !topCard) return undefined;
    const timer = setTimeout(() => {
      aiTakeTurn();
    }, 750);
    return () => clearTimeout(timer);
  }, [aiMode, turn, winner, topCard, activeColor, hands, deck]);

  function reset() {
    let nextDeck = buildDeck();
    let p0;
    let p1;
    [p0, nextDeck] = dealInitialHand(nextDeck, 7);
    [p1, nextDeck] = dealInitialHand(nextDeck, 7);
    let starter;
    [starter, nextDeck] = ensureDiscardStarter(nextDeck);
    setDeck(nextDeck);
    setHands([p0, p1]);
    setDiscard(starter ? [starter] : []);
    setActiveColor(starter?.color || "Red");
    setTurn(0);
    setWinner(null);
    setStatus(`New hand ready. ${starter ? `Starting discard: ${cardLabel(starter)}.` : ""} Player 1 goes first.`);
  }

  function replenishDeck(currentDeck, currentDiscard) {
    if (currentDeck.length > 0) return [currentDeck, currentDiscard];
    if (currentDiscard.length <= 1) return [currentDeck, currentDiscard];
    const top = currentDiscard[currentDiscard.length - 1];
    const recycled = shuffle(currentDiscard.slice(0, -1));
    return [recycled, [top]];
  }

  function applyCardEffect(card, nextHands, nextDeck, currentTurn, chosenColor) {
    const target = 1 - currentTurn;
    const nextColor = card.color === "Wild" ? chosenColor : card.color;
    let newTurn = target;
    let updatedHands = nextHands.map((hand) => [...hand]);
    let updatedDeck = [...nextDeck];
    let note = `${currentTurn === 0 ? "You" : "AI"} played ${cardLabel(card)}.`;

    const drawCards = (who, count) => {
      for (let i = 0; i < count; i += 1) {
        [updatedDeck] = replenishDeck(updatedDeck, [...discard, card]);
        if (!updatedDeck.length) break;
        updatedHands[who].push(updatedDeck.shift());
      }
    };

    if (card.value === "Skip") {
      newTurn = currentTurn;
      note += " Opponent is skipped.";
    } else if (card.value === "Reverse") {
      newTurn = currentTurn;
      note += " Reverse acts like Skip in a 2-player game.";
    } else if (card.value === "Draw2") {
      drawCards(target, 2);
      newTurn = currentTurn;
      note += " Opponent draws 2 and misses a turn.";
    } else if (card.value === "Wild+4") {
      drawCards(target, 4);
      newTurn = currentTurn;
      note += ` Colour changes to ${nextColor}. Opponent draws 4 and misses a turn.`;
    } else if (card.value === "Wild") {
      note += ` Colour changes to ${nextColor}.`;
    }

    return { updatedHands, updatedDeck, newTurn, nextColor, note };
  }

  function finalizeIfWinner(nextHands, currentTurn, message, nextDeck, nextDiscard, newTurn, nextColor) {
    if (nextHands[currentTurn].length === 0) {
      setHands(nextHands);
      setDeck(nextDeck);
      setDiscard(nextDiscard);
      setTurn(newTurn);
      setActiveColor(nextColor);
      setWinner(currentTurn);
      setStatus(`${message} ${currentTurn === 0 ? "You win the UNO hand!" : "AI wins the UNO hand!"}`);
      return true;
    }
    return false;
  }

  function playCard(index, chosenColor) {
    if (turn !== 0 || winner !== null) return;
    const card = playerHand[index];
    if (!isPlayable(card, topCard, activeColor)) return;

    const nextHands = hands.map((hand) => [...hand]);
    nextHands[0].splice(index, 1);
    const nextDiscard = [...discard, card];
    const { updatedHands, updatedDeck, newTurn, nextColor, note } = applyCardEffect(card, nextHands, deck, 0, chosenColor || pickColor(nextHands[0]));
    if (finalizeIfWinner(updatedHands, 0, note, updatedDeck, nextDiscard, newTurn, nextColor)) return;

    setHands(updatedHands);
    setDeck(updatedDeck);
    setDiscard(nextDiscard);
    setTurn(newTurn);
    setActiveColor(nextColor);
    setStatus(`${note} ${updatedHands[0].length === 1 ? "UNO!" : ""}`);
  }

  function drawForPlayer() {
    if (turn !== 0 || winner !== null) return;
    let [nextDeck, nextDiscard] = replenishDeck(deck, discard);
    if (!nextDeck.length) {
      setStatus("Draw pile is empty.");
      return;
    }
    const card = nextDeck.shift();
    const nextHands = hands.map((hand) => [...hand]);
    nextHands[0].push(card);

    if (isPlayable(card, topCard, activeColor)) {
      setHands(nextHands);
      setDeck(nextDeck);
      setStatus(`You drew ${cardLabel(card)}. You may play it now.`);
      return;
    }

    setHands(nextHands);
    setDeck(nextDeck);
    setTurn(1);
    setStatus(`You drew ${cardLabel(card)} and cannot play it. AI turn.`);
  }

  function aiTakeTurn() {
    const hand = [...aiHand];
    const playableIndex = hand.findIndex((card) => isPlayable(card, topCard, activeColor));

    if (playableIndex === -1) {
      let [nextDeck, nextDiscard] = replenishDeck(deck, discard);
      if (!nextDeck.length) {
        setTurn(0);
        setStatus("AI could not draw. Your turn.");
        return;
      }
      const drawn = nextDeck.shift();
      hand.push(drawn);
      const nextHands = [playerHand, hand];
      if (!isPlayable(drawn, topCard, activeColor)) {
        setHands(nextHands);
        setDeck(nextDeck);
        setTurn(0);
        setStatus(`AI drew a card and passed. Your turn.`);
        return;
      }
      const chosenColor = drawn.color === "Wild" ? pickColor(hand) : drawn.color;
      hand.pop();
      const tempHands = [playerHand, [...hand]];
      const nextDiscard2 = [...discard, drawn];
      const { updatedHands, updatedDeck, newTurn, nextColor, note } = applyCardEffect(drawn, tempHands, nextDeck, 1, chosenColor);
      if (finalizeIfWinner(updatedHands, 1, note, updatedDeck, nextDiscard2, newTurn, nextColor)) return;

      setHands(updatedHands);
      setDeck(updatedDeck);
      setDiscard(nextDiscard2);
      setTurn(newTurn);
      setActiveColor(nextColor);
      setStatus(note);
      return;
    }

    const card = hand[playableIndex];
    hand.splice(playableIndex, 1);
    const chosenColor = card.color === "Wild" ? pickColor(hand) : card.color;
    const nextHands = [playerHand, hand];
    const nextDiscard = [...discard, card];
    const { updatedHands, updatedDeck, newTurn, nextColor, note } = applyCardEffect(card, nextHands, deck, 1, chosenColor);
    if (finalizeIfWinner(updatedHands, 1, note, updatedDeck, nextDiscard, newTurn, nextColor)) return;

    setHands(updatedHands);
    setDeck(updatedDeck);
    setDiscard(nextDiscard);
    setTurn(newTurn);
    setActiveColor(nextColor);
    setStatus(note);
  }

  return (
    <div className="game-shell">
      <div className="game-header">
        <div>
          <h2>UNO Vault</h2>
          <p className="game-subtitle">Real-style UNO deck, discard pile, draw rules, and action cards.</p>
        </div>
        <div className="game-actions">
          <button className="btn btn-secondary" onClick={reset}>New Game</button>
        </div>
      </div>

      <div className="game-status-bar">
        <div><strong>Turn:</strong> {winner !== null ? "Finished" : turn === 0 ? "You" : "AI"}</div>
        <div><strong>Colour:</strong> {activeColor}</div>
        <div><strong>Top Card:</strong> {topCard ? cardLabel(topCard) : "—"}</div>
      </div>

      <div className="game-card" style={{ padding: 16 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong>AI Hand</strong>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>{aiHand.length} card{aiHand.length === 1 ? "" : "s"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {aiHand.slice(0, Math.min(aiHand.length, 10)).map((card, index) => (
                <div key={`${card.key}-${index}`} style={{ opacity: 0.95 }}><HiddenCard count="" /></div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 8, fontWeight: 700 }}>Draw Pile</div>
              <button type="button" onClick={drawForPlayer} disabled={turn !== 0 || winner !== null} style={{ background: "transparent", border: "none", padding: 0 }}>
                <HiddenCard count={deck.length} />
              </button>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 8, fontWeight: 700 }}>Discard</div>
              {topCard ? <CardFace card={topCard} playable={false} onClick={() => {}} /> : <HiddenCard count="0" />}
            </div>
          </div>

          <div className="game-status-text">{status}</div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong>Your Hand</strong>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>
                {legalIndexes.length ? "Playable cards glow gold." : "Draw if you cannot play."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {playerHand.map((card, index) => {
                const playable = turn === 0 && winner === null && isPlayable(card, topCard, activeColor);
                return (
                  <CardFace
                    key={`${card.key}-${index}`}
                    card={card}
                    playable={playable}
                    onClick={() => playCard(index, card.color === "Wild" ? pickColor(playerHand.filter((_, handIndex) => handIndex !== index)) : undefined)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
