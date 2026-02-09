'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, MapPin, Star, Phone, Globe, Instagram } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DiscoverCategories } from './discover-categories';

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
  tags: string[] | null;
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

const SEARCH_SYNONYMS: Record<string, string[]> = {
  'hair': ['hairdresser', 'salon', 'colouring', 'balayage', 'barber', 'stylist'],
  'hairdresser': ['hair', 'salon', 'colouring', 'balayage', 'cuts'],
  'eat': ['restaurant', 'dining', 'food', 'cuisine'],
  'food': ['restaurant', 'dining', 'eat', 'cuisine'],
  'boat': ['yacht', 'sailing', 'charter', 'marina', 'RIB'],
  'yacht': ['boat', 'sailing', 'charter', 'marina'],
  'swim': ['pool', 'beach', 'watersports'],
  'surf': ['efoil', 'fliteboard', 'watersports', 'SUP'],
  'fly': ['efoil', 'fliteboard', 'parasailing'],
  'lawyer': ['legal', 'law', 'abogados', 'solicitor', 'conveyancing'],
  'legal': ['lawyer', 'law', 'abogados', 'notary'],
  'tax': ['accounting', 'fiscal', 'beckham-law', 'tax-advisor'],
  'doctor': ['medical', 'health', 'clinic', 'dentist'],
  'gym': ['fitness', 'crossfit', 'workout', 'training'],
  'clean': ['cleaning', 'domestic', 'maid', 'housekeeping'],
  'fix': ['repair', 'handyman', 'plumber', 'electrician', 'maintenance'],
  'school': ['education', 'college', 'academy', 'learning'],
  'shop': ['shopping', 'boutique', 'store', 'supermarket'],
  'spa': ['wellness', 'massage', 'treatment', 'relaxation'],
  'coffee': ['cafe', 'brunch', 'cappuccino', 'pastries'],
  'brunch': ['cafe', 'coffee', 'breakfast', 'morning'],
  'sushi': ['japanese', 'sashimi', 'omakase'],
  'pizza': ['italian', 'pasta', 'trattoria'],
  'steak': ['grill', 'steakhouse', 'argentine', 'meat'],
  'beach': ['beachfront', 'beach-club', 'seaside', 'cove'],
  'club': ['beach-club', 'membership', 'social'],
  'rent': ['rental', 'hire', 'charter'],
  'dive': ['diving', 'snorkelling', 'PADI', 'underwater'],
  'padel': ['courts', 'racquet', 'tennis'],
  'tennis': ['courts', 'racquet', 'academy'],
  'pilates': ['reformer', 'barre', 'studio', 'fitness'],
  'pool': ['swimming', 'maintenance', 'cleaning'],
  'garden': ['landscaping', 'gardening', 'lawn', 'plants'],
  'property': ['real-estate', 'villa', 'apartment', 'house'],
  'home': ['villa', 'apartment', 'house', 'property'],
  'beauty': ['salon', 'facial', 'nails', 'lash', 'makeup', 'solarium'],
  'nails': ['manicure', 'pedicure', 'nail-salon', 'beauty'],
  'lash': ['eyelash', 'extensions', 'beauty'],
  'makeup': ['artist', 'bridal', 'beauty', 'cosmetics'],
  'interior': ['design', 'decoration', 'furniture', 'interiors'],
  'design': ['interior', 'decoration', 'architect'],
  'catering': ['private-chef', 'event', 'party', 'wedding'],
  'chef': ['catering', 'private', 'cooking', 'personal'],
  'wine': ['deli', 'gourmet', 'fine-food', 'sommelier'],
  'deli': ['delicatessen', 'gourmet', 'fine-food', 'wine'],
  'emergency': ['police', 'fire', 'ambulance', 'hospital', '112'],
  'police': ['emergency', 'guardia', 'policia', 'safety'],
  'fire': ['bomberos', 'emergency', 'brigade'],
  'indian': ['curry', 'tandoori', 'masala', 'biryani'],
  'thai': ['asian', 'pad-thai', 'curry', 'oriental'],
  'chinese': ['asian', 'oriental', 'dim-sum', 'wok'],
  'german': ['bratwurst', 'schnitzel', 'bier', 'feinkost'],
};

function scoreResult(listing: Listing, terms: string[]): number {
  let score = 0;
  const name = listing.name.toLowerCase();
  const desc = (listing.description || '').toLowerCase();
  const catName = listing.categories.name.toLowerCase();
  const tags = (listing.tags || []).map(t => t.toLowerCase());
  const neighborhood = (listing.neighborhood || '').toLowerCase();

  for (const term of terms) {
    if (name.includes(term)) score += 10;
    if (catName.includes(term)) score += 6;
    if (tags.some(t => t.includes(term))) score += 5;
    if (neighborhood.includes(term)) score += 4;
    if (desc.includes(term)) score += 2;

    const synonyms = SEARCH_SYNONYMS[term] || [];
    for (const syn of synonyms) {
      if (name.includes(syn)) score += 4;
      if (catName.includes(syn)) score += 3;
      if (tags.some(t => t.includes(syn))) score += 3;
      if (desc.includes(syn)) score += 1;
    }
  }

  if (listing.is_featured) score += 2;

  return score;
}

export function DiscoverContent({ categories, listings, neighborhoods }: DiscoverContentProps) {
  const [query, setQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

  const isSearching = query.length >= 2 || selectedNeighborhood !== null;

  const filteredListings = useMemo(() => {
    if (!isSearching) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);

    const scored = listings
      .map((listing) => {
        const matchesNeighborhood =
          !selectedNeighborhood || listing.neighborhood === selectedNeighborhood;
        if (!matchesNeighborhood) return null;

        if (terms.length === 0) return { listing, score: listing.is_featured ? 2 : 0 };

        const s = scoreResult(listing, terms);
        if (s <= 0) return null;
        return { listing, score: s };
      })
      .filter(Boolean) as { listing: Listing; score: number }[];

    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.listing);
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
        <DiscoverCategories categories={categories} />
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
            <Link
              href={`/discover/listing/${listing.id}`}
              className="text-[17px] font-semibold text-foreground leading-snug hover:text-ocean-500 transition-colors"
            >
              {listing.name}
            </Link>
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
