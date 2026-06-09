import React from "react";

export const ONLINE_GAMES = [
  { id: "connect4", title: "Connect Four", icon: "🔴", players: "2", type: "Playable" },
  { id: "dice", title: "Dice Duel", icon: "🎲", players: "2", type: "Playable" },
  { id: "memory", title: "Memory Match", icon: "🧠", players: "2", type: "Playable" },
  { id: "colourclash", title: "Colour Clash", icon: "🌈", players: "2", type: "Playable" },
  { id: "battleships", title: "Sea Battle", icon: "🚢", players: "2", type: "Playable" },
  { id: "snakes", title: "Snakes & Ladders", icon: "🐍", players: "2", type: "Playable" },
  { id: "yahtzy", title: "Royal Dice 5", icon: "🎲", players: "2", type: "Playable" },
  { id: "checkers", title: "Checkers", icon: "⚫", players: "2", type: "Playable prototype" },
  { id: "chess", title: "Chess Trainer", icon: "♟️", players: "2", type: "Basic prototype" },
  { id: "dominoes", title: "Domino Dash", icon: "🁬", players: "2", type: "Playable prototype" },
  { id: "ludo", title: "Ludo Quest", icon: "🔵", players: "2", type: "Playable prototype" },
  { id: "mansion", title: "Mansion Mystery", icon: "🔎", players: "2", type: "Prototype" },
  { id: "kingdoms", title: "Kingdom Conquest", icon: "🛡️", players: "2", type: "Prototype" },
  { id: "citytycoon", title: "City Tycoon", icon: "🏙️", players: "2", type: "Prototype" },
  { id: "strategy", title: "Flag Front", icon: "🚩", players: "2", type: "Prototype" },
];

export function getOnlineGame(id) {
  return ONLINE_GAMES.find((g) => g.id === id) || ONLINE_GAMES[0];
}

export default function OnlineGameSelector({ selectedGame, setSelectedGame }) {
  return (
    <div>
      <h3>Choose Online Game</h3>
      <div className="onlineGameSelector">
        {ONLINE_GAMES.map((game) => (
          <button
            key={game.id}
            className={`onlineGameChoice ${selectedGame === game.id ? "selected" : ""}`}
            onClick={() => setSelectedGame(game.id)}
          >
            <span className="gameIcon">{game.icon}</span>
            <strong>{game.title}</strong>
            <small>{game.type} • {game.players} players</small>
          </button>
        ))}
      </div>
    </div>
  );
}
