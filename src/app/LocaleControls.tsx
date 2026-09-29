'use client';

/**
 * Client island holding the theme and language controls.
 *
 * Changing language is a COOKIE WRITE, not a navigation: under the `cookie`
 * resolution strategy there is no per-locale route to redirect to. `router.refresh()`
 * re-fetches this same route's Server Components, which read the new value via the
 * header middleware forwards from the cookie (see @shared/lib/request-locale) — so
 * translated copy, `lang` and `dir` all update together once the response lands.
 */
import { useRouter } from 'next/navigation';
import { LocaleSwitcher } from '@molecules/LocaleSwitcher';
import { ThemeToggle } from '@molecules/ThemeToggle';
import { LOCALE_RESOLUTION, type Locale } from '@shared/types/locale';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LocaleControls({
  current,
  themeLabel,
  localeLabel,
}: {
  current: Locale;
  themeLabel: string;
  localeLabel: string;
}) {
  const router = useRouter();

  return (
    <>
      <LocaleSwitcher
        current={current}
        label={localeLabel}
        size="sm"
        onValueChange={(next: Locale) => {
          // Non-httpOnly by design (middleware.ts) — this is the one legitimate
          // client writer. Same name/path/maxAge middleware uses, so either side
          // setting it keeps the other in sync.
          document.cookie = `${LOCALE_RESOLUTION.cookieName}=${next}; path=/; max-age=${String(COOKIE_MAX_AGE)}; samesite=lax`;
          router.refresh();
        }}
      />
      <ThemeToggle size="sm" messages={{ label: themeLabel }} />
    </>
  );
}
