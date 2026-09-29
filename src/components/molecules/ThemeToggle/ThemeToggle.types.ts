import type { Theme } from '@shared/types/tokens';

/** Translatable copy for {@link ThemeToggleProps}. */
export type ThemeToggleMessages = {
  /** Accessible name for the control. */
  label: string;
  light: string;
  dark: string;
  system: string;
};

/**
 * Cycles the colour theme between light, dark and following the OS. Renders a
 * placeholder until mounted, because the server cannot know the stored preference.
 *
 * @tier molecules
 * @tag theme
 * @tag settings
 */
export type ThemeToggleProps = {
  /** Scale, forwarded to the underlying control. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * Accessibility labels keep an English default deliberately — an unlabelled
   * control is worse than an untranslated one. See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<ThemeToggleMessages> | undefined;
  /** Called after the theme changes, for analytics or persistence side effects. */
  onValueChange?: ((theme: Theme) => void) | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
