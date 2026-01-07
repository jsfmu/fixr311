const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 10;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (bucket && bucket.resetAt > now) {
    if (bucket.count >= MAX_REQUESTS) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      return { ok: false, retryAfter };
    }
    bucket.count += 1;
    return { ok: true };
  }

  buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  return { ok: true };
}

export function getRateLimitWindowMs() {
  return WINDOW_MS;
}

