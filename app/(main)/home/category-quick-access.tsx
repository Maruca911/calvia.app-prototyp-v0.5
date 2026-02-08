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
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  description: string;
}

export function CategoryQuickAccess({ categories }: { categories: Category[] }) {
  return (
    <section className="px-5 -mt-6 relative z-10">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat, i) => {
          const Icon = iconMap[cat.icon_name] || Compass;
          return (
            <Link
              key={cat.id}
              href={`/lifestyle/${cat.slug}`}
              className={`flex flex-col items-center gap-2.5 p-5 bg-white rounded-xl shadow-sm border border-cream-200 hover:shadow-md hover:border-sage-300 transition-all min-h-[100px] justify-center animate-fade-in-delay-${Math.min(i + 1, 3)}`}
            >
              <div className="w-11 h-11 rounded-full bg-sage-50 flex items-center justify-center">
                <Icon size={20} className="text-sage-600" />
              </div>
              <span className="text-body-sm font-semibold text-foreground text-center">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <Link
          href="/lifestyle"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-ocean-500 hover:text-ocean-400 transition-colors"
        >
          Explore all services
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
