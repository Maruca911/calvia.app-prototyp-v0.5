'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

export function ReviewSection({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const loadReviews = useCallback(async () => {
    const { data } = await getSupabase()
      .from('reviews')
      .select('*, profiles:user_id(full_name)')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });
    if (data) {
      setReviews(data as unknown as Review[]);
      if (user) {
        const mine = (data as unknown as Review[]).find(r => r.user_id === user.id);
        if (mine) {
          setUserReview(mine);
          setRating(mine.rating);
          setComment(mine.comment);
        }
      }
    }
  }, [listingId, user]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
    try {
      if (userReview) {
        await getSupabase()
          .from('reviews')
          .update({ rating, comment })
          .eq('id', userReview.id);
        toast.success('Review updated');
      } else {
        await getSupabase()
          .from('reviews')
          .insert({ listing_id: listingId, user_id: user.id, rating, comment });
        toast.success('Review submitted');
      }
      await loadReviews();
    } catch {
      toast.error('Could not save review');
    }
    setSubmitting(false);
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
