/**
 * MOCK DATA — see the note in `workspace.ts`. Module list and the eight
 * system-role permission grids for Configuration Studio's Access control
 * section. Display copy (module/role names, descriptions) lives in
 * `settings.json` and is resolved by the caller — this file holds only keys,
 * grouping and the permission levels themselves.
 */

export type ModuleGroupKey =
  | 'overview'
  | 'dataDiscovery'
  | 'dataFoundation'
  | 'privacyOperations'
  | 'governance'
  | 'peopleAwareness'
  | 'administration';

export type ModuleKey =
  | 'dashboard'
  | 'gap'
  | 'sources'
  | 'datamap'
  | 'endpoints'
  | 'collection'
  | 'ropa'
  | 'notices'
  | 'consent'
  | 'dsr'
  | 'breach'
  | 'transfers'
  | 'thirdparty'
  | 'controls'
  | 'dpia'
  | 'risks'
  | 'actions'
  | 'issues'
  | 'employees'
  | 'academy'
  | 'settings';

/** Order matches the prototype's `CS_MODS` exactly — group headers stay attached to the row after them. */
export const MODULES: readonly { key: ModuleKey; group: ModuleGroupKey }[] = [
  { key: 'dashboard', group: 'overview' },
  { key: 'gap', group: 'overview' },
  { key: 'sources', group: 'dataDiscovery' },
  { key: 'datamap', group: 'dataDiscovery' },
  { key: 'endpoints', group: 'dataDiscovery' },
  { key: 'collection', group: 'dataFoundation' },
  { key: 'ropa', group: 'dataFoundation' },
  { key: 'notices', group: 'privacyOperations' },
  { key: 'consent', group: 'privacyOperations' },
  { key: 'dsr', group: 'privacyOperations' },
  { key: 'breach', group: 'privacyOperations' },
  { key: 'transfers', group: 'privacyOperations' },
  { key: 'thirdparty', group: 'governance' },
  { key: 'controls', group: 'governance' },
  { key: 'dpia', group: 'governance' },
  { key: 'risks', group: 'governance' },
  { key: 'actions', group: 'governance' },
  { key: 'issues', group: 'governance' },
  { key: 'employees', group: 'peopleAwareness' },
  { key: 'academy', group: 'peopleAwareness' },
  { key: 'settings', group: 'administration' },
];

export const MODULE_GROUP_ORDER: readonly ModuleGroupKey[] = [
  'overview',
  'dataDiscovery',
  'dataFoundation',
  'privacyOperations',
  'governance',
  'peopleAwareness',
  'administration',
];

export type PermissionLevel = 'none' | 'view' | 'edit' | 'approve';

export const PERMISSION_LEVELS: readonly PermissionLevel[] = ['none', 'view', 'edit', 'approve'];

export type RoleKey =
  'admin' | 'dpo' | 'compliance' | 'dsrOfficer' | 'legal' | 'auditor' | 'employee' | 'viewer';

export type Role = {
  key: RoleKey;
  /** Admin's grid can't be edited down from Approve — every other role can be. */
  isLocked: boolean;
  permissions: Readonly<Record<ModuleKey, PermissionLevel>>;
};

function permissions(
  base: PermissionLevel,
  overrides: Partial<Record<ModuleKey, PermissionLevel>> = {},
): Record<ModuleKey, PermissionLevel> {
  const result = {} as Record<ModuleKey, PermissionLevel>;
  for (const mod of MODULES) result[mod.key] = base;
  return { ...result, ...overrides };
}

/** Matches the prototype's `rlInit()` role grid exactly. */
export const SYSTEM_ROLES: readonly Role[] = [
  { key: 'admin', isLocked: true, permissions: permissions('approve') },
  {
    key: 'dpo',
    isLocked: false,
    permissions: permissions('approve', {
      dashboard: 'view',
      sources: 'view',
      datamap: 'edit',
      endpoints: 'view',
      collection: 'view',
      employees: 'view',
      academy: 'view',
      settings: 'view',
    }),
  },
  {
    key: 'compliance',
    isLocked: false,
    permissions: permissions('edit', {
      dashboard: 'view',
      endpoints: 'view',
      employees: 'view',
      settings: 'none',
    }),
  },
  {
    key: 'dsrOfficer',
    isLocked: false,
    permissions: permissions('none', {
      dashboard: 'view',
      datamap: 'view',
      ropa: 'view',
      notices: 'view',
      consent: 'view',
      dsr: 'approve',
      breach: 'view',
      actions: 'edit',
      issues: 'edit',
      academy: 'view',
    }),
  },
  {
    key: 'legal',
    isLocked: false,
    permissions: permissions('view', {
      sources: 'none',
      endpoints: 'none',
      collection: 'none',
      notices: 'edit',
      thirdparty: 'edit',
      employees: 'none',
      academy: 'none',
      settings: 'none',
    }),
  },
  { key: 'auditor', isLocked: false, permissions: permissions('view') },
  {
    key: 'employee',
    isLocked: false,
    permissions: permissions('none', { academy: 'edit', actions: 'edit' }),
  },
  {
    key: 'viewer',
    isLocked: false,
    permissions: permissions('view', { settings: 'none' }),
  },
];
