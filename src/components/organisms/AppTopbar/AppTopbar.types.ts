import type { Locale } from '@shared/types/locale';

/** Translatable copy for {@link AppTopbarProps}. */
export type AppTopbarMessages = {
  openNavLabel: string;
  tenantCaption: string;
  enforcementCountdown: string;
  notificationsLabel: string;
  themeToggleLabel: string;
  accountMenuLabel: string;
  languageLabel: string;
  configurationLabel: string;
  helpLabel: string;
  signOutLabel: string;
};

/**
 * Top bar for the signed-in app: mobile nav toggle, the current workspace,
 * an enforcement countdown, notifications, a theme toggle, and the account
 * menu (which owns the language switcher and sign-out). Composes
 * `LocaleSwitcher` and `ThemeToggle`, per the tier chain.
 *
 * @tier organisms
 * @tag navigation
 */
export type AppTopbarProps = {
  /** Workspace/org display name, e.g. "Your Company Pvt Ltd". */
  orgName: string;
  /** Uploaded workspace logo, or undefined to fall back to a generic icon. */
  orgLogoUrl?: string | undefined;
  /** Full workspace address, e.g. "yourco.jethurdpdp.com". */
  workspaceAddress: string;
  /** Days remaining to the enforcement date this build is tracking. */
  enforcementDaysRemaining: number;
  /** Signed-in user's display name. */
  userName: string;
  /** Fallback initials for the avatar. */
  userInitials: string;
  /** Signed-in user's role label, e.g. "Admin". */
  userRole: string;
  /** Current UI locale, for the account menu's language switcher. */
  locale: Locale;
  /** Called with the new locale. */
  onLocaleChange: (locale: Locale) => void;
  /** Opens the sidebar as a mobile overlay. */
  onOpenMobileNav: () => void;
  /** Called when "Sign out" is activated. */
  onSignOut?: (() => void) | undefined;
  /** Called when the notification bell is activated. */
  onNotificationsClick?: (() => void) | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<AppTopbarMessages> | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
