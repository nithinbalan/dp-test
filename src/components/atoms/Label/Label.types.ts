import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Caption for a form control. Renders a real `<label>` bound by `htmlFor`, which
 * is what makes clicking the caption focus the control and what gives the control
 * its accessible name.
 *
 * `isRequired` draws the marker only. The control itself still needs its own
 * `isRequired`, because a visual asterisk is not a constraint.
 *
 * @tier atoms
 * @tag form
 * @tag typography
 */
export type LabelProps = Omit<ComponentPropsWithoutRef<'label'>, 'className'> & {
  /** Id of the control this labels. */
  htmlFor?: string | undefined;
  /** Scale. @default 'sm' */
  size?: 'xs' | 'sm' | 'md' | undefined;
  /** Draws the required marker. @default false */
  isRequired?: boolean | undefined;
  /** Dims the caption to match a disabled control. @default false */
  isDisabled?: boolean | undefined;
  /**
   * Screen-reader text for the required marker. English default; pass a
   * translation. Without it the marker is a silent asterisk.
   * @default 'required'
   */
  requiredLabel?: string | undefined;
  /** Trailing content — an optional-ness hint, a character counter, a help affordance. */
  endSlot?: ReactNode | undefined;
  /** The caption. Always passed in — never written inside a component. */
  children?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
