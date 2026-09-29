'use client';

/**
 * @tier page-local
 *
 * "Skip ahead" — ports the prototype's `gaDemoBar()`/`gaDemoFill()`. A QA/demo
 * aid, not a product feature: it fills the whole questionnaire with a sample
 * answer set so the wizard and report can be reviewed without answering every
 * question by hand. Rendered only outside production — see the caller in
 * `AssessmentWizard.tsx`.
 */
import { useState } from 'react';
import { ClipboardList, FileBarChart, SlidersHorizontal, Wand2 } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Text } from '@atoms/Text';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import type {
  AnswerValue,
  AssessmentProfile,
  ReadinessCatalogDomain,
  ReadinessCatalogQuestion,
  useToast,
  useUpdateRun,
} from '@shared/hooks';
import type { PersonOption } from '@molecules/PeoplePicker';
import { isQuestionActive } from './AssessmentWizard';
import {
  ASSESSMENT_DEMO_PRESETS,
  DEFAULT_DEMO_PRESET,
  type DemoPresetKey,
} from './assessmentDemoPresets';
import type { AssessmentMessages } from './AssessmentMessages';

const PRESET_OPTIONS: ListboxOption[] = Object.entries(ASSESSMENT_DEMO_PRESETS).map(
  ([value, preset]) => ({ value, label: preset.label }),
);

/** Loosely matches a preset's role hint against an employee's designation;
 * falls back to the first person in the roster so the demo always has an
 * assessor even when no designation matches (real rosters vary per workspace,
 * unlike the prototype's fixed name lookup). */
function pickAssessor(people: readonly PersonOption[], roleHint: string): string | undefined {
  const hint = roleHint.toLowerCase();
  const match = people.find((p) => p.detail?.toLowerCase().includes(hint));
  return (match ?? people[0])?.id;
}

async function fillDemoAnswers(
  presetKey: DemoPresetKey,
  profile: AssessmentProfile,
  questions: readonly ReadinessCatalogQuestion[],
  domains: readonly ReadinessCatalogDomain[],
  people: readonly PersonOption[],
  updateRun: ReturnType<typeof useUpdateRun>,
): Promise<number> {
  const preset = ASSESSMENT_DEMO_PRESETS[presetKey];
  const domainsById = new Map(domains.map((d) => [d.id, d]));
  const nextProfile: AssessmentProfile = {
    ...profile,
    ...preset.profile,
    assessorEmployeeId: pickAssessor(people, preset.assessorRoleHint) ?? profile.assessorEmployeeId,
  };
  await updateRun.mutateAsync({ profile: nextProfile });

  const activeQuestions = questions.filter((q) => isQuestionActive(q, domainsById, nextProfile));
  await Promise.all(
    activeQuestions.map((question, index) => {
      const value: AnswerValue = preset.mix[index % preset.mix.length] ?? 'u';
      return updateRun.mutateAsync({
        answer: { questionId: question.id, value, note: preset.notes[question.code] },
      });
    }),
  );
  return activeQuestions.length;
}

function DemoBarCaption({ t, questionCount }: { t: AssessmentMessages; questionCount: number }) {
  return (
    <div className="min-w-56 flex-1">
      <div className="flex items-center gap-2">
        <Text as="span" size="sm" weight="bold">
          {t.demoBarTitle}
        </Text>
        <Badge tone="neutral" size="sm">
          {t.demoBarBadge}
        </Badge>
      </div>
      <Text size="xs" tone="muted" className="block">
        {t.demoBarBody.replace('{count}', String(questionCount))}
      </Text>
    </div>
  );
}

function DemoBarActions({
  t,
  isFilling,
  onFill,
}: {
  t: AssessmentMessages;
  isFilling: boolean;
  onFill: (generate: boolean) => void;
}) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        startSlot={<ClipboardList className="size-4" />}
        isDisabled={isFilling}
        onClick={() => {
          onFill(false);
        }}
      >
        {t.demoFillCta}
      </Button>
      <Button
        tone="brand"
        size="sm"
        startSlot={<FileBarChart className="size-4" />}
        isDisabled={isFilling}
        onClick={() => {
          onFill(true);
        }}
      >
        {t.demoGenerateCta}
      </Button>
    </>
  );
}

export function AssessmentDemoBar({
  t,
  profile,
  questions,
  domains,
  people,
  updateRun,
  toast,
  onFilled,
  onGenerate,
}: {
  t: AssessmentMessages;
  profile: AssessmentProfile;
  questions: readonly ReadinessCatalogQuestion[];
  domains: readonly ReadinessCatalogDomain[];
  people: readonly PersonOption[];
  updateRun: ReturnType<typeof useUpdateRun>;
  toast: ReturnType<typeof useToast>;
  /** Jumps the wizard to step 1 — the "Fill answers" outcome. */
  onFilled: () => void;
  /** The wizard's own `handleFinish` — reused so the completion toast and
   * post-finish navigation stay identical to a real submit. */
  onGenerate: () => void;
}) {
  const [presetKey, setPresetKey] = useState<DemoPresetKey>(DEFAULT_DEMO_PRESET);
  const [isFilling, setIsFilling] = useState(false);

  async function handleFill(generate: boolean) {
    setIsFilling(true);
    try {
      if (generate) {
        toast.show({
          label: t.demoGeneratingToast.replaceAll('{count}', String(questions.length)),
        });
      }
      const count = await fillDemoAnswers(
        presetKey,
        profile,
        questions,
        domains,
        people,
        updateRun,
      );
      if (generate) {
        onGenerate();
        return;
      }
      onFilled();
      toast.show({
        label: t.demoFilledToast.replaceAll('{count}', String(count)),
        tone: 'success',
      });
    } finally {
      setIsFilling(false);
    }
  }

  return (
    <Card variant="soft" size="sm" className="flex flex-wrap items-center gap-3">
      <span className="bg-bg-inverse text-fg-inverse grid size-9 shrink-0 place-items-center rounded-lg">
        <Wand2 aria-hidden className="size-4" />
      </span>
      <DemoBarCaption t={t} questionCount={questions.length} />
      <Listbox
        label={t.demoSelectLabel}
        isLabelVisible={false}
        startSlot={<SlidersHorizontal className="size-4" />}
        options={PRESET_OPTIONS}
        value={presetKey}
        onValueChange={(value) => {
          setPresetKey(value as DemoPresetKey);
        }}
        size="sm"
        isDisabled={isFilling}
      />
      <DemoBarActions
        t={t}
        isFilling={isFilling}
        onFill={(generate) => {
          void handleFill(generate);
        }}
      />
    </Card>
  );
}
