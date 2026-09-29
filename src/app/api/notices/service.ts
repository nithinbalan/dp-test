/**
 * Business rules for the Notice Manager module (s.5 · Rule 3).
 *
 * Owns three decisions the repository deliberately does not: how a notice's eight
 * standard sections are drafted from a linked processing activity or free text (the
 * "Jethur AI" step — a deterministic template fill, not an external call), how
 * publishing bumps the version, and whether a notice's sections still carry
 * unresolved placeholders. Expected failures come back as `Result` —
 * see docs/ERROR_HANDLING.md §3.
 */
import { createHash } from 'node:crypto';
import { withWorkspace, type WorkspaceContext } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import { ACTIVITIES } from '@shared/mock/ropa';
import {
  findNoticeById,
  insertNotice,
  insertNoticeSections,
  insertNoticeVersion,
  listNotices,
  listVersionSections,
  markVersionStatus,
  nextNoticeRefCode,
  replaceNoticeSections,
  setNoticeCurrentVersion,
  updateNoticeName,
  updateNoticeStatus,
  type NewNoticeSectionValues,
} from './repository';
import {
  computeNoticeCheck,
  sectionsFromActivity,
  sectionsFromDescription,
  type NoticeCheck,
  type NoticeSection,
  type NoticeSectionKey,
  type NoticeSourceMetadata,
} from './templates';

export {
  computeNoticeCheck,
  type NoticeCheck,
  type NoticeSection,
  type NoticeSectionKey,
  type NoticeSourceMetadata,
};

/** One row of the Notices register. */
export type NoticeSummary = {
  id: string;
  refCode: string;
  name: string;
  version: string;
  status: 'draft' | 'published';
  updatedAt: string;
  language: string;
  activityName: string | null;
  activityRef?: string | null;
};

/** One notice, with its current sections and completeness check. */
export type NoticeDetail = NoticeSummary & {
  sections: NoticeSection[];
  check: NoticeCheck;
  source?: NoticeSourceMetadata | null;
};

/** What the client submits when the source is an approved RoPA activity. */
export type CreateFromActivityInput = { name: string; activityId: string };
/** What the client submits when there is no linked activity. */
export type CreateFromScratchInput = { name: string; description: string };

export type CreateNoticeError = 'VALIDATION_FAILED' | 'NOT_FOUND';
export type SaveNoticeError = 'VALIDATION_FAILED' | 'NOT_FOUND';
export type PublishNoticeError = 'NOT_FOUND';

const MAX_NAME_LENGTH = 200;
const BASE_LANG = 'en';

function hashSections(sections: readonly NoticeSection[]): Buffer {
  const joined = sections.map((section) => `${section.key}:${section.body}`).join('\n');
  return createHash('sha256').update(joined).digest();
}

/**
 * `notice.custom` is jsonb — untyped once it round-trips through Postgres. This is the
 * one place that reads the shape `createNotice` writes, rather than casting it inline
 * at every call site.
 */
function extractActivityName(custom: unknown): string | null {
  if (typeof custom !== 'object' || custom === null || !('sourceActivityName' in custom)) {
    return null;
  }
  const { sourceActivityName } = custom;
  return typeof sourceActivityName === 'string' ? sourceActivityName : null;
}

function extractActivityRef(custom: unknown): string | null {
  if (typeof custom !== 'object' || custom === null || !('sourceActivityId' in custom)) {
    return null;
  }
  const { sourceActivityId } = custom;
  return typeof sourceActivityId === 'string' ? sourceActivityId : null;
}

function extractSourceMetadata(custom: unknown): NoticeSourceMetadata | null {
  if (typeof custom !== 'object' || custom === null || !('sourceMetadata' in custom)) {
    return null;
  }
  const { sourceMetadata } = custom as { sourceMetadata?: unknown };
  if (!sourceMetadata || typeof sourceMetadata !== 'object') return null;
  return sourceMetadata as NoticeSourceMetadata;
}

function nextVersionString(current: string): string {
  const [majorRaw, minorRaw] = current.split('.');
  const major = Number(majorRaw ?? '1');
  const minor = Number(minorRaw ?? '0');
  return `${String(major)}.${String(Number.isFinite(minor) ? minor + 1 : 1)}`;
}

/** The register's KPIs and rows for the Notices page. */
export async function getNotices(
  ctx: WorkspaceContext,
): Promise<{ notices: NoticeSummary[]; publishedCount: number; draftCount: number }> {
  return withWorkspace(ctx, async (tx) => {
    const rows = await listNotices(tx);
    const notices: NoticeSummary[] = rows.map((row) => ({
      id: row.id,
      refCode: row.refCode,
      name: row.name,
      version: row.version ?? '1.0',
      status: row.status === 'published' ? 'published' : 'draft',
      updatedAt: row.updatedAt.toISOString(),
      language: BASE_LANG,
      activityName: extractActivityName(row.custom),
      activityRef: extractActivityRef(row.custom),
    }));
    return {
      notices,
      publishedCount: notices.filter((n) => n.status === 'published').length,
      draftCount: notices.filter((n) => n.status === 'draft').length,
    };
  });
}

/** One notice's current draft/published content, or `NOT_FOUND`. */
export async function getNotice(
  ctx: WorkspaceContext,
  id: string,
): Promise<Result<NoticeDetail, 'NOT_FOUND'>> {
  return withWorkspace(ctx, async (tx): Promise<Result<NoticeDetail, 'NOT_FOUND'>> => {
    const row = await findNoticeById(id, tx);
    if (!row?.currentVersionId) return err('NOT_FOUND');

    const sectionRows = await listVersionSections(row.currentVersionId, BASE_LANG, tx);
    const sections: NoticeSection[] = sectionRows.map((s) => ({
      key: s.key,
      heading: s.heading,
      body: s.body,
    }));

    return ok({
      id: row.id,
      refCode: row.refCode,
      name: row.name,
      version: row.version ?? '1.0',
      status: row.status === 'published' ? 'published' : 'draft',
      updatedAt: row.updatedAt.toISOString(),
      language: BASE_LANG,
      activityName: extractActivityName(row.custom),
      activityRef: extractActivityRef(row.custom),
      sections,
      check: computeNoticeCheck(sections),
      source: extractSourceMetadata(row.custom),
    });
  });
}

/** Shared create path once the section bodies are known — inserts notice + v1.0 + sections. */
async function createNotice(
  ctx: WorkspaceContext,
  name: string,
  sections: NoticeSection[],
  source: 'ai' | 'manual',
  custom: Record<string, unknown>,
): Promise<NoticeDetail> {
  return withWorkspace(ctx, async (tx) => {
    const refCode = await nextNoticeRefCode(tx);
    const noticeId = await insertNotice({ refCode, name, custom }, tx);
    const versionId = await insertNoticeVersion(
      { noticeId, version: '1.0', source, contentHash: hashSections(sections) },
      tx,
    );
    const sectionValues: NewNoticeSectionValues[] = sections.map((section, index) => ({
      versionId,
      lang: BASE_LANG,
      key: section.key,
      heading: section.heading,
      body: section.body,
      position: index,
    }));
    await insertNoticeSections(sectionValues, tx);
    await setNoticeCurrentVersion(noticeId, versionId, tx);

    return {
      id: noticeId,
      refCode,
      name,
      version: '1.0',
      status: 'draft',
      updatedAt: new Date().toISOString(),
      language: BASE_LANG,
      activityName: extractActivityName(custom),
      sections,
      check: computeNoticeCheck(sections),
    };
  });
}

/**
 * Creates a notice drafted from an approved RoPA activity. The activity is looked up
 * server-side from the (mock) RoPA register by id — never trusted from the request
 * body — so the generated sections always reflect what was actually recorded. RoPA has
 * no real backend yet (see the plan this module shipped against); `activityId` here is
 * a mock id, kept only in `custom` for display until RoPA is wired to real data.
 */
export async function createNoticeFromActivity(
  ctx: WorkspaceContext,
  input: CreateFromActivityInput,
): Promise<Result<NoticeDetail, CreateNoticeError>> {
  const name = input.name.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return err('VALIDATION_FAILED');

  const activity = ACTIVITIES.find((a) => a.id === input.activityId);
  if (!activity) return err('NOT_FOUND');

  const { sections, source } = sectionsFromActivity(activity);
  const notice = await createNotice(ctx, name, sections, 'ai', {
    sourceKind: 'ropa',
    sourceActivityId: activity.id,
    sourceActivityName: activity.name,
    sourceMetadata: source,
  });
  return ok(notice);
}

/** Creates a notice drafted from a free-text description, with no linked activity. */
export async function createNoticeFromScratch(
  ctx: WorkspaceContext,
  input: CreateFromScratchInput,
): Promise<Result<NoticeDetail, CreateNoticeError>> {
  const name = input.name.trim();
  const description = input.description.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH || description.length === 0) {
    return err('VALIDATION_FAILED');
  }

  const { sections } = sectionsFromDescription(description);
  const notice = await createNotice(ctx, name, sections, 'ai', { sourceKind: 'scratch' });
  return ok(notice);
}

/** Overwrites a notice's name and current-version sections — always edits the current
 * (draft or published) version in place, matching the prototype's always-editable doc;
 * a NEW version is only ever created by {@link publishNotice} on a re-publish. */
export async function saveNotice(
  ctx: WorkspaceContext,
  id: string,
  input: { name: string; sections: readonly NoticeSection[] },
): Promise<Result<NoticeDetail, SaveNoticeError>> {
  const name = input.name.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return err('VALIDATION_FAILED');

  return withWorkspace(ctx, async (tx): Promise<Result<NoticeDetail, SaveNoticeError>> => {
    const row = await findNoticeById(id, tx);
    if (!row?.currentVersionId) return err('NOT_FOUND');
    const currentVersionId = row.currentVersionId;

    const sectionValues: NewNoticeSectionValues[] = input.sections.map((section, index) => ({
      versionId: currentVersionId,
      lang: BASE_LANG,
      key: section.key,
      heading: section.heading,
      body: section.body,
      position: index,
    }));
    await replaceNoticeSections(currentVersionId, BASE_LANG, sectionValues, tx);
    await updateNoticeName(id, name, tx);

    const sections = [...input.sections];
    return ok({
      id,
      refCode: row.refCode,
      name,
      version: row.version ?? '1.0',
      status: row.status === 'published' ? 'published' : 'draft',
      updatedAt: new Date().toISOString(),
      language: BASE_LANG,
      activityName: extractActivityName(row.custom),
      sections,
      check: computeNoticeCheck(sections),
    });
  });
}

/**
 * Publishes a notice. The first publish just flips the current (draft) version and the
 * notice to `published`. A later re-publish bumps the version string ('1.0'→'1.1'),
 * marks the previous version `superseded`, and copies the current sections into a new
 * version row — matching the prototype's version-bump-on-republish.
 */
export async function publishNotice(
  ctx: WorkspaceContext,
  id: string,
): Promise<Result<NoticeDetail, PublishNoticeError>> {
  return withWorkspace(ctx, async (tx): Promise<Result<NoticeDetail, PublishNoticeError>> => {
    const row = await findNoticeById(id, tx);
    if (!row?.currentVersionId) return err('NOT_FOUND');

    const sectionRows = await listVersionSections(row.currentVersionId, BASE_LANG, tx);
    const sections: NoticeSection[] = sectionRows.map((s) => ({
      key: s.key,
      heading: s.heading,
      body: s.body,
    }));

    let publishedVersion = row.version ?? '1.0';

    if (row.status !== 'published') {
      await markVersionStatus(row.currentVersionId, 'published', tx);
    } else {
      publishedVersion = nextVersionString(row.version ?? '1.0');
      await markVersionStatus(row.currentVersionId, 'superseded', tx);
      const newVersionId = await insertNoticeVersion(
        {
          noticeId: id,
          version: publishedVersion,
          source: 'manual',
          contentHash: hashSections(sections),
        },
        tx,
      );
      const sectionValues: NewNoticeSectionValues[] = sections.map((section, index) => ({
        versionId: newVersionId,
        lang: BASE_LANG,
        key: section.key,
        heading: section.heading,
        body: section.body,
        position: index,
      }));
      await insertNoticeSections(sectionValues, tx);
      await markVersionStatus(newVersionId, 'published', tx);
      await setNoticeCurrentVersion(id, newVersionId, tx);
    }
    await updateNoticeStatus(id, 'published', tx);

    return ok({
      id,
      refCode: row.refCode,
      name: row.name,
      version: publishedVersion,
      status: 'published',
      updatedAt: new Date().toISOString(),
      language: BASE_LANG,
      activityName: extractActivityName(row.custom),
      sections,
      check: computeNoticeCheck(sections),
    });
  });
}
