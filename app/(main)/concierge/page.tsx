'use client';

import { useState } from 'react';
import {
  Bot,
  Sparkles,
  Sun,
  CalendarCheck,
  Lock,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const teaserFeatures = [
  {
    icon: MessageSquare,
    title: 'Intelligent Chat Assistant',
    description: 'Ask anything about Calvia, get instant personalised recommendations.',
  },
  {
    icon: Sun,
    title: 'Morning Briefing at 7AM',
    description: 'Weather, events, and curated suggestions delivered to you daily.',
  },
  {
    icon: CalendarCheck,
    title: 'Booking Assistant',
    description: 'Reserve restaurants, spa sessions, and activities with one tap.',
  },
  {
    icon: Bell,
    title: 'Calendar Integration',
    description: 'Never miss a reservation or local event in the Calvia area.',
  },
];

export default function ConciergePage() {
  const [email, setEmail] = useState('');

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('You\'re on the list!', {
        description: 'We\'ll notify you when the AI Concierge launches.',
      });
      setEmail('');
    }
  };

  return (
    <div className="px-5 py-8 animate-fade-in">
      <div className="text-center space-y-5 mb-10">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-400 flex items-center justify-center shadow-lg">
              <Bot size={42} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-sage-300 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-heading-xl font-semibold text-foreground">
            AI Concierge &<br />Daily Helper
          </h1>
          <p className="text-heading-sm font-medium text-sage-600">
            Coming Soon
          </p>
        </div>
        <p className="text-body text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Making your bookings for you all over Calvia so you can use every minute in paradise.
        </p>
      </div>

      <div className="space-y-3 mb-10">
        {teaserFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-5 bg-white rounded-xl border border-cream-200 shadow-sm"
            >
              <div className="w-12 h-12 rounded-lg bg-ocean-50 flex items-center justify-center flex-shrink-0">
                <Icon size={22} className="text-ocean-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-body font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <div className="flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground bg-cream-200 px-2.5 py-0.5 rounded-full">
                    <Lock size={10} />
                    Soon
                  </div>
                </div>
                <p className="text-body text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-6 text-center">
        <h2 className="text-heading-sm font-semibold text-foreground mb-2">
          Get Notified
        </h2>
        <p className="text-body text-muted-foreground mb-5">
          Be the first to experience the Calvia AI Concierge.
        </p>
        <form onSubmit={handleNotify} className="flex gap-3">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-h-[56px] bg-cream-50 border-cream-300 text-body rounded-lg"
          />
          <Button
            type="submit"
            className="min-h-[56px] px-6 text-body"
          >
            Notify Me
          </Button>
        </form>
      </div>
    </div>
  );
}
