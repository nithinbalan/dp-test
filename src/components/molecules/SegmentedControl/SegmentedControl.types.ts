import type { ReactNode } from 'react';

/**
 * Semantic intent a segment renders when selected. `inverse`/`muted`/`surface`
 * exist for an ORDERED-SEVERITY control (each option is a rung on one ladder,
 * not an unrelated category) — a permission-level picker is the reference
 * case: none/view/edit/approve read as an intensity ramp, not four colours
 * competing for attention.
 */
export type SegmentedControlTone =
  'brand' | 'accent' | 'neutral' | 'inverse' | 'muted' | 'surface' | 'warning' | 'danger';

/** One segment. */
export type SegmentedControlItem = {
  /** Reported to `onValueChange` when this segment is chosen. */
  value: string;
  /** What the user reads. Comes from the caller, already translated. */
  label: string;
  /** Leading icon. */
  startSlot?: ReactNode | undefined;
  /** Renders the segment unselectable. @default false */
  isDisabled?: boolean | undefined;
  /**
   * Overrides the group's `tone` for THIS segment's selected state — an
   * ordered-severity control (see {@link SegmentedControlTone}) where each
   * rung needs its own colour rather than sharing the group's one tone.
   */
  tone?: SegmentedControlTone | undefined;
};

/**
 * Single choice from two to five options, all visible at once — a view switcher,
 * a date range, a yes/no/unknown answer.
 *
 * Built on hidden native radios rather than on buttons with `aria-pressed`. That
 * is what gives it arrow-key navigation, a single tab stop, and correct
 * "2 of 4" announcements, none of which a group of buttons has, and all of which
 * would otherwise have to be reimplemented and kept working.
 *
 * More than about five options, or options that need descriptions, belong in a
 * Select. Options that reveal panels belong in Tabs.
 *
 * @tier molecules
 * @tag form
 * @tag navigation
 */
export type SegmentedControlProps = {
  /**
   * Accessible name for the group — what is being chosen. Required: "Grid, List"
   * on its own does not say what it applies to.
   */
  label: string;
  /** The segments, in display order. */
  items: readonly SegmentedControlItem[];
  /** Currently chosen value. */
  value: string;
  /** Called with the newly chosen value. */
  onValueChange: (value: string) => void;
  /**
   * Radio group name. Defaults to a generated id; supply one only when two
   * controls must genuinely share a group.
   */
  name?: string | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /**
   * Container treatment. `joined`'s segments share one bordered pill with no
   * gaps — a view switcher, a date range. `split` renders each segment as its
   * own bordered button with a gap between them — a multi-tone answer control
   * (Yes/Partly/No/Not sure) where each choice needs to read as a standalone
   * decision, not one rung of a single switch.
   * @default 'joined'
   */
  variant?: 'joined' | 'split' | undefined;
  /** Default tone for a selected segment; a segment's own `tone` overrides it. @default 'brand' */
  tone?: SegmentedControlTone | undefined;
  /** Stretches the segments to fill the container. @default false */
  fullWidth?: boolean | undefined;
  /** Disables every segment. @default false */
  isDisabled?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
