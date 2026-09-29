/**
 * Environment validation. The app REFUSES TO BOOT on a missing or malformed
 * variable — a Fatal failure per docs/ERROR_HANDLING.md §1. Degrading gracefully
 * on bad config means shipping a half-configured app to production.
 *
 * Every variable in .env.example must appear here.
 */
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url(),
  /** Separate, higher-privilege role. NEVER available to request-handling code. */
  DATABASE_MIGRATION_URL: z.string().url().optional(),

  WORKSPACE_RESOLUTION_STRATEGY: z.enum(['subdomain', 'path', 'header']).default('subdomain'),
  APP_BASE_DOMAIN: z.string().min(1),

  /**
   * How many trailing `X-Forwarded-For` entries were written by proxies we control.
   * 0 = trust no forwarded header (rate limits fall back to per-identifier only).
   */
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(1),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    // Fatal: intentionally not an AppError — nothing downstream can handle this.
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env: Env = load();
