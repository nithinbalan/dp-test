/**
 * Business rules for the "Import CSV" bulk-create path. Reuses the same
 * dedupe, department-auto-vivification, and employee-code allocation rules
 * `createEmployee` (`../service.ts`) applies to a single row — CSV import is
 * that same operation run many times inside one transaction, not a parallel
 * write path. See `../CLAUDE.md`: only `fullName`/`workEmail`/`department`/
 * `designation` are ever written here — no device or awareness column, and no
 * client-supplied employee code.
 */
import { withWorkspace, type WorkspaceContext, type WorkspaceTx } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import {
  findDepartmentByName,
  insertDepartment,
  insertEmployeesBulk,
  listExistingWorkEmails,
  nextEmployeeCode,
  type NewEmployeeValues,
} from '../repository';
import { parseCsv } from './csv';

const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 320;
const MAX_DESIGNATION_LENGTH = 120;
const MAX_DEPARTMENT_LENGTH = 120;
/** Generous for a manual HR export, small enough that one import can't stall the request. */
const MAX_IMPORT_ROWS = 500;
/** Matches `createEmployee`'s counter — see repository.ts's `nextEmployeeCode` doc. */
const EMPLOYEE_CODE_PREFIX = 'EMP';

const REQUIRED_HEADERS = ['fullname'] as const;
const KNOWN_COLUMNS = ['fullname', 'workemail', 'department', 'designation'];

/** Why one row of the CSV was not imported. */
export type ImportRowSkipReason = 'VALIDATION_FAILED' | 'DUPLICATE_EMAIL';

/** One skipped row, 1-indexed against the file (row 1 is the header). */
export type ImportRowSkip = { row: number; reason: ImportRowSkipReason };

/** What the Import dialog renders after a CSV is submitted. */
export type ImportEmployeesSummary = {
  insertedCount: number;
  skipped: ImportRowSkip[];
};

/** Why the whole file was refused — no row was even attempted. */
export type ImportEmployeesError = 'VALIDATION_FAILED';

/**
 * Column lookup that tolerates any header order and is case/whitespace
 * insensitive — a CSV exported from a spreadsheet rarely matches byte-for-byte.
 */
function buildColumnIndex(headerRow: string[]): Map<string, number> {
  const index = new Map<string, number>();
  headerRow.forEach((cell, i) => {
    const key = cell.trim().toLowerCase();
    if (KNOWN_COLUMNS.includes(key) && !index.has(key)) index.set(key, i);
  });
  return index;
}

function cellAt(row: string[], columns: Map<string, number>, key: string): string {
  const i = columns.get(key);
  return i === undefined ? '' : (row[i] ?? '').trim();
}

/** One CSV row's cells, pulled out by known column name — trimmed, never `undefined`. */
type ImportRowFields = {
  fullName: string;
  workEmail: string;
  departmentName: string;
  designation: string;
};

function readRowFields(row: string[], columns: Map<string, number>): ImportRowFields {
  return {
    fullName: cellAt(row, columns, 'fullname'),
    workEmail: cellAt(row, columns, 'workemail'),
    departmentName: cellAt(row, columns, 'department'),
    designation: cellAt(row, columns, 'designation'),
  };
}

/** Field-length and required-value checks — everything that needs no database lookup. */
function fieldsPassStructuralChecks(fields: ImportRowFields): boolean {
  if (fields.fullName.length === 0 || fields.fullName.length > MAX_NAME_LENGTH) return false;
  if (fields.workEmail.length > MAX_EMAIL_LENGTH) return false;
  if (fields.designation.length > MAX_DESIGNATION_LENGTH) return false;
  if (fields.departmentName.length > MAX_DEPARTMENT_LENGTH) return false;
  return true;
}

/** Resolves (and, on first use, creates) a department by name, caching within the batch. */
async function resolveDepartmentId(
  departmentName: string,
  cache: Map<string, string | null>,
  tx: WorkspaceTx,
): Promise<string | null> {
  if (departmentName.length === 0) return null;
  const cached = cache.get(departmentName);
  if (cached !== undefined) return cached;

  const existing = await findDepartmentByName(departmentName, tx);
  const departmentId = existing?.id ?? (await insertDepartment(departmentName, tx));
  cache.set(departmentName, departmentId);
  return departmentId;
}

/**
 * Parses, validates, and bulk-inserts a CSV of employees. Every row that fails
 * its own validation or collides with an existing (or earlier-in-file) work
 * email is skipped and reported back — one bad row does not fail the batch,
 * matching how a human importer expects "import what's valid, tell me what
 * wasn't." Only a structurally unusable file (no header, no `fullName`
 * column, or nothing to import) refuses the whole request.
 */
export async function importEmployeesFromCsv(
  ctx: WorkspaceContext,
  csvText: string,
): Promise<Result<ImportEmployeesSummary, ImportEmployeesError>> {
  const parsed = parseCsv(csvText).filter((row) => row.some((cell) => cell.trim().length > 0));
  if (parsed.length === 0) return err('VALIDATION_FAILED');

  const [headerRow, ...dataRows] = parsed;
  const columns = buildColumnIndex(headerRow ?? []);
  const hasRequiredHeaders = REQUIRED_HEADERS.every((h) => columns.has(h));
  if (!hasRequiredHeaders || dataRows.length === 0 || dataRows.length > MAX_IMPORT_ROWS) {
    return err('VALIDATION_FAILED');
  }

  return withWorkspace(ctx, async (tx) => {
    const existingEmails = await listExistingWorkEmails(tx);
    const seenEmailsInFile = new Set<string>();
    const departmentIdByName = new Map<string, string | null>();
    const skipped: ImportRowSkip[] = [];
    const toInsert: NewEmployeeValues[] = [];

    for (const [offset, row] of dataRows.entries()) {
      const fileRow = offset + 2; // +1 for the header, +1 for 1-indexing
      const fields = readRowFields(row, columns);

      if (!fieldsPassStructuralChecks(fields)) {
        skipped.push({ row: fileRow, reason: 'VALIDATION_FAILED' });
        continue;
      }
      const isDuplicateEmail =
        fields.workEmail.length > 0 &&
        (existingEmails.has(fields.workEmail) || seenEmailsInFile.has(fields.workEmail));
      if (isDuplicateEmail) {
        skipped.push({ row: fileRow, reason: 'DUPLICATE_EMAIL' });
        continue;
      }

      const departmentId = await resolveDepartmentId(fields.departmentName, departmentIdByName, tx);
      // Raw hyphen form (`EMP-001`) is what's stored — `../service.ts`'s
      // `toDisplayCode` reformats it to `EMP/001` only when a row is read back.
      const code = await nextEmployeeCode(EMPLOYEE_CODE_PREFIX, tx);
      toInsert.push({
        code,
        fullName: fields.fullName,
        workEmail: fields.workEmail.length > 0 ? fields.workEmail : null,
        departmentId,
        designation: fields.designation.length > 0 ? fields.designation : null,
      });
      if (fields.workEmail.length > 0) seenEmailsInFile.add(fields.workEmail);
    }

    const insertedCount = await insertEmployeesBulk(toInsert, tx);
    return ok({ insertedCount, skipped });
  });
}
