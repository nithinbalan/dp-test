import type { ComponentPropsWithoutRef } from 'react';

/**
 * Placeholder shaped like the content that is about to replace it. Worth having
 * over a spinner only when it matches the real layout — a skeleton whose blocks
 * sit somewhere else than the loaded content causes a visible jump, which is more
 * jarring than an empty box would have been.
 *
 * Hidden from assistive technology. Screen readers should hear the region's own
 * busy state, not a description of grey rectangles.
 *
 * @tier atoms
 * @tag feedback
 * @tag loading
 */
export type SkeletonProps = Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
  /** Silhouette of the content being stood in for. @default 'rounded' */
  shape?: 'rounded' | 'circle' | 'square' | undefined;
  /**
   * Line height for a text placeholder.
   * @default unset — height comes from the caller's own classes, because only the
   * caller knows the shape of the content being stood in for
   */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Repeats the placeholder, for a multi-line block. @default 1 */
  lines?: number | undefined;
  /** Turns off the shimmer, for a page that renders many at once. @default true */
  isAnimated?: boolean | undefined;
  /** Merged last, so consumers can override — this is where width comes from. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
