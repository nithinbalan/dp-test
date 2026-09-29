/**
 * Pure data access for the Gap Assessment module. No business rules — scoring,
 * severity, and band derivation all live in `service.ts`. See
 * docs/ARCHITECTURE.md "Layering (server)".
 *
 * Every query takes a {@link WorkspaceTx} and never opens its own connection —
 * the service opens one with `withWorkspace()`. See docs/WORKSPACE_ISOLATION.md §5.
 */
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import {
  assessmentAnswer,
  assessmentDomainScore,
  assessmentRun,
  employee,
  question,
  questionDomain,
  questionnaire,
  type AssessmentAnswerValue,
  type AssessmentRunStatus,
} from '@server/db';
import type { WorkspaceTx } from '@server/workspace';

/** Whether an employee id names a live employee in THIS workspace — same check
 * `@api/employees`'s own repository makes before storing an owner reference. */
export async function employeeExists(employeeId: string, tx: WorkspaceTx): Promise<boolean> {
  const rows = await tx.db
    .select({ id: employee.id })
    .from(employee)
    .where(and(eq(employee.id, employeeId), isNull(employee.deletedAt)))
    .limit(1);
  return rows.length > 0;
}

/** The one published Gap Assessment questionnaire this workspace runs. */
export type QuestionnaireRow = { id: string; version: number };

/** Only one questionnaire of kind `'gap'` is expected per workspace — the
 * one `tooling/scripts/lib/gap-assessment-seed.ts` copies in at provisioning. */
export async function findGapQuestionnaire(tx: WorkspaceTx): Promise<QuestionnaireRow | null> {
  const rows = await tx.db
    .select({ id: questionnaire.id, version: questionnaire.version })
    .from(questionnaire)
    .where(and(eq(questionnaire.kind, 'gap'), eq(questionnaire.status, 'published')))
    .limit(1);
  return rows[0] ?? null;
}

export type DomainRow = {
  id: string;
  key: string;
  name: string;
  sectionRefs: string[];
  moduleKey: string | null;
  gateKey: string | null;
  position: number;
  isActive: boolean;
};

/** Active domains only — one an admin deactivates in Configuration Studio's
 * Master Data drops out of the wizard, the score, and the report entirely,
 * not just the picker it also feeds. It stays in the DB (and in that admin
 * list) so history isn't lost, only stops being offered/counted. */
export async function listDomains(questionnaireId: string, tx: WorkspaceTx): Promise<DomainRow[]> {
  return tx.db
    .select({
      id: questionDomain.id,
      key: questionDomain.key,
      name: questionDomain.name,
      sectionRefs: questionDomain.sectionRefs,
      moduleKey: questionDomain.moduleKey,
      gateKey: questionDomain.gateKey,
      position: questionDomain.position,
      isActive: questionDomain.isActive,
    })
    .from(questionDomain)
    .where(
      and(eq(questionDomain.questionnaireId, questionnaireId), eq(questionDomain.isActive, true)),
    )
    .orderBy(asc(questionDomain.position));
}

export type QuestionRow = {
  id: string;
  domainId: string;
  code: string;
  weight: number;
  sectionRef: string | null;
  prompt: string;
  remedy: string;
  moduleKey: string | null;
  position: number;
};

/** Questions from active domains only. `question` carries no `is_active` of
 * its own — deactivating a section (see `listDomains`) must still pull its
 * questions out of scope, or an orphaned question whose domain the catalog no
 * longer lists would read as ungated ("always active") instead of dropped. */
export async function listQuestions(
  questionnaireId: string,
  tx: WorkspaceTx,
): Promise<QuestionRow[]> {
  return tx.db
    .select({
      id: question.id,
      domainId: question.domainId,
      code: question.code,
      weight: question.weight,
      sectionRef: question.sectionRef,
      prompt: question.prompt,
      remedy: question.remedy,
      moduleKey: question.moduleKey,
      position: question.position,
    })
    .from(question)
    .innerJoin(questionDomain, eq(questionDomain.id, question.domainId))
    .where(and(eq(question.questionnaireId, questionnaireId), eq(questionDomain.isActive, true)))
    .orderBy(asc(question.position));
}

export type RunRow = {
  id: string;
  refCode: string;
  status: AssessmentRunStatus;
  profile: unknown;
  scorePct: string | null;
  band: string | null;
  startedAt: Date;
  completedAt: Date | null;
};

export async function findActiveRun(
  questionnaireId: string,
  tx: WorkspaceTx,
): Promise<RunRow | null> {
  const rows = await tx.db
    .select({
      id: assessmentRun.id,
      refCode: assessmentRun.refCode,
      status: assessmentRun.status,
      profile: assessmentRun.profile,
      scorePct: assessmentRun.scorePct,
      band: assessmentRun.band,
      startedAt: assessmentRun.startedAt,
      completedAt: assessmentRun.completedAt,
    })
    .from(assessmentRun)
    .where(
      and(
        eq(assessmentRun.questionnaireId, questionnaireId),
        eq(assessmentRun.status, 'in_progress'),
      ),
    )
    .orderBy(sql`${assessmentRun.startedAt} desc`)
    .limit(1);
  return rows[0] ?? null;
}

export async function findLatestCompletedRun(
  questionnaireId: string,
  tx: WorkspaceTx,
): Promise<RunRow | null> {
  const rows = await tx.db
    .select({
      id: assessmentRun.id,
      refCode: assessmentRun.refCode,
      status: assessmentRun.status,
      profile: assessmentRun.profile,
      scorePct: assessmentRun.scorePct,
      band: assessmentRun.band,
      startedAt: assessmentRun.startedAt,
      completedAt: assessmentRun.completedAt,
    })
    .from(assessmentRun)
    .where(
      and(
        eq(assessmentRun.questionnaireId, questionnaireId),
        eq(assessmentRun.status, 'completed'),
      ),
    )
    .orderBy(sql`${assessmentRun.completedAt} desc`)
    .limit(1);
  return rows[0] ?? null;
}

export async function findRun(runId: string, tx: WorkspaceTx): Promise<RunRow | null> {
  const rows = await tx.db
    .select({
      id: assessmentRun.id,
      refCode: assessmentRun.refCode,
      status: assessmentRun.status,
      profile: assessmentRun.profile,
      scorePct: assessmentRun.scorePct,
      band: assessmentRun.band,
      startedAt: assessmentRun.startedAt,
      completedAt: assessmentRun.completedAt,
    })
    .from(assessmentRun)
    .where(eq(assessmentRun.id, runId))
    .limit(1);
  return rows[0] ?? null;
}

/** `next_ref('GAP')` — the same per-workspace counter every other human-facing id uses. */
export async function nextAssessmentRunCode(tx: WorkspaceTx): Promise<string> {
  const rows = await tx.db.execute<{ code: string }>(sql`select next_ref('GAP') as code`);
  return rows[0]?.code ?? 'GAP-000';
}

export type NewRunValues = {
  refCode: string;
  questionnaireId: string;
  questionnaireVersion: number;
  profile: Record<string, unknown>;
  assessorEmployeeId: string | null;
};

export async function insertRun(values: NewRunValues, tx: WorkspaceTx): Promise<string> {
  const rows = await tx.db.insert(assessmentRun).values(values).returning({ id: assessmentRun.id });
  return rows[0]?.id ?? '';
}

export async function updateRunProfile(
  runId: string,
  profile: Record<string, unknown>,
  assessorEmployeeId: string | null,
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db
    .update(assessmentRun)
    .set({ profile, assessorEmployeeId })
    .where(eq(assessmentRun.id, runId));
}

export async function completeRun(
  runId: string,
  values: { scorePct: number; band: string; completedAt: Date },
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db
    .update(assessmentRun)
    .set({
      status: 'completed',
      scorePct: values.scorePct.toFixed(2),
      band: values.band,
      completedAt: values.completedAt,
    })
    .where(eq(assessmentRun.id, runId));
}

export type AnswerRow = {
  questionId: string;
  answer: AssessmentAnswerValue;
  note: string | null;
};

export async function listAnswers(runId: string, tx: WorkspaceTx): Promise<AnswerRow[]> {
  return tx.db
    .select({
      questionId: assessmentAnswer.questionId,
      answer: assessmentAnswer.answer,
      note: assessmentAnswer.note,
    })
    .from(assessmentAnswer)
    .where(eq(assessmentAnswer.runId, runId));
}

export async function upsertAnswer(
  runId: string,
  questionId: string,
  answer: AssessmentAnswerValue,
  tx: WorkspaceTx,
  // `undefined` leaves an existing note untouched (the profile/answer patch
  // didn't touch it); `null` clears it. Only `upsertAnswer`'s caller — one
  // PATCH body — decides which, so there's no separate "update note" path.
  note?: string | null,
): Promise<void> {
  await tx.db
    .insert(assessmentAnswer)
    .values({ runId, questionId, answer, note: note ?? null })
    .onConflictDoUpdate({
      target: [assessmentAnswer.runId, assessmentAnswer.questionId],
      set:
        note === undefined
          ? { answer, answeredAt: new Date() }
          : { answer, note, answeredAt: new Date() },
    });
}

export type DomainScoreValues = {
  runId: string;
  domainId: string;
  earned: number;
  possible: number;
  band: string;
  applicable: boolean;
};

export async function replaceDomainScores(
  runId: string,
  scores: readonly DomainScoreValues[],
  tx: WorkspaceTx,
): Promise<void> {
  await tx.db.delete(assessmentDomainScore).where(eq(assessmentDomainScore.runId, runId));
  if (scores.length === 0) return;
  await tx.db.insert(assessmentDomainScore).values(
    scores.map((s) => ({
      runId: s.runId,
      domainId: s.domainId,
      earned: s.earned.toFixed(2),
      possible: s.possible.toFixed(2),
      band: s.band,
      applicable: s.applicable,
    })),
  );
}

export type DomainScoreRow = {
  domainId: string;
  earned: string;
  possible: string;
  applicable: boolean;
};

export async function listDomainScores(runId: string, tx: WorkspaceTx): Promise<DomainScoreRow[]> {
  return tx.db
    .select({
      domainId: assessmentDomainScore.domainId,
      earned: assessmentDomainScore.earned,
      possible: assessmentDomainScore.possible,
      applicable: assessmentDomainScore.applicable,
    })
    .from(assessmentDomainScore)
    .where(eq(assessmentDomainScore.runId, runId));
}
