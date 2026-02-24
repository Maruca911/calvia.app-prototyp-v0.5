export const isBookingsEnabled =
  process.env.NEXT_PUBLIC_FEATURE_BOOKINGS === 'true';

export const isConciergeEnabled =
  process.env.NEXT_PUBLIC_FEATURE_CONCIERGE === 'true';

// Billing is kept in code for v2, but disabled by default for v1-free rollout.
export const isBillingEnabled =
  process.env.NEXT_PUBLIC_FEATURE_BILLING === 'true';
