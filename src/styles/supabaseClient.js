import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Standard Supabase client.
 *
 * Offline behaviour:
 *  - Auth:       Session is cached in localStorage → works offline.
 *  - DB queries: Fail with { data: null, error: { message: 'Failed to fetch' } }
 *                Your components should already check for error before using data.
 *  - Realtime:   WebSocket disconnects silently; subscriptions stop firing.
 *
 * The Service Worker (public/sw.js) caches static assets; Supabase API calls
 * are intentionally NOT intercepted — the client handles errors itself.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so auth works offline
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    storageKey:         'bv-auth-token',
  },
  global: {
    // Add a reasonable timeout so offline fails fast rather than hanging
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 10_000); // 10s
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
    },
  },
  realtime: {
    // Prevent aggressive reconnect spam when offline
    reconnectAfterMs: (tries) => Math.min(500 * (tries + 1), 30_000),
  },
});

/**
 * safeQuery — wraps a Supabase query builder and always resolves (never rejects).
 *
 * Usage:
 *   const { data, error } = await safeQuery(
 *     supabase.from('profiles').select('*').eq('id', userId).single()
 *   );
 *
 * @param {Promise} queryPromise   - a Supabase query builder promise
 * @param {*}       fallbackData   - value to use for data when offline (default: null)
 * @returns {{ data: *, error: * }}
 */
export async function safeQuery(queryPromise, fallbackData = null) {
  try {
    const result = await queryPromise;
    return result;
  } catch (err) {
    return {
      data:  fallbackData,
      error: { message: err?.message || 'Network unavailable', offline: true },
    };
  }
}

/**
 * isOfflineError — returns true for errors caused by being offline.
 */
export function isOfflineError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.offline === true ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('aborted')
  );
}
