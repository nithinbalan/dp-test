import type { ReactNode } from 'react';

/** One tab. */
export type TabItem = {
  /** Reported to `onValueChange` when this tab is chosen. Also seeds the element ids. */
  value: string;
  /** What the user reads. Comes from the caller, already translated. */
  label: string;
  /** Leading icon. */
  startSlot?: ReactNode | undefined;
  /** Trailing content — a count Badge. */
  endSlot?: ReactNode | undefined;
  /** Renders the tab unselectable. @default false */
  isDisabled?: boolean | undefined;
};

/**
 * Tab strip for switching between panels of the same page.
 *
 * Renders the STRIP only; the caller renders the panel. That split is what keeps
 * this a molecule and lets a panel be a server component, lazily loaded, or a
 * route — none of which would be possible if the tabs owned their content.
 *
 * Wire the panel with {@link tabPanelProps} so `aria-controls` and
 * `aria-labelledby` point at each other. A tablist that controls nothing is worse
 * than plain links.
 *
 * @tier molecules
 * @tag navigation
 */
export type TabsProps = {
  /** Accessible name for the strip — what set of panels these switch between. */
  label: string;
  /** The tabs, in display order. */
  items: readonly TabItem[];
  /** Currently active tab value. */
  value: string;
  /** Called with the newly activated tab value. */
  onValueChange: (value: string) => void;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /**
   * Chrome. `ghost` is the underlined strip that sits directly on a page;
   * `soft` is the filled track that sits inside a card.
   * @default 'ghost'
   */
  variant?: 'ghost' | 'soft' | undefined;
  /** Stretches the tabs to fill the container. @default false */
  fullWidth?: boolean | undefined;
  /** Shared prefix for the generated element ids. Supply it to match a panel rendered elsewhere. */
  idPrefix?: string | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
