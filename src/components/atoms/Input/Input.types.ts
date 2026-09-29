import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Single-line text entry control. Follows the same API contract as Button —
 * note `isInvalid`, `isRequired`, `isReadOnly`, `isDisabled` instead of the
 * native boolean names.
 *
 * The border lives on a wrapper rather than the `<input>` so that leading and
 * trailing slots sit INSIDE the control's outline — a search icon floating beside
 * a bordered box is the giveaway that they were bolted on afterwards.
 *
 * @tier atoms
 * @tag form
 * @tag input
 */
export type InputProps = Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'size'> & {
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Marks the field as invalid; renders a danger-toned border. @default false */
  isInvalid?: boolean | undefined;
  /** Marks the field as required. @default false */
  isRequired?: boolean | undefined;
  /** Renders as read-only; prevents editing. @default false */
  isReadOnly?: boolean | undefined;
  /** Disables the field entirely. @default false */
  isDisabled?: boolean | undefined;
  /** Fills the container's inline axis. @default false */
  fullWidth?: boolean | undefined;
  /** Leading content inside the border — an icon, a currency mark. Not interactive. */
  startSlot?: ReactNode | undefined;
  /** Trailing content inside the border — a unit, a clear control, a counter. */
  endSlot?: ReactNode | undefined;
  /** Merged last onto the wrapper, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the `<input>` itself. */
  testId?: string | undefined;
};
