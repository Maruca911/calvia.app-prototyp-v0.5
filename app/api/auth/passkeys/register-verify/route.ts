import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getUserContextFromRequest } from '@/lib/server-auth';
import { normalizeEmail, resolveRequestOrigin, resolveRpId } from '@/lib/passkey-auth';

export const runtime = 'nodejs';

interface RegisterVerifyPayload {
  challengeId?: string;
  response?: RegistrationResponseJSON;
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

    const body = (await request.json()) as RegisterVerifyPayload;
    const challengeId = (body.challengeId || '').trim();
    const credentialResponse = body.response;
    const friendlyName = normalizeFriendlyName(body.friendlyName);

    if (!challengeId || !credentialResponse) {
      return NextResponse.json({ error: 'Missing passkey verification data' }, { status: 400 });
    }

    const user = context.user;
    const userEmail = normalizeEmail(user.email || '');
    const supabaseAdmin = getSupabaseAdmin();

    const { data: challengeRow, error: challengeError } = await supabaseAdmin
      .from('passkey_challenges')
      .select('id, challenge')
      .eq('id', challengeId)
      .eq('flow', 'registration')
      .eq('user_id', user.id)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (challengeError) {
      console.error('[Passkeys] Failed loading registration challenge', challengeError);
      return NextResponse.json({ error: 'Failed to verify passkey' }, { status: 500 });
    }

    if (!challengeRow) {
      return NextResponse.json({ error: 'Passkey challenge expired or invalid' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response: credentialResponse,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: resolveRequestOrigin(request),
      expectedRPID: resolveRpId(request),
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Passkey registration could not be verified' }, { status: 400 });
    }

    const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;
    const credentialId = credential.id;
    const publicKey = Buffer.from(credential.publicKey).toString('base64url');

    const { error: upsertError } = await supabaseAdmin
      .from('passkey_credentials')
      .upsert(
        {
          user_id: user.id,
          email: userEmail,
          credential_id: credentialId,
          public_key: publicKey,
          counter: credential.counter,
          transports: credential.transports || [],
          device_type: credentialDeviceType || null,
          backed_up: Boolean(credentialBackedUp),
          friendly_name: friendlyName,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'credential_id' }
      );

    if (upsertError) {
      console.error('[Passkeys] Failed storing credential', upsertError);
      return NextResponse.json({ error: 'Failed to save passkey' }, { status: 500 });
    }

    const { error: consumeError } = await supabaseAdmin
      .from('passkey_challenges')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', challengeId);

    if (consumeError) {
      console.warn('[Passkeys] Challenge consumption warning', consumeError.message);
    }

    return NextResponse.json({
      success: true,
      credentialId,
      friendlyName,
    });
  } catch (error) {
    console.error('[Passkeys] register-verify failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
