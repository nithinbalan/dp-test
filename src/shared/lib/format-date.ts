/**
 * `Date.prototype.toLocaleDateString()` with no arguments resolves the ICU
 * default locale and time zone at call time. Node's SSR process and the
 * browser can (and do) disagree on that default, so the same `Date` formats
 * to two different strings on the server and on the client — a React
 * hydration mismatch. Pinning both arguments makes the output identical on
 * both sides.
 *
 * Not locale-aware yet: every call site here renders inside a Client
 * Component with no access to the request locale, only a plain `string`
 * timestamp prop. `en-GB` (day/month/year) is the fixed default until that
 * plumbing exists.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { timeZone: 'UTC' });
}
