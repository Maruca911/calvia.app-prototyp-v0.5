'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import {
  Crown,
  Sun,
  CloudSun,
  Cloud,
  Wind,
  Newspaper,
  CalendarDays,
  Tag,
  ChevronRight,
  Lock,
  Thermometer,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface DigestData {
  digest_date: string;
  weather_summary: string;
  weather_temp_high: number;
  weather_temp_low: number;
  weather_icon: string;
  news_items: { title: string; source: string }[];
  featured_events: { title: string; date: string; location: string }[];
  premium_deals: { title: string; discount: string }[];
}

interface ProfileData {
  is_premium: boolean;
}

const WEATHER_ICONS: Record<string, typeof Sun> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  wind: Wind,
};

function WeatherCard({ digest }: { digest: DigestData }) {
  const IconComponent = WEATHER_ICONS[digest.weather_icon] || Sun;

  return (
    <div className="p-4 bg-gradient-to-br from-sky-50 to-ocean-50 rounded-xl border border-ocean-100">
      <div className="flex items-center gap-2 mb-3">
        <Thermometer size={16} className="text-ocean-500" />
        <h4 className="text-[15px] font-semibold text-foreground">Today in Calvia</h4>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
          <IconComponent size={28} className="text-ocean-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-foreground leading-none">{digest.weather_temp_high}°</span>
            <span className="text-[16px] text-muted-foreground">/ {digest.weather_temp_low}°</span>
          </div>
          <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{digest.weather_summary}</p>
        </div>
      </div>
    </div>
  );
}

function NewsCard({ items }: { items: { title: string; source: string }[] }) {
  if (!items.length) return null;

  return (
    <div className="p-4 bg-white rounded-xl border border-cream-200">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper size={16} className="text-ocean-500" />
        <h4 className="text-[15px] font-semibold text-foreground">Calvia News</h4>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className={`${i > 0 ? 'pt-3 border-t border-cream-100' : ''}`}>
            <p className="text-[14px] font-medium text-foreground leading-snug">{item.title}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{item.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsCard({ events }: { events: { title: string; date: string; location: string }[] }) {
  if (!events.length) return null;

  return (
    <div className="p-4 bg-white rounded-xl border border-cream-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-ocean-500" />
          <h4 className="text-[15px] font-semibold text-foreground">This Week</h4>
        </div>
        <Link href="/events" className="text-[13px] font-medium text-ocean-500 flex items-center gap-0.5">
          All events <ChevronRight size={12} />
        </Link>
      </div>
      <div className="space-y-2.5">
        {events.map((event, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-cream-50 hover:bg-cream-100 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-ocean-50 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={16} className="text-ocean-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-foreground leading-snug">{event.title}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {event.date} &middot; {event.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiumDealsCard({ deals }: { deals: { title: string; discount: string }[] }) {
  if (!deals.length) return null;

  return (
    <div className="p-4 bg-gradient-to-br from-ocean-50 to-sage-50 rounded-xl border border-ocean-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-ocean-500" />
          <h4 className="text-[15px] font-semibold text-foreground">Premium Deals</h4>
        </div>
        <Link href="/deals" className="text-[13px] font-medium text-ocean-500 flex items-center gap-0.5">
          View <ChevronRight size={12} />
        </Link>
      </div>
      <div className="space-y-2">
        {deals.map((deal, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/70">
            <span className="text-[14px] font-medium text-foreground">{deal.title}</span>
            <span className="text-[12px] font-bold text-ocean-500 bg-ocean-50 px-2.5 py-1 rounded-full">
              {deal.discount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiumPaywall() {
  const previewItems = [
    { icon: Sun, label: 'Daily Weather', description: 'Real-time Calvia forecast' },
    { icon: Newspaper, label: 'Local News', description: 'Calvia headlines every morning' },
    { icon: CalendarDays, label: 'Events Digest', description: "This week's biggest happenings" },
    { icon: Tag, label: 'Exclusive Deals', description: 'Premium-only discounts' },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-ocean-200 bg-gradient-to-br from-white via-ocean-50/30 to-sage-50/30">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-400 flex items-center justify-center">
            <Crown size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-foreground">Calvia Premium</h3>
            <p className="text-[14px] text-muted-foreground">Your daily briefing, delivered</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {previewItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="p-3 rounded-lg bg-white border border-cream-200">
                <Icon size={18} className="text-ocean-500 mb-1.5" />
                <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            );
          })}
        </div>

        <button
          disabled
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-ocean-500 text-white font-semibold text-[16px] opacity-80 cursor-not-allowed"
        >
          <Lock size={16} />
          Subscribe - Coming Soon
        </button>
        <p className="text-[12px] text-muted-foreground text-center mt-2">
          Premium plans starting soon. Stay tuned for weather, news, events and exclusive deals.
        </p>
      </div>
    </div>
  );
}

export function PremiumDigest() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkPremium = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await getSupabase()
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .maybeSingle();
    setIsPremium(data?.is_premium || false);
  }, [user]);

  const loadDigest = useCallback(async () => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const { data } = await getSupabase()
      .from('daily_digests')
      .select('*')
      .eq('digest_date', today)
      .maybeSingle();
    if (data) setDigest(data);
    setLoading(false);
  }, [isPremium]);

  useEffect(() => {
    checkPremium();
  }, [checkPremium]);

  useEffect(() => {
    if (isPremium) loadDigest();
  }, [isPremium, loadDigest]);

  if (loading) return null;

  if (!isPremium) {
    return (
      <section className="mt-7">
        <PremiumPaywall />
      </section>
    );
  }

  if (!digest) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <section className="mt-7">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ocean-500 to-ocean-400 flex items-center justify-center">
          <Crown size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-heading-sm font-semibold text-foreground leading-tight">
            Daily Briefing
          </h2>
          <p className="text-[13px] text-muted-foreground">{formatDate(digest.digest_date)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <WeatherCard digest={digest} />
        <NewsCard items={digest.news_items} />
        <EventsCard events={digest.featured_events} />
        <PremiumDealsCard deals={digest.premium_deals} />
      </div>
    </section>
  );
}
