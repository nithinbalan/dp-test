import type { ReactNode } from 'react';

/**
 * What a region shows when it has nothing to show. Worth building as a component
 * because the three empties look identical and mean different things: nothing
 * created yet (offer the action), nothing matched the filter (offer to clear it),
 * and nothing loaded (offer to retry). A blank box says none of them.
 *
 * @tier molecules
 * @tag feedback
 * @tag data-display
 */
export type EmptyStateProps = {
  /** Headline. Say what is absent, not that a list is empty. */
  label: string;
  /** One or two sentences on what to do about it. */
  description?: string | undefined;
  /** Illustration or icon, drawn in a tinted disc above the headline. */
  startSlot?: ReactNode | undefined;
  /** The way forward — usually one Button, occasionally two. */
  actionSlot?: ReactNode | undefined;
  /** Extra content below the action — a help link, a list of what will be created. */
  children?: ReactNode | undefined;
  /** Semantic intent of the icon disc. @default 'brand' */
  tone?: 'brand' | 'accent' | 'neutral' | 'warning' | 'danger' | 'info' | undefined;
  /**
   * Chrome. `outline` is a dashed standalone card; `ghost` has none, for the body
   * of a table that already draws its own border and radius.
   * @default 'outline'
   */
  variant?: 'outline' | 'ghost' | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
