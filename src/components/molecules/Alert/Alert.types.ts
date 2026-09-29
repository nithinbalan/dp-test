import type { ReactNode } from 'react';

/**
 * Inline message about the region it sits in — a validation summary, a warning
 * about an overdue obligation, a note explaining why a control is locked.
 *
 * Not a toast. A toast is transient and lives at the app root; this is part of
 * the page and stays until the condition it describes is gone.
 *
 * `tone` drives more than colour: `danger` and `warning` render as
 * `role="alert"`, so a screen reader interrupts to speak them, while quieter
 * tones are announced politely. Getting that from one prop is why the tone is
 * semantic rather than a colour name.
 *
 * @tier molecules
 * @tag feedback
 * @tag status
 */
export type AlertProps = {
  /** Headline. Copy arrives from the caller, already translated. */
  label: string;
  /** Supporting detail under the headline. */
  description?: string | undefined;
  /** Richer body — a list of failures, a link. Rendered under the description. */
  children?: ReactNode | undefined;
  /** Semantic intent. Also decides how urgently it is announced. @default 'info' */
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'brand' | 'neutral' | undefined;
  /** Visual weight. @default 'soft' */
  variant?: 'soft' | 'outline' | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /** Leading icon. Supplied by the caller so the app picks its own icon set. */
  startSlot?: ReactNode | undefined;
  /** Trailing action — usually a single Button. */
  endSlot?: ReactNode | undefined;
  /** Shows a dismiss control and is called when it is pressed. */
  onDismiss?: (() => void) | undefined;
  /**
   * Accessible name for the dismiss control. English default; pass a
   * translation. @default 'Dismiss'
   */
  dismissLabel?: string | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
