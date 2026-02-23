'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  Clock3,
  Loader2,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type BookingStatus = 'requested' | 'confirmed' | 'declined' | 'completed';

interface BookingRow {
  id: string;
  business_name: string;
  service_type: string;
  booking_date: string | null;
  booking_time: string | null;
  party_size: number;
  status: BookingStatus;
  created_at: string;
}

const INITIAL_FORM = {
  listingId: null as string | null,
  businessName: '',
  serviceType: 'restaurant',
  bookingDate: '',
  bookingTime: '',
  partySize: 2,
  notes: '',
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  requested: 'bg-cream-100 text-foreground',
  confirmed: 'bg-sage-50 text-sage-700',
  declined: 'bg-red-50 text-red-600',
  completed: 'bg-ocean-50 text-ocean-600',
};

export function BookingsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<'monthly' | 'annual' | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [checkoutStateHandled, setCheckoutStateHandled] = useState(false);

  const isFormValid = useMemo(() => {
    return form.businessName.trim().length > 1;
  }, [form.businessName]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = getSupabase();

    const [{ data: profileData }, { data: membershipData }, { data: bookingData, error: bookingError }] =
      await Promise.all([
        supabase.from('profiles').select('is_premium').eq('id', user.id).maybeSingle(),
        supabase
          .from('premium_memberships')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('bookings')
          .select('id, business_name, service_type, booking_date, booking_time, party_size, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

    setIsPremium(Boolean(profileData?.is_premium || membershipData));

    if (bookingError) {
      console.error('[Bookings] Failed to load bookings', bookingError);
      setBookings([]);
    } else {
      setBookings((bookingData || []) as BookingRow[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (prefillApplied) {
      return;
    }

    const business = searchParams.get('business');
    const service = searchParams.get('service');
    const listingId = searchParams.get('listingId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!business && !service && !listingId && !date && !time) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      businessName: business || prev.businessName,
      serviceType: service || prev.serviceType,
      listingId: listingId || prev.listingId,
      bookingDate: date || prev.bookingDate,
      bookingTime: time || prev.bookingTime,
    }));

    if (business) {
      toast.success(`Booking ready for ${business}`);
    }
    setPrefillApplied(true);
  }, [prefillApplied, searchParams]);

  useEffect(() => {
    if (checkoutStateHandled) {
      return;
    }

    const checkoutState = searchParams.get('checkout');
    if (!checkoutState) {
      return;
    }

    if (checkoutState === 'success') {
      toast.success('Checkout completed. Your membership is being activated.');
      loadData();
    } else if (checkoutState === 'cancelled') {
      toast.message('Checkout was cancelled.');
    }

    setCheckoutStateHandled(true);
  }, [checkoutStateHandled, loadData, searchParams]);

  const startCheckout = async (plan: 'monthly' | 'annual') => {
    if (!user) {
      toast.error('Please sign in to continue.');
      return;
    }

    setCheckoutLoading(plan);
    try {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ plan }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Unable to start checkout');
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error('[Bookings] Checkout error', error);
      const message = error instanceof Error ? error.message : 'Could not open checkout. Please try again.';
      if (message === 'Unauthorized') {
        toast.error('Session could not be verified. Please sign out and sign in again.');
      } else {
        toast.error(message);
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  const submitBooking = async () => {
    if (!user || !isFormValid) {
      return;
    }

    setSubmitting(true);
    const { error } = await getSupabase().from('bookings').insert({
      user_id: user.id,
      listing_id: form.listingId || null,
      business_name: form.businessName.trim(),
      service_type: form.serviceType,
      booking_date: form.bookingDate || null,
      booking_time: form.bookingTime || null,
      party_size: Math.max(1, Number(form.partySize) || 1),
      notes: form.notes.trim(),
    });

    if (error) {
      console.error('[Bookings] Insert failed', error);
      toast.error('Could not submit booking request.');
      setSubmitting(false);
      return;
    }

    toast.success('Booking request submitted.');
    setForm(INITIAL_FORM);
    setSubmitting(false);
    loadData();
  };

  if (!user) {
    return (
      <div className="px-5 py-6 space-y-4 animate-fade-in">
        <h1 className="text-heading font-semibold text-foreground">Bookings</h1>
        <p className="text-body text-muted-foreground">
          Sign in to request reservations and manage your booking history.
        </p>
        <Button asChild>
          <Link href="/profile">Sign in to continue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-heading font-semibold text-foreground">Bookings</h1>
        <p className="text-body text-muted-foreground">
          Reserve tables, classes, and partner experiences.
        </p>
      </div>

      {!isPremium && (
        <section className="p-5 bg-white rounded-xl border border-cream-200 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-ocean-50 text-ocean-500 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-body font-semibold text-foreground">
                Premium required for booking requests
              </h2>
              <p className="text-body-sm text-muted-foreground">
                Unlock direct partner bookings, special rates, and premium-only offers.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              onClick={() => startCheckout('monthly')}
              disabled={checkoutLoading !== null}
              className="w-full"
            >
              {checkoutLoading === 'monthly' ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Sparkles size={16} className="mr-2" />
              )}
              Monthly EUR 8.99
            </Button>
            <Button
              variant="outline"
              onClick={() => startCheckout('annual')}
              disabled={checkoutLoading !== null}
              className="w-full border-cream-300"
            >
              {checkoutLoading === 'annual' ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Sparkles size={16} className="mr-2" />
              )}
              Annual EUR 89.99
            </Button>
          </div>
        </section>
      )}

      {isPremium && (
        <section className="p-5 bg-white rounded-xl border border-cream-200 shadow-sm space-y-4">
          <h2 className="text-body font-semibold text-foreground">Request a booking</h2>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                placeholder="e.g. Tutti Sensi"
                value={form.businessName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, businessName: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="service-type">Service</Label>
                <Input
                  id="service-type"
                  placeholder="restaurant, padel, pilates..."
                  value={form.serviceType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, serviceType: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="party-size">People</Label>
                <Input
                  id="party-size"
                  type="number"
                  min={1}
                  value={form.partySize}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, partySize: Number(e.target.value) || 1 }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="booking-date">Date</Label>
                <Input
                  id="booking-date"
                  type="date"
                  value={form.bookingDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bookingDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="booking-time">Time</Label>
                <Input
                  id="booking-time"
                  type="time"
                  value={form.bookingTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bookingTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="booking-notes">Notes</Label>
              <Textarea
                id="booking-notes"
                placeholder="Any details we should pass to the partner..."
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
            <Button disabled={!isFormValid || submitting} onClick={submitBooking}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit booking request'
              )}
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-body font-semibold text-foreground">My bookings</h2>
        {loading ? (
          <div className="p-5 bg-white rounded-xl border border-cream-200 text-muted-foreground flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-5 bg-white rounded-xl border border-cream-200 text-body-sm text-muted-foreground">
            No booking requests yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {bookings.map((booking) => (
              <article key={booking.id} className="p-4 bg-white rounded-xl border border-cream-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-body font-semibold text-foreground truncate">
                    {booking.business_name}
                  </h3>
                  <span className={`text-[12px] px-2 py-1 rounded-full font-medium ${STATUS_STYLES[booking.status]}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    {booking.booking_date || 'Flexible date'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={13} />
                    {booking.booking_time || 'Flexible time'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} />
                    {booking.party_size} people
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
