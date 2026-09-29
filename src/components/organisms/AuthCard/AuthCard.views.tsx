/** Internal to AuthCard — see the note in StepHeader.tsx. One small renderer per step. */
import { ForgotPasswordChoose } from './ForgotPasswordChoose';
import { ForgotPasswordDone } from './ForgotPasswordDone';
import { ForgotPasswordEnter } from './ForgotPasswordEnter';
import { ForgotPasswordReset } from './ForgotPasswordReset';
import { ForgotPasswordVerify } from './ForgotPasswordVerify';
import { SignInView } from './SignInView';
import { WhatsAppPhone } from './WhatsAppPhone';
import { WhatsAppVerify } from './WhatsAppVerify';
import type { AuthCardController } from './AuthCard.controller';

function renderSignIn(ctrl: AuthCardController) {
  return (
    <SignInView
      t={ctrl.t}
      workspaceDomain={ctrl.workspaceDomain}
      workspaceValue={ctrl.workspaceValue}
      onWorkspaceValueChange={ctrl.onWorkspaceValueChange}
      isLoading={ctrl.isLoading}
      errorMessage={ctrl.errorMessage}
      onSignIn={(email, password, rememberMe) => {
        ctrl.run(
          () => ctrl.onSignIn?.(email, password, rememberMe) ?? Promise.resolve({}),
          () => undefined,
        );
      }}
      onForgotPasswordClick={() => {
        ctrl.goTo('fp-choose');
      }}
      onWhatsAppClick={() => {
        ctrl.goTo('wa-phone');
      }}
      onRequestAccessClick={ctrl.onRequestAccessClick}
      onFindWorkspaceClick={ctrl.onFindWorkspaceClick}
    />
  );
}

function renderFpChoose(ctrl: AuthCardController) {
  return (
    <ForgotPasswordChoose
      t={ctrl.t}
      onBack={() => {
        ctrl.goTo('sign-in');
      }}
      onSelectEmail={() => {
        ctrl.setChannel('email');
        ctrl.goTo('fp-enter');
      }}
      onSelectWhatsApp={() => {
        ctrl.setChannel('whatsapp');
        ctrl.goTo('fp-enter');
      }}
    />
  );
}

function renderFpEnter(ctrl: AuthCardController) {
  return (
    <ForgotPasswordEnter
      t={ctrl.t}
      channel={ctrl.channel}
      isLoading={ctrl.isLoading}
      errorMessage={ctrl.errorMessage}
      onBack={() => {
        ctrl.goTo('fp-choose');
      }}
      onSubmit={(identifier) => {
        ctrl.run(
          () => ctrl.onSendCode?.(identifier, ctrl.channel) ?? Promise.resolve({}),
          () => {
            ctrl.goTo('fp-verify');
          },
        );
      }}
    />
  );
}

function renderFpVerify(ctrl: AuthCardController) {
  return (
    <ForgotPasswordVerify
      t={ctrl.t}
      isLoading={ctrl.isLoading}
      errorMessage={ctrl.errorMessage}
      onBack={() => {
        ctrl.goTo('fp-enter');
      }}
      onSubmit={(code) => {
        ctrl.run(
          () => ctrl.onVerifyCode?.(code) ?? Promise.resolve({}),
          () => {
            ctrl.goTo('fp-reset');
          },
        );
      }}
      onResend={() => undefined}
    />
  );
}

function renderFpReset(ctrl: AuthCardController) {
  return (
    <ForgotPasswordReset
      t={ctrl.t}
      isLoading={ctrl.isLoading}
      errorMessage={ctrl.errorMessage}
      onBack={() => {
        ctrl.goTo('fp-verify');
      }}
      onSubmit={(newPassword) => {
        ctrl.run(
          () => ctrl.onResetPassword?.(newPassword) ?? Promise.resolve({}),
          () => {
            ctrl.goTo('fp-done');
          },
        );
      }}
    />
  );
}

function renderFpDone(ctrl: AuthCardController) {
  return (
    <ForgotPasswordDone
      t={ctrl.t}
      onBackToSignIn={() => {
        ctrl.goTo('sign-in');
      }}
    />
  );
}

function renderWaPhone(ctrl: AuthCardController) {
  return (
    <WhatsAppPhone
      t={ctrl.t}
      isLoading={ctrl.isLoading}
      errorMessage={ctrl.errorMessage}
      onBack={() => {
        ctrl.goTo('sign-in');
      }}
      onSubmit={(phone) => {
        ctrl.run(
          () => ctrl.onSendCode?.(phone, 'whatsapp') ?? Promise.resolve({}),
          () => {
            ctrl.goTo('wa-verify');
          },
        );
      }}
    />
  );
}

function renderWaVerify(ctrl: AuthCardController) {
  return (
    <WhatsAppVerify
      t={ctrl.t}
      isLoading={ctrl.isLoading}
      errorMessage={ctrl.errorMessage}
      onBack={() => {
        ctrl.goTo('wa-phone');
      }}
      onChangeNumber={() => {
        ctrl.goTo('wa-phone');
      }}
      onResend={() => undefined}
      onSubmit={(code) => {
        ctrl.run(
          () => ctrl.onVerifyCode?.(code) ?? Promise.resolve({}),
          () => {
            ctrl.goTo('sign-in');
          },
        );
      }}
    />
  );
}

const RENDERERS: Record<AuthCardController['view'], (ctrl: AuthCardController) => React.ReactNode> =
  {
    'sign-in': renderSignIn,
    'fp-choose': renderFpChoose,
    'fp-enter': renderFpEnter,
    'fp-verify': renderFpVerify,
    'fp-reset': renderFpReset,
    'fp-done': renderFpDone,
    'wa-phone': renderWaPhone,
    'wa-verify': renderWaVerify,
  };

export function AuthCardView({ ctrl }: { ctrl: AuthCardController }) {
  return RENDERERS[ctrl.view](ctrl);
}
