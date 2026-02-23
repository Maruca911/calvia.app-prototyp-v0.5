import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getUserContextFromRequest } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContextFromRequest(request);
    if (!context?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('passkey_credentials')
      .select('credential_id, friendly_name, created_at, last_used_at')
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Passkeys] Failed loading credentials', error);
      return NextResponse.json({ error: 'Failed to load passkeys' }, { status: 500 });
    }

    return NextResponse.json({
      credentials: (data || []).map((row) => ({
        credentialId: row.credential_id,
        friendlyName: row.friendly_name,
        createdAt: row.created_at,
        lastUsedAt: row.last_used_at,
      })),
    });
  } catch (error) {
    console.error('[Passkeys] GET /me failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getUserContextFromRequest(request);
    if (!context?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { credentialId?: string };
    const credentialId = (body.credentialId || '').trim();
    if (!credentialId) {
      return NextResponse.json({ error: 'Missing credential id' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('passkey_credentials')
      .delete()
      .eq('user_id', context.user.id)
      .eq('credential_id', credentialId);

    if (error) {
      console.error('[Passkeys] Failed deleting credential', error);
      return NextResponse.json({ error: 'Failed to remove passkey' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Passkeys] DELETE /me failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
