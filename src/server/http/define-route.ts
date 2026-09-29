/**
 * The one shape every Route Handler has. A handler parses input, calls a service,
 * and shapes a response — nothing else (CLAUDE.md "Hard prohibitions"). Everything
 * that is the same for every route lives here instead of being retyped per file:
 *
 *   - a `requestId` minted at ingress (or taken from `X-Request-Id` when a trusted
 *     proxy set one), echoed on every response and threaded into every log line,
 *     so a success and a failure for the same request correlate;
 *   - the catch-all boundary, so a thrown `AppError` (or anything else) becomes the
 *     standard error body rather than a Next.js 500 page;
 *   - body parsing that turns malformed JSON into `VALIDATION_FAILED` (400) instead
 *     of an exception that would surface as `INTERNAL` (500).
 *
 * Usage:
 *   export const POST = defineRoute(async ({ request, requestId }) => { ... });
 */
import { NextResponse, type NextRequest } from 'next/server';
import type { ZodType } from 'zod';
import { errorResponse } from '@server/errors';
import { err, ok, type Result } from '@shared/lib/result';

/** What a route body receives. `params` is Next's dynamic-segment promise, passed through. */
export type RouteContext<P> = {
  readonly request: NextRequest;
  readonly requestId: string;
  readonly params: Promise<P>;
};

type RouteBody<P> = (ctx: RouteContext<P>) => Promise<NextResponse>;

/** Next.js's second Route Handler argument. */
type SegmentContext<P> = { params: Promise<P> };

const REQUEST_ID_HEADER = 'x-request-id';
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

function resolveRequestId(request: NextRequest): string {
  const incoming = request.headers.get(REQUEST_ID_HEADER);
  return incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : globalThis.crypto.randomUUID();
}

/**
 * Wraps a route body with the ingress/egress plumbing described above. The returned
 * function has exactly the signature Next.js expects for a Route Handler export.
 */
export function defineRoute<P = Record<string, never>>(body: RouteBody<P>) {
  return async (request: NextRequest, segment: SegmentContext<P>): Promise<NextResponse> => {
    const requestId = resolveRequestId(request);
    let response: NextResponse;
    try {
      response = await body({ request, requestId, params: segment.params });
    } catch (e) {
      response = errorResponse(e, requestId);
    }
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  };
}

/** The standard success envelope: `{ data }`. */
export function dataResponse(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

/**
 * Reads and validates a JSON body. A body that is not JSON, or does not match the
 * schema, is an Expected failure — the caller's input was wrong — so it comes back
 * as a `Result`, never as a thrown exception.
 */
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<Result<T, 'VALIDATION_FAILED'>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return err('VALIDATION_FAILED');
  }
  const parsed = schema.safeParse(json);
  return parsed.success ? ok(parsed.data) : err('VALIDATION_FAILED');
}
