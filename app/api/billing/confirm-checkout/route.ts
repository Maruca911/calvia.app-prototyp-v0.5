import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';
import { isBillingEnabled } from '@/lib/features';

export const runtime = 'nodejs';

type BillingPlan = 'monthly' | 'annual';
type MembershipStatus = 'active' | 'cancelled' | 'expired';

function getSupabaseUserClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing server Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function getUserFromRequest(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }

  const supabase = getSupabaseUserClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return { user: data.user, supabase };
}

function toIsoOrNull(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) {
    return null;
  }
  return new Date(unixSeconds * 1000).toISOString();
}

function mapPlanType(priceId: string | null | undefined, interval?: string): BillingPlan {
  if (!priceId) {
    return interval === 'year' ? 'annual' : 'monthly';
  }
  if (priceId === process.env.STRIPE_PRICE_ANNUAL_ID) {
    return 'annual';
  }
  if (priceId === process.env.STRIPE_PRICE_MONTHLY_ID) {
    return 'monthly';
  }
  return interval === 'year' ? 'annual' : 'monthly';
}

function mapMembershipStatus(status: Stripe.Subscription.Status): MembershipStatus {
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return 'active';
  }
  if (status === 'canceled') {
    return 'cancelled';
  }
  return 'expired';
}

async function loadSubscriptionFromSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<Stripe.Subscription | null> {
  if (!session.subscription) {
    return null;
  }

  if (typeof session.subscription !== 'string') {
    return session.subscription as Stripe.Subscription;
  }

  return stripe.subscriptions.retrieve(session.subscription);
}

export async function POST(request: NextRequest) {
  if (!isBillingEnabled) {
    return NextResponse.json({ error: 'Billing is disabled in this release' }, { status: 403 });
  }

  try {
    const context = await getUserFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = context;

    const body = (await request.json()) as { sessionId?: string };
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid checkout session id' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.mode !== 'subscription') {
      return NextResponse.json({ error: 'Checkout session is not a subscription' }, { status: 400 });
    }

    const sessionUserId = session.metadata?.supabase_user_id;
    if (sessionUserId && sessionUserId !== user.id) {
      return NextResponse.json({ error: 'Checkout session does not match user' }, { status: 403 });
    }

    const subscription = await loadSubscriptionFromSession(stripe, session);
    if (!subscription) {
      return NextResponse.json({ error: 'Missing subscription on checkout session' }, { status: 400 });
    }

    const subscriptionUserId = subscription.metadata?.supabase_user_id;
    if (subscriptionUserId && subscriptionUserId !== user.id) {
      return NextResponse.json({ error: 'Subscription does not match user' }, { status: 403 });
    }

    const firstItem = subscription.items.data[0];
    const priceId = firstItem?.price?.id || null;
    const interval = firstItem?.price?.recurring?.interval;
    const planType = mapPlanType(priceId, interval);
    const membershipStatus = mapMembershipStatus(subscription.status);
    const isPremium = membershipStatus === 'active';
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id || null;

    const { error: rpcError } = await supabase.rpc('upsert_own_membership_from_checkout', {
      p_plan_type: planType,
      p_status: membershipStatus,
      p_started_at: toIsoOrNull(subscription.start_date),
      p_expires_at: toIsoOrNull(subscription.current_period_end),
      p_stripe_customer_id: customerId,
      p_stripe_subscription_id: subscription.id,
      p_stripe_price_id: priceId,
      p_current_period_start: toIsoOrNull(subscription.current_period_start),
      p_current_period_end: toIsoOrNull(subscription.current_period_end),
      p_canceled_at: toIsoOrNull(subscription.canceled_at),
    });

    if (rpcError) {
      console.warn('[Stripe] Checkout confirmation fallback triggered', rpcError.message);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_premium: isPremium })
        .eq('id', user.id);

      if (profileError) {
        console.error('[Stripe] Profile fallback update failed', profileError);
        return NextResponse.json(
          { error: 'Membership sync failed. Please contact support.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        syncMode: 'profile_fallback',
        membershipStatus,
        planType,
        isPremium,
      });
    }

    return NextResponse.json({
      success: true,
      syncMode: 'rpc',
      membershipStatus,
      planType,
      isPremium,
    });
  } catch (error) {
    console.error('[Stripe] confirm-checkout failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
