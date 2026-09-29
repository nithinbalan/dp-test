/**
 * Pure data access for the settings module.
 *
 * One function per query, no business rules — a sector allowlist, a "which language
 * is the base one" decision or a DPO-must-exist check belongs in `service.ts`.
 * See docs/ARCHITECTURE.md "Layering (server)".
 *
 * Two kinds of query live here, and the difference matters:
 *
 *   · TENANT data (`workspace_profile`, `workspace_language`, `employee`) takes a
 *     {@link WorkspaceTx} as its last parameter. It never opens its own connection —
 *     the service opens one with `withWorkspace()` so several of these commit or
 *     fail together. See docs/WORKSPACE_ISOLATION.md §5.
 *   · PLATFORM data (`public.workspace`) takes a `PlatformExecutor`. The registry row
 *     is control-plane, not tenant data, and is always addressed by the workspace id
 *     the verified context carries — never by a slug or anything from a request body.
 */
import { and, asc, eq, isNull, notInArray, sql } from 'drizzle-orm';
import {
  attachment,
  employee,
  moduleCatalog,
  permission,
  platformDb,
  role,
  rolePermission,
  workspace,
  workspaceLanguage,
  workspaceProfile,
  type AttachmentScanStatus,
  type PlatformExecutor,
} from '@server/db';
import { AppError } from '@server/errors';
import type { WorkspaceTx } from '@server/workspace';
import type { WorkspaceId } from '@shared/types';

/** The workspace_profile columns the Configuration Studio "Workspace" panel owns. */
export type WorkspaceProfileRow = {
  legalName: string;
  sectorKey: string;
  dpoEmployeeId: string | null;
  publishDpoContact: boolean;
  logoAttachmentId: string | null;
};

/** An employee offered as the published DPO contact. */
export type EmployeeOptionRow = {
  id: string;
  fullName: string;
  designation: string | null;
  workEmail: string | null;
};

/** The registry row's display fields. Read-only apart from {@link updateRegistryLegalName}. */
export type WorkspaceRegistryRow = {
  legalName: string;
  sectorKey: string | null;
};

const profileColumns = {
  legalName: workspaceProfile.legalName,
  sectorKey: workspaceProfile.sectorKey,
  dpoEmployeeId: workspaceProfile.dpoEmployeeId,
  publishDpoContact: workspaceProfile.publishDpoContact,
  logoAttachmentId: workspaceProfile.logoAttachmentId,
};

/** The singleton profile row, or null when the workspace has never saved one. */
export async function findWorkspaceProfile(tx: WorkspaceTx): Promise<WorkspaceProfileRow | null> {
  const rows = await tx.db.select(profileColumns).from(workspaceProfile).limit(1);
  return rows[0] ?? null;
}

/**
 * Writes the singleton profile row, creating it on first save. `id` is a boolean
 * fixed to `true`, so the conflict target is the one row that can ever exist.
 */
export async function upsertWorkspaceProfile(
  values: Omit<WorkspaceProfileRow, 'logoAttachmentId'>,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db
    .insert(workspaceProfile)
    .values(values)
    .onConflictDoUpdate({
      target: workspaceProfile.id,
      set: { ...values, updatedAt: new Date() },
    });
}

/**
 * Points the profile's logo at an attachment already inserted in this same
 * transaction. Requires the profile row to already exist — `saveWorkspaceSettings`
 * (or the registry-seeded default `readSettings` falls back to) always creates it
 * before a logo can be uploaded, so this is an UPDATE, never an upsert.
 */
export async function setWorkspaceLogoAttachment(
  logoAttachmentId: string,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db
    .update(workspaceProfile)
    .set({ logoAttachmentId, updatedAt: new Date() })
    .where(eq(workspaceProfile.id, true));
}

/** One freshly-inserted attachment row's id. */
export type NewAttachmentInput = {
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: Buffer;
  scanStatus: AttachmentScanStatus;
};

/** Records an uploaded file. Scanning happens out of band; rows start `pending`. */
export async function insertAttachment(
  values: NewAttachmentInput,
  tx: WorkspaceTx,
): Promise<string> {
  const rows = await tx.db.insert(attachment).values(values).returning({ id: attachment.id });
  const id = rows[0]?.id;
  if (id === undefined) {
    // Unreachable in practice — insert().returning() always returns the row it just wrote.
    throw new AppError({ code: 'DB_QUERY_FAILED', message: 'attachment insert returned no id' });
  }
  return id;
}

/** One attachment's storage key and mime type, for streaming it back out. */
export type AttachmentFileRow = { storageKey: string; mimeType: string; filename: string };

/** The stored file behind an attachment id, or null if it does not exist in THIS workspace. */
export async function findAttachmentFile(
  attachmentId: string,
  tx: WorkspaceTx,
): Promise<AttachmentFileRow | null> {
  const rows = await tx.db
    .select({
      storageKey: attachment.storageKey,
      mimeType: attachment.mimeType,
      filename: attachment.filename,
    })
    .from(attachment)
    .where(and(eq(attachment.id, attachmentId), isNull(attachment.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Keeps the registry's servable logo URL in step with the profile the workspace just
 * saved — the same convenience copy `updateRegistryLegalName` keeps for the name, and
 * for the same reason: the topbar and sidebar render from the session/registry path,
 * never a tenant transaction.
 */
export async function updateRegistryLogoUrl(
  workspaceId: WorkspaceId,
  logoUrl: string,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db
    .update(workspace)
    .set({ logoUrl, updatedAt: new Date() })
    .where(eq(workspace.id, workspaceId));
}

/** Every language code this workspace publishes in. */
export async function listWorkspaceLanguages(tx: WorkspaceTx): Promise<string[]> {
  const rows = await tx.db.select({ code: workspaceLanguage.code }).from(workspaceLanguage);
  return rows.map((row) => row.code);
}

/**
 * Makes the enabled set exactly `codes`, with `baseCode` as the single base language.
 * Removals happen before inserts so the partial unique index on `is_base` never sees
 * two base rows mid-statement.
 */
export async function replaceWorkspaceLanguages(
  codes: readonly string[],
  baseCode: string,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.delete(workspaceLanguage).where(notInArray(workspaceLanguage.code, [...codes]));
  await tx.db
    .insert(workspaceLanguage)
    .values(codes.map((code) => ({ code, isBase: code === baseCode })))
    .onConflictDoUpdate({
      target: workspaceLanguage.code,
      set: { isBase: sql`excluded.is_base` },
    });
}

/** Active, non-deleted employees — the roster the DPO picker chooses from. */
export async function listActiveEmployees(tx: WorkspaceTx): Promise<EmployeeOptionRow[]> {
  return tx.db
    .select({
      id: employee.id,
      fullName: employee.fullName,
      designation: employee.designation,
      workEmail: employee.workEmail,
    })
    .from(employee)
    .where(and(eq(employee.status, 'active'), isNull(employee.deletedAt)));
}

/** Whether an employee id names a live employee in THIS workspace. */
export async function employeeExists(employeeId: string, tx: WorkspaceTx): Promise<boolean> {
  const rows = await tx.db
    .select({ id: employee.id })
    .from(employee)
    .where(and(eq(employee.id, employeeId), isNull(employee.deletedAt)))
    .limit(1);
  return rows.length > 0;
}

/** The control-plane registry row, used to seed defaults before a profile exists. */
export async function findWorkspaceRegistry(
  workspaceId: WorkspaceId,
  db: PlatformExecutor = platformDb,
): Promise<WorkspaceRegistryRow | null> {
  const rows = await db
    .select({ legalName: workspace.legalName, sectorKey: workspace.sectorKey })
    .from(workspace)
    .where(eq(workspace.id, workspaceId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Keeps the registry's display name in step with the profile the workspace just saved.
 * `public.workspace.legal_name` is what the session, the workspace switcher and the
 * topbar render, so letting the two diverge would show a stale name everywhere outside
 * this panel. Scoped by the verified context's workspace id — never a request value.
 */
export async function updateRegistryLegalName(
  workspaceId: WorkspaceId,
  legalName: string,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db
    .update(workspace)
    .set({ legalName, updatedAt: new Date() })
    .where(eq(workspace.id, workspaceId));
}

// ─────────────────────────────────────────────────────────────────────────
// Access control panel — see docs comment at the top of this file. Two more
// kinds of query, same two categories: `module`/`permission` are PLATFORM
// catalog data (read with `platformDb`); `role`/`role_permission` are TENANT
// data (take a `WorkspaceTx`).
// ─────────────────────────────────────────────────────────────────────────

/** One row of the platform module catalog. */
export type ModuleCatalogRow = {
  key: string;
  groupKey: string;
  name: string;
  icon: string;
  position: number;
};

/** One row of the platform permission catalog. */
export type PermissionCatalogRow = {
  key: string;
  moduleKey: string;
  action: string;
};

/** Every module, ordered for display. */
export async function listModuleCatalog(): Promise<ModuleCatalogRow[]> {
  return platformDb
    .select({
      key: moduleCatalog.key,
      groupKey: moduleCatalog.groupKey,
      name: moduleCatalog.name,
      icon: moduleCatalog.icon,
      position: moduleCatalog.position,
    })
    .from(moduleCatalog)
    .orderBy(asc(moduleCatalog.position));
}

/** Every grantable permission, across every module. */
export async function listPermissionCatalog(): Promise<PermissionCatalogRow[]> {
  return platformDb
    .select({ key: permission.key, moduleKey: permission.moduleKey, action: permission.action })
    .from(permission)
    .orderBy(asc(permission.position));
}

/** One role, as stored. */
export type RoleRow = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isLocked: boolean;
};

/** Every role in this workspace, in creation order. */
export async function listRoles(tx: WorkspaceTx): Promise<RoleRow[]> {
  return tx.db
    .select({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isLocked: role.isLocked,
    })
    .from(role)
    .orderBy(asc(role.createdAt));
}

/** One role by id, or null. */
export async function findRole(roleId: string, tx: WorkspaceTx): Promise<RoleRow | null> {
  const rows = await tx.db
    .select({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isLocked: role.isLocked,
    })
    .from(role)
    .where(eq(role.id, roleId))
    .limit(1);
  return rows[0] ?? null;
}

/** Whether a role name is already taken (role.name is UNIQUE). */
export async function roleNameExists(name: string, tx: WorkspaceTx): Promise<boolean> {
  const rows = await tx.db.select({ id: role.id }).from(role).where(eq(role.name, name)).limit(1);
  return rows.length > 0;
}

/** Every (permission_key -> is_granted) row for every role, for one read of the whole matrix. */
export async function listAllRolePermissions(
  tx: WorkspaceTx,
): Promise<{ roleId: string; permissionKey: string; isGranted: boolean }[]> {
  return tx.db
    .select({
      roleId: rolePermission.roleId,
      permissionKey: rolePermission.permissionKey,
      isGranted: rolePermission.isGranted,
    })
    .from(rolePermission);
}

/** Inserts a new custom role and returns its id. */
export async function insertRole(
  values: { name: string; description: string; isLocked: boolean },
  tx: WorkspaceTx,
): Promise<string> {
  const rows = await tx.db
    .insert(role)
    .values({ name: values.name, description: values.description, isLocked: values.isLocked })
    .returning({ id: role.id });
  const id = rows[0]?.id;
  if (id === undefined) {
    // Unreachable in practice — insert().returning() always returns the row it just wrote.
    throw new AppError({ code: 'DB_QUERY_FAILED', message: 'role insert returned no id' });
  }
  return id;
}

/** Renames a role. Locking is enforced by the service, not here. */
export async function updateRoleName(roleId: string, name: string, tx: WorkspaceTx): Promise<void> {
  await tx.db.update(role).set({ name, updatedAt: new Date() }).where(eq(role.id, roleId));
}

/**
 * Deletes a role. `role_permission` rows cascade
 * (db/schema/0002_workspace_template.sql — `ON DELETE CASCADE`), so no
 * separate cleanup query is needed. Whether a role may be deleted at all
 * (system roles never can) is enforced by the service, not here.
 */
export async function deleteRole(roleId: string, tx: WorkspaceTx): Promise<void> {
  await tx.db.delete(role).where(eq(role.id, roleId));
}

/**
 * Replaces every grant for one role in one statement. `grants` is the FULL set
 * this role should now have — callers pass every permission key in the
 * catalog, never a partial patch, so a role can never be left holding a grant
 * the caller forgot to mention.
 */
export async function replaceRolePermissions(
  roleId: string,
  grants: readonly { permissionKey: string; isGranted: boolean }[],
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.delete(rolePermission).where(eq(rolePermission.roleId, roleId));
  if (grants.length === 0) return;
  await tx.db
    .insert(rolePermission)
    .values(
      grants.map((g) => ({ roleId, permissionKey: g.permissionKey, isGranted: g.isGranted })),
    );
}
