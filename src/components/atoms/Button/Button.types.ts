import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Trigger for a user action. The reference implementation of the API contract —
 * every new atom is generated with this as a few-shot example, so its prop
 * vocabulary and structure are load-bearing beyond this component.
 *
 * @tier atoms
 * @tag action
 * @tag form
 */
export type ButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'className'> & {
  /** Visual weight. @default 'solid' */
  variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'link' | undefined;
  /** Scale. @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
  /**
   * Semantic intent. `accent` is the lime highlight — reserve it for a single
   * deliberate emphasis per screen, never as a second primary.
   * @default 'neutral'
   */
  tone?: 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | undefined;
  /** Shows a spinner and blocks interaction. @default false */
  isLoading?: boolean | undefined;
  /** Disables interaction. @default false */
  isDisabled?: boolean | undefined;
  /** Fills the container's inline axis. @default false */
  fullWidth?: boolean | undefined;
  /** Leading content, typically an icon. Replaced by the spinner while loading. */
  startSlot?: ReactNode | undefined;
  /** Trailing content, typically an icon. */
  endSlot?: ReactNode | undefined;
  /**
   * Renders the button's styling onto its single child instead of a
   * `<button>` — e.g. `<Button asChild><Link href="/x">…</Link></Button>`
   * for a link that must look like a button. The child owns the element and
   * its own semantics; `type`/`isDisabled`/`isLoading` still apply visually.
   * @default false
   */
  asChild?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
