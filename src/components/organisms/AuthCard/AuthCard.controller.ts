/**
 * Internal to AuthCard — see the note in StepHeader.tsx.
 *
 * All of the card's view-switching and per-step loading/error state, in one
 * hook. Kept separate from AuthCard.tsx (the render) and AuthCard.views.tsx
 * (the JSX per step) so no one file holds both state and markup at a size that
 * stops being readable.
 */
import { useState } from 'react';
import type { AuthActionResult, AuthCardMessages, AuthCardProps } from './AuthCard.types';
import { DEFAULT_MESSAGES } from './AuthCard.defaultMessages';

export type View =
  | 'sign-in'
  | 'fp-choose'
  | 'fp-enter'
  | 'fp-verify'
  | 'fp-reset'
  | 'fp-done'
  | 'wa-phone'
  | 'wa-verify';

export type AuthCardController = AuthCardProps & {
  t: AuthCardMessages;
  view: View;
  channel: 'email' | 'whatsapp';
  isLoading: boolean;
  errorMessage: string | undefined;
  goTo: (next: View) => void;
  setChannel: (channel: 'email' | 'whatsapp') => void;
  run: (action: (() => Promise<AuthActionResult>) | undefined, onSuccess: () => void) => void;
};

export function useAuthCardController(props: AuthCardProps): AuthCardController {
  const t = { ...DEFAULT_MESSAGES, ...props.messages };
  const [view, setView] = useState<View>('sign-in');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  function goTo(next: View) {
    setErrorMessage(undefined);
    setView(next);
  }

  function run(action: (() => Promise<AuthActionResult>) | undefined, onSuccess: () => void) {
    setIsLoading(true);
    setErrorMessage(undefined);
    void (async () => {
      const result = (await action?.()) ?? {};
      setIsLoading(false);
      if (result.errorMessage !== undefined) {
        setErrorMessage(result.errorMessage);
      } else {
        onSuccess();
      }
    })();
  }

  return { ...props, t, view, channel, isLoading, errorMessage, goTo, setChannel, run };
}
