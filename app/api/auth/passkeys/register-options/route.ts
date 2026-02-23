import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getUserContextFromRequest } from '@/lib/server-auth';
import {
  challengeExpiryIso,
  normalizeEmail,
  resolveRequestOrigin,
  resolveRpId,
  sanitizeTransports,
} from '@/lib/passkey-auth';

export const runtime = 'nodejs';

interface RegisterOptionsPayload {
  friendlyName?: string;
}

function normalizeFriendlyName(value: string | undefined) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return 'Calvia Passkey';
  }
  return trimmed.slice(0, 64);
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContextFromRequest(request);
    if (!context?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as RegisterOptionsPayload;
    const friendlyName = normalizeFriendlyName(body.friendlyName);
    const user = context.user;
    const userEmail = normalizeEmail(user.email || '');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User account is missing a valid email address' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from('passkey_credentials')
      .select('credential_id, transports')
      .eq('user_id', user.id);

    if (existingError) {
      console.error('[Passkeys] Failed loading existing credentials', existingError);
      return NextResponse.json({ error: 'Failed to initialize passkey setup' }, { status: 500 });
    }

    const rpID = resolveRpId(request);
    const origin = resolveRequestOrigin(request);
    const options = await generateRegistrationOptions({
      rpName: 'Calvia.app',
      rpID,
      userName: userEmail,
      userID: new TextEncoder().encode(user.id),
      userDisplayName: (user.user_metadata?.full_name as string | undefined) || userEmail,
      timeout: 60_000,
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
      excludeCredentials: (existingRows || []).map((row) => ({
        id: row.credential_id,
        transports: sanitizeTransports(row.transports),
      })),
    });

    const { data: challengeRow, error: challengeError } = await supabaseAdmin
      .from('passkey_challenges')
      .insert({
        flow: 'registration',
        challenge: options.challenge,
        user_id: user.id,
        email: userEmail,
        metadata: {
          friendly_name: friendlyName,
          origin,
          rp_id: rpID,
        },
        expires_at: challengeExpiryIso(),
      })
      .select('id')
      .single();

    if (challengeError || !challengeRow) {
      console.error('[Passkeys] Failed storing registration challenge', challengeError);
      return NextResponse.json({ error: 'Failed to initialize passkey setup' }, { status: 500 });
    }

    return NextResponse.json({
      challengeId: challengeRow.id,
      friendlyName,
      options,
    });
  } catch (error) {
    console.error('[Passkeys] register-options failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
