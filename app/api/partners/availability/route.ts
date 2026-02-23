import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const ALLOWED_WEEKLY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type WeeklyHours = Record<string, Array<{ start: string; end: string }>>;

interface AvailabilitySettingsInput {
  timezone?: string;
  minLeadMinutes?: number;
  maxAdvanceDays?: number;
  slotIntervalMinutes?: number;
  slotCapacity?: number;
  allowWaitlist?: boolean;
  blackoutDates?: string[];
  weeklyHours?: WeeklyHours;
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

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeTimezone(timezone: unknown): string {
  if (typeof timezone !== 'string') {
    return 'Europe/Madrid';
  }
  const trimmed = timezone.trim();
  return trimmed.length > 0 ? trimmed : 'Europe/Madrid';
}

function normalizeBlackoutDates(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  for (const value of input) {
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      continue;
    }
    seen.add(trimmed);
  }
  return Array.from(seen).slice(0, 180);
}

function normalizeWeeklyHours(input: unknown): WeeklyHours {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const source = input as Record<string, unknown>;
  const normalized: WeeklyHours = {};

  for (const key of ALLOWED_WEEKLY_KEYS) {
    const value = source[key];
    if (!Array.isArray(value)) {
      continue;
    }

    const slots = value
      .filter((slot): slot is { start: string; end: string } => {
        return (
          !!slot &&
          typeof slot === 'object' &&
          typeof (slot as { start?: unknown }).start === 'string' &&
          typeof (slot as { end?: unknown }).end === 'string'
        );
      })
      .map((slot) => ({
        start: slot.start.trim().slice(0, 5),
        end: slot.end.trim().slice(0, 5),
      }))
      .filter((slot) => /^\d{2}:\d{2}$/.test(slot.start) && /^\d{2}:\d{2}$/.test(slot.end));

    if (slots.length > 0) {
      normalized[key] = slots.slice(0, 8);
    }
  }

  return normalized;
}

function buildSettingsPayload(body: AvailabilitySettingsInput, userId: string) {
  return {
    partner_user_id: userId,
    timezone: normalizeTimezone(body.timezone),
    min_lead_minutes: clamp(body.minLeadMinutes, 0, 24 * 60, 120),
    max_advance_days: clamp(body.maxAdvanceDays, 1, 365, 90),
    slot_interval_minutes: clamp(body.slotIntervalMinutes, 5, 240, 30),
    slot_capacity: clamp(body.slotCapacity, 1, 100, 4),
    allow_waitlist: body.allowWaitlist !== false,
    blackout_dates: normalizeBlackoutDates(body.blackoutDates),
    weekly_hours: normalizeWeeklyHours(body.weeklyHours),
  };
}

export async function GET(request: NextRequest) {
  try {
    const context = await getUserFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = context;

    const [{ data: settings, error: settingsError }, { data: connections, error: connectionsError }] =
      await Promise.all([
        supabase
          .from('partner_availability_settings')
          .select('*')
          .eq('partner_user_id', user.id)
          .maybeSingle(),
        supabase
          .from('partner_calendar_connections')
          .select(
            'id, provider, account_email, external_calendar_id, sync_direction, status, last_synced_at, created_at'
          )
          .eq('partner_user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

    if (settingsError) {
      console.error('[Partners] Failed loading availability settings', settingsError);
      return NextResponse.json({ error: 'Failed to load availability settings' }, { status: 500 });
    }

    if (connectionsError) {
      console.error('[Partners] Failed loading calendar connections', connectionsError);
      return NextResponse.json({ error: 'Failed to load calendar connections' }, { status: 500 });
    }

    return NextResponse.json({
      settings:
        settings || {
          partner_user_id: user.id,
          timezone: 'Europe/Madrid',
          min_lead_minutes: 120,
          max_advance_days: 90,
          slot_interval_minutes: 30,
          slot_capacity: 4,
          allow_waitlist: true,
          blackout_dates: [],
          weekly_hours: {},
        },
      connections: connections || [],
    });
  } catch (error) {
    console.error('[Partners] Availability GET failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await getUserFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = context;
    const body = (await request.json()) as AvailabilitySettingsInput;

    const payload = buildSettingsPayload(body, user.id);

    const { data, error } = await supabase
      .from('partner_availability_settings')
      .upsert(payload, {
        onConflict: 'partner_user_id',
      })
      .select('*')
      .single();

    if (error) {
      console.error('[Partners] Failed saving availability settings', error);
      return NextResponse.json({ error: 'Failed to save availability settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error('[Partners] Availability PUT failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
