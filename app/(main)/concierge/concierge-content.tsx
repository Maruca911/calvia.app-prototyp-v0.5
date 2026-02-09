'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { RequestFormDrawer } from './request-form-drawer';
import { RequestHistory } from './request-history';
import {
  UtensilsCrossed,
  Car,
  AlertTriangle,
  Lightbulb,
  PenLine,
  Sparkles,
  ClipboardList,
  ChevronRight,
  PhoneCall,
} from 'lucide-react';

export interface ConciergeRequest {
  id: string;
  request_type: string;
  details: Record<string, string>;
  status: string;
  reference_number: string;
  created_at: string;
  updated_at: string;
}

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

export function ConciergeContent() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await getSupabase()
      .from('concierge_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRequests(data);
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openAction = (type: string) => {
    setSelectedAction(type);
    setDrawerOpen(true);
  };

  const onRequestCreated = () => {
    setDrawerOpen(false);
    setSelectedAction(null);
    loadRequests();
  };

  const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
  const pastRequests = requests.filter(r => r.status === 'completed' || r.status === 'cancelled');

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
            <p className="text-body font-semibold text-foreground">Prefer to talk?</p>
            <p className="text-body-sm text-muted-foreground">Call our concierge line anytime</p>
          </div>
        </div>
        <a
          href="tel:+34600000000"
          className="mt-3 flex items-center justify-center gap-2 w-full min-h-[56px] bg-ocean-500 text-white rounded-xl text-body font-semibold hover:bg-ocean-600 active:bg-ocean-700 transition-colors"
        >
          <PhoneCall size={20} />
          Call Concierge
        </a>
      </div>

      <section className="mt-7">
        <h2 className="text-heading-sm font-semibold text-foreground mb-4">
          How can we help?
        </h2>
        <div className="space-y-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.type}
                onClick={() => openAction(action.type)}
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
                <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {activeRequests.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={18} className="text-sage-500" />
            <h2 className="text-[17px] font-semibold text-foreground">
              Active Requests
            </h2>
            <span className="ml-auto text-[13px] font-medium text-ocean-500 bg-ocean-50 px-2.5 py-0.5 rounded-full">
              {activeRequests.length}
            </span>
          </div>
          <RequestHistory requests={activeRequests} />
        </section>
      )}

      {pastRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[17px] font-semibold text-foreground mb-3 text-muted-foreground">
            Past Requests
          </h2>
          <RequestHistory requests={pastRequests} />
        </section>
      )}

      {user && requests.length === 0 && (
        <div className="mt-8 p-6 bg-white rounded-xl border border-cream-200 text-center">
          <ClipboardList size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-body text-muted-foreground">
            No requests yet. Tap any action above to get started.
          </p>
        </div>
      )}

      {!user && (
        <div className="mt-8 p-6 bg-cream-50 rounded-xl border border-cream-200 text-center">
          <p className="text-body text-muted-foreground">
            Sign in to track your concierge requests and get personalised recommendations.
          </p>
        </div>
      )}

      <RequestFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        requestType={selectedAction}
        onSubmitted={onRequestCreated}
      />
    </div>
  );
}
