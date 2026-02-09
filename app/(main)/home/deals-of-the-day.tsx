'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Tag, Clock, ChevronRight, Sparkles } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  description: string;
  discount_text: string;
  valid_until: string;
  category: string;
  image_url: string;
  listing_id: string | null;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Expiring soon';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function DealsOfTheDay({ deals }: { deals: Deal[] }) {
  if (!deals.length) return null;

  return (
    <section className="py-6" aria-label="Deals of the Day">
      <div className="px-5 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ocean-500 to-ocean-400 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-heading-sm font-semibold text-foreground leading-tight">
              Deals of the Day
            </h2>
            <p className="text-[13px] text-muted-foreground">Fresh offers, updated daily</p>
          </div>
        </div>
        <Link
          href="/deals"
          className="flex items-center gap-1 text-[14px] font-semibold text-ocean-500 hover:text-ocean-400 transition-colors"
        >
          See all
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
        {deals.map((deal, i) => (
          <Link
            key={deal.id}
            href={deal.listing_id ? `/discover/listing/${deal.listing_id}` : '/deals'}
            className="flex-shrink-0 w-[260px] bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 hover:shadow-md transition-all group"
            style={{ animation: `fade-in 0.4s ease-out ${i * 0.08}s forwards`, opacity: 0 }}
          >
            <div className="relative h-32 w-full bg-cream-100">
              {deal.image_url && (
                <Image
                  src={deal.image_url}
                  alt={deal.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="260px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute top-2.5 left-2.5 text-[12px] font-bold px-2.5 py-1 rounded-full bg-ocean-500 text-white shadow-md">
                {deal.discount_text}
              </span>
              <span className="absolute bottom-2.5 left-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-foreground backdrop-blur-sm">
                {deal.category}
              </span>
            </div>
            <div className="p-3.5">
              <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-ocean-600 transition-colors">
                {deal.title}
              </h3>
              <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {deal.description}
              </p>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-cream-100">
                <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                  <Clock size={11} />
                  {daysUntil(deal.valid_until)}
                </span>
                <span className="flex items-center gap-0.5 text-[12px] font-semibold text-ocean-500">
                  View deal
                  <ChevronRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        ))}

        <Link
          href="/deals"
          className="flex-shrink-0 w-[120px] rounded-xl border-2 border-dashed border-cream-300 flex flex-col items-center justify-center gap-2 hover:border-ocean-300 hover:bg-ocean-50/50 transition-all group"
        >
          <Tag size={24} className="text-muted-foreground group-hover:text-ocean-500 transition-colors" />
          <span className="text-[13px] font-semibold text-muted-foreground group-hover:text-ocean-500 transition-colors">
            All Deals
          </span>
        </Link>
      </div>
    </section>
  );
}
