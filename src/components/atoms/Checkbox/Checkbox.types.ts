import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Independent on/off choice. Built on a real `<input type="checkbox">` with the
 * native box hidden rather than replaced: the control keeps native keyboard
 * handling, form participation and `:checked` semantics, and only its painting is
 * ours. A `<div role="checkbox">` has to reimplement all three, and usually
 * reimplements two.
 *
 * @tier atoms
 * @tag form
 * @tag input
 */
export type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'className' | 'size' | 'type'
> & {
  /** Caption rendered beside the box, inside the same `<label>`. */
  children?: ReactNode | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /** Semantic intent of the checked fill. @default 'brand' */
  tone?: 'brand' | 'accent' | 'danger' | undefined;
  /**
   * Neither checked nor unchecked — the "some of these rows are selected" state
   * of a select-all box. Purely visual on its own; the value the form submits
   * still comes from `checked`.
   * @default false
   */
  isIndeterminate?: boolean | undefined;
  /** Marks the field as invalid. @default false */
  isInvalid?: boolean | undefined;
  /** Marks the field as required. @default false */
  isRequired?: boolean | undefined;
  /** Disables interaction. @default false */
  isDisabled?: boolean | undefined;
  /** Called with the NEXT checked state — the value, not the event. */
  onValueChange?: ((isChecked: boolean) => void) | undefined;
  /** Merged last onto the wrapper, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the `<input>` itself. */
  testId?: string | undefined;
};
