import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type BillingPlan = 'monthly' | 'annual';

function resolveOrigin(request: NextRequest): string {
  const explicitOrigin = request.headers.get('origin');
  if (explicitOrigin) {
    return explicitOrigin;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return process.env.URL || 'https://calvia.app';
}

async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { plan?: BillingPlan };
    const plan = body.plan;
    if (plan !== 'monthly' && plan !== 'annual') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId =
      plan === 'monthly'
        ? process.env.STRIPE_PRICE_MONTHLY_ID
        : process.env.STRIPE_PRICE_ANNUAL_ID;

    if (!priceId) {
      return NextResponse.json({ error: 'Missing Stripe price configuration' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const stripe = getStripe();

    const { data: existingMembership } = await supabaseAdmin
      .from('premium_memberships')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let customerId = existingMembership?.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    const origin = resolveOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/bookings?checkout=success`,
      cancel_url: `${origin}/bookings?checkout=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        selected_plan: plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          selected_plan: plan,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] create-checkout-session failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

