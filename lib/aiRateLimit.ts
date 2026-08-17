/**
 * IP-based AI rate limiter for shared office egress IPs.
 *
 * WARNING: This in-memory store is per-process. On multi-instance deployments
 * (e.g. Vercel serverless), limits are not globally consistent.
 * TODO: Move to Redis / Upstash (or similar) for production multi-instance limits.
 * TODO: Move to per-device or per-authenticated-user rate limits if employee accounts are reintroduced.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getLimits() {
  const requests = Number(process.env.AI_RATE_LIMIT_REQUESTS ?? "30");
  const windowSeconds = Number(process.env.AI_RATE_LIMIT_WINDOW_SECONDS ?? "600");
  return {
    requests: Number.isFinite(requests) && requests > 0 ? requests : 30,
    windowMs:
      Number.isFinite(windowSeconds) && windowSeconds > 0
        ? windowSeconds * 1000
        : 600_000,
  };
}

export function checkAiRateLimit(ip: string | null): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const key = ip ?? "unknown";
  const { requests, windowMs } = getLimits();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: requests - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= requests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, requests - existing.count),
    retryAfterSeconds: 0,
  };
}
