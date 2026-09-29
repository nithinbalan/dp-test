import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * The product's default surface: a bordered panel on the canvas. Almost every
 * region in the app sits on one, which is exactly why it is an atom — a surface
 * redefined per feature is how two screens end up with different corner radii and
 * nobody can say which is right.
 *
 * Holds only chrome and padding. Headers, footers and toolbars are composed
 * above it, so this never grows a `title` prop that has to be translated.
 *
 * @tier atoms
 * @tag layout
 * @tag surface
 */
export type CardProps = Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
  /** Element to render. Use `section` or `article` when the region is a landmark. @default 'div' */
  as?: 'div' | 'section' | 'article' | 'aside' | 'li' | undefined;
  /** Visual weight. @default 'outline' */
  variant?: 'outline' | 'soft' | 'ghost' | undefined;
  /** Inner padding. `none` for a card whose children own their own edges — a table. @default 'md' */
  size?: 'none' | 'sm' | 'md' | 'lg' | undefined;
  /** Drop shadow. @default 'none' */
  elevation?: 'none' | 'sm' | 'md' | 'lg' | undefined;
  /**
   * Adds hover and focus-within affordances for a card that is itself a link or
   * button. It does NOT make the card clickable — wrap or nest a real control,
   * or the card is unreachable by keyboard.
   * @default false
   */
  isInteractive?: boolean | undefined;
  /** Draws the card in a danger tone, for a destructive-settings panel. @default false */
  isInvalid?: boolean | undefined;
  /** The contents. */
  children?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
