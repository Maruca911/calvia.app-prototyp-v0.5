'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock3, Loader2, MessageCircle, Phone, ShieldCheck, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { buildBookingSupportMessage, buildSupportWhatsAppUrl } from '@/lib/support';
import { Button } from '@/components/ui/button';

type BookingStatus = 'requested' | 'confirmed' | 'declined' | 'completed';

interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  owner_id: string | null;
  claimed: boolean;
  view_count: number | null;
  category_id: string | null;
  area_id: string | null;
}

interface MembershipRecord {
  role: 'owner' | 'manager' | 'staff';
  status: 'active' | 'invited' | 'disabled';
}

interface BookingRecord {
  id: string;
  business_name: string;
  service_type: string;
  booking_date: string | null;
  booking_time: string | null;
  party_size: number;
  status: BookingStatus;
  created_at: string;
  user_id: string;
}

interface ReviewRecord {
  id: string;
  rating: number;
  title: string;
  content: string;
  comment: string;
  created_at: string;
  user_id: string;
}

function bookingStatusClass(status: BookingStatus): string {
  if (status === 'confirmed') return 'bg-sage-100 text-sage-700';
  if (status === 'declined') return 'bg-red-100 text-red-700';
  if (status === 'completed') return 'bg-ocean-100 text-ocean-700';
  return 'bg-cream-200 text-foreground';
}

function formatDate(dateIso: string | null): string {
  if (!dateIso) return 'Flexible date';
  return new Date(dateIso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function obfuscateUser(userId: string): string {
  return `Member ${userId.slice(0, 8)}`;
}

function normalizeUrl(input: string): string {
  if (!input) return '';
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

export function BusinessDashboardContent({ businessSlug }: { businessSlug: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessRecord | null>(null);
  const [membershipRole, setMembershipRole] = useState<'owner' | 'manager' | 'staff' | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [mappedListingId, setMappedListingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [bookingUpdateId, setBookingUpdateId] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    return (reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const pendingBookings = useMemo(
    () => bookings.filter((item) => item.status === 'requested').length,
    [bookings]
  );

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(
          'id, name, slug, description, address, phone, email, website, owner_id, claimed, view_count, category_id, area_id'
        )
        .eq('slug', businessSlug)
        .maybeSingle();

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (!businessData) {
        setError('Business not found.');
        setLoading(false);
        return;
      }

      const businessRecord = businessData as BusinessRecord;
      setBusiness(businessRecord);

      const isOwner = businessRecord.owner_id === user.id;
      let role: 'owner' | 'manager' | 'staff' | null = isOwner ? 'owner' : null;

      if (!isOwner) {
        const { data: membershipData, error: membershipError } = await supabase
          .from('business_memberships')
          .select('role, status')
          .eq('business_id', businessRecord.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (membershipError) {
          throw new Error(membershipError.message);
        }

        if (!membershipData) {
          setError('You do not have access to this business dashboard.');
          setLoading(false);
          return;
        }

        role = (membershipData as MembershipRecord).role;
      }

      setMembershipRole(role);

      const [
        { data: categoryData },
        { data: areaData },
        { data: listingMapData },
        { data: reviewData, error: reviewError },
      ] = await Promise.all([
        businessRecord.category_id
          ? supabase.from('categories').select('name').eq('id', businessRecord.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        businessRecord.area_id
          ? supabase.from('areas').select('name').eq('id', businessRecord.area_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('business_listing_map')
          .select('listing_id')
          .eq('business_id', businessRecord.id)
          .maybeSingle(),
        supabase
          .from('reviews')
          .select('id, rating, title, content, comment, created_at, user_id')
          .eq('business_id', businessRecord.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setCategoryName((categoryData as { name?: string } | null)?.name || '');
      setAreaName((areaData as { name?: string } | null)?.name || '');

      const listingId = (listingMapData as { listing_id?: string } | null)?.listing_id || null;
      setMappedListingId(listingId);

      if (reviewError) {
        throw new Error(reviewError.message);
      }
      setReviews((reviewData || []) as ReviewRecord[]);

      if (listingId) {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(
            'id, business_name, service_type, booking_date, booking_time, party_size, status, created_at, user_id'
          )
          .eq('listing_id', listingId)
          .order('created_at', { ascending: false })
          .limit(80);

        if (bookingError) {
          throw new Error(bookingError.message);
        }

        setBookings((bookingData || []) as BookingRecord[]);
      } else {
        setBookings([]);
      }
    } catch (loadError) {
      console.error('[PartnerBusiness] Failed loading dashboard', loadError);
      const message = loadError instanceof Error ? loadError.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [businessSlug, user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBookingUpdateId(bookingId);
    try {
      const { error: updateError } = await getSupabase()
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setBookings((prev) => prev.map((item) => (item.id === bookingId ? { ...item, status } : item)));
      toast.success(`Booking marked as ${status}.`);
    } catch (updateErr) {
      console.error('[PartnerBusiness] Failed to update booking status', updateErr);
      const message = updateErr instanceof Error ? updateErr.message : 'Could not update booking status.';
      toast.error(message);
    } finally {
      setBookingUpdateId(null);
    }
  };

  const supportWhatsAppUrl = useMemo(() => {
    if (!business) return '';
    return buildSupportWhatsAppUrl(
      buildBookingSupportMessage({
        businessName: business.name,
        serviceType: 'partner-dashboard',
        source: 'partners-business-dashboard',
      })
    );
  }, [business]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-cream-200 bg-white p-6">
            <h1 className="text-heading font-semibold text-foreground">Business Dashboard</h1>
            <p className="text-body-sm text-muted-foreground mt-2">
              Sign in to access your business partner dashboard.
            </p>
            <Button asChild className="mt-4">
              <Link href="/profile">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-cream-200 bg-white p-6 text-body-sm text-muted-foreground flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading business dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-cream-200 bg-white p-6">
            <div className="text-red-600 text-body-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error || 'Unable to open this dashboard.'}
            </div>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/partners">Back to master dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-ocean-50/30">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-5">
        <header className="rounded-xl border border-cream-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[12px] uppercase tracking-wide font-semibold text-ocean-500">Business Dashboard</p>
              <h1 className="text-heading-lg text-foreground mt-1">{business.name}</h1>
              <p className="text-body-sm text-muted-foreground mt-1">
                {categoryName || 'Category pending'} {areaName ? `• ${areaName}` : ''} {membershipRole ? `• ${membershipRole}` : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button asChild variant="outline">
                <Link href="/partners">Open master dashboard</Link>
              </Button>
              <Button asChild>
                <a href={supportWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={14} className="mr-1.5" />
                  WhatsApp support
                </a>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Bookings total</p>
            <p className="text-heading-sm text-foreground mt-1">{bookings.length}</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Pending response</p>
            <p className="text-heading-sm text-foreground mt-1">{pendingBookings}</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Reviews</p>
            <p className="text-heading-sm text-foreground mt-1">{reviews.length}</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Average rating</p>
            <p className="text-heading-sm text-foreground mt-1 flex items-center gap-1">
              <Star size={16} className="text-amber-500" fill="currentColor" />
              {averageRating || 'N/A'}
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <article className="xl:col-span-2 rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock3 size={16} className="text-ocean-500" />
              Booking requests
            </h2>
            {!mappedListingId && (
              <p className="text-[13px] text-muted-foreground">
                No listing mapping found yet for this business. Link business and listing to unlock booking inbox.
              </p>
            )}
            {mappedListingId && bookings.length === 0 && (
              <p className="text-[13px] text-muted-foreground">No booking requests yet.</p>
            )}
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-cream-200 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-foreground">
                      {booking.business_name} • {booking.service_type}
                    </p>
                    <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${bookingStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {formatDate(booking.booking_date)} • {booking.booking_time || 'Flexible time'} • {booking.party_size} people • {obfuscateUser(booking.user_id)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={bookingUpdateId === booking.id}
                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                    >
                      {bookingUpdateId === booking.id ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : null}
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={bookingUpdateId === booking.id}
                      onClick={() => updateBookingStatus(booking.id, 'declined')}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={bookingUpdateId === booking.id}
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-ocean-500" />
              Business profile
            </h2>
            <div className="space-y-2 text-[13px]">
              <p><span className="text-muted-foreground">Address:</span> {business.address || 'N/A'}</p>
              <p><span className="text-muted-foreground">Phone:</span> {business.phone || 'N/A'}</p>
              <p><span className="text-muted-foreground">Email:</span> {business.email || 'N/A'}</p>
              <p><span className="text-muted-foreground">Views:</span> {business.view_count || 0}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {business.phone && (
                <Button asChild variant="outline" className="justify-start">
                  <a href={`tel:${business.phone}`}>
                    <Phone size={14} className="mr-2" />
                    Call business line
                  </a>
                </Button>
              )}
              {business.website && (
                <Button asChild variant="outline" className="justify-start">
                  <a href={normalizeUrl(business.website)} target="_blank" rel="noopener noreferrer">
                    Open website
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" className="justify-start">
                <a href="mailto:contact@calvia.app">Contact partner support</a>
              </Button>
            </div>
          </article>
        </section>

        <section className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
          <h2 className="text-body font-semibold text-foreground mb-3">Reviews for {business.name}</h2>
          {reviews.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No reviews available yet for this business.</p>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 12).map((review) => (
                <div key={review.id} className="rounded-lg border border-cream-200 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-[13px] font-medium text-foreground">
                      {review.title || 'Customer review'} • {obfuscateUser(review.user_id)}
                    </p>
                    <span className="text-[12px] text-muted-foreground">{formatDate(review.created_at)}</span>
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={`${review.id}-${s}`}
                        size={12}
                        className={s <= review.rating ? 'text-amber-500' : 'text-cream-300'}
                        fill={s <= review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] text-foreground/80 mt-1">
                    {review.content || review.comment || 'No written comment.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
