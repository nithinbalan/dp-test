/**
 * Route handler boundary error response utility.
 * Formats AppError and unexpected failures into the standard response shape:
 * { error: { code, message, requestId } }
 *
 * See docs/ERROR_HANDLING.md §5 and §6.
 */
import { NextResponse } from 'next/server';
import { logger } from '@shared/lib/logger';
import { AppError, toAppError } from './app-error';
import { ERROR_CODES, type ErrorCode } from './codes';

const isErrorCode = (value: string): value is ErrorCode => value in ERROR_CODES;

/**
 * Formats an error or error code into a standard JSON HTTP response with appropriate
 * status, logging it once and stamping a `requestId` that ties the response to the
 * log line — the only thing that lets a user report be traced back. Pass the id the
 * request was assigned at ingress (see `defineRoute`) so the error line correlates
 * with everything else logged for that request; one is minted if absent. A 5xx is
 * an Unexpected failure (bug or broken dependency) and is logged at `error`; a 4xx
 * is an Expected outcome (bad input, denied access) and is logged at `warn` so it
 * stays visible for abuse monitoring without paging anyone.
 * See docs/ERROR_HANDLING.md §1, §7.
 */
export function errorResponse(codeOrError: unknown, requestId?: string): NextResponse {
  const appError =
    typeof codeOrError === 'string' && isErrorCode(codeOrError)
      ? new AppError({ code: codeOrError, message: `Route returned ${codeOrError}` })
      : toAppError(codeOrError);

  const id = requestId ?? globalThis.crypto.randomUUID();
  const logFields = {
    code: appError.code,
    status: appError.status,
    requestId: id,
    cause: appError.cause instanceof Error ? appError.cause.message : undefined,
  };

  // `context` is deliberately not logged here: it can carry values (identifiers,
  // free-text input) that have not been through an allowlist redaction pass at
  // this generic boundary. See docs/SECURITY_HYGIENE.md §6.
  if (appError.status >= 500) {
    logger.error(appError.message, logFields);
  } else {
    logger.warn(appError.message, logFields);
  }

  return NextResponse.json(
    {
      error: {
        code: appError.code,
        message: appError.userMessage,
        requestId: id,
      },
    },
    { status: appError.status },
  );
}
