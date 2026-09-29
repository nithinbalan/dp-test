'use client';

/**
 * Subscribes a view to the mock source register.
 *
 * `useSyncExternalStore` rather than `useState` seeded from props, because the
 * register outlives any one screen: the Add Source wizard is a different route,
 * and the row it creates has to be on the register by the time the user lands
 * back on it. See `@shared/mock/data-sources-store`.
 */
import { useSyncExternalStore } from 'react';
import type { DataSource } from '@shared/mock/data-sources';
import {
  getSourcesServerSnapshot,
  getSourcesSnapshot,
  subscribeToSources,
} from '@shared/mock/data-sources-store';

export function useDataSources(): readonly DataSource[] {
  return useSyncExternalStore(subscribeToSources, getSourcesSnapshot, getSourcesServerSnapshot);
}
