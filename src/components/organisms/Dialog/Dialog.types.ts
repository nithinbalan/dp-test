import type { ReactNode } from 'react';

/**
 * Modal overlay for a focused task that shouldn't navigate away from the
 * current screen — confirmations, small forms like "add a dataset by hand".
 * Composes Card (the panel), Heading, Text and IconButton (the close
 * control). No portal: renders a fixed overlay in place, the same technique
 * `AppSidebar` already uses for its mobile drawer — nothing in this app
 * needs true portal semantics yet (e.g. an ancestor with `overflow: hidden`
 * clipping it).
 *
 * @tier organisms
 * @tag overlay
 * @tag feedback
 */
export type DialogProps = {
  /** Whether the dialog is showing. Nothing renders when false. */
  isOpen: boolean;
  /** Called on Escape, backdrop click, or the close button. */
  onClose: () => void;
  /** Dialog title, announced when it opens. */
  label: string;
  /** One line of context under the title. */
  description?: string | undefined;
  /** The dialog's body. */
  children?: ReactNode | undefined;
  /** Action row at the bottom — typically Cancel + a primary Button. */
  footerSlot?: ReactNode | undefined;
  /** Panel width. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /**
   * Where the panel sits. `center` is the standard modal. `end` anchors it to
   * the inline-end edge as a full-height sliding form panel — for a task that
   * wants more room and a less interruptive feel than a centered confirm.
   * @default 'center'
   */
  placement?: 'center' | 'end' | undefined;
  /** Accessible name for the close control. English default; pass a translation. @default 'Close' */
  closeLabel?: string | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
