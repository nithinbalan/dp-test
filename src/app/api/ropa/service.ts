/**
 * Business rules for the RoPA (Record of Processing Activities) module (s.5).
 *
 * Owns the statutory-column ↔ wizard-key mapping (`mappings.ts`) and the
 * re-approval-on-edit policy: any edit to an activity — regardless of its prior
 * status — resets it to `needs_review` and bumps the version, because a
 * statutory field just changed underneath an approval that no longer covers it.
 * Expected failures come back as `Result` — see docs/ERROR_HANDLING.md §3.
 */
import { withWorkspace, type WorkspaceContext } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import { SENSITIVE_IDENTIFIERS } from '@shared/mock/data-map';
import { DATA_SOURCES } from '@shared/mock/data-sources';
import type {
  ActivityHistoryEntry,
  ActivityStatus,
  LawfulBasis as UiLawfulBasis,
} from '@shared/mock/ropa';
import {
  approveActivityRow,
  findActivityById,
  insertActivity,
  listActivities,
  listActivityCategories,
  listActivityOperations,
  listActivitySafeguards,
  listAllActivityCategories,
  nextActivityRefCode,
  replaceActivityCategories,
  replaceActivityOperations,
  replaceActivitySafeguards,
  updateActivityCore,
  type ActivityCoreValues,
  type ActivityListRow,
  type LawfulBasis as LawfulBasisDb,
} from './repository';
import {
  basisFromDb,
  basisToDb,
  collectionSourceLabel,
  crossBorderLabel,
  isUiLawfulBasis,
  operationFromDb,
  operationsToDb,
  principalTypeToLabel,
  retentionToDb,
  statusFromDb,
} from './mappings';

/** Extra fields kept in `custom` jsonb — see ADR-0005. */
type ActivityCustom = {
  processors?: string[];
  recipients?: string[];
  systems?: string[];
  evidence?: string[];
  issues?: string[];
  retentionUnknown?: boolean;
  /** Why the AI drafted this activity — set only for `drafted_by = 'ai'` rows. */
  aiRationale?: string;
};

function readCustom(custom: unknown): ActivityCustom {
  if (typeof custom !== 'object' || custom === null) return {};
  return custom;
}

function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** One row of the RoPA register — the list `/ropa` reads. */
export type ActivitySummary = {
  id: string;
  refCode: string;
  name: string;
  /** The raw wizard principal key (`customers`, `employees`, …) — the edit
   * wizard's prefill needs the key, the list/detail views show `principals`. */
  principalType: string;
  principals: string;
  dataCategories: string[];
  basisLabel: string;
  retention: string;
  ownerName: string;
  ownerInitials: string;
  status: ActivityStatus;
  evidence: string[];
  confidence: number | undefined;
  issues: string[];
};

/** One activity's full record — the detail view and the edit wizard's prefill both read this. */
export type ActivityDetail = ActivitySummary & {
  purpose: string;
  lawfulBasis: UiLawfulBasis;
  retentionUnknown: boolean;
  dataSource: string;
  operations: string[];
  systems: string[];
  storageLocation: string;
  processors: string[];
  recipients: string[];
  crossBorder: string;
  security: string[];
  ownerId: string;
  reviewer: string | undefined;
  reviewedAt: string | undefined;
  version: number;
  history: ActivityHistoryEntry[];
  aiRationale: string | undefined;
};

/** What the wizard submits — its own `AddActivityState` shape, unmodified. */
export type ActivityWizardInput = {
  name: string;
  purpose: string;
  principals: string;
  identifiers: string[];
  collectionSource: string;
  storageLocations: string[];
  retention: string;
  lawfulBasis: string;
  processors: string[];
  ownerId: string | undefined;
  crossBorder: 'india' | 's16';
  operations: string[];
  securityMeasures: string[];
};

export type CreateActivityError = 'VALIDATION_FAILED';
export type UpdateActivityError = 'VALIDATION_FAILED' | 'NOT_FOUND';
export type ApproveActivityError = 'NOT_FOUND';

function storageLabel(ids: readonly string[]): { names: string[]; joined: string } {
  const names = ids
    .map((id) => DATA_SOURCES.find((source) => source.id === id)?.name)
    .filter((name): name is string => name !== undefined);
  return { names, joined: names.length > 0 ? names.join(' · ') : 'To be mapped' };
}

function toSummary(
  row: ActivityListRow,
  dataCategories: string[],
  custom: ActivityCustom,
): ActivitySummary {
  return {
    id: row.id,
    refCode: row.refCode,
    name: row.name,
    principalType: row.principalType,
    principals: principalTypeToLabel(row.principalType),
    dataCategories,
    basisLabel: `${basisFromDbLabel(row.basis)} — ${row.basisRef}`,
    retention: row.retentionRule,
    ownerName: row.ownerName,
    ownerInitials: ownerInitials(row.ownerName),
    status: statusFromDb(row.status, row.draftedBy),
    evidence: custom.evidence ?? [],
    confidence: row.aiConfidence ?? undefined,
    issues: custom.issues ?? [],
  };
}

const BASIS_DISPLAY: Record<UiLawfulBasis, string> = {
  consent: 'Consent',
  voluntary: 'Voluntary provision',
  employment: 'Employment',
  'legal-obligation': 'Legal obligation',
  'parental-consent': 'Verifiable parental consent',
  security: 'Security safeguards',
};

function basisFromDbLabel(basis: LawfulBasisDb): string {
  return BASIS_DISPLAY[basisFromDb(basis)];
}

/** The register's rows for the RoPA page — one query per satellite table, joined in memory. */
export async function getActivities(ctx: WorkspaceContext): Promise<ActivitySummary[]> {
  return withWorkspace(ctx, async (tx) => {
    const [rows, categories] = await Promise.all([
      listActivities(tx),
      listAllActivityCategories(tx),
    ]);
    const categoriesByActivity = new Map<string, string[]>();
    for (const cat of categories) {
      const bucket = categoriesByActivity.get(cat.activityId) ?? [];
      bucket.push(cat.identifierTypeKey);
      categoriesByActivity.set(cat.activityId, bucket);
    }
    return rows.map((row) =>
      toSummary(row, categoriesByActivity.get(row.id) ?? [], readCustom(row.custom)),
    );
  });
}

/** One activity's full record, or `NOT_FOUND`. */
export async function getActivity(
  ctx: WorkspaceContext,
  id: string,
): Promise<Result<ActivityDetail, 'NOT_FOUND'>> {
  return withWorkspace(ctx, async (tx): Promise<Result<ActivityDetail, 'NOT_FOUND'>> => {
    const row = await findActivityById(id, tx);
    if (!row) return err('NOT_FOUND');

    const [categoryRows, operations, security] = await Promise.all([
      listActivityCategories(id, tx),
      listActivityOperations(id, tx),
      listActivitySafeguards(id, tx),
    ]);
    const custom = readCustom(row.custom);
    const summary = toSummary(
      row,
      categoryRows.map((c) => c.identifierTypeKey),
      custom,
    );
    const isApproved = row.status === 'approved';

    return ok({
      ...summary,
      purpose: row.purpose,
      lawfulBasis: basisFromDb(row.basis),
      retentionUnknown: custom.retentionUnknown ?? false,
      dataSource: row.collectionSource ?? '—',
      operations: operations.map(operationFromDb),
      systems: custom.systems ?? [],
      storageLocation: row.storageLocation ?? 'To be mapped',
      processors: custom.processors ?? [],
      recipients: custom.recipients ?? [],
      crossBorder: crossBorderLabel(row.crossesBorder),
      security,
      ownerId: row.ownerEmployeeId,
      reviewer: isApproved ? row.ownerName : undefined,
      reviewedAt:
        isApproved && row.approvedAt ? row.approvedAt.toISOString().slice(0, 10) : undefined,
      version: row.version,
      aiRationale: custom.aiRationale,
      history: [
        {
          label: isApproved
            ? `Approved by ${row.ownerName} — sign-off logged`
            : `Drafted — v${String(row.version)}`,
          date: row.updatedAt.toISOString().slice(0, 10),
        },
      ],
    });
  });
}

function buildCoreValues(
  input: ActivityWizardInput,
): Result<ActivityCoreValues, CreateActivityError> {
  const name = input.name.trim();
  const purpose = input.purpose.trim();
  if (name.length === 0 || purpose.length === 0 || input.principals === '')
    return err('VALIDATION_FAILED');
  if (!isUiLawfulBasis(input.lawfulBasis) || input.ownerId === undefined) {
    return err('VALIDATION_FAILED');
  }

  const { basis, basisRef } = basisToDb(input.lawfulBasis);
  const { retentionRule, days } = retentionToDb(input.retention);
  const { names, joined } = storageLabel(input.storageLocations);

  const custom: ActivityCustom = {
    processors: input.processors,
    recipients: [],
    systems: names,
    evidence: [],
    issues: [],
  };

  return ok({
    name,
    purpose,
    principalType: input.principals,
    basis,
    basisRef,
    basisNote: null,
    retentionRule,
    retentionPeriodDays: days,
    retentionSource: 'owner_confirmed',
    collectionSource: collectionSourceLabel(input.collectionSource),
    storageLocation: joined,
    crossesBorder: input.crossBorder === 's16',
    ownerEmployeeId: input.ownerId,
    custom,
  });
}

/** Creates a new activity — always a human draft awaiting first review. */
export async function createActivity(
  ctx: WorkspaceContext,
  input: ActivityWizardInput,
): Promise<Result<{ id: string; refCode: string }, CreateActivityError>> {
  const core = buildCoreValues(input);
  if (!core.ok) return core;

  return withWorkspace(ctx, async (tx) => {
    const refCode = await nextActivityRefCode(tx);
    const id = await insertActivity({ ...core.value, refCode }, tx);
    const sensitiveKeys = new Set(SENSITIVE_IDENTIFIERS as readonly string[]);
    await Promise.all([
      replaceActivityCategories(
        id,
        input.identifiers.map((key) => ({
          identifierTypeKey: key,
          isSensitive: sensitiveKeys.has(key),
        })),
        tx,
      ),
      replaceActivityOperations(id, operationsToDb(input.operations), tx),
      replaceActivitySafeguards(id, input.securityMeasures, tx),
    ]);
    return ok({ id, refCode });
  });
}

/** Overwrites an activity and reopens it for review — see this file's header. */
export async function updateActivity(
  ctx: WorkspaceContext,
  id: string,
  input: ActivityWizardInput,
): Promise<Result<{ id: string; refCode: string }, UpdateActivityError>> {
  const core = buildCoreValues(input);
  if (!core.ok) return core;

  return withWorkspace(
    ctx,
    async (tx): Promise<Result<{ id: string; refCode: string }, UpdateActivityError>> => {
      const existing = await findActivityById(id, tx);
      if (!existing) return err('NOT_FOUND');

      await updateActivityCore(id, core.value, existing.version + 1, tx);
      const sensitiveKeys = new Set(SENSITIVE_IDENTIFIERS as readonly string[]);
      await Promise.all([
        replaceActivityCategories(
          id,
          input.identifiers.map((key) => ({
            identifierTypeKey: key,
            isSensitive: sensitiveKeys.has(key),
          })),
          tx,
        ),
        replaceActivityOperations(id, operationsToDb(input.operations), tx),
        replaceActivitySafeguards(id, input.securityMeasures, tx),
      ]);
      return ok({ id, refCode: existing.refCode });
    },
  );
}

/** Approves an activity — the owner is recorded as the approver (no separate reviewer role yet). */
export async function approveActivity(
  ctx: WorkspaceContext,
  id: string,
): Promise<Result<{ id: string }, ApproveActivityError>> {
  return withWorkspace(ctx, async (tx): Promise<Result<{ id: string }, ApproveActivityError>> => {
    const existing = await findActivityById(id, tx);
    if (!existing) return err('NOT_FOUND');
    await approveActivityRow(id, existing.ownerEmployeeId, tx);
    return ok({ id });
  });
}
