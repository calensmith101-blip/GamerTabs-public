import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig =
  !!supabaseUrl && !!supabaseAnonKey;

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "bv-auth-token",
      },
    })
  : null;

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