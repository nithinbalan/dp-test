/**
 * Business rules for the Employees ("People & Awareness") module — s.7(i)/s.8(4).
 *
 * Owns two decisions the repository deliberately does not: how a per-employee
 * awareness percentage and status are derived from raw enrollment rows, and how a
 * new employee's human-facing code is allocated. Expected failures come back as
 * `Result` — see docs/ERROR_HANDLING.md §3.
 */
import { withWorkspace, type WorkspaceContext } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import {
  findDepartmentByName,
  findEmployeeByWorkEmail,
  insertDepartment,
  insertEmployee,
  listEmployees,
  listMandatoryEnrollments,
  nextEmployeeCode,
  type EmployeeListRow,
  type MandatoryEnrollmentRow,
} from './repository';

/** Connection status the "Device & agent" column renders. */
export type AgentConnectionStatus = 'active' | 'outdated' | 'no-agent';

/** Awareness status the "Awareness" column renders. */
export type AwarenessStatus = 'certified' | 'in-progress' | 'overdue';

/** One row of the Employees table. */
export type EmployeeRow = {
  id: string;
  code: string;
  fullName: string;
  workEmail: string | null;
  departmentName: string | null;
  designation: string | null;
  deviceCode: string | null;
  agentStatus: AgentConnectionStatus;
  awarenessPercent: number;
  awarenessStatus: AwarenessStatus;
};

/** What the Employees page renders: the roster plus its KPI row. */
export type EmployeesData = {
  employees: EmployeeRow[];
  withAgentCount: number;
  avgAwarenessPercent: number;
  overdueCount: number;
};

/** The fields the "Add Employee" form may submit. Only `fullName` is required. */
export type NewEmployeeInput = {
  fullName: string;
  workEmail?: string | undefined;
  department?: string | undefined;
  designation?: string | undefined;
};

/** Why a create was refused. */
export type CreateEmployeeError = 'VALIDATION_FAILED' | 'CONFLICT';

const MAX_NAME_LENGTH = 200;
/**
 * Human-facing code prefix. `ref_sequence`/`next_ref()` (db/schema/0002 §0) is the
 * established per-workspace counter for every other human-facing id (`RA-001`,
 * `DSR-0007`), so a new employee's code reuses that mechanism rather than inventing
 * a parallel one. `next_ref` renders `PREFIX-000`; we swap the hyphen for a slash to
 * match the prototype's `JTK/046` styling — that reformatting is presentation only,
 * the counter itself is the source of truth.
 */
const EMPLOYEE_CODE_PREFIX = 'EMP';

function toDisplayCode(rawCode: string): string {
  return rawCode.replace('-', '/');
}

/**
 * Maps a raw `agent_status` to the three states the "Device & agent" pill renders.
 * `pending` (enrolled but never checked in) and `paused`/`uninstalled` all read as
 * "no agent" to the Employees page — the distinction between them is Endpoints'
 * concern, not this roster's.
 */
function toAgentConnectionStatus(
  agentStatus: EmployeeListRow['agentStatus'],
): AgentConnectionStatus {
  if (agentStatus === 'active') return 'active';
  if (agentStatus === 'outdated') return 'outdated';
  return 'no-agent';
}

/**
 * Awareness aggregation policy (documented here because it is a judgment call, not
 * a statutory rule — mirrors how access-control-service.ts documents its own
 * level-mapping decision):
 *
 *   - Only MANDATORY courses count. s.8(4) organisational measures are about the
 *     training a workspace requires, not every optional course an employee could
 *     enrol in.
 *   - Each mandatory enrollment contributes a completion weight: `completed` and
 *     `waived` = 100, `in_progress` = 50, `not_started`/`overdue` = 0. An employee's
 *     percent is the average weight across their mandatory enrollments — this
 *     rewards partial progress instead of an all-or-nothing bar.
 *   - `overdue` on ANY mandatory enrollment makes the employee's overall status
 *     `overdue`, regardless of the averaged percent — a single lapsed course is
 *     what the "Training overdue" KPI and s.8(4) evidence care about.
 *   - Zero mandatory enrollments (no course assigned yet) reads as `overdue` at 0%,
 *     the same "nothing to show yet" state the mock data previously defaulted to —
 *     an employee with no assigned training is not "certified" by omission.
 */
function summariseAwareness(rows: readonly MandatoryEnrollmentRow[]): {
  percent: number;
  status: AwarenessStatus;
} {
  if (rows.length === 0) {
    return { percent: 0, status: 'overdue' };
  }

  const weights: number[] = rows.map((row) => {
    if (row.status === 'completed' || row.status === 'waived') return 100;
    if (row.status === 'in_progress') return 50;
    return 0;
  });
  const percent = Math.round(weights.reduce((total, w) => total + w, 0) / weights.length);
  const hasOverdue = rows.some((row) => row.status === 'overdue');
  const allSatisfied = rows.every((row) => row.status === 'completed' || row.status === 'waived');

  const status: AwarenessStatus = hasOverdue
    ? 'overdue'
    : allSatisfied
      ? 'certified'
      : 'in-progress';
  return { percent, status };
}

/** Current roster and KPIs for the Employees page. */
export async function getEmployees(ctx: WorkspaceContext): Promise<EmployeesData> {
  return withWorkspace(ctx, async (tx) => {
    const [rows, enrollments] = await Promise.all([
      listEmployees(tx),
      listMandatoryEnrollments(tx),
    ]);

    const enrollmentsByEmployee = new Map<string, MandatoryEnrollmentRow[]>();
    for (const row of enrollments) {
      const bucket = enrollmentsByEmployee.get(row.employeeId) ?? [];
      bucket.push(row);
      enrollmentsByEmployee.set(row.employeeId, bucket);
    }

    const employees: EmployeeRow[] = rows.map((row) => {
      const awareness = summariseAwareness(enrollmentsByEmployee.get(row.id) ?? []);
      return {
        id: row.id,
        code: toDisplayCode(row.code),
        fullName: row.fullName,
        workEmail: row.workEmail,
        departmentName: row.departmentName,
        designation: row.designation,
        deviceCode: row.deviceCode,
        agentStatus: toAgentConnectionStatus(row.agentStatus),
        awarenessPercent: awareness.percent,
        awarenessStatus: awareness.status,
      };
    });

    const withAgentCount = employees.filter((e) => e.agentStatus !== 'no-agent').length;
    const overdueCount = employees.filter((e) => e.awarenessStatus === 'overdue').length;
    const avgAwarenessPercent =
      employees.length === 0
        ? 0
        : Math.round(
            employees.reduce((total, e) => total + e.awarenessPercent, 0) / employees.length,
          );

    return { employees, withAgentCount, avgAwarenessPercent, overdueCount };
  });
}

/**
 * Creates a new employee. `workEmail` and `department`/`designation` are optional in
 * the form but, when a department name is given, it is created on first use —
 * matching how the prototype's Add Employee flow never makes department setup a
 * prerequisite.
 */
export async function createEmployee(
  ctx: WorkspaceContext,
  input: NewEmployeeInput,
): Promise<Result<EmployeeRow, CreateEmployeeError>> {
  const fullName = input.fullName.trim();
  const workEmail = (input.workEmail ?? '').trim();
  const departmentName = (input.department ?? '').trim();
  const designation = (input.designation ?? '').trim();

  if (fullName.length === 0 || fullName.length > MAX_NAME_LENGTH) {
    return err('VALIDATION_FAILED');
  }

  return withWorkspace(ctx, async (tx): Promise<Result<EmployeeRow, CreateEmployeeError>> => {
    if (workEmail.length > 0 && (await findEmployeeByWorkEmail(workEmail, tx)) !== null) {
      return err('CONFLICT');
    }

    let departmentId: string | null = null;
    if (departmentName.length > 0) {
      const existing = await findDepartmentByName(departmentName, tx);
      departmentId = existing?.id ?? (await insertDepartment(departmentName, tx));
    }

    const code = await nextEmployeeCode(EMPLOYEE_CODE_PREFIX, tx);
    const id = await insertEmployee(
      {
        code,
        fullName,
        workEmail: workEmail.length > 0 ? workEmail : null,
        departmentId,
        designation: designation.length > 0 ? designation : null,
      },
      tx,
    );

    return ok({
      id,
      code: toDisplayCode(code),
      fullName,
      workEmail: workEmail.length > 0 ? workEmail : null,
      departmentName: departmentName.length > 0 ? departmentName : null,
      designation: designation.length > 0 ? designation : null,
      deviceCode: null,
      agentStatus: 'no-agent',
      awarenessPercent: 0,
      awarenessStatus: 'overdue',
    });
  });
}
