import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { AppError } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '../define-route';

const segment = { params: Promise.resolve({}) };

function post(body: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://app.test/api/x', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('defineRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('echoes a fresh requestId header on a success response', async () => {
    const route = defineRoute(({ requestId }) => Promise.resolve(dataResponse({ requestId })));
    const response = await route(post('{}'), segment);
    const body = (await response.json()) as { data: { requestId: string } };

    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe(body.data.requestId);
    expect(body.data.requestId.length).toBeGreaterThan(0);
  });

  it('adopts a well-formed incoming X-Request-Id and ignores a malformed one', async () => {
    const route = defineRoute(({ requestId }) => Promise.resolve(dataResponse({ requestId })));

    const adopted = await route(post('{}', { 'x-request-id': 'edge-abc-123' }), segment);
    expect(adopted.headers.get('x-request-id')).toBe('edge-abc-123');

    const rejected = await route(
      post('{}', { 'x-request-id': 'no spaces allowed <script>' }),
      segment,
    );
    expect(rejected.headers.get('x-request-id')).not.toBe('no spaces allowed <script>');
  });

  it('turns a thrown AppError into the standard error body carrying the same requestId', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const route = defineRoute(() =>
      Promise.reject(new AppError({ code: 'FORBIDDEN', message: 'internal detail' })),
    );
    const response = await route(post('{}', { 'x-request-id': 'edge-abc-123' }), segment);
    const body = (await response.json()) as {
      error: { code: string; message: string; requestId: string };
    };

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.requestId).toBe('edge-abc-123');
    expect(body.error.message).not.toContain('internal detail');
  });

  it('turns an unknown throw into INTERNAL rather than a crash', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const route = defineRoute(() => Promise.reject(new TypeError('boom')));
    const response = await route(post('{}'), segment);

    expect(response.status).toBe(500);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe('INTERNAL');
  });
});

describe('parseJsonBody', () => {
  const schema = z.object({ name: z.string().min(1) });

  it('returns the parsed value for a valid body', async () => {
    expect(await parseJsonBody(post('{"name":"ada"}'), schema)).toEqual({
      ok: true,
      value: { name: 'ada' },
    });
  });

  it('returns VALIDATION_FAILED for malformed JSON instead of throwing', async () => {
    expect(await parseJsonBody(post('{not json'), schema)).toEqual({
      ok: false,
      error: 'VALIDATION_FAILED',
    });
  });

  it('returns VALIDATION_FAILED for a body that fails the schema', async () => {
    expect(await parseJsonBody(post('{"name":""}'), schema)).toEqual({
      ok: false,
      error: 'VALIDATION_FAILED',
    });
  });
});
