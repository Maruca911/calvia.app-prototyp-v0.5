import { getSupabase } from '@/lib/supabase';
import { HeroSection } from './hero-section';
import { BlogGrid } from './blog-grid';
import { CategoryQuickAccess } from './category-quick-access';
import { FeatureCards } from './feature-cards';
import { DealsOfTheDay } from './deals-of-the-day';
import { EventsPreview } from './events-preview';

export const dynamic = 'force-dynamic';

async function getBlogPosts() {
  const { data, error } = await getSupabase()
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(25);
  if (error) console.error('[Home] getBlogPosts error:', error.message);
  return data ?? [];
}

async function getCategories() {
  const { data, error } = await getSupabase()
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order');
  if (error) console.error('[Home] getCategories error:', error.message);
  return data ?? [];
}

async function getTodaysDeals() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await getSupabase()
    .from('deals')
    .select('id, title, description, discount_text, valid_until, category, image_url, listing_id')
    .eq('is_active', true)
    .eq('deal_date', today)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) console.error('[Home] getTodaysDeals error:', error.message);

  if (data && data.length > 0) return data;

  const { data: fallback, error: fallbackError } = await getSupabase()
    .from('deals')
    .select('id, title, description, discount_text, valid_until, category, image_url, listing_id')
    .eq('is_active', true)
    .not('is_premium_only', 'eq', true)
    .order('created_at', { ascending: false })
    .limit(4);

  if (fallbackError) console.error('[Home] getTodaysDeals fallback error:', fallbackError.message);

  return fallback ?? [];
}

async function getUpcomingEvents() {
  const { data, error } = await getSupabase()
    .from('events')
    .select('id, title, description, location, event_date, category, image_url, is_featured')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(6);
  if (error) console.error('[Home] getUpcomingEvents error:', error.message);
  return data ?? [];
}

export default async function HomePage() {
  const [posts, categories, todaysDeals, upcomingEvents] = await Promise.all([
    getBlogPosts(),
    getCategories(),
    getTodaysDeals(),
    getUpcomingEvents(),
  ]);

  return (
    <div className="animate-fade-in">
      <HeroSection />
      <CategoryQuickAccess categories={categories} />
      <DealsOfTheDay deals={todaysDeals} />
      <EventsPreview events={upcomingEvents} />
      <FeatureCards />
      <BlogGrid posts={posts} />
    </div>
  );
}
