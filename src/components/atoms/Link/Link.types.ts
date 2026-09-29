import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Navigational anchor. Deliberately a plain `<a>`: the router belongs to the page
 * tier, so an app that needs client-side navigation passes `next/link` as the
 * `as` element rather than having every atom depend on a router.
 *
 * @tier atoms
 * @tag navigation
 * @tag typography
 */
export type LinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'className'> & {
  /** Where it goes. */
  href?: string | undefined;
  /**
   * When the underline is drawn. Deliberately NOT `variant`: the contract reserves
   * that word for visual weight, and "always / on hover / never" is a different
   * axis. Naming it `variant` would have quietly widened the shared vocabulary for
   * every component that uses it.
   * @default 'hover'
   */
  underline?: 'always' | 'hover' | 'none' | undefined;
  /**
   * Scale. A link usually sits inside a sentence, so the sentence's size is the
   * right answer far more often than a fixed one.
   * @default inherited from the surrounding text
   */
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | undefined;
  /** Semantic intent. @default 'brand' */
  tone?: 'brand' | 'accent' | 'neutral' | 'muted' | 'danger' | undefined;
  /**
   * Opens in a new tab with `rel="noopener noreferrer"`, and appends
   * {@link LinkProps.externalLabel} for screen readers. @default false
   */
  isExternal?: boolean | undefined;
  /**
   * Screen-reader suffix for an external link. English default; pass a
   * translation. A new tab that opens with no warning is disorienting.
   * @default 'opens in a new tab'
   */
  externalLabel?: string | undefined;
  /** Leading content, typically an icon. */
  startSlot?: ReactNode | undefined;
  /** Trailing content, typically an icon. */
  endSlot?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
