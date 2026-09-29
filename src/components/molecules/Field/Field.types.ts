import type { ReactNode } from 'react';

/**
 * What a Field hands to its control. Spreading this is what wires the label,
 * the description and the error message to the input — the plumbing that is
 * easy to write once, easy to forget the second time, and invisible when missing
 * unless you are using a screen reader.
 */
export type FieldControl = {
  /** Id the Label points at. */
  id: string;
  /** Ids of the description and error text, space-separated. */
  'aria-describedby': string | undefined;
  /** Mirrors the Field's own invalid state. */
  isInvalid: boolean;
  /** Mirrors the Field's own required state. */
  isRequired: boolean;
};

/**
 * Label + control + helper text + error message, wired together.
 *
 * `children` is a FUNCTION rather than an element, and that is the whole design:
 * the Field generates the ids and hands them to the control explicitly. The
 * alternative — cloning the child to inject props — breaks silently the moment
 * someone wraps their input in a fragment or a div, and the breakage shows up as
 * a missing accessible name that nobody notices.
 *
 * @tier molecules
 * @tag form
 * @tag input
 */
export type FieldProps = {
  /** Caption for the control. Copy arrives from the caller, already translated. */
  label: string;
  /** Renders the control with the ids and state already wired. */
  children: (control: FieldControl) => ReactNode;
  /** Helper text under the control. Always shown. */
  description?: string | undefined;
  /**
   * Validation failure. Supplying it puts the field into its invalid state, so
   * the message and the styling cannot disagree.
   */
  errorMessage?: string | undefined;
  /** Marks the field as required, on both the label and the control. @default false */
  isRequired?: boolean | undefined;
  /** Dims the label to match a disabled control. @default false */
  isDisabled?: boolean | undefined;
  /** Scale of the label and helper text. @default 'sm' */
  size?: 'xs' | 'sm' | 'md' | undefined;
  /**
   * Screen-reader text for the required marker. English default; pass a
   * translation. @default 'required'
   */
  requiredLabel?: string | undefined;
  /** Trailing content on the label row — an optional-ness hint, a counter. */
  endSlot?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
