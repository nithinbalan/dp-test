'use client';

/** Owns the pick/describe state for the two notice-creation paths — real mutations. */
import { useEffect, useState, type ReactNode } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Network, PenLine, Sparkles } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Text } from '@atoms/Text';
import { Textarea } from '@atoms/Textarea';
import { Field } from '@molecules/Field';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import { PageHeader } from '@molecules/PageHeader';
import { useCreateNoticeFromActivity, useCreateNoticeFromScratch, useToast } from '@shared/hooks';
import { cn } from '@shared/lib';
import type { NewNoticeMessages } from './NewNoticeMessages';

const GENERATING_STEP_MS = 900;
/** Matches the prototype's `ntGenAnim`: 3 steps, then a final pause before `done()`
 * fires. Our own section-generation is synchronous and near-instant (no real AI
 * call), so without this the banner would flash for a few ms and jump straight to
 * the next page — this holds the transition open for the same fixed duration the
 * prototype always used, regardless of how fast the request actually completes. */
const GENERATING_STEP_COUNT = 3;
const GENERATING_FINAL_PAUSE_MS = 700;
const GENERATING_TOTAL_MS = GENERATING_STEP_COUNT * GENERATING_STEP_MS + GENERATING_FINAL_PAUSE_MS;
const MAX_NOTICE_NAME_LENGTH = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** A RoPA activity, as offered by the picker — enough to both label the `Select`
 * option and render the summary card once one is chosen. */
type ActivityOption = {
  id: string;
  name: string;
  purpose: string;
  principals: string;
  dataCategories: readonly string[];
  retention: string;
};

function deriveScratchName(description: string): string {
  const firstLine = description.trim().split('\n')[0] ?? '';
  return firstLine.slice(0, 60).trim();
}

/** Cycles through the "Jethur AI is drafting…" steps while a real mutation is in
 * flight — matches the prototype's `ntGenAnim` / `.rp-genbar`. */
function GeneratingBanner({ steps }: { steps: readonly string[] }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, GENERATING_STEP_MS);
    return () => {
      window.clearInterval(interval);
    };
  }, [steps.length]);

  return (
    <div className="bg-bg-inverse text-fg-inverse rounded-control flex items-center gap-3 px-4 py-3">
      <Sparkles className="text-accent-solid size-5 shrink-0" />
      <Text as="span" size="sm" weight="bold" className="text-fg-inverse">
        {steps[stepIndex]}
      </Text>
    </div>
  );
}

/** Dark square icon badge used on the "Generate from RoPA" card header — matches the
 * prototype's forest-background, lime-icon mark. */
function OptionIconDark({ children }: { children: ReactNode }) {
  return (
    <span className="bg-bg-inverse text-accent-solid rounded-control grid size-9 shrink-0 place-items-center">
      {children}
    </span>
  );
}

/** Light square icon badge used on the "Create from scratch" card header. */
function OptionIconLight({ children }: { children: ReactNode }) {
  return (
    <span className="bg-brand-subtle text-brand-fg rounded-control grid size-9 shrink-0 place-items-center">
      {children}
    </span>
  );
}

/** Shown instead of the activity picker when RoPA has no activities yet. */
function NoActivitiesNotice({ t }: { t: NewNoticeMessages }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-border-default bg-bg-canvas rounded-control border border-dashed p-4 text-center">
        <Text size="sm" tone="muted">
          {t.ropaNoActivitiesText}
        </Text>
      </div>
      <Button asChild variant="outline" startSlot={<Sparkles className="size-4" />}>
        <NextLink href="/ropa/add">{t.ropaBuildCta}</NextLink>
      </Button>
    </div>
  );
}

function RopaOptionHeader({ t }: { t: NewNoticeMessages }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-3">
        <OptionIconDark>
          <Network className="size-5" />
        </OptionIconDark>
        <div>
          <Text weight="bold" size="sm">
            {t.ropaOptionTitle}
          </Text>
          <Text size="xs" tone="muted">
            {t.ropaOptionDescription}
          </Text>
        </div>
      </div>
      <Badge tone="success" variant="soft">
        {t.recommendedTag}
      </Badge>
    </div>
  );
}

/** One row of the activity summary — matches the prototype's `.rv2`. */
function SummaryRow({ label, value, isLast }: { label: string; value: string; isLast: boolean }) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3.5 py-1.5',
        !isLast && 'border-border-default border-b',
      )}
    >
      <Text as="span" size="xs" tone="muted" className="shrink-0">
        {label}
      </Text>
      <Text as="span" size="xs" weight="bold" className="text-end">
        {value}
      </Text>
    </div>
  );
}

/** The linked activity's own facts, shown once one is picked — matches the
 * prototype's `ntPickAct` summary under the picker (`.nt-sum`/`.rv2`). */
function ActivitySummary({ t, activity }: { t: NewNoticeMessages; activity: ActivityOption }) {
  const rows = [
    { label: t.ropaSummaryPurpose, value: activity.purpose },
    { label: t.ropaSummaryData, value: activity.dataCategories.join(', ') },
    { label: t.ropaSummaryPrincipal, value: activity.principals },
    { label: t.ropaSummaryRecipients, value: t.ropaSummaryNoneRecorded },
    { label: t.ropaSummaryRetention, value: activity.retention },
    { label: t.ropaSummaryContact, value: t.ropaSummaryNotConfigured },
  ];
  return (
    <div className="bg-bg-canvas border-border-default rounded-control border px-3.5 py-1">
      {rows.map((row, index) => (
        <SummaryRow
          key={row.label}
          label={row.label}
          value={row.value}
          isLast={index === rows.length - 1}
        />
      ))}
    </div>
  );
}

function RopaOption({
  t,
  activities,
  activityId,
  onActivityIdChange,
  isPending,
  onGenerate,
}: {
  t: NewNoticeMessages;
  activities: readonly ActivityOption[];
  activityId: string;
  onActivityIdChange: (value: string) => void;
  isPending: boolean;
  onGenerate: () => void;
}) {
  const options: ListboxOption[] = [
    { value: '', label: t.ropaPickSelectPlaceholder },
    ...activities.map((activity) => ({
      value: activity.id,
      label: `${activity.id} · ${activity.name}`,
    })),
  ];
  const selectedActivity = activities.find((a) => a.id === activityId);

  return (
    <Card
      variant="ghost"
      className="bg-bg-surface border-brand-solid flex flex-col gap-4 border p-5"
    >
      <RopaOptionHeader t={t} />

      {activities.length === 0 ? (
        <NoActivitiesNotice t={t} />
      ) : (
        <>
          <Listbox
            label={t.ropaPickLabel}
            description={t.ropaPickHint}
            options={options}
            value={activityId}
            onValueChange={onActivityIdChange}
            isDisabled={isPending}
            fullWidth
          />
          {selectedActivity && <ActivitySummary t={t} activity={selectedActivity} />}
        </>
      )}
      {activities.length > 0 && (
        <div className="mt-auto flex flex-col items-start gap-2 pt-2">
          <Button
            variant="solid"
            tone="neutral"
            isDisabled={activityId === '' || isPending}
            onClick={onGenerate}
            startSlot={<Sparkles aria-hidden className="text-accent-solid size-4" />}
          >
            {t.ropaGenerateCta}
          </Button>
          <Text as="span" size="2xs" tone="muted" isMono className="tracking-widest uppercase">
            {t.draftOnlyHint}
          </Text>
        </div>
      )}
    </Card>
  );
}

function ScratchOption({
  t,
  description,
  onDescriptionChange,
  isPending,
  onGenerate,
}: {
  t: NewNoticeMessages;
  description: string;
  onDescriptionChange: (value: string) => void;
  isPending: boolean;
  onGenerate: () => void;
}) {
  return (
    <Card variant="outline" className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <OptionIconLight>
          <PenLine className="size-5" />
        </OptionIconLight>
        <div>
          <Text weight="bold" size="sm">
            {t.scratchOptionTitle}
          </Text>
          <Text size="xs" tone="muted">
            {t.scratchOptionDescription}
          </Text>
        </div>
      </div>
      <Field label={t.scratchLabel} description={t.scratchHint}>
        {(control) => (
          <Textarea
            {...control}
            rows={4}
            value={description}
            onChange={(event) => {
              onDescriptionChange(event.target.value);
            }}
            placeholder={t.scratchPlaceholder}
            isDisabled={isPending}
            fullWidth
          />
        )}
      </Field>
      <div className="mt-auto flex flex-col items-start gap-2 pt-2">
        <Button
          variant="solid"
          tone="neutral"
          isDisabled={description.trim() === '' || isPending}
          onClick={onGenerate}
          startSlot={<Sparkles aria-hidden className="text-accent-solid size-4" />}
        >
          {t.scratchCta}
        </Button>
        <Text as="span" size="2xs" tone="muted" isMono className="tracking-widest uppercase">
          {t.draftOnlyHint}
        </Text>
      </div>
    </Card>
  );
}

/** Wires both create mutations — split out so `NewNoticeView` stays a layout.
 * `isGenerating`/`activePath` (not the mutations' own `isPending`) drive the UI, so
 * the generating banner holds for the full animation even once the request itself
 * has already resolved — see the `GENERATING_TOTAL_MS` comment above. */
function useCreateActions(
  t: NewNoticeMessages,
  activities: readonly ActivityOption[],
  activityId: string,
  description: string,
) {
  const router = useRouter();
  const toast = useToast();
  const createFromActivity = useCreateNoticeFromActivity();
  const createFromScratch = useCreateNoticeFromScratch();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePath, setActivePath] = useState<'ropa' | 'scratch' | null>(null);

  async function runGenerate(path: 'ropa' | 'scratch', task: () => Promise<{ id: string }>) {
    setActivePath(path);
    setIsGenerating(true);
    try {
      const [notice] = await Promise.all([task(), sleep(GENERATING_TOTAL_MS)]);
      toast.show({
        label:
          path === 'scratch'
            ? t.toastGeneratedScratch
            : t.toastGenerated.replace('{ref}', activityId || 'RoPA'),
        tone: 'success',
      });
      router.push(`/notices/${notice.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.toastGenerateFailed;
      toast.show({ label: message, tone: 'danger' });
    } finally {
      setIsGenerating(false);
      setActivePath(null);
    }
  }

  function handleGenerateFromActivity() {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    void runGenerate('ropa', () =>
      createFromActivity.mutateAsync({
        name: `${activity.name.replace(/&/g, 'and')} — ${t.generatedNoticeSuffix}`.slice(
          0,
          MAX_NOTICE_NAME_LENGTH,
        ),
        activityId,
      }),
    );
  }

  function handleGenerateFromScratch() {
    const name = deriveScratchName(description) || t.untitledNotice;
    void runGenerate('scratch', () => createFromScratch.mutateAsync({ name, description }));
  }

  return { isGenerating, activePath, handleGenerateFromActivity, handleGenerateFromScratch };
}

export function NewNoticeView({
  pageRefTag,
  t,
  activities,
}: {
  pageRefTag: string;
  t: NewNoticeMessages;
  activities: readonly ActivityOption[];
}) {
  const [activityId, setActivityId] = useState('');
  const [description, setDescription] = useState('');
  const { isGenerating, activePath, handleGenerateFromActivity, handleGenerateFromScratch } =
    useCreateActions(t, activities, activityId, description);

  const selectedActivityName = activities.find((a) => a.id === activityId)?.name ?? '';
  const generatingSteps =
    activePath === 'ropa'
      ? [t.genStepRopa1, t.genStepRopa2.replace('{ref}', selectedActivityName), t.genStepRopa3]
      : [t.genStepScratch1, t.genStepScratch2, t.genStepScratch3];

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <NextLink href="/notices">
          <ArrowLeft className="me-1.5 inline size-4" />
          {t.backToNotices}
        </NextLink>
      </Button>
      <PageHeader refTag={pageRefTag} label={t.newTitle} description={t.newDescription} />

      {isGenerating && <GeneratingBanner steps={generatingSteps} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <RopaOption
          t={t}
          activities={activities}
          activityId={activityId}
          onActivityIdChange={setActivityId}
          isPending={isGenerating}
          onGenerate={handleGenerateFromActivity}
        />
        <ScratchOption
          t={t}
          description={description}
          onDescriptionChange={setDescription}
          isPending={isGenerating}
          onGenerate={handleGenerateFromScratch}
        />
      </div>
    </div>
  );
}
