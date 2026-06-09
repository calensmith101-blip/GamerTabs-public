import React from "react";
import OnlineConnectFour from "./online-games/OnlineConnectFour";
import OnlineDiceDuel from "./online-games/OnlineDiceDuel";
import OnlineMemoryMatch from "./online-games/OnlineMemoryMatch";
import OnlineColourClash from "./online-games/OnlineColourClash";
import OnlineSeaBattle from "./online-games/OnlineSeaBattle";
import OnlineSnakesLadders from "./online-games/OnlineSnakesLadders";
import OnlineRoyalDice5 from "./online-games/OnlineRoyalDice5";
import OnlineCheckers from "./online-games/OnlineCheckers";
import OnlineChessTrainer from "./online-games/OnlineChessTrainer";
import OnlineDominoDash from "./online-games/OnlineDominoDash";
import OnlineLudoQuest from "./online-games/OnlineLudoQuest";
import OnlineMansionMystery from "./online-games/OnlineMansionMystery";
import OnlineKingdomConquest from "./online-games/OnlineKingdomConquest";
import OnlineCityTycoon from "./online-games/OnlineCityTycoon";
import OnlineFlagFront from "./online-games/OnlineFlagFront";

export function getInitialStateForGame(gameType) {
  switch (gameType) {
    case "connect4":
      return { board: Array(42).fill(null), turn: "X", winner: null, moves: 0 };
    case "dice":
      return { turn: "X", rolls: { X: [], O: [] }, winner: null, round: 1 };
    case "memory": {
      const icons = ["🍎","🍎","🚀","🚀","🐸","🐸","⭐","⭐","🎲","🎲","👑","👑"];
      const cards = icons.sort(() => Math.random() - 0.5).map((v, i) => ({ id: i, v, open: false, done: false, owner: null }));
      return { cards, selected: [], turn: "X", scores: { X: 0, O: 0 }, winner: null };
    }
    case "colourclash":
      return { deckSeed: Date.now(), turn: "X", top: { color: "Red", value: "5" }, hands: { X: [], O: [] }, started: false, winner: null };
    case "battleships":
      return { turn: "X", shots: { X: [], O: [] }, ships: { X: [3,14,25,46,57], O: [4,13,22,41,58] }, winner: null };
    case "snakes":
      return { turn: "X", positions: { X: 1, O: 1 }, lastRoll: null, winner: null };
    case "yahtzy":
      return { turn: "X", rolls: { X: [], O: [] }, scores: { X: 0, O: 0 }, round: 1, winner: null };
    case "checkers":
      return createCheckersInitialState();
    case "chess":
      return createChessInitialState();
    case "dominoes":
      return createDominoInitialState();
    case "ludo":
      return { turn: "X", positions: { X: [0,0,0,0], O: [0,0,0,0] }, lastRoll: null, winner: null };
    case "mansion":
      return { turn: "X", clue: null, notes: [], positions: { X: "Hall", O: "Kitchen" }, winner: null };
    case "kingdoms":
      return { turn: "X", territories: createKingdoms(), winner: null };
    case "citytycoon":
      return { turn: "X", cash: { X: 1500, O: 1500 }, positions: { X: 0, O: 0 }, owned: {}, lastRoll: null, winner: null };
    case "strategy":
      return createFlagFrontInitialState();
    default:
      return { turn: "X", winner: null };
  }
}

function createCheckersInitialState() {
  const board = Array(64).fill(null);
  for (let i = 0; i < 24; i++) {
    const row = Math.floor(i / 8), col = i % 8;
    if ((row + col) % 2 === 1) board[i] = "O";
  }
  for (let i = 40; i < 64; i++) {
    const row = Math.floor(i / 8), col = i % 8;
    if ((row + col) % 2 === 1) board[i] = "X";
  }
  return { board, turn: "X", selected: null, winner: null };
}

function createChessInitialState() {
  return {
    board: [
      "♜","♞","♝","♛","♚","♝","♞","♜",
      "♟","♟","♟","♟","♟","♟","♟","♟",
      null,null,null,null,null,null,null,null,
      null,null,null,null,null,null,null,null,
      null,null,null,null,null,null,null,null,
      null,null,null,null,null,null,null,null,
      "♙","♙","♙","♙","♙","♙","♙","♙",
      "♖","♘","♗","♕","♔","♗","♘","♖",
    ],
    turn: "X",
    selected: null,
    winner: null,
  };
}

function createDominoInitialState() {
  const all = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) all.push([a,b]);
  all.sort(() => Math.random() - 0.5);
  return {
    turn: "X",
    hands: { X: all.slice(0,7), O: all.slice(7,14) },
    board: [],
    draw: all.slice(14),
    winner: null,
  };
}

function createKingdoms() {
  return [
    { name: "North Gate", owner: "X", troops: 3 },
    { name: "Ash Fields", owner: null, troops: 2 },
    { name: "Iron Keep", owner: null, troops: 2 },
    { name: "Red Marsh", owner: null, troops: 2 },
    { name: "Wolf Coast", owner: null, troops: 2 },
    { name: "Black Hill", owner: "O", troops: 3 },
  ];
}

function createFlagFrontInitialState() {
  const board = Array(64).fill(null);
  board[56] = { owner: "X", rank: "Flag", show: false };
  board[57] = { owner: "X", rank: "Guard", show: false };
  board[58] = { owner: "X", rank: "Scout", show: false };
  board[59] = { owner: "X", rank: "Bomb", show: false };
  board[7] = { owner: "O", rank: "Flag", show: false };
  board[6] = { owner: "O", rank: "Guard", show: false };
  board[5] = { owner: "O", rank: "Scout", show: false };
  board[4] = { owner: "O", rank: "Bomb", show: false };
  return { board, turn: "X", selected: null, winner: null };
}

export default function OnlineGameRoom({ room }) {
  const gameType = room?.game_type;

  if (gameType === "connect4") return <OnlineConnectFour room={room} />;
  if (gameType === "dice") return <OnlineDiceDuel room={room} />;
  if (gameType === "memory") return <OnlineMemoryMatch room={room} />;
  if (gameType === "colourclash") return <OnlineColourClash room={room} />;
  if (gameType === "battleships") return <OnlineSeaBattle room={room} />;
  if (gameType === "snakes") return <OnlineSnakesLadders room={room} />;
  if (gameType === "yahtzy") return <OnlineRoyalDice5 room={room} />;
  if (gameType === "checkers") return <OnlineCheckers room={room} />;
  if (gameType === "chess") return <OnlineChessTrainer room={room} />;
  if (gameType === "dominoes") return <OnlineDominoDash room={room} />;
  if (gameType === "ludo") return <OnlineLudoQuest room={room} />;
  if (gameType === "mansion") return <OnlineMansionMystery room={room} />;
  if (gameType === "kingdoms") return <OnlineKingdomConquest room={room} />;
  if (gameType === "citytycoon") return <OnlineCityTycoon room={room} />;
  if (gameType === "strategy") return <OnlineFlagFront room={room} />;

  return <div className="panel"><h2>Unknown game</h2><p>{gameType}</p></div>;
}
