/**
 * The request's resolved locale, for Server Components under the `cookie`
 * resolution strategy — there is no `[locale]` route segment to read it from.
 *
 * Reads the header middleware forwards (`LOCALE_RESOLUTION.headerName`), set from
 * the same cookie/Accept-Language negotiation `resolveLocale()` runs — never the
 * cookie directly, because a first-time visit resolves a locale on this exact
 * request before the matching Set-Cookie has round-tripped back from the browser.
 * See docs/INTERNATIONALIZATION.md §3.
 */
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_RESOLUTION, type Locale } from '@shared/types/locale';

export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_RESOLUTION.headerName);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
