'use client';

/**
 * The active locale, read from `<html lang>`.
 *
 * Client components that cannot receive route params — Next's `error.tsx` is the
 * main one — still need to translate. The layout server-renders `lang`, so reading
 * it is accurate on first paint and needs no context provider threaded through the
 * tree.
 *
 * Prefer passing a translator down from a Server Component where you can. This is
 * for the places the framework does not let you.
 */
import { useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@shared/types/locale';

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  return () => {
    observer.disconnect();
  };
}

function getSnapshot(): Locale {
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

const getServerSnapshot = (): Locale => DEFAULT_LOCALE;

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
