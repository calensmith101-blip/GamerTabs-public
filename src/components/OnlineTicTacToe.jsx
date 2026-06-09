import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const emptyBoard = Array(9).fill(null);

function calcWinner(c) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, d] of lines) {
    if (c[a] && c[a] === c[b] && c[a] === c[d]) return c[a];
  }

  return c.every(Boolean) ? "Draw" : null;
}

export default function OnlineTicTacToe({ room }) {
  const [gameRoom, setGameRoom] = useState(room);
  const [debug, setDebug] = useState("");
  const [userId, setUserId] = useState(null);

  const state = gameRoom?.state || {};
  const board = Array.isArray(state.board) ? state.board : emptyBoard;
  const turn = state.turn || "X";
  const winner = calcWinner(board);

  const mySymbol =
    gameRoom?.player_x === userId ? "X" :
    gameRoom?.player_o === userId ? "O" :
    null;

  const isMyTurn = mySymbol === turn;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    setGameRoom(room);
  }, [room]);

  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          setGameRoom(payload.new);
          setDebug("Realtime update received");
        }
      )
      .subscribe((status) => {
        setDebug(`Realtime status: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  async function makeMove(index) {
    setDebug(`Clicked square ${index}`);

    if (!gameRoom?.id) {
      setDebug("No room ID found");
      return;
    }

    if (!mySymbol) {
      setDebug("You are watching this room, not playing.");
      return;
    }

    if (!isMyTurn) {
      setDebug(`Not your turn. You are ${mySymbol}.`);
      return;
    }

    if (board[index]) {
      setDebug("Square already taken");
      return;
    }

    if (winner) {
      setDebug("Game already finished");
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = turn;

    setGameRoom({
      ...gameRoom,
      state: {
        ...state,
        board: nextBoard,
        turn: turn === "X" ? "O" : "X",
      },
    });

    const { data, error } = await supabase
      .from("game_rooms")
      .update({
        state: {
          ...state,
          board: nextBoard,
          turn: turn === "X" ? "O" : "X",
        },
      })
      .eq("id", gameRoom.id)
      .select()
      .single();

    if (error) {
      setDebug(`Move failed: ${error.message}`);
      return;
    }

    setGameRoom(data);
    setDebug("Move saved");
  }

  async function resetGame() {
    if (!gameRoom?.id) {
      setDebug("No room ID found");
      return;
    }

    const { data, error } = await supabase
      .from("game_rooms")
      .update({
        state: {
          board: emptyBoard,
          turn: "X",
        },
      })
      .eq("id", gameRoom.id)
      .select()
      .single();

    if (error) {
      setDebug(`Reset failed: ${error.message}`);
      return;
    }

    setGameRoom(data);
    setDebug("Game reset");
  }

  return (
    <div className="panel">
      <div className="sectionHead">
        <div>
          <h2>Online Tic Tac Toe</h2>
          <p>Room: {gameRoom?.room_code}</p>
          <p>You are: {mySymbol || "Spectator"}</p>
          <p>{winner ? `Result: ${winner}` : `Turn: ${turn}`}</p>
          {!winner && mySymbol && (
            <p>{isMyTurn ? "Your move" : "Waiting for the other player"}</p>
          )}
          <p className="statusText">{debug}</p>
        </div>

        <button onClick={resetGame}>Reset</button>
      </div>

      <div className="tttGrid">
        {board.map((cell, i) => (
          <button key={i} onClick={() => makeMove(i)}>
            {cell || ""}
          </button>
        ))}
      </div>
    </div>
  );
}
