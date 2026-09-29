import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Setting that takes effect immediately. That is the whole distinction from
 * Checkbox: a checkbox states an intention that a Save button later commits, a
 * switch IS the commit. Using one where the other belongs is why users press Save
 * and nothing happens, or change a toggle and lose work.
 *
 * Renders `role="switch"` with `aria-checked`, so its state is announced as
 * on/off rather than as a pressed button.
 *
 * @tier atoms
 * @tag form
 * @tag input
 */
export type SwitchProps = Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'onChange'> & {
  /** Whether the setting is on. @default false */
  isSelected?: boolean | undefined;
  /** Disables interaction. @default false */
  isDisabled?: boolean | undefined;
  /** Called with the NEXT state — the value, not the event. */
  onValueChange?: ((isSelected: boolean) => void) | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /** Semantic intent of the on state. @default 'brand' */
  tone?: 'brand' | 'accent' | 'success' | 'danger' | undefined;
  /**
   * Caption rendered beside the track. Supply this OR an `aria-label` — a switch
   * with neither has no accessible name.
   */
  children?: ReactNode | undefined;
  /** Merged last onto the wrapper, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the switch itself. */
  testId?: string | undefined;
};
