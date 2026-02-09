'use client';

import { useState } from 'react';
import { Phone, Globe, MapPin, Star, Heart, Instagram, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
}

export function ListingsView({ listings }: { listings: Listing[] }) {
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
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const [favorited, setFavorited] = useState(false);

  const toggleFavorite = () => {
    setFavorited(!favorited);
    toast(favorited ? 'Removed from favorites' : 'Saved to favorites');
  };

  const instagram = listing.social_media?.instagram;
  const hasWebsite = listing.website_url && listing.website_url.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-cream-200 p-5 space-y-3.5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[19px] font-semibold text-foreground leading-snug">
              {listing.name}
            </h3>
            {listing.is_featured && (
              <span className="inline-flex items-center gap-0.5 text-[13px] font-medium text-ocean-500 bg-ocean-50 px-2.5 py-0.5 rounded-full flex-shrink-0">
                <Star size={11} fill="currentColor" />
                Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {listing.neighborhood && (
              <span className="text-[14px] text-muted-foreground flex items-center gap-1">
                <MapPin size={13} className="text-sage-500" />
                {listing.neighborhood}
              </span>
            )}
            {listing.price_range && (
              <span className="text-[14px] font-medium text-sage-600">
                {listing.price_range}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleFavorite}
          className="flex-shrink-0 p-3 -m-3 text-muted-foreground hover:text-ocean-500 transition-colors"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={24}
            fill={favorited ? '#003366' : 'none'}
            className={favorited ? 'text-ocean-500' : ''}
          />
        </button>
      </div>

      <p className="text-body text-muted-foreground leading-relaxed">
        {listing.description}
      </p>

      {listing.address && !listing.neighborhood && (
        <div className="flex items-center gap-2 text-body text-muted-foreground">
          <MapPin size={16} className="text-sage-500 flex-shrink-0" />
          <span>{listing.address}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 pt-1">
        {listing.contact_phone && (
          <Button asChild size="sm">
            <a href={`tel:${listing.contact_phone}`}>
              <Phone size={16} className="mr-2" />
              Call
            </a>
          </Button>
        )}
        {hasWebsite && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-ocean-200 text-ocean-500 hover:bg-ocean-50"
          >
            <a href={listing.website_url} target="_blank" rel="noopener noreferrer">
              <Globe size={16} className="mr-2" />
              Website
            </a>
          </Button>
        )}
        {!hasWebsite && instagram && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-sage-200 text-sage-600 hover:bg-sage-50"
          >
            <a href={instagram} target="_blank" rel="noopener noreferrer">
              <Instagram size={16} className="mr-2" />
              Instagram
            </a>
          </Button>
        )}
        {listing.menu_url && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-cream-300 text-foreground hover:bg-cream-100"
          >
            <a href={listing.menu_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} className="mr-2" />
              Menu
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
