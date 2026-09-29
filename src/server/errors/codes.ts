/**
 * The closed error-code union. Adding a code is deliberate: it gets an HTTP
 * status AND a user-facing message at the same time, in this file.
 * See docs/ERROR_HANDLING.md §2.
 */
export const ERROR_CODES = {
  // input
  VALIDATION_FAILED: { status: 400, userMessage: 'Some of the information provided is not valid.' },
  // authn / authz
  UNAUTHENTICATED: { status: 401, userMessage: 'Please sign in to continue.' },
  INVALID_CREDENTIALS: { status: 401, userMessage: 'Invalid email or password.' },
  INVALID_CODE: { status: 400, userMessage: 'Invalid or expired verification code.' },
  EXPIRED_CODE: { status: 400, userMessage: 'The verification code has expired.' },
  TOO_MANY_ATTEMPTS: { status: 429, userMessage: 'Too many attempts. Please try again later.' },
  FORBIDDEN: { status: 403, userMessage: 'You do not have access to this.' },
  // workspace isolation
  WORKSPACE_NOT_FOUND: { status: 404, userMessage: 'That workspace could not be found.' },
  WORKSPACE_ACCESS_DENIED: {
    status: 403,
    userMessage: 'You do not have access to this workspace.',
  },
  WORKSPACE_CONTEXT_MISSING: {
    status: 500,
    userMessage: 'Something went wrong. Please try again.',
  },
  WORKSPACE_CONTEXT_CONFLICT: {
    status: 500,
    userMessage: 'Something went wrong. Please try again.',
  },
  // resources
  NOT_FOUND: { status: 404, userMessage: 'That item could not be found.' },
  CONFLICT: { status: 409, userMessage: 'That change conflicts with the current state.' },
  RATE_LIMITED: { status: 429, userMessage: 'Too many requests. Please slow down.' },
  // infrastructure
  DB_QUERY_FAILED: { status: 500, userMessage: 'Something went wrong. Please try again.' },
  UPSTREAM_FAILED: { status: 502, userMessage: 'A service we depend on is unavailable.' },
  INTERNAL: { status: 500, userMessage: 'Something went wrong. Please try again.' },
} as const;

/**
 * Every failure the system can name. Closed on purpose: an error that is not in
 * this union cannot be mapped to a status or a user message, so it cannot leak
 * an unhandled shape to a caller.
 */
export type ErrorCode = keyof typeof ERROR_CODES;

/** HTTP status for a code. Used by the boundary handler; never chosen ad hoc. */
export const statusFor = (code: ErrorCode): number => ERROR_CODES[code].status;
/**
 * The safe, human-facing message for a code. This — never `error.message` — is what
 * reaches a user, so internal detail cannot leak. See docs/ERROR_HANDLING.md §6.
 */
export const userMessageFor = (code: ErrorCode): string => ERROR_CODES[code].userMessage;
