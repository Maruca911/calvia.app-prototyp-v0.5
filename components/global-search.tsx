'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, MapPin, Star, ArrowRight, Loader2, Utensils, ShoppingBag, Briefcase, Heart, Home } from 'lucide-react';
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

const CATEGORY_ICONS: Record<string, typeof Utensils> = {
  'Restaurants': Utensils,
  'Cafes & Brunch': Utensils,
  'Fine Dining': Utensils,
  'Tapas Bars': Utensils,
  'International Cuisine': Utensils,
  'Boutiques & Fashion': ShoppingBag,
  'Supermarkets': ShoppingBag,
  'Agencies': Briefcase,
  'Developers': Briefcase,
  'Legal & Tax': Briefcase,
  'Wellness & Spa': Heart,
  'Pharmacies': Heart,
  'Home Services': Home,
};

function getCategoryIcon(catName: string) {
  return CATEGORY_ICONS[catName] || Search;
}

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

function highlightMatch(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
  if (!terms.length) return text;

  const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (terms.some(t => part.toLowerCase() === t)) {
      return <mark key={i} className="bg-ocean-100 text-ocean-700 rounded-sm px-0.5 font-semibold">{part}</mark>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
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
    <div className="fixed inset-0 z-50 bg-cream-50">
      <div className="max-w-lg mx-auto h-full flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-cream-200 shadow-sm">
          <div className="flex-1 flex items-center gap-3 bg-cream-50 rounded-xl px-4 py-2.5 border border-cream-200 focus-within:border-ocean-300 focus-within:ring-2 focus-within:ring-ocean-100 transition-all">
            <Search size={18} className="text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants, shops, services..."
              className="flex-1 text-[16px] bg-transparent outline-none placeholder:text-muted-foreground/50"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-[15px] font-medium text-ocean-500 hover:text-ocean-400 transition-colors flex-shrink-0"
          >
            Cancel
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!loaded && query.length >= 2 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-ocean-400 animate-spin" />
              <p className="text-[14px] text-muted-foreground">Searching...</p>
            </div>
          )}

          {query.length < 2 && (
            <div className="flex flex-col items-center text-center py-12 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-ocean-50 flex items-center justify-center">
                <Search size={28} className="text-ocean-400" />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-foreground mb-1">
                  Find anything in Calvia
                </p>
                <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px]">
                  Search across all businesses, restaurants, shops and services.
                </p>
              </div>
              <button
                onClick={goToDiscover}
                className="flex items-center gap-2 text-[15px] font-semibold text-ocean-500 hover:text-ocean-400 transition-colors mt-2 px-5 py-2.5 rounded-xl bg-ocean-50 hover:bg-ocean-100"
              >
                Browse all categories
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {query.length >= 2 && loaded && results.length === 0 && (
            <div className="flex flex-col items-center text-center py-12 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center">
                <Search size={28} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-foreground mb-1">
                  No results found
                </p>
                <p className="text-[15px] text-muted-foreground">
                  Nothing matched &ldquo;{query}&rdquo;. Try different keywords.
                </p>
              </div>
              <button
                onClick={goToDiscover}
                className="flex items-center gap-2 text-[15px] font-semibold text-ocean-500 hover:text-ocean-400 transition-colors mt-1 px-5 py-2.5 rounded-xl bg-ocean-50 hover:bg-ocean-100"
              >
                Browse all categories
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-semibold text-foreground">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </p>
                <button
                  onClick={goToDiscover}
                  className="text-[13px] font-medium text-ocean-500 hover:text-ocean-400 transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {results.map((listing, i) => {
                  const CatIcon = getCategoryIcon(listing.categories.name);
                  return (
                    <Link
                      key={listing.id}
                      href={`/discover/listing/${listing.id}`}
                      onClick={handleClose}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-cream-200 hover:border-ocean-200 hover:shadow-md transition-all group"
                      style={{ animation: `fade-in 0.3s ease-out ${i * 0.04}s forwards`, opacity: 0 }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        listing.is_featured
                          ? 'bg-gradient-to-br from-ocean-500 to-ocean-400'
                          : 'bg-cream-100 group-hover:bg-ocean-50'
                      } transition-colors`}>
                        {listing.is_featured ? (
                          <Star size={20} className="text-white" fill="currentColor" />
                        ) : (
                          <CatIcon size={18} className="text-ocean-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-semibold text-foreground truncate group-hover:text-ocean-600 transition-colors">
                          {highlightMatch(listing.name, query)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[13px] font-medium text-ocean-500 bg-ocean-50 px-2 py-0.5 rounded-full">
                            {listing.categories.name}
                          </span>
                          {listing.neighborhood && (
                            <span className="text-[13px] text-muted-foreground flex items-center gap-1">
                              <MapPin size={11} />
                              {listing.neighborhood}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground group-hover:text-ocean-500 flex-shrink-0 transition-colors" />
                    </Link>
                  );
                })}
              </div>
              <button
                onClick={goToDiscover}
                className="flex items-center gap-2 w-full p-3.5 text-[15px] font-semibold text-ocean-500 hover:bg-ocean-50 rounded-xl transition-colors justify-center mt-3 border border-ocean-100"
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
