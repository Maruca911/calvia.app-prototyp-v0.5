'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, MapPin, Star, ArrowRight, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface SearchListing {
  id: string;
  name: string;
  neighborhood: string;
  is_featured: boolean;
  description: string;
  tags: string[] | null;
  categories: { name: string; slug: string };
}

const SYNONYMS: Record<string, string[]> = {
  hair: ['hairdresser', 'salon', 'colouring', 'balayage', 'barber', 'stylist'],
  eat: ['restaurant', 'dining', 'food', 'cuisine'],
  food: ['restaurant', 'dining', 'eat', 'cuisine'],
  boat: ['yacht', 'sailing', 'charter', 'marina'],
  lawyer: ['legal', 'law', 'abogados', 'solicitor'],
  doctor: ['medical', 'health', 'clinic', 'dentist'],
  clean: ['cleaning', 'domestic', 'maid', 'housekeeping'],
  fix: ['repair', 'handyman', 'plumber', 'electrician'],
  beauty: ['salon', 'facial', 'nails', 'lash', 'makeup'],
  spa: ['wellness', 'massage', 'treatment', 'relaxation'],
  coffee: ['cafe', 'brunch', 'cappuccino'],
  property: ['real-estate', 'villa', 'apartment', 'house'],
  emergency: ['police', 'fire', 'ambulance', 'hospital', '112'],
};

function scoreResult(listing: SearchListing, terms: string[]): number {
  let score = 0;
  const name = listing.name.toLowerCase();
  const desc = (listing.description || '').toLowerCase();
  const catName = listing.categories.name.toLowerCase();
  const tags = (listing.tags || []).map(t => t.toLowerCase());

  for (const term of terms) {
    if (name.includes(term)) score += 10;
    if (catName.includes(term)) score += 6;
    if (tags.some(t => t.includes(term))) score += 5;
    if (desc.includes(term)) score += 2;

    const synonyms = SYNONYMS[term] || [];
    for (const syn of synonyms) {
      if (name.includes(syn)) score += 4;
      if (catName.includes(syn)) score += 3;
      if (tags.some(t => t.includes(syn))) score += 3;
    }
  }

  if (listing.is_featured) score += 2;
  return score;
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<SearchListing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadListings = useCallback(async () => {
    if (loaded) return;
    const { data } = await getSupabase()
      .from('listings')
      .select('id, name, neighborhood, is_featured, description, tags, categories!inner(name, slug)')
      .order('is_featured', { ascending: false })
      .order('name');
    if (data) {
      setListings(data as unknown as SearchListing[]);
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (open && !loaded) {
      loadListings();
    }
  }, [open, loaded, loadListings]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
    if (!terms.length) return [];

    return listings
      .map((listing) => ({ listing, score: scoreResult(listing, terms) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(r => r.listing);
  }, [query, listings]);

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  const goToDiscover = () => {
    handleClose();
    router.push('/discover');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200 transition-colors"
        aria-label="Search"
      >
        <Search size={17} className="text-ocean-500" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-cream-200 bg-white">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurants, shops, services..."
            className="flex-1 text-body-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
          />
          <button
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {!loaded && query.length >= 2 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="text-ocean-400 animate-spin" />
            </div>
          )}

          {query.length < 2 && (
            <div className="space-y-4">
              <p className="text-[14px] text-muted-foreground">
                Start typing to search across all businesses and services in Calvia.
              </p>
              <button
                onClick={goToDiscover}
                className="flex items-center gap-2 text-body-sm font-medium text-ocean-500 hover:text-ocean-400 transition-colors"
              >
                Browse all categories
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {query.length >= 2 && loaded && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-body-sm text-muted-foreground mb-3">
                No results for &ldquo;{query}&rdquo;
              </p>
              <button
                onClick={goToDiscover}
                className="text-[14px] font-medium text-ocean-500 hover:text-ocean-400 transition-colors"
              >
                Browse all categories
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[13px] text-muted-foreground mb-2">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/discover/listing/${listing.id}`}
                  onClick={handleClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0">
                    {listing.is_featured ? (
                      <Star size={16} className="text-ocean-500" fill="currentColor" />
                    ) : (
                      <Search size={14} className="text-sage-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-foreground truncate">
                      {listing.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[13px] text-sage-600">{listing.categories.name}</span>
                      {listing.neighborhood && (
                        <span className="text-[12px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin size={10} />
                          {listing.neighborhood}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              <button
                onClick={goToDiscover}
                className="flex items-center gap-2 w-full p-3 text-body-sm font-medium text-ocean-500 hover:bg-ocean-50 rounded-xl transition-colors justify-center mt-2"
              >
                View all in Discover
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
