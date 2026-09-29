import type { ComponentPropsWithoutRef } from 'react';

/**
 * Indeterminate busy indicator — work is happening and its duration is unknown.
 * When the duration IS known, use Progress: a spinner that runs for eleven
 * seconds tells the user nothing except that they should keep waiting.
 *
 * @tier atoms
 * @tag feedback
 * @tag loading
 */
export type SpinnerProps = Omit<ComponentPropsWithoutRef<'span'>, 'className'> & {
  /**
   * What is being waited for, announced politely to screen readers. English
   * default; pass a translation. A silent spinner leaves non-sighted users with
   * no signal that anything is happening at all.
   * @default 'Loading'
   */
  label?: string | undefined;
  /** Scale. @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | undefined;
  /** Semantic intent. `current` inherits the surrounding text colour. @default 'current' */
  tone?: 'current' | 'brand' | 'accent' | 'muted' | 'inverse' | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
