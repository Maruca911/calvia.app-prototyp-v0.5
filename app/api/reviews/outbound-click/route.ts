import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { isAllowedExternalReviewUrl, type ReviewProvider } from '@/lib/external-reviews';
import { consumeRateLimit, getRequestIp } from '@/lib/api-rate-limit';

interface OutboundClickPayload {
  listingId?: string;
  provider?: string;
  destinationUrl?: string;
}

function getPublicSupabaseClient(accessToken?: string): SupabaseClient {
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

async function getOptionalUserFromRequest(
  request: NextRequest
): Promise<{ user: User | null; supabase: SupabaseClient }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const supabase = getPublicSupabaseClient(token);

  if (!token) {
    return { user: null, supabase };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null, supabase: getPublicSupabaseClient() };
  }

  return { user: data.user, supabase };
}

function asProvider(value: string | undefined): ReviewProvider | null {
  if (value === 'google' || value === 'tripadvisor') {
    return value;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const rateLimit = consumeRateLimit(`reviews-outbound:${ip}`, {
      windowMs: 60_000,
      max: 50,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const { user, supabase } = await getOptionalUserFromRequest(request);
    const body = (await request.json()) as OutboundClickPayload;

    const provider = asProvider(body.provider);
    if (!provider) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const destinationUrl = body.destinationUrl;
    if (!destinationUrl || !isAllowedExternalReviewUrl(provider, destinationUrl)) {
      return NextResponse.json({ error: 'Invalid review destination url' }, { status: 400 });
    }

    const payload = {
      listing_id: body.listingId || null,
      user_id: user?.id || null,
      provider,
      destination_url: destinationUrl,
    };

    const { error } = await supabase.from('review_outbound_events').insert(payload);
    if (error) {
      // This endpoint is analytics-only. If migration/env is not ready, do not block user flow.
      console.warn('[Reviews] Outbound click not tracked', error);
      return NextResponse.json({ success: true, tracked: false });
    }

    return NextResponse.json({ success: true, tracked: true });
  } catch (error) {
    console.error('[Reviews] outbound-click route failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
