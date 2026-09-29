/**
 * Writing direction helpers.
 *
 * Direction is DATA, resolved from the locale — never a hardcoded assumption and
 * never a build-time constant. Before reaching for any of this, check whether a CSS
 * logical property (`ms-*`, `text-start`, `border-s`) solves the problem instead:
 * logical properties need no runtime branch and cannot be forgotten in one place.
 *
 * Legitimate uses are narrow: mirroring a directional glyph, computing a drag delta,
 * choosing a keyboard arrow direction, or positioning a floating element.
 */
import {
  DEFAULT_LOCALE,
  LOCALES,
  directionOf,
  isLocale,
  type Direction,
  type Locale,
} from '@shared/types/locale';

export { DEFAULT_LOCALE, LOCALES, directionOf, isLocale, type Direction, type Locale };

/**
 * Pick the best supported locale from an `Accept-Language` header.
 * Falls back to the default rather than throwing — an unknown language is a normal
 * condition, not an error.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split('=')[1]) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (isLocale(tag)) return tag;
    // `ar-SA` should match the `ar` locale.
    const base = tag.split('-')[0];
    if (base !== undefined && isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/**
 * Multiplier for turning a logical offset into a physical one.
 * `+1` in LTR, `-1` in RTL — for drag deltas and transforms, where CSS logical
 * properties do not apply.
 */
export const directionSign = (dir: Direction): 1 | -1 => (dir === 'rtl' ? -1 : 1);
