import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_ENV_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
type SupabaseEnvKey = (typeof SUPABASE_ENV_KEYS)[number];

// IMPORTANT:
// In Next.js client bundles, dynamic env lookups like `process.env[key]` are not
// reliably populated. Use direct env access so Next can inline values at build
// time (and still behave correctly on the server at runtime).
const SUPABASE_PUBLIC_ENV: Record<SupabaseEnvKey, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function getMissingSupabaseEnvVars(): SupabaseEnvKey[] {
  return SUPABASE_ENV_KEYS.filter((key) => !SUPABASE_PUBLIC_ENV[key]);
}

export function getSupabaseConfigError(): string | null {
  const missing = getMissingSupabaseEnvVars();
  if (!missing.length) {
    return null;
  }

  return `Missing Supabase environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`;
}

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = SUPABASE_PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_URL;
    const key = SUPABASE_PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const configError = getSupabaseConfigError();

    if (configError) {
      console.error(`[Supabase] ${configError}`);
    }

    _supabase = createClient(
      url || 'https://placeholder.supabase.co',
      key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
    );
  }
  return _supabase;
}
