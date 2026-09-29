/** One step in a multi-step flow. */
export type StepperStep = {
  /** Stable identifier, reported to `onValueChange`. */
  value: string;
  /** What the user reads. Comes from the caller, already translated. */
  label: string;
  /** One line of detail under the label. Shown in the vertical orientation only. */
  description?: string | undefined;
};

/** Translatable copy for {@link StepperProps}. */
export type StepperMessages = {
  /** Accessible name for the progress list. */
  label: string;
  /** Suffix announced on finished steps. */
  completed: string;
  /** Suffix announced on the step the user is on. */
  current: string;
};

/**
 * Progress through a wizard: which steps are done, which one you are on, how many
 * are left.
 *
 * Position comes from `activeIndex`, not from a per-step `status` field. One
 * index cannot describe a flow where step 4 is complete and step 2 is not — which
 * is a real state in some wizards, and a bug in every other one. Keeping the
 * index means the component cannot represent the broken states at all.
 *
 * @tier molecules
 * @tag navigation
 * @tag feedback
 */
export type StepperProps = {
  /** The steps, in order. */
  steps: readonly StepperStep[];
  /** Zero-based index of the step the user is on. Everything before it is complete. */
  activeIndex: number;
  /**
   * Makes completed steps clickable and reports the step chosen. Steps ahead of
   * the current one are never clickable — skipping forward past validation is how
   * a wizard ends up submitting an incomplete record.
   */
  onValueChange?: ((value: string) => void) | undefined;
  /** Layout axis. `horizontal` reads left-to-right, or right-to-left in Arabic. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical' | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<StepperMessages> | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
