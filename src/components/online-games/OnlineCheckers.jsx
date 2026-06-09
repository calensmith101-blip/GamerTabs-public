import React from "react";
import { canPlayTurn, nextTurn, OnlineGameShell, useOnlineGameRoom } from "../../lib/onlineGameUtils";

function initialBoard() {
  const board = Array(64).fill(null);
  for (let i = 0; i < 24; i++) {
    const r = Math.floor(i / 8), c = i % 8;
    if ((r + c) % 2 === 1) board[i] = "O";
  }
  for (let i = 40; i < 64; i++) {
    const r = Math.floor(i / 8), c = i % 8;
    if ((r + c) % 2 === 1) board[i] = "X";
  }
  return board;
}

function countPieces(board, p) {
  return board.filter(x => x && x[0] === p).length;
}

export default function OnlineCheckers({ room }) {
  const initial = { board: initialBoard(), turn: "X", selected: null, winner: null };
  const { gameRoom, state, mySymbol, debug, setDebug, saveState, resetState } = useOnlineGameRoom(room, initial);
  const board = Array.isArray(state.board) ? state.board : initial.board;
  const turn = state.turn || "X";
  const winner = state.winner || (countPieces(board, "X") === 0 ? "O" : countPieces(board, "O") === 0 ? "X" : null);
  const selected = state.selected;

  async function click(i) {
    if (!canPlayTurn({ mySymbol, turn, winner, setDebug })) return;

    const piece = board[i];
    if (selected === null) {
      if (piece && piece[0] === turn) await saveState({ ...state, selected: i });
      else setDebug("Select your own piece.");
      return;
    }

    const from = selected;
    const moving = board[from];
    if (!moving) return saveState({ ...state, selected: null });

    const diff = i - from;
    const dir = turn === "X" ? -8 : 8;
    const simple = [dir - 1, dir + 1].includes(diff);
    const jump = [dir * 2 - 2, dir * 2 + 2].includes(diff);
    const next = [...board];

    if (simple && !board[i]) {
      next[i] = moving;
      next[from] = null;
    } else if (jump && !board[i]) {
      const mid = from + diff / 2;
      if (board[mid] && board[mid][0] !== turn) {
        next[i] = moving;
        next[from] = null;
        next[mid] = null;
      } else {
        setDebug("Invalid jump.");
        return;
      }
    } else {
      setDebug("Invalid move.");
      return;
    }

    const nextWinner = countPieces(next, "X") === 0 ? "O" : countPieces(next, "O") === 0 ? "X" : null;
    await saveState({ ...state, board: next, selected: null, turn: nextWinner ? turn : nextTurn(turn), winner: nextWinner });
  }

  return (
    <OnlineGameShell title="Online Checkers" room={gameRoom} mySymbol={mySymbol} turn={turn} winner={winner} debug={debug} onReset={() => resetState(initial)}>
      <div className="onlineBoard checkersOnline">
        {board.map((cell, i) => <button className="onlineCell" key={i} onClick={() => click(i)} style={{ outline: selected === i ? "2px solid #facc15" : "" }}>{cell === "X" ? "🔴" : cell === "O" ? "⚫" : ""}</button>)}
      </div>
    </OnlineGameShell>
  );
}
