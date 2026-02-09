'use client';

import Link from 'next/link';
import {
  Home as HomeIcon,
  Building,
  Briefcase,
  UtensilsCrossed,
  Umbrella,
  Salad,
  Flag,
  CircleDot,
  Ship,
  Sparkles,
  Dumbbell,
  Car,
  ShoppingBag,
  Scissors,
  Leaf,
  Smile,
  Eye,
  Baby,
  ShieldCheck,
  Coffee,
  Globe,
  ShoppingCart,
  Pill,
  Shirt,
  School,
  Languages,
  Scale,
  Calculator,
  Flower2,
  Hammer,
  Waves,
  ChevronRight,
  Folder,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  home: HomeIcon,
  building: Building,
  briefcase: Briefcase,
  'chef-hat': UtensilsCrossed,
  'utensils-crossed': UtensilsCrossed,
  umbrella: Umbrella,
  salad: Salad,
  flag: Flag,
  'circle-dot': CircleDot,
  ship: Ship,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  car: Car,
  'shopping-bag': ShoppingBag,
  scissors: Scissors,
  leaf: Leaf,
  smile: Smile,
  eye: Eye,
  baby: Baby,
  'shield-check': ShieldCheck,
  coffee: Coffee,
  globe: Globe,
  'shopping-cart': ShoppingCart,
  pill: Pill,
  shirt: Shirt,
  school: School,
  languages: Languages,
  scale: Scale,
  calculator: Calculator,
  flower: Flower2,
  sparkle: Sparkles,
  hammer: Hammer,
  waves: Waves,
};

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
}

export function SubCategoryList({
  subCategories,
  parentSlug,
}: {
  subCategories: SubCategory[];
  parentSlug: string;
}) {
  return (
    <div className="space-y-3">
      {subCategories.map((sub) => {
        const Icon = iconMap[sub.icon_name] || Folder;
        return (
          <Link
            key={sub.id}
            href={`/lifestyle/${parentSlug}/${sub.slug}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-cream-200 hover:shadow-md hover:border-sage-300 transition-all min-h-[64px]"
          >
            <div className="w-10 h-10 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-sage-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-body font-semibold text-foreground">
                {sub.name}
              </h3>
              <p className="text-body-sm text-muted-foreground truncate">
                {sub.description}
              </p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
