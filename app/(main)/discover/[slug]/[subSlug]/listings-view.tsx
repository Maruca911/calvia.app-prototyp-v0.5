'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Globe, MapPin, Star, Heart, Instagram, ExternalLink, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { getListingImage } from '@/lib/listing-images';

interface Listing {
  id: string;
  name: string;
  description: string;
  contact_phone: string;
  contact_email: string;
  website_url: string;
  address: string;
  neighborhood: string;
  price_range: string;
  is_featured: boolean;
  social_media: { instagram?: string; facebook?: string } | null;
  menu_url: string;
  image_url: string;
}

type SortOption = 'featured' | 'name' | 'price-low' | 'price-high';

const PRICE_LEVELS = ['All', '\u20AC', '\u20AC\u20AC', '\u20AC\u20AC\u20AC', '\u20AC\u20AC\u20AC\u20AC'];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured first' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

function priceLevel(pr: string): number {
  if (!pr) return 0;
  return pr.replace(/[^€$]/g, '').length;
}

export function ListingsView({ listings, parentSlug }: { listings: Listing[]; parentSlug?: string }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [priceFilter, setPriceFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await getSupabase()
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id);
    if (data) setFavoriteIds(new Set(data.map(f => f.listing_id)));
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (listingId: string) => {
    if (!user) {
      toast('Sign in to save favorites', { description: 'Go to Profile to create an account.' });
      return;
    }
    const isFav = favoriteIds.has(listingId);
    if (isFav) {
      setFavoriteIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });
      await getSupabase().from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
      toast('Removed from favorites');
    } else {
      setFavoriteIds(prev => new Set(prev).add(listingId));
      await getSupabase().from('favorites').insert({ user_id: user.id, listing_id: listingId });
      toast('Saved to favorites');
    }
  };

  const processed = useMemo(() => {
    let result = [...listings];
    if (priceFilter !== 'All') {
      const target = priceFilter.length;
      result = result.filter(l => priceLevel(l.price_range) === target);
    }
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        result.sort((a, b) => priceLevel(a.price_range) - priceLevel(b.price_range));
        break;
      case 'price-high':
        result.sort((a, b) => priceLevel(b.price_range) - priceLevel(a.price_range));
        break;
      default:
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }
    return result;
  }, [listings, sortBy, priceFilter]);

  if (!listings.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-body">
          Listings coming soon. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-muted-foreground">
          {processed.length} {processed.length === 1 ? 'result' : 'results'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              showFilters || priceFilter !== 'All'
                ? 'bg-ocean-500 text-white'
                : 'bg-white text-muted-foreground border border-cream-300 hover:border-sage-300'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filter
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-white rounded-xl border border-cream-200 space-y-3 animate-fade-in">
          <div>
            <p className="text-[13px] font-medium text-foreground mb-2 flex items-center gap-1.5">
              <ArrowUpDown size={13} />
              Sort by
            </p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                    sortBy === opt.value
                      ? 'bg-ocean-500 text-white'
                      : 'bg-cream-100 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground mb-2">Price range</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setPriceFilter(level)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                    priceFilter === level
                      ? 'bg-ocean-500 text-white'
                      : 'bg-cream-100 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {processed.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-body-sm text-muted-foreground">No listings match your filters.</p>
          <button
            onClick={() => { setPriceFilter('All'); setSortBy('featured'); }}
            className="mt-2 text-body-sm font-medium text-ocean-500"
          >
            Clear filters
          </button>
        </div>
      ) : (
        processed.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            parentSlug={parentSlug}
            isFavorited={favoriteIds.has(listing.id)}
            onToggleFavorite={() => toggleFavorite(listing.id)}
          />
        ))
      )}
    </div>
  );
}

function ListingCard({
  listing,
  parentSlug,
  isFavorited,
  onToggleFavorite,
}: {
  listing: Listing;
  parentSlug?: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}) {
  const instagram = listing.social_media?.instagram;
  const hasWebsite = listing.website_url && listing.website_url.length > 0;
  const imageUrl = listing.image_url || getListingImage(listing.id, parentSlug);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-cream-200 overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/discover/listing/${listing.id}`} className="block relative h-36 w-full bg-cream-100">
        <Image
          src={imageUrl}
          alt={listing.name}
          fill
          className="object-cover"
          sizes="(max-width: 512px) 100vw, 512px"
        />
        {listing.is_featured && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-white bg-ocean-500 px-2.5 py-1 rounded-full shadow-md">
            <Star size={10} fill="currentColor" />
            Featured
          </span>
        )}
      </Link>
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/discover/listing/${listing.id}`}
              className="text-[17px] font-semibold text-foreground leading-snug hover:text-ocean-500 transition-colors"
            >
              {listing.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {listing.neighborhood && (
                <span className="text-[13px] text-muted-foreground flex items-center gap-1">
                  <MapPin size={12} className="text-sage-500" />
                  {listing.neighborhood}
                </span>
              )}
              {listing.price_range && (
                <span className="text-[13px] font-medium text-sage-600">{listing.price_range}</span>
              )}
            </div>
          </div>
          <button
            onClick={onToggleFavorite}
            className="flex-shrink-0 p-2 -m-2 text-muted-foreground hover:text-ocean-500 transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={22} fill={isFavorited ? '#003366' : 'none'} className={isFavorited ? 'text-ocean-500' : ''} />
          </button>
        </div>

        <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-2">
          {listing.description}
        </p>

        <div className="flex flex-wrap gap-2 pt-0.5">
          {listing.contact_phone && (
            <Button asChild size="sm">
              <a href={`tel:${listing.contact_phone}`}>
                <Phone size={14} className="mr-1.5" />
                Call
              </a>
            </Button>
          )}
          {hasWebsite && (
            <Button asChild variant="outline" size="sm" className="border-ocean-200 text-ocean-500 hover:bg-ocean-50">
              <a href={listing.website_url} target="_blank" rel="noopener noreferrer">
                <Globe size={14} className="mr-1.5" />
                Website
              </a>
            </Button>
          )}
          {!hasWebsite && instagram && (
            <Button asChild variant="outline" size="sm" className="border-[#E1306C]/30 text-[#C13584] hover:bg-[#E1306C]/5">
              <a href={instagram} target="_blank" rel="noopener noreferrer">
                <Instagram size={14} className="mr-1.5" />
                Instagram
              </a>
            </Button>
          )}
          {listing.menu_url && (
            <Button asChild variant="outline" size="sm" className="border-cream-300 text-foreground hover:bg-cream-100">
              <a href={listing.menu_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} className="mr-1.5" />
                Menu
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
