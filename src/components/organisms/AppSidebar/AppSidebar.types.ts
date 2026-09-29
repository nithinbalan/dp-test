import type { ReactNode } from 'react';
import type { Route } from 'next';

/** One link in the sidebar. */
export type SidebarNavItem = {
  /** Where it goes. Active state is derived from the current route matching this. */
  href: Route;
  /** What the user reads. Comes from the caller, already translated. */
  label: string;
  /** Leading glyph. Supplied by the caller so the app picks its own icon set. */
  icon: ReactNode;
  /** Count or short status shown at the end of the row. */
  badge?: string | undefined;
};

/** A labelled cluster of {@link SidebarNavItem}. */
export type SidebarNavGroup = {
  /** Section kicker above the items. */
  label: string;
  items: SidebarNavItem[];
};

/** Translatable copy for {@link AppSidebarProps}. */
export type AppSidebarMessages = {
  /** "Jethur" — rendered in the default inverse text colour. */
  brandNamePrimary: string;
  /** "DPDP" — rendered in the accent (lime) colour, split out so the two-tone
   * wordmark doesn't require slicing an opaque translated string. */
  brandNameAccent: string;
  brandCaption: string;
  searchPlaceholder: string;
  poweredBy: string;
  closeLabel: string;
};

/**
 * Primary navigation for the signed-in app: brand mark, a highlighted entry
 * for the AI assistant, then grouped module links. Active-route highlighting
 * comes from `usePathname()` internally — organisms may consume routing hooks
 * the way atoms/molecules cannot (see `src/components/CLAUDE.md`).
 *
 * @tier organisms
 * @tag navigation
 */
export type AppSidebarProps = {
  /** The grouped module links. */
  groups: SidebarNavGroup[];
  /** The standalone "Jethur AI" entry, styled apart from the groups below it. */
  aiItem: SidebarNavItem;
  /** Shows the sidebar as a mobile overlay. @default false */
  isMobileOpen?: boolean | undefined;
  /** Called when the mobile overlay should close (backdrop click, close button). */
  onCloseMobile?: (() => void) | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<AppSidebarMessages> | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
