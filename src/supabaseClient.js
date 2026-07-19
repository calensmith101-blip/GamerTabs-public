import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

function decodeJwtPayload(value) {
  try {
    const payload = String(value || '').split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(globalThis.atob(padded));
  } catch (_) {
    return null;
  }
}

export function isBrowserForbiddenSupabaseKey(value = supabaseAnonKey) {
  const key = String(value || '').trim();
  if (!key) return false;
  const lower = key.toLowerCase();
  if (lower.startsWith('sb_secret_') || lower.includes('service_role')) return true;
  const payload = decodeJwtPayload(key);
  return payload?.role === 'service_role' || payload?.role === 'supabase_admin';
}

export const hasSupabaseConfig =
  !!supabaseUrl && !!supabaseAnonKey;

export const supabaseConfigError = !hasSupabaseConfig
  ? "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY."
  : isBrowserForbiddenSupabaseKey()
    ? "Supabase browser key is server-only. Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY to the public browser key, and keep service-role or sb_secret keys only in server env vars."
    : "";

export const hasBrowserSafeSupabaseKey = hasSupabaseConfig && !supabaseConfigError;

export const supabase = hasBrowserSafeSupabaseKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "bv-auth-token",
      },
    })
  : null;

export function formatSupabaseError(error) {
  const message = error?.message || String(error || '');
  if (
    supabaseConfigError ||
    /forbidden use of secret api key in browser/i.test(message) ||
    /service[_ -]?role/i.test(message)
  ) {
    return supabaseConfigError || "Supabase browser key is server-only. Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY to the public browser key.";
  }
  return message || "Supabase request failed.";
}

export function isOfflineError(error) {
  if (!error) return false;

  return (
    error.message?.includes("Failed to fetch") ||
    error.message?.includes("NetworkError") ||
    error.message?.includes("offline")
  );
}

export async function safeQuery(queryFn) {
  try {
    return await queryFn();
  } catch (error) {
    if (isOfflineError(error)) {
      return {
        data: null,
        error: {
          message: "Offline mode active",
          offline: true,
        },
      };
    }

    return {
      data: null,
      error,
    };
  }
}
