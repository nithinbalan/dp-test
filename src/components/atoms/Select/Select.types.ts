import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/** One choice in a {@link SelectProps} list. */
export type SelectOption = {
  /** The value submitted / reported. */
  value: string;
  /** What the user reads. Comes from the caller, already translated. */
  label: string;
  /** Renders the option unselectable. @default false */
  isDisabled?: boolean | undefined;
};

/**
 * Choice from a short, known list. Wraps the NATIVE `<select>` on purpose: it is
 * the only control that gets the platform picker on mobile, works offline of any
 * JavaScript, and needs no focus-trap or virtualisation to stay accessible. A
 * searchable or multi-select list is a different component built on a listbox —
 * do not grow this one into it.
 *
 * @tier atoms
 * @tag form
 * @tag input
 */
export type SelectProps = Omit<
  ComponentPropsWithoutRef<'select'>,
  'className' | 'size' | 'children'
> & {
  /** The choices, in the order they should appear. */
  options: readonly SelectOption[];
  /**
   * Text for the empty choice shown when nothing is selected yet. Rendered as a
   * disabled option, so it cannot be submitted. Omit for a select that always has
   * a value.
   */
  placeholder?: string | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Marks the field as invalid; renders a danger-toned border. @default false */
  isInvalid?: boolean | undefined;
  /** Marks the field as required. @default false */
  isRequired?: boolean | undefined;
  /** Disables the field entirely. @default false */
  isDisabled?: boolean | undefined;
  /** Fills the container's inline axis. @default false */
  fullWidth?: boolean | undefined;
  /** Called with the selected value — not the event. */
  onValueChange?: ((value: string) => void) | undefined;
  /** Leading content inside the border, typically an icon. */
  startSlot?: ReactNode | undefined;
  /** Merged last onto the wrapper, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the `<select>` itself. */
  testId?: string | undefined;
};
