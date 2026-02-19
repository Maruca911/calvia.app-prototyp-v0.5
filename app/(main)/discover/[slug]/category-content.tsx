'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupabase } from '@/lib/supabase';
import { isCoreDiscoverCategorySlug } from '@/lib/discover-taxonomy';
import { SubCategoryList } from './sub-category-list';

export function CategoryContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!isCoreDiscoverCategorySlug(slug)) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      const supabase = getSupabase();
      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .is('parent_id', null)
        .maybeSingle();

      if (!cat) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      const { data: subs } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', cat.id)
        .order('sort_order');

      let filteredSubCategories = subs ?? [];
      if (filteredSubCategories.length > 0) {
        const { data: listingRows } = await supabase
          .from('listings')
          .select('category_id')
          .in('category_id', filteredSubCategories.map((sub) => sub.id));

        const activeCategoryIds = new Set((listingRows ?? []).map((row) => row.category_id));
        filteredSubCategories = filteredSubCategories.filter((sub) => activeCategoryIds.has(sub.id));
      }

      setCategory(cat);
      setSubCategories(filteredSubCategories);
      setLoaded(true);
    }
    fetchData();
  }, [slug]);

  if (!loaded) {
    return (
      <div className="px-5 py-6 space-y-4">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-5 w-64 rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[64px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-body text-muted-foreground">Category not found.</p>
        <button onClick={() => router.push('/discover')} className="mt-4 text-ocean-500 font-semibold">
          Back to Discover
        </button>
      </div>
    );
  }

  const sourceLabel =
    category.slug === 'real-estate'
      ? 'Calvia Real Estate'
      : category.slug === 'health-medical'
      ? 'Calvia Health'
      : null;

  return (
    <div className="px-5 py-6 animate-fade-in">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-ocean-500 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-heading-lg font-semibold text-foreground mb-1">
        {category.name}
      </h1>
      <p className="text-body-sm text-muted-foreground mb-6">
        {category.description}
      </p>
      {sourceLabel && (
        <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ocean-400 bg-ocean-50 px-3 py-1 rounded-full mb-5">
          Powered by {sourceLabel}
        </div>
      )}
      <SubCategoryList
        subCategories={subCategories}
        parentSlug={slug}
      />
    </div>
  );
}
