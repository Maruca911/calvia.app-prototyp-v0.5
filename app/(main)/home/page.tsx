import { getSupabase } from '@/lib/supabase';
import { HeroSection } from './hero-section';
import { BlogGrid } from './blog-grid';
import { CategoryQuickAccess } from './category-quick-access';
import { FeatureCards } from './feature-cards';
import { DealsOfTheDay } from './deals-of-the-day';

export const dynamic = 'force-dynamic';

async function getBlogPosts() {
  const { data } = await getSupabase()
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(25);
  return data ?? [];
}

async function getCategories() {
  const { data } = await getSupabase()
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order');
  return data ?? [];
}

async function getTodaysDeals() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await getSupabase()
    .from('deals')
    .select('id, title, description, discount_text, valid_until, category, image_url, listing_id')
    .eq('is_active', true)
    .eq('deal_date', today)
    .order('created_at', { ascending: false })
    .limit(6);

  if (data && data.length > 0) return data;

  const { data: fallback } = await getSupabase()
    .from('deals')
    .select('id, title, description, discount_text, valid_until, category, image_url, listing_id')
    .eq('is_active', true)
    .not('is_premium_only', 'eq', true)
    .order('created_at', { ascending: false })
    .limit(4);

  return fallback ?? [];
}

export default async function HomePage() {
  const [posts, categories, todaysDeals] = await Promise.all([
    getBlogPosts(),
    getCategories(),
    getTodaysDeals(),
  ]);

  return (
    <div className="animate-fade-in">
      <HeroSection />
      <CategoryQuickAccess categories={categories} />
      <DealsOfTheDay deals={todaysDeals} />
      <FeatureCards />
      <BlogGrid posts={posts} />
    </div>
  );
}
