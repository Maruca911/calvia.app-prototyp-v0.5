import { NextRequest } from 'next/server';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitRule = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

declare global {
  // eslint-disable-next-line no-var
  var __calviaRateLimitStore: RateLimitStore | undefined;
}

function getRateLimitStore(): RateLimitStore {
  if (!global.__calviaRateLimitStore) {
    global.__calviaRateLimitStore = new Map<string, RateLimitBucket>();
  }
  return global.__calviaRateLimitStore;
}

export function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export function consumeRateLimit(
  key: string,
  rule: RateLimitRule
): RateLimitResult {
  const now = Date.now();
  const store = getRateLimitStore();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + rule.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, rule.max - 1),
      retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  const remaining = Math.max(0, rule.max - existing.count);
  if (existing.count > rule.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
