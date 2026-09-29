'use client';

/**
 * Owns the real, DB-backed draft state for the Configuration Studio "Workspace"
 * tab. Every other Settings tab still runs on local mock state (SettingsState) —
 * this is the one panel wired to `/api/settings/workspace` via TanStack Query
 * (docs/TANSTACK_QUERY.md).
 *
 * The DPO picker's roster comes from `dpoCandidates` — this workspace's real,
 * active `employee` rows — not from the page's mock `people` prop. That prop
 * still feeds the other Settings tabs (Gap Assessment's default assessor),
 * which have no backing table yet.
 *
 * `workspaceLogoUrl` uploads through `useUploadWorkspaceLogo` (POST
 * `/api/settings/workspace/logo`) as soon as a file is picked — separately from
 * the panel's own Save button, since the file itself has nothing to do with the
 * legal-name/sector/DPO fields that button persists.
 */
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import type { PersonOption } from '@molecules/PeoplePicker';
import {
  useSaveWorkspaceSettings,
  useToast,
  useUploadWorkspaceLogo,
  useWorkspaceSettings,
} from '@shared/hooks';
import type { WorkspaceSettingsData } from '@shared/hooks/use-workspace-settings';
import type { SettingsMessages } from './SettingsMessages';
import { WorkspacePanel, type WorkspacePanelState } from './WorkspacePanel';

/** One skeleton settings row, shaped like `SettingsRow` — a label bar, a
 * description bar, and a control-shaped bar sized to that row's real control
 * — rather than a generic full-width block. */
function SettingsRowSkeleton({
  controlClassName,
  controlShape,
}: {
  controlClassName: string;
  controlShape?: 'rounded' | 'circle' | undefined;
}) {
  return (
    <div className="border-border-default flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton shape={controlShape} className={`shrink-0 ${controlClassName}`} />
    </div>
  );
}

/** Same rows `WorkspacePanel` renders — logo, legal name, tenant address,
 * sector, languages, DPO and publish-DPO — each skeleton control sized like
 * its real counterpart (avatar, input, select, tag picker, people picker,
 * switch) instead of uniform bars. */
function WorkspacePanelSkeleton() {
  return (
    <Card variant="outline" className="flex flex-col gap-4">
      <SettingsRowSkeleton controlClassName="size-12" controlShape="circle" />
      <SettingsRowSkeleton controlClassName="h-9 w-56" />
      <SettingsRowSkeleton controlClassName="h-9 w-56" />
      <SettingsRowSkeleton controlClassName="h-9 w-40" />
      <SettingsRowSkeleton controlClassName="h-9 w-56" />
      <SettingsRowSkeleton controlClassName="h-9 w-56" />
      <SettingsRowSkeleton controlClassName="h-6 w-11" controlShape="circle" />
    </Card>
  );
}

function toDraft(data: WorkspaceSettingsData): WorkspacePanelState {
  return {
    workspaceLogoUrl: data.logoUrl ?? undefined,
    legalEntityName: data.legalName,
    sector: data.sector,
    languages: data.languages,
    dpoId: data.dpoEmployeeId ?? undefined,
    publishDpo: data.publishDpoContact,
  };
}

/**
 * Identifies "the server state Save persists" for the remount key below —
 * deliberately NOT `logoUrl`. The logo uploads through its own mutation the
 * instant a file is picked, so its cache write must never force a remount:
 * that would wipe `isDirty` (and any other in-progress, unsaved edit) out from
 * under the user right after an upload that has nothing to do with them.
 */
function persistedFieldsKey(data: WorkspaceSettingsData): string {
  return JSON.stringify({
    legalName: data.legalName,
    sector: data.sector,
    languages: data.languages,
    dpoEmployeeId: data.dpoEmployeeId,
    publishDpoContact: data.publishDpoContact,
  });
}

function toPeopleOptions(data: WorkspaceSettingsData): PersonOption[] {
  return data.dpoCandidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.fullName,
    initials: candidate.fullName
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    detail: candidate.designation ?? candidate.workEmail ?? undefined,
  }));
}

function WorkspaceEditor({
  initial,
  tenantAddress,
  t,
}: {
  initial: WorkspaceSettingsData;
  tenantAddress: string;
  t: SettingsMessages;
}) {
  const [draft, setDraft] = useState<WorkspacePanelState>(() => toDraft(initial));
  const [isDirty, setIsDirty] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const save = useSaveWorkspaceSettings();
  const uploadLogo = useUploadWorkspaceLogo();
  const people = toPeopleOptions(initial);

  function handleChange(patch: Partial<WorkspacePanelState>) {
    setDraft((current) => ({ ...current, ...patch }));
    setIsDirty(true);
  }

  function handleLogoFileSelected(file: File) {
    uploadLogo.mutate(file, {
      onSuccess: () => {
        // The topbar/sidebar read the logo from the session-resolved Server
        // Component in layout.tsx, not from this page's TanStack Query cache —
        // refresh so the new logo shows up there without a full reload.
        router.refresh();
      },
      onError: (error) => {
        toast.show({ label: error.message, tone: 'danger' });
      },
    });
  }

  function handleSave() {
    save.mutate(
      {
        legalName: draft.legalEntityName,
        sector: draft.sector,
        languages: draft.languages,
        dpoEmployeeId: draft.dpoId ?? null,
      },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast.show({ label: t.toastSaved, tone: 'success' });
        },
        onError: (error) => {
          toast.show({ label: error.message, tone: 'danger' });
        },
      },
    );
  }

  return (
    <>
      <WorkspacePanel
        state={draft}
        onChange={handleChange}
        people={people}
        tenantAddress={tenantAddress}
        t={t}
        isUploadingLogo={uploadLogo.isPending}
        onLogoFileSelected={handleLogoFileSelected}
      />
      <div className="flex items-center justify-between gap-4">
        <Text size="xs" tone="muted" isMono className="tracking-wide uppercase">
          {t.footerHint}
        </Text>
        <Button
          tone="brand"
          size="sm"
          isDisabled={!isDirty || save.isPending}
          startSlot={<Check className="size-4" />}
          onClick={handleSave}
        >
          {t.saveWorkspaceCta}
        </Button>
      </div>
    </>
  );
}

export function WorkspaceSettingsPanel({
  tenantAddress,
  t,
}: {
  tenantAddress: string;
  t: SettingsMessages;
}) {
  const { data, isLoading, isError } = useWorkspaceSettings();

  if (isLoading) {
    return <WorkspacePanelSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        label={t.comingSoonTitle}
        description={t.comingSoonDescription}
        variant="outline"
      />
    );
  }

  // Remounts the editor (resetting its local draft) whenever the server value
  // for a Save-persisted field actually changes underneath it — not on every
  // parent render, and not for a logo upload (see persistedFieldsKey above).
  return (
    <WorkspaceEditor
      key={persistedFieldsKey(data)}
      initial={data}
      tenantAddress={tenantAddress}
      t={t}
    />
  );
}
