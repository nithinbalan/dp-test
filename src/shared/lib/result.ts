/**
 * Result — how EXPECTED failures travel. See docs/ERROR_HANDLING.md §3.
 *
 * Expected failures are data, not exceptions. Returning them forces the caller
 * to branch, and `switch-exhaustiveness-check` makes the compiler verify every
 * branch is handled. Throwing for a 404 loses that guarantee entirely.
 */
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E extends string> = { readonly ok: false; readonly error: E };
export type Result<T, E extends string> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E extends string>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E extends string>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E extends string>(r: Result<T, E>): r is Err<E> => !r.ok;

/** Unwrap or throw — only legal at a boundary that already handled the failure case. */
export function unwrap<T, E extends string>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw new Error(`unwrap() on Err: ${r.error}`);
}
