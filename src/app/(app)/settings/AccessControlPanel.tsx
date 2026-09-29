'use client';

/**
 * Configuration Studio "Access control" panel — role picker, permission matrix,
 * "Set all" quick actions, create-custom-role, duplicate-role.
 *
 * Wired to `/api/settings/access-control` via `useAccessControl()` /
 * `useAccessControlMutation()` (TanStack Query, docs/TANSTACK_QUERY.md). The
 * module list, role list and every permission level are server state now —
 * there is no local draft to save; every change writes through immediately
 * and the mutation's `onSuccess` replaces the cached query data, so a reload
 * shows exactly what was just set.
 *
 * Module keys returned by the API are identical to the mock's `ModuleKey`
 * union (see db/seed/0001_module_permission_catalog.sql's header comment), so
 * the icon/label lookup tables below stay keyed the same way they always
 * were — copy is still entirely i18n-driven via `SettingsMessages`, never
 * hardcoded, per CLAUDE.md.
 */
import { useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Database,
  FileText,
  Globe2,
  GraduationCap,
  Handshake,
  Inbox,
  Laptop,
  LayoutDashboard,
  ListChecks,
  Lock,
  Map as MapIcon,
  Network,
  Plug,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Trash2,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { IconButton } from '@atoms/IconButton';
import { Input } from '@atoms/Input';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { Field } from '@molecules/Field';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import { PeoplePicker, type PersonOption } from '@molecules/PeoplePicker';
import {
  SegmentedControl,
  type SegmentedControlItem,
  type SegmentedControlTone,
} from '@molecules/SegmentedControl';
import {
  useAccessControl,
  useAccessControlMutation,
  useToast,
  type AccessControlModule,
  type AccessControlRole,
  type PermissionLevel,
} from '@shared/hooks';
import type { ModuleGroupKey, ModuleKey } from '@shared/mock/access-control';
import type { SettingsMessages } from './SettingsMessages';

const PERMISSION_LEVELS: readonly PermissionLevel[] = ['none', 'view', 'edit', 'approve'];
/** The loading skeleton's disabled controls still need a handler to satisfy their type. */
const NOOP = () => {
  /* disabled during loading */
};

const MODULE_LABEL_KEYS: Record<ModuleKey, keyof SettingsMessages> = {
  dashboard: 'moduleDashboard',
  gap: 'navGap',
  sources: 'navSources',
  datamap: 'navDatamap',
  endpoints: 'navEndpoints',
  collection: 'moduleCollection',
  ropa: 'navRopa',
  notices: 'navNotices',
  consent: 'navConsent',
  dsr: 'navDsr',
  breach: 'navBreach',
  transfers: 'navTransfers',
  thirdparty: 'navThirdparty',
  controls: 'navControls',
  dpia: 'moduleDpia',
  risks: 'navRisks',
  actions: 'navActions',
  issues: 'moduleIssues',
  employees: 'moduleEmployees',
  academy: 'moduleAcademy',
  settings: 'moduleSettings',
};

const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  gap: ClipboardCheck,
  sources: Plug,
  datamap: MapIcon,
  endpoints: Laptop,
  collection: Database,
  ropa: Network,
  notices: FileText,
  consent: CheckSquare,
  dsr: Inbox,
  breach: Siren,
  transfers: Globe2,
  thirdparty: Handshake,
  controls: ShieldCheck,
  dpia: ClipboardList,
  risks: ShieldAlert,
  actions: ListChecks,
  issues: AlertTriangle,
  employees: Users,
  academy: GraduationCap,
  settings: Settings,
};

const GROUP_LABEL_KEYS: Record<ModuleGroupKey, keyof SettingsMessages> = {
  overview: 'groupOverview',
  dataDiscovery: 'groupDataDiscovery',
  dataFoundation: 'groupDataFoundation',
  privacyOperations: 'groupPrivacyOperations',
  governance: 'groupGovernance',
  peopleAwareness: 'groupPeopleAwareness',
  administration: 'groupAdministration',
};

const LEVEL_LABEL_KEYS: Record<PermissionLevel, keyof SettingsMessages> = {
  none: 'levelNone',
  view: 'levelView',
  edit: 'levelEdit',
  approve: 'levelApprove',
};

/**
 * Permission levels are an ORDERED SEVERITY, not four unrelated categories —
 * "Approve" already implies "Edit" implies "View" (see `t.levelHierarchyHint`
 * below). Both the summary badges and the per-module segmented control read
 * that ordering as one intensity ramp: muted/outline for the low end, solid
 * brand for the high end — never an arbitrary multi-hue palette (info/warning/
 * success) that would suggest four unrelated states instead of four rungs.
 */
const LEVEL_BADGE: Record<
  PermissionLevel,
  { variant: 'solid' | 'soft' | 'outline'; tone: 'neutral' | 'brand' | 'inverse' }
> = {
  none: { variant: 'soft', tone: 'neutral' },
  view: { variant: 'outline', tone: 'neutral' },
  edit: { variant: 'soft', tone: 'brand' },
  // Matches the prototype's exact `.rl-sum .a{background:forest;color:lime}` —
  // the same `bg-bg-inverse`/`text-accent-solid` pairing the segmented
  // control's own `inverse` tone uses for this same rung.
  approve: { variant: 'solid', tone: 'inverse' },
};

const LEVEL_SEGMENT_TONE: Record<PermissionLevel, SegmentedControlTone> = {
  none: 'muted',
  view: 'surface',
  edit: 'brand',
  approve: 'inverse',
};

function moduleLabel(t: SettingsMessages, moduleKey: string): string {
  const key = MODULE_LABEL_KEYS[moduleKey as ModuleKey] as keyof SettingsMessages | undefined;
  return key ? t[key] : moduleKey;
}

function groupLabel(t: SettingsMessages, groupKey: string): string {
  const key = GROUP_LABEL_KEYS[groupKey as ModuleGroupKey] as keyof SettingsMessages | undefined;
  return key ? t[key] : groupKey;
}

function countByLevel(
  modules: readonly AccessControlModule[],
  permissions: Record<string, PermissionLevel>,
): Record<PermissionLevel, number> {
  const counts: Record<PermissionLevel, number> = { none: 0, view: 0, edit: 0, approve: 0 };
  for (const mod of modules) counts[permissions[mod.key] ?? 'none'] += 1;
  return counts;
}

/** Row count for the loading skeleton — enough to suggest a full module list. */
const SKELETON_ROW_COUNT = 10;

function RoleSummary({
  t,
  modules,
  permissions,
}: {
  t: SettingsMessages;
  modules: readonly AccessControlModule[];
  permissions: Record<string, PermissionLevel>;
}) {
  const counts = countByLevel(modules, permissions);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(['approve', 'edit', 'view', 'none'] as const).map((level) => (
        <Badge key={level} size="sm" {...LEVEL_BADGE[level]}>
          {counts[level]} {t[LEVEL_LABEL_KEYS[level]]}
        </Badge>
      ))}
    </div>
  );
}

function QuickSetBar({
  t,
  isDisabled,
  onSetAll,
}: {
  t: SettingsMessages;
  isDisabled: boolean;
  onSetAll: (level: PermissionLevel) => void;
}) {
  return (
    <div className="border-border-default flex flex-wrap items-center gap-2 border-b pb-3">
      <Text size="xs" tone="muted" isMono className="tracking-wide uppercase">
        {t.setAllLabel}
      </Text>
      {PERMISSION_LEVELS.map((level) => (
        <Button
          key={level}
          size="xs"
          variant="outline"
          isDisabled={isDisabled}
          onClick={() => {
            onSetAll(level);
          }}
        >
          {t[LEVEL_LABEL_KEYS[level]]}
        </Button>
      ))}
      <Text size="2xs" tone="muted" isMono className="ms-auto tracking-wide uppercase">
        {t.levelHierarchyHint}
      </Text>
    </div>
  );
}

function PermissionRow({
  t,
  mod,
  showGroup,
  level,
  isDisabled,
  onChange,
}: {
  t: SettingsMessages;
  mod: AccessControlModule;
  showGroup: string | undefined;
  level: PermissionLevel;
  isDisabled: boolean;
  onChange: (level: PermissionLevel) => void;
}) {
  const items: SegmentedControlItem[] = PERMISSION_LEVELS.map((value) => ({
    value,
    label: t[LEVEL_LABEL_KEYS[value]],
    tone: LEVEL_SEGMENT_TONE[value],
  }));
  const Icon = (MODULE_ICONS[mod.key as ModuleKey] as LucideIcon | undefined) ?? Settings;
  const label = moduleLabel(t, mod.key);

  return (
    <>
      {showGroup !== undefined && (
        <Text
          as="div"
          size="2xs"
          tone="muted"
          isMono
          className="col-span-2 pt-4 pb-1.5 tracking-widest uppercase first:pt-0"
        >
          {groupLabel(t, showGroup)}
        </Text>
      )}
      <div className="border-border-default flex items-center justify-between gap-3 border-b py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon aria-hidden className="text-fg-subtle size-4 shrink-0" />
          <Text size="sm" weight="medium" className="min-w-0 truncate">
            {label}
          </Text>
        </div>
        <SegmentedControl
          label={label}
          items={items}
          value={level}
          onValueChange={(value) => {
            onChange(value as PermissionLevel);
          }}
          size="sm"
          isDisabled={isDisabled}
          className="shrink-0"
        />
      </div>
    </>
  );
}

function withGroupHeaders(
  modules: readonly AccessControlModule[],
): readonly { mod: AccessControlModule; showGroup: string | undefined }[] {
  return modules.reduce<{ mod: AccessControlModule; showGroup: string | undefined }[]>(
    (rows, mod) => {
      const previousGroup = rows.at(-1)?.mod.groupKey;
      rows.push({ mod, showGroup: mod.groupKey === previousGroup ? undefined : mod.groupKey });
      return rows;
    },
    [],
  );
}

function PermissionRows({
  t,
  modules,
  permissions,
  isDisabled,
  onChange,
}: {
  t: SettingsMessages;
  modules: readonly AccessControlModule[];
  permissions: Record<string, PermissionLevel>;
  isDisabled: boolean;
  onChange: (moduleKey: string, level: PermissionLevel) => void;
}) {
  const rows = withGroupHeaders(modules);
  return (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {rows.map((row) => (
        <PermissionRow
          key={row.mod.key}
          t={t}
          mod={row.mod}
          showGroup={row.showGroup}
          level={permissions[row.mod.key] ?? 'none'}
          isDisabled={isDisabled}
          onChange={(level) => {
            onChange(row.mod.key, level);
          }}
        />
      ))}
    </div>
  );
}

/** One skeleton permission row, shaped like `PermissionRow` — a module icon
 * placeholder, a name bar, and a segmented-control-shaped bar — rather than a
 * generic full-width block. The real module list/order isn't known yet, so
 * this renders a fixed count ungrouped instead of guessing group headers. */
function PermissionRowSkeleton() {
  return (
    <div className="border-border-default flex items-center justify-between gap-3 border-b py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton shape="circle" className="size-4 shrink-0" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-7 w-56 shrink-0" />
    </div>
  );
}

function PermissionRowsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <PermissionRowSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Same role-picker bar, role card and permission matrix `AccessControlLoaded`
 * renders — with skeleton bars for the role name/description/module list
 * (unknown until the fetch returns) and real, disabled controls everywhere
 * the copy is static (`QuickSetBar`'s labels, the footer note), so the page
 * does not shift shape once data arrives.
 */
function AccessControlLoading({ t }: { t: SettingsMessages }) {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="bg-bg-subtle text-fg-muted grid size-9 shrink-0 place-items-center rounded-full"
          >
            <UserCog className="size-4" />
          </span>
          <Skeleton className="h-9 w-40" />
        </div>
        <Button variant="outline" size="sm" startSlot={<Plus className="size-4" />} isDisabled>
          {t.newRoleCta}
        </Button>
      </div>

      <Card variant="outline" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <IconButton label={t.duplicateRoleLabel} variant="outline" size="sm" isDisabled>
            <Copy className="size-4" />
          </IconButton>
        </div>

        <QuickSetBar t={t} isDisabled onSetAll={NOOP} />

        <PermissionRowsSkeleton />
      </Card>

      <Text size="xs" tone="muted" className="max-w-2xl">
        {t.accessFooterNote}
      </Text>
    </div>
  );
}

function RoleIdentity({
  t,
  role,
  onRename,
}: {
  t: SettingsMessages;
  role: AccessControlRole;
  onRename: (name: string) => void;
}) {
  // Keyed by `role.id` at the call site (RoleEditorCard) so switching roles
  // remounts this component instead of syncing local state via an effect.
  const [draftName, setDraftName] = useState(role.name);

  return (
    <div className="flex flex-col gap-1">
      {role.isSystem ? (
        <Text as="div" weight="semibold" size="lg" className="flex items-center gap-1.5">
          {role.name}
          {/* Decorative — `role.description` already states the lock in prose
              (e.g. "Cannot be edited down"), so the icon needs no name of its own. */}
          {role.isLocked && <Lock aria-hidden className="text-fg-subtle size-3.5 shrink-0" />}
        </Text>
      ) : (
        <Input
          value={draftName}
          onChange={(event) => {
            setDraftName(event.target.value);
          }}
          onBlur={() => {
            const trimmed = draftName.trim();
            if (trimmed.length > 0 && trimmed !== role.name) onRename(trimmed);
            else setDraftName(role.name);
          }}
          aria-label={t.newRoleCta}
          isDisabled={role.isLocked}
          className="w-64"
        />
      )}
      <Text size="sm" tone="muted" className="max-w-md">
        {role.description}
      </Text>
    </div>
  );
}

/** First letter of up to the first two words of a role name — "DPO" -> "DP". */
function roleInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

function RolePickerBar({
  t,
  roles,
  selectedId,
  onSelect,
  onAddRole,
}: {
  t: SettingsMessages;
  roles: readonly AccessControlRole[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddRole: () => void;
}) {
  const rolePeople: PersonOption[] = roles.map((role) => ({
    id: role.id,
    name: role.name,
    initials: roleInitials(role.name),
    detail: role.isSystem ? t.roleTypeLabel : t.customRoleTypeLabel,
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <PeoplePicker
        label={t.accessTitle}
        isLabelVisible={false}
        people={rolePeople}
        value={selectedId}
        onValueChange={(id) => {
          if (id !== undefined) onSelect(id);
        }}
        variant="trigger"
        messages={{
          searchPlaceholder: t.rolePickerSearchPlaceholder,
          footerLabel: t.rolePickerFooterLabel,
          noResults: t.rolePickerNoResults,
        }}
        className="w-full max-w-xs"
      />
      <Button
        variant="outline"
        size="sm"
        startSlot={<Plus className="size-4" />}
        onClick={onAddRole}
      >
        {t.newRoleCta}
      </Button>
    </div>
  );
}

function NewRoleForm({
  t,
  roleOptions,
  isSubmitting,
  onCancel,
  onCreate,
}: {
  t: SettingsMessages;
  roleOptions: ListboxOption[];
  isSubmitting: boolean;
  onCancel: () => void;
  onCreate: (name: string, startFromId: string) => void;
}) {
  const [name, setName] = useState('');
  const [startFromId, setStartFromId] = useState(roleOptions[0]?.value ?? '');
  const toast = useToast();

  function handleCreate() {
    if (name.trim() === '') {
      toast.show({ label: t.toastRoleNameRequired, tone: 'warning' });
      return;
    }
    onCreate(name.trim(), startFromId);
  }

  return (
    <Card
      variant="outline"
      className="border-brand-solid flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <Field label={t.newRoleNameFieldLabel} className="flex-1">
        {(control) => (
          <Input
            {...control}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            placeholder={t.newRoleNamePlaceholder}
            fullWidth
          />
        )}
      </Field>
      <Listbox
        label={t.startFromLabel}
        options={roleOptions}
        value={startFromId}
        onValueChange={setStartFromId}
      />
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
          {t.cancelCta}
        </Button>
        <Button
          tone="brand"
          startSlot={<Plus className="size-4" />}
          onClick={handleCreate}
          isDisabled={isSubmitting}
        >
          {t.createRoleCta}
        </Button>
      </div>
    </Card>
  );
}

function RoleEditorCard({
  t,
  role,
  modules,
  onRename,
  onDuplicate,
  onDelete,
  onSetAll,
  onChangePermission,
}: {
  t: SettingsMessages;
  role: AccessControlRole;
  modules: readonly AccessControlModule[];
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetAll: (level: PermissionLevel) => void;
  onChangePermission: (moduleKey: string, level: PermissionLevel) => void;
}) {
  return (
    <Card variant="outline" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RoleIdentity key={role.id} t={t} role={role} onRename={onRename} />
        <div className="flex items-center gap-2">
          <RoleSummary t={t} modules={modules} permissions={role.permissions} />
          <IconButton
            label={t.duplicateRoleLabel}
            variant="outline"
            size="sm"
            onClick={onDuplicate}
          >
            <Copy className="size-4" />
          </IconButton>
          {/* System roles stay — the service rejects a delete on one server-side too. */}
          {!role.isSystem && (
            <IconButton
              label={t.deleteRoleLabel}
              variant="outline"
              tone="danger"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </IconButton>
          )}
        </div>
      </div>

      <QuickSetBar t={t} isDisabled={role.isLocked} onSetAll={onSetAll} />

      <PermissionRows
        t={t}
        modules={modules}
        permissions={role.permissions}
        isDisabled={role.isLocked}
        onChange={onChangePermission}
      />
    </Card>
  );
}

/** Shared by `onCreate`/`onDuplicate` — both land on the new role by name once it exists. */
function selectByName(
  result: { roles: AccessControlRole[] },
  name: string,
  onSelectRole: (id: string) => void,
) {
  const created = result.roles.find((role) => role.name === name);
  if (created) onSelectRole(created.id);
}

/** The two permission-level mutations — split out to keep the hook below under the line budget. */
function buildPermissionActions(
  mutation: ReturnType<typeof useAccessControlMutation>,
  toast: ReturnType<typeof useToast>,
  t: SettingsMessages,
  roleId: string,
  onError: (error: Error) => void,
) {
  return {
    onSetAll: (level: PermissionLevel) => {
      mutation.mutate(
        { kind: 'setAllPermissions', roleId, level },
        { onSuccess: () => undefined, onError },
      );
    },
    onChangePermission: (moduleKey: string, level: PermissionLevel) => {
      mutation.mutate(
        { kind: 'setPermission', roleId, moduleKey, level },
        {
          onSuccess: () => {
            toast.show({ label: t.toastPermissionUpdated, tone: 'success' });
          },
          onError,
        },
      );
    },
  };
}

/** Bundles every mutation the panel can fire, so the render function stays a layout. */
function useAccessControlActions(
  t: SettingsMessages,
  data: { roles: AccessControlRole[] },
  selectedRole: AccessControlRole,
  onSelectRole: (id: string) => void,
) {
  const mutation = useAccessControlMutation();
  const toast = useToast();

  function onError(error: Error) {
    toast.show({ label: error.message, tone: 'danger' });
  }

  return {
    isPending: mutation.isPending,
    onCreate: (name: string, startFromId: string, onDone: () => void) => {
      mutation.mutate(
        { kind: 'createRole', name, startFromRoleId: startFromId },
        {
          onSuccess: (result) => {
            selectByName(result, name, onSelectRole);
            onDone();
            toast.show({ label: t.toastRoleCreated.replace('{name}', name), tone: 'success' });
          },
          onError,
        },
      );
    },
    onRename: (name: string) => {
      mutation.mutate(
        { kind: 'renameRole', roleId: selectedRole.id, name },
        {
          onSuccess: () => {
            toast.show({ label: t.toastRoleRenamed, tone: 'success' });
          },
          onError,
        },
      );
    },
    onDuplicate: () => {
      const name = `${selectedRole.name} (${String(data.roles.length)})`;
      mutation.mutate(
        { kind: 'duplicateRole', roleId: selectedRole.id, name },
        {
          onSuccess: (result) => {
            selectByName(result, name, onSelectRole);
            toast.show({
              label: t.toastRoleDuplicated.replace('{name}', selectedRole.name),
              tone: 'success',
            });
          },
          onError,
        },
      );
    },
    ...buildPermissionActions(mutation, toast, t, selectedRole.id, onError),
    onDelete: () => {
      const deletedName = selectedRole.name;
      mutation.mutate(
        { kind: 'deleteRole', roleId: selectedRole.id },
        {
          onSuccess: (result) => {
            const fallback = result.roles[0];
            if (fallback) onSelectRole(fallback.id);
            toast.show({
              label: t.toastRoleDeleted.replace('{name}', deletedName),
              tone: 'success',
            });
          },
          onError,
        },
      );
    },
  };
}

function AccessControlLoaded({
  t,
  data,
  selectedRole,
  onSelectRole,
}: {
  t: SettingsMessages;
  data: { modules: AccessControlModule[]; roles: AccessControlRole[] };
  selectedRole: AccessControlRole;
  onSelectRole: (id: string) => void;
}) {
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const actions = useAccessControlActions(t, data, selectedRole, onSelectRole);
  const roleOptions: ListboxOption[] = data.roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  return (
    <div className="flex flex-col gap-4">
      <RolePickerBar
        t={t}
        roles={data.roles}
        selectedId={selectedRole.id}
        onSelect={onSelectRole}
        onAddRole={() => {
          setIsCreatingRole(true);
        }}
      />

      {isCreatingRole && (
        <NewRoleForm
          t={t}
          roleOptions={roleOptions}
          isSubmitting={actions.isPending}
          onCancel={() => {
            setIsCreatingRole(false);
          }}
          onCreate={(name, startFromId) => {
            actions.onCreate(name, startFromId, () => {
              setIsCreatingRole(false);
            });
          }}
        />
      )}

      <RoleEditorCard
        t={t}
        role={selectedRole}
        modules={data.modules}
        onRename={actions.onRename}
        onDuplicate={actions.onDuplicate}
        onDelete={actions.onDelete}
        onSetAll={actions.onSetAll}
        onChangePermission={actions.onChangePermission}
      />

      <Text size="xs" tone="muted" className="max-w-2xl">
        {t.accessFooterNote}
      </Text>
    </div>
  );
}

export function AccessControlPanel({ t }: { t: SettingsMessages }) {
  const { data, isLoading, isError } = useAccessControl();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  if (isLoading) {
    return <AccessControlLoading t={t} />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        label={t.accessLoadErrorTitle}
        description={t.accessLoadErrorDescription}
        variant="outline"
      />
    );
  }

  // Derived, not synced via an effect: falls back to the first role whenever
  // `selectedId` is unset or no longer names a role in the latest data.
  const effectiveId =
    selectedId !== undefined && data.roles.some((role) => role.id === selectedId)
      ? selectedId
      : data.roles[0]?.id;
  const selectedRole = data.roles.find((role) => role.id === effectiveId);
  if (selectedRole === undefined) return null;

  return (
    <AccessControlLoaded
      t={t}
      data={data}
      selectedRole={selectedRole}
      onSelectRole={setSelectedId}
    />
  );
}
