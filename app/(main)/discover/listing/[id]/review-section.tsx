'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Send, Star } from 'lucide-react';
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

function normalizeReview(review: Review): Review {
  return {
    ...review,
    comment: review.comment || review.content || '',
  };
}

function byNewest(a: Review, b: Review): number {
  return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
}

interface ReviewSectionProps {
  listingId: string;
  listingName?: string;
  listingAddress?: string;
}

export function ReviewSection({ listingId, listingName, listingAddress }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const loadReviews = useCallback(async () => {
    const { data, error } = await getSupabase()
      .from('reviews')
      .select('id, rating, comment, content, created_at, updated_at, user_id, profiles:user_id(full_name)')
      .eq('listing_id', listingId)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Reviews] Failed to load reviews', error);
      toast.error('Could not load reviews.');
      return;
    }

    if (data) {
      const normalized = (data as unknown as Review[]).map(normalizeReview).sort(byNewest);
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
      const { data, error } = await getSupabase()
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
        .select('id, rating, comment, content, created_at, updated_at, user_id, profiles:user_id(full_name)')
        .single();

      if (error || !data) {
        throw error || new Error('Unknown review write error');
      }

      const savedReview = normalizeReview(data as unknown as Review);
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
