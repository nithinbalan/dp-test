/**
 * Pure data access for the Notice Manager module.
 *
 * One function per query, no business rules — section generation ("AI drafting"),
 * version bumping and the Rule-3 completeness check all live in `service.ts`. See
 * docs/ARCHITECTURE.md "Layering (server)".
 *
 * Every query here takes a {@link WorkspaceTx} and never opens its own connection —
 * the service opens one with `withWorkspace()`. See docs/WORKSPACE_ISOLATION.md §5.
 */
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import {
  notice,
  noticeSection,
  noticeVersion,
  type NoticeStatus,
  type NoticeVersionSource,
} from '@server/db';
import type { WorkspaceTx } from '@server/workspace';

/** One row of the Notices register — the list `/notices` reads. */
export type NoticeListRow = {
  id: string;
  refCode: string;
  name: string;
  status: NoticeStatus;
  updatedAt: Date;
  custom: unknown;
  version: string | null;
};

const listColumns = {
  id: notice.id,
  refCode: notice.refCode,
  name: notice.name,
  status: notice.status,
  updatedAt: notice.updatedAt,
  custom: notice.custom,
};

/** Every non-deleted notice, newest first, with its current version string. */
export async function listNotices(tx: WorkspaceTx): Promise<NoticeListRow[]> {
  return tx.db
    .select({ ...listColumns, version: noticeVersion.version })
    .from(notice)
    .leftJoin(noticeVersion, eq(noticeVersion.id, notice.currentVersionId))
    .where(isNull(notice.deletedAt))
    .orderBy(desc(notice.updatedAt));
}

/** One notice by id (not deleted), or null. */
export type NoticeRow = NoticeListRow & {
  activityId: string | null;
  currentVersionId: string | null;
};

export async function findNoticeById(id: string, tx: WorkspaceTx): Promise<NoticeRow | null> {
  const rows = await tx.db
    .select({
      ...listColumns,
      version: noticeVersion.version,
      activityId: notice.activityId,
      currentVersionId: notice.currentVersionId,
    })
    .from(notice)
    .leftJoin(noticeVersion, eq(noticeVersion.id, notice.currentVersionId))
    .where(and(eq(notice.id, id), isNull(notice.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/** One notice section, as stored. */
export type NoticeSectionRow = {
  key: string;
  heading: string;
  body: string;
  position: number;
};

/** Every section of one version, in a given language, in display order. */
export async function listVersionSections(
  versionId: string,
  lang: string,
  tx: WorkspaceTx,
): Promise<NoticeSectionRow[]> {
  return tx.db
    .select({
      key: noticeSection.sectionKey,
      heading: noticeSection.heading,
      body: noticeSection.body,
      position: noticeSection.position,
    })
    .from(noticeSection)
    .where(and(eq(noticeSection.versionId, versionId), eq(noticeSection.lang, lang)))
    .orderBy(asc(noticeSection.position));
}

/** Allocates the next human-facing notice ref via `ref_sequence`/`next_ref()`. */
export async function nextNoticeRefCode(tx: WorkspaceTx): Promise<string> {
  const rows = await tx.db.execute<{ code: string }>(sql`select next_ref('NTC') as code`);
  const code = rows[0]?.code;
  return code ?? 'NTC-000';
}

/** The values needed to create one notice row. */
export type NewNoticeValues = {
  refCode: string;
  name: string;
  custom: Record<string, unknown>;
};

/** Inserts a new notice and returns its id. */
export async function insertNotice(values: NewNoticeValues, tx: WorkspaceTx): Promise<string> {
  const rows = await tx.db.insert(notice).values(values).returning({ id: notice.id });
  const id = rows[0]?.id;
  return id ?? '';
}

/** The values needed to create one notice version. */
export type NewNoticeVersionValues = {
  noticeId: string;
  version: string;
  source: NoticeVersionSource;
  contentHash: Buffer;
};

/** Inserts a new version (draft) for a notice and returns its id. */
export async function insertNoticeVersion(
  values: NewNoticeVersionValues,
  tx: WorkspaceTx,
): Promise<string> {
  const rows = await tx.db.insert(noticeVersion).values(values).returning({ id: noticeVersion.id });
  const id = rows[0]?.id;
  return id ?? '';
}

/** Points `notice.current_version_id` at a version (set on create and on re-publish). */
export async function setNoticeCurrentVersion(
  noticeId: string,
  versionId: string,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.update(notice).set({ currentVersionId: versionId }).where(eq(notice.id, noticeId));
}

/** Flips a notice's status (and bumps `updated_at`). */
export async function updateNoticeStatus(
  noticeId: string,
  status: NoticeStatus,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.update(notice).set({ status, updatedAt: new Date() }).where(eq(notice.id, noticeId));
}

/** Renames a notice (and bumps `updated_at`). */
export async function updateNoticeName(
  noticeId: string,
  name: string,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.update(notice).set({ name, updatedAt: new Date() }).where(eq(notice.id, noticeId));
}

/** Marks a version's status (e.g. `published`) and its matching timestamp column. */
export async function markVersionStatus(
  versionId: string,
  status: 'published' | 'superseded',
  tx: WorkspaceTx,
): Promise<void> {
  const timestampPatch =
    status === 'published' ? { publishedAt: new Date() } : { supersededAt: new Date() };
  await tx.db
    .update(noticeVersion)
    .set({ status, ...timestampPatch })
    .where(eq(noticeVersion.id, versionId));
}

/** One section to write for a version. */
export type NewNoticeSectionValues = {
  versionId: string;
  lang: string;
  key: string;
  heading: string;
  body: string;
  position: number;
};

/** Writes a full set of sections for one (version, language) — insert-only, used on create. */
export async function insertNoticeSections(
  sections: readonly NewNoticeSectionValues[],
  tx: WorkspaceTx,
): Promise<void> {
  if (sections.length === 0) return;
  await tx.db.insert(noticeSection).values(
    sections.map((section) => ({
      versionId: section.versionId,
      lang: section.lang,
      sectionKey: section.key,
      heading: section.heading,
      body: section.body,
      position: section.position,
    })),
  );
}

/**
 * Overwrites every section of one (version, language) with `sections` — the FULL set,
 * never a partial patch, so an edit can never leave a stale section behind. Delete then
 * insert in the same transaction, matching `replaceRolePermissions`'s shape.
 */
export async function replaceNoticeSections(
  versionId: string,
  lang: string,
  sections: readonly NewNoticeSectionValues[],
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db
    .delete(noticeSection)
    .where(and(eq(noticeSection.versionId, versionId), eq(noticeSection.lang, lang)));
  await insertNoticeSections(sections, tx);
}
