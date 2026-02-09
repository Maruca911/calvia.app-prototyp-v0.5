'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupabase } from '@/lib/supabase';
import { ListingDetail } from './listing-detail';

export function ListingPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('listings')
        .select('*, categories!inner(id, name, slug, parent_id, parent:parent_id(slug, name))')
        .eq('id', id)
        .maybeSingle();

      if (!data) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      const { data: relatedData } = await supabase
        .from('listings')
        .select('id, name, neighborhood, price_range, is_featured')
        .eq('category_id', data.category_id)
        .neq('id', id)
        .order('is_featured', { ascending: false })
        .limit(4);

      setListing(data);
      setRelated(relatedData ?? []);
      setLoaded(true);
    }
    fetchData();
  }, [id]);

  if (!loaded) {
    return (
      <div className="px-5 py-6 space-y-4">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-body text-muted-foreground">Listing not found.</p>
        <button onClick={() => router.push('/discover')} className="mt-4 text-ocean-500 font-semibold">
          Back to Discover
        </button>
      </div>
    );
  }

  return <ListingDetail listing={listing} relatedListings={related} />;
}
