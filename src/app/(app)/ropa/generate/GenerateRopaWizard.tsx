'use client';

/**
 * Owns the 4-step interview state. Prototype source: data-page="airopa",
 * `RPM`/`rpmRender()`/`rpmNext()` in app.html.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@atoms/Button';
import { PageHeader } from '@molecules/PageHeader';
import type { PersonOption } from '@molecules/PeoplePicker';
import { Stepper } from '@molecules/Stepper';
import { WizardShell } from '@templates/WizardShell';
import { useToast } from '@shared/hooks';
import {
  defaultInterviewAnswers,
  generateActivities,
  selectedKeys,
  type InterviewAnswers,
} from '@shared/mock/ropa-interview';
import { Step1WhoAndWhy, Step2Sharing, Step3Owners, Step4Review } from './GenerateRopaSteps';
import type { GenerateRopaMessages } from './GenerateRopaWizard.types';

const STEP_COUNT = 4;

function WizardFooter({
  t,
  step,
  canAdvance,
  onBack,
  onNext,
  onGenerate,
  onReviewIssues,
}: {
  t: GenerateRopaMessages;
  step: number;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  onGenerate: () => void;
  onReviewIssues: () => void;
}) {
  return (
    <>
      <Button
        variant="outline"
        tone="neutral"
        onClick={onBack}
        startSlot={step > 0 ? <ArrowLeft className="size-4" /> : undefined}
      >
        {step === 0 ? t.footerCancel : t.footerBack}
      </Button>
      <div className="ms-auto flex items-center gap-2.5">
        {step < STEP_COUNT - 1 ? (
          <Button
            tone="brand"
            isDisabled={!canAdvance}
            onClick={onNext}
            endSlot={<ArrowRight className="size-4" />}
          >
            {step === 2 ? t.footerReviewBeforeGenerate : t.footerContinue}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              tone="neutral"
              onClick={onReviewIssues}
              startSlot={<Wrench className="size-4" />}
            >
              {t.footerReviewIssues}
            </Button>
            <Button
              tone="brand"
              onClick={onGenerate}
              startSlot={<Sparkles className="text-accent-solid size-4" />}
            >
              {t.footerGenerate}
            </Button>
          </>
        )}
      </div>
    </>
  );
}

/** Step 0 needs at least one principal and one purpose selected. */
function hasMinimumSelections(answers: InterviewAnswers): boolean {
  return selectedKeys(answers.principals).length > 0 && selectedKeys(answers.purposes).length > 0;
}

function useGenerateWizardState(t: GenerateRopaMessages) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>(() => defaultInterviewAnswers());
  const activities = useMemo(() => generateActivities(answers), [answers]);

  function handleChange(next: Partial<InterviewAnswers>) {
    setAnswers((current) => ({ ...current, ...next }));
  }

  function handleBack() {
    if (step === 0) {
      router.push('/ropa');
      return;
    }
    setStep((current) => current - 1);
  }

  function handleNext() {
    if (step === 0 && !hasMinimumSelections(answers)) {
      toast.show({ label: t.validationSelectOne, tone: 'warning' });
      return;
    }
    if (step === 1 && !answers.crossBorder) {
      toast.show({ label: t.validationConfirmLocation, tone: 'warning' });
      return;
    }
    setStep((current) => current + 1);
  }

  function handleGenerate() {
    toast.show({
      label: t.toastGenerated.replace('{count}', String(activities.length)),
      tone: 'success',
    });
    router.push('/ropa');
  }

  function handleReviewIssues() {
    setStep(1);
    toast.show({ label: t.toastReviewIssues, tone: 'info' });
  }

  return {
    step,
    answers,
    activities,
    handleChange,
    handleBack,
    handleNext,
    handleGenerate,
    handleReviewIssues,
  };
}

function WizardStepBody({
  step,
  t,
  answers,
  activities,
  people,
  datasetCount,
  sourceCount,
  onChange,
}: {
  step: number;
  t: GenerateRopaMessages;
  answers: InterviewAnswers;
  activities: ReturnType<typeof generateActivities>;
  people: readonly PersonOption[];
  datasetCount: number;
  sourceCount: number;
  onChange: (next: Partial<InterviewAnswers>) => void;
}) {
  if (step === 0) {
    return (
      <Step1WhoAndWhy
        t={t}
        answers={answers}
        onChange={onChange}
        datasetCount={datasetCount}
        sourceCount={sourceCount}
        activityCount={activities.length}
      />
    );
  }
  if (step === 1) {
    return <Step2Sharing t={t} answers={answers} onChange={onChange} />;
  }
  if (step === 2) {
    return (
      <Step3Owners
        t={t}
        answers={answers}
        activities={activities}
        people={people}
        onChange={onChange}
      />
    );
  }
  return (
    <Step4Review
      t={t}
      answers={answers}
      activities={activities}
      datasetCount={datasetCount}
      sourceCount={sourceCount}
    />
  );
}

export function GenerateRopaWizard({
  t,
  people,
  datasetCount,
  sourceCount,
}: {
  t: GenerateRopaMessages;
  people: readonly PersonOption[];
  datasetCount: number;
  sourceCount: number;
}) {
  const {
    step,
    answers,
    activities,
    handleChange,
    handleBack,
    handleNext,
    handleGenerate,
    handleReviewIssues,
  } = useGenerateWizardState(t);

  const steps = [t.step1Label, t.step2Label, t.step3Label, t.step4Label].map((label, index) => ({
    value: String(index),
    label,
  }));
  const canAdvance = step !== 0 || hasMinimumSelections(answers);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader refTag={t.refTag} label={t.title} description={t.intro} />
      <WizardShell
        isFooterSticky
        stepperSlot={
          <Stepper steps={steps} activeIndex={step} messages={{ label: t.stepperLabel }} />
        }
        footerSlot={
          <WizardFooter
            t={t}
            step={step}
            canAdvance={canAdvance}
            onBack={handleBack}
            onNext={handleNext}
            onGenerate={handleGenerate}
            onReviewIssues={handleReviewIssues}
          />
        }
      >
        <WizardStepBody
          step={step}
          t={t}
          answers={answers}
          activities={activities}
          people={people}
          datasetCount={datasetCount}
          sourceCount={sourceCount}
          onChange={handleChange}
        />
      </WizardShell>
    </div>
  );
}
