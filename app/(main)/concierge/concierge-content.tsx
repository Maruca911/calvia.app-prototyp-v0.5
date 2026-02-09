'use client';

import { useState } from 'react';
import {
  UtensilsCrossed,
  Car,
  AlertTriangle,
  Lightbulb,
  PenLine,
  Sparkles,
  ChevronRight,
  PhoneCall,
  MessageCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

const QUICK_ACTIONS = [
  {
    type: 'restaurant_booking',
    label: 'Restaurant Booking',
    description: 'Reserve a table at any Calvia restaurant',
    icon: UtensilsCrossed,
    color: 'bg-ocean-50 text-ocean-500',
  },
  {
    type: 'taxi_transfer',
    label: 'Taxi / Transfer',
    description: 'Airport pickups, day trips, and rides',
    icon: Car,
    color: 'bg-sage-50 text-sage-600',
  },
  {
    type: 'recommendation',
    label: 'Recommend Me',
    description: 'Not sure what to do? We will suggest something',
    icon: Lightbulb,
    color: 'bg-cream-200 text-ocean-400',
  },
  {
    type: 'report_issue',
    label: 'Report an Issue',
    description: 'Property problems, noise, or safety concerns',
    icon: AlertTriangle,
    color: 'bg-red-50 text-red-500',
  },
  {
    type: 'custom_request',
    label: 'Custom Request',
    description: 'Anything else you need help with',
    icon: PenLine,
    color: 'bg-ocean-50 text-ocean-400',
  },
] as const;

const PHONE_NUMBER = '+4915127578246';
const WHATSAPP_URL = `https://wa.me/${PHONE_NUMBER.replace('+', '')}`;

function buildWhatsAppUrl(actionLabel: string) {
  const text = encodeURIComponent(
    `Hi, I'd like help with: ${actionLabel}`
  );
  return `${WHATSAPP_URL}?text=${text}`;
}

export function ConciergeContent() {
  const [tappedAction, setTappedAction] = useState<string | null>(null);

  const handleAction = (type: string, label: string) => {
    setTappedAction(type);
    const url = buildWhatsAppUrl(label);
    window.open(url, '_blank', 'noopener');
    toast.success(`Opening WhatsApp for: ${label}`);
    setTimeout(() => setTappedAction(null), 2000);
  };

  return (
    <div className="px-5 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-400 flex items-center justify-center">
          <Sparkles size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-heading font-semibold text-foreground">
            Concierge
          </h1>
          <p className="text-body-sm text-muted-foreground">
            Your personal assistant in Calvia
          </p>
        </div>
      </div>

      <div className="mt-5 p-4 bg-gradient-to-r from-ocean-50 to-sage-50 rounded-xl border border-ocean-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-ocean-500 flex items-center justify-center flex-shrink-0">
            <PhoneCall size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-foreground">Need help right now?</p>
            <p className="text-body-sm text-muted-foreground">Call or message our concierge team</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <a
            href={`tel:${PHONE_NUMBER}`}
            className="flex items-center justify-center gap-2 min-h-[52px] bg-ocean-500 text-white rounded-xl text-[15px] font-semibold hover:bg-ocean-600 active:bg-ocean-700 transition-colors"
          >
            <PhoneCall size={18} />
            Call
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 min-h-[52px] bg-[#25D366] text-white rounded-xl text-[15px] font-semibold hover:bg-[#20BD5A] active:bg-[#1DA851] transition-colors"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        </div>
      </div>

      <section className="mt-7">
        <h2 className="text-heading-sm font-semibold text-foreground mb-1">
          How can we help?
        </h2>
        <p className="text-body-sm text-muted-foreground mb-4">
          Tap any service below to message us directly
        </p>
        <div className="space-y-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isTapped = tappedAction === action.type;
            return (
              <button
                key={action.type}
                onClick={() => handleAction(action.type, action.label)}
                className="w-full flex items-center gap-4 p-5 bg-white rounded-xl border border-cream-200 shadow-sm hover:shadow-md hover:border-cream-300 transition-all text-left active:scale-[0.98]"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-semibold text-foreground">
                    {action.label}
                  </h3>
                  <p className="text-body-sm text-muted-foreground mt-0.5 leading-snug">
                    {action.description}
                  </p>
                </div>
                {isTapped ? (
                  <CheckCircle2 size={20} className="text-sage-500 flex-shrink-0" />
                ) : (
                  <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="p-5 bg-white rounded-xl border border-cream-200 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-ocean-50 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-ocean-500" />
            </div>
            <div>
              <h3 className="text-body font-semibold text-foreground">
                How it works
              </h3>
              <p className="text-body-sm text-muted-foreground mt-1 leading-relaxed">
                Send us a message via WhatsApp or give us a call. Our local team
                will handle everything -- from restaurant bookings to airport
                transfers, recommendations, and more.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { step: '1', label: 'Message us' },
              { step: '2', label: 'We handle it' },
              { step: '3', label: 'Enjoy Calvia' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-ocean-500 text-white text-[14px] font-bold flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <p className="text-[13px] font-medium text-foreground mt-1.5">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
