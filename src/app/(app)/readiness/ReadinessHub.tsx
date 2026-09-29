'use client';

/**
 * The Gap Assessment hub — three states, matching the prototype's `gaRender()`
 * branch on `GA.started`/`GA.done`: never assessed (empty), in progress
 * (resume banner), or a completed run (the full report). Reads
 * `useReadiness()` — the run lives server-side, see `@shared/hooks/use-readiness`.
 */
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  ClipboardList,
  FileText,
  Inbox,
  Pause,
  Play,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { PageHeader } from '@molecules/PageHeader';
import { useReadiness, useStartAssessment, useToast } from '@shared/hooks';
import type {
  AssessmentProfile,
  ReadinessCatalogDomain,
  ReadinessCatalogQuestion,
  ReadinessState,
} from '@shared/hooks/use-readiness';
import { ReadinessReport } from './ReadinessReport';
import type { ReadinessMessages } from './ReadinessMessages';

type HubProps = {
  t: ReadinessMessages;
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
};

function EmptyAssessment({
  t,
  questionCount,
  onStart,
  isStarting,
}: {
  t: ReadinessMessages;
  questionCount: number;
  onStart: () => void;
  isStarting: boolean;
}) {
  const toast = useToast();
  const features = [
    { label: t.tagNotice, icon: <FileText className="size-4" /> },
    { label: t.tagRights, icon: <Inbox className="size-4" /> },
    { label: t.tagSecurity, icon: <ShieldCheck className="size-4" /> },
    { label: t.tagRetention, icon: <Trash2 className="size-4" /> },
    { label: t.tagProcessors, icon: <Sparkles className="size-4" /> },
    { label: t.tagTransfers, icon: <Scale className="size-4" /> },
    { label: t.tagGovernance, icon: <ClipboardList className="size-4" /> },
  ];

  return (
    <Card variant="outline" size="none" className="border-dashed">
      <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
        <span className="bg-brand-subtle text-brand-fg rounded-pill mb-1 grid size-20 place-items-center">
          <ClipboardList className="size-9" strokeWidth={1.8} />
        </span>
        <Heading level={2} size="lg">
          {t.emptyTitle}
        </Heading>
        <Text size="sm" tone="muted" className="max-w-2xl">
          {t.emptyDescription.replace('{count}', String(questionCount))}
        </Text>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {features.map((feature) => (
            <span
              key={feature.label}
              className="border-border-default bg-bg-canvas text-fg-default rounded-pill inline-flex items-center gap-1.5 border px-3.5 py-1.5 text-xs font-medium"
            >
              <span className="text-brand-fg">{feature.icon}</span>
              {feature.label}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            tone="brand"
            size="lg"
            startSlot={<Play className="size-4" />}
            onClick={onStart}
            isDisabled={isStarting}
          >
            {t.startCta}
          </Button>
          <Button
            variant="outline"
            tone="brand"
            size="lg"
            startSlot={<SlidersHorizontal className="size-4" />}
            onClick={() => {
              toast.show({ label: t.howScoredCta, tone: 'info' });
            }}
          >
            {t.howScoredCta}
          </Button>
        </div>
        <Text as="span" size="2xs" tone="muted" isMono className="mt-1 tracking-widest uppercase">
          {t.baselineCaption}
        </Text>
      </div>
    </Card>
  );
}

function ResumeBanner({
  t,
  answered,
  total,
  nextStepLabel,
}: {
  t: ReadinessMessages;
  answered: number;
  total: number;
  nextStepLabel: string;
}) {
  return (
    <Card variant="outline" className="flex flex-wrap items-center gap-4">
      <span className="bg-brand-subtle text-brand-fg grid size-12 shrink-0 place-items-center rounded-xl">
        <Pause className="size-5" />
      </span>
      <div className="min-w-60 flex-1">
        <Text as="div" weight="bold">
          {t.resumeTitle}
          {' — '}
          {t.resumeAnsweredOf
            .replace('{answered}', String(answered))
            .replace('{total}', String(total))}
        </Text>
        <Text size="sm" tone="muted" className="mt-1">
          {t.resumeNextUp.replace('{step}', nextStepLabel)}
        </Text>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" tone="brand">
          <NextLink href="/readiness/assessment?step=1">{t.changeScopeCta}</NextLink>
        </Button>
        <Button asChild tone="brand">
          <NextLink href="/readiness/assessment">
            <Play className="me-1.5 inline size-4" />
            {t.resumeCta}
          </NextLink>
        </Button>
      </div>
    </Card>
  );
}

function ResumeKpis({
  t,
  answered,
  total,
  inScope,
  notApplicable,
}: {
  t: ReadinessMessages;
  answered: number;
  total: number;
  inScope: number;
  notApplicable: number;
}) {
  const metrics = [
    { label: t.kpiAnswered, value: answered },
    { label: t.kpiRemaining, value: total - answered },
    { label: t.kpiInScope, value: inScope },
    { label: t.kpiNotApplicable, value: notApplicable },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} size="sm" className="flex flex-col gap-1">
          <Text as="span" size="lg" weight="bold">
            {String(metric.value)}
          </Text>
          <Text as="span" size="2xs" tone="subtle" isMono className="tracking-widest uppercase">
            {metric.label}
          </Text>
        </Card>
      ))}
    </div>
  );
}

/** Loading placeholder for the hub's top region — same rounded card as the
 * hero/resume-banner/empty-state it stands in for: a leading circle, two
 * lines of copy, a trailing action. */
function HubTopCardSkeleton() {
  return (
    <Card variant="outline" className="flex flex-wrap items-center gap-4" aria-busy>
      <Skeleton shape="circle" className="size-12 shrink-0" />
      <div className="min-w-60 flex-1">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-2 h-3 w-40" />
      </div>
      <Skeleton className="h-9 w-32" />
    </Card>
  );
}

/** Loading placeholder for the KPI row — same 2x4 grid `ResumeKpis`/`KpiStrip`
 * both use, so the hub doesn't jump once real numbers arrive. */
function HubKpisSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy>
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} size="sm" className="flex flex-col gap-1">
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-2.5 w-20" />
        </Card>
      ))}
    </div>
  );
}

function ReadinessHubSkeleton({ pageLabel, pageRefTag, pageDescription }: Omit<HubProps, 't'>) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />
      <HubTopCardSkeleton />
      <HubKpisSkeleton />
    </div>
  );
}

/** Which catalog questions are in scope for an in-progress run — a question
 * is out of scope only when its domain's gate profile answer is `no`. */
function activeQuestionsFor(
  domains: ReadinessCatalogDomain[],
  questions: ReadinessCatalogQuestion[],
  profile: AssessmentProfile,
) {
  const domainById = new Map(domains.map((d) => [d.id, d]));
  return questions.filter((q) => {
    const gate = domainById.get(q.domainId)?.gateKey;
    return !gate || profile[gate as keyof AssessmentProfile] !== 'no';
  });
}

function InProgressView({
  t,
  pageLabel,
  pageRefTag,
  pageDescription,
  domains,
  questions,
  state,
  onResume,
}: HubProps & {
  domains: ReadinessCatalogDomain[];
  questions: ReadinessCatalogQuestion[];
  state: Extract<ReadinessState, { kind: 'in-progress' }>;
  onResume: () => void;
}) {
  const activeQuestions = activeQuestionsFor(domains, questions, state.profile);
  const answered = activeQuestions.filter((q) => state.answers[q.id] !== undefined).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        label={pageLabel}
        refTag={pageRefTag}
        description={pageDescription}
        actionSlot={
          <Button tone="brand" startSlot={<Play className="size-4" />} onClick={onResume}>
            {t.resumeCta}
          </Button>
        }
      />
      <ResumeBanner
        t={t}
        answered={answered}
        total={activeQuestions.length}
        nextStepLabel={t.resumeCta}
      />
      <ResumeKpis
        t={t}
        answered={answered}
        total={activeQuestions.length}
        inScope={activeQuestions.length}
        notApplicable={questions.length - activeQuestions.length}
      />
    </div>
  );
}

export function ReadinessHub({ t, pageLabel, pageRefTag, pageDescription }: HubProps) {
  const router = useRouter();
  const { data, isLoading } = useReadiness();
  const startAssessment = useStartAssessment();

  if (isLoading || !data) {
    return (
      <ReadinessHubSkeleton
        pageLabel={pageLabel}
        pageRefTag={pageRefTag}
        pageDescription={pageDescription}
      />
    );
  }
  const { state, domains, questions } = data;

  if (state.kind === 'completed') {
    return (
      <ReadinessReport
        t={t}
        pageLabel={pageLabel}
        pageRefTag={pageRefTag}
        pageDescription={pageDescription}
        report={state.report}
        onRetake={() => {
          startAssessment.mutate(undefined, {
            onSuccess: () => {
              router.push('/readiness/assessment?step=1');
            },
          });
        }}
      />
    );
  }

  if (state.kind === 'in-progress') {
    return (
      <InProgressView
        t={t}
        pageLabel={pageLabel}
        pageRefTag={pageRefTag}
        pageDescription={pageDescription}
        domains={domains}
        questions={questions}
        state={state}
        onResume={() => {
          router.push('/readiness/assessment');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />
      <EmptyAssessment
        t={t}
        questionCount={questions.length}
        isStarting={startAssessment.isPending}
        onStart={() => {
          startAssessment.mutate(undefined, {
            onSuccess: () => {
              router.push('/readiness/assessment');
            },
          });
        }}
      />
    </div>
  );
}
