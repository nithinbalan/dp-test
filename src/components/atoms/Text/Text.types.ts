import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Body copy at a token-backed size, weight and tone. Exists so that "secondary
 * caption text" is one decision made once, rather than `text-sm text-fg-muted`
 * retyped in forty places and drifting to `text-xs` in five of them.
 *
 * Carries no copy of its own — the string arrives as `children` from a page that
 * resolved it from the message catalogue.
 *
 * @tier atoms
 * @tag typography
 * @tag data-display
 */
export type TextProps = Omit<ComponentPropsWithoutRef<'p'>, 'className'> & {
  /** Element to render. Pick the one that is semantically true. @default 'p' */
  as?: 'p' | 'span' | 'div' | 'dd' | 'dt' | 'li' | undefined;
  /** Scale. @default 'md' */
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | undefined;
  /** Emphasis within the type scale. @default 'regular' */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | undefined;
  /** Semantic intent. @default 'neutral' */
  tone?:
    | 'neutral'
    | 'muted'
    | 'subtle'
    | 'brand'
    | 'accent'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'inverse'
    | undefined;
  /**
   * Sets the text in the mono face. Use it for machine values — identifiers,
   * timestamps, counts — which is what makes them read as data rather than prose.
   * @default false
   */
  isMono?: boolean | undefined;
  /** Clamps to one line with an ellipsis. Needs a bounded parent to do anything. @default false */
  isTruncated?: boolean | undefined;
  /** The copy. Always passed in — never written inside a component. */
  children?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
