'use client';

import { useEffect, useState } from 'react';
import { getSupabase, getSupabaseConfigError } from '@/lib/supabase';
import { HeroSection } from './hero-section';
import { BlogGrid } from './blog-grid';
import { CategoryQuickAccess } from './category-quick-access';
import { FeatureCards } from './feature-cards';
import { DealsOfTheDay } from './deals-of-the-day';
import { EventsPreview } from './events-preview';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  description: string;
}

interface Deal {
  id: string;
  title: string;
  description: string;
  discount_text: string;
  valid_until: string;
  category: string;
  image_url: string;
  listing_id: string | null;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  category: string;
  image_url: string;
  is_featured: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  author: string;
  published_at: string;
  tags: string[];
  category: string;
}

const HOME_DATA_WARNING = 'Some home sections are currently unavailable.';

export function HomeContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const configError = getSupabaseConfigError();
    if (configError) {
      setError(`${configError}. Add these values in your deployment environment and redeploy.`);
      setLoaded(true);
      return;
    }

    const supabase = getSupabase();
    let isCancelled = false;

    async function fetchAll() {
      const today = new Date().toISOString().split('T')[0];

      try {
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

        if (isCancelled) {
          return;
        }

        const requestErrors = [
          catRes.error ? `categories: ${catRes.error.message}` : null,
          dealsRes.error ? `deals: ${dealsRes.error.message}` : null,
          eventsRes.error ? `events: ${eventsRes.error.message}` : null,
          postsRes.error ? `blog_posts: ${postsRes.error.message}` : null,
        ].filter((value): value is string => Boolean(value));

        setCategories((catRes.data ?? []) as Category[]);
        setEvents((eventsRes.data ?? []) as EventItem[]);
        setPosts((postsRes.data ?? []) as BlogPost[]);

        if (dealsRes.data && dealsRes.data.length > 0) {
          setDeals(dealsRes.data as Deal[]);
        } else {
          const { data: fallbackDeals, error: fallbackDealsError } = await supabase
            .from('deals')
            .select('id, title, description, discount_text, valid_until, category, image_url, listing_id')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(6);

          if (isCancelled) {
            return;
          }

          if (fallbackDealsError) {
            requestErrors.push(`deals fallback: ${fallbackDealsError.message}`);
          }

          setDeals((fallbackDeals ?? []) as Deal[]);
        }

        if (requestErrors.length > 0) {
          console.error('[HomeContent] Data fetch warnings:', requestErrors.join(' | '));
          setError(HOME_DATA_WARNING);
        }
      } catch (fetchError) {
        console.error('[HomeContent] Failed to load home data:', fetchError);
        if (!isCancelled) {
          setError('Unable to load home content.');
        }
      } finally {
        if (!isCancelled) {
          setLoaded(true);
        }
      }
    }

    void fetchAll();

    return () => {
      isCancelled = true;
    };
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
          {error && (
            <div className="px-5 pt-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-800">
                {error}
              </div>
            </div>
          )}
          {categories.length > 0 ? (
            <CategoryQuickAccess categories={categories} />
          ) : (
            <section className="px-5 py-6">
              <div className="rounded-xl border border-cream-200 bg-white px-4 py-5 text-body-sm text-muted-foreground">
                Categories are currently unavailable.
              </div>
            </section>
          )}
          <DealsOfTheDay deals={deals} />
          <EventsPreview events={events} />
          <FeatureCards />
          {posts.length > 0 ? (
            <BlogGrid posts={posts} />
          ) : (
            <section className="px-5 py-8">
              <div className="rounded-xl border border-cream-200 bg-white px-4 py-5 text-body-sm text-muted-foreground">
                Articles are currently unavailable.
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
