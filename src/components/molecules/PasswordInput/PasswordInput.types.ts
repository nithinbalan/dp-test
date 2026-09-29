/** Translatable copy for {@link PasswordInputProps}. */
export type PasswordInputMessages = {
  /** Accessible name for the toggle when the password is hidden. */
  showLabel: string;
  /** Accessible name for the toggle when the password is visible. */
  hideLabel: string;
};

/**
 * A password field with a show/hide toggle. Composes Label and Input directly
 * (not the Field molecule — a molecule cannot import another molecule) so it
 * wires its own id/error/aria-describedby the same way LoginForm does.
 *
 * Controlled only, and deliberately not used inside LoginForm: LoginForm's own
 * password field stays a plain inline composition for the same tier reason this
 * component exists as its own file — see LoginForm's TSDoc.
 *
 * @tier molecules
 * @tag form
 * @tag authentication
 */
export type PasswordInputProps = {
  /** Caption for the control. Copy arrives from the caller, already translated. */
  label: string;
  /** Current value. */
  value: string;
  /** Called with the new value — the value, not the event. */
  onValueChange: (value: string) => void;
  /** Helper text under the control. */
  description?: string | undefined;
  /** Validation failure. Supplying it puts the field into its invalid state. */
  errorMessage?: string | undefined;
  /** Marks the field as required, on both the label and the control. @default false */
  isRequired?: boolean | undefined;
  /** Disables the field entirely. @default false */
  isDisabled?: boolean | undefined;
  /** Native autocomplete hint — pick the one that matches what the field collects. */
  autoComplete?: 'new-password' | 'current-password' | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<PasswordInputMessages> | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Fills the container's inline axis. @default false */
  fullWidth?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the input itself. */
  testId?: string | undefined;
};
