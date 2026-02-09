'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { HeroSection } from './hero-section';
import { BlogGrid } from './blog-grid';
import { CategoryQuickAccess } from './category-quick-access';
import { FeatureCards } from './feature-cards';
import { DealsOfTheDay } from './deals-of-the-day';
import { EventsPreview } from './events-preview';
import { Skeleton } from '@/components/ui/skeleton';

export function HomeContent() {
  const [categories, setCategories] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();

    async function fetchAll() {
      const today = new Date().toISOString().split('T')[0];

      const [catRes, dealsRes, eventsRes, postsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .is('parent_id', null)
          .order('sort_order'),
        supabase
          .from('deals')
          .select('id, title, description, discount_text, valid_until, category, image_url, listing_id')
          .eq('is_active', true)
          .eq('deal_date', today)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('events')
          .select('id, title, description, location, event_date, category, image_url, is_featured')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(6),
        supabase
          .from('blog_posts')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(25),
      ]);

      setCategories(catRes.data ?? []);
      setEvents(eventsRes.data ?? []);
      setPosts(postsRes.data ?? []);

      if (dealsRes.data && dealsRes.data.length > 0) {
        setDeals(dealsRes.data);
      } else {
        const { data: fallback } = await supabase
          .from('deals')
          .select('id, title, description, discount_text, valid_until, category, image_url, listing_id')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);
        setDeals(fallback ?? []);
      }

      setLoaded(true);
    }

    fetchAll();
  }, []);

  return (
    <div className="animate-fade-in">
      <HeroSection />
      {!loaded ? (
        <div className="px-5 space-y-4 py-6">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <>
          <CategoryQuickAccess categories={categories} />
          <DealsOfTheDay deals={deals} />
          <EventsPreview events={events} />
          <FeatureCards />
          <BlogGrid posts={posts} />
        </>
      )}
    </div>
  );
}
