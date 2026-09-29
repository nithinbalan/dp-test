import type { Locale } from '@shared/types/locale';

/**
 * Lets the user change language. Renders each locale in its own script
 * (English / العربية / Deutsch), because a user looking for their language will
 * not recognise it written in someone else's.
 *
 * @tier molecules
 * @tag i18n
 * @tag settings
 */
export type LocaleSwitcherProps = {
  /** The locale currently in effect. */
  current: Locale;
  /** Accessible name for the control. Pass a translated string. */
  label: string;
  /** Called with the chosen locale. The caller decides how to navigate. */
  onValueChange?: ((locale: Locale) => void) | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
