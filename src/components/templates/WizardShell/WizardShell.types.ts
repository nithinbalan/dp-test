import type { ReactNode } from 'react';

/**
 * Structure for a multi-step flow: a step rail, the current step's content,
 * and a footer nav row — Add Source, Add Activity, DPIA, Gap Assessment all
 * share this shape. Pure layout; the caller composes `Stepper` (molecule)
 * into `stepperSlot` with its own steps/state, and owns Back/Next/Save in
 * `footerSlot`.
 *
 * @tier templates
 * @tag layout
 */
export type WizardShellProps = {
  /** The `Stepper`. */
  stepperSlot: ReactNode;
  /** The current step's fields/content. */
  children: ReactNode;
  /** Back / Next / Save row, pinned below the content. */
  footerSlot: ReactNode;
  /**
   * Keeps the footer visible at the viewport bottom while a tall step
   * scrolls, instead of sitting in normal flow at the end of the content.
   * Uses a reserved-space technique so it never overlaps step content — see
   * WizardShell.tsx. Opt-in because most wizards are short enough that a
   * sticky footer adds nothing; a step with many long option lists (RoPA's
   * AI interview) is where it earns its keep.
   * @default false
   */
  isFooterSticky?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
