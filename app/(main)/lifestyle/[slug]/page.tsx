import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { SubCategoryList } from './sub-category-list';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 3600;

async function getCategory(slug: string) {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .is('parent_id', null)
    .maybeSingle();
  return data;
}

async function getSubCategories(parentId: string) {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .order('sort_order');
  return data ?? [];
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await getCategory(params.slug);
  if (!category) notFound();

  const subCategories = await getSubCategories(category.id);

  const sourceLabel =
    category.slug === 'real-estate'
      ? 'Calvia Real Estate'
      : category.slug === 'health-medical'
      ? 'Calvia Health'
      : null;

  return (
    <div className="px-5 py-6 animate-fade-in">
      <Link
        href="/lifestyle"
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
        parentSlug={params.slug}
      />
    </div>
  );
}
