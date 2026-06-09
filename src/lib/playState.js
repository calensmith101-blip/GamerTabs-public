
const KEY = 'black-vault-active-sessions-v1';

function safeRead() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function safeWrite(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (_) {}
}

export function getActiveSessions() {
  return safeRead();
}

export function saveActiveSession(session) {
  if (!session?.gameId) return;
  const items = safeRead().filter((item) => !(item.gameId === session.gameId && item.roomCode === session.roomCode && item.mode === session.mode));
  items.unshift({
    gameId: session.gameId,
    mode: session.mode || 'local',
    difficulty: session.difficulty || 'medium',
    roomCode: session.roomCode || null,
    playerRole: session.playerRole || null,
    playerCount: session.playerCount || 2,
    title: session.title || session.gameId,
    updatedAt: new Date().toISOString(),
  });
  safeWrite(items.slice(0, 20));
}

export function removeActiveSession(match) {
  const items = safeRead().filter((item) => !(item.gameId === match?.gameId && item.roomCode === (match?.roomCode || null) && item.mode === match?.mode));
  safeWrite(items);
}
