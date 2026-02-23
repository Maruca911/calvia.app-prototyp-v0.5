import { NextRequest } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export function getSupabaseUserClient(accessToken?: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing server Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export async function getUserContextFromRequest(
  request: NextRequest,
  allowAnonymous = false
): Promise<{ user: User | null; supabase: SupabaseClient; accessToken: string | null } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    if (allowAnonymous) {
      return {
        user: null,
        supabase: getSupabaseUserClient(),
        accessToken: null,
      };
    }
    return null;
  }

  const supabase = getSupabaseUserClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (allowAnonymous) {
      return {
        user: null,
        supabase: getSupabaseUserClient(),
        accessToken: null,
      };
    }
    return null;
  }

  return {
    user: data.user,
    supabase,
    accessToken: token,
  };
}
