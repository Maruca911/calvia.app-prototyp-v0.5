'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Phone,
  Globe,
  Instagram,
  ExternalLink,
  MapPin,
  Star,
  Heart,
  Mail,
  ChevronRight,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { buildBookingSupportMessage, buildSupportWhatsAppUrl } from '@/lib/support';
import { toast } from 'sonner';
import { ReviewSection } from './review-section';

interface ListingCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string;
  parent: { slug: string; name: string } | null;
}

interface ListingData {
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
  tags: string[] | null;
  categories: ListingCategory;
}

interface RelatedListing {
  id: string;
  name: string;
  neighborhood: string;
  price_range: string;
  is_featured: boolean;
}

function normalizeExternalUrl(url?: string | null) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function normalizeInstagramUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('@')) return `https://instagram.com/${url.slice(1)}`;
  return normalizeExternalUrl(url);
}

function toServiceType(slug?: string | null) {
  if (!slug) return 'restaurant';
  return slug.replace(/-/g, ' ');
}

export function ListingDetail({
  listing,
  relatedListings,
}: {
  listing: ListingData;
  relatedListings: RelatedListing[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);

  const checkFavorite = useCallback(async () => {
    if (!user) return;
    const { data } = await getSupabase()
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listing.id)
      .maybeSingle();
    setIsFavorited(!!data);
  }, [user, listing.id]);

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  const toggleFavorite = async () => {
    if (!user) {
      toast('Sign in to save favorites', { description: 'Go to Profile to create an account.' });
      return;
    }

    if (isFavorited) {
      setIsFavorited(false);
      await getSupabase()
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listing.id);
      toast('Removed from favorites');
    } else {
      setIsFavorited(true);
      await getSupabase()
        .from('favorites')
        .insert({ user_id: user.id, listing_id: listing.id });
      toast('Saved to favorites');
    }
  };

  const shareListing = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.name, url });
      } catch {
        navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  const instagram = normalizeInstagramUrl(listing.social_media?.instagram);
  const websiteUrl = normalizeExternalUrl(listing.website_url);
  const hasWebsite = websiteUrl.length > 0;
  const parentSlug = listing.categories.parent?.slug;
  const parentName = listing.categories.parent?.name;
  const backHref = parentSlug
    ? `/discover/${parentSlug}/${listing.categories.slug}`
    : '/discover';
  const bookingHref = `/bookings?${new URLSearchParams({
    listingId: listing.id,
    business: listing.name,
    service: toServiceType(listing.categories.slug),
  }).toString()}`;
  const supportWhatsAppUrl = buildSupportWhatsAppUrl(
    buildBookingSupportMessage({
      businessName: listing.name,
      serviceType: toServiceType(listing.categories.slug),
      source: 'listing-detail',
    })
  );

  return (
    <div className="animate-fade-in pb-8">
      <div className="px-5 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-ocean-500 font-medium text-body-sm hover:text-ocean-400 transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div className="relative bg-gradient-to-br from-ocean-500 via-ocean-400 to-sage-400 px-5 py-8 mx-5 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-6 w-32 h-32 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-2 left-4 w-24 h-24 rounded-full bg-sage-200 blur-2xl" />
        </div>
        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              {listing.is_featured && (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">
                  <Star size={11} fill="currentColor" />
                  Featured
                </span>
              )}
              <h1 className="text-heading-lg text-white leading-tight">
                {listing.name}
              </h1>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={toggleFavorite}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Heart
                  size={20}
                  fill={isFavorited ? '#fff' : 'none'}
                  className="text-white"
                />
              </button>
              <button
                onClick={shareListing}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Share2 size={18} className="text-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {listing.neighborhood && (
              <span className="inline-flex items-center gap-1 text-[13px] text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <MapPin size={12} />
                {listing.neighborhood}
              </span>
            )}
            {listing.price_range && (
              <span className="text-[13px] text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {listing.price_range}
              </span>
            )}
            <span className="text-[13px] text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {listing.categories.name}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <span
                key={tag}
                className="text-[13px] font-medium px-3 py-1 rounded-full bg-sage-50 text-sage-700 border border-sage-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div>
          <h2 className="text-heading-sm font-semibold text-foreground mb-2">About</h2>
          <p className="text-body-sm text-foreground/80 leading-relaxed">
            {listing.description}
          </p>
        </div>

        <section className="rounded-xl border border-ocean-200 bg-ocean-50/50 p-4">
          <h2 className="text-body font-semibold text-foreground mb-1">
            Book this business with Calvia
          </h2>
          <p className="text-body-sm text-muted-foreground mb-3">
            Start a prefilled booking request in seconds.
          </p>
          <Button asChild className="w-full h-11">
            <Link href={bookingHref}>
              <CalendarDays size={17} className="mr-2" />
              Book now
            </Link>
          </Button>
          <p className="text-[12px] text-muted-foreground mt-2">
            Premium membership unlocks direct booking requests.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {listing.contact_phone && (
              <Button asChild variant="outline" className="border-ocean-200 text-ocean-600 hover:bg-ocean-50">
                <a href={`tel:${listing.contact_phone}`}>
                  <Phone size={16} className="mr-2" />
                  Call restaurant
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50">
              <a href={supportWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} className="mr-2" />
                WhatsApp support
              </a>
            </Button>
          </div>
        </section>

        {listing.address && (
          <div className="flex items-start gap-3 p-4 bg-cream-50 rounded-xl border border-cream-200">
            <MapPin size={18} className="text-sage-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm font-medium text-foreground">{listing.address}</p>
              {listing.neighborhood && (
                <p className="text-[14px] text-muted-foreground mt-0.5">{listing.neighborhood}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-heading-sm font-semibold text-foreground">Get in Touch</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {listing.contact_phone && (
              <Button asChild className="h-12">
                <a href={`tel:${listing.contact_phone}`}>
                  <Phone size={18} className="mr-2" />
                  Call
                </a>
              </Button>
            )}
            {hasWebsite && (
              <Button
                asChild
                variant="outline"
                className="h-12 border-ocean-200 text-ocean-500 hover:bg-ocean-50"
              >
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Globe size={18} className="mr-2" />
                  Website
                </a>
              </Button>
            )}
            {instagram && (
              <Button
                asChild
                variant="outline"
                className="h-12 border-[#E1306C]/30 text-[#C13584] hover:bg-[#E1306C]/5"
              >
                <a href={instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram size={18} className="mr-2" />
                  Instagram
                </a>
              </Button>
            )}
            {listing.contact_email && (
              <Button
                asChild
                variant="outline"
                className="h-12 border-cream-300 text-foreground hover:bg-cream-100"
              >
                <a href={`mailto:${listing.contact_email}`}>
                  <Mail size={18} className="mr-2" />
                  Email
                </a>
              </Button>
            )}
            {listing.menu_url && (
              <Button
                asChild
                variant="outline"
                className="h-12 border-cream-300 text-foreground hover:bg-cream-100"
              >
                <a href={listing.menu_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={18} className="mr-2" />
                  Menu
                </a>
              </Button>
            )}
          </div>
        </div>

        <ReviewSection
          listingId={listing.id}
          listingName={listing.name}
          listingAddress={listing.address || listing.neighborhood}
        />

        <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground overflow-x-auto scrollbar-hide">
          <Link href="/discover" className="hover:text-ocean-500 transition-colors flex-shrink-0">
            Discover
          </Link>
          {parentName && parentSlug && (
            <>
              <ChevronRight size={12} className="flex-shrink-0" />
              <Link
                href={`/discover/${parentSlug}`}
                className="hover:text-ocean-500 transition-colors flex-shrink-0"
              >
                {parentName}
              </Link>
            </>
          )}
          <ChevronRight size={12} className="flex-shrink-0" />
          <Link
            href={backHref}
            className="hover:text-ocean-500 transition-colors flex-shrink-0"
          >
            {listing.categories.name}
          </Link>
          <ChevronRight size={12} className="flex-shrink-0" />
          <span className="text-foreground font-medium truncate">{listing.name}</span>
        </nav>

        {relatedListings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-heading-sm font-semibold text-foreground">
              More in {listing.categories.name}
            </h2>
            <div className="space-y-2">
              {relatedListings.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/discover/listing/${rel.id}`}
                  className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-cream-200 hover:shadow-sm hover:border-sage-300 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-semibold text-foreground truncate">
                        {rel.name}
                      </span>
                      {rel.is_featured && (
                        <Star size={12} className="text-ocean-500 flex-shrink-0" fill="currentColor" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {rel.neighborhood && (
                        <span className="text-[13px] text-muted-foreground flex items-center gap-1">
                          <MapPin size={11} />
                          {rel.neighborhood}
                        </span>
                      )}
                      {rel.price_range && (
                        <span className="text-[13px] text-sage-600 font-medium">
                          {rel.price_range}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
