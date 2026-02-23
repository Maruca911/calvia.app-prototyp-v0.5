import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  challengeExpiryIso,
  normalizeEmail,
  resolveRequestOrigin,
  resolveRpId,
  sanitizeTransports,
} from '@/lib/passkey-auth';

export const runtime = 'nodejs';

interface LoginOptionsPayload {
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginOptionsPayload;
    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: credentials, error: credentialsError } = await supabaseAdmin
      .from('passkey_credentials')
      .select('credential_id, transports')
      .eq('email', email);

    if (credentialsError) {
      console.error('[Passkeys] Failed loading credentials for login', credentialsError);
      return NextResponse.json({ error: 'Could not initialize passkey login' }, { status: 500 });
    }

    if (!credentials || credentials.length === 0) {
      return NextResponse.json(
        { error: 'No passkey is registered for this account yet.' },
        { status: 404 }
      );
    }

    const rpID = resolveRpId(request);
    const origin = resolveRequestOrigin(request);
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((credential) => ({
        id: credential.credential_id,
        transports: sanitizeTransports(credential.transports),
      })),
      userVerification: 'preferred',
      timeout: 60_000,
    });

    const { data: challengeRow, error: challengeError } = await supabaseAdmin
      .from('passkey_challenges')
      .insert({
        flow: 'authentication',
        challenge: options.challenge,
        email,
        metadata: {
          origin,
          rp_id: rpID,
        },
        expires_at: challengeExpiryIso(),
      })
      .select('id')
      .single();

    if (challengeError || !challengeRow) {
      console.error('[Passkeys] Failed storing authentication challenge', challengeError);
      return NextResponse.json({ error: 'Could not initialize passkey login' }, { status: 500 });
    }

    return NextResponse.json({
      challengeId: challengeRow.id,
      options,
    });
  } catch (error) {
    console.error('[Passkeys] login-options failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
