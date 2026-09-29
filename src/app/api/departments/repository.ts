/**
 * Pure data access for the Departments module. No business rules — see
 * docs/ARCHITECTURE.md "Layering (server)".
 *
 * Every query here takes a {@link WorkspaceTx} and never opens its own connection —
 * the service opens one with `withWorkspace()`. See docs/WORKSPACE_ISOLATION.md §5.
 */
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { department, employee } from '@server/db';
import type { WorkspaceTx } from '@server/workspace';

export type DepartmentRow = { id: string; name: string; isActive: boolean };

const DEPARTMENT_COLUMNS = {
  id: department.id,
  name: department.name,
  isActive: department.isActive,
};

/** Every department, alphabetically — the order a picker should list them in. */
export async function listDepartments(tx: WorkspaceTx): Promise<DepartmentRow[]> {
  return tx.db.select(DEPARTMENT_COLUMNS).from(department).orderBy(asc(department.name));
}

/** One department by (case-sensitive) name, or null. */
export async function findDepartmentByName(
  name: string,
  tx: WorkspaceTx,
): Promise<DepartmentRow | null> {
  const rows = await tx.db
    .select(DEPARTMENT_COLUMNS)
    .from(department)
    .where(eq(department.name, name))
    .limit(1);
  return rows[0] ?? null;
}

/** One department by id, or null — used to confirm it exists before rename/delete. */
export async function findDepartmentById(
  id: string,
  tx: WorkspaceTx,
): Promise<DepartmentRow | null> {
  const rows = await tx.db
    .select(DEPARTMENT_COLUMNS)
    .from(department)
    .where(eq(department.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Creates a department and returns it. */
export async function insertDepartment(name: string, tx: WorkspaceTx): Promise<DepartmentRow> {
  const rows = await tx.db.insert(department).values({ name }).returning(DEPARTMENT_COLUMNS);
  const row = rows[0];
  return row ?? { id: '', name, isActive: true };
}

/** Renames a department, sets its active flag, and returns the updated row. */
export async function renameDepartment(
  id: string,
  name: string,
  isActive: boolean,
  tx: WorkspaceTx,
): Promise<DepartmentRow> {
  const rows = await tx.db
    .update(department)
    .set({ name, isActive })
    .where(eq(department.id, id))
    .returning(DEPARTMENT_COLUMNS);
  const row = rows[0];
  return row ?? { id, name, isActive };
}

/** How many live employees currently sit in this department — a non-zero
 * count is why `deleteDepartment` refuses rather than orphaning them. */
export async function countEmployeesInDepartment(id: string, tx: WorkspaceTx): Promise<number> {
  const rows = await tx.db
    .select({ count: sql<number>`count(*)` })
    .from(employee)
    .where(and(eq(employee.departmentId, id), isNull(employee.deletedAt)));
  return rows[0]?.count ?? 0;
}

export async function deleteDepartment(id: string, tx: WorkspaceTx): Promise<void> {
  await tx.db.delete(department).where(eq(department.id, id));
}
