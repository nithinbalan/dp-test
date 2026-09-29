/**
 * Pure data access for Configuration Studio's "Master Data" panel — the Gap
 * Assessment questionnaire's sections and questions, authored by an admin
 * rather than seeded. Same `WorkspaceTx`-only rule as `../repository.ts`;
 * split into its own module (ADR-0007: colocated with its own routes,
 * `master-data/domains/**`) because it's a different concern — admin CRUD —
 * from the wizard/scoring engine `../repository.ts` and `../service.ts` own,
 * which were already trending toward the line-count limit.
 */
import { asc, eq, sql } from 'drizzle-orm';
import { assessmentAnswer, question, questionDomain } from '@server/db';
import type { WorkspaceTx } from '@server/workspace';
import type { DomainRow } from '../repository';

/** Every domain key already taken in this questionnaire — so a new one can be
 * disambiguated before the unique constraint would reject it. */
export async function listDomainKeys(
  questionnaireId: string,
  tx: WorkspaceTx,
): Promise<Set<string>> {
  const rows = await tx.db
    .select({ key: questionDomain.key })
    .from(questionDomain)
    .where(eq(questionDomain.questionnaireId, questionnaireId));
  return new Set(rows.map((r) => r.key));
}

const DOMAIN_COLUMNS = {
  id: questionDomain.id,
  key: questionDomain.key,
  name: questionDomain.name,
  sectionRefs: questionDomain.sectionRefs,
  moduleKey: questionDomain.moduleKey,
  gateKey: questionDomain.gateKey,
  position: questionDomain.position,
  isActive: questionDomain.isActive,
} as const;

/** Appends a new domain after every existing one — a freshly added section
 * starts with no questions and no gate; it's a shell an admin fills in later. */
export async function insertDomain(
  questionnaireId: string,
  key: string,
  name: string,
  tx: WorkspaceTx,
): Promise<DomainRow> {
  const positionRows = await tx.db
    .select({ nextPosition: sql<number>`coalesce(max(${questionDomain.position}), -1) + 1` })
    .from(questionDomain)
    .where(eq(questionDomain.questionnaireId, questionnaireId));
  const nextPosition = positionRows[0]?.nextPosition ?? 0;

  const rows = await tx.db
    .insert(questionDomain)
    .values({ questionnaireId, key, name, position: nextPosition })
    .returning(DOMAIN_COLUMNS);
  const row = rows[0];
  return (
    row ?? {
      id: '',
      key,
      name,
      sectionRefs: [],
      moduleKey: null,
      gateKey: null,
      position: 0,
      isActive: true,
    }
  );
}

/** One domain by id, or null — used to confirm it exists before rename/delete. */
export async function findDomainById(id: string, tx: WorkspaceTx): Promise<DomainRow | null> {
  const rows = await tx.db
    .select(DOMAIN_COLUMNS)
    .from(questionDomain)
    .where(eq(questionDomain.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Renames a domain and sets its active flag (its display name and status
 * only — `key` never changes once minted, since it's what gates/questions
 * reference internally). */
export async function renameDomain(
  id: string,
  name: string,
  isActive: boolean,
  tx: WorkspaceTx,
): Promise<DomainRow> {
  const rows = await tx.db
    .update(questionDomain)
    .set({ name, isActive })
    .where(eq(questionDomain.id, id))
    .returning(DOMAIN_COLUMNS);
  const row = rows[0];
  return (
    row ?? {
      id,
      key: '',
      name,
      sectionRefs: [],
      moduleKey: null,
      gateKey: null,
      position: 0,
      isActive,
    }
  );
}

/** How many questions this domain already owns — a non-zero count is why
 * `deleteDomain` refuses: those questions' answers/history would go with it. */
export async function countQuestionsInDomain(domainId: string, tx: WorkspaceTx): Promise<number> {
  const rows = await tx.db
    .select({ count: sql<number>`count(*)` })
    .from(question)
    .where(eq(question.domainId, domainId));
  return rows[0]?.count ?? 0;
}

export async function deleteDomain(id: string, tx: WorkspaceTx): Promise<void> {
  await tx.db.delete(questionDomain).where(eq(questionDomain.id, id));
}

export type DomainListRow = {
  id: string;
  name: string;
  questionCount: number;
  isActive: boolean;
};

/** Every domain with how many questions it owns — Configuration Studio's
 * Master Data list, not the wizard's own catalog load (see `repository.ts`'s
 * `listDomains`). Deliberately unfiltered by `is_active` — this admin list
 * has to show a deactivated section (to let it be reactivated), unlike the
 * wizard's own read. */
export async function listDomainsForSettings(
  questionnaireId: string,
  tx: WorkspaceTx,
): Promise<DomainListRow[]> {
  return tx.db
    .select({
      id: questionDomain.id,
      name: questionDomain.name,
      questionCount: sql<number>`count(${question.id})`,
      isActive: questionDomain.isActive,
    })
    .from(questionDomain)
    .leftJoin(question, eq(question.domainId, questionDomain.id))
    .where(eq(questionDomain.questionnaireId, questionnaireId))
    .groupBy(questionDomain.id)
    .orderBy(asc(questionDomain.position));
}

// ---------------------------------------------------------------------------
// Questions — one section's question list, authored the same way.
// ---------------------------------------------------------------------------

export type MasterQuestionRow = {
  id: string;
  domainId: string;
  code: string;
  weight: number;
  sectionRef: string | null;
  prompt: string;
  remedy: string;
  position: number;
};

const QUESTION_COLUMNS = {
  id: question.id,
  domainId: question.domainId,
  code: question.code,
  weight: question.weight,
  sectionRef: question.sectionRef,
  prompt: question.prompt,
  remedy: question.remedy,
  position: question.position,
} as const;

/** Every question code already taken in this questionnaire — codes are
 * globally unique per questionnaire, not just per domain. */
export async function listQuestionCodes(
  questionnaireId: string,
  tx: WorkspaceTx,
): Promise<Set<string>> {
  const rows = await tx.db
    .select({ code: question.code })
    .from(question)
    .where(eq(question.questionnaireId, questionnaireId));
  return new Set(rows.map((r) => r.code));
}

/** Every question in one domain, in position order — the section's own
 * question list in Configuration Studio. */
export async function listQuestionsForDomain(
  domainId: string,
  tx: WorkspaceTx,
): Promise<MasterQuestionRow[]> {
  return tx.db
    .select(QUESTION_COLUMNS)
    .from(question)
    .where(eq(question.domainId, domainId))
    .orderBy(asc(question.position));
}

/** Appends a new, admin-authored question to a domain (`is_custom = true`,
 * `answer_set` left at its default `'ynpu'` — every question in this
 * questionnaire answers the same Yes/Partly/No/Not-sure way). */
export async function insertQuestion(
  questionnaireId: string,
  domainId: string,
  code: string,
  prompt: string,
  weight: number,
  sectionRef: string | null,
  remedy: string,
  tx: WorkspaceTx,
): Promise<MasterQuestionRow> {
  const positionRows = await tx.db
    .select({ nextPosition: sql<number>`coalesce(max(${question.position}), -1) + 1` })
    .from(question)
    .where(eq(question.domainId, domainId));
  const nextPosition = positionRows[0]?.nextPosition ?? 0;

  const rows = await tx.db
    .insert(question)
    .values({
      questionnaireId,
      domainId,
      code,
      prompt,
      weight,
      sectionRef,
      remedy,
      isCustom: true,
      position: nextPosition,
    })
    .returning(QUESTION_COLUMNS);
  const row = rows[0];
  return (
    row ?? {
      id: '',
      domainId,
      code,
      weight,
      sectionRef,
      prompt,
      remedy,
      position: nextPosition,
    }
  );
}

/** One question by id, or null — used to confirm it exists before rename/delete. */
export async function findQuestionById(
  id: string,
  tx: WorkspaceTx,
): Promise<MasterQuestionRow | null> {
  const rows = await tx.db
    .select(QUESTION_COLUMNS)
    .from(question)
    .where(eq(question.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Updates a question's editable fields. `code`/`domainId` never change —
 * answers already recorded reference this row by id, not by those fields. */
export async function updateQuestion(
  id: string,
  prompt: string,
  weight: number,
  sectionRef: string | null,
  remedy: string,
  tx: WorkspaceTx,
): Promise<MasterQuestionRow> {
  const rows = await tx.db
    .update(question)
    .set({ prompt, weight, sectionRef, remedy })
    .where(eq(question.id, id))
    .returning(QUESTION_COLUMNS);
  const row = rows[0];
  return row ?? { id, domainId: '', code: '', weight, sectionRef, prompt, remedy, position: 0 };
}

/** How many answers already recorded against this question — a non-zero
 * count is why `deleteQuestion` refuses: those answers are part of a run's
 * history and can't be silently orphaned. */
export async function countAnswersForQuestion(
  questionId: string,
  tx: WorkspaceTx,
): Promise<number> {
  const rows = await tx.db
    .select({ count: sql<number>`count(*)` })
    .from(assessmentAnswer)
    .where(eq(assessmentAnswer.questionId, questionId));
  return rows[0]?.count ?? 0;
}

export async function deleteQuestion(id: string, tx: WorkspaceTx): Promise<void> {
  await tx.db.delete(question).where(eq(question.id, id));
}
