'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupabase } from '@/lib/supabase';
import { ListingsView } from './listings-view';

export function SubcategoryContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const subSlug = params.subSlug as string;

  const [subCategory, setSubCategory] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabase();
      const { data: sub } = await supabase
        .from('categories')
        .select('*, parent:parent_id(slug, name)')
        .eq('slug', subSlug)
        .not('parent_id', 'is', null)
        .maybeSingle();

      if (!sub) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .eq('category_id', sub.id)
        .order('is_featured', { ascending: false })
        .order('name');

      setSubCategory(sub);
      setListings(listingsData ?? []);
      setLoaded(true);
    }
    fetchData();
  }, [subSlug]);

  if (!loaded) {
    return (
      <div className="px-5 py-6 space-y-4">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-5 w-64 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-body text-muted-foreground">Sub-category not found.</p>
        <button onClick={() => router.push('/discover')} className="mt-4 text-ocean-500 font-semibold">
          Back to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 animate-fade-in">
      <Link
        href={`/discover/${slug}`}
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-ocean-500 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-heading-lg font-semibold text-foreground mb-1">
        {subCategory.name}
      </h1>
      <p className="text-body-sm text-muted-foreground mb-6">
        {subCategory.description}
      </p>
      <ListingsView listings={listings} parentSlug={slug} />
    </div>
  );
}
