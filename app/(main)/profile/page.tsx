'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthForm } from './auth-form';
import { ProfileView } from './profile-view';
import { CalviaLogo } from '@/components/calvia-logo';
import { Heart, Trophy, ScanLine, Share2, Bell, Lock, Gift } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="px-5 py-6 animate-fade-in">
        <div className="h-20 bg-cream-200 rounded-xl animate-pulse mb-4" />
        <div className="h-48 bg-cream-200 rounded-xl animate-pulse mb-4" />
        <div className="h-32 bg-cream-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="px-5 py-6 animate-fade-in">
        <ProfileView user={user} />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 animate-fade-in">
      <GuestProfileView />
    </div>
  );
}

function GuestProfileView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-cream-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-ocean-500 flex items-center justify-center">
          <CalviaLogo size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[19px] font-semibold text-foreground">
            Guest Explorer
          </h2>
          <p className="text-body text-muted-foreground">
            Create an account to unlock all features
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <ScanLine size={20} className="text-sage-500" />
          Store Check-in
        </h3>
        <div className="relative p-5 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[13px] font-medium text-muted-foreground bg-cream-200 px-2.5 py-0.5 rounded-full z-10">
            <Lock size={10} />
            Sign up to unlock
          </div>
          <div className="space-y-4 opacity-50">
            <div className="flex flex-col items-center py-4">
              <div className="w-36 h-36 bg-cream-200 rounded-2xl flex items-center justify-center">
                <ScanLine size={48} className="text-cream-400" />
              </div>
              <p className="text-[14px] text-muted-foreground mt-3">
                Your personal QR code for store visits
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <Trophy size={20} className="text-sage-500" />
          Loyalty Program
        </h3>
        <div className="relative p-5 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[13px] font-medium text-muted-foreground bg-cream-200 px-2.5 py-0.5 rounded-full z-10">
            <Lock size={10} />
            Sign up to unlock
          </div>
          <div className="space-y-4 opacity-50">
            <div className="flex items-center justify-between">
              <span className="text-body font-semibold text-ocean-500">
                Silver Member
              </span>
              <span className="text-body text-muted-foreground">
                0 pts
              </span>
            </div>
            <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full w-0" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Silver - 5%', 'Gold - 10%', 'Platinum - 15%'].map((tier) => (
                <div key={tier} className="text-center p-2 bg-cream-50 rounded-lg">
                  <Gift size={14} className="mx-auto text-muted-foreground mb-1" />
                  <p className="text-[11px] text-muted-foreground">{tier}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <Heart size={20} className="text-sage-500" />
          My Favourites
        </h3>
        <div className="p-6 bg-white rounded-xl border border-cream-200 text-center">
          <p className="text-body text-muted-foreground">
            No favourites yet. Explore Discover to save your top picks.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
          <Share2 size={20} className="text-sage-500" />
          Refer a Friend
        </h3>
        <div className="relative p-5 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[13px] font-medium text-muted-foreground bg-cream-200 px-2.5 py-0.5 rounded-full z-10">
            <Lock size={10} />
            Sign up to unlock
          </div>
          <div className="opacity-50">
            <p className="text-body text-muted-foreground">
              Share your code and earn rewards when friends join Calvia.
            </p>
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
          <div className="space-y-5 opacity-50">
            {[
              { label: 'Morning Briefing' },
              { label: 'Booking Reminders' },
              { label: 'New Listings' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-body text-foreground">{item.label}</span>
                <Switch disabled />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pt-2">
        <AuthForm />
      </div>
    </div>
  );
}
