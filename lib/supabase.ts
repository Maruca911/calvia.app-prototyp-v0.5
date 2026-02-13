import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_ENV_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
type SupabaseEnvKey = (typeof SUPABASE_ENV_KEYS)[number];

export function getMissingSupabaseEnvVars(): SupabaseEnvKey[] {
  return SUPABASE_ENV_KEYS.filter((key) => !process.env[key]);
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
