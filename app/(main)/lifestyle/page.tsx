import { getSupabase } from '@/lib/supabase';
import { LifestyleCategories } from './lifestyle-categories';

export const dynamic = 'force-dynamic';

async function getCategories() {
  const { data } = await getSupabase()
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order');
  return data ?? [];
}

export default async function LifestylePage() {
  const categories = await getCategories();

  return (
    <div className="px-5 py-6 animate-fade-in">
      <h1 className="text-heading-lg font-semibold text-foreground mb-1">
        Lifestyle
      </h1>
      <p className="text-body-sm text-muted-foreground mb-6">
        Curated services for refined living in Calvia
      </p>
      <LifestyleCategories categories={categories} />
    </div>
  );
}
