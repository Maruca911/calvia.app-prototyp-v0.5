'use client';

import Link from 'next/link';
import { Tag, Trophy, Heart, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: Tag,
    title: 'Exclusive Deals',
    description: 'Discounts at local shops and invite-only events, available only to Calvia members.',
    href: '/discover',
    accent: 'bg-ocean-50 text-ocean-500',
  },
  {
    icon: Trophy,
    title: 'Loyalty Program',
    description: 'Every time you use the app and support the local economy, you earn points to unlock new benefits and special offers.',
    href: '/profile',
    accent: 'bg-sage-50 text-sage-600',
  },
  {
    icon: Heart,
    title: 'Your Favourites',
    description: 'All your favourite shops in Calvia, just 2 clicks away. Save anything and find it instantly.',
    href: '/profile',
    accent: 'bg-ocean-50 text-ocean-500',
  },
];

export function FeatureCards() {
  return (
    <section className="px-5 py-6" aria-label="Member benefits">
      <h2 className="text-heading font-semibold text-foreground mb-5">
        Why Calvia Members Love It
      </h2>
      <div className="space-y-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm border border-cream-200 hover:shadow-md hover:border-sage-300 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.accent} flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[19px] font-semibold text-foreground leading-snug">
                  {feature.title}
                </h3>
                <p className="text-[16px] leading-relaxed text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground flex-shrink-0 mt-1" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
