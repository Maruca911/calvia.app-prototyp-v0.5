import { getSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ListingsView } from './listings-view';

export const dynamic = 'force-dynamic';

async function getSubCategory(slug: string) {
  const { data } = await getSupabase()
    .from('categories')
    .select('*, parent:parent_id(slug, name)')
    .eq('slug', slug)
    .not('parent_id', 'is', null)
    .maybeSingle();
  return data;
}

async function getListings(categoryId: string) {
  const { data } = await getSupabase()
    .from('listings')
    .select('*')
    .eq('category_id', categoryId)
    .order('is_featured', { ascending: false })
    .order('name');
  return data ?? [];
}

export default async function SubCategoryPage({
  params,
}: {
  params: { slug: string; subSlug: string };
}) {
  const subCategory = await getSubCategory(params.subSlug);
  if (!subCategory) notFound();

  const listings = await getListings(subCategory.id);

  return (
    <div className="px-5 py-6 animate-fade-in">
      <Link
        href={`/discover/${params.slug}`}
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
      <ListingsView listings={listings} parentSlug={params.slug} />
    </div>
  );
}
