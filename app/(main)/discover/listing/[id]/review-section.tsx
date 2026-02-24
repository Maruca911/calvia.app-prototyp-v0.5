'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Loader2, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import {
  buildGoogleReviewUrl,
  buildTripAdvisorReviewUrl,
} from '@/lib/external-reviews';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string;
  content?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string;
  content?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

interface GoogleReview {
  authorName: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  authorUrl?: string;
}

interface GoogleReviewsPayload {
  enabled?: boolean;
  source?: 'google';
  placeName?: string | null;
  placeUrl?: string | null;
  rating?: number | null;
  totalRatings?: number | null;
  reviews?: GoogleReview[];
}

function normalizeReview(review: Review): Review {
  return {
    ...review,
    comment: review.comment || review.content || '',
  };
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
}

function isMissingReviewCompatColumn(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('column') &&
    message.includes('reviews') &&
    (message.includes('content') || message.includes('updated_at'))
  );
}

function byNewest(a: Review, b: Review): number {
  return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
}

async function loadProfileNameMap(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) {
    return {};
  }

  const { data: profileRows, error: profileError } = await getSupabase()
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  if (profileError) {
    console.warn('[Reviews] Failed to load profile names', profileError);
    return {};
  }

  const profileNameMap: Record<string, string> = {};
  for (const row of (profileRows || []) as Array<{ id: string; full_name?: string | null }>) {
    if (row.id) {
      profileNameMap[row.id] = row.full_name || '';
    }
  }

  return profileNameMap;
}

interface ReviewSectionProps {
  listingId: string;
  listingName?: string;
  listingAddress?: string;
}

export function ReviewSection({ listingId, listingName, listingAddress }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsWarning, setReviewsWarning] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [googleReviewsPayload, setGoogleReviewsPayload] = useState<GoogleReviewsPayload | null>(null);
  const [googleReviewsLoading, setGoogleReviewsLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    const supabase = getSupabase();
    let rows: ReviewRow[] = [];
    let queryError: unknown = null;

    const primary = await supabase
      .from('reviews')
      .select('id, rating, comment, content, created_at, updated_at, user_id')
      .eq('listing_id', listingId)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (primary.error && isMissingReviewCompatColumn(primary.error)) {
      const fallback = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, user_id')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      if (fallback.error) {
        queryError = fallback.error;
      } else {
        rows = (fallback.data || []) as ReviewRow[];
      }
    } else if (primary.error) {
      queryError = primary.error;
    } else {
      rows = (primary.data || []) as ReviewRow[];
    }

    if (queryError) {
      console.error('[Reviews] Failed to load reviews', queryError);
      const message = getErrorMessage(queryError).toLowerCase();
      if (message.includes('relation') && message.includes('reviews')) {
        setReviewsWarning('Reviews are being configured in this environment.');
      } else {
        setReviewsWarning('Reviews are temporarily unavailable.');
      }
      setReviews([]);
      return;
    }

    setReviewsWarning(null);
    const profileNameMap = await loadProfileNameMap(
      Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)))
    );

    const normalized = rows
      .map((row) =>
        normalizeReview({
          ...row,
          profiles: profileNameMap[row.user_id]
            ? { full_name: profileNameMap[row.user_id] }
            : null,
        })
      )
      .sort(byNewest);
    setReviews(normalized);
    if (user) {
      const mine = normalized.find((r) => r.user_id === user.id);
      if (mine) {
        setUserReview(mine);
        setRating(mine.rating);
        setComment(mine.comment);
      } else {
        setUserReview(null);
        setRating(0);
        setComment('');
      }
    }
  }, [listingId, user]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`reviews:listing:${listingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `listing_id=eq.${listingId}`,
        },
        () => {
          void loadReviews();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingId, loadReviews]);

  useEffect(() => {
    if (!listingName?.trim()) {
      setGoogleReviewsPayload(null);
      return;
    }

    const controller = new AbortController();
    const loadGoogleReviews = async () => {
      setGoogleReviewsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('name', listingName.trim());
        if (listingAddress?.trim()) {
          params.set('address', listingAddress.trim());
        }
        params.set('limit', '3');

        const response = await fetch(`/api/reviews/google?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setGoogleReviewsPayload(null);
          return;
        }

        const payload = (await response.json()) as GoogleReviewsPayload;
        if (!payload.enabled) {
          setGoogleReviewsPayload(null);
          return;
        }
        setGoogleReviewsPayload(payload);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.warn('[Reviews] Failed to load Google reviews', error);
        }
        setGoogleReviewsPayload(null);
      } finally {
        setGoogleReviewsLoading(false);
      }
    };

    void loadGoogleReviews();
    return () => controller.abort();
  }, [listingAddress, listingName]);

  const trackExternalReviewClick = async (provider: 'google' | 'tripadvisor', destinationUrl: string) => {
    try {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();

      await fetch('/api/reviews/outbound-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          listingId,
          provider,
          destinationUrl,
        }),
      });
    } catch (error) {
      console.warn('[Reviews] Failed to track outbound review click', error);
    }
  };

  const openExternalReview = (provider: 'google' | 'tripadvisor', url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    void trackExternalReviewClick(provider, url);
  };

  const submitReview = async () => {
    if (!user) {
      toast('Sign in to leave a review');
      return;
    }
    if (rating === 0) {
      toast('Please select a star rating');
      return;
    }

    setSubmitting(true);
    const previousReviews = reviews;
    const previousUserReview = userReview;

    const optimisticReview: Review = normalizeReview({
      id: userReview?.id || `tmp-${Date.now()}`,
      rating,
      comment,
      content: comment,
      created_at: userReview?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id,
      profiles: previousUserReview?.profiles || { full_name: user.email || 'Calvia Member' },
    });

    setReviews((prev) => {
      const withoutMine = prev.filter((item) => item.user_id !== user.id);
      return [optimisticReview, ...withoutMine].sort(byNewest);
    });
    setUserReview(optimisticReview);
    setJustSubmitted(false);

    try {
      const supabase = getSupabase();
      let data: ReviewRow | null = null;
      let writeError: unknown = null;

      const primaryWrite = await supabase
        .from('reviews')
        .upsert(
          {
            listing_id: listingId,
            user_id: user.id,
            rating,
            comment,
            content: comment,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,listing_id' }
        )
        .select('id, rating, comment, content, created_at, updated_at, user_id')
        .single();

      if (primaryWrite.error && isMissingReviewCompatColumn(primaryWrite.error)) {
        const fallbackWrite = await supabase
          .from('reviews')
          .upsert(
            {
              listing_id: listingId,
              user_id: user.id,
              rating,
              comment,
            },
            { onConflict: 'user_id,listing_id' }
          )
          .select('id, rating, comment, created_at, user_id')
          .single();

        if (fallbackWrite.error || !fallbackWrite.data) {
          writeError = fallbackWrite.error || new Error('Unknown review write error');
        } else {
          data = fallbackWrite.data as ReviewRow;
        }
      } else if (primaryWrite.error || !primaryWrite.data) {
        writeError = primaryWrite.error || new Error('Unknown review write error');
      } else {
        data = primaryWrite.data as ReviewRow;
      }

      if (!data || writeError) {
        throw writeError || new Error('Unknown review write error');
      }

      const savedReview = normalizeReview({
        ...data,
        profiles: previousUserReview?.profiles || { full_name: user.email || 'Calvia Member' },
      });
      setReviews((prev) => {
        const withoutMine = prev.filter((item) => item.user_id !== user.id);
        return [savedReview, ...withoutMine].sort(byNewest);
      });
      setUserReview(savedReview);
      setJustSubmitted(true);
      toast.success(userReview ? 'Review updated' : 'Review submitted');
    } catch (error) {
      console.error('[Reviews] Could not save review', error);
      setReviews(previousReviews);
      setUserReview(previousUserReview);
      toast.error('Could not save review. Please try again.');
    } finally {
      setSubmitting(false);
      void loadReviews();
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const googleReviewUrl = buildGoogleReviewUrl(listingName, listingAddress);
  const tripAdvisorReviewUrl = buildTripAdvisorReviewUrl(listingName, listingAddress);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-sm font-semibold text-foreground">Reviews</h2>
        {avgRating && (
          <div className="flex items-center gap-1.5 text-body-sm">
            <Star size={16} className="text-amber-500" fill="currentColor" />
            <span className="font-semibold text-foreground">{avgRating}</span>
            <span className="text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-white rounded-xl border border-cream-200">
        <p className="text-body-sm font-medium text-foreground mb-3">
          {userReview ? 'Update your review' : 'Leave a review'}
        </p>
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(s)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                size={24}
                className={
                  s <= (hoverRating || rating)
                    ? 'text-amber-500'
                    : 'text-cream-300'
                }
                fill={s <= (hoverRating || rating) ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={user ? 'Share your experience...' : 'Sign in to review'}
            disabled={!user}
            className="flex-1 bg-cream-50 border border-cream-200 rounded-lg px-3 py-2.5 text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-50"
          />
          <Button
            onClick={submitReview}
            disabled={submitting || rating === 0 || !user}
            size="sm"
            className="h-auto px-3"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {reviewsWarning && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[13px] text-amber-900">
          {reviewsWarning}
        </div>
      )}

      {user && (userReview || justSubmitted) && (
        <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-2">
          <p className="text-body-sm font-medium text-foreground">
            Help this business grow visibility
          </p>
          <p className="text-[13px] text-muted-foreground">
            You can also leave a review on Google or Tripadvisor. External platforms have their
            own moderation and policy rules.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Calvia does not reward, pay, or incentivize external reviews.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="justify-between border-cream-300"
              onClick={() => openExternalReview('google', googleReviewUrl)}
            >
              Leave on Google
              <ExternalLink size={14} />
            </Button>
            <Button
              variant="outline"
              className="justify-between border-cream-300"
              onClick={() => openExternalReview('tripadvisor', tripAdvisorReviewUrl)}
            >
              Leave on Tripadvisor
              <ExternalLink size={14} />
            </Button>
          </div>
        </div>
      )}

      {googleReviewsLoading && (
        <div className="p-3 bg-white rounded-xl border border-cream-200 text-[13px] text-muted-foreground flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Loading Google reviews...
        </div>
      )}

      {googleReviewsPayload?.reviews && googleReviewsPayload.reviews.length > 0 && (
        <div className="p-4 bg-white rounded-xl border border-cream-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-body-sm font-semibold text-foreground">Google reviews</p>
              {(googleReviewsPayload.rating || googleReviewsPayload.totalRatings) && (
                <p className="text-[12px] text-muted-foreground">
                  {googleReviewsPayload.rating ? `${googleReviewsPayload.rating.toFixed(1)} stars` : null}
                  {googleReviewsPayload.totalRatings ? ` • ${googleReviewsPayload.totalRatings} ratings` : ''}
                </p>
              )}
            </div>
            {googleReviewsPayload.placeUrl && (
              <Button
                variant="outline"
                size="sm"
                className="border-cream-300"
                onClick={() => openExternalReview('google', googleReviewsPayload.placeUrl || '')}
              >
                Open in Google
                <ExternalLink size={13} className="ml-1.5" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {googleReviewsPayload.reviews.map((googleReview, index) => (
              <article key={`${googleReview.authorName}-${index}`} className="rounded-lg border border-cream-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-foreground truncate">{googleReview.authorName}</p>
                  <div className="inline-flex items-center gap-1 text-[12px] text-amber-600">
                    <Star size={12} fill="currentColor" />
                    <span>{googleReview.rating}</span>
                  </div>
                </div>
                {googleReview.relativeTimeDescription && (
                  <p className="text-[12px] text-muted-foreground mt-0.5">{googleReview.relativeTimeDescription}</p>
                )}
                {googleReview.text && (
                  <p className="text-[13px] text-foreground/80 leading-relaxed mt-1 line-clamp-3">
                    {googleReview.text}
                  </p>
                )}
              </article>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Source: Google public reviews. Moderation and ownership remain with Google.
          </p>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.slice(0, 6).map((review) => (
            <div
              key={review.id}
              className="flex gap-3 p-3.5 bg-white rounded-xl border border-cream-200"
            >
              <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center text-[13px] font-semibold text-sage-700 flex-shrink-0">
                {getInitials(review.profiles?.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-foreground truncate">
                    {review.profiles?.full_name || 'Calvia Member'}
                  </span>
                  <span className="text-[12px] text-muted-foreground flex-shrink-0">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                <div className="flex gap-0.5 mt-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      className={s <= review.rating ? 'text-amber-500' : 'text-cream-300'}
                      fill={s <= review.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-[14px] text-foreground/80 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 && (
        <p className="text-body-sm text-muted-foreground text-center py-4">
          No reviews yet. Be the first to share your experience.
        </p>
      )}
    </section>
  );
}
