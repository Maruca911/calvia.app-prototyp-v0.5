import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, getRequestIp } from '@/lib/api-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GoogleFindPlaceResponse {
  status?: string;
  candidates?: Array<{
    place_id?: string;
  }>;
}

interface GooglePlaceReview {
  author_name?: string;
  author_url?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
}

interface GooglePlaceDetailsResponse {
  status?: string;
  result?: {
    name?: string;
    url?: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: GooglePlaceReview[];
  };
}

function safeParam(value: string | null, max = 140): string {
  return (value || '')
    .replace(/[^\p{L}\p{N}\s,.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init?.headers || {}),
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const rateLimit = consumeRateLimit(`google-reviews:${ip}`, {
      windowMs: 60_000,
      max: 40,
    });

    if (!rateLimit.allowed) {
      return noStoreJson(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return noStoreJson({ enabled: false, reason: 'google_maps_api_key_not_configured' });
    }

    const name = safeParam(request.nextUrl.searchParams.get('name'), 120);
    const address = safeParam(request.nextUrl.searchParams.get('address'), 180);
    const limit = Math.min(5, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get('limit') || '3', 10) || 3));

    if (name.length < 2) {
      return noStoreJson({ error: 'Missing listing name' }, { status: 400 });
    }

    const searchQuery = [name, address, 'Calvia', 'Mallorca', 'Spain'].filter(Boolean).join(', ');
    const findUrl = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
    findUrl.searchParams.set('input', searchQuery);
    findUrl.searchParams.set('inputtype', 'textquery');
    findUrl.searchParams.set('fields', 'place_id');
    findUrl.searchParams.set('key', apiKey);

    const findResponse = await fetch(findUrl, { cache: 'no-store' });
    if (!findResponse.ok) {
      return noStoreJson({ error: 'Google review lookup failed' }, { status: 502 });
    }

    const findPayload = (await findResponse.json()) as GoogleFindPlaceResponse;
    const placeId = findPayload.candidates?.[0]?.place_id;
    if (!placeId) {
      return noStoreJson({ enabled: true, source: 'google', reviews: [] });
    }

    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set(
      'fields',
      'name,url,rating,user_ratings_total,reviews'
    );
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set('reviews_sort', 'newest');
    detailsUrl.searchParams.set('key', apiKey);

    const detailsResponse = await fetch(detailsUrl, { cache: 'no-store' });
    if (!detailsResponse.ok) {
      return noStoreJson({ error: 'Google review details failed' }, { status: 502 });
    }

    const detailsPayload = (await detailsResponse.json()) as GooglePlaceDetailsResponse;
    const details = detailsPayload.result;

    const reviews = (details?.reviews || []).slice(0, limit).map((review) => ({
      authorName: review.author_name || 'Google user',
      authorUrl: review.author_url || '',
      rating: Number(review.rating || 0),
      relativeTimeDescription: review.relative_time_description || '',
      text: (review.text || '').trim(),
    }));

    return noStoreJson({
      enabled: true,
      source: 'google',
      placeName: details?.name || null,
      placeUrl: details?.url || null,
      rating: typeof details?.rating === 'number' ? details.rating : null,
      totalRatings: typeof details?.user_ratings_total === 'number' ? details.user_ratings_total : null,
      reviews,
    });
  } catch (error) {
    console.error('[Reviews] Google review fetch failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return noStoreJson({ error: message }, { status: 500 });
  }
}
