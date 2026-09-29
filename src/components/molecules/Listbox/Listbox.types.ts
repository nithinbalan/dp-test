import type { ReactNode } from 'react';

/** One choice in a {@link ListboxProps} list. */
export type ListboxOption = {
  /** The value submitted / reported. */
  value: string;
  /** What the user reads. Comes from the caller, already translated. */
  label: string;
  /** Renders the option unselectable. @default false */
  isDisabled?: boolean | undefined;
};

/**
 * Single-select from a short, known list, presented as a custom-rendered
 * popup instead of the platform picker — the option list itself, not just
 * the trigger, is themeable. `Select` (the native dropdown atom) is the
 * default choice for this job and stays that way on purpose ("the popup is
 * the platform's — ours would be worse"); reach for `Listbox` only when a
 * caller needs the option list's own colors (hover/selected state) to carry
 * the design system's tones, which the OS-rendered native popup can never do.
 *
 * Not searchable and not multi-select — that combination is `PeoplePicker`
 * and `TagPicker` respectively. A plain list of strings, single choice, own
 * popup: that's this component's whole job.
 *
 * @tier molecules
 * @tag form
 * @tag input
 */
export type ListboxProps = {
  /** Caption above the control. Always used as the control's accessible name, even when not shown. */
  label: string;
  /** Renders `label` (and `labelHint`) above the control; when false, an
   * external layout (a compact toolbar row, a settings row) already shows
   * it, or there's no room for a stacked caption. @default true */
  isLabelVisible?: boolean | undefined;
  /** Muted secondary text rendered inline right after `label`, on the same
   * line — a short "why this field" gloss (e.g. "shapes the sectoral rules
   * we flag"). Included in the control's accessible name along with `label`.
   * For helper text that reads as its own line, use `description` instead. */
  labelHint?: string | undefined;
  /** The choices, in the order they should appear. */
  options: readonly ListboxOption[];
  /** Selected value, or undefined for no selection. */
  value: string | undefined;
  /** Called with the new selection. */
  onValueChange: (value: string) => void;
  /** Text shown in the trigger when nothing is selected yet. */
  placeholder?: string | undefined;
  /** Text shown in the open popup when `options` is empty. Omit to render nothing. */
  emptyOptionsLabel?: string | undefined;
  /** Helper text under the label, above the control. */
  description?: string | undefined;
  /** Validation failure. Supplying it puts the field into its invalid state. */
  errorMessage?: string | undefined;
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
  /** Leading content inside the trigger, typically an icon. */
  startSlot?: ReactNode | undefined;
  /** Merged last onto the trigger, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the trigger button. */
  testId?: string | undefined;
};
