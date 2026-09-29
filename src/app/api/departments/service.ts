/**
 * Business rules for the Departments module — the shared list of department
 * names a workspace picks from in Configuration Studio and in the Employees
 * "Add employee" form. One list, read by both, so a department only ever
 * needs to be typed once.
 */
import { withWorkspace, type WorkspaceContext } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import {
  countEmployeesInDepartment,
  deleteDepartment,
  findDepartmentByName,
  findDepartmentById,
  insertDepartment,
  listDepartments,
  renameDepartment,
  type DepartmentRow,
} from './repository';

const MAX_NAME_LENGTH = 120;

export type CreateDepartmentError = 'VALIDATION_FAILED' | 'CONFLICT';

/** Every department in the workspace, alphabetically. */
export async function getDepartments(ctx: WorkspaceContext): Promise<DepartmentRow[]> {
  return withWorkspace(ctx, (tx) => listDepartments(tx));
}

/** Creates a department. Rejects a blank or duplicate (case-sensitive) name. */
export async function createDepartment(
  ctx: WorkspaceContext,
  name: string,
): Promise<Result<DepartmentRow, CreateDepartmentError>> {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return err('VALIDATION_FAILED');

  return withWorkspace(ctx, async (tx) => {
    if ((await findDepartmentByName(trimmed, tx)) !== null) return err('CONFLICT');
    return ok(await insertDepartment(trimmed, tx));
  });
}

export type UpdateDepartmentError = 'VALIDATION_FAILED' | 'CONFLICT' | 'NOT_FOUND';

/** Renames a department and sets its active flag. Rejects a blank name, an
 * unknown id, or a name collision with a different department. */
export async function updateDepartment(
  ctx: WorkspaceContext,
  id: string,
  name: string,
  isActive: boolean,
): Promise<Result<DepartmentRow, UpdateDepartmentError>> {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return err('VALIDATION_FAILED');

  return withWorkspace(ctx, async (tx) => {
    const existing = await findDepartmentById(id, tx);
    if (!existing) return err('NOT_FOUND');
    const collision = await findDepartmentByName(trimmed, tx);
    if (collision !== null && collision.id !== id) return err('CONFLICT');
    return ok(await renameDepartment(id, trimmed, isActive, tx));
  });
}

export type DeleteDepartmentError = 'NOT_FOUND' | 'CONFLICT';

/** Deletes a department. Refuses while any live employee still sits in it —
 * reassign them first rather than silently orphaning their department field. */
export async function removeDepartment(
  ctx: WorkspaceContext,
  id: string,
): Promise<Result<true, DeleteDepartmentError>> {
  return withWorkspace(ctx, async (tx) => {
    const existing = await findDepartmentById(id, tx);
    if (!existing) return err('NOT_FOUND');
    if ((await countEmployeesInDepartment(id, tx)) > 0) return err('CONFLICT');
    await deleteDepartment(id, tx);
    return ok(true as const);
  });
}
