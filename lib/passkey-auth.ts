import { NextRequest } from 'next/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const PASSKEY_CHALLENGE_TTL_MINUTES = 10;
const VALID_TRANSPORTS: ReadonlySet<AuthenticatorTransportFuture> = new Set<AuthenticatorTransportFuture>([
  'ble',
  'cable',
  'hybrid',
  'internal',
  'nfc',
  'smart-card',
  'usb',
]);

export function normalizeEmail(value: string | undefined) {
  return (value || '').trim().toLowerCase();
}

export function resolveRequestOrigin(request: NextRequest) {
  const explicitOrigin = request.headers.get('origin');
  if (explicitOrigin) {
    return explicitOrigin;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers.get('host');
  if (host) {
    return `https://${host}`;
  }

  return process.env.URL || 'https://calvia.app';
}

export function resolveRpId(request: NextRequest) {
  try {
    return new URL(resolveRequestOrigin(request)).hostname;
  } catch {
    return 'calvia.app';
  }
}

export function challengeExpiryIso(minutes = PASSKEY_CHALLENGE_TTL_MINUTES) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry.toISOString();
}

export function sanitizeTransports(
  value: unknown
): AuthenticatorTransportFuture[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const transports = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item): item is AuthenticatorTransportFuture => VALID_TRANSPORTS.has(item as AuthenticatorTransportFuture));

  return transports.length ? transports : undefined;
}

export function getAnonSupabaseServerClient(): SupabaseClient {
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
  });
}
