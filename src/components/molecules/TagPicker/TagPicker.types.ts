/** One choice in a {@link TagPickerProps} list. */
export type TagPickerOption = {
  /** The value reported in `onValueChange`. */
  value: string;
  /** What the user reads. */
  label: string;
  /** Flags the tag red — for identifier types the DPDP Act treats as sensitive. @default false */
  isSensitive?: boolean | undefined;
  /** Secondary caption shown beside the label — e.g. the English name of a native-script language. */
  caption?: string | undefined;
  /** Locks the tag permanently on and disables toggling — the base a workspace cannot turn off. @default false */
  isLocked?: boolean | undefined;
};

/**
 * Multi-select from a short list of tags, each independently toggleable —
 * identifier types on a dataset, processing operations, security measures.
 * Composes `Chip`, which already owns the pressed/unpressed and keyboard
 * contract; this only adds the "select several, report the set" behaviour on
 * top and the sensitive-tag flagging the source design uses throughout.
 *
 * @tier molecules
 * @tag form
 * @tag filter
 */
export type TagPickerProps = {
  /** Caption above the tag row. Always used as the accessible group name, even when not shown. */
  label: string;
  /** Renders {@link TagPickerProps.label} and description above the tag row; when false, an external layout (e.g. a settings row) already shows them. @default true */
  isLabelVisible?: boolean | undefined;
  /** Helper text under the label, above the tag row. */
  description?: string | undefined;
  /** The choices, in the order they should appear. */
  options: readonly TagPickerOption[];
  /** Currently selected values. */
  value: readonly string[];
  /** Called with the full next set of selected values. */
  onValueChange: (value: string[]) => void;
  /**
   * Validation failure, shown under the tag row. Supplying it IS the invalid
   * state — same convention as {@link import('../Field/Field.types').FieldProps}.
   */
  errorMessage?: string | undefined;
  /** Disables every tag. @default false */
  isDisabled?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the group. */
  testId?: string | undefined;
};
