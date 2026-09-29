import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checkRateLimit } from '../rate-limit';

/** A fresh key per test avoids cross-test pollution of the module-level bucket map. */
function freshKey(): string {
  return `test:${randomUUID()}`;
}

describe('checkRateLimit', () => {
  it('allows calls up to the limit within the window', () => {
    const key = freshKey();
    const now = 1_000_000;

    expect(checkRateLimit(key, 3, 60_000, now)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000, now)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000, now)).toBe(true);
  });

  it('denies once the limit is exceeded within the window', () => {
    const key = freshKey();
    const now = 1_000_000;

    checkRateLimit(key, 2, 60_000, now);
    checkRateLimit(key, 2, 60_000, now);
    expect(checkRateLimit(key, 2, 60_000, now)).toBe(false);
  });

  it('resets once the window has elapsed', () => {
    const key = freshKey();
    const now = 1_000_000;

    checkRateLimit(key, 1, 60_000, now);
    expect(checkRateLimit(key, 1, 60_000, now)).toBe(false);
    expect(checkRateLimit(key, 1, 60_000, now + 60_001)).toBe(true);
  });

  it('tracks distinct keys independently', () => {
    const keyA = freshKey();
    const keyB = freshKey();
    const now = 1_000_000;

    checkRateLimit(keyA, 1, 60_000, now);
    expect(checkRateLimit(keyA, 1, 60_000, now)).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000, now)).toBe(true);
  });
});
