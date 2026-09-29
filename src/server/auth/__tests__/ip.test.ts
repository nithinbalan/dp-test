import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

async function ipWithHops(hops: number, forwardedFor?: string) {
  vi.resetModules();
  vi.doMock('@shared/config', () => ({ env: { TRUSTED_PROXY_HOPS: hops } }));
  const { getClientIp } = await import('../ip');
  const headers = forwardedFor ? { 'x-forwarded-for': forwardedFor } : {};
  return getClientIp(new NextRequest('http://app.test/api', { headers }));
}

describe('getClientIp', () => {
  afterEach(() => {
    vi.doUnmock('@shared/config');
  });

  it('reads the entry written by the single trusted proxy, not the client-supplied first one', async () => {
    expect(await ipWithHops(1, '6.6.6.6, 203.0.113.9')).toBe('203.0.113.9');
    expect(await ipWithHops(1, '203.0.113.9')).toBe('203.0.113.9');
  });

  it('walks back one entry per trusted hop', async () => {
    expect(await ipWithHops(2, '6.6.6.6, 203.0.113.9, 10.0.0.2')).toBe('203.0.113.9');
  });

  it('believes nothing when the header has fewer entries than trusted hops', async () => {
    expect(await ipWithHops(2, '203.0.113.9')).toBeUndefined();
  });

  it('ignores the header entirely with zero trusted hops', async () => {
    expect(await ipWithHops(0, '203.0.113.9')).toBeUndefined();
  });

  it('returns undefined without a header', async () => {
    expect(await ipWithHops(1)).toBeUndefined();
  });
});
