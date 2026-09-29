/** Translatable copy for {@link SearchInputProps}. */
export type SearchInputMessages = {
  /** Accessible name for the field. */
  label: string;
  /** Placeholder shown when the field is empty. */
  placeholder: string;
  /** Accessible name for the clear control. */
  clear: string;
};

/**
 * Filter box for a list or table. Adds three things to a bare Input that every
 * search field ends up needing and half of them forget: a leading magnifier, a
 * clear control that appears only when there is something to clear, and
 * `type="search"` so the browser treats it as one.
 *
 * Controlled only. A search box whose value the parent cannot read is a search
 * box that cannot filter anything.
 *
 * @tier molecules
 * @tag form
 * @tag filter
 */
export type SearchInputProps = {
  /** Current query. */
  value: string;
  /** Called with the new query — the value, not the event. */
  onValueChange: (value: string) => void;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<SearchInputMessages> | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Fills the container's inline axis. @default false */
  fullWidth?: boolean | undefined;
  /** Disables the field entirely. @default false */
  isDisabled?: boolean | undefined;
  /** Called when the query is cleared, in addition to `onValueChange('')`. */
  onClear?: (() => void) | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the input itself. */
  testId?: string | undefined;
};
