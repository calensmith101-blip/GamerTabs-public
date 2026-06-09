import { useEffect, useRef, useCallback } from 'react';
import { saveGame, loadGame, deleteGame } from '../lib/localSave';

/**
 * useGameSave
 *
 * Auto-saves game state to localStorage whenever it changes.
 * Provides a `restore()` function to load a previous save.
 * Provides a `clearSave()` function to delete the save on game completion.
 *
 * Usage inside a game component:
 *
 *   const { restore, clearSave, hasSave } = useGameSave('chess-trainer', gameState, gameOver);
 *
 *   // On mount, optionally restore:
 *   useEffect(() => {
 *     const saved = restore();
 *     if (saved) setGameState(saved);
 *   }, []);
 *
 *   // clearSave is called automatically when isComplete === true.
 *
 * @param {string}  gameId       - Unique game identifier matching games.js id
 * @param {object}  state        - Current game state (JSON-serialisable)
 * @param {boolean} isComplete   - When true, the save is deleted automatically
 * @param {object}  options
 * @param {number}  options.debounce   - ms to debounce saves (default: 800)
 * @param {boolean} options.disabled   - set true to pause auto-save
 */
export function useGameSave(gameId, state, isComplete = false, options = {}) {
  const { debounce: debounceMs = 800, disabled = false } = options;
  const timerRef = useRef(null);
  const prevStateRef = useRef(null);

  // Auto-save on state change (debounced)
  useEffect(() => {
    if (disabled || !gameId || !state || isComplete) return;

    // Skip if state hasn't actually changed (shallow compare JSON)
    const json = JSON.stringify(state);
    if (json === prevStateRef.current) return;
    prevStateRef.current = json;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveGame(gameId, state);
    }, debounceMs);

    return () => clearTimeout(timerRef.current);
  }, [gameId, state, isComplete, disabled, debounceMs]);

  // Auto-clear on completion
  useEffect(() => {
    if (isComplete && gameId) {
      clearTimeout(timerRef.current);
      deleteGame(gameId);
    }
  }, [isComplete, gameId]);

  // Restore previous save
  const restore = useCallback(() => {
    if (!gameId) return null;
    return loadGame(gameId);
  }, [gameId]);

  // Manually clear the save
  const clearSave = useCallback(() => {
    if (gameId) deleteGame(gameId);
  }, [gameId]);

  // Whether a save exists for this game
  const hasSave = useCallback(() => {
    if (!gameId) return false;
    return loadGame(gameId) !== null;
  }, [gameId]);

  return { restore, clearSave, hasSave };
}

export default useGameSave;
