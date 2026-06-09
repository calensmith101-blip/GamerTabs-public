import { useState, useEffect } from 'react';

/**
 * useOffline()
 * Returns true when the browser has no network connectivity.
 * Uses both navigator.onLine and the online/offline events for reliability.
 *
 * Usage:
 *   const offline = useOffline();
 *   if (offline) { ... show fallback ... }
 */
export function useOffline() {
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync on mount in case the state changed before listeners were attached
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return offline;
}

/**
 * isOnline()
 * Synchronous check — use in event handlers and non-reactive code.
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * requiresOnline(fn)
 * Higher-order helper: runs fn() only when online, otherwise calls onOffline.
 *
 * Usage:
 *   const safeSave = requiresOnline(saveToCloud, () => toast('Need internet'));
 */
export function requiresOnline(fn, onOffline) {
  return (...args) => {
    if (navigator.onLine) return fn(...args);
    if (typeof onOffline === 'function') onOffline(...args);
  };
}
