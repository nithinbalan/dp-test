import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../app-error';
import { errorResponse } from '../handler';

describe('errorResponse', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stamps a requestId on the response and maps status/userMessage from the code', async () => {
    const response = errorResponse('VALIDATION_FAILED');
    const body = (await response.json()) as {
      error: { code: string; message: string; requestId: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(typeof body.error.requestId).toBe('string');
    expect(body.error.requestId.length).toBeGreaterThan(0);
  });

  it('never leaks the internal AppError message into the response body', async () => {
    const response = errorResponse(
      new AppError({ code: 'INTERNAL', message: 'raw internal detail: connection refused' }),
    );
    const body = (await response.json()) as { error: { message: string } };

    expect(body.error.message).not.toContain('connection refused');
  });

  it('logs a 5xx AppError at error level', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    errorResponse(new AppError({ code: 'INTERNAL', message: 'boom' }));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string) as {
      level: string;
      requestId: string;
    };
    expect(logged.level).toBe('error');
    expect(typeof logged.requestId).toBe('string');
  });

  it('logs a 4xx (Expected) failure at warn, not error', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    errorResponse('INVALID_CREDENTIALS');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('gives every call a distinct requestId', async () => {
    const first = (await errorResponse('VALIDATION_FAILED').json()) as {
      error: { requestId: string };
    };
    const second = (await errorResponse('VALIDATION_FAILED').json()) as {
      error: { requestId: string };
    };

    expect(first.error.requestId).not.toBe(second.error.requestId);
  });
});
