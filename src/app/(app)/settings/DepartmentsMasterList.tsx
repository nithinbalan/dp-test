'use client';

/* eslint-disable max-lines-per-function, complexity */
/**
 * Configuration Studio's Master Data — "Departments" tab.
 * Uses the project's own @molecules/Table for a consistent look with every
 * other list view in the app (Employees, Controls, Notices, etc.).
 */
import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, Check, X, RotateCcw, Info } from 'lucide-react';
import { Switch } from '@atoms/Switch';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { IconButton } from '@atoms/IconButton';
import { Input } from '@atoms/Input';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { Alert } from '@molecules/Alert';
import { EmptyState } from '@molecules/EmptyState';
import { Table } from '@molecules/Table';
import { ApiError } from '@shared/lib/api-client';
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useToast,
  useUpdateDepartment,
  type DepartmentRow,
} from '@shared/hooks';
import type { SettingsMessages } from './SettingsMessages';

type DraftDepartment = DepartmentRow & {
  _status?: 'added' | 'updated' | 'deleted' | undefined;
};

type EditingState = { id: string; name: string; isActive: boolean } | null;

const SKELETON_ROW_COUNT = 4;

function DepartmentTableSkeleton({ t }: { t: SettingsMessages }) {
  return (
    <Card variant="outline" size="none" className="overflow-hidden" aria-busy>
      <Table label="Departments loading">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t.headerDepartmentName}</Table.HeaderCell>
            <Table.HeaderCell>{t.headerStatus}</Table.HeaderCell>
            <Table.HeaderCell align="end">{t.headerActions}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
            <Table.Row key={i}>
              <Table.Cell>
                <Skeleton className="h-4 w-40" />
              </Table.Cell>
              <Table.Cell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </Table.Cell>
              <Table.Cell align="end">
                <div className="flex justify-end gap-1">
                  <Skeleton shape="circle" className="size-8" />
                  <Skeleton shape="circle" className="size-8" />
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}

export function DepartmentsMasterList({ t }: { t: SettingsMessages }) {
  const { data, isLoading, isError, refetch } = useDepartments();
  const [drafts, setDrafts] = useState<DraftDepartment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  /* inline-add form */
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');

  /* inline-edit (one row at a time) */
  const [editing, setEditing] = useState<EditingState>(null);

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const toast = useToast();

  useEffect(() => {
    if (data && !isInitialized) {
      queueMicrotask(() => {
        setDrafts(data.map((d) => ({ ...d })));
        setIsInitialized(true);
      });
    }
  }, [data, isInitialized]);

  const addedCount = drafts.filter((d) => d._status === 'added').length;
  const editedCount = drafts.filter((d) => d._status === 'updated').length;
  const deletedCount = drafts.filter((d) => d._status === 'deleted').length;
  const isDirty = drafts.some((d) => d._status !== undefined);
  const isSaving =
    createDepartment.isPending || updateDepartment.isPending || deleteDepartment.isPending;

  /* ── handlers ─────────────────────────────────────────────────────────── */
  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setDrafts((prev) => [
      ...prev,
      { id: `new_${String(Date.now())}`, name: trimmed, isActive: true, _status: 'added' },
    ]);
    toast.show({
      label: 'Department Added',
      description: `"${trimmed}" added to drafts`,
      tone: 'brand',
    });
    setNewName('');
    setShowAddForm(false);
  }

  function startEdit(dept: DraftDepartment) {
    setEditing({ id: dept.id, name: dept.name, isActive: dept.isActive });
  }
  function commitEdit() {
    if (!editing) return;
    const trimmed = editing.name.trim();
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== editing.id) return d;
        if (d._status === 'added') return { ...d, name: trimmed, isActive: editing.isActive };
        return { ...d, name: trimmed, isActive: editing.isActive, _status: 'updated' };
      }),
    );
    toast.show({
      label: 'Department Edited',
      description: `"${trimmed}" updated in drafts`,
      tone: 'warning',
    });
    setEditing(null);
  }
  function cancelEdit() {
    setEditing(null);
  }

  function handleDelete(id: string) {
    const target = drafts.find((d) => d.id === id);
    setDrafts((prev) => {
      const draft = prev.find((d) => d.id === id);
      if (draft?._status === 'added') return prev.filter((d) => d.id !== id);
      return prev.map((d) => (d.id === id ? { ...d, _status: 'deleted' } : d));
    });
    if (editing?.id === id) setEditing(null);
    if (target) {
      toast.show({
        label: 'Department Deleted',
        description: `"${target.name}" marked for deletion`,
        tone: 'danger',
      });
    }
  }

  function handleUndoDelete(id: string) {
    const target = drafts.find((d) => d.id === id);
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const { _status, ...rest } = d;
        return rest;
      }),
    );
    if (target) {
      toast.show({
        label: 'Department Restored',
        description: `"${target.name}" restored`,
        tone: 'info',
      });
    }
  }

  async function handleSave() {
    let hasError = false;
    for (const draft of drafts) {
      try {
        if (draft._status === 'added') {
          await createDepartment.mutateAsync(draft.name);
        } else if (draft._status === 'updated') {
          await updateDepartment.mutateAsync({
            id: draft.id,
            name: draft.name,
            isActive: draft.isActive,
          });
        } else if (draft._status === 'deleted') {
          await deleteDepartment.mutateAsync(draft.id);
        }
      } catch (error) {
        hasError = true;
        const isConflict = error instanceof ApiError && error.code === 'CONFLICT';
        toast.show({
          label: isConflict ? t.departmentNameConflict : t.errorGeneric,
          tone: 'danger',
        });
        break;
      }
    }
    if (!hasError) {
      toast.show({ label: t.toastSaved, tone: 'success' });
    }
    // Read straight off the refetch result rather than resetting `isInitialized`
    // and waiting for the sync effect to pick up the next `data` — that raced:
    // `isInitialized` flips to `false` and re-renders on the STILL-STALE cached
    // `data` before this awaited refetch resolves, so the effect re-seeds drafts
    // from the old list and flips `isInitialized` back to `true` before the fresh
    // rows ever arrive. The new/deleted row then only appeared after a full page
    // reload, which re-ran the mount effect from scratch.
    const result = await refetch();
    setDrafts((result.data ?? []).map((d) => ({ ...d })));
  }

  function handleDiscard() {
    setIsInitialized(false);
    setShowAddForm(false);
    setNewName('');
    setEditing(null);
  }

  /* ── loading / error ─────────────────────────────────────────────────── */
  if (isLoading) return <DepartmentTableSkeleton t={t} />;
  if (isError) return <EmptyState label={t.departmentLoadError} tone="danger" />;

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── card with toolbar + table ── */}
      <Card variant="outline" size="none" className="overflow-hidden">
        {/* toolbar */}
        <div className="border-border-default flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <Text size="sm" weight="medium">
            {t.departmentTitle}
          </Text>
          <Button
            tone="brand"
            size="sm"
            startSlot={<Plus className="size-4" />}
            onClick={() => {
              setShowAddForm(true);
              setNewName('');
            }}
          >
            {t.addDepartmentCta}
          </Button>
        </div>

        {/* inline add row */}
        {showAddForm && (
          <div className="border-border-default bg-bg-subtle flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <div className="flex min-w-0 flex-1 gap-2">
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                }}
                placeholder={t.departmentNamePlaceholder}
                aria-label={t.departmentNameLabel}
                fullWidth
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') setShowAddForm(false);
                }}
              />
            </div>
            <Button
              tone="brand"
              size="sm"
              startSlot={<Check className="size-4" />}
              isDisabled={!newName.trim()}
              onClick={() => {
                handleAdd();
              }}
            >
              {t.addCta}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              startSlot={<X className="size-4" />}
              onClick={() => {
                setShowAddForm(false);
              }}
            >
              {t.cancelCta}
            </Button>
          </div>
        )}

        {/* unsaved changes alert banner */}
        {isDirty && (
          <div className="border-border-default border-b p-3">
            <Alert
              tone="info"
              variant="soft"
              size="sm"
              label={t.pendingChangesTitle}
              description={`Unsaved changes in departments list: ${[
                addedCount > 0 ? `${String(addedCount)} added` : '',
                editedCount > 0 ? `${String(editedCount)} edited` : '',
                deletedCount > 0 ? `${String(deletedCount)} marked for deletion` : '',
              ]
                .filter(Boolean)
                .join(', ')}.`}
              startSlot={<Info className="size-4" />}
            />
          </div>
        )}

        {/* table */}
        {drafts.length === 0 ? (
          <div className="px-4 py-10">
            <EmptyState label={t.departmentEmptyTitle} description={t.departmentEmptyDescription} />
          </div>
        ) : (
          <Table label="Departments">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t.headerDepartmentName}</Table.HeaderCell>
                <Table.HeaderCell>{t.headerStatus}</Table.HeaderCell>
                <Table.HeaderCell align="end">{t.headerActions}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {drafts.map((dept) => {
                const isEditing = editing?.id === dept.id;
                const isDeleted = dept._status === 'deleted';
                const isActive = dept.isActive;

                return (
                  <Table.Row key={dept.id} isDisabled={isDeleted}>
                    {/* name */}
                    <Table.Cell isTruncated>
                      {isEditing ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex-1">
                            <Input
                              value={editing.name}
                              onChange={(e) => {
                                setEditing({ ...editing, name: e.target.value });
                              }}
                              aria-label={t.departmentNameLabel}
                              fullWidth
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                          </div>
                          <Switch
                            size="sm"
                            tone={editing.isActive ? 'success' : 'danger'}
                            isSelected={editing.isActive}
                            onValueChange={(v) => {
                              setEditing({ ...editing, isActive: v });
                            }}
                          >
                            {editing.isActive ? t.statusActive : t.statusInactive}
                          </Switch>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Text
                            as="span"
                            weight="medium"
                            isTruncated
                            className={isDeleted ? 'line-through opacity-60' : undefined}
                          >
                            {dept.name}
                          </Text>
                          {dept._status === 'added' && (
                            <Badge tone="brand" size="xs">
                              {t.badgeAdded}
                            </Badge>
                          )}
                          {dept._status === 'updated' && (
                            <Badge tone="warning" size="xs">
                              {t.badgeEdited}
                            </Badge>
                          )}
                          {dept._status === 'deleted' && (
                            <Badge tone="danger" size="xs">
                              {t.badgeDeleted}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Table.Cell>

                    {/* status badge */}
                    <Table.Cell isNowrap>
                      <Badge tone={isActive ? 'success' : 'danger'} size="xs">
                        {isActive ? t.statusActive : t.statusInactive}
                      </Badge>
                    </Table.Cell>

                    {/* actions */}
                    <Table.Cell align="end" isNowrap>
                      <div className="flex items-center justify-end gap-1">
                        {isDeleted ? (
                          <IconButton
                            label="Restore department"
                            variant="ghost"
                            tone="brand"
                            size="sm"
                            onClick={() => {
                              handleUndoDelete(dept.id);
                            }}
                          >
                            <RotateCcw className="size-4" />
                          </IconButton>
                        ) : isEditing ? (
                          <>
                            <IconButton
                              label="Confirm edit"
                              variant="ghost"
                              tone="brand"
                              size="sm"
                              onClick={() => {
                                commitEdit();
                              }}
                            >
                              <Check className="size-4" />
                            </IconButton>
                            <IconButton
                              label="Cancel edit"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                cancelEdit();
                              }}
                            >
                              <X className="size-4" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton
                              label="Edit department"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                startEdit(dept);
                              }}
                            >
                              <Pencil className="size-4" />
                            </IconButton>
                            <IconButton
                              label={t.deleteDepartmentLabel}
                              variant="ghost"
                              tone="danger"
                              size="sm"
                              onClick={() => {
                                handleDelete(dept.id);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* ── footer save bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Text size="xs" tone="muted" isMono className="tracking-wide uppercase">
          {t.footerHint}
        </Text>
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
    </>
  );
}
