import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function toIsoOrNull(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) {
    return null;
  }
  return new Date(unixSeconds * 1000).toISOString();
}

function mapPlanType(priceId: string | null | undefined, interval?: string): 'monthly' | 'annual' {
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

function mapMembershipStatus(status: Stripe.Subscription.Status): 'active' | 'cancelled' | 'expired' {
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return 'active';
  }
  if (status === 'canceled') {
    return 'cancelled';
  }
  return 'expired';
}

async function resolveSupabaseUserId(
  subscription: Stripe.Subscription,
  stripe: Stripe
): Promise<string | null> {
  const metadataUserId = subscription.metadata?.supabase_user_id;
  if (metadataUserId) {
    return metadataUserId;
  }

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    return null;
  }

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    return null;
  }

  return customer.metadata?.supabase_user_id || null;
}

async function syncMembership(subscription: Stripe.Subscription) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  const userId = await resolveSupabaseUserId(subscription, stripe);
  if (!userId) {
    console.warn('[Stripe webhook] Missing supabase_user_id for subscription', subscription.id);
    return;
  }

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id || null;
  const interval = firstItem?.price?.recurring?.interval;
  const planType = mapPlanType(priceId, interval);
  const membershipStatus = mapMembershipStatus(subscription.status);
  const isPremium = subscription.status === 'active' || subscription.status === 'trialing';
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  const payload = {
    user_id: userId,
    plan_type: planType,
    status: membershipStatus,
    started_at: toIsoOrNull(subscription.start_date) || new Date().toISOString(),
    expires_at: toIsoOrNull(subscription.current_period_end),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    current_period_start: toIsoOrNull(subscription.current_period_start),
    current_period_end: toIsoOrNull(subscription.current_period_end),
    canceled_at: toIsoOrNull(subscription.canceled_at),
    updated_at: new Date().toISOString(),
  };

  const { data: existingBySubscription } = await supabaseAdmin
    .from('premium_memberships')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (existingBySubscription?.id) {
    await supabaseAdmin.from('premium_memberships').update(payload).eq('id', existingBySubscription.id);
  } else {
    const { data: existingByUser } = await supabaseAdmin
      .from('premium_memberships')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingByUser?.id) {
      await supabaseAdmin.from('premium_memberships').update(payload).eq('id', existingByUser.id);
    } else {
      await supabaseAdmin.from('premium_memberships').insert(payload);
    }
  }

  await supabaseAdmin.from('profiles').update({ is_premium: isPremium }).eq('id', userId);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('[Stripe webhook] Signature verification failed', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncMembership(subscription);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncMembership(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncMembership(subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('[Stripe webhook] Handler error', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

