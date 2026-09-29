import type { AuthCardMessages } from '@organisms/AuthCard';
import { env } from '@shared/config';
import type { Translate } from '@shared/lib';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { LoginPageClient } from './LoginPageClient';
import type { TrustPanelMessages } from './TrustPanel';

function buildAuthMessages(t: Translate<'auth'>): AuthCardMessages {
  return {
    tagline: t('tagline'),
    devModeHintLabel: t('devModeHintLabel'),
    devModeHintDescription: t('devModeHintDescription'),
    workspaceLabel: t('workspaceLabel'),
    workspacePlaceholder: t('workspacePlaceholder'),
    workspaceChangeLabel: t('workspaceChangeLabel'),
    findWorkspace: t('findWorkspace'),
    emailLabel: t('emailLabel'),
    emailPlaceholder: t('emailPlaceholder'),
    passwordLabel: t('passwordLabel'),
    forgotPassword: t('forgotPassword'),
    showPassword: t('showPassword'),
    hidePassword: t('hidePassword'),
    submit: t('submit'),
    keepSignedIn: t('keepSignedIn'),
    orDivider: t('orDivider'),
    whatsappSignIn: t('whatsappSignIn'),
    noAccount: t('noAccount'),
    requestAccess: t('requestAccess'),
    signInFailed: t('failed'),
    backToSignIn: t('backToSignIn'),
    otpLabel: t('otpLabel'),
    otpDigitLabel: t('otpDigitLabel'),
    genericError: t('genericError'),
    fpChooseTitle: t('fpChooseTitle'),
    fpChooseSubtitle: t('fpChooseSubtitle'),
    fpChooseEmailTitle: t('fpChooseEmailTitle'),
    fpChooseEmailSubtitle: t('fpChooseEmailSubtitle'),
    fpChooseWhatsAppTitle: t('fpChooseWhatsAppTitle'),
    fpChooseWhatsAppSubtitle: t('fpChooseWhatsAppSubtitle'),
    fpChooseFooter: t('fpChooseFooter'),
    fpEnterTitle: t('fpEnterTitle'),
    fpEnterEmailLabel: t('fpEnterEmailLabel'),
    fpEnterEmailPlaceholder: t('fpEnterEmailPlaceholder'),
    fpEnterWhatsAppLabel: t('fpEnterWhatsAppLabel'),
    fpEnterWhatsAppPlaceholder: t('fpEnterWhatsAppPlaceholder'),
    fpEnterSubmit: t('fpEnterSubmit'),
    fpVerifyTitle: t('fpVerifyTitle'),
    fpVerifySubmit: t('fpVerifySubmit'),
    fpVerifyResend: t('fpVerifyResend'),
    fpVerifyHint: t('fpVerifyHint'),
    fpResetTitle: t('fpResetTitle'),
    fpResetSubtitle: t('fpResetSubtitle'),
    fpResetNewPasswordLabel: t('fpResetNewPasswordLabel'),
    fpResetConfirmPasswordLabel: t('fpResetConfirmPasswordLabel'),
    fpResetSubmit: t('fpResetSubmit'),
    fpResetMismatch: t('fpResetMismatch'),
    fpDoneTitle: t('fpDoneTitle'),
    fpDoneBody: t('fpDoneBody'),
    fpDoneBackToSignIn: t('fpDoneBackToSignIn'),
    waPhoneTitle: t('waPhoneTitle'),
    waPhoneLabel: t('waPhoneLabel'),
    waPhonePlaceholder: t('waPhonePlaceholder'),
    waPhoneSubmit: t('waPhoneSubmit'),
    waPhoneInvalid: t('waPhoneInvalid'),
    waVerifyTitle: t('waVerifyTitle'),
    waVerifySubmit: t('waVerifySubmit'),
    waVerifyResend: t('waVerifyResend'),
    waChangeNumber: t('waChangeNumber'),
  };
}

function buildTrustPanelMessages(
  t: Translate<'auth'>,
  tc: Translate<'common'>,
): TrustPanelMessages {
  return {
    brandName: tc('appName'),
    headline: t('trustHeadline'),
    subhead: t('trustSubhead'),
    bulletEncryption: t('trustBulletEncryption'),
    bulletLanguages: t('trustBulletLanguages'),
    bulletAi: t('trustBulletAi'),
    testimonialQuote: t('trustTestimonialQuote'),
    testimonialInitials: t('trustTestimonialInitials'),
    testimonialName: t('trustTestimonialName'),
    testimonialRole: t('trustTestimonialRole'),
  };
}

/**
 * Sign-in route. A Server Component so it resolves locale and copy the same
 * way every other page does (see `@shared/lib/request-locale`,
 * `@shared/lib/messages`) — interaction lives in LoginPageClient, the one
 * client boundary this page needs. The message-catalogue mapping is pulled
 * into the two functions above purely to keep this function under the repo's
 * max-lines-per-function convention; it is mechanical, not logic.
 */
export default async function LoginPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'auth');
  const tc = getTranslator(locale, 'common');

  return (
    <LoginPageClient
      locale={locale}
      themeLabel={tc('changeTheme')}
      localeLabel={tc('changeLanguage')}
      authMessages={buildAuthMessages(t)}
      trustPanelMessages={buildTrustPanelMessages(t, tc)}
      workspaceDomain={`.${env.APP_BASE_DOMAIN}`}
    />
  );
}
