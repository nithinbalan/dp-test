'use client';

/**
 * @tier organisms
 *
 * The full sign-in card: composes Card (atom) as the surface, and switches
 * between the sign-in / forgot-password / WhatsApp-OTP views entirely on the
 * client, matching the source design's `showAuthView()` behaviour without
 * navigating. State and per-step JSX are split into AuthCard.controller.ts and
 * AuthCard.views.tsx respectively — see StepHeader.tsx for why those aren't
 * full design-system components of their own.
 */
import { Card } from '@atoms/Card';
import { cn } from '@shared/lib';
import type { AuthCardProps } from './AuthCard.types';
import { useAuthCardController } from './AuthCard.controller';
import { AuthCardView } from './AuthCard.views';

export function AuthCard(props: AuthCardProps) {
  const ctrl = useAuthCardController(props);

  return (
    <Card
      variant="outline"
      elevation="md"
      size="lg"
      className={cn('w-full', props.className)}
      testId={props.testId}
    >
      <AuthCardView ctrl={ctrl} />
    </Card>
  );
}
