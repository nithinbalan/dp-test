import type { ReactNode } from 'react';

/**
 * Structure for every signed-in screen: a fixed sidebar, a topbar, and a
 * scrollable content region. Pure layout — no navigation state, no data; the
 * page composes `AppSidebar`/`AppTopbar` (organisms) into the slots.
 *
 * @tier templates
 * @tag layout
 */
export type AppShellProps = {
  /** The `AppSidebar`. */
  sidebarSlot: ReactNode;
  /** The `AppTopbar`. */
  topbarSlot: ReactNode;
  /** The current route's content. */
  children: ReactNode;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
