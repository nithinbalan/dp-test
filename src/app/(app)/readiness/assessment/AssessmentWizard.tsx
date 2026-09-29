'use client';

/**
 * The guided Gap Assessment wizard — step 1 is the scope/profile form, steps
 * 2–6 page through the questionnaire's questions grouped by domain (`STEPS`,
 * a UI-only pagination grouping — the domains/questions themselves come from
 * `useReadiness()`, not a mock). Ported from the prototype's
 * `gaWzRender()`/`gaFoot()`/`gaFinish()`. The run lives server-side now: every
 * profile/answer change is a PATCH to `/api/readiness/[runId]`, not a
 * sessionStorage write — see `@shared/hooks/use-readiness`'s header.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { Button } from '@atoms/Button';
import { PageHeader } from '@molecules/PageHeader';
import { Progress } from '@atoms/Progress';
import { Skeleton } from '@atoms/Skeleton';
import { Stepper } from '@molecules/Stepper';
import { Text } from '@atoms/Text';
import { WizardShell } from '@templates/WizardShell';
import {
  useEmployees,
  useFinishRun,
  useReadiness,
  useStartAssessment,
  useToast,
  useUpdateRun,
  useWorkspaceSettings,
  type AnswerValue,
  type AssessmentProfile,
  type EmployeeRow,
  type ReadinessCatalogDomain,
  type ReadinessCatalogQuestion,
  type ReadinessState,
  type WorkspaceSettingsData,
} from '@shared/hooks';
import type { PersonOption } from '@molecules/PeoplePicker';
import { AssessmentDemoBar } from './AssessmentDemoBar';
import { ProfileStep, QuestionStep } from './AssessmentSteps';
import type { AssessmentMessages } from './AssessmentMessages';

/** Wizard pagination — step 1 is the scope profile, steps 2–6 group 1–3
 * domains each by the seed's domain keys (A–I). Pure UI grouping, not
 * business data, so it stays a local constant rather than coming from the API. */
type WizardStep =
  { title: string; profile: true } | { title: string; profile?: false; domains: readonly string[] };

const STEPS: readonly WizardStep[] = [
  { title: 'Your organisation', profile: true },
  { title: 'Notice & consent', domains: ['A', 'B'] },
  { title: 'Rights', domains: ['C'] },
  { title: 'Security & breach', domains: ['D', 'E'] },
  { title: 'Data lifecycle', domains: ['F', 'G', 'H'] },
  { title: 'Governance', domains: ['I'] },
] as const;

/** `STEPS` filtered to the domains actually returned by the API — a domain
 * an admin has deactivated in Configuration Studio's Master Data isn't in
 * `domains` any more (see `@api/readiness`'s `listDomains`), so a step
 * built only from that domain must disappear here too, not just lose its
 * questions while its tab keeps showing. A step naming several domains
 * (e.g. "Notice & consent" = A + B) keeps showing for its still-active
 * ones — and if deactivating one drops the step down to a single surviving
 * domain, the step's title switches to that domain's own name, so "Notice
 * & consent" never sits over a step that only asks about children's data. */
function computeActiveSteps(domains: readonly ReadinessCatalogDomain[]): WizardStep[] {
  const activeKeys = new Set(domains.map((d) => d.key));
  const nameByKey = new Map(domains.map((d) => [d.key, d.name]));
  return STEPS.map((s) => {
    if (s.profile) return s;
    const remaining = s.domains.filter((k) => activeKeys.has(k));
    const title =
      remaining.length > 0 && remaining.length < s.domains.length
        ? remaining.map((k) => nameByKey.get(k) ?? k).join(' & ')
        : s.title;
    return { ...s, title, domains: remaining };
  }).filter((s) => s.profile ?? s.domains.length > 0);
}

/** Workspace Settings stores the sector as a stable key (`healthcare`); the
 * Gap Assessment's `Sector` field — ported verbatim from the prototype's
 * dropdown — uses the display string itself as its value (`"Healthcare"`).
 * Translates the former into the latter so the auto-seeded value actually
 * matches one of `AssessmentSteps.tsx`'s `SECTOR_OPTIONS`, instead of silently
 * matching nothing and leaving the `Select` showing its first option. */
const WORKSPACE_SECTOR_TO_GA_SECTOR: Record<string, string> = {
  saas: 'SaaS / IT services',
  ecommerce: 'E-commerce / D2C',
  healthcare: 'Healthcare',
  edtech: 'EdTech',
  bfsi: 'BFSI / Fintech',
  manufacturing: 'Manufacturing',
  professional: 'Professional services',
};

function isProfileComplete(profile: AssessmentProfile): boolean {
  return (
    profile.kids !== null && profile.proc !== null && profile.xbt !== null && profile.sens !== null
  );
}

export function isQuestionActive(
  question: ReadinessCatalogQuestion,
  domainsById: Map<string, ReadinessCatalogDomain>,
  profile: AssessmentProfile,
): boolean {
  const gate = domainsById.get(question.domainId)?.gateKey;
  if (!gate) return true;
  return profile[gate as keyof AssessmentProfile] !== 'no';
}

function employeeToPersonOption(employee: EmployeeRow): PersonOption {
  return {
    id: employee.id,
    name: employee.fullName,
    initials: employee.fullName
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    detail: employee.designation ?? undefined,
  };
}

function usePeopleOptions(): PersonOption[] {
  const { data } = useEmployees();
  return (data?.employees ?? []).map(employeeToPersonOption);
}

/** The first step with an unanswered question — used to land "Resume" on
 * where the user left off, step 1 if the scope profile itself isn't done
 * yet, or the last step once everything is answered. */
function firstGapStep(
  profile: AssessmentProfile,
  answers: Record<string, AnswerValue | undefined>,
  domains: readonly ReadinessCatalogDomain[],
  questions: readonly ReadinessCatalogQuestion[],
  steps: readonly WizardStep[],
): number {
  if (!isProfileComplete(profile)) return 1;
  const domainsById = new Map(domains.map((d) => [d.id, d]));
  const domainKeyById = new Map(domains.map((d) => [d.id, d.key]));
  for (const [index, s] of steps.entries()) {
    if (s.profile) continue;
    const hasGap = questions.some(
      (q) =>
        s.domains.includes(domainKeyById.get(q.domainId) ?? '') &&
        isQuestionActive(q, domainsById, profile) &&
        !answers[q.id],
    );
    if (hasGap) return index + 1;
  }
  return steps.length;
}

function WizardFooter({
  t,
  step,
  totalSteps,
  answered,
  total,
  onBack,
  onExit,
  onNext,
  onJumpUnanswered,
  onFinish,
  isFinishing,
}: {
  t: AssessmentMessages;
  step: number;
  totalSteps: number;
  answered: number;
  total: number;
  onBack: () => void;
  onExit: () => void;
  onNext: () => void;
  onJumpUnanswered: () => void;
  onFinish: () => void;
  isFinishing: boolean;
}) {
  const percent = total === 0 ? 0 : Math.round((answered / total) * 100);
  const isLastStep = step === totalSteps;
  const left = total - answered;

  return (
    <>
      {step > 1 ? (
        <Button variant="outline" startSlot={<ArrowLeft className="size-4" />} onClick={onBack}>
          {t.wizardBack}
        </Button>
      ) : (
        <Button variant="outline" onClick={onExit}>
          {t.wizardSaveExit}
        </Button>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <Progress value={percent} label={t.wizardProgressLabel} size="sm" className="max-w-32" />
        <Text
          as="span"
          size="2xs"
          isMono
          tone="muted"
          className="tracking-wide whitespace-nowrap uppercase"
        >
          {t.wizardProgress
            .replace('{answered}', String(answered))
            .replace('{total}', String(total))}
        </Text>
      </div>

      {!isLastStep ? (
        <Button tone="brand" endSlot={<ArrowRight className="size-4" />} onClick={onNext}>
          {t.wizardNext}
        </Button>
      ) : left > 0 ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onJumpUnanswered}>
            {t.wizardJumpUnanswered}
          </Button>
          <Button variant="outline" isDisabled startSlot={<Lock className="size-4" />}>
            {t.wizardLeftToUnlock.replace('{count}', String(left))}
          </Button>
        </div>
      ) : (
        <Button
          tone="brand"
          startSlot={<Sparkles className="size-4" />}
          onClick={onFinish}
          isDisabled={isFinishing}
        >
          {isFinishing ? t.wizardGenerating : t.wizardSubmit}
        </Button>
      )}
    </>
  );
}

/** One skeleton question — shaped like `QuestionCard` in `AssessmentSteps.tsx`:
 * a code badge, two lines of prompt text, a tag row, then a segmented-control-
 * shaped bar — rather than one generic block standing in for a dense card. */
function QuestionCardSkeleton() {
  return (
    <div className="border-border-default flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-0.5 h-4 w-8 shrink-0" />
        <div className="min-w-0 flex-1 gap-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="mt-1.5 h-3.5 w-2/3" />
          <div className="mt-2 flex gap-1.5">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-8 w-56" />
    </div>
  );
}

/** Loading placeholder for the wizard footer — same three-slot layout as
 * `WizardFooter`: a button, the progress readout, a button. */
function WizardFooterSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-24" />
      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <Skeleton className="h-1.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-28" />
    </>
  );
}

/** Loading placeholder for the whole wizard — real `PageHeader`/`Stepper`
 * chrome (static copy, not data, so there's nothing to wait on) around a
 * skeleton body and footer, so nothing shifts once the run arrives. */
function AssessmentWizardSkeleton({ t }: { t: AssessmentMessages }) {
  const steps = STEPS.map((s, index) => ({ value: String(index), label: s.title }));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t.wizardTitle} />
      <WizardShell
        stepperSlot={
          <Stepper steps={steps} activeIndex={0} messages={{ label: t.wizardStepperLabel }} />
        }
        footerSlot={<WizardFooterSkeleton />}
        isFooterSticky
      >
        <div className="flex flex-col gap-3" aria-busy>
          <QuestionCardSkeleton />
          <QuestionCardSkeleton />
          <QuestionCardSkeleton />
        </div>
      </WizardShell>
    </div>
  );
}

/** Seeds a fresh run's blank profile from Workspace Settings' entity name and
 * sector once, rather than asking the user to retype what the workspace
 * already knows about itself. */
function useEntitySeed(
  state: ReadinessState | undefined,
  workspaceSettings: WorkspaceSettingsData | undefined,
  updateRun: ReturnType<typeof useUpdateRun>,
) {
  const [hasSeeded, setHasSeeded] = useState(false);
  useEffect(() => {
    if (hasSeeded || state?.kind !== 'in-progress' || workspaceSettings === undefined) return;
    if (state.profile.entity !== '' || updateRun.isPending) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time gate so the seed PATCH fires once per run, not on every render
    setHasSeeded(true);
    updateRun.mutate({
      profile: {
        ...state.profile,
        entity: workspaceSettings.legalName,
        sector:
          state.profile.sector ||
          (WORKSPACE_SECTOR_TO_GA_SECTOR[workspaceSettings.sector] ?? state.profile.sector),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per run, guarded by hasSeeded
  }, [hasSeeded, state, workspaceSettings]);
}

/** "Jump to unanswered" (`gaJumpUnanswered()` in the prototype) switches step
 * AND highlights the target question once it mounts — the `.flash` ring the
 * prototype clears the moment the question gets answered. */
function useFlashQuestion(step: number) {
  const [flashQuestionId, setFlashQuestionId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!flashQuestionId) return undefined;
    const el = document.getElementById(`gq-${flashQuestionId}`);
    if (!el) return undefined;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timeout = setTimeout(() => {
      setFlashQuestionId(undefined);
    }, 1600);
    return () => {
      clearTimeout(timeout);
    };
  }, [flashQuestionId, step]);
  return { flashQuestionId, setFlashQuestionId };
}

function useOverallCounts(
  questions: readonly ReadinessCatalogQuestion[],
  domainsById: Map<string, ReadinessCatalogDomain>,
  state: ReadinessState | undefined,
) {
  return useMemo(() => {
    if (state?.kind !== 'in-progress') return { total: 0, answered: 0 };
    const active = questions.filter((q) => isQuestionActive(q, domainsById, state.profile));
    return {
      total: active.length,
      answered: active.filter((q) => state.answers[q.id] !== undefined).length,
    };
  }, [questions, domainsById, state]);
}

/** Lands the wizard on the right step on mount: starts a fresh run if there
 * is none yet, resumes "Change scope" (`?step=1`) at the profile step, and
 * otherwise resumes at the first gap the user hasn't answered. */
function useInitialStep(
  isLoading: boolean,
  state: ReadinessState | undefined,
  domains: readonly ReadinessCatalogDomain[],
  questions: readonly ReadinessCatalogQuestion[],
  steps: readonly WizardStep[],
  startAssessment: ReturnType<typeof useStartAssessment>,
) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [hasSetInitialStep, setHasSetInitialStep] = useState(false);

  useEffect(() => {
    if (isLoading || hasSetInitialStep) return;
    if (state?.kind === 'empty' && !startAssessment.isPending) {
      startAssessment.mutate();
      return;
    }
    if (state?.kind !== 'in-progress') return;
    const forcedStep = searchParams.get('step');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the server-fetched run on mount
    setStep(
      forcedStep === '1'
        ? 1
        : firstGapStep(state.profile, state.answers, domains, questions, steps),
    );
    setHasSetInitialStep(true);
  }, [
    isLoading,
    hasSetInitialStep,
    state,
    searchParams,
    domains,
    questions,
    steps,
    startAssessment,
  ]);

  return { step, setStep, hasSetInitialStep };
}

/** Step-navigation and submit handlers shared by the footer and stepper —
 * pulled out of the component body so it stays under the line budget. Not a
 * hook itself (calls none), so it's safe to call after the loading guard's
 * early return below. */
function buildWizardHandlers({
  t,
  step,
  setStep,
  steps,
  profile,
  answers,
  questions,
  domainsById,
  overallCounts,
  toast,
  router,
  finishRun,
  setFlashQuestionId,
}: {
  t: AssessmentMessages;
  step: number;
  setStep: (step: number) => void;
  steps: readonly WizardStep[];
  profile: AssessmentProfile;
  answers: Record<string, AnswerValue>;
  questions: readonly ReadinessCatalogQuestion[];
  domainsById: Map<string, ReadinessCatalogDomain>;
  overallCounts: { answered: number; total: number };
  toast: ReturnType<typeof useToast>;
  router: ReturnType<typeof useRouter>;
  finishRun: ReturnType<typeof useFinishRun>;
  setFlashQuestionId: (questionId: string | undefined) => void;
}) {
  function goToStep(next: number) {
    setStep(Math.min(Math.max(next, 1), steps.length));
  }

  function handleNext() {
    if (step === 1 && !isProfileComplete(profile)) {
      toast.show({ label: t.toastScopeRequired, tone: 'warning' });
      return;
    }
    goToStep(step + 1);
  }

  function handleExit() {
    const { answered, total } = overallCounts;
    if (answered > 0) {
      toast.show({
        label: t.toastSavedProgress
          .replace('{answered}', String(answered))
          .replace('{total}', String(total)),
        tone: 'success',
      });
    }
    router.push('/readiness');
  }

  function handleJumpUnanswered() {
    const firstUnanswered = questions
      .filter((q) => isQuestionActive(q, domainsById, profile))
      .find((q) => answers[q.id] === undefined);
    if (!firstUnanswered) return;
    const domainKey = domainsById.get(firstUnanswered.domainId)?.key;
    const targetStepIndex = steps.findIndex(
      (s) => !s.profile && domainKey && s.domains.includes(domainKey),
    );
    if (targetStepIndex < 0) return;
    setFlashQuestionId(firstUnanswered.id);
    goToStep(targetStepIndex + 1);
  }

  function handleFinish() {
    runFinish(t, toast, router, finishRun);
  }

  return { goToStep, handleNext, handleExit, handleJumpUnanswered, handleFinish };
}

function runFinish(
  t: AssessmentMessages,
  toast: ReturnType<typeof useToast>,
  router: ReturnType<typeof useRouter>,
  finishRun: ReturnType<typeof useFinishRun>,
) {
  finishRun.mutate(undefined, {
    onSuccess: (result) => {
      const report = result.state.kind === 'completed' ? result.state.report : undefined;
      toast.show({
        label: t.toastAssessmentComplete
          .replace('{score}', String(report?.score ?? 0))
          .replace('{gaps}', String(report?.gaps.length ?? 0)),
        tone: 'success',
      });
      router.push('/readiness');
    },
    onError: () => {
      toast.show({ label: t.toastScopeRequired, tone: 'danger' });
    },
  });
}

type WizardBodyProps = {
  t: AssessmentMessages;
  step: number;
  steps: { value: string; label: string }[];
  currentStep: WizardStep;
  overallCounts: { answered: number; total: number };
  people: PersonOption[];
  domains: ReadinessCatalogDomain[];
  questions: ReadinessCatalogQuestion[];
  profile: AssessmentProfile;
  answers: Record<string, AnswerValue>;
  notes: Record<string, string>;
  flashQuestionId: string | undefined;
  updateRun: ReturnType<typeof useUpdateRun>;
  finishRun: ReturnType<typeof useFinishRun>;
  toast: ReturnType<typeof useToast>;
  goToStep: (next: number) => void;
  handleNext: () => void;
  handleExit: () => void;
  handleJumpUnanswered: () => void;
  handleFinish: () => void;
};

/** The current step's form — the one part of `WizardBody` that switches on
 * `currentStep`, split out so each function stays under the line budget. */
function WizardStepContent({
  t,
  currentStep,
  people,
  domains,
  questions,
  profile,
  answers,
  notes,
  flashQuestionId,
  updateRun,
}: Pick<
  WizardBodyProps,
  | 't'
  | 'currentStep'
  | 'people'
  | 'domains'
  | 'questions'
  | 'profile'
  | 'answers'
  | 'notes'
  | 'flashQuestionId'
  | 'updateRun'
>) {
  if (currentStep.profile) {
    return (
      <ProfileStep
        t={t}
        profile={profile}
        people={people}
        domains={domains}
        questions={questions}
        onChange={(patch) => {
          updateRun.mutate({ profile: { ...profile, ...patch } });
        }}
      />
    );
  }
  return (
    <QuestionStep
      t={t}
      domainKeys={currentStep.domains}
      domains={domains}
      questions={questions}
      profile={profile}
      answers={answers}
      notes={notes}
      flashQuestionId={flashQuestionId}
      onAnswer={(questionId, value) => {
        updateRun.mutate({ answer: { questionId, value, note: notes[questionId] } });
      }}
      onNote={(questionId, note) => {
        const value = answers[questionId];
        if (value === undefined) return;
        updateRun.mutate({ answer: { questionId, value, note } });
      }}
    />
  );
}

/** Wraps `AssessmentDemoBar` with its production gate — split out purely to
 * keep `WizardBody` under the line budget. */
function WizardDemoBarSlot({
  t,
  profile,
  questions,
  domains,
  people,
  updateRun,
  toast,
  goToStep,
  handleFinish,
}: Pick<
  WizardBodyProps,
  | 't'
  | 'profile'
  | 'questions'
  | 'domains'
  | 'people'
  | 'updateRun'
  | 'toast'
  | 'goToStep'
  | 'handleFinish'
>) {
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <AssessmentDemoBar
      t={t}
      profile={profile}
      questions={questions}
      domains={domains}
      people={people}
      updateRun={updateRun}
      toast={toast}
      onFilled={() => {
        goToStep(1);
      }}
      onGenerate={handleFinish}
    />
  );
}

function WizardStepperSlot({
  t,
  step,
  steps,
  goToStep,
}: {
  t: AssessmentMessages;
  step: number;
  steps: { value: string; label: string }[];
  goToStep: (next: number) => void;
}) {
  return (
    <Stepper
      steps={steps}
      activeIndex={step - 1}
      messages={{ label: t.wizardStepperLabel }}
      onValueChange={(value) => {
        const target = Number(value) + 1;
        if (target < step) goToStep(target);
      }}
    />
  );
}

/** The wizard's shell + current step, once a run and its initial step are
 * resolved — split out of `AssessmentWizard` purely to stay under the line
 * budget; it owns no state of its own. */
function WizardBody({
  t,
  step,
  steps,
  currentStep,
  overallCounts,
  people,
  domains,
  questions,
  profile,
  answers,
  notes,
  flashQuestionId,
  updateRun,
  finishRun,
  toast,
  goToStep,
  handleNext,
  handleExit,
  handleJumpUnanswered,
  handleFinish,
}: WizardBodyProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t.wizardTitle} />
      <WizardDemoBarSlot
        t={t}
        profile={profile}
        questions={questions}
        domains={domains}
        people={people}
        updateRun={updateRun}
        toast={toast}
        goToStep={goToStep}
        handleFinish={handleFinish}
      />
      <WizardShell
        stepperSlot={<WizardStepperSlot t={t} step={step} steps={steps} goToStep={goToStep} />}
        footerSlot={
          <WizardFooter
            t={t}
            step={step}
            totalSteps={steps.length}
            answered={overallCounts.answered}
            total={overallCounts.total}
            onBack={() => {
              goToStep(step - 1);
            }}
            onExit={handleExit}
            onNext={handleNext}
            onJumpUnanswered={handleJumpUnanswered}
            onFinish={handleFinish}
            isFinishing={finishRun.isPending}
          />
        }
        isFooterSticky
      >
        <WizardStepContent
          t={t}
          currentStep={currentStep}
          people={people}
          domains={domains}
          questions={questions}
          profile={profile}
          answers={answers}
          notes={notes}
          flashQuestionId={flashQuestionId}
          updateRun={updateRun}
        />
      </WizardShell>
    </div>
  );
}

export function AssessmentWizard({ t }: { t: AssessmentMessages }) {
  const router = useRouter();
  const toast = useToast();
  const people = usePeopleOptions();
  const { data, isLoading } = useReadiness();
  const { data: workspaceSettings } = useWorkspaceSettings();
  const startAssessment = useStartAssessment();

  const state = data?.state;
  const domains = useMemo(() => data?.domains ?? [], [data]);
  const questions = useMemo(() => data?.questions ?? [], [data]);
  const runId = state?.kind === 'in-progress' ? state.runId : undefined;
  const updateRun = useUpdateRun(runId ?? '');
  const finishRun = useFinishRun(runId ?? '');

  // A domain an admin has deactivated drops its step from the wizard
  // entirely, not just its questions — see `computeActiveSteps`.
  const activeSteps = useMemo(() => computeActiveSteps(domains), [domains]);

  useEntitySeed(state, workspaceSettings, updateRun);
  const { step, setStep, hasSetInitialStep } = useInitialStep(
    isLoading,
    state,
    domains,
    questions,
    activeSteps,
    startAssessment,
  );

  const { flashQuestionId, setFlashQuestionId } = useFlashQuestion(step);

  const domainsById = useMemo(() => new Map(domains.map((d) => [d.id, d])), [domains]);
  const overallCounts = useOverallCounts(questions, domainsById, state);

  const steps = activeSteps.map((s, index) => ({ value: String(index), label: s.title }));
  const currentStep = activeSteps[step - 1];

  if (isLoading || !hasSetInitialStep || state?.kind !== 'in-progress' || !currentStep) {
    return <AssessmentWizardSkeleton t={t} />;
  }

  const { profile, answers, notes } = state;

  const { goToStep, handleNext, handleExit, handleJumpUnanswered, handleFinish } =
    buildWizardHandlers({
      t,
      step,
      setStep,
      steps: activeSteps,
      profile,
      answers,
      questions,
      domainsById,
      overallCounts,
      toast,
      router,
      finishRun,
      setFlashQuestionId,
    });

  return (
    <WizardBody
      t={t}
      step={step}
      steps={steps}
      currentStep={currentStep}
      overallCounts={overallCounts}
      people={people}
      domains={domains}
      questions={questions}
      profile={profile}
      answers={answers}
      notes={notes}
      flashQuestionId={flashQuestionId}
      updateRun={updateRun}
      finishRun={finishRun}
      toast={toast}
      goToStep={goToStep}
      handleNext={handleNext}
      handleExit={handleExit}
      handleJumpUnanswered={handleJumpUnanswered}
      handleFinish={handleFinish}
    />
  );
}
