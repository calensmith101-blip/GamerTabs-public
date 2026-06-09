import React from "react";
import { canPlayTurn, nextTurn, OnlineGameShell, useOnlineGameRoom } from "../../lib/onlineGameUtils";

const jumps = { 3: 22, 8: 30, 28: 84, 58: 77, 17: 7, 52: 29, 88: 24, 99: 10 };

export default function OnlineSnakesLadders({ room }) {
  const initial = { turn: "X", positions: { X: 1, O: 1 }, lastRoll: null, winner: null };
  const { gameRoom, state, mySymbol, debug, setDebug, saveState, resetState } = useOnlineGameRoom(room, initial);
  const turn = state.turn || "X";
  const positions = state.positions || initial.positions;
  const winner = state.winner;

  async function roll() {
    if (!canPlayTurn({ mySymbol, turn, winner, setDebug })) return;
    const dice = 1 + Math.floor(Math.random() * 6);
    let pos = Math.min(100, (positions[turn] || 1) + dice);
    pos = jumps[pos] || pos;
    const nextPositions = { ...positions, [turn]: pos };
    const nextWinner = pos >= 100 ? turn : null;
    await saveState({ ...state, positions: nextPositions, lastRoll: dice, turn: nextWinner ? turn : nextTurn(turn), winner: nextWinner });
  }

  return (
    <OnlineGameShell title="Online Snakes & Ladders" room={gameRoom} mySymbol={mySymbol} turn={turn} winner={winner} debug={debug} onReset={() => resetState(initial)}>
      <button className="primary" onClick={roll}>Roll Dice</button>
      <p>Last roll: {state.lastRoll || "-"}</p>
      <p>X: {positions.X || 1} • O: {positions.O || 1}</p>
      <div className="onlineBoard snakesOnline">
        {Array.from({ length: 100 }, (_, i) => 100 - i).map(n => (
          <div className="onlineCell" key={n}>
            <small>{n}</small>
            <span>{positions.X === n ? "🔴" : ""}{positions.O === n ? "🟡" : ""}{jumps[n] && (jumps[n] > n ? "🪜" : "🐍")}</span>
          </div>
        ))}
      </div>
    </OnlineGameShell>
  );
}
