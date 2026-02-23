import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const ALLOWED_PROVIDERS = ['google', 'outlook', 'apple'] as const;
const ALLOWED_SYNC_DIRECTIONS = ['import_only', 'export_only', 'two_way'] as const;
const ALLOWED_STATUSES = ['connected', 'syncing', 'error', 'disconnected'] as const;

type Provider = (typeof ALLOWED_PROVIDERS)[number];
type SyncDirection = (typeof ALLOWED_SYNC_DIRECTIONS)[number];
type ConnectionStatus = (typeof ALLOWED_STATUSES)[number];

interface CreateConnectionInput {
  provider?: string;
  accountEmail?: string;
  externalCalendarId?: string;
  syncDirection?: string;
}

interface UpdateConnectionInput {
  id?: string;
  status?: string;
  syncDirection?: string;
}

function getSupabaseUserClient(accessToken: string): SupabaseClient {
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
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function getUserFromRequest(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }

  const supabase = getSupabaseUserClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return { user: data.user, supabase };
}

function asProvider(value: string | undefined): Provider | null {
  if (!value) return null;
  return ALLOWED_PROVIDERS.includes(value as Provider) ? (value as Provider) : null;
}

function asSyncDirection(value: string | undefined): SyncDirection {
  if (!value) return 'two_way';
  return ALLOWED_SYNC_DIRECTIONS.includes(value as SyncDirection)
    ? (value as SyncDirection)
    : 'two_way';
}

function asStatus(value: string | undefined): ConnectionStatus | null {
  if (!value) return null;
  return ALLOWED_STATUSES.includes(value as ConnectionStatus) ? (value as ConnectionStatus) : null;
}

function cleanText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.slice(0, 255);
}

export async function GET(request: NextRequest) {
  try {
    const context = await getUserFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = context;

    const { data, error } = await supabase
      .from('partner_calendar_connections')
      .select('id, provider, account_email, external_calendar_id, sync_direction, status, last_synced_at, created_at')
      .eq('partner_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Partners] Failed loading calendar connections', error);
      return NextResponse.json({ error: 'Failed to load calendar connections' }, { status: 500 });
    }

    return NextResponse.json({ connections: data || [] });
  } catch (error) {
    console.error('[Partners] Calendar GET failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = context;
    const body = (await request.json()) as CreateConnectionInput;

    const provider = asProvider(body.provider);
    if (!provider) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const accountEmail = cleanText(body.accountEmail, user.email || '');
    const externalCalendarId = cleanText(body.externalCalendarId, accountEmail || 'primary');
    const syncDirection = asSyncDirection(body.syncDirection);

    const { data, error } = await supabase
      .from('partner_calendar_connections')
      .upsert(
        {
          partner_user_id: user.id,
          provider,
          account_email: accountEmail,
          external_calendar_id: externalCalendarId,
          sync_direction: syncDirection,
          status: 'connected',
          last_synced_at: new Date().toISOString(),
        },
        {
          onConflict: 'partner_user_id,provider,external_calendar_id',
        }
      )
      .select('id, provider, account_email, external_calendar_id, sync_direction, status, last_synced_at, created_at')
      .single();

    if (error) {
      console.error('[Partners] Failed creating calendar connection', error);
      return NextResponse.json({ error: 'Failed to connect calendar' }, { status: 500 });
    }

    return NextResponse.json({ connection: data });
  } catch (error) {
    console.error('[Partners] Calendar POST failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await getUserFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = context;
    const body = (await request.json()) as UpdateConnectionInput;

    const id = cleanText(body.id);
    if (!id) {
      return NextResponse.json({ error: 'Missing connection id' }, { status: 400 });
    }

    const status = asStatus(body.status);
    const syncDirection = body.syncDirection ? asSyncDirection(body.syncDirection) : null;

    if (!status && !syncDirection) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updatePayload: {
      status?: ConnectionStatus;
      sync_direction?: SyncDirection;
      last_synced_at?: string;
    } = {};
    if (status) {
      updatePayload.status = status;
    }
    if (syncDirection) {
      updatePayload.sync_direction = syncDirection;
    }
    if (status === 'connected' || status === 'syncing') {
      updatePayload.last_synced_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('partner_calendar_connections')
      .update(updatePayload)
      .eq('id', id)
      .eq('partner_user_id', user.id)
      .select('id, provider, account_email, external_calendar_id, sync_direction, status, last_synced_at, created_at')
      .maybeSingle();

    if (error) {
      console.error('[Partners] Failed updating calendar connection', error);
      return NextResponse.json({ error: 'Failed to update calendar connection' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({ connection: data });
  } catch (error) {
    console.error('[Partners] Calendar PATCH failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getUserFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = context;
    const body = (await request.json()) as { id?: string };
    const id = cleanText(body.id);

    if (!id) {
      return NextResponse.json({ error: 'Missing connection id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('partner_calendar_connections')
      .delete()
      .eq('id', id)
      .eq('partner_user_id', user.id);

    if (error) {
      console.error('[Partners] Failed deleting calendar connection', error);
      return NextResponse.json({ error: 'Failed to remove calendar connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Partners] Calendar DELETE failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
