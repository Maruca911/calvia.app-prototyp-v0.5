'use client';

import { AuthForm } from './auth-form';
import { CalviaLogo } from '@/components/calvia-logo';
import { Heart, Trophy, Share2, Bell, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ProfilePage() {
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
          <Trophy size={20} className="text-sage-500" />
          Loyalty Program
        </h3>
        <div className="relative p-5 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[13px] font-medium text-muted-foreground bg-cream-200 px-2.5 py-0.5 rounded-full z-10">
            <Lock size={10} />
            Coming Soon
          </div>
          <div className="space-y-4 opacity-60">
            <div className="flex items-center justify-between">
              <span className="text-body font-semibold text-ocean-500">
                Silver Member
              </span>
              <span className="text-body text-muted-foreground">
                0 pts
              </span>
            </div>
            <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sage-400 to-sage-300 rounded-full w-1/4" />
            </div>
            <p className="text-[15px] text-muted-foreground">
              750 points to Gold status
            </p>
          </div>
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
            Coming Soon
          </div>
          <div className="opacity-60">
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
          <div className="space-y-5 opacity-60">
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
    </div>
  );
}
