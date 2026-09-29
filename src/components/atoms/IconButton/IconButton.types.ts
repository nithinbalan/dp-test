import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Square action control whose only content is an icon. A separate component from
 * Button rather than a variant of it because of one prop: `label` is REQUIRED
 * here. An icon-only Button has no accessible name, and the failure is invisible
 * to everyone who is not using a screen reader — so the type system asks for the
 * name instead of a review catching it.
 *
 * @tier atoms
 * @tag action
 */
export type IconButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'className'> & {
  /**
   * Accessible name — what the control DOES ("Delete record"), not what the glyph
   * looks like. Required: there is no visible text to fall back on.
   */
  label: string;
  /** The glyph. Rendered `aria-hidden`, since `label` already names the control. */
  children?: ReactNode | undefined;
  /** Visual weight. @default 'ghost' */
  variant?: 'solid' | 'soft' | 'outline' | 'ghost' | undefined;
  /** Scale. @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | undefined;
  /** Silhouette. @default 'rounded' */
  shape?: 'rounded' | 'circle' | undefined;
  /** Semantic intent. @default 'neutral' */
  tone?: 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | undefined;
  /** Disables interaction. @default false */
  isDisabled?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
