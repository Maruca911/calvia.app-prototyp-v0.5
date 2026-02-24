import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CORE_DISCOVER_CATEGORY_SLUGS } from '@/lib/discover-taxonomy';
import { consumeRateLimit, getRequestIp } from '@/lib/api-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ListingSearchRow {
  id: string;
  name: string;
  neighborhood: string | null;
  is_featured: boolean;
  description: string | null;
  tags: string[] | null;
  categories:
    | { name: string; slug: string; parent_id: string | null }
    | { name: string; slug: string; parent_id: string | null }[]
    | null;
}

function getSupabaseServerClient() {
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

function normalizeSearchQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function getListingCategory(
  category:
    | { name: string; slug: string; parent_id: string | null }
    | { name: string; slug: string; parent_id: string | null }[]
    | null
) {
  if (!category) return null;
  return Array.isArray(category) ? category[0] ?? null : category;
}

export async function GET(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const rateLimit = consumeRateLimit(`search:${ip}`, {
      windowMs: 60_000,
      max: 50,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many search requests. Please wait and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const query = normalizeSearchQuery(request.nextUrl.searchParams.get('q') || '');
    const limit = Math.min(
      25,
      Math.max(1, Number.parseInt(request.nextUrl.searchParams.get('limit') || '8', 10) || 8)
    );

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = getSupabaseServerClient();
    const likeQuery = `%${query}%`;

    const [topLevelCategoriesRes, nameMatchesRes, descriptionMatchesRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id')
        .is('parent_id', null)
        .in('slug', [...CORE_DISCOVER_CATEGORY_SLUGS]),
      supabase
        .from('listings')
        .select('id, name, neighborhood, is_featured, description, tags, categories!inner(name, slug, parent_id)')
        .ilike('name', likeQuery)
        .order('is_featured', { ascending: false })
        .order('name')
        .limit(60),
      supabase
        .from('listings')
        .select('id, name, neighborhood, is_featured, description, tags, categories!inner(name, slug, parent_id)')
        .ilike('description', likeQuery)
        .order('is_featured', { ascending: false })
        .order('name')
        .limit(40),
    ]);

    if (nameMatchesRes.error) {
      console.error('[Search] name query failed', nameMatchesRes.error);
      return NextResponse.json({ error: 'Failed to search listings' }, { status: 500 });
    }
    if (descriptionMatchesRes.error) {
      console.error('[Search] description query failed', descriptionMatchesRes.error);
      return NextResponse.json({ error: 'Failed to search listings' }, { status: 500 });
    }
    if (topLevelCategoriesRes.error) {
      console.error('[Search] category scope query failed', topLevelCategoriesRes.error);
      return NextResponse.json({ error: 'Failed to search listings' }, { status: 500 });
    }

    const allowedParentIds = new Set((topLevelCategoriesRes.data || []).map((row) => row.id));
    const allowedSlugs = new Set<string>(CORE_DISCOVER_CATEGORY_SLUGS as readonly string[]);
    const merged = new Map<string, ListingSearchRow>();

    for (const row of [...(nameMatchesRes.data || []), ...(descriptionMatchesRes.data || [])] as ListingSearchRow[]) {
      merged.set(row.id, row);
    }

    const filteredResults = Array.from(merged.values())
      .filter((listing) => {
        const category = getListingCategory(listing.categories);
        if (!category) {
          return false;
        }
        if (category.parent_id && allowedParentIds.has(category.parent_id)) {
          return true;
        }
        return allowedSlugs.has(category.slug);
      })
      .sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return a.is_featured ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);

    return NextResponse.json({ results: filteredResults });
  } catch (error) {
    console.error('[Search] listings route failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
