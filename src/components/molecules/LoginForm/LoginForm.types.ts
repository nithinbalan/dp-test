/** Translatable copy for {@link LoginFormProps}. */
export type LoginFormMessages = {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  forgotPassword: string;
  submit: string;
  /** Accessible name for the password-visibility toggle when hidden. */
  showPassword: string;
  /** Accessible name for the password-visibility toggle when visible. */
  hidePassword: string;
};

/**
 * Email + password sign-in form. Owns the two field values; delegates submission
 * to the caller. All copy arrives via `messages`, so the same component renders in
 * English and Arabic without modification.
 *
 * @tier molecules
 * @tag form
 * @tag authentication
 */
export type LoginFormProps = {
  /** Called with the entered credentials when the form is submitted. */
  onSubmit?: ((email: string, password: string) => void) | undefined;
  /** Blocks input and shows a spinner on the submit control. @default false */
  isLoading?: boolean | undefined;
  /** Shown in an alert region when sign-in fails. */
  errorMessage?: string | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<LoginFormMessages> | undefined;
  /** Href for the forgot-password link. Ignored when `onForgotPasswordClick` is set. @default '#' */
  forgotPasswordHref?: string | undefined;
  /**
   * Called instead of navigating when "Forgot password?" is activated — for a
   * caller that switches to an in-page recovery flow rather than a new route.
   * When supplied, the link renders as a `<button>` instead of an `<a>`.
   */
  onForgotPasswordClick?: (() => void) | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
