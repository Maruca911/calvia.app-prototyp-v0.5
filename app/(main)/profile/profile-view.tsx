'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { QRCodeCard } from '@/components/qr-code-card';
import { LoyaltyTierCard } from '@/components/loyalty-tier-card';
import Link from 'next/link';
import {
  LogOut,
  Heart,
  Trophy,
  Share2,
  Bell,
  Copy,
  Lock,
  MapPin,
  Trash2,
  ScanLine,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  full_name: string;
  referral_code: string;
  loyalty_tier: string;
  loyalty_points: number;
  qr_token: string;
  notification_settings: {
    morning_briefing: boolean;
    booking_reminders: boolean;
    new_listings: boolean;
  };
}

interface FavoriteListing {
  id: string;
  listing_id: string;
  listings: {
    id: string;
    name: string;
    address: string;
    description: string;
  };
}

export function ProfileView({ user }: { user: User }) {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [visitCount, setVisitCount] = useState(0);

  const loadProfile = useCallback(async () => {
    const { data } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  }, [user.id]);

  const loadFavorites = useCallback(async () => {
    const { data } = await getSupabase()
      .from('favorites')
      .select('id, listing_id, listings(id, name, address, description)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setFavorites(data as unknown as FavoriteListing[]);
  }, [user.id]);

  const loadVisitCount = useCallback(async () => {
    const { count } = await getSupabase()
      .from('store_visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setVisitCount(count || 0);
  }, [user.id]);

  useEffect(() => {
    loadProfile();
    loadFavorites();
    loadVisitCount();
  }, [loadProfile, loadFavorites, loadVisitCount]);

  const removeFavorite = async (favoriteId: string) => {
    await getSupabase().from('favorites').delete().eq('id', favoriteId);
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    toast('Removed from favorites');
  };

  const copyReferral = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success('Referral code copied!');
    }
  };

  const shareReferral = async () => {
    if (profile?.referral_code && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Calvia',
          text: `Use my referral code ${profile.referral_code} to join Calvia, the premium concierge app for Mallorca.`,
          url: 'https://calvia.app',
        });
      } catch {
        copyReferral();
      }
    } else {
      copyReferral();
    }
  };

  const initials = (profile?.full_name || user.email || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-cream-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-ocean-500 flex items-center justify-center text-sage-100 font-semibold text-heading-sm">
          {initials || 'C'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[19px] font-semibold text-foreground truncate">
            {profile?.full_name || 'Calvia Member'}
          </h2>
          <p className="text-body text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <ScanLine size={20} className="text-sage-500" />
          Store Check-in
        </h3>
        {profile?.qr_token && (
          <QRCodeCard
            qrToken={profile.qr_token}
            userName={profile.full_name || 'Calvia Member'}
          />
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <Trophy size={20} className="text-sage-500" />
          Loyalty Program
        </h3>
        <LoyaltyTierCard
          tier={profile?.loyalty_tier || 'Silver'}
          points={profile?.loyalty_points || 0}
          visitCount={visitCount}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <Heart size={20} className="text-sage-500" />
          My Favourites
        </h3>
        {favorites.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-cream-200 text-center">
            <p className="text-body text-muted-foreground">
              No favourites yet. Explore Discover to save your top picks.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-cream-200 hover:shadow-sm transition-shadow"
              >
                <Link
                  href={`/discover/listing/${fav.listing_id}`}
                  className="flex-1 min-w-0 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-foreground truncate hover:text-ocean-500 transition-colors">
                      {fav.listings?.name}
                    </p>
                    {fav.listings?.address && (
                      <p className="text-[15px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <MapPin size={13} />
                        <span className="truncate">{fav.listings.address}</span>
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                </Link>
                <button
                  onClick={() => removeFavorite(fav.id)}
                  className="p-3 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <Share2 size={20} className="text-sage-500" />
          Refer a Friend
        </h3>
        <div className="p-5 bg-white rounded-xl border border-cream-200 shadow-sm">
          <p className="text-body text-muted-foreground mb-4">
            Share your code and earn rewards when friends join Calvia.
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex-1 bg-cream-100 rounded-lg px-4 py-3.5 font-mono text-body font-semibold text-ocean-500 tracking-wider text-center">
              {profile?.referral_code || '...'}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyReferral}
              className="border-cream-300"
            >
              <Copy size={18} />
            </Button>
            <Button onClick={shareReferral}>
              Share
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <Bell size={20} className="text-sage-500" />
          Notifications
        </h3>
        <div className="relative p-5 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[13px] font-medium text-muted-foreground bg-cream-200 px-2.5 py-0.5 rounded-full z-10">
            <Lock size={10} />
            Coming Soon
          </div>
          <div className="space-y-5 opacity-60">
            {[
              { label: 'Morning Briefing', key: 'morning_briefing' },
              { label: 'Booking Reminders', key: 'booking_reminders' },
              { label: 'New Listings', key: 'new_listings' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-body text-foreground">{item.label}</span>
                <Switch disabled />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Button
        onClick={signOut}
        variant="outline"
        className="w-full border-cream-300 text-muted-foreground hover:text-destructive hover:border-destructive/30"
      >
        <LogOut size={18} className="mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
