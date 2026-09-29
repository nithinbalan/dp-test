/**
 * Loading placeholder for the Edit Activity wizard, shown while `useActivity`
 * fetches the record being edited. Reuses the real wizard chrome (Stepper,
 * footer buttons, step-1 field labels/hints — all static copy known before
 * the fetch resolves) and only skeletons the actual prefilled values, so
 * nothing shifts shape once the activity loads. Mirrors `ActivityDetailSkeleton`'s
 * same real-chrome-plus-placeholder-values approach.
 */
import NextLink from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Heading } from '@atoms/Heading';
import { Label } from '@atoms/Label';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { Stepper } from '@molecules/Stepper';
import { WizardShell } from '@templates/WizardShell';
import type { AddActivityMessages } from '../../add/AddActivityWizard.types';

function EditHeaderSkeleton({ t }: { t: AddActivityMessages }) {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <NextLink href="/ropa" className="flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          {t.wizardBackCta}
        </NextLink>
      </Button>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-64" />
      </div>
    </>
  );
}

function EditFooterSkeleton({ t }: { t: AddActivityMessages }) {
  return (
    <>
      <Button asChild variant="outline" isDisabled>
        <NextLink href="/ropa">{t.wizardCancel}</NextLink>
      </Button>
      <div className="ms-auto">
        <Button tone="brand" isDisabled>
          {t.wizardNext}
        </Button>
      </div>
    </>
  );
}

function FieldSkeleton({
  label,
  hint,
  isRequired,
}: {
  label: string;
  hint: string;
  isRequired?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label isRequired={isRequired}>{label}</Label>
      <Skeleton className="h-9 w-full" />
      <Text size="xs" tone="muted">
        {hint}
      </Text>
    </div>
  );
}

function BasicsStepSkeleton({ t }: { t: AddActivityMessages }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading level={2} size="lg">
          {t.step1Heading}
        </Heading>
        <Text size="sm" tone="muted">
          {t.step1Sub}
        </Text>
      </div>
      <FieldSkeleton label={t.wizardNameLabel} hint={t.wizardNameHint} isRequired />
      <FieldSkeleton label={t.wizardPurposeLabel} hint={t.wizardPurposeHint} isRequired />
      <FieldSkeleton label={t.wizardPrincipalsLabel} hint={t.wizardPrincipalsHint} isRequired />
    </div>
  );
}

export function EditActivityWizardSkeleton({ t }: { t: AddActivityMessages }) {
  const steps = [t.wizardStepBasics, t.wizardStepData, t.wizardStepRules].map((label, index) => ({
    value: String(index),
    label,
  }));

  return (
    <div className="flex flex-col gap-4" aria-busy>
      <EditHeaderSkeleton t={t} />
      <WizardShell
        stepperSlot={
          <Stepper steps={steps} activeIndex={0} messages={{ label: t.wizardStepperLabel }} />
        }
        footerSlot={<EditFooterSkeleton t={t} />}
      >
        <BasicsStepSkeleton t={t} />
      </WizardShell>
    </div>
  );
}
