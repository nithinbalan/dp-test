'use client';

/* eslint-disable max-lines-per-function, complexity */
/**
 * Configuration Studio's Master Data — a section's question list, shown
 * inline once its row is expanded. Full add/rename/delete over
 * `/api/readiness/master-data/domains/[id]/questions`.
 */
import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Info } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { IconButton } from '@atoms/IconButton';
import { Input } from '@atoms/Input';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { Alert } from '@molecules/Alert';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import {
  useCreateReadinessQuestion,
  useDeleteReadinessQuestion,
  useReadinessQuestions,
  useToast,
  useUpdateReadinessQuestion,
  type MasterQuestionRow,
  type QuestionInput,
} from '@shared/hooks';
import type { SettingsMessages } from './SettingsMessages';

function weightOptions(t: SettingsMessages): ListboxOption[] {
  return [
    { value: '1', label: t.questionWeightLow },
    { value: '2', label: t.questionWeightMedium },
    { value: '3', label: t.questionWeightMustHave },
  ];
}

type DraftQuestion = MasterQuestionRow & {
  _status?: 'added' | 'updated' | 'deleted' | undefined;
};

export function QuestionsMasterList({ t, domainId }: { t: SettingsMessages; domainId: string }) {
  const { data, isLoading, refetch } = useReadinessQuestions(domainId);

  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [newDraft, setNewDraft] = useState<QuestionInput>({ prompt: '', weight: 2 });

  const createQuestion = useCreateReadinessQuestion(domainId);
  const updateQuestion = useUpdateReadinessQuestion(domainId);
  const deleteQuestion = useDeleteReadinessQuestion(domainId);
  const toast = useToast();

  useEffect(() => {
    if (data && !isInitialized) {
      queueMicrotask(() => {
        setDrafts(data);
        setIsInitialized(true);
      });
    }
  }, [data, isInitialized]);

  const activeDrafts = drafts.filter((d) => d._status !== 'deleted');
  const addedCount = drafts.filter((d) => d._status === 'added').length;
  const editedCount = drafts.filter((d) => d._status === 'updated').length;
  const deletedCount = drafts.filter((d) => d._status === 'deleted').length;
  const isDirty = drafts.some((d) => d._status !== undefined);
  const isSaving = createQuestion.isPending || updateQuestion.isPending || deleteQuestion.isPending;

  function handleAdd() {
    const prompt = newDraft.prompt.trim();
    if (prompt.length === 0) return;
    setDrafts((prev) => [
      ...prev,
      {
        id: `new_${String(Date.now())}`,
        domainId,
        code: '',
        position: 0,
        prompt,
        weight: newDraft.weight,
        sectionRef: newDraft.sectionRef ?? null,
        remedy: newDraft.remedy ?? '',
        _status: 'added',
      },
    ]);
    toast.show({
      label: 'Question Added',
      description: 'Question added to section drafts',
      tone: 'brand',
    });
    setNewDraft({ prompt: '', weight: 2 });
  }

  function handleUpdate(
    id: string,
    field: keyof QuestionInput,
    value: string | number | undefined,
  ) {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = { ...d, [field]: value };
          if (updated._status === 'added') return updated;
          return { ...updated, _status: 'updated' };
        }
        return d;
      }),
    );
  }

  function handleDelete(id: string) {
    const target = drafts.find((d) => d.id === id);
    setDrafts((prev) => {
      const draft = prev.find((d) => d.id === id);
      if (draft?._status === 'added') {
        return prev.filter((d) => d.id !== id);
      }
      return prev.map((d) => (d.id === id ? { ...d, _status: 'deleted' } : d));
    });
    if (target) {
      toast.show({
        label: 'Question Deleted',
        description: 'Question marked for deletion',
        tone: 'danger',
      });
    }
  }

  async function handleSave() {
    let hasError = false;
    for (const draft of drafts) {
      try {
        if (draft._status === 'added') {
          await createQuestion.mutateAsync({
            prompt: draft.prompt,
            weight: draft.weight,
            sectionRef: draft.sectionRef ?? undefined,
            remedy: draft.remedy,
          });
        } else if (draft._status === 'updated') {
          await updateQuestion.mutateAsync({
            id: draft.id,
            input: {
              prompt: draft.prompt,
              weight: draft.weight,
              sectionRef: draft.sectionRef ?? undefined,
              remedy: draft.remedy,
            },
          });
        } else if (draft._status === 'deleted') {
          await deleteQuestion.mutateAsync(draft.id);
        }
      } catch {
        hasError = true;
        toast.show({ label: t.errorGeneric, tone: 'danger' });
        break;
      }
    }

    if (!hasError) {
      toast.show({ label: t.toastSaved, tone: 'success' });
    }

    // Read straight off the refetch result — see DepartmentsMasterList.tsx's
    // handleSave for why resetting `isInitialized` and waiting for the sync
    // effect races on the still-stale cached `data`.
    const result = await refetch();
    setDrafts(result.data ?? []);
  }

  function handleDiscard() {
    setIsInitialized(false);
    setNewDraft({ prompt: '', weight: 2 });
  }

  return (
    <div className="border-border-default mt-2 flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-col gap-2">
        <Text size="sm" weight="medium">
          {t.tabSections}
        </Text>
      </div>
      <Card variant="soft" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Text as="span" size="sm" weight="medium">
            {t.questionPromptLabel}
          </Text>
          <Input
            value={newDraft.prompt}
            onChange={(e) => {
              setNewDraft((prev) => ({ ...prev, prompt: e.target.value }));
            }}
            placeholder={t.questionPromptPlaceholder}
            fullWidth
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Listbox
            label={t.questionWeightLabel}
            options={weightOptions(t)}
            value={String(newDraft.weight)}
            onValueChange={(val) => {
              setNewDraft((prev) => ({ ...prev, weight: Number(val) }));
            }}
            fullWidth
          />
          <div className="flex flex-col gap-1.5">
            <Text as="span" size="sm" weight="medium">
              {t.questionSectionRefLabel}
            </Text>
            <Input
              value={newDraft.sectionRef ?? ''}
              onChange={(e) => {
                setNewDraft((prev) => ({ ...prev, sectionRef: e.target.value }));
              }}
              placeholder={t.questionSectionRefPlaceholder}
              fullWidth
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Text as="span" size="sm" weight="medium">
              {t.questionRemedyLabel}
            </Text>
            <Input
              value={newDraft.remedy ?? ''}
              onChange={(e) => {
                setNewDraft((prev) => ({ ...prev, remedy: e.target.value }));
              }}
              placeholder={t.questionRemedyPlaceholder}
              fullWidth
            />
          </div>
        </div>
        <Button
          tone="brand"
          size="sm"
          startSlot={<Plus className="size-4" />}
          onClick={() => {
            handleAdd();
          }}
          isDisabled={!newDraft.prompt.trim()}
          className="self-start"
        >
          {t.addQuestionCta}
        </Button>
      </Card>

      {/* unsaved changes alert banner */}
      {isDirty && (
        <Alert
          tone="info"
          variant="soft"
          size="sm"
          label={t.pendingChangesTitle}
          description={`Unsaved changes in this section: ${[
            addedCount > 0 ? `${String(addedCount)} added` : '',
            editedCount > 0 ? `${String(editedCount)} edited` : '',
            deletedCount > 0 ? `${String(deletedCount)} marked for deletion` : '',
          ]
            .filter(Boolean)
            .join(', ')}.`}
          startSlot={<Info className="size-4" />}
        />
      )}

      {isLoading ? (
        <Skeleton className="rounded-control h-16 w-full" />
      ) : activeDrafts.length === 0 ? (
        <Text size="sm" tone="muted">
          {t.questionsEmptyDescription}
        </Text>
      ) : (
        activeDrafts.map((question) => (
          <Card key={question.id} variant="outline" className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Input
                value={question.prompt}
                onChange={(e) => {
                  handleUpdate(question.id, 'prompt', e.target.value);
                }}
                aria-label={t.questionPromptLabel}
                fullWidth
              />
              <IconButton
                label={t.deleteQuestionLabel}
                variant="outline"
                tone="danger"
                size="sm"
                onClick={() => {
                  handleDelete(question.id);
                }}
              >
                <Trash2 className="size-4" />
              </IconButton>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Listbox
                label={t.questionWeightLabel}
                options={weightOptions(t)}
                value={String(question.weight)}
                onValueChange={(val) => {
                  handleUpdate(question.id, 'weight', Number(val));
                }}
                fullWidth
              />
              <div className="flex flex-col gap-1.5">
                <Text as="span" size="sm" weight="medium">
                  {t.questionSectionRefLabel}
                </Text>
                <Input
                  value={question.sectionRef ?? ''}
                  onChange={(e) => {
                    handleUpdate(question.id, 'sectionRef', e.target.value);
                  }}
                  placeholder={t.questionSectionRefPlaceholder}
                  fullWidth
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Text as="span" size="sm" weight="medium">
                  {t.questionRemedyLabel}
                </Text>
                <Input
                  value={question.remedy}
                  onChange={(e) => {
                    handleUpdate(question.id, 'remedy', e.target.value);
                  }}
                  placeholder={t.questionRemedyPlaceholder}
                  fullWidth
                />
              </div>
            </div>
          </Card>
        ))
      )}

      <div className="mt-2 flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleDiscard();
              }}
              isDisabled={isSaving}
            >
              {t.discardCta}
            </Button>
          )}
          <Button
            tone="brand"
            size="sm"
            isDisabled={!isDirty || isSaving}
            startSlot={<Check className="size-4" />}
            onClick={() => {
              void handleSave();
            }}
          >
            {t.saveCta}
          </Button>
        </div>
      </div>
    </div>
  );
}
