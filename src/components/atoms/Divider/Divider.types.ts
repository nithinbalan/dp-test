import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Rule between groups of content. Renders as a `separator` so the break is real
 * for screen-reader users too — a bare bordered `<div>` divides the page visually
 * and is silent to everyone else.
 *
 * Carries no margins. Where the rule sits is the surrounding layout's decision,
 * and a divider that ships its own spacing fights every stack it lands in.
 *
 * @tier atoms
 * @tag layout
 */
export type DividerProps = Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
  /** Axis. `horizontal` divides stacked content; `vertical` divides a row. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical' | undefined;
  /** Weight. @default 'neutral' */
  tone?: 'neutral' | 'strong' | 'subtle' | undefined;
  /**
   * Caption set into the rule — a section kicker. Supplying it makes the divider
   * decorative (`role="presentation"`), because the heading it contains is what
   * now marks the boundary.
   */
  children?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
