import type { ReactNode } from 'react';

/**
 * The header every module screen opens with: an optional legal/module
 * reference tag, a title, a description, and an optional action cluster on
 * the trailing edge. Reused across every route in `(app)/**` — one component
 * so the shape (and its RTL behaviour) is decided once.
 *
 * @tier molecules
 * @tag layout
 * @tag typography
 */
export type PageHeaderProps = {
  /** Section/module reference shown above the title, e.g. "s.8(5)" or "JDP-DASH". */
  refTag?: string | undefined;
  /** The page's title. */
  label: string;
  /** One line of context under the title. */
  description?: string | undefined;
  /** Trailing action cluster — typically one or two Buttons. */
  actionSlot?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
