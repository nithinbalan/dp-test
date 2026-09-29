import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Compact, non-interactive status marker — a record's state, a severity, a count,
 * a classification. Reads as machine output rather than prose: it is set in the
 * mono face with open tracking, which is what separates "OPEN" the status from
 * "open" the word in a sentence.
 *
 * Not clickable. A badge the user can toggle is a Chip; a badge the user can
 * activate is a Button. Both of those own focus and keyboard behaviour that a
 * badge deliberately does not have.
 *
 * @tier atoms
 * @tag status
 * @tag data-display
 */
export type BadgeProps = Omit<ComponentPropsWithoutRef<'span'>, 'className'> & {
  /** Visual weight. `soft` is the default because badges appear in dense rows. @default 'soft' */
  variant?: 'solid' | 'soft' | 'outline' | undefined;
  /** Scale. @default 'sm' */
  size?: 'xs' | 'sm' | 'md' | undefined;
  /**
   * Semantic intent — what the state MEANS, not what colour it should be.
   * `inverse` is the one exception to that rule: it exists for an
   * ORDERED-SEVERITY badge (e.g. a permission level's highest rung) that
   * needs to read as "the strongest state on the ramp" — a dark surface with
   * accent-coloured text — rather than naming an unrelated category the way
   * every other tone does.
   * @default 'neutral'
   */
  tone?:
    | 'neutral'
    | 'brand'
    | 'accent'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'inverse'
    | undefined;
  /** Leading content — typically a status dot or a small icon. */
  startSlot?: ReactNode | undefined;
  /** Trailing content — typically a count or a dismiss affordance. */
  endSlot?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
