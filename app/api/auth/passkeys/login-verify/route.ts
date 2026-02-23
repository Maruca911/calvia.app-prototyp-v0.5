import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  getAnonSupabaseServerClient,
  normalizeEmail,
  resolveRequestOrigin,
  resolveRpId,
  sanitizeTransports,
} from '@/lib/passkey-auth';

export const runtime = 'nodejs';

interface LoginVerifyPayload {
  email?: string;
  challengeId?: string;
  response?: AuthenticationResponseJSON;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginVerifyPayload;
    const email = normalizeEmail(body.email);
    const challengeId = (body.challengeId || '').trim();
    const assertionResponse = body.response;

    if (!email || !challengeId || !assertionResponse) {
      return NextResponse.json({ error: 'Missing passkey login data' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: challengeRow, error: challengeError } = await supabaseAdmin
      .from('passkey_challenges')
      .select('id, challenge')
      .eq('id', challengeId)
      .eq('flow', 'authentication')
      .eq('email', email)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (challengeError) {
      console.error('[Passkeys] Failed loading login challenge', challengeError);
      return NextResponse.json({ error: 'Could not verify passkey login' }, { status: 500 });
    }

    if (!challengeRow) {
      return NextResponse.json({ error: 'Passkey challenge expired or invalid' }, { status: 400 });
    }

    const credentialId = assertionResponse.id;
    const { data: credentialRow, error: credentialError } = await supabaseAdmin
      .from('passkey_credentials')
      .select('user_id, credential_id, public_key, counter, transports')
      .eq('email', email)
      .eq('credential_id', credentialId)
      .maybeSingle();

    if (credentialError) {
      console.error('[Passkeys] Failed loading credential for login', credentialError);
      return NextResponse.json({ error: 'Could not verify passkey login' }, { status: 500 });
    }

    if (!credentialRow) {
      return NextResponse.json({ error: 'Passkey not recognized for this account' }, { status: 404 });
    }

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: resolveRequestOrigin(request),
      expectedRPID: resolveRpId(request),
      credential: {
        id: credentialRow.credential_id,
        publicKey: Buffer.from(credentialRow.public_key, 'base64url'),
        counter: Number(credentialRow.counter || 0),
        transports: sanitizeTransports(credentialRow.transports),
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Passkey verification failed' }, { status: 401 });
    }

    const { error: credentialUpdateError } = await supabaseAdmin
      .from('passkey_credentials')
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('credential_id', credentialId);

    if (credentialUpdateError) {
      console.warn('[Passkeys] Failed updating credential counter', credentialUpdateError.message);
    }

    const { error: consumeError } = await supabaseAdmin
      .from('passkey_challenges')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', challengeId);

    if (consumeError) {
      console.warn('[Passkeys] Failed consuming challenge', consumeError.message);
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${resolveRequestOrigin(request)}/profile`,
      },
    });

    if (linkError || !linkData?.properties?.email_otp) {
      console.error('[Passkeys] Failed generating server login link', linkError);
      return NextResponse.json({ error: 'Could not create authenticated session' }, { status: 500 });
    }

    const anonClient = getAnonSupabaseServerClient();
    const { data: verifyOtpData, error: verifyOtpError } = await anonClient.auth.verifyOtp({
      email,
      token: linkData.properties.email_otp,
      type: 'email',
    });

    if (verifyOtpError || !verifyOtpData.session) {
      console.error('[Passkeys] Failed creating session from OTP', verifyOtpError);
      return NextResponse.json({ error: 'Could not create authenticated session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      accessToken: verifyOtpData.session.access_token,
      refreshToken: verifyOtpData.session.refresh_token,
      user: {
        id: verifyOtpData.user?.id || credentialRow.user_id,
        email: verifyOtpData.user?.email || email,
      },
    });
  } catch (error) {
    console.error('[Passkeys] login-verify failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
