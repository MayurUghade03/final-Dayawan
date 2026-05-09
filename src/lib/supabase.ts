import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/index";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True when both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present.
 * The app still loads when these are missing — only auth/backend-dependent
 * actions will show a "service not configured" notice.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * The Supabase client, or null when env vars are absent.
 * Always guard usage with `if (!supabase)` or the `isSupabaseConfigured` flag.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;
