import { getTranslator } from '@shared/lib';
import { DEFAULT_LOCALE } from '@shared/types/locale';

/**
 * `not-found` cannot receive route params, so it renders in the default locale.
 * That is a known limitation of the App Router, not an oversight — a 404 for an
 * unrecognised path has no reliable locale to render in.
 */
export default function NotFound() {
  const t = getTranslator(DEFAULT_LOCALE, 'errors');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-lg font-semibold">{t('notFoundTitle')}</h1>
      <p className="text-fg-muted">{t('notFoundBody')}</p>
    </main>
  );
}
