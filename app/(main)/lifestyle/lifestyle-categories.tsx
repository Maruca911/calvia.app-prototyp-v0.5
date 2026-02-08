'use client';

import Link from 'next/link';
import {
  Building2,
  Utensils,
  Compass,
  Coffee,
  HeartPulse,
  ChevronRight,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'building-2': Building2,
  utensils: Utensils,
  compass: Compass,
  coffee: Coffee,
  'heart-pulse': HeartPulse,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
}

export function LifestyleCategories({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon_name] || Compass;
        return (
          <Link
            key={cat.id}
            href={`/lifestyle/${cat.slug}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-cream-200 hover:shadow-md hover:border-sage-300 transition-all min-h-[72px]"
          >
            <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
              <Icon size={22} className="text-sage-600" />
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
