'use client';

/**
 * The completed Gap Assessment report — hero/ring/band, KPI strip, domain
 * breakdown, and the gaps table. Ported from the prototype's report branch of
 * `gaRender()` (`gaRingHTML`/`gaBand`/`gaDomsHTML`/`gaGapsHTML`) — statutory
 * exposure, the 30/60/90 plan, the trend chart, run history and Issue
 * Register push are deliberately out of scope for this pass.
 */
import type { Route } from 'next';
import NextLink from 'next/link';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Progress } from '@atoms/Progress';
import { Text } from '@atoms/Text';
import { PageHeader } from '@molecules/PageHeader';
import { ScoreRing } from '@molecules/ScoreRing';
import { Table } from '@molecules/Table';
import { formatDate } from '@shared/lib';
import type { AssessmentReport, Gap, GapSeverity, ScoreBandKey } from '@shared/hooks';
import type { ReadinessMessages } from './ReadinessMessages';

const BAND_RING_TONE: Record<ScoreBandKey, 'accent' | 'success' | 'warning' | 'danger'> = {
  ready: 'accent',
  substantial: 'success',
  developing: 'warning',
  'high-exposure': 'danger',
};

const BAND_BADGE: Record<
  ScoreBandKey,
  { variant: 'solid' | 'soft'; tone: 'accent' | 'success' | 'warning' | 'danger' }
> = {
  ready: { variant: 'solid', tone: 'accent' },
  substantial: { variant: 'soft', tone: 'success' },
  developing: { variant: 'soft', tone: 'warning' },
  'high-exposure': { variant: 'soft', tone: 'danger' },
};

const SEVERITY_BADGE: Record<
  GapSeverity,
  { variant: 'solid' | 'soft'; tone: 'danger' | 'warning' | 'neutral' }
> = {
  c: { variant: 'solid', tone: 'danger' },
  h: { variant: 'soft', tone: 'danger' },
  m: { variant: 'soft', tone: 'warning' },
  l: { variant: 'soft', tone: 'neutral' },
};

const DOMAIN_BAR_TONE = (percent: number): 'success' | 'warning' | 'danger' => {
  if (percent >= 80) return 'success';
  if (percent >= 50) return 'warning';
  return 'danger';
};

function bandLabel(t: ReadinessMessages, band: ScoreBandKey): string {
  if (band === 'ready') return t.bandReady;
  if (band === 'substantial') return t.bandSubstantial;
  if (band === 'developing') return t.bandDeveloping;
  return t.bandHighExposure;
}

function severityLabel(t: ReadinessMessages, severity: GapSeverity): string {
  if (severity === 'c') return t.severityCritical;
  if (severity === 'h') return t.severityHigh;
  if (severity === 'm') return t.severityMedium;
  return t.severityLow;
}

/** Destination-module display names — matches the prototype's `GA_MODNM`.
 * Internal routing data, not sentence-level copy, so it is not translated. */
const MODULE_LABELS: Record<string, string> = {
  notices: 'Notice Manager',
  consent: 'Consent Ledger',
  dsr: 'DSR Requests',
  breach: 'Breach Management',
  transfers: 'Cross-Border Transfers',
  thirdparty: 'Third-Party Risk',
  controls: 'Controls · CCM',
  dpia: 'Impact Assessments',
  ropa: 'RoPA · Processing',
  datamap: 'Data Map',
  academy: 'DPDP Awareness',
  settings: 'Configuration Studio',
  gap: 'Readiness',
};

function moduleLabel(moduleKey: string): string {
  return MODULE_LABELS[moduleKey] ?? moduleKey;
}

/** `module_key` in the DB uses the module catalog's bare keys (`thirdparty`,
 * `datamap`, `gap`), but their route folders don't all match 1:1 —
 * `/third-party`, `/data-map`, and the Gap Assessment module's own pages live
 * under `/readiness` — see db/seed/0002_gap_assessment_questionnaire.sql's header. */
const MODULE_ROUTES: Record<string, string> = {
  thirdparty: 'third-party',
  datamap: 'data-map',
  gap: 'readiness',
};

function moduleRoute(moduleKey: string): string {
  return MODULE_ROUTES[moduleKey] ?? moduleKey;
}

function Hero({
  t,
  report,
  onRetake,
}: {
  t: ReadinessMessages;
  report: AssessmentReport;
  onRetake: () => void;
}) {
  return (
    <section className="bg-bg-inverse text-fg-inverse flex flex-wrap items-center gap-6 rounded-xl p-6 md:p-7">
      <ScoreRing
        value={report.score}
        label={t.overallScoreLabel}
        description={bandLabel(t, report.band.key)}
        tone={BAND_RING_TONE[report.band.key]}
        size="xl"
        isOnInverse
      />
      <div className="flex min-w-60 flex-1 flex-col gap-2">
        <Badge size="sm" className="w-fit" {...BAND_BADGE[report.band.key]}>
          {bandLabel(t, report.band.key)}
        </Badge>
        <Text as="div" size="lg" weight="bold" className="text-fg-inverse">
          {report.band.headline}
        </Text>
        <Text size="sm" className="text-fg-inverse-subtle max-w-xl">
          {report.band.body}
        </Text>
        <Text size="2xs" isMono className="text-fg-inverse-subtle mt-1">
          {t.metaLine
            .replace('{entity}', report.entity)
            .replace('{inScope}', String(report.questionsInScope))
            .replace('{na}', String(report.notApplicableCount))}
        </Text>
        <Text size="2xs" isMono className="text-fg-inverse-subtle">
          {t.lastAssessed.replace('{date}', formatDate(report.completedAt))}
        </Text>
      </div>
      <Button asChild tone="accent" size="lg" className="min-w-44 justify-center">
        <NextLink href="/readiness/assessment?step=1" onClick={onRetake}>
          <RefreshCw className="me-1.5 inline size-4" />
          {t.retakeCta}
        </NextLink>
      </Button>
    </section>
  );
}

function KpiStrip({ t, report }: { t: ReadinessMessages; report: AssessmentReport }) {
  const obligationsMet = report.questionsInScope - report.gaps.length;
  const metrics = [
    { label: t.kpiCriticalGaps, value: report.criticalCount, tone: 'danger' },
    { label: t.kpiTotalGaps, value: report.gaps.length, tone: 'warning' },
    { label: t.kpiObligationsMet, value: obligationsMet, tone: 'success' },
    { label: t.kpiUnsureAnswers, value: report.unsureCount, tone: 'neutral' },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} size="sm" className="flex flex-col gap-1">
          <Text
            as="span"
            size="lg"
            weight="bold"
            className={
              metric.tone === 'danger'
                ? 'text-danger-fg'
                : metric.tone === 'warning'
                  ? 'text-warning-fg'
                  : metric.tone === 'success'
                    ? 'text-success-fg'
                    : undefined
            }
          >
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

function DomainScores({ t, report }: { t: ReadinessMessages; report: AssessmentReport }) {
  return (
    <Card size="lg" className="flex flex-col gap-4">
      <Text as="div" size="md" weight="bold">
        {t.domainScoresTitle}
      </Text>
      <div className="flex flex-col">
        {report.domains.map((domain) => (
          <div
            key={domain.key}
            className="border-border-default flex flex-col gap-2 border-b py-3 last:border-b-0 md:flex-row md:items-center md:gap-3"
          >
            <div className="md:flex-[1.4]">
              <Text size="sm" weight="medium">
                {domain.name}
              </Text>
              <Text size="2xs" tone="muted" isMono>
                {domain.sectionRefs.join(' · ')}
              </Text>
            </div>
            {domain.isNotApplicable || domain.percent === null ? (
              <>
                <Progress value={0} label={domain.name} className="opacity-60 md:flex-1" />
                <Badge
                  variant="soft"
                  tone="neutral"
                  size="xs"
                  className="md:w-28 md:justify-self-end"
                >
                  {t.domainNotApplicable}
                </Badge>
              </>
            ) : (
              <>
                <Progress
                  value={domain.percent}
                  label={domain.name}
                  tone={DOMAIN_BAR_TONE(domain.percent)}
                  className="md:flex-1"
                />
                <Text size="md" isMono weight="medium" className="md:w-14 md:text-end">
                  {String(domain.percent)}%
                </Text>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function GapRow({ t, gap }: { t: ReadinessMessages; gap: Gap }) {
  return (
    <Table.Row>
      <Table.Cell>
        <Badge size="xs" {...SEVERITY_BADGE[gap.severity]}>
          {severityLabel(t, gap.severity)}
        </Badge>
      </Table.Cell>
      <Table.Cell isTruncated>
        <Text as="span" size="xs" tone="muted">
          {gap.domainName}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Text as="div" size="sm" weight="medium">
          {gap.question}
        </Text>
        <Text as="div" size="xs" tone="muted" className="mt-1">
          <Text as="span" weight="semibold" tone="neutral">
            {t.fixLabel}
          </Text>{' '}
          {gap.fix}
        </Text>
        {gap.isUnsure && (
          <Badge variant="soft" tone="danger" size="xs" className="mt-1.5">
            {t.unverifiedTag}
          </Badge>
        )}
      </Table.Cell>
      <Table.Cell align="end">
        {gap.module !== null && (
          <Button asChild variant="outline" size="sm">
            <NextLink href={`/${moduleRoute(gap.module)}` as Route}>
              {moduleLabel(gap.module)} →
            </NextLink>
          </Button>
        )}
      </Table.Cell>
    </Table.Row>
  );
}

function GapsTable({ t, report }: { t: ReadinessMessages; report: AssessmentReport }) {
  return (
    <Card size="none" className="overflow-hidden">
      <div className="flex flex-col gap-1 p-6">
        <Text weight="medium">{t.gapsTitle}</Text>
        <Text size="sm" tone="muted">
          {t.gapsDescription.replace('{count}', String(report.gaps.length))}
        </Text>
      </div>
      {report.gaps.length === 0 ? (
        <div className="px-6 pb-8 text-center">
          <Text weight="medium">{t.gapsEmptyTitle}</Text>
          <Text size="sm" tone="muted" className="mt-1">
            {t.gapsEmptyDescription}
          </Text>
        </div>
      ) : (
        <Table label={t.gapsTitle}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t.tableSeverity}</Table.HeaderCell>
              <Table.HeaderCell>{t.tableDomain}</Table.HeaderCell>
              <Table.HeaderCell>{t.tableIssue}</Table.HeaderCell>
              <Table.HeaderCell align="end">{t.tableAction}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {report.gaps.map((gap) => (
              <GapRow key={gap.questionId} t={t} gap={gap} />
            ))}
          </Table.Body>
        </Table>
      )}
    </Card>
  );
}

export function ReadinessReport({
  t,
  pageLabel,
  pageRefTag,
  pageDescription,
  report,
  onRetake,
}: {
  t: ReadinessMessages;
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  report: AssessmentReport;
  onRetake: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />
      <Hero t={t} report={report} onRetake={onRetake} />
      <KpiStrip t={t} report={report} />
      <DomainScores t={t} report={report} />
      <GapsTable t={t} report={report} />
    </div>
  );
}
