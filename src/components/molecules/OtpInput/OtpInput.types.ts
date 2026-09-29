/** Translatable copy for {@link OtpInputProps}. */
export type OtpInputMessages = {
  /** Caption above the digit row. */
  label: string;
  /**
   * Accessible name template for one cell. `{position}` and `{length}` are
   * substituted — e.g. `"Digit {position} of {length}"`.
   */
  digitLabel: string;
};

/**
 * One-time-passcode entry: a row of single-digit cells that behaves like one
 * field — typing a digit advances focus, backspace on an empty cell moves back,
 * and pasting a full code splits it across all cells. Reports one composed
 * string via `onValueChange`, the same shape a single text input would.
 *
 * @tier molecules
 * @tag form
 * @tag authentication
 */
export type OtpInputProps = {
  /** Number of digits. @default 6 */
  length?: number | undefined;
  /** Current code, left to right. Shorter than `length` while still being entered. */
  value: string;
  /** Called with the composed code whenever any cell changes. */
  onValueChange: (value: string) => void;
  /** Validation failure. Supplying it puts every cell into its invalid state. */
  errorMessage?: string | undefined;
  /** Disables every cell. @default false */
  isDisabled?: boolean | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<OtpInputMessages> | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the group. */
  testId?: string | undefined;
};
