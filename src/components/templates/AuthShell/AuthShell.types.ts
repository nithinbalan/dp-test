import type { ReactNode } from 'react';

/**
 * Two-pane layout for an authentication page: a filled panel on one side (brand,
 * trust messaging, testimonial — whatever the page composes there) and a plain
 * surface on the other, holding the actual sign-in/sign-up card. Below the `lg`
 * breakpoint the filled panel drops out and the card panel fills the viewport,
 * since there is no room to show both without either scrolling past the form.
 *
 * Pure structure — no content or business logic of its own, per the templates
 * tier's contract. The page decides what fills each slot.
 *
 * @tier templates
 * @tag layout
 * @tag authentication
 */
export type AuthShellProps = {
  /** The filled panel — brand mark, trust messaging, a testimonial. Hidden below `lg`. */
  leftSlot: ReactNode;
  /** The plain panel — the actual sign-in/sign-up card, plus locale/theme controls. */
  rightSlot: ReactNode;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
