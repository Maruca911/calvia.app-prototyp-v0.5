import { getSupabase } from '@/lib/supabase';
import { DiscoverContent } from './discover-content';

export const dynamic = 'force-dynamic';

async function getCategories() {
  const { data, error } = await getSupabase()
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order');
  if (error) console.error('[Discover] getCategories error:', error.message);
  return data ?? [];
}

async function getAllListings() {
  const { data, error } = await getSupabase()
    .from('listings')
    .select('*, categories!inner(name, slug, parent_id)')
    .order('is_featured', { ascending: false })
    .order('name');
  if (error) console.error('[Discover] getAllListings error:', error.message);
  return data ?? [];
}

async function getNeighborhoods() {
  const { data, error } = await getSupabase()
    .from('listings')
    .select('neighborhood')
    .not('neighborhood', 'is', null)
    .order('neighborhood');
  if (error) console.error('[Discover] getNeighborhoods error:', error.message);

  const unique = Array.from(new Set((data ?? []).map((d: { neighborhood: string }) => d.neighborhood)));
  return unique as string[];
}

export default async function DiscoverPage() {
  const [categories, listings, neighborhoods] = await Promise.all([
    getCategories(),
    getAllListings(),
    getNeighborhoods(),
  ]);

  return (
    <DiscoverContent
      categories={categories}
      listings={listings}
      neighborhoods={neighborhoods}
    />
  );
}
