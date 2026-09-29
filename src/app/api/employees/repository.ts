/**
 * Pure data access for the Employees module.
 *
 * One function per query, no business rules — the awareness aggregation policy and
 * the employee-code allocation both live in `service.ts`. See
 * docs/ARCHITECTURE.md "Layering (server)".
 *
 * Every query here takes a {@link WorkspaceTx} and never opens its own connection —
 * the service opens one with `withWorkspace()`. See docs/WORKSPACE_ISOLATION.md §5.
 */
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { department, employee, endpointDevice, enrollment, course } from '@server/db';
import type { WorkspaceTx } from '@server/workspace';

/** One employee row, joined with its department name and device/awareness state. */
export type EmployeeListRow = {
  id: string;
  code: string;
  fullName: string;
  workEmail: string | null;
  departmentName: string | null;
  designation: string | null;
  deviceCode: string | null;
  agentStatus: 'pending' | 'active' | 'outdated' | 'paused' | 'uninstalled' | null;
};

/** Every non-deleted employee, with department name and (at most one) device. */
export async function listEmployees(tx: WorkspaceTx): Promise<EmployeeListRow[]> {
  const rows = await tx.db
    .select({
      id: employee.id,
      code: employee.code,
      fullName: employee.fullName,
      workEmail: employee.workEmail,
      departmentName: department.name,
      designation: employee.designation,
      deviceCode: endpointDevice.deviceCode,
      agentStatus: endpointDevice.agentStatus,
    })
    .from(employee)
    .leftJoin(department, eq(department.id, employee.departmentId))
    .leftJoin(endpointDevice, eq(endpointDevice.employeeId, employee.id))
    .where(isNull(employee.deletedAt))
    .orderBy(employee.createdAt);
  return rows;
}

/** One employee's mandatory-course enrollments — the awareness aggregation's raw input. */
export type MandatoryEnrollmentRow = {
  employeeId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'waived';
};

/** Every mandatory-course enrollment for every employee, in one query (no N+1). */
export async function listMandatoryEnrollments(tx: WorkspaceTx): Promise<MandatoryEnrollmentRow[]> {
  return tx.db
    .select({ employeeId: enrollment.employeeId, status: enrollment.status })
    .from(enrollment)
    .innerJoin(course, eq(course.id, enrollment.courseId))
    .where(eq(course.isMandatory, true));
}

/** Whether a work email is already used by a live employee — `work_email` has no UNIQUE
 * constraint in the schema, so the service enforces the practical uniqueness itself. */
export async function findEmployeeByWorkEmail(
  workEmail: string,
  tx: WorkspaceTx,
): Promise<{ id: string } | null> {
  const rows = await tx.db
    .select({ id: employee.id })
    .from(employee)
    .where(and(eq(employee.workEmail, workEmail), isNull(employee.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Every work email already in use by a live employee, in ONE query — the CSV
 * import's dedupe check against hundreds of rows must not fan out into
 * hundreds of `findEmployeeByWorkEmail` calls.
 */
export async function listExistingWorkEmails(tx: WorkspaceTx): Promise<Set<string>> {
  const rows = await tx.db
    .select({ workEmail: employee.workEmail })
    .from(employee)
    .where(and(isNull(employee.deletedAt), isNotNull(employee.workEmail)));
  return new Set(rows.map((row) => row.workEmail).filter((email) => email !== null));
}

/** One department by (case-sensitive) name, or null. */
export async function findDepartmentByName(
  name: string,
  tx: WorkspaceTx,
): Promise<{ id: string } | null> {
  const rows = await tx.db
    .select({ id: department.id })
    .from(department)
    .where(eq(department.name, name))
    .limit(1);
  return rows[0] ?? null;
}

/** Creates a department and returns its id — used when the submitted name is new. */
export async function insertDepartment(name: string, tx: WorkspaceTx): Promise<string> {
  const rows = await tx.db.insert(department).values({ name }).returning({ id: department.id });
  const id = rows[0]?.id;
  return id ?? '';
}

/**
 * Allocates the next human-facing employee code via `ref_sequence`/`next_ref()`
 * (db/schema/0002_workspace_template.sql §0) — the same per-workspace counter the
 * schema reserves for every other human-facing id (`RA-001`, `DSR-0007`). `next_ref`
 * returns `PREFIX-000`; the service reformats the separator to match the prototype's
 * `JTK/046` styling. Allocated inside the caller's transaction, so a rolled-back
 * create does not burn a number.
 */
export async function nextEmployeeCode(prefix: string, tx: WorkspaceTx): Promise<string> {
  const rows = await tx.db.execute<{ code: string }>(sql`select next_ref(${prefix}) as code`);
  const code = rows[0]?.code;
  return code ?? `${prefix}-000`;
}

/** The values needed to create one employee row. */
export type NewEmployeeValues = {
  code: string;
  fullName: string;
  workEmail: string | null;
  departmentId: string | null;
  designation: string | null;
};

/** Inserts a new employee and returns its id. */
export async function insertEmployee(values: NewEmployeeValues, tx: WorkspaceTx): Promise<string> {
  const rows = await tx.db.insert(employee).values(values).returning({ id: employee.id });
  const id = rows[0]?.id;
  return id ?? '';
}

/** Inserts every row of a CSV import in one statement, returning how many landed. */
export async function insertEmployeesBulk(
  values: readonly NewEmployeeValues[],
  tx: WorkspaceTx,
): Promise<number> {
  if (values.length === 0) return 0;
  const rows = await tx.db
    .insert(employee)
    .values([...values])
    .returning({ id: employee.id });
  return rows.length;
}
