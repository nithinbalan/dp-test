/**
 * The ONLY throwable in this codebase. See docs/ERROR_HANDLING.md §2.
 * `local/error-handling-contract` lint-bans `throw new Error(...)` in src/**.
 */
import { type ErrorCode, statusFor, userMessageFor } from './codes';

/** Construction shape for {@link AppError}. */
export type AppErrorInit = {
  code: ErrorCode;
  /** Internal, engineer-facing. NEVER rendered to a user. */
  message: string;
  /** Always chain. A stack that stops at your rethrow is worthless. */
  cause?: unknown;
  /** Structured detail. Redacted before logging — see docs/SECURITY_HYGIENE.md §5. */
  context?: Readonly<Record<string, unknown>>;
};

/**
 * The only throwable in this codebase.
 *
 * Carries a classifiable `code`, an HTTP `status`, and a `userMessage` that is safe
 * to render — so a boundary can respond correctly without inspecting the message
 * text, and internal detail never escapes. Throwing a bare `Error` is lint-banned
 * by `local/error-handling-contract`. See docs/ERROR_HANDLING.md §2.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly userMessage: string;
  readonly context: Readonly<Record<string, unknown>>;

  constructor(init: AppErrorInit) {
    super(init.message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'AppError';
    this.code = init.code;
    this.status = statusFor(init.code);
    this.userMessage = userMessageFor(init.code);
    this.context = init.context ?? {};
  }
}

/** Type guard for a caught `unknown`. Prefer {@link toAppError} unless you only need the test. */
export const isAppError = (e: unknown): e is AppError => e instanceof AppError;

/**
 * A failure raised by the Postgres driver (`postgres` package). Recognised by shape
 * rather than by class so this module stays free of any database import — the
 * errors layer sits below the isolation layer, not beside it.
 */
function isDatabaseError(e: unknown): e is Error {
  return e instanceof Error && e.name === 'PostgresError';
}

/**
 * Narrow an `unknown` catch binding into an AppError. This is the ONLY sanctioned
 * way to handle a caught value — never inspect `e` by hand. A raw database error
 * becomes `DB_QUERY_FAILED` so a broken query reads as one in logs and alerts
 * instead of vanishing into `INTERNAL`.
 */
export function toAppError(e: unknown, fallbackCode: ErrorCode = 'INTERNAL'): AppError {
  if (isAppError(e)) return e;
  if (isDatabaseError(e)) {
    return new AppError({ code: 'DB_QUERY_FAILED', message: e.message, cause: e });
  }
  return new AppError({
    code: fallbackCode,
    message: e instanceof Error ? e.message : 'Unknown error',
    cause: e,
  });
}
