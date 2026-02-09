'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tag, Clock, ChevronRight } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  description: string;
  discount_text: string;
  valid_until: string;
  category: string;
  image_url: string;
}

const CATEGORIES = ['All', 'Dining', 'Wellness', 'Activities', 'Shopping', 'Beauty', 'Home Services', 'Professional'];

export function DealsContent({ deals }: { deals: Deal[] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? deals
    : deals.filter(d => d.category === activeCategory);

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expiring soon';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <div className="px-5 py-6 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={22} className="text-ocean-500" />
          <h1 className="text-heading-lg font-semibold text-foreground">Exclusive Deals</h1>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Special offers for Calvia members. Show your app to redeem.
        </p>
      </div>

      <nav className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-ocean-500 text-white shadow-sm'
                : 'bg-white text-muted-foreground border border-cream-300 hover:border-sage-300 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-body-sm text-muted-foreground">No deals in this category right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((deal, i) => (
            <div
              key={deal.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 hover:shadow-md transition-shadow"
              style={{ animation: `fade-in 0.4s ease-out ${i * 0.06}s forwards`, opacity: 0 }}
            >
              <div className="relative h-40 w-full bg-cream-100">
                {deal.image_url && (
                  <Image
                    src={deal.image_url}
                    alt={deal.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 512px) 100vw, 512px"
                  />
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-ocean-500 text-white shadow-md">
                    {deal.discount_text}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-foreground backdrop-blur-sm">
                    {deal.category}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-heading-sm font-semibold text-foreground leading-snug">
                  {deal.title}
                </h3>
                <p className="text-body-sm text-muted-foreground line-clamp-2">
                  {deal.description}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Clock size={13} />
                    <span>{daysUntil(deal.valid_until)}</span>
                  </div>
                  <span className="text-[13px] font-medium text-ocean-500 flex items-center gap-0.5">
                    Details
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
