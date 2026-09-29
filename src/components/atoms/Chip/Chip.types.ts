import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Two-state filter control. Renders as a pressed/unpressed button, which is what
 * lets a filter bar be operated from the keyboard and announced correctly — a
 * `<div role="button">` with a colour change is the usual shortcut here and it
 * leaves the state invisible to assistive technology.
 *
 * A Chip that cannot be toggled is a Badge. A Chip that performs an action rather
 * than filtering is a Button.
 *
 * @tier atoms
 * @tag filter
 * @tag action
 * @tag form
 */
export type ChipProps = Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'onChange'> & {
  /** Visual weight when unselected. @default 'outline' */
  variant?: 'outline' | 'ghost' | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /** Semantic intent of the facet this chip filters by. @default 'neutral' */
  tone?: 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | undefined;
  /** Whether the chip is currently on. Maps to `aria-pressed`. @default false */
  isSelected?: boolean | undefined;
  /** Disables interaction. @default false */
  isDisabled?: boolean | undefined;
  /** Called with the NEXT selected state — the value, not the event. */
  onValueChange?: ((isSelected: boolean) => void) | undefined;
  /** Leading content, typically a tone dot. */
  startSlot?: ReactNode | undefined;
  /** Trailing content, typically a match count. */
  endSlot?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
