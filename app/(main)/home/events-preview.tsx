'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, MapPin, Clock, ChevronRight } from 'lucide-react';

interface CalviaEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  category: string;
  image_url: string;
  is_featured: boolean;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function daysUntil(d: string) {
  const diff = Math.ceil(
    (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

export function EventsPreview({ events }: { events: CalviaEvent[] }) {
  if (!events.length) return null;

  return (
    <section className="py-6" aria-label="Upcoming Events">
      <div className="px-5 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center">
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-heading-sm font-semibold text-foreground leading-tight">
              Events & Happenings
            </h2>
            <p className="text-[13px] text-muted-foreground">
              What's on in Calvia this week
            </p>
          </div>
        </div>
        <Link
          href="/events"
          className="flex items-center gap-1 text-[14px] font-semibold text-ocean-500 hover:text-ocean-400 transition-colors"
        >
          See all
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
        {events.map((event, i) => (
          <Link
            key={event.id}
            href="/events"
            className="flex-shrink-0 w-[280px] bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 hover:shadow-md transition-all group"
            style={{
              animation: `fade-in 0.4s ease-out ${i * 0.08}s forwards`,
              opacity: 0,
            }}
          >
            <div className="relative h-36 w-full bg-cream-100">
              {event.image_url && (
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="280px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              <div className="absolute top-2.5 left-2.5">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-foreground backdrop-blur-sm">
                  {event.category}
                </span>
              </div>

              {event.is_featured && (
                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500 text-white shadow-md">
                    Featured
                  </span>
                </div>
              )}

              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg bg-white/95 text-foreground backdrop-blur-sm shadow-sm">
                  {formatDate(event.event_date)}
                </span>
                <span className="text-[12px] font-semibold px-2 py-1 rounded-lg bg-sky-500/90 text-white backdrop-blur-sm">
                  {daysUntil(event.event_date)}
                </span>
              </div>
            </div>

            <div className="p-3.5">
              <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-ocean-600 transition-colors">
                {event.title}
              </h3>
              <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {event.description}
              </p>
              <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-cream-100 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={11} className="flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Clock size={11} />
                  {formatTime(event.event_date)}
                </span>
              </div>
            </div>
          </Link>
        ))}

        <Link
          href="/events"
          className="flex-shrink-0 w-[120px] rounded-xl border-2 border-dashed border-cream-300 flex flex-col items-center justify-center gap-2 hover:border-sky-300 hover:bg-sky-50/50 transition-all group"
        >
          <CalendarDays
            size={24}
            className="text-muted-foreground group-hover:text-sky-500 transition-colors"
          />
          <span className="text-[13px] font-semibold text-muted-foreground group-hover:text-sky-500 transition-colors">
            All Events
          </span>
        </Link>
      </div>
    </section>
  );
}
