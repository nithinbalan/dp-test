/**
 * What one sign-in attempt, code send, code verify, or password reset resolves
 * to. Absent/undefined `errorMessage` means the step succeeded. Every async
 * callback below shares this shape so the card has one way to render failure.
 */
export type AuthActionResult = {
  errorMessage?: string | undefined;
};

/** Translatable copy for {@link AuthCardProps}. Grouped by the view that uses it. */
export type AuthCardMessages = {
  // Sign-in (default view)
  tagline: string;
  devModeHintLabel: string;
  devModeHintDescription: string;
  workspaceLabel: string;
  workspacePlaceholder: string;
  workspaceChangeLabel: string;
  findWorkspace: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  forgotPassword: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  keepSignedIn: string;
  orDivider: string;
  whatsappSignIn: string;
  noAccount: string;
  requestAccess: string;
  signInFailed: string;

  // Shared across the recovery flows
  backToSignIn: string;
  otpLabel: string;
  otpDigitLabel: string;
  genericError: string;

  // Forgot password — choose channel
  fpChooseTitle: string;
  fpChooseSubtitle: string;
  fpChooseEmailTitle: string;
  fpChooseEmailSubtitle: string;
  fpChooseWhatsAppTitle: string;
  fpChooseWhatsAppSubtitle: string;
  fpChooseFooter: string;

  // Forgot password — enter identifier
  fpEnterTitle: string;
  fpEnterEmailLabel: string;
  fpEnterEmailPlaceholder: string;
  fpEnterWhatsAppLabel: string;
  fpEnterWhatsAppPlaceholder: string;
  fpEnterSubmit: string;

  // Forgot password — verify code
  fpVerifyTitle: string;
  fpVerifySubmit: string;
  fpVerifyResend: string;
  fpVerifyHint: string;

  // Forgot password — set new password
  fpResetTitle: string;
  fpResetSubtitle: string;
  fpResetNewPasswordLabel: string;
  fpResetConfirmPasswordLabel: string;
  fpResetSubmit: string;
  fpResetMismatch: string;

  // Forgot password — done
  fpDoneTitle: string;
  fpDoneBody: string;
  fpDoneBackToSignIn: string;

  // WhatsApp OTP — phone entry
  waPhoneTitle: string;
  waPhoneLabel: string;
  waPhonePlaceholder: string;
  waPhoneSubmit: string;
  waPhoneInvalid: string;

  // WhatsApp OTP — verify code
  waVerifyTitle: string;
  waVerifySubmit: string;
  waVerifyResend: string;
  waChangeNumber: string;
};

/**
 * The full sign-in experience: email/password with a workspace field, "Sign in
 * with OTP on WhatsApp" as an alternate channel, and a 5-step forgot-password
 * recovery flow — one card that switches between views instead of navigating,
 * matching the source design's `showAuthView()` behaviour.
 *
 * Every action is an optional async callback resolving to {@link AuthActionResult}.
 * Omitting one makes that step succeed immediately with no visible delay — the
 * caller decides what "submitting" actually does; this component only owns the
 * view state and the per-step loading/error presentation.
 *
 * @tier organisms
 * @tag authentication
 * @tag form
 */
export type AuthCardProps = {
  /** Trailing domain shown after the workspace subdomain, e.g. `".jethurdpdp.com"`. */
  workspaceDomain: string;
  /** Current workspace subdomain. */
  workspaceValue: string;
  /** Called with the new workspace subdomain — the value, not the event. */
  onWorkspaceValueChange: (value: string) => void;
  /** Called when email/password sign-in is submitted. */
  onSignIn?:
    | ((email: string, password: string, rememberMe: boolean) => Promise<AuthActionResult>)
    | undefined;
  /** Called when a password-reset or WhatsApp-OTP code is requested. */
  onSendCode?:
    ((identifier: string, channel: 'email' | 'whatsapp') => Promise<AuthActionResult>) | undefined;
  /** Called when a 6-digit code is submitted for verification. */
  onVerifyCode?: ((code: string) => Promise<AuthActionResult>) | undefined;
  /** Called when a new password is submitted at the end of the recovery flow. */
  onResetPassword?: ((newPassword: string) => Promise<AuthActionResult>) | undefined;
  /** Called when "Request access" is activated. */
  onRequestAccessClick?: (() => void) | undefined;
  /** Called when "Find my workspace" is activated. */
  onFindWorkspaceClick?: (() => void) | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<AuthCardMessages> | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid on the card. */
  testId?: string | undefined;
};
