import { supabase } from '@/lib/supabase';
import { HeroSection } from './hero-section';
import { BlogGrid } from './blog-grid';
import { CategoryQuickAccess } from './category-quick-access';
import { FeatureCards } from './feature-cards';

export const dynamic = 'force-dynamic';

async function getBlogPosts() {
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order');
  return data ?? [];
}

export default async function HomePage() {
  const [posts, categories] = await Promise.all([
    getBlogPosts(),
    getCategories(),
  ]);

  return (
    <div className="animate-fade-in">
      <HeroSection />
      <CategoryQuickAccess categories={categories} />
      <FeatureCards />
      <BlogGrid posts={posts} />
    </div>
  );
}
