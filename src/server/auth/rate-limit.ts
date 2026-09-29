/**
 * Fixed-window rate limiter for auth endpoints (login, password-reset request).
 *
 * Process-local: state lives in a module-level Map, not a shared store, so it does
 * NOT hold a limit across multiple server instances/replicas. It still blunts a
 * single client hammering one instance, which is strictly better than the previous
 * unlimited login/OTP-request endpoints. Replace with a durable (DB- or
 * Redis-backed) limiter before running more than one instance in production — that
 * is a deliberate follow-up, not an oversight; adding a new store here is a bigger
 * decision (new dependency or migration) than this fix warrants on its own.
 * See docs/SECURITY_HYGIENE.md §5.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Sweeps expired buckets so a high-cardinality key (many distinct IPs) can't leak memory. */
let writesSinceSweep = 0;
const SWEEP_EVERY = 500;

function sweepExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Returns `true` (allowed) or `false` (limit exceeded) for `key` within a fixed
 * `windowMs` window capped at `limit` calls. Deterministic given `now` — pass it
 * explicitly in tests instead of relying on the wall clock.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): boolean {
  writesSinceSweep += 1;
  if (writesSinceSweep >= SWEEP_EVERY) {
    writesSinceSweep = 0;
    sweepExpired(now);
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count += 1;
  return true;
}
