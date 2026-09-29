import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * One option in a mutually exclusive set. Built on a real
 * `<input type="radio">`, so the browser handles the part that is genuinely hard:
 * arrow-key roving focus within a `name` group, and the rule that a group with a
 * chosen value cannot be un-chosen.
 *
 * Radios are only ever correct in a group. A single radio the user cannot clear
 * is a Checkbox.
 *
 * @tier atoms
 * @tag form
 * @tag input
 */
export type RadioProps = Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'size' | 'type'> & {
  /** The group this belongs to. Radios sharing a `name` are mutually exclusive. */
  name?: string | undefined;
  /** Caption rendered beside the dot, inside the same `<label>`. */
  children?: ReactNode | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /** Semantic intent of the selected fill. @default 'brand' */
  tone?: 'brand' | 'accent' | 'danger' | undefined;
  /** Marks the field as invalid. @default false */
  isInvalid?: boolean | undefined;
  /** Marks the field as required. @default false */
  isRequired?: boolean | undefined;
  /** Disables interaction. @default false */
  isDisabled?: boolean | undefined;
  /** Called with this radio's `value` when it becomes selected. */
  onValueChange?: ((value: string) => void) | undefined;
  /** Merged last onto the wrapper, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the `<input>` itself. */
  testId?: string | undefined;
};
