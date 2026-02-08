'use client';

import { useState } from 'react';
import { Phone, Globe, MapPin, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Listing {
  id: string;
  name: string;
  description: string;
  contact_phone: string;
  contact_email: string;
  website_url: string;
  address: string;
  is_featured: boolean;
}

export function ListingsView({ listings }: { listings: Listing[] }) {
  if (!listings.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-body-sm">
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
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleFavorite = async () => {
    if (!user) {
      toast('Sign in to save favorites', {
        description: 'Create an account from the Profile tab.',
      });
      return;
    }

    setSaving(true);
    if (favorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listing.id);
      setFavorited(false);
      toast('Removed from favorites');
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, listing_id: listing.id });
      setFavorited(true);
      toast('Saved to favorites');
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-cream-200 p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-body font-semibold text-foreground">
              {listing.name}
            </h3>
            {listing.is_featured && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-ocean-500 bg-ocean-50 px-2 py-0.5 rounded-full flex-shrink-0">
                <Star size={10} fill="currentColor" />
                Featured
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleFavorite}
          disabled={saving}
          className="flex-shrink-0 p-2 -m-2 text-muted-foreground hover:text-ocean-500 transition-colors"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={20}
            fill={favorited ? '#003366' : 'none'}
            className={favorited ? 'text-ocean-500' : ''}
          />
        </button>
      </div>

      <p className="text-body-sm text-muted-foreground leading-relaxed">
        {listing.description}
      </p>

      {listing.address && (
        <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
          <MapPin size={14} className="text-sage-500 flex-shrink-0" />
          <span>{listing.address}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {listing.contact_phone && (
          <Button
            asChild
            size="sm"
            className="bg-ocean-500 hover:bg-ocean-600 text-white min-h-[44px] text-body-sm"
          >
            <a href={`tel:${listing.contact_phone}`}>
              <Phone size={14} className="mr-1.5" />
              Call
            </a>
          </Button>
        )}
        {listing.website_url && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-ocean-200 text-ocean-500 hover:bg-ocean-50 min-h-[44px] text-body-sm"
          >
            <a href={listing.website_url} target="_blank" rel="noopener noreferrer">
              <Globe size={14} className="mr-1.5" />
              Website
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
