import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error(
        '[Supabase] Missing environment variables:',
        !url ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
        !key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''
      );
    }

    _supabase = createClient(url || '', key || '');
  }
  return _supabase;
}
