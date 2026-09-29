/**
 * Resolving a request's locale.
 *
 * The strategy is configuration, not a hardcoded choice — mirroring
 * `WORKSPACE_RESOLUTION_STRATEGY`, because the same reasoning applies: the decision
 * is a product one, it may change, and it should change in one place.
 *
 *   path    /de/settings           shareable, cacheable, survives a copied link
 *   cookie  user preference        no URL change; better for an app behind login
 *   header  Accept-Language only   zero user control; acceptable for marketing only
 *
 * Workspace is resolved by subdomain, so a path prefix does not collide with it.
 */
import { DEFAULT_LOCALE, isLocale, LOCALE_RESOLUTION, type Locale } from '@shared/types/locale';
import { negotiateLocale } from './direction';

export type LocaleResolution = {
  readonly locale: Locale;
  /** The path with any locale prefix removed, for downstream routing. */
  readonly pathname: string;
  /** True when the URL should be rewritten to carry the locale. */
  readonly shouldRedirect: boolean;
  readonly redirectTo: string | null;
};

/** Split `/de/settings` into its locale and the rest. */
export function splitLocalePath(pathname: string): { locale: Locale | null; rest: string } {
  const [, first = '', ...others] = pathname.split('/');
  if (isLocale(first)) {
    return { locale: first, rest: `/${others.join('/')}` };
  }
  return { locale: null, rest: pathname };
}

export function resolveLocale(input: {
  pathname: string;
  cookie?: string | undefined;
  acceptLanguage?: string | null | undefined;
}): LocaleResolution {
  const { locale: fromPath, rest } = splitLocalePath(input.pathname);

  if (LOCALE_RESOLUTION.strategy === 'path') {
    if (fromPath) {
      return { locale: fromPath, pathname: rest, shouldRedirect: false, redirectTo: null };
    }
    // No prefix: pick the best locale and send the user to its canonical URL, so
    // the address bar always shows what is actually being rendered.
    const preferred =
      input.cookie && isLocale(input.cookie) ? input.cookie : negotiateLocale(input.acceptLanguage);

    const needsPrefix = LOCALE_RESOLUTION.prefixDefaultLocale || preferred !== DEFAULT_LOCALE;
    return {
      locale: preferred,
      pathname: input.pathname,
      shouldRedirect: needsPrefix,
      redirectTo: needsPrefix
        ? `/${preferred}${input.pathname === '/' ? '' : input.pathname}`
        : null,
    };
  }

  if (LOCALE_RESOLUTION.strategy === 'cookie') {
    const locale =
      input.cookie && isLocale(input.cookie) ? input.cookie : negotiateLocale(input.acceptLanguage);
    return { locale, pathname: input.pathname, shouldRedirect: false, redirectTo: null };
  }

  return {
    locale: negotiateLocale(input.acceptLanguage),
    pathname: input.pathname,
    shouldRedirect: false,
    redirectTo: null,
  };
}
