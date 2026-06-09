/**
 * localSave — GamerTab: Black Vault
 *
 * Provides safe localStorage-backed persistence for:
 *   - In-progress game states  (survive page reloads + offline use)
 *   - App settings
 *   - Player preferences
 *   - Recent-games list
 *
 * All operations are wrapped in try/catch; failures return a safe default
 * rather than throwing (localStorage can be unavailable in private mode).
 */

const NS = 'bv';

const KEY = {
  game:    (id) => `${NS}:game:${id}`,
  settings:      `${NS}:settings`,
  prefs:         `${NS}:prefs`,
  recent:        `${NS}:recent`,
  offlineQueue:  `${NS}:queue`,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function safeGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // Quota exceeded or unavailable
    console.warn('[localSave] Write failed:', key, err.message);
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// ─── Game saves ───────────────────────────────────────────────────────────────

/**
 * Save the current state of an in-progress game.
 * Call this after every state change that you want to survive a reload.
 *
 * @param {string} gameId  - e.g. 'chess-trainer', 'connect-four'
 * @param {object} state   - any JSON-serialisable game state object
 * @returns {boolean}      - true on success
 */
export function saveGame(gameId, state) {
  if (!gameId) return false;
  return safeSet(KEY.game(gameId), {
    ...state,
    _gameId:   gameId,
    _savedAt:  Date.now(),
    _version:  1,
  });
}

/**
 * Load a previously saved game state.
 *
 * @param {string} gameId
 * @returns {object|null}  - state object or null if nothing saved
 */
export function loadGame(gameId) {
  if (!gameId) return null;
  return safeGet(KEY.game(gameId), null);
}

/**
 * Delete a saved game (e.g. when the game finishes or user starts fresh).
 *
 * @param {string} gameId
 */
export function deleteGame(gameId) {
  if (!gameId) return;
  safeRemove(KEY.game(gameId));
}

/**
 * List all currently saved games, newest first.
 *
 * @returns {Array<object>}
 */
export function listSavedGames() {
  const saves = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${NS}:game:`)) {
        const data = safeGet(key);
        if (data?._gameId) saves.push(data);
      }
    }
  } catch {}
  return saves.sort((a, b) => (b._savedAt || 0) - (a._savedAt || 0));
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Settings
 * @property {boolean}  [sfxEnabled]
 * @property {boolean}  [animationsEnabled]
 * @property {string}   [theme]
 */

/** @param {Settings} settings */
export function saveSettings(settings) {
  return safeSet(KEY.settings, settings);
}

/** @returns {Settings} */
export function loadSettings() {
  return safeGet(KEY.settings, {
    sfxEnabled:         true,
    animationsEnabled:  true,
    theme:              'dark',
  });
}

// ─── Player preferences ───────────────────────────────────────────────────────

/**
 * @typedef {Object} Prefs
 * @property {string}   [preferredDifficulty]
 * @property {string}   [preferredMode]
 * @property {boolean}  [localDiscoveryEnabled]
 */

/** @param {Prefs} prefs */
export function savePrefs(prefs) {
  return safeSet(KEY.prefs, prefs);
}

/** @returns {Prefs} */
export function loadPrefs() {
  return safeGet(KEY.prefs, {
    preferredDifficulty:    'medium',
    preferredMode:          'ai',
    localDiscoveryEnabled:  false,
  });
}

/** Patch one or more prefs without overwriting the rest. */
export function patchPrefs(patch) {
  const current = loadPrefs();
  return savePrefs({ ...current, ...patch });
}

// ─── Recent games ─────────────────────────────────────────────────────────────

/**
 * Record that a game was played (for "recent" list on home screen).
 *
 * @param {string} gameId
 * @param {string} gameTitle
 */
export function addRecentGame(gameId, gameTitle) {
  const recent  = safeGet(KEY.recent, []);
  const without = recent.filter((g) => g.id !== gameId);
  const updated = [
    { id: gameId, title: gameTitle, playedAt: Date.now() },
    ...without,
  ].slice(0, 12);
  safeSet(KEY.recent, updated);
}

/**
 * @returns {Array<{id:string, title:string, playedAt:number}>}
 */
export function getRecentGames() {
  return safeGet(KEY.recent, []);
}

// ─── Offline action queue ─────────────────────────────────────────────────────
// Enqueue actions (like score saves) that failed because the user was offline.
// Flush the queue when back online.

/**
 * @param {{ type:string, payload:object }} action
 */
export function enqueueOfflineAction(action) {
  const queue = safeGet(KEY.offlineQueue, []);
  queue.push({ ...action, queuedAt: Date.now() });
  safeSet(KEY.offlineQueue, queue.slice(-50)); // keep last 50 max
}

/**
 * @returns {Array}
 */
export function dequeueOfflineActions() {
  const queue = safeGet(KEY.offlineQueue, []);
  safeRemove(KEY.offlineQueue);
  return queue;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Wipe all Black Vault localStorage keys.
 * Does NOT touch keys from other apps.
 */
export function clearAll() {
  try {
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(`${NS}:`)) toDelete.push(k);
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a rough estimate of storage used by Black Vault (bytes).
 */
export function storageUsed() {
  let bytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(`${NS}:`)) {
        bytes += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2;
      }
    }
  } catch {}
  return bytes;
}

// Default export for convenience (named imports preferred)
const localSave = {
  saveGame, loadGame, deleteGame, listSavedGames,
  saveSettings, loadSettings,
  savePrefs, loadPrefs, patchPrefs,
  addRecentGame, getRecentGames,
  enqueueOfflineAction, dequeueOfflineActions,
  clearAll, storageUsed,
};
export default localSave;
