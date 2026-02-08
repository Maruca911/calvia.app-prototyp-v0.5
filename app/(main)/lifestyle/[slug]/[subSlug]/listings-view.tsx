'use client';

import { useState } from 'react';
import { Phone, Globe, MapPin, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
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
      await getSupabase()
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listing.id);
      setFavorited(false);
      toast('Removed from favorites');
    } else {
      await getSupabase()
        .from('favorites')
        .insert({ user_id: user.id, listing_id: listing.id });
      setFavorited(true);
      toast('Saved to favorites');
    }
    setSaving(false);
  };

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
        </div>
        <button
          onClick={toggleFavorite}
          disabled={saving}
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

      {listing.address && (
        <div className="flex items-center gap-2 text-body text-muted-foreground">
          <MapPin size={16} className="text-sage-500 flex-shrink-0" />
          <span>{listing.address}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        {listing.contact_phone && (
          <Button
            asChild
            size="sm"
          >
            <a href={`tel:${listing.contact_phone}`}>
              <Phone size={16} className="mr-2" />
              Call
            </a>
          </Button>
        )}
        {listing.website_url && (
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
      </div>
    </div>
  );
}
