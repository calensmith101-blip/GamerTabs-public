// Compatibility proxy for components that import ../supabaseClient from src/components/*
export { supabase, hasSupabaseConfig, isOfflineError, safeQuery } from '../supabaseClient'
export { supabase as default } from '../supabaseClient'
