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

const accentMap: Record<string, string> = {
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
  icon_name: string;
  description: string;
}

export function CategoryQuickAccess({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <section className="px-5 -mt-6 relative z-10" aria-label="Browse service categories">
      <div className="grid grid-cols-2 gap-3" role="list">
        {categories.map((cat, i) => {
          const Icon = iconMap[cat.icon_name] || Compass;
          const accent = accentMap[cat.slug] || 'bg-sage-50 text-sage-600';
          return (
            <Link
              key={cat.id}
              href={`/discover/${cat.slug}`}
              className="flex flex-col items-center gap-2.5 p-5 bg-white rounded-xl shadow-sm border border-cream-200 hover:shadow-md hover:border-sage-300 transition-all min-h-[100px] justify-center"
              style={{ animation: `fade-in 0.4s ease-out ${i * 0.06}s forwards`, opacity: 0 }}
            >
              <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center`}>
                <Icon size={20} />
              </div>
              <span className="text-body-sm font-semibold text-foreground text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-ocean-500 hover:text-ocean-400 transition-colors"
        >
          Explore all services
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
