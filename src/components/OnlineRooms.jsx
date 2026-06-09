import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import OnlineGameSelector, { getOnlineGame } from "./OnlineGameSelector";
import OnlineGameRoom, { getInitialStateForGame } from "./OnlineGameRoom";
import { createRoom, joinRoom } from "../lib/roomUtils";

export default function OnlineRooms() {
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);
  const [selectedGame, setSelectedGame] = useState("connect4");

  async function handleCreateRoom() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    const game = getOnlineGame(selectedGame);

    try {
      const room = await createRoom({
        userId,
        username: userData.user.email || userId,
        gameType: selectedGame,
        initialState: getInitialStateForGame(selectedGame),
      });
      setActiveRoom(room);
      setMessage(`${game.title} room created: ${room.room_code}`);
    } catch (error) {
      setMessage(error.message || "Could not create room");
    }
  }

  async function handleJoinRoom() {
    const cleanCode = roomCode.trim().toUpperCase();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    try {
      const room = await joinRoom(cleanCode, userId, userData.user.email || userId);
      setActiveRoom(room);
      setMessage(`Joined room ${room.room_code} as O`);
    } catch (error) {
      setMessage(error.message || "Could not join room");
    }
  }

  function leaveRoom() {
    setActiveRoom(null);
    setMessage("");
  }

  return (
    <div>
      <div className="panel">
        <div className="onlineRoomHeader">
          <div>
            <h2>Online Rooms</h2>
            <p>Create or join a live Supabase realtime room.</p>
          </div>
          {activeRoom && <button onClick={leaveRoom}>Leave Room</button>}
        </div>

        {!activeRoom && (
          <>
            <OnlineGameSelector selectedGame={selectedGame} setSelectedGame={setSelectedGame} />

            <div className="buttonGrid" style={{ marginTop: 14 }}>
              <button onClick={handleCreateRoom}>Create Room</button>
            </div>

            <input
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />

            <button onClick={handleJoinRoom}>Join Room</button>
          </>
        )}

        <p className="statusText">{message}</p>
      </div>

      {activeRoom && <OnlineGameRoom room={activeRoom} />}
    </div>
  );
}
