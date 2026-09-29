/** Translatable copy for {@link WorkspaceFieldProps}. */
export type WorkspaceFieldMessages = {
  /** Caption for the control. */
  label: string;
  /** Placeholder shown when the field is empty. */
  placeholder: string;
  /** Accessible name + visible label for the "edit again" control on the pill. */
  changeLabel: string;
};

/**
 * Workspace-subdomain entry. While empty (or being edited) it is a plain text
 * field with the domain suffix shown as a static trailing slot; once a value is
 * set and confirmed (blur, or Enter) it collapses to a compact pill showing the
 * full address, with a "Change" control to re-open editing.
 *
 * Local UI state (the edit/pill toggle) lives here — the value itself is
 * controlled by the caller, same as every other form molecule in this system.
 *
 * @tier molecules
 * @tag form
 * @tag authentication
 */
export type WorkspaceFieldProps = {
  /** Current subdomain, without the suffix (e.g. `"yourco"`). */
  value: string;
  /** Called with the new subdomain — the value, not the event. */
  onValueChange: (value: string) => void;
  /** Trailing domain shown after the subdomain, e.g. `".jethurdpdp.com"`. */
  domain: string;
  /** Validation failure. Supplying it puts the field into its invalid state. */
  errorMessage?: string | undefined;
  /** Marks the field as required, on both the label and the control. @default false */
  isRequired?: boolean | undefined;
  /** Disables the field entirely. @default false */
  isDisabled?: boolean | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<WorkspaceFieldMessages> | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the input itself. */
  testId?: string | undefined;
};
