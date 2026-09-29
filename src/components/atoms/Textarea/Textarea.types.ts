import type { ComponentPropsWithoutRef } from 'react';

/**
 * Multi-line text entry. The same contract as Input — `isInvalid`, `isRequired`,
 * `isReadOnly`, `isDisabled` — so a form does not have to remember which control
 * spells its states which way.
 *
 * Resizes vertically only. Horizontal resize lets a user drag a textarea past the
 * edge of a fixed-width form, which looks like a layout bug and is unrecoverable
 * without a reload.
 *
 * @tier atoms
 * @tag form
 * @tag input
 */
export type TextareaProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> & {
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Visible rows before scrolling. @default 3 */
  rows?: number | undefined;
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
  /** Locks the height entirely — for a textarea inside a fixed-height panel. @default false */
  isResizable?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
