'use client';

import { useState, useMemo } from 'react';
import { Search, X, MapPin, Star, Phone, Globe, Instagram } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LifestyleCategories } from './lifestyle-categories';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
}

interface Listing {
  id: string;
  name: string;
  description: string;
  contact_phone: string;
  website_url: string;
  address: string;
  neighborhood: string;
  price_range: string;
  is_featured: boolean;
  social_media: { instagram?: string; facebook?: string } | null;
  menu_url: string;
  categories: {
    name: string;
    slug: string;
    parent_id: string;
  };
}

interface DiscoverContentProps {
  categories: Category[];
  listings: Listing[];
  neighborhoods: string[];
}

export function DiscoverContent({ categories, listings, neighborhoods }: DiscoverContentProps) {
  const [query, setQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

  const isSearching = query.length >= 2 || selectedNeighborhood !== null;

  const filteredListings = useMemo(() => {
    if (!isSearching) return [];

    return listings.filter((listing) => {
      const matchesQuery =
        query.length < 2 ||
        listing.name.toLowerCase().includes(query.toLowerCase()) ||
        listing.description?.toLowerCase().includes(query.toLowerCase()) ||
        listing.categories.name.toLowerCase().includes(query.toLowerCase()) ||
        listing.neighborhood?.toLowerCase().includes(query.toLowerCase()) ||
        listing.address?.toLowerCase().includes(query.toLowerCase());

      const matchesNeighborhood =
        !selectedNeighborhood || listing.neighborhood === selectedNeighborhood;

      return matchesQuery && matchesNeighborhood;
    });
  }, [query, selectedNeighborhood, listings, isSearching]);

  const clearSearch = () => {
    setQuery('');
    setSelectedNeighborhood(null);
  };

  return (
    <div className="px-5 py-6 animate-fade-in">
      <h1 className="text-heading-lg font-semibold text-foreground mb-1">
        Discover
      </h1>
      <p className="text-body-sm text-muted-foreground mb-5">
        Everything you need in Calvia, at your fingertips
      </p>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search restaurants, shops, services..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11 pr-10 min-h-[50px] bg-white border-cream-300 text-body rounded-xl"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
        <button
          onClick={() => setSelectedNeighborhood(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
            selectedNeighborhood === null
              ? 'bg-ocean-500 text-white shadow-sm'
              : 'bg-white border border-cream-300 text-muted-foreground hover:border-sage-300'
          }`}
        >
          All Areas
        </button>
        {neighborhoods.map((n) => (
          <button
            key={n}
            onClick={() =>
              setSelectedNeighborhood(selectedNeighborhood === n ? null : n)
            }
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
              selectedNeighborhood === n
                ? 'bg-ocean-500 text-white shadow-sm'
                : 'bg-white border border-cream-300 text-muted-foreground hover:border-sage-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {isSearching ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-muted-foreground">
              {filteredListings.length} result{filteredListings.length !== 1 ? 's' : ''}
              {selectedNeighborhood && ` in ${selectedNeighborhood}`}
            </p>
            <button
              onClick={clearSearch}
              className="text-[14px] font-medium text-ocean-500 hover:text-ocean-400 transition-colors"
            >
              Clear filters
            </button>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-body text-muted-foreground">
                No results found. Try a different search term or area.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredListings.map((listing) => (
                <SearchResultCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <LifestyleCategories categories={categories} />
      )}
    </div>
  );
}

function SearchResultCard({ listing }: { listing: Listing }) {
  const instagram = listing.social_media?.instagram;
  const hasWebsite = listing.website_url && listing.website_url.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-cream-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[17px] font-semibold text-foreground leading-snug">
              {listing.name}
            </h3>
            {listing.is_featured && (
              <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-ocean-500 bg-ocean-50 px-2 py-0.5 rounded-full flex-shrink-0">
                <Star size={10} fill="currentColor" />
                Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[13px] font-medium text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full">
              {listing.categories.name}
            </span>
            {listing.neighborhood && (
              <span className="text-[13px] text-muted-foreground flex items-center gap-1">
                <MapPin size={12} />
                {listing.neighborhood}
              </span>
            )}
            {listing.price_range && (
              <span className="text-[13px] font-medium text-muted-foreground">
                {listing.price_range}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-[15px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
        {listing.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {listing.contact_phone && (
          <Button asChild size="sm" className="h-8 text-[13px]">
            <a href={`tel:${listing.contact_phone}`}>
              <Phone size={14} className="mr-1.5" />
              Call
            </a>
          </Button>
        )}
        {hasWebsite && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-[13px] border-ocean-200 text-ocean-500 hover:bg-ocean-50"
          >
            <a href={listing.website_url} target="_blank" rel="noopener noreferrer">
              <Globe size={14} className="mr-1.5" />
              Website
            </a>
          </Button>
        )}
        {!hasWebsite && instagram && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-[13px] border-sage-200 text-sage-600 hover:bg-sage-50"
          >
            <a href={instagram} target="_blank" rel="noopener noreferrer">
              <Instagram size={14} className="mr-1.5" />
              Instagram
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
