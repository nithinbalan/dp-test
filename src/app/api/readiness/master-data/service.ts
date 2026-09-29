/**
 * Business rules for Configuration Studio's "Master Data" panel — adding,
 * renaming and removing the Gap Assessment questionnaire's sections and
 * questions. Split out from `service.ts` (the wizard/scoring engine): this is
 * admin CRUD, not run-time scoring, and `service.ts` was already trending
 * toward the file-size limit.
 */
import { withWorkspace, type WorkspaceContext } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import { findGapQuestionnaire, type DomainRow } from '../repository';
import {
  countAnswersForQuestion,
  countQuestionsInDomain,
  deleteDomain,
  deleteQuestion,
  findDomainById,
  findQuestionById,
  insertDomain,
  insertQuestion,
  listDomainKeys,
  listDomainsForSettings,
  listQuestionCodes,
  listQuestionsForDomain,
  renameDomain,
  updateQuestion,
  type DomainListRow,
  type MasterQuestionRow,
} from './repository';

const MAX_NAME_LENGTH = 120;
const MAX_PROMPT_LENGTH = 500;
const MAX_REMEDY_LENGTH = 2000;
const MAX_SECTION_REF_LENGTH = 40;

/** Derives a stable internal key/code from a name (Configuration Studio only
 * ever collects the name) — lowercase, hyphenated, disambiguated against
 * every value already taken so the table's unique constraint never rejects it. */
function slugify(name: string, taken: ReadonlySet<string>, fallback: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const root = base.length > 0 ? base : fallback;
  let candidate = root;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${root}-${String(suffix)}`;
    suffix += 1;
  }
  return candidate;
}

// ---------------------------------------------------------------------------
// Sections (domains)
// ---------------------------------------------------------------------------

export type CreateDomainError = 'VALIDATION_FAILED';

/**
 * Adds a new, empty section to the workspace's Gap Assessment questionnaire —
 * a shell with no gate and no questions yet, appended after every existing
 * one. Mirrors Departments' "type it once" pattern: this is the one place a
 * section name is created; the wizard reads the same `question_domain` rows
 * this writes to, so a new section shows up as its own step immediately.
 */
export async function createDomain(
  ctx: WorkspaceContext,
  name: string,
): Promise<Result<DomainRow, CreateDomainError>> {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return err('VALIDATION_FAILED');

  return withWorkspace(ctx, async (tx) => {
    const questionnaireRow = await findGapQuestionnaire(tx);
    if (!questionnaireRow) return err('VALIDATION_FAILED');
    const taken = await listDomainKeys(questionnaireRow.id, tx);
    const key = slugify(trimmed, taken, 'section');
    return ok(await insertDomain(questionnaireRow.id, key, trimmed, tx));
  });
}

/** Every section with its question count — Configuration Studio's Master
 * Data list. Empty when the workspace has no Gap Assessment questionnaire. */
export async function getDomainsForSettings(ctx: WorkspaceContext): Promise<DomainListRow[]> {
  return withWorkspace(ctx, async (tx) => {
    const questionnaireRow = await findGapQuestionnaire(tx);
    if (!questionnaireRow) return [];
    return listDomainsForSettings(questionnaireRow.id, tx);
  });
}

export type UpdateDomainError = 'VALIDATION_FAILED' | 'NOT_FOUND';

/** Renames a section and sets its active flag. The internal key never
 * changes — only questions and gates reference it, and neither is exposed to
 * Configuration Studio. */
export async function updateDomain(
  ctx: WorkspaceContext,
  id: string,
  name: string,
  isActive: boolean,
): Promise<Result<DomainRow, UpdateDomainError>> {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return err('VALIDATION_FAILED');

  return withWorkspace(ctx, async (tx) => {
    const existing = await findDomainById(id, tx);
    if (!existing) return err('NOT_FOUND');
    return ok(await renameDomain(id, trimmed, isActive, tx));
  });
}

export type DeleteDomainError = 'NOT_FOUND' | 'CONFLICT';

/** Deletes a section. Refuses while it still owns any question — removing
 * those (and any answers/history already recorded against them) is a
 * separate, explicit step, not a side effect of deleting the section. */
export async function removeDomain(
  ctx: WorkspaceContext,
  id: string,
): Promise<Result<true, DeleteDomainError>> {
  return withWorkspace(ctx, async (tx) => {
    const existing = await findDomainById(id, tx);
    if (!existing) return err('NOT_FOUND');
    if ((await countQuestionsInDomain(id, tx)) > 0) return err('CONFLICT');
    await deleteDomain(id, tx);
    return ok(true as const);
  });
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export type QuestionInput = {
  domainId: string;
  prompt: string;
  weight: number;
  sectionRef?: string | undefined;
  remedy?: string | undefined;
};

function isValidWeight(weight: number): boolean {
  return Number.isInteger(weight) && weight >= 1 && weight <= 3;
}

function normalizeQuestionInput(
  input: QuestionInput,
): { prompt: string; weight: number; sectionRef: string | null; remedy: string } | null {
  const prompt = input.prompt.trim();
  if (prompt.length === 0 || prompt.length > MAX_PROMPT_LENGTH) return null;
  if (!isValidWeight(input.weight)) return null;

  const sectionRef = input.sectionRef?.trim() ?? '';
  if (sectionRef.length > MAX_SECTION_REF_LENGTH) return null;

  const remedy = input.remedy?.trim() ?? '';
  if (remedy.length > MAX_REMEDY_LENGTH) return null;

  return { prompt, weight: input.weight, sectionRef: sectionRef || null, remedy };
}

export type CreateQuestionError = 'VALIDATION_FAILED' | 'NOT_FOUND';

/**
 * Adds a new, admin-authored question to a section — the piece that makes a
 * Master-Data-created section into a real, answerable step: the wizard reads
 * the same `question` rows this writes to, grouped by `domainId`.
 */
export async function createQuestion(
  ctx: WorkspaceContext,
  input: QuestionInput,
): Promise<Result<MasterQuestionRow, CreateQuestionError>> {
  const normalized = normalizeQuestionInput(input);
  if (!normalized) return err('VALIDATION_FAILED');

  return withWorkspace(ctx, async (tx) => {
    const domain = await findDomainById(input.domainId, tx);
    if (!domain) return err('NOT_FOUND');
    const questionnaireRow = await findGapQuestionnaire(tx);
    if (!questionnaireRow) return err('NOT_FOUND');
    const taken = await listQuestionCodes(questionnaireRow.id, tx);
    const code = slugify(`${domain.key}-${normalized.prompt}`, taken, `${domain.key}-q`);
    return ok(
      await insertQuestion(
        questionnaireRow.id,
        input.domainId,
        code,
        normalized.prompt,
        normalized.weight,
        normalized.sectionRef,
        normalized.remedy,
        tx,
      ),
    );
  });
}

/** Every question in one section, in position order — Configuration Studio's
 * per-section question list. */
export async function getQuestionsForDomain(
  ctx: WorkspaceContext,
  domainId: string,
): Promise<MasterQuestionRow[]> {
  return withWorkspace(ctx, (tx) => listQuestionsForDomain(domainId, tx));
}

export type UpdateQuestionError = 'VALIDATION_FAILED' | 'NOT_FOUND';

/** Updates a question's editable fields. Its code and section never move —
 * answers already recorded reference the question by id, not by those. */
export async function updateQuestionDetails(
  ctx: WorkspaceContext,
  id: string,
  input: Omit<QuestionInput, 'domainId'>,
): Promise<Result<MasterQuestionRow, UpdateQuestionError>> {
  const normalized = normalizeQuestionInput({ ...input, domainId: '' });
  if (!normalized) return err('VALIDATION_FAILED');

  return withWorkspace(ctx, async (tx) => {
    const existing = await findQuestionById(id, tx);
    if (!existing) return err('NOT_FOUND');
    return ok(
      await updateQuestion(
        id,
        normalized.prompt,
        normalized.weight,
        normalized.sectionRef,
        normalized.remedy,
        tx,
      ),
    );
  });
}

export type DeleteQuestionError = 'NOT_FOUND' | 'CONFLICT';

/** Deletes a question. Refuses once any run has answered it — that answer is
 * part of a completed or in-progress run's history and can't be orphaned. */
export async function removeQuestion(
  ctx: WorkspaceContext,
  id: string,
): Promise<Result<true, DeleteQuestionError>> {
  return withWorkspace(ctx, async (tx) => {
    const existing = await findQuestionById(id, tx);
    if (!existing) return err('NOT_FOUND');
    if ((await countAnswersForQuestion(id, tx)) > 0) return err('CONFLICT');
    await deleteQuestion(id, tx);
    return ok(true as const);
  });
}
