'use client';

import Link from 'next/link';
import {
  Building2,
  Utensils,
  Compass,
  Coffee,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Briefcase,
  Wrench,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'building-2': Building2,
  utensils: Utensils,
  compass: Compass,
  coffee: Coffee,
  'heart-pulse': HeartPulse,
  'shopping-bag': ShoppingBag,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  wrench: Wrench,
  'shield-alert': ShieldAlert,
};

const accentColors: Record<string, string> = {
  'real-estate': 'bg-ocean-50 text-ocean-500',
  'dining': 'bg-amber-50 text-amber-600',
  'activities': 'bg-sky-50 text-sky-600',
  'daily-life': 'bg-sage-50 text-sage-600',
  'health-medical': 'bg-rose-50 text-rose-500',
  'shopping': 'bg-teal-50 text-teal-600',
  'education': 'bg-blue-50 text-blue-600',
  'professional-services': 'bg-slate-100 text-slate-600',
  'home-services': 'bg-orange-50 text-orange-600',
  'emergency-services': 'bg-red-50 text-red-600',
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
}

export function DiscoverCategories({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-2.5">
      {categories.map((cat, i) => {
        const Icon = iconMap[cat.icon_name] || Compass;
        const accent = accentColors[cat.slug] || 'bg-sage-50 text-sage-600';
        return (
          <Link
            key={cat.id}
            href={`/discover/${cat.slug}`}
            className={`flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-cream-200 hover:shadow-md hover:border-sage-300 transition-all min-h-[76px] animate-fade-in-delay-${Math.min(i + 1, 4)}`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className={`w-12 h-12 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-body font-semibold text-foreground">
                {cat.name}
              </h3>
              <p className="text-body-sm text-muted-foreground truncate">
                {cat.description}
              </p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
