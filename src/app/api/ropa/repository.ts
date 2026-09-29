/**
 * Pure data access for the RoPA (Record of Processing Activities) module.
 *
 * One function per query, no business rules — lawful-basis/status mapping and the
 * re-approval-on-edit policy live in `service.ts`. See docs/ARCHITECTURE.md
 * "Layering (server)".
 *
 * Every query here takes a {@link WorkspaceTx} and never opens its own connection —
 * the service opens one with `withWorkspace()`. See docs/WORKSPACE_ISOLATION.md §5.
 */
import { and, eq, isNull, sql } from 'drizzle-orm';
import {
  activityCategory,
  activityOperation,
  activitySafeguard,
  employee,
  processingActivity,
  type ActivityOperationKind,
  type ApprovalState,
  type DraftedBy,
  type LawfulBasis,
} from '@server/db';
import type { WorkspaceTx } from '@server/workspace';

/** Re-exported so the service/mapping layers can reference these without importing
 * `@server/db` themselves — only a repository.ts may (docs/WORKSPACE_ISOLATION.md). */
export type { ActivityOperationKind, ApprovalState, DraftedBy, LawfulBasis };

/** One row of the RoPA register — the list `/ropa` reads. */
export type ActivityListRow = {
  id: string;
  refCode: string;
  name: string;
  principalType: string;
  basis: LawfulBasis;
  basisRef: string;
  retentionRule: string;
  status: ApprovalState;
  version: number;
  draftedBy: DraftedBy;
  aiConfidence: number | null;
  ownerEmployeeId: string;
  ownerName: string;
  custom: unknown;
  updatedAt: Date;
};

const listColumns = {
  id: processingActivity.id,
  refCode: processingActivity.refCode,
  name: processingActivity.name,
  principalType: processingActivity.principalType,
  basis: processingActivity.basis,
  basisRef: processingActivity.basisRef,
  retentionRule: processingActivity.retentionRule,
  status: processingActivity.status,
  version: processingActivity.version,
  draftedBy: processingActivity.draftedBy,
  aiConfidence: processingActivity.aiConfidence,
  ownerEmployeeId: processingActivity.ownerEmployeeId,
  ownerName: employee.fullName,
  custom: processingActivity.custom,
  updatedAt: processingActivity.updatedAt,
};

/** Every non-deleted activity, newest first. */
export async function listActivities(tx: WorkspaceTx): Promise<ActivityListRow[]> {
  return tx.db
    .select(listColumns)
    .from(processingActivity)
    .innerJoin(employee, eq(employee.id, processingActivity.ownerEmployeeId))
    .where(isNull(processingActivity.deletedAt))
    .orderBy(processingActivity.updatedAt);
}

/** One activity by id (not deleted), with every statutory column. */
export type ActivityRow = ActivityListRow & {
  purpose: string;
  basisNote: string | null;
  retentionPeriodDays: number | null;
  retentionLawRef: string | null;
  retentionSource: string;
  collectionSource: string | null;
  storageLocation: string | null;
  crossesBorder: boolean;
  approvedAt: Date | null;
  approvedBy: string | null;
};

export async function findActivityById(id: string, tx: WorkspaceTx): Promise<ActivityRow | null> {
  const rows = await tx.db
    .select({
      ...listColumns,
      purpose: processingActivity.purpose,
      basisNote: processingActivity.basisNote,
      retentionPeriodDays: processingActivity.retentionPeriodDays,
      retentionLawRef: processingActivity.retentionLawRef,
      retentionSource: processingActivity.retentionSource,
      collectionSource: processingActivity.collectionSource,
      storageLocation: processingActivity.storageLocation,
      crossesBorder: processingActivity.crossesBorder,
      approvedAt: processingActivity.approvedAt,
      approvedBy: processingActivity.approvedBy,
    })
    .from(processingActivity)
    .innerJoin(employee, eq(employee.id, processingActivity.ownerEmployeeId))
    .where(and(eq(processingActivity.id, id), isNull(processingActivity.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/** Every identifier-type key tagged on every activity, for the list's per-row chips. */
export async function listAllActivityCategories(
  tx: WorkspaceTx,
): Promise<{ activityId: string; identifierTypeKey: string; isSensitive: boolean }[]> {
  return tx.db
    .select({
      activityId: activityCategory.activityId,
      identifierTypeKey: activityCategory.identifierTypeKey,
      isSensitive: activityCategory.isSensitive,
    })
    .from(activityCategory);
}

/** One activity's identifier-type keys. */
export async function listActivityCategories(
  activityId: string,
  tx: WorkspaceTx,
): Promise<{ identifierTypeKey: string; isSensitive: boolean }[]> {
  return tx.db
    .select({
      identifierTypeKey: activityCategory.identifierTypeKey,
      isSensitive: activityCategory.isSensitive,
    })
    .from(activityCategory)
    .where(eq(activityCategory.activityId, activityId));
}

/** One activity's processing operations. */
export async function listActivityOperations(
  activityId: string,
  tx: WorkspaceTx,
): Promise<string[]> {
  const rows = await tx.db
    .select({ operation: activityOperation.operation })
    .from(activityOperation)
    .where(eq(activityOperation.activityId, activityId));
  return rows.map((r) => r.operation);
}

/** One activity's security safeguards. */
export async function listActivitySafeguards(
  activityId: string,
  tx: WorkspaceTx,
): Promise<string[]> {
  const rows = await tx.db
    .select({ safeguardKey: activitySafeguard.safeguardKey })
    .from(activitySafeguard)
    .where(eq(activitySafeguard.activityId, activityId));
  return rows.map((r) => r.safeguardKey);
}

/** Allocates the next human-facing ref via `ref_sequence`/`next_ref()`. */
export async function nextActivityRefCode(tx: WorkspaceTx): Promise<string> {
  const rows = await tx.db.execute<{ code: string }>(sql`select next_ref('RA') as code`);
  const code = rows[0]?.code;
  return code ?? 'RA-000';
}

/** The values needed to create — or fully overwrite on edit — one activity's core row. */
export type ActivityCoreValues = {
  name: string;
  purpose: string;
  principalType: string;
  basis: LawfulBasis;
  basisRef: string;
  basisNote: string | null;
  retentionRule: string;
  retentionPeriodDays: number | null;
  retentionSource: string;
  collectionSource: string | null;
  storageLocation: string | null;
  crossesBorder: boolean;
  ownerEmployeeId: string;
  custom: Record<string, unknown>;
};

/** Inserts a new activity and returns its id. */
export async function insertActivity(
  values: ActivityCoreValues & { refCode: string },
  tx: WorkspaceTx,
): Promise<string> {
  const rows = await tx.db
    .insert(processingActivity)
    .values(values)
    .returning({ id: processingActivity.id });
  const id = rows[0]?.id;
  return id ?? '';
}

/**
 * Overwrites an activity's statutory + custom fields and resets it to
 * `needs_review` with the version bumped — the service's job to decide when,
 * this just applies the write.
 */
export async function updateActivityCore(
  id: string,
  values: ActivityCoreValues,
  nextVersion: number,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db
    .update(processingActivity)
    .set({
      ...values,
      status: 'needs_review',
      version: nextVersion,
      approvedAt: null,
      approvedBy: null,
      updatedAt: new Date(),
    })
    .where(eq(processingActivity.id, id));
}

/** Marks an activity approved. */
export async function approveActivityRow(
  id: string,
  approvedByEmployeeId: string,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db
    .update(processingActivity)
    .set({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: approvedByEmployeeId,
      updatedAt: new Date(),
    })
    .where(eq(processingActivity.id, id));
}

/** Overwrites the full set of identifier-type tags for one activity — delete then insert. */
export async function replaceActivityCategories(
  activityId: string,
  categories: readonly { identifierTypeKey: string; isSensitive: boolean }[],
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.delete(activityCategory).where(eq(activityCategory.activityId, activityId));
  if (categories.length === 0) return;
  await tx.db.insert(activityCategory).values(categories.map((c) => ({ activityId, ...c })));
}

/** Overwrites the full set of processing operations for one activity — delete then insert. */
export async function replaceActivityOperations(
  activityId: string,
  operations: readonly ActivityOperationKind[],
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.delete(activityOperation).where(eq(activityOperation.activityId, activityId));
  if (operations.length === 0) return;
  await tx.db
    .insert(activityOperation)
    .values(operations.map((operation) => ({ activityId, operation })));
}

/** Overwrites the full set of security safeguards for one activity — delete then insert. */
export async function replaceActivitySafeguards(
  activityId: string,
  safeguards: readonly string[],
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.delete(activitySafeguard).where(eq(activitySafeguard.activityId, activityId));
  if (safeguards.length === 0) return;
  await tx.db
    .insert(activitySafeguard)
    .values(safeguards.map((safeguardKey) => ({ activityId, safeguardKey })));
}
