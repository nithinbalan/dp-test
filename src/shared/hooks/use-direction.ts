'use client';

/**
 * The active writing direction, read from the document.
 *
 * Reads `dir` off `<html>` rather than taking it as a prop, so it is correct for
 * any subtree without threading the locale through every component. Server-rendered
 * markup already carries `dir`, so there is no flash and no hydration mismatch.
 */
import { useSyncExternalStore } from 'react';
import type { Direction } from '@shared/types/locale';

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
  return () => {
    observer.disconnect();
  };
}

const getSnapshot = (): Direction =>
  document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr';

/** SSR renders from the locale, and the markup already has `dir`, so ltr is a safe base. */
const getServerSnapshot = (): Direction => 'ltr';

export function useDirection(): Direction {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
