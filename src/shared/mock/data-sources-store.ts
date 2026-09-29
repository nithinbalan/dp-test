/**
 * MOCK STORE — the client-side stand-in for the source register a real backend
 * would own.
 *
 * It exists because connecting a source is not a single-screen action: the wizard
 * lives on `/data-sources/add` and the row it creates — with its first scan still
 * running — appears on `/data-sources`. Component state cannot survive that
 * navigation, so the register lives in the module instead and every view
 * subscribes to it. When a real API lands, this file becomes the fetcher behind a
 * TanStack Query hook (docs/TANSTACK_QUERY.md) and the views do not change.
 *
 * Deliberately React-free: `use-data-sources.ts` is the only place that adapts it
 * to `useSyncExternalStore`.
 */
import { DATA_SOURCES, type DataSource } from './data-sources';

/**
 * Stable identity for the server render. `useSyncExternalStore` compares
 * snapshots by reference, so this must be the same array on every server call or
 * the render loops.
 */
const SERVER_SNAPSHOT: readonly DataSource[] = DATA_SOURCES;

let snapshot: readonly DataSource[] = DATA_SOURCES;
const listeners = new Set<() => void>();

function emit(next: readonly DataSource[]): void {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribeToSources(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSourcesSnapshot(): readonly DataSource[] {
  return snapshot;
}

export function getSourcesServerSnapshot(): readonly DataSource[] {
  return SERVER_SNAPSHOT;
}

/** Newest first — a source you just connected belongs at the top of the register. */
export function addSource(source: DataSource): void {
  emit([source, ...snapshot]);
}

/**
 * Patches one source anywhere in the register, including a cloud account's
 * discovered children. Rebuilds the branch it touches and reuses every other
 * node, so an unrelated row does not re-render because a sibling finished a scan.
 */
export function patchSource(id: string, patch: Partial<DataSource>): void {
  emit(
    snapshot.map((source) => {
      if (source.id === id) return { ...source, ...patch };
      const children = source.children;
      if (!children?.some((child) => child.id === id)) return source;
      return {
        ...source,
        children: children.map((child) => (child.id === id ? { ...child, ...patch } : child)),
      };
    }),
  );
}

/** Test-only: puts the module back to its seed so cases cannot leak into each other. */
export function resetSources(): void {
  emit(DATA_SOURCES);
}
