import type { ReactNode } from 'react';

/**
 * One number and what it means. The unit a dashboard is built from — a row of
 * these is the first thing on almost every screen in the product.
 *
 * The value is a ReactNode, not a number: the caller formats it, because
 * thousands separators, currency and digit shapes are all locale decisions that
 * belong with `Intl`, not with a display component.
 *
 * @tier molecules
 * @tag data-display
 * @tag dashboard
 */
export type StatCardProps = {
  /** What the number measures. Set small and uppercase, under the value. */
  label: string;
  /** The number itself, already formatted for the reader's locale. */
  value: ReactNode;
  /** Extra context under the label — a comparison, a period, a caveat. */
  description?: string | undefined;
  /**
   * Semantic intent of the VALUE. Use it when the number itself is good or bad
   * news; leave it neutral when it is only a count.
   * @default 'neutral'
   */
  tone?: 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | undefined;
  /** Scale. `xs` is for a compact inline row of many tiles that should hug
   * their own content rather than stretch — a detail page's stat strip
   * rather than a dashboard's headline numbers. @default 'md' */
  size?: 'xs' | 'sm' | 'md' | undefined;
  /** Leading icon on the label row. */
  startSlot?: ReactNode | undefined;
  /** Trailing content on the value row — a delta, a Badge, a sparkline. */
  endSlot?: ReactNode | undefined;
  /** Adds hover and focus affordances for a card that links somewhere. @default false */
  isInteractive?: boolean | undefined;
  /** Swaps the value for a placeholder while the number is being fetched. @default false */
  isLoading?: boolean | undefined;
  /**
   * Screen-reader text for the loading placeholder. English default; pass a
   * translation. @default 'Loading'
   */
  loadingLabel?: string | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
