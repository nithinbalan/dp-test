'use client';

/**
 * Client error boundary. Boundary #2 in docs/ERROR_HANDLING.md §5.
 * Never renders `error.message` — internal detail must not reach a user (§6).
 *
 * Next does not pass route params to `error.tsx`, so the locale comes from
 * `<html lang>` (server-rendered by the layout) rather than from props.
 */
import { Button } from '@atoms/Button';
import { getTranslator } from '@shared/lib';
import { useLocale } from '@shared/hooks';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = getTranslator(useLocale(), 'errors');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-lg font-semibold">{t('title')}</h1>
      <p className="text-fg-muted">{t('body')}</p>
      <Button onClick={reset}>{t('retry')}</Button>
    </main>
  );
}
