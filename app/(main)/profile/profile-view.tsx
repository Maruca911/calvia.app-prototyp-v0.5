'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  full_name: string;
  referral_code: string;
  loyalty_tier: string;
  loyalty_points: number;
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

  const loadProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  }, [user.id]);

  const loadFavorites = useCallback(async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id, listing_id, listings(id, name, address, description)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setFavorites(data as unknown as FavoriteListing[]);
  }, [user.id]);

  useEffect(() => {
    loadProfile();
    loadFavorites();
  }, [loadProfile, loadFavorites]);

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from('favorites').delete().eq('id', favoriteId);
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
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-cream-200 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-ocean-500 flex items-center justify-center text-white font-semibold text-body">
          {initials || 'C'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-body font-semibold text-foreground truncate">
            {profile?.full_name || 'Calvia Member'}
          </h2>
          <p className="text-body-sm text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-body font-semibold text-foreground flex items-center gap-2">
          <Heart size={18} className="text-sage-500" />
          My Favorites
        </h3>
        {favorites.length === 0 ? (
          <div className="p-5 bg-white rounded-xl border border-cream-200 text-center">
            <p className="text-body-sm text-muted-foreground">
              No favorites yet. Explore Lifestyle to save your top picks.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-cream-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-foreground truncate">
                    {fav.listings?.name}
                  </p>
                  {fav.listings?.address && (
                    <p className="text-[13px] text-muted-foreground flex items-center gap-1">
                      <MapPin size={11} />
                      {fav.listings.address}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeFavorite(fav.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-body font-semibold text-foreground flex items-center gap-2">
          <Trophy size={18} className="text-sage-500" />
          Loyalty Program
        </h3>
        <div className="relative p-5 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-cream-200 px-2 py-0.5 rounded-full z-10">
            <Lock size={9} />
            Coming Soon
          </div>
          <div className="space-y-4 opacity-60">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-semibold text-ocean-500">
                {profile?.loyalty_tier || 'Silver'} Member
              </span>
              <span className="text-body-sm text-muted-foreground">
                {profile?.loyalty_points || 0} pts
              </span>
            </div>
            <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sage-400 to-sage-300 rounded-full w-1/4" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              750 points to Gold status
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-body font-semibold text-foreground flex items-center gap-2">
          <Share2 size={18} className="text-sage-500" />
          Refer a Friend
        </h3>
        <div className="p-5 bg-white rounded-xl border border-cream-200 shadow-sm">
          <p className="text-body-sm text-muted-foreground mb-3">
            Share your code and earn rewards when friends join Calvia.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-cream-100 rounded-lg px-4 py-3 font-mono text-body-sm font-semibold text-ocean-500 tracking-wider text-center">
              {profile?.referral_code || '...'}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyReferral}
              className="min-h-[48px] min-w-[48px] border-cream-300"
            >
              <Copy size={16} />
            </Button>
            <Button
              onClick={shareReferral}
              className="bg-ocean-500 hover:bg-ocean-600 text-white min-h-[48px] px-4 text-body-sm"
            >
              Share
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-body font-semibold text-foreground flex items-center gap-2">
          <Bell size={18} className="text-sage-500" />
          Notifications
        </h3>
        <div className="relative p-5 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-cream-200 px-2 py-0.5 rounded-full z-10">
            <Lock size={9} />
            Coming Soon
          </div>
          <div className="space-y-4 opacity-60">
            {[
              { label: 'Morning Briefing', key: 'morning_briefing' },
              { label: 'Booking Reminders', key: 'booking_reminders' },
              { label: 'New Listings', key: 'new_listings' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-body-sm text-foreground">{item.label}</span>
                <Switch disabled />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Button
        onClick={signOut}
        variant="outline"
        className="w-full min-h-[52px] border-cream-300 text-muted-foreground hover:text-destructive hover:border-destructive/30 text-body-sm"
      >
        <LogOut size={16} className="mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
