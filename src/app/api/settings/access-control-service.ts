/**
 * Business rules for the Configuration Studio "Access control" panel.
 *
 * Owns the one real policy decision this panel needs: translating between the
 * UI's simplified 4-level-per-module model (`none < view < edit < approve`,
 * one choice per module) and the database's fine-grained catalog (several
 * discrete `permission` rows per module — view/create/edit/delete/approve/
 * export — each individually granted or not in `role_permission`). The route
 * and the UI never see a `permission_key`; they only ever see a level.
 *
 * **The level → actions mapping** (`LEVEL_ACTIONS` below) is a policy call,
 * not something derivable from the schema:
 *   - `none`    grants nothing.
 *   - `view`    grants read-only access — the `view` action alone.
 *   - `edit`    grants full day-to-day CRUD (`view`, `create`, `edit`,
 *               `delete`) but withholds sign-off and bulk export — those are
 *               reserved for a role trusted with `approve`.
 *   - `approve` grants everything the catalog defines for that module,
 *               including `approve` and `export`.
 * This mirrors `DEFAULT_LEVEL_ACTIONS` in
 * tooling/scripts/lib/access-control-seed.ts exactly — the two must be kept
 * in sync, since one seeds the starting data and the other reads/writes it.
 *
 * **Deriving a level from stored grants** (`levelFromGrants`) is lossy by
 * design: `role_permission` can hold any subset of actions, but the UI can
 * only display one of four buckets. The rule is "the highest level whose full
 * action set is granted"; a grant pattern that fits no clean level (e.g. only
 * `delete` granted, without `view`) falls back to the nearest lower level
 * rather than erroring — this is a many-rows-collapsed-to-one-dropdown UI,
 * and losing an unusual combination on display is an accepted trade, not a
 * bug.
 *
 * Every read and write runs inside one `withWorkspace()` transaction, so a
 * role rename and its permission grants commit or fail together.
 */
import { withWorkspace, type WorkspaceContext, type WorkspaceTx } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import {
  deleteRole as deleteRoleRow,
  findRole,
  insertRole,
  listAllRolePermissions,
  listModuleCatalog,
  listPermissionCatalog,
  listRoles,
  replaceRolePermissions,
  roleNameExists,
  updateRoleName,
  type ModuleCatalogRow,
} from './repository';

export type PermissionLevel = 'none' | 'view' | 'edit' | 'approve';

/** Checked from lowest to highest — see the module doc comment above. */
export const PERMISSION_LEVELS: readonly PermissionLevel[] = ['none', 'view', 'edit', 'approve'];

/** Which `permission.action` values each level grants. Keep in sync with the seed script. */
export const LEVEL_ACTIONS: Record<PermissionLevel, readonly string[]> = {
  none: [],
  view: ['view'],
  edit: ['view', 'create', 'edit', 'delete'],
  approve: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
};

const MAX_ROLE_NAME_LENGTH = 100;
const MAX_ROLE_DESCRIPTION_LENGTH = 500;

/** One module row as the panel renders it. */
export type AccessControlModule = {
  key: string;
  groupKey: string;
  name: string;
  icon: string;
};

/** One role as the panel renders it. */
export type AccessControlRole = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isLocked: boolean;
  permissions: Record<string, PermissionLevel>;
};

export type AccessControlData = {
  modules: AccessControlModule[];
  roles: AccessControlRole[];
};

export type AccessControlMutationError =
  'VALIDATION_FAILED' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN';

/** Derives the displayed level for one module from which of its actions are granted. */
function levelFromGrants(
  moduleActions: readonly string[],
  grantedActions: Set<string>,
): PermissionLevel {
  let best: PermissionLevel = 'none';
  for (const level of PERMISSION_LEVELS) {
    const required = LEVEL_ACTIONS[level].filter((action) => moduleActions.includes(action));
    const satisfied = required.length > 0 && required.every((action) => grantedActions.has(action));
    if (level === 'none' || satisfied) best = level;
  }
  return best;
}

/** Concrete permission keys a level grants for one module, from the real catalog rows. */
function permissionKeysForLevel(
  modulePermissions: readonly { key: string; action: string }[],
  level: PermissionLevel,
): Set<string> {
  const actions = new Set(LEVEL_ACTIONS[level]);
  return new Set(modulePermissions.filter((p) => actions.has(p.action)).map((p) => p.key));
}

async function readAccessControl(tx: WorkspaceTx): Promise<AccessControlData> {
  const [moduleRows, permissionRows, roleRows, grantRows] = await Promise.all([
    listModuleCatalog(),
    listPermissionCatalog(),
    listRoles(tx),
    listAllRolePermissions(tx),
  ]);

  const permissionsByModule = new Map<string, { key: string; action: string }[]>();
  for (const p of permissionRows) {
    const list = permissionsByModule.get(p.moduleKey) ?? [];
    list.push({ key: p.key, action: p.action });
    permissionsByModule.set(p.moduleKey, list);
  }

  const grantsByRole = new Map<string, Set<string>>();
  for (const grant of grantRows) {
    if (!grant.isGranted) continue;
    const set = grantsByRole.get(grant.roleId) ?? new Set<string>();
    set.add(grant.permissionKey);
    grantsByRole.set(grant.roleId, set);
  }

  const roles: AccessControlRole[] = roleRows.map((r) => {
    const granted = grantsByRole.get(r.id) ?? new Set<string>();
    const permissions: Record<string, PermissionLevel> = {};
    for (const mod of moduleRows) {
      const modulePermissions = permissionsByModule.get(mod.key) ?? [];
      const grantedActions = new Set(
        modulePermissions.filter((p) => granted.has(p.key)).map((p) => p.action),
      );
      permissions[mod.key] = levelFromGrants(
        modulePermissions.map((p) => p.action),
        grantedActions,
      );
    }
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      isLocked: r.isLocked,
      permissions,
    };
  });

  return {
    modules: moduleRows.map((mod: ModuleCatalogRow) => ({
      key: mod.key,
      groupKey: mod.groupKey,
      name: mod.name,
      icon: mod.icon,
    })),
    roles,
  };
}

/** Current catalog + every role, resolved to the level the panel renders. */
export async function getAccessControl(ctx: WorkspaceContext): Promise<AccessControlData> {
  return withWorkspace(ctx, (tx) => readAccessControl(tx));
}

/** Writes every permission key for one role, computed from a level-per-module map. */
async function applyPermissions(
  roleId: string,
  permissions: Readonly<Record<string, PermissionLevel>>,
  tx: WorkspaceTx,
): Promise<void> {
  const permissionRows = await listPermissionCatalog();
  const permissionsByModule = new Map<string, { key: string; action: string }[]>();
  for (const p of permissionRows) {
    const list = permissionsByModule.get(p.moduleKey) ?? [];
    list.push({ key: p.key, action: p.action });
    permissionsByModule.set(p.moduleKey, list);
  }

  const grants: { permissionKey: string; isGranted: boolean }[] = [];
  for (const [moduleKey, level] of Object.entries(permissions)) {
    const modulePermissions = permissionsByModule.get(moduleKey) ?? [];
    const grantedKeys = permissionKeysForLevel(modulePermissions, level);
    for (const p of modulePermissions) {
      grants.push({ permissionKey: p.key, isGranted: grantedKeys.has(p.key) });
    }
  }
  await replaceRolePermissions(roleId, grants, tx);
}

function validateRoleName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_ROLE_NAME_LENGTH) return null;
  return trimmed;
}

export type CreateRoleInput = {
  name: string;
  description?: string;
  /** An existing role's permissions to start from. Omitted starts from every module at 'view'. */
  startFromRoleId?: string;
};

/** Creates a custom (never system, never locked) role. */
export async function createRole(
  ctx: WorkspaceContext,
  input: CreateRoleInput,
): Promise<Result<AccessControlData, AccessControlMutationError>> {
  const name = validateRoleName(input.name);
  if (name === null) return err('VALIDATION_FAILED');
  const description = (input.description ?? '').slice(0, MAX_ROLE_DESCRIPTION_LENGTH);

  return withWorkspace(ctx, async (tx) => {
    if (await roleNameExists(name, tx)) return err('CONFLICT');

    const startFrom =
      input.startFromRoleId !== undefined ? await findRole(input.startFromRoleId, tx) : null;
    if (input.startFromRoleId !== undefined && startFrom === null) return err('NOT_FOUND');

    const roleId = await insertRole({ name, description, isLocked: false }, tx);

    if (startFrom !== null) {
      const source = await readAccessControl(tx);
      const sourceRole = source.roles.find((r) => r.id === startFrom.id);
      if (sourceRole !== undefined) {
        await applyPermissions(roleId, sourceRole.permissions, tx);
      }
    } else {
      const catalog = await readAccessControl(tx);
      const viewAll: Record<string, PermissionLevel> = {};
      for (const mod of catalog.modules) viewAll[mod.key] = 'view';
      await applyPermissions(roleId, viewAll, tx);
    }

    return ok(await readAccessControl(tx));
  });
}

/** Duplicates an existing role verbatim (permissions included) under a new name. */
export async function duplicateRole(
  ctx: WorkspaceContext,
  roleId: string,
  newName: string,
): Promise<Result<AccessControlData, AccessControlMutationError>> {
  return createRole(ctx, { name: newName, startFromRoleId: roleId });
}

/** Renames a role. Locked roles (Admin) may not be renamed either. */
export async function renameRole(
  ctx: WorkspaceContext,
  roleId: string,
  name: string,
): Promise<Result<AccessControlData, AccessControlMutationError>> {
  const clean = validateRoleName(name);
  if (clean === null) return err('VALIDATION_FAILED');

  return withWorkspace(ctx, async (tx) => {
    const existing = await findRole(roleId, tx);
    if (existing === null) return err('NOT_FOUND');
    if (existing.isLocked) return err('FORBIDDEN');
    if (existing.name !== clean && (await roleNameExists(clean, tx))) return err('CONFLICT');

    await updateRoleName(roleId, clean, tx);
    return ok(await readAccessControl(tx));
  });
}

/**
 * Sets one module's level for one role. Rejected server-side — not just
 * disabled in the UI — when the role is locked (Admin): a raw request against
 * a locked role must fail exactly like the panel's disabled control implies.
 */
export async function setRolePermission(
  ctx: WorkspaceContext,
  roleId: string,
  moduleKey: string,
  level: PermissionLevel,
): Promise<Result<AccessControlData, AccessControlMutationError>> {
  return withWorkspace(ctx, async (tx) => {
    const existing = await findRole(roleId, tx);
    if (existing === null) return err('NOT_FOUND');
    if (existing.isLocked) return err('FORBIDDEN');

    const current = await readAccessControl(tx);
    const role = current.roles.find((r) => r.id === roleId);
    if (role === undefined) return err('NOT_FOUND');
    if (!current.modules.some((m) => m.key === moduleKey)) return err('VALIDATION_FAILED');

    await applyPermissions(roleId, { ...role.permissions, [moduleKey]: level }, tx);
    return ok(await readAccessControl(tx));
  });
}

/**
 * Deletes a custom role. System roles (Admin, DPO, the other seven shipped
 * roles) are never deletable — rejected server-side, not just hidden behind
 * the panel's own missing delete button — since `insertRole` never sets
 * `isSystem`, this is really "only a role someone created can be deleted."
 * No member-role reassignment happens here: that table doesn't exist yet
 * (see the module doc comment on `../CLAUDE.md` — "arrives with the user
 * directory"), so there is nothing else to cascade beyond `role_permission`.
 */
export async function deleteRole(
  ctx: WorkspaceContext,
  roleId: string,
): Promise<Result<AccessControlData, AccessControlMutationError>> {
  return withWorkspace(ctx, async (tx) => {
    const existing = await findRole(roleId, tx);
    if (existing === null) return err('NOT_FOUND');
    if (existing.isSystem) return err('FORBIDDEN');

    await deleteRoleRow(roleId, tx);
    return ok(await readAccessControl(tx));
  });
}

/** Sets every module to the same level for one role — the panel's "Set all" quick action. */
export async function setAllPermissions(
  ctx: WorkspaceContext,
  roleId: string,
  level: PermissionLevel,
): Promise<Result<AccessControlData, AccessControlMutationError>> {
  return withWorkspace(ctx, async (tx) => {
    const existing = await findRole(roleId, tx);
    if (existing === null) return err('NOT_FOUND');
    if (existing.isLocked) return err('FORBIDDEN');

    const current = await readAccessControl(tx);
    const permissions: Record<string, PermissionLevel> = {};
    for (const mod of current.modules) permissions[mod.key] = level;

    await applyPermissions(roleId, permissions, tx);
    return ok(await readAccessControl(tx));
  });
}
