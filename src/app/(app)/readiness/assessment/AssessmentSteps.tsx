'use client';

/**
 * The wizard's two kinds of step body: the step-1 scope/profile form
 * (`ProfileStep`) and a domain-grouped question list (`QuestionStep`, steps
 * 2–6). Ported from the prototype's `gaProfileHTML()`/`gaWzRender()`, now
 * reading the real questionnaire catalog from `useReadiness()` instead of
 * the static mock — see `@shared/hooks/use-readiness`'s header.
 */
import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  HelpCircle,
  Minus,
  StickyNote,
  Target,
  X,
} from 'lucide-react';
import { Alert } from '@molecules/Alert';
import { Button } from '@atoms/Button';
import { Input } from '@atoms/Input';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import { Text } from '@atoms/Text';
import { Textarea } from '@atoms/Textarea';
import { PeoplePicker, type PersonOption } from '@molecules/PeoplePicker';
import { SegmentedControl, type SegmentedControlItem } from '@molecules/SegmentedControl';
import { cn } from '@shared/lib';
import type {
  AnswerValue,
  AssessmentProfile,
  ReadinessCatalogDomain,
  ReadinessCatalogQuestion,
} from '@shared/hooks';
import type { AssessmentMessages } from './AssessmentMessages';

const SECTOR_OPTIONS = [
  'SaaS / IT services',
  'E-commerce / D2C',
  'Healthcare',
  'EdTech',
  'BFSI / Fintech',
  'Manufacturing',
  'Professional services',
  'Other',
];

const RECORDS_HELD_OPTIONS = [
  'Under 10,000',
  '10,000 – 1 lakh',
  '1 lakh – 10 lakh',
  'Over 10 lakh',
];

/** UI-local representation of a gate answer — `''` is "not yet chosen",
 * translated to/from the server's `null` at the profile boundary. */
type UiGateAnswer = 'yes' | 'no' | 'unsure' | '';

/** "A", "A {conj} B", or "A, B {conj} C" — matches the prototype's
 * `off.map(...).join(" and ")` for a natural-reading excluded-domains list. */
function joinWithConjunction(items: readonly string[], conjunction: string): string {
  if (items.length <= 1) return items.join('');
  const last = items[items.length - 1] ?? '';
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${last}`;
}

function GateQuestion({
  t,
  label,
  hint,
  value,
  onChange,
}: {
  t: AssessmentMessages;
  label: string;
  hint: string;
  value: UiGateAnswer;
  onChange: (value: UiGateAnswer) => void;
}) {
  const items: SegmentedControlItem[] = [
    { value: 'yes', label: t.answerYes, tone: 'brand' },
    { value: 'no', label: t.answerNo, tone: 'danger' },
    { value: 'unsure', label: t.answerNotSure, tone: 'inverse' },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      <Text as="span" size="sm" weight="semibold">
        {label}
      </Text>
      <Text size="xs" tone="muted">
        {hint}
      </Text>
      <SegmentedControl
        label={label}
        items={items}
        value={value}
        onValueChange={(next) => {
          onChange(next as UiGateAnswer);
        }}
        className="mt-1 self-start"
      />
    </div>
  );
}

function ScopeSummary({
  t,
  profile,
  domains,
  questions,
}: {
  t: AssessmentMessages;
  profile: AssessmentProfile;
  domains: readonly ReadinessCatalogDomain[];
  questions: readonly ReadinessCatalogQuestion[];
}) {
  const domainById = new Map(domains.map((d) => [d.id, d]));
  const inScope = questions.filter((q) => {
    const gate = domainById.get(q.domainId)?.gateKey;
    return !gate || profile[gate as keyof AssessmentProfile] !== 'no';
  }).length;
  const excluded = domains.filter(
    (d) => d.gateKey && profile[d.gateKey as keyof AssessmentProfile] === 'no',
  );
  const anyUnsure =
    profile.kids === 'unsure' || profile.proc === 'unsure' || profile.xbt === 'unsure';

  return (
    <div className="bg-bg-inverse text-fg-inverse-subtle mt-2 flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm leading-relaxed">
      <Target aria-hidden className="text-accent-solid mt-0.5 size-4 shrink-0" />
      <div>
        <Text as="span" weight="bold" className="text-fg-inverse">
          {t.scopeSummaryCount
            .replace('{count}', String(inScope))
            .replace('{total}', String(questions.length))}
        </Text>{' '}
        {excluded.length > 0
          ? t.scopeSummaryExcluded.replace(
              '{domains}',
              joinWithConjunction(
                excluded.map((d) => `${d.name} (${d.sectionRefs.join(' · ')})`),
                t.scopeSummaryConjunction,
              ),
            )
          : t.scopeSummaryAllInScope}
        {anyUnsure && (
          <>
            <br />
            <Text as="span" className="text-accent-solid">
              {t.scopeSummaryUnsureNote}
            </Text>
          </>
        )}
      </div>
    </div>
  );
}

/** `sdfNote` in the prototype's `gaProfileHTML()`: three profile answers that
 * are Significant Data Fiduciary indicators under s.10(1) — shown only when
 * at least one is present, listing which ones. */
function SdfIndicatorNote({ t, profile }: { t: AssessmentMessages; profile: AssessmentProfile }) {
  const reasons: string[] = [];
  if (profile.recordsHeld === 'Over 10 lakh') reasons.push(t.sdfReasonVolume);
  if (profile.sens === 'yes') reasons.push(t.sdfReasonSensitivity);
  if (profile.kids === 'yes') reasons.push(t.sdfReasonChildren);
  if (reasons.length === 0) return null;

  return (
    <Alert
      tone="warning"
      label={t.sdfNoteTitle}
      description={t.sdfNoteBody.replace(
        '{reasons}',
        joinWithConjunction(reasons, t.scopeSummaryConjunction),
      )}
      startSlot={<AlertTriangle className="size-4" />}
      size="sm"
    />
  );
}

function EntityFieldsGrid({
  t,
  profile,
  people,
  onChange,
}: {
  t: AssessmentMessages;
  profile: AssessmentProfile;
  people: readonly PersonOption[];
  onChange: (patch: Partial<AssessmentProfile>) => void;
}) {
  const sectorOptions: ListboxOption[] = SECTOR_OPTIONS.map((value) => ({ value, label: value }));
  const recordsOptions: ListboxOption[] = RECORDS_HELD_OPTIONS.map((value) => ({
    value,
    label: value,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Text as="span" size="sm" weight="medium">
          {t.fieldEntityName}
        </Text>
        <Input
          // Remounts once when `entity` first arrives auto-seeded from Workspace
          // Settings (async, after this uncontrolled input already mounted
          // blank) — a stable key while the user is typing, since it stays
          // non-empty either way, so their own edits are never overwritten.
          key={profile.entity === '' ? 'empty' : 'seeded'}
          defaultValue={profile.entity}
          onBlur={(event) => {
            if (event.target.value !== profile.entity) onChange({ entity: event.target.value });
          }}
          aria-label={t.fieldEntityName}
          fullWidth
        />
      </div>
      <PeoplePicker
        label={t.fieldCompletedBy}
        labelHint={t.fieldCompletedByHint}
        people={people}
        value={profile.assessorEmployeeId ?? undefined}
        onValueChange={(value) => {
          onChange({ assessorEmployeeId: value ?? null });
        }}
        variant="trigger"
        employeeRegisterHref="/employees"
        messages={{
          searchPlaceholder: t.fieldCompletedBySearchPlaceholder,
          escHint: t.fieldCompletedByEscHint,
          footerLabel: t.fieldCompletedByFooterLabel,
          manageLabel: t.fieldCompletedByManageLabel,
        }}
      />
      <Listbox
        label={t.fieldSector}
        labelHint={t.fieldSectorHint}
        options={sectorOptions}
        value={profile.sector}
        onValueChange={(sector) => {
          onChange({ sector });
        }}
        fullWidth
      />
      <Listbox
        label={t.fieldRecordsHeld}
        labelHint={t.fieldRecordsHeldHint}
        options={recordsOptions}
        value={profile.recordsHeld}
        onValueChange={(recordsHeld) => {
          onChange({ recordsHeld });
        }}
        fullWidth
      />
    </div>
  );
}

function toUiGate(value: AssessmentProfile['kids']): UiGateAnswer {
  return value ?? '';
}

function fromUiGate(value: UiGateAnswer): AssessmentProfile['kids'] {
  return value === '' ? null : value;
}

function GateQuestionsGrid({
  t,
  profile,
  onChange,
}: {
  t: AssessmentMessages;
  profile: AssessmentProfile;
  onChange: (patch: Partial<AssessmentProfile>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <GateQuestion
        t={t}
        label={t.gateKidsLabel}
        hint={t.gateKidsHint}
        value={toUiGate(profile.kids)}
        onChange={(kids) => {
          onChange({ kids: fromUiGate(kids) });
        }}
      />
      <GateQuestion
        t={t}
        label={t.gateProcLabel}
        hint={t.gateProcHint}
        value={toUiGate(profile.proc)}
        onChange={(proc) => {
          onChange({ proc: fromUiGate(proc) });
        }}
      />
      <GateQuestion
        t={t}
        label={t.gateXbtLabel}
        hint={t.gateXbtHint}
        value={toUiGate(profile.xbt)}
        onChange={(xbt) => {
          onChange({ xbt: fromUiGate(xbt) });
        }}
      />
      <GateQuestion
        t={t}
        label={t.gateSensLabel}
        hint={t.gateSensHint}
        value={toUiGate(profile.sens)}
        onChange={(sens) => {
          onChange({ sens: fromUiGate(sens) });
        }}
      />
    </div>
  );
}

export function ProfileStep({
  t,
  profile,
  people,
  domains,
  questions,
  onChange,
}: {
  t: AssessmentMessages;
  profile: AssessmentProfile;
  people: readonly PersonOption[];
  domains: readonly ReadinessCatalogDomain[];
  questions: readonly ReadinessCatalogQuestion[];
  onChange: (patch: Partial<AssessmentProfile>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="border-border-default bg-bg-surface text-brand-fg grid size-11 shrink-0 place-items-center rounded-lg border">
          <Building2 aria-hidden className="size-5" />
        </span>
        <div>
          <Text as="div" size="lg" weight="bold">
            {t.profileHeading}
          </Text>
          <Text size="sm" tone="muted" className="mt-1 max-w-2xl">
            {t.profileIntro}
          </Text>
        </div>
      </div>
      <EntityFieldsGrid t={t} profile={profile} people={people} onChange={onChange} />
      <GateQuestionsGrid t={t} profile={profile} onChange={onChange} />
      <ScopeSummary t={t} profile={profile} domains={domains} questions={questions} />
      <SdfIndicatorNote t={t} profile={profile} />
    </div>
  );
}

function QuestionCardTags({
  t,
  question,
}: {
  t: AssessmentMessages;
  question: ReadinessCatalogQuestion;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {question.sectionRef !== null && (
        <Text
          as="span"
          size="2xs"
          isMono
          className="bg-brand-subtle text-brand-fg rounded px-1.5 py-0.5 tracking-wide"
        >
          {question.sectionRef}
        </Text>
      )}
      <Text
        as="span"
        size="2xs"
        isMono
        className={
          question.weight === 3
            ? 'bg-danger-subtle text-danger-fg rounded px-1.5 py-0.5 tracking-wide'
            : 'bg-bg-subtle text-fg-muted rounded px-1.5 py-0.5 tracking-wide'
        }
      >
        {question.weight === 3
          ? t.tagMustHave
          : t.tagWeight.replace('{weight}', String(question.weight))}
      </Text>
    </div>
  );
}

function QuestionCardNote({
  t,
  questionId,
  note,
  isOpen,
  isDisabled,
  onNote,
}: {
  t: AssessmentMessages;
  questionId: string;
  note: string | undefined;
  isOpen: boolean;
  isDisabled: boolean;
  onNote: (note: string) => void;
}) {
  if (!isOpen) return null;
  return (
    <Textarea
      // Remounts per question and stays keyed off whether a note already
      // exists, the same uncontrolled + onBlur-commit pattern the entity
      // name field uses — autosaving on every keystroke would fire a PATCH
      // per character.
      key={`${questionId}-${note === undefined ? 'empty' : 'seeded'}`}
      defaultValue={note ?? ''}
      onBlur={(event) => {
        if (event.target.value !== (note ?? '')) onNote(event.target.value);
      }}
      placeholder={t.questionNotePlaceholder}
      isDisabled={isDisabled}
      fullWidth
    />
  );
}

const ANSWER_ITEMS: readonly Omit<SegmentedControlItem, 'label'>[] = [
  { value: 'y', tone: 'brand', startSlot: <Check className="size-3.5" /> },
  { value: 'p', tone: 'warning', startSlot: <Minus className="size-3.5" /> },
  { value: 'n', tone: 'danger', startSlot: <X className="size-3.5" /> },
  { value: 'u', tone: 'inverse', startSlot: <HelpCircle className="size-3.5" /> },
];

function answerItems(t: AssessmentMessages): SegmentedControlItem[] {
  const labels: Record<string, string> = {
    y: t.answerYes,
    p: t.answerPartly,
    n: t.answerNo,
    u: t.answerNotSure,
  };
  return ANSWER_ITEMS.map((item) => ({ ...item, label: labels[item.value] ?? '' }));
}

function QuestionCardHeader({
  t,
  question,
}: {
  t: AssessmentMessages;
  question: ReadinessCatalogQuestion;
}) {
  return (
    <div className="flex items-start gap-3">
      <Text
        as="span"
        size="2xs"
        isMono
        tone="muted"
        className="bg-bg-subtle mt-0.5 shrink-0 rounded-md px-2 py-0.5"
      >
        {question.code}
      </Text>
      <div className="min-w-0 flex-1">
        <Text size="sm" className="leading-relaxed">
          {question.prompt}
        </Text>
        <QuestionCardTags t={t} question={question} />
      </div>
    </div>
  );
}

function QuestionCardAnswerRow({
  t,
  question,
  value,
  isAnswered,
  isNoteOpen,
  onChange,
  onToggleNote,
}: {
  t: AssessmentMessages;
  question: ReadinessCatalogQuestion;
  value: AnswerValue | undefined;
  isAnswered: boolean;
  isNoteOpen: boolean;
  onChange: (value: AnswerValue) => void;
  onToggleNote: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        label={question.prompt}
        items={answerItems(t)}
        value={value ?? ''}
        variant="split"
        onValueChange={(next) => {
          onChange(next as AnswerValue);
        }}
      />
      <Button
        variant="ghost"
        tone="brand"
        size="sm"
        startSlot={<StickyNote className="size-3.5" />}
        isDisabled={!isAnswered}
        className="ms-auto"
        onClick={onToggleNote}
        aria-expanded={isNoteOpen}
      >
        {t.questionNoteToggle}
      </Button>
    </div>
  );
}

function QuestionCard({
  t,
  question,
  value,
  note,
  isFlashing,
  onChange,
  onNote,
}: {
  t: AssessmentMessages;
  question: ReadinessCatalogQuestion;
  value: AnswerValue | undefined;
  note: string | undefined;
  isFlashing: boolean;
  onChange: (value: AnswerValue) => void;
  onNote: (note: string) => void;
}) {
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const isAnswered = value !== undefined;

  return (
    <div
      id={`gq-${question.id}`}
      className={cn(
        'duration-fast ease-standard flex flex-col gap-3 rounded-xl border p-4 transition-colors',
        isAnswered ? 'border-success-subtle' : 'border-border-default',
        isFlashing && 'border-warning-solid ring-warning-solid/15 ring-4',
      )}
    >
      <QuestionCardHeader t={t} question={question} />
      <QuestionCardAnswerRow
        t={t}
        question={question}
        value={value}
        isAnswered={isAnswered}
        isNoteOpen={isNoteOpen}
        onChange={onChange}
        onToggleNote={() => {
          setIsNoteOpen((open) => !open);
        }}
      />
      <QuestionCardNote
        t={t}
        questionId={question.id}
        note={note}
        isOpen={isNoteOpen}
        isDisabled={!isAnswered}
        onNote={onNote}
      />
    </div>
  );
}

function DomainSectionHeader({
  t,
  domain,
  questionCount,
  profile,
}: {
  t: AssessmentMessages;
  domain: ReadinessCatalogDomain;
  questionCount: number;
  profile: AssessmentProfile;
}) {
  const isExcluded =
    domain.gateKey !== null && profile[domain.gateKey as keyof AssessmentProfile] === 'no';

  return (
    <div className="flex items-start gap-3 border-b pb-3">
      <span
        className={
          isExcluded
            ? 'bg-bg-subtle text-fg-muted grid size-9 shrink-0 place-items-center rounded-lg'
            : 'bg-brand-subtle text-brand-fg grid size-9 shrink-0 place-items-center rounded-lg'
        }
      >
        <Target aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <Text as="span" size="sm" weight="bold">
          {domain.name}
        </Text>
        <Text size="xs" tone="muted" className="block">
          {isExcluded
            ? t.domainNotApplicableNote.replace('{count}', String(questionCount))
            : t.domainQuestionCount
                .replace('{count}', String(questionCount))
                .replace('{mustHave}', '')}
        </Text>
      </div>
      <Text as="span" size="2xs" isMono tone="muted" className="shrink-0">
        {domain.sectionRefs.join(' · ')}
      </Text>
    </div>
  );
}

export function QuestionStep({
  t,
  domainKeys,
  domains,
  questions,
  profile,
  answers,
  notes,
  flashQuestionId,
  onAnswer,
  onNote,
}: {
  t: AssessmentMessages;
  domainKeys: readonly string[];
  domains: readonly ReadinessCatalogDomain[];
  questions: readonly ReadinessCatalogQuestion[];
  profile: AssessmentProfile;
  answers: Record<string, AnswerValue | undefined>;
  notes: Record<string, string | undefined>;
  flashQuestionId: string | undefined;
  onAnswer: (questionId: string, value: AnswerValue) => void;
  onNote: (questionId: string, note: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {domainKeys.map((domainKey) => {
        const domain = domains.find((d) => d.key === domainKey);
        if (!domain) return null;
        const domainQuestions = questions.filter((q) => q.domainId === domain.id);
        const isExcluded =
          domain.gateKey !== null && profile[domain.gateKey as keyof AssessmentProfile] === 'no';
        return (
          <div key={domainKey} className="flex flex-col gap-3">
            <DomainSectionHeader
              t={t}
              domain={domain}
              questionCount={domainQuestions.length}
              profile={profile}
            />
            {!isExcluded &&
              domainQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  t={t}
                  question={question}
                  value={answers[question.id]}
                  note={notes[question.id]}
                  isFlashing={question.id === flashQuestionId}
                  onChange={(value) => {
                    onAnswer(question.id, value);
                  }}
                  onNote={(note) => {
                    onNote(question.id, note);
                  }}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
