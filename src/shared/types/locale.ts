/* GENERATED from design-system/locales.json by `pnpm ds:i18n`. Do not edit. */

/**
 * Supported locales and their writing direction.
 *
 * Direction is data, never a hardcoded assumption. Any code that branches on
 * `dir === 'rtl'` should first ask whether a CSS logical property would do the
 * job instead — it almost always will, and it works without a runtime check.
 */

export type Direction = 'ltr' | 'rtl';

export type Locale = 'en' | 'ar' | 'de';

export const DEFAULT_LOCALE: Locale = 'en';

export type LocaleMeta = {
  readonly name: string;
  readonly nativeName: string;
  readonly dir: Direction;
  readonly fontFamily: string;
  readonly numberingSystem: string;
};

export const LOCALES: Readonly<Record<Locale, LocaleMeta>> = {
  en: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    fontFamily: 'sans',
    numberingSystem: 'latn',
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    fontFamily: 'arabic',
    numberingSystem: 'latn',
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    dir: 'ltr',
    fontFamily: 'sans',
    numberingSystem: 'latn',
  },
} as const;

export const LOCALE_CODES = Object.keys(LOCALES) as readonly Locale[];

/** How a request's locale is resolved. Mirrors WORKSPACE_RESOLUTION_STRATEGY. */
export type LocaleResolutionStrategy = 'path' | 'cookie' | 'header';

export type LocaleResolutionConfig = {
  readonly strategy: LocaleResolutionStrategy;
  readonly cookieName: string;
  /** Request header middleware forwards the resolved locale on, for this same
   * request's Server Components — reading it needs no round trip for the
   * Set-Cookie below to reach the browser first. */
  readonly headerName: string;
  readonly prefixDefaultLocale: boolean;
};

/**
 * Annotated with the widened type ON PURPOSE. Emitting `as const` would give
 * `strategy` the literal type of whatever is configured today, making every
 * other branch provably dead code — which defeats the point of the setting
 * being configurable, and means switching it would not typecheck.
 */
export const LOCALE_RESOLUTION: LocaleResolutionConfig = {
  strategy: 'cookie',
  cookieName: 'jethur-locale',
  headerName: 'x-jethur-locale',
  prefixDefaultLocale: false,
};

/** Narrow an untrusted string (URL segment, header) to a supported locale. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in LOCALES;
}

/** Writing direction for a locale. Falls back to the default rather than throwing. */
export function directionOf(locale: string): Direction {
  return isLocale(locale) ? LOCALES[locale].dir : LOCALES[DEFAULT_LOCALE].dir;
}
