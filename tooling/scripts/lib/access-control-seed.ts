/**
 * Default system-role seeding for a workspace schema — called by
 * tooling/scripts/provision.ts as its final step, after migrations and
 * grants, so a newly (or repaired) provisioned workspace already has the
 * eight system roles the Access control panel expects instead of an empty
 * `role` table.
 *
 * Deliberately simplified relative to the product mock
 * (`src/shared/mock/access-control.ts`, `SYSTEM_ROLES`): the mock encodes a
 * detailed per-module override grid (e.g. DSR Officer gets 'approve' on `dsr`
 * but 'none' everywhere else). Reproducing that exactly here would duplicate
 * a policy decision in two places — SQL seed data and the service-layer
 * mapping the Access control panel now edits through. Instead each role gets
 * ONE uniform starting level, expanded into concrete `role_permission` grants
 * with the same level → actions mapping the service layer uses for reads
 * (`src/app/api/settings/access-control-service.ts`). A workspace admin's
 * first action in the newly-wired panel is expected to be tailoring these
 * defaults per module, not receiving a frozen copy of the prototype grid.
 *
 * Idempotent: `ON CONFLICT DO NOTHING` throughout, safe to re-run on
 * `db:provision --repair`.
 */
import type postgres from 'postgres';
import { assertWorkspaceSchemaName } from './db-migrations.ts';

export type DefaultPermissionLevel = 'none' | 'view' | 'edit' | 'approve';

/**
 * Which `permission.action` values a level grants. Mirrors the mapping in
 * access-control-service.ts exactly — see that file for the full reasoning.
 * `none` grants nothing; `view` is read-only; `edit` is full CRUD without
 * sign-off or bulk export; `approve` is everything, including `export`.
 */
export const DEFAULT_LEVEL_ACTIONS: Record<DefaultPermissionLevel, readonly string[]> = {
  none: [],
  view: ['view'],
  edit: ['view', 'create', 'edit', 'delete'],
  approve: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
};

export type DefaultRole = {
  name: string;
  description: string;
  isLocked: boolean;
  level: DefaultPermissionLevel;
};

/** The eight system roles, in the order the panel's role picker should offer them. */
export const DEFAULT_SYSTEM_ROLES: readonly DefaultRole[] = [
  {
    name: 'Admin',
    description: 'Full access to every module. Cannot be edited down.',
    isLocked: true,
    level: 'approve',
  },
  {
    name: 'Data Protection Officer',
    description: 'Owns the privacy program end to end.',
    isLocked: false,
    level: 'approve',
  },
  {
    name: 'Compliance Manager',
    description: 'Runs day-to-day compliance operations.',
    isLocked: false,
    level: 'edit',
  },
  {
    name: 'DSR Officer',
    description: 'Handles data principal requests.',
    isLocked: false,
    level: 'view',
  },
  {
    name: 'Legal',
    description: 'Reviews notices, contracts and transfers.',
    isLocked: false,
    level: 'view',
  },
  {
    name: 'Auditor',
    description: 'Read-only access for audits and reviews.',
    isLocked: false,
    level: 'view',
  },
  { name: 'Employee', description: 'General staff access.', isLocked: false, level: 'none' },
  { name: 'Viewer', description: 'Read-only observer.', isLocked: false, level: 'view' },
];

/** Seeds the default roles + their permission grants into one workspace schema. */
export async function seedDefaultRoles(sql: postgres.Sql, schemaName: string): Promise<void> {
  assertWorkspaceSchemaName(schemaName, 'seedDefaultRoles');

  const permissions = await sql<{ key: string; action: string }[]>`
    select key, action from public.permission
  `;
  if (permissions.length === 0) {
    console.log('  · public.permission is empty — run `pnpm db:seed` first; skipping role seed');
    return;
  }

  for (const role of DEFAULT_SYSTEM_ROLES) {
    const grantedActions = new Set(DEFAULT_LEVEL_ACTIONS[role.level]);

    const inserted = await sql.unsafe<{ id: string }[]>(
      `insert into "${schemaName}".role (name, description, is_system, is_locked)
       values ($1, $2, true, $3)
       on conflict (name) do nothing
       returning id`,
      [role.name, role.description, role.isLocked],
    );

    let roleId = inserted[0]?.id;
    if (roleId === undefined) {
      const existing = await sql.unsafe<{ id: string }[]>(
        `select id from "${schemaName}".role where name = $1`,
        [role.name],
      );
      roleId = existing[0]?.id;
    }
    if (roleId === undefined) continue;

    for (const permission of permissions) {
      await sql.unsafe(
        `insert into "${schemaName}".role_permission (role_id, permission_key, is_granted)
         values ($1, $2, $3)
         on conflict (role_id, permission_key) do nothing`,
        [roleId, permission.key, grantedActions.has(permission.action)],
      );
    }
  }
}
