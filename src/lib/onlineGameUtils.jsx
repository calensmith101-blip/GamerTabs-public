import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

export const emptyNine = Array(9).fill(null);

export function makeRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function calcLineWinner(cells, lines) {
  for (const line of lines) {
    const first = cells[line[0]];
    if (first && line.every((i) => cells[i] === first)) return first;
  }
  return cells.every(Boolean) ? "Draw" : null;
}

export function useOnlineGameRoom(room, defaultState = {}) {
  const [gameRoom, setGameRoom] = useState(room);
  const [debug, setDebug] = useState("");
  const [userId, setUserId] = useState(null);

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
      .channel(`game-room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          if (payload?.new) {
            setGameRoom(payload.new);
            setDebug("Realtime update received");
          }
        }
      )
      .subscribe((status) => setDebug(`Realtime status: ${status}`));

    return () => supabase.removeChannel(channel);
  }, [room?.id]);

  const state = useMemo(() => {
    return { ...defaultState, ...(gameRoom?.state || {}) };
  }, [gameRoom?.state, defaultState]);

  const mySymbol =
    gameRoom?.player_x === userId ? "X" :
    gameRoom?.player_o === userId ? "O" :
    null;

  async function saveState(nextState, extra = {}) {
    if (!gameRoom?.id) {
      setDebug("No room ID found");
      return { error: { message: "No room ID found" } };
    }

    setGameRoom({
      ...gameRoom,
      ...extra,
      state: nextState,
    });

    const { data, error } = await supabase
      .from("game_rooms")
      .update({
        ...extra,
        state: nextState,
      })
      .eq("id", gameRoom.id)
      .select()
      .single();

    if (error) {
      setDebug(`Save failed: ${error.message}`);
      return { error };
    }

    setGameRoom(data);
    setDebug("Saved");
    return { data };
  }

  async function resetState(nextState, extra = {}) {
    return saveState(nextState, extra);
  }

  return {
    gameRoom,
    state,
    userId,
    mySymbol,
    isPlayer: !!mySymbol,
    setDebug,
    debug,
    saveState,
    resetState,
  };
}

export function nextTurn(turn) {
  return turn === "X" ? "O" : "X";
}

export function roleLabel(symbol) {
  if (symbol === "X") return "X / Player 1";
  if (symbol === "O") return "O / Player 2";
  return "Spectator";
}

export function canPlayTurn({ mySymbol, turn, winner, setDebug }) {
  if (!mySymbol) {
    setDebug("You are watching this room, not playing.");
    return false;
  }
  if (winner) {
    setDebug("Game already finished.");
    return false;
  }
  if (mySymbol !== turn) {
    setDebug(`Not your turn. You are ${mySymbol}.`);
    return false;
  }
  return true;
}

export function OnlineGameShell({ title, room, mySymbol, turn, winner, debug, onReset, children }) {
  return (
    <div className="panel">
      <div className="sectionHead">
        <div>
          <h2>{title}</h2>
          <p>Room: <span className="roomBadge">{room?.room_code}</span></p>
          <p>You are: {roleLabel(mySymbol)}</p>
          <p>{winner ? `Result: ${winner}` : turn ? `Turn: ${turn}` : "Live game"}</p>
          <p className="statusText">{debug}</p>
        </div>
        {onReset && <button onClick={onReset}>Reset</button>}
      </div>
      {children}
    </div>
  );
}
