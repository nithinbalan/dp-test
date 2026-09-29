/**
 * Common "entries per page" choices for a paginated table footer. Shared so
 * every table offers the same set instead of each list page inventing its own —
 * a table with 10/25/50 next to one with 10/20/40 reads as two different
 * products built by two different teams.
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/** One of {@link PAGE_SIZE_OPTIONS}. */
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
