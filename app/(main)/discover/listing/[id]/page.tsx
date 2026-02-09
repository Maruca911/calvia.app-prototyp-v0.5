import { getSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { ListingDetail } from './listing-detail';

export const dynamic = 'force-dynamic';

async function getListing(id: string) {
  const { data } = await getSupabase()
    .from('listings')
    .select('*, categories!inner(id, name, slug, parent_id, parent:parent_id(slug, name))')
    .eq('id', id)
    .maybeSingle();
  return data;
}

async function getRelatedListings(categoryId: string, excludeId: string) {
  const { data } = await getSupabase()
    .from('listings')
    .select('id, name, neighborhood, price_range, is_featured')
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .order('is_featured', { ascending: false })
    .limit(4);
  return data ?? [];
}

export default async function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const listing = await getListing(params.id);
  if (!listing) notFound();

  const related = await getRelatedListings(listing.category_id, listing.id);

  return <ListingDetail listing={listing} relatedListings={related} />;
}
