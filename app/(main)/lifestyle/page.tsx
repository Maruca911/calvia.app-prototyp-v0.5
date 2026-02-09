import { getSupabase } from '@/lib/supabase';
import { DiscoverContent } from './discover-content';

export const dynamic = 'force-dynamic';

async function getCategories() {
  const { data } = await getSupabase()
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order');
  return data ?? [];
}

async function getAllListings() {
  const { data } = await getSupabase()
    .from('listings')
    .select('*, categories!inner(name, slug, parent_id)')
    .order('is_featured', { ascending: false })
    .order('name');
  return data ?? [];
}

async function getNeighborhoods() {
  const { data } = await getSupabase()
    .from('listings')
    .select('neighborhood')
    .not('neighborhood', 'is', null)
    .order('neighborhood');

  const unique = Array.from(new Set((data ?? []).map((d: { neighborhood: string }) => d.neighborhood)));
  return unique as string[];
}

export default async function LifestylePage() {
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
