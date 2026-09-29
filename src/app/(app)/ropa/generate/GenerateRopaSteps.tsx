'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Card } from '@atoms/Card';
import { Checkbox } from '@atoms/Checkbox';
import { Heading } from '@atoms/Heading';
import { Select, type SelectOption } from '@atoms/Select';
import { Text } from '@atoms/Text';
import type { PersonOption } from '@molecules/PeoplePicker';
import { Table } from '@molecules/Table';
import { cn } from '@shared/lib';
import type {
  ActivityQualityTone,
  CrossBorderChoice,
  GeneratedActivity,
  InterviewAnswers,
  InterviewGroup,
  InterviewOptionMeta,
  RetentionMethod,
} from '@shared/mock/ropa-interview';
import {
  INTERVIEW_OPTIONS,
  activityQuality,
  activityQualityTone,
  generateActivities,
} from '@shared/mock/ropa-interview';
import type { GenerateRopaMessages } from './GenerateRopaWizard.types';

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function AiIntro({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-start gap-3">
      <span className="bg-bg-inverse text-accent-solid rounded-control grid size-8 shrink-0 place-items-center">
        <Sparkles className="size-4" />
      </span>
      <div className="bg-bg-canvas border-border-default rounded-control rounded-ss-xs border p-3">
        <Text size="sm">{children}</Text>
      </div>
    </div>
  );
}

function PanelHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3 flex flex-col gap-0.5">
      <Text weight="semibold">{title}</Text>
      <Text size="xs" tone="muted">
        {sub}
      </Text>
    </div>
  );
}

function OptionCard({
  t,
  label,
  meta,
  isChecked,
  onToggle,
}: {
  t: GenerateRopaMessages;
  label: string;
  meta: InterviewOptionMeta;
  isChecked: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <Card
      variant={isChecked ? 'soft' : 'outline'}
      size="sm"
      isInvalid={meta.isSensitive}
      className={meta.isLocked ? 'bg-bg-canvas opacity-80' : undefined}
    >
      <Checkbox
        checked={isChecked}
        isDisabled={meta.isLocked}
        onValueChange={onToggle}
        className="w-full items-start"
      >
        <span className="flex flex-col gap-1">
          <Text as="span" size="sm" weight="medium">
            {label}
          </Text>
          {meta.hint && (
            <Text as="span" size="xs" tone="muted">
              {meta.hint}
            </Text>
          )}
          {meta.evidence && (
            <Text as="span" size="2xs" tone="brand" isMono className="tracking-wide uppercase">
              {t.evidenceLabel}: {meta.evidence}
            </Text>
          )}
          {meta.confidence && (
            <Badge
              size="xs"
              variant="soft"
              tone={meta.confidence === 'hi' ? 'success' : 'warning'}
              className="w-fit"
            >
              {meta.confidence === 'hi' ? t.confidenceHigh : t.confidenceMedium}
            </Badge>
          )}
        </span>
      </Checkbox>
    </Card>
  );
}

function OptionGrid({
  t,
  group,
  title,
  sub,
  values,
  onChange,
}: {
  t: GenerateRopaMessages;
  group: InterviewGroup;
  title: string;
  sub: string;
  values: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}) {
  const options = INTERVIEW_OPTIONS[group];
  return (
    <Card variant="outline" size="md">
      <PanelHeading title={title} sub={sub} />
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.keys(options).map((key) => (
          <OptionCard
            key={key}
            t={t}
            label={key}
            meta={options[key] ?? {}}
            isChecked={values[key] ?? false}
            onToggle={(next) => {
              onChange({ ...values, [key]: next });
            }}
          />
        ))}
      </div>
    </Card>
  );
}

function ChoiceCard({
  title,
  caption,
  isSelected,
  onSelect,
}: {
  title: string;
  caption: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="text-start">
      <Card isInteractive variant={isSelected ? 'soft' : 'outline'} size="sm">
        <Text size="sm" weight="medium">
          {title}
        </Text>
        <Text size="xs" tone="muted">
          {caption}
        </Text>
      </Card>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Who & why
// ---------------------------------------------------------------------------
export function Step1WhoAndWhy({
  t,
  answers,
  onChange,
  datasetCount,
  sourceCount,
  activityCount,
}: {
  t: GenerateRopaMessages;
  answers: InterviewAnswers;
  onChange: (next: Partial<InterviewAnswers>) => void;
  datasetCount: number;
  sourceCount: number;
  activityCount: number;
}) {
  const hasEvidence = datasetCount > 0;
  return (
    <div className="flex flex-col gap-4">
      <Heading level={2} size="lg">
        {t.step1Heading}
      </Heading>
      <AiIntro>
        {hasEvidence
          ? t.aiIntroWithEvidence
              .replace('{datasets}', String(datasetCount))
              .replace('{sources}', String(sourceCount))
          : t.aiIntroNoEvidence}
      </AiIntro>
      <OptionGrid
        t={t}
        group="principals"
        title={t.principalsTitle}
        sub={t.principalsSub}
        values={answers.principals}
        onChange={(principals) => {
          onChange({ principals });
        }}
      />
      <OptionGrid
        t={t}
        group="purposes"
        title={t.purposesTitle}
        sub={t.purposesSub}
        values={answers.purposes}
        onChange={(purposes) => {
          onChange({ purposes });
        }}
      />
      <OptionGrid
        t={t}
        group="colsrc"
        title={t.sourcesTitle}
        sub={t.sourcesSub}
        values={answers.colsrc}
        onChange={(colsrc) => {
          onChange({ colsrc });
        }}
      />
      <div className="bg-bg-inverse rounded-control flex items-start gap-2.5 p-3.5">
        <Sparkles className="text-accent-solid mt-0.5 size-4.5 shrink-0" />
        <Text size="sm" tone="inverse">
          {(hasEvidence ? t.identifiedBannerWithEvidence : t.identifiedBannerNoEvidence)
            .replace('{count}', String(activityCount))
            .replace('{datasets}', String(datasetCount))
            .replace('{sources}', String(sourceCount))}
        </Text>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Sharing, location & retention
// ---------------------------------------------------------------------------
function LocationPanel({
  t,
  crossBorder,
  onChange,
}: {
  t: GenerateRopaMessages;
  crossBorder: CrossBorderChoice | null;
  onChange: (value: CrossBorderChoice) => void;
}) {
  const options: { value: CrossBorderChoice; title: string; caption: string }[] = [
    { value: 'india', title: t.xborderIndiaTitle, caption: t.xborderIndiaCaption },
    { value: 'multi', title: t.xborderMultiTitle, caption: t.xborderMultiCaption },
    { value: 'other', title: t.xborderOtherTitle, caption: t.xborderOtherCaption },
    { value: 'unknown', title: t.xborderUnknownTitle, caption: t.xborderUnknownCaption },
  ];
  return (
    <Card variant="outline" size="md">
      <PanelHeading title={t.locationTitle} sub={t.locationSub} />
      <div className="grid gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            caption={option.caption}
            isSelected={crossBorder === option.value}
            onSelect={() => {
              onChange(option.value);
            }}
          />
        ))}
      </div>
    </Card>
  );
}

function RetentionPanel({
  t,
  retentionMethod,
  onChange,
}: {
  t: GenerateRopaMessages;
  retentionMethod: RetentionMethod;
  onChange: (value: RetentionMethod) => void;
}) {
  const options: { value: RetentionMethod; title: string; caption: string }[] = [
    { value: 'law', title: t.retentionLawTitle, caption: t.retentionLawCaption },
    { value: 'policy', title: t.retentionPolicyTitle, caption: t.retentionPolicyCaption },
    { value: 'business', title: t.retentionBusinessTitle, caption: t.retentionBusinessCaption },
    { value: 'purpose', title: t.retentionPurposeTitle, caption: t.retentionPurposeCaption },
    { value: 'unknown', title: t.retentionUnknownTitle, caption: t.retentionUnknownCaption },
  ];
  return (
    <Card variant="outline" size="md">
      <PanelHeading title={t.retentionTitle} sub={t.retentionSub} />
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            caption={option.caption}
            isSelected={retentionMethod === option.value}
            onSelect={() => {
              onChange(option.value);
            }}
          />
        ))}
      </div>
      {retentionMethod === 'law' && (
        <div className="bg-success-subtle rounded-control mt-3 p-3">
          <Text size="xs" className="text-success-fg">
            {t.retentionLawHint}
          </Text>
        </div>
      )}
      {retentionMethod === 'unknown' && (
        <div className="bg-warning-subtle rounded-control mt-3 p-3">
          <Text size="xs" className="text-warning-fg">
            {t.retentionUnknownHint}
          </Text>
        </div>
      )}
    </Card>
  );
}

export function Step2Sharing({
  t,
  answers,
  onChange,
}: {
  t: GenerateRopaMessages;
  answers: InterviewAnswers;
  onChange: (next: Partial<InterviewAnswers>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Heading level={2} size="lg">
        {t.step2Heading}
      </Heading>
      <AiIntro>{t.step2AiIntro}</AiIntro>
      <OptionGrid
        t={t}
        group="processors"
        title={t.processorsTitle}
        sub={t.processorsSub}
        values={answers.processors}
        onChange={(processors) => {
          onChange({ processors });
        }}
      />
      <OptionGrid
        t={t}
        group="recipients"
        title={t.recipientsTitle}
        sub={t.recipientsSub}
        values={answers.recipients}
        onChange={(recipients) => {
          onChange({ recipients });
        }}
      />
      <LocationPanel
        t={t}
        crossBorder={answers.crossBorder}
        onChange={(crossBorder) => {
          onChange({ crossBorder });
        }}
      />
      <RetentionPanel
        t={t}
        retentionMethod={answers.retentionMethod}
        onChange={(retentionMethod) => {
          onChange({ retentionMethod });
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Accountable owners per activity
// ---------------------------------------------------------------------------
export function Step3Owners({
  t,
  answers,
  activities,
  people,
  onChange,
}: {
  t: GenerateRopaMessages;
  answers: InterviewAnswers;
  activities: readonly GeneratedActivity[];
  people: readonly PersonOption[];
  onChange: (next: Partial<InterviewAnswers>) => void;
}) {
  const options: SelectOption[] = people.map((person) => ({
    value: person.id,
    label: person.name,
  }));
  return (
    <div className="flex flex-col gap-4">
      <Heading level={2} size="lg">
        {t.step3Heading}
      </Heading>
      <AiIntro>{t.step3AiIntro}</AiIntro>
      <Card variant="outline" size="md" className="flex flex-col gap-0">
        {activities.map((activity) => (
          <div
            key={activity.name}
            className="border-border-default/50 flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-b-0"
          >
            <div className="flex flex-col gap-0.5">
              <Text size="sm" weight="medium">
                {activity.name}
              </Text>
              <Text size="2xs" tone="brand" isMono className="tracking-wide uppercase">
                {t.step3SuggestedPrefix} {activity.suggestedOwnerReason}
              </Text>
            </div>
            <Select
              options={options}
              value={answers.ownerOverrides[activity.name] ?? activity.suggestedOwnerId}
              onValueChange={(ownerId) => {
                onChange({
                  ownerOverrides: { ...answers.ownerOverrides, [activity.name]: ownerId },
                });
              }}
              aria-label={`${t.step3OwnerLabel} — ${activity.name}`}
              className="w-56"
            />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Review
// ---------------------------------------------------------------------------
function SummaryChips({
  t,
  activities,
  datasetCount,
  sourceCount,
  processorCount,
  ownerCount,
}: {
  t: GenerateRopaMessages;
  activities: readonly GeneratedActivity[];
  datasetCount: number;
  sourceCount: number;
  processorCount: number;
  ownerCount: number;
}) {
  const chips = [
    [t.chipActivities, activities.length],
    [t.chipDatasets, datasetCount],
    [t.chipSources, sourceCount],
    [t.chipProcessors, processorCount],
    [t.chipOwners, ownerCount],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {chips.map(([label, value]) => (
        <Card key={label} variant="outline" size="sm">
          <Text as="span" size="lg" weight="bold" className="block">
            {value}
          </Text>
          <Text as="span" size="2xs" tone="subtle" isMono className="tracking-widest uppercase">
            {label}
          </Text>
        </Card>
      ))}
    </div>
  );
}

const dotTones: Record<ActivityQualityTone, string> = {
  success: 'bg-success-solid',
  warning: 'bg-warning-solid',
  danger: 'bg-danger-solid',
};

function QualityDot({ tone }: { tone: ActivityQualityTone }) {
  return <span aria-hidden className={cn('size-2 shrink-0 rounded-full', dotTones[tone])} />;
}

function QualityRow({
  tone,
  label,
  description,
}: {
  tone: ActivityQualityTone;
  label: string;
  description: string;
}) {
  return (
    <div className="border-border-default/50 flex items-center gap-3 border-b py-2 last:border-b-0">
      <div className="flex w-44 shrink-0 items-center gap-2">
        <QualityDot tone={tone} />
        <Text as="span" size="sm" tone="muted">
          {label}
        </Text>
      </div>
      <Text as="span" size="sm" weight="semibold">
        {description}
      </Text>
    </div>
  );
}

function QualityPanel({
  t,
  quality,
}: {
  t: GenerateRopaMessages;
  quality: ReturnType<typeof activityQuality>;
}) {
  return (
    <Card variant="outline" size="md">
      <PanelHeading title={t.qualityTitle} sub={t.qualitySub} />
      <div className="flex flex-col">
        <QualityRow
          tone="success"
          label={t.qualityHighLabel}
          description={t.qualityHigh.replace('{count}', String(quality.high))}
        />
        <QualityRow
          tone="warning"
          label={t.qualityNeedsReviewLabel}
          description={t.qualityNeedsReview.replace('{count}', String(quality.needsReview))}
        />
        <QualityRow
          tone="danger"
          label={t.qualityMissingLabel}
          description={t.qualityMissing.replace('{count}', String(quality.missing))}
        />
      </div>
    </Card>
  );
}

function ReviewTable({
  t,
  activities,
}: {
  t: GenerateRopaMessages;
  activities: readonly GeneratedActivity[];
}) {
  return (
    <Table label={t.step4Heading}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t.tableActivity}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableConfidence}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableEvidence}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableIssues}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {activities.map((activity) => (
          <Table.Row key={activity.name}>
            <Table.Cell>
              <div className="flex items-center gap-2">
                <QualityDot tone={activityQualityTone(activity)} />
                <Text as="span" weight="medium">
                  {activity.name}
                </Text>
              </div>
            </Table.Cell>
            <Table.Cell>{activity.confidence}%</Table.Cell>
            <Table.Cell>
              {activity.evidence.length} {t.evidenceSourcesSuffix}
            </Table.Cell>
            <Table.Cell>
              {activity.issues.length ? activity.issues.join(', ') : t.noIssues}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export function Step4Review({
  t,
  answers,
  activities,
  datasetCount,
  sourceCount,
}: {
  t: GenerateRopaMessages;
  answers: InterviewAnswers;
  activities: readonly GeneratedActivity[];
  datasetCount: number;
  sourceCount: number;
}) {
  const quality = activityQuality(generateActivities(answers));
  const processorCount = Object.values(answers.processors).filter(Boolean).length;
  const ownerCount = new Set(
    activities.map(
      (activity) => answers.ownerOverrides[activity.name] ?? activity.suggestedOwnerId,
    ),
  ).size;

  return (
    <div className="flex flex-col gap-4">
      <Heading level={2} size="lg">
        {t.step4Heading}
      </Heading>
      <SummaryChips
        t={t}
        activities={activities}
        datasetCount={datasetCount}
        sourceCount={sourceCount}
        processorCount={processorCount}
        ownerCount={ownerCount}
      />
      <QualityPanel t={t} quality={quality} />
      <ReviewTable t={t} activities={activities} />
    </div>
  );
}
