import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Section title. `level` and `size` are separate props on purpose: document
 * outline and visual scale are different problems, and welding them together is
 * what forces people to pick an `<h4>` because they wanted smaller text — which
 * silently breaks heading navigation for screen-reader users.
 *
 * @tier atoms
 * @tag typography
 */
export type HeadingProps = Omit<ComponentPropsWithoutRef<'h2'>, 'className'> & {
  /** Document outline level — renders h1…h6. Pick by position in the page, not by size. @default 2 */
  level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  /**
   * Visual scale.
   * @default derived from `level` — 2xl for h1 down to sm for h5/h6
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | undefined;
  /** Semantic intent. @default 'neutral' */
  tone?: 'neutral' | 'muted' | 'brand' | 'accent' | 'danger' | 'inverse' | undefined;
  /** The copy. Always passed in — never written inside a component. */
  children?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
