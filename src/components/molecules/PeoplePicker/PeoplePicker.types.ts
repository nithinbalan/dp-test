/** One person a {@link PeoplePickerProps} can assign. */
export type PersonOption = {
  /** Stable identifier, reported in `onValueChange`. */
  id: string;
  /** Display name. */
  name: string;
  /** Fallback initials for the avatar. */
  initials: string;
  /** Shown under the name in the picker list — a role, department, or title. */
  detail?: string | undefined;
  /**
   * Department or team, used to group the `trigger` variant's popover list
   * (`Artificial Intelligence`, `Development`, `Management`, …). Ignored by
   * the `inline` variant and a no-op when omitted — ungrouped people are
   * listed flat.
   */
  group?: string | undefined;
};

/** Translatable copy for {@link PeoplePickerProps}. */
export type PeoplePickerMessages = {
  placeholder: string;
  changeLabel: string;
  noResults: string;
  /** Placeholder for the `trigger` variant's popover search input. */
  searchPlaceholder: string;
  /** Label on the popover search row's keyboard hint badge. */
  escHint: string;
  /**
   * Footer row under the `trigger` variant's list. `{count}` and `{total}`
   * are replaced with the number of people shown and `totalCount`.
   */
  footerLabel: string;
  /** Footer link to the full employee register. */
  manageLabel: string;
};

/**
 * Searchable single-select for assigning an owner from a known people list —
 * RoPA activities, DPIA sign-off, risks, actions. `Select` (the native
 * dropdown atom) deliberately stays a short-list-only component; this is the
 * "different component built on a listbox" its own docs point to.
 *
 * Two presentations, chosen with `variant`:
 * - `inline` (default): collapses to a compact pill once a person is chosen,
 *   the same edit/confirm pattern `WorkspaceField` uses. Used by RoPA, DPIA
 *   and risk/action owner fields.
 * - `trigger`: a combobox-style trigger button that always stays put and
 *   opens an anchored popover with a search row, a people list grouped by
 *   `PersonOption.group`, and a footer linking to the full employee
 *   register. Used where the field reads as a persistent setting rather
 *   than a one-off assignment — e.g. Settings' Data Protection Officer field.
 *
 * @tier molecules
 * @tag form
 * @tag people
 */
export type PeoplePickerProps = {
  /** Caption above the control. Always used as the control's accessible name, even when not shown. */
  label: string;
  /** Renders {@link PeoplePickerProps.label} and description above the control; when false, an external layout (e.g. a settings row) already shows them. @default true */
  isLabelVisible?: boolean | undefined;
  /** Muted secondary text rendered inline right after `label`, on the same
   * line — a short "why this field" gloss (e.g. "from your Employee
   * register"). Included in the control's accessible name along with
   * `label`. For helper text that reads as its own line, use `description`. */
  labelHint?: string | undefined;
  /** Helper text under the label, above the control. */
  description?: string | undefined;
  /** The people that can be assigned. */
  people: readonly PersonOption[];
  /** Selected person's id, or undefined for no selection. */
  value: string | undefined;
  /** Called with the new selection — a person's id, or undefined to clear it. */
  onValueChange: (value: string | undefined) => void;
  /** Validation failure. Supplying it puts the field into its invalid state. */
  errorMessage?: string | undefined;
  /** Marks the field as required. @default false */
  isRequired?: boolean | undefined;
  /** Disables the control. @default false */
  isDisabled?: boolean | undefined;
  /** Presentation. See the component doc above. @default 'inline' */
  variant?: 'inline' | 'trigger' | undefined;
  /**
   * `trigger` variant only: link to the full employee register, shown at the
   * end of the popover's footer row. Omitted footer link when not supplied.
   */
  employeeRegisterHref?: string | undefined;
  /**
   * `trigger` variant only: total people in the employee register, for the
   * footer's "{count} of {total}" copy. Defaults to `people.length` — pass
   * the real organisation-wide count when `people` is a subset.
   */
  totalCount?: number | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<PeoplePickerMessages> | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
