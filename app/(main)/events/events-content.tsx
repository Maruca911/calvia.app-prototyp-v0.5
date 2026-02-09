'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CalendarDays, MapPin, Clock, Star } from 'lucide-react';

interface CalviaEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  end_date: string | null;
  category: string;
  image_url: string;
  is_featured: boolean;
}

const CATEGORIES = ['All', 'Markets', 'Music', 'Food & Drink', 'Sport', 'Culture', 'Entertainment', 'Family'];

export function EventsContent({ events }: { events: CalviaEvent[] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? events
    : events.filter(e => e.category === activeCategory);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  const featured = filtered.filter(e => e.is_featured);
  const upcoming = filtered.filter(e => !e.is_featured);

  return (
    <div className="px-5 py-6 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={22} className="text-ocean-500" />
          <h1 className="text-heading-lg font-semibold text-foreground">Events</h1>
        </div>
        <p className="text-body-sm text-muted-foreground">
          What's happening in Calvia and southwest Mallorca.
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
          <p className="text-body-sm text-muted-foreground">No events in this category right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {featured.length > 0 && (
            <div className="space-y-4">
              {featured.map((event, i) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 hover:shadow-md transition-shadow"
                  style={{ animation: `fade-in 0.4s ease-out ${i * 0.06}s forwards`, opacity: 0 }}
                >
                  <div className="relative h-44 w-full bg-cream-100">
                    {event.image_url && (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 512px) 100vw, 512px"
                      />
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-ocean-500 text-white shadow-md">
                        <Star size={10} fill="currentColor" />
                        Featured
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white/95 text-foreground backdrop-blur-sm shadow-sm">
                        {formatDate(event.event_date)}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-foreground backdrop-blur-sm">
                        {event.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="text-heading-sm font-semibold text-foreground leading-snug">
                      {event.title}
                    </h3>
                    <p className="text-body-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 pt-1 text-[13px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        <span className="truncate max-w-[160px]">{event.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {formatTime(event.event_date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="space-y-3">
              {featured.length > 0 && (
                <h2 className="text-body font-semibold text-foreground">Upcoming</h2>
              )}
              {upcoming.map((event, i) => (
                <div
                  key={event.id}
                  className="flex gap-3.5 p-3 bg-white rounded-xl border border-cream-200 hover:shadow-sm transition-shadow"
                  style={{ animation: `fade-in 0.4s ease-out ${(featured.length + i) * 0.06}s forwards`, opacity: 0 }}
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0">
                    {event.image_url && (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-ocean-500/80">
                      <div className="text-center text-white">
                        <div className="text-[18px] font-bold leading-none">
                          {new Date(event.event_date).getDate()}
                        </div>
                        <div className="text-[11px] font-medium uppercase">
                          {new Date(event.event_date).toLocaleDateString('en-GB', { month: 'short' })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        <span className="truncate max-w-[120px]">{event.location}</span>
                      </span>
                      <span className="text-ocean-500 font-medium">{daysUntil(event.event_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
