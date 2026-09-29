/**
 * Business rules for the Gap Assessment module (JDP-GAP) — scoring, severity,
 * domain gating, and the readiness bands. Ported from the prototype's
 * `gaCompute()`/`gaSev()`/`gaBand()` (see the module's original mock,
 * `@shared/mock/assessment`'s git history, for the line-by-line source).
 *
 * A run is append-only once completed (`completeRun` never runs twice on the
 * same row) — "Re-assess" starts a new run, it never edits history. Every
 * read and write runs inside one `withWorkspace()` transaction.
 */
import { withWorkspace, type WorkspaceContext, type WorkspaceTx } from '@server/workspace';
import { err, ok, type Result } from '@shared/lib/result';
import {
  completeRun,
  employeeExists,
  findActiveRun,
  findGapQuestionnaire,
  findLatestCompletedRun,
  findRun,
  insertRun,
  listAnswers,
  listDomains,
  listDomainScores,
  listQuestions,
  nextAssessmentRunCode,
  replaceDomainScores,
  updateRunProfile,
  upsertAnswer,
  type AnswerRow,
  type DomainRow,
  type QuestionRow,
  type RunRow,
} from './repository';

export type AnswerValue = 'y' | 'n' | 'p' | 'u';
export type GateAnswer = 'yes' | 'no' | 'unsure';

export type AssessmentProfile = {
  entity: string;
  assessorEmployeeId: string | null;
  sector: string;
  recordsHeld: string;
  kids: GateAnswer | null;
  proc: GateAnswer | null;
  xbt: GateAnswer | null;
  sens: GateAnswer | null;
};

const EMPTY_PROFILE: AssessmentProfile = {
  entity: '',
  assessorEmployeeId: null,
  sector: '',
  recordsHeld: '',
  kids: null,
  proc: null,
  xbt: null,
  sens: null,
};

function isProfileComplete(profile: AssessmentProfile): boolean {
  return (
    profile.kids !== null && profile.proc !== null && profile.xbt !== null && profile.sens !== null
  );
}

function parseProfile(raw: unknown): AssessmentProfile {
  return { ...EMPTY_PROFILE, ...(raw as Partial<AssessmentProfile>) };
}

function isQuestionActive(
  question: QuestionRow,
  domainsById: Map<string, DomainRow>,
  profile: AssessmentProfile,
): boolean {
  const domain = domainsById.get(question.domainId);
  const gate = domain?.gateKey;
  if (!gate) return true;
  return profile[gate as keyof AssessmentProfile] !== 'no';
}

const ANSWER_POINTS: Record<AnswerValue, number> = { y: 100, p: 50, n: 0, u: 0 };

export type GapSeverity = 'c' | 'h' | 'm' | 'l';
const SEVERITY_ORDER: Record<GapSeverity, number> = { c: 0, h: 1, m: 2, l: 3 };

function severityFor(weight: number, answer: AnswerValue): GapSeverity | null {
  if (answer === 'y') return null;
  const failed = answer !== 'p';
  if (weight === 3) return failed ? 'c' : 'h';
  if (weight === 2) return failed ? 'h' : 'm';
  return failed ? 'm' : 'l';
}

export type ScoreBandKey = 'ready' | 'substantial' | 'developing' | 'high-exposure';

export type ScoreBand = { key: ScoreBandKey; headline: string; body: string };

/** `gaBand()` — the four readiness bands, verbatim headline/body copy from the prototype. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 85) {
    return {
      key: 'ready',
      headline: 'Substantially ready for the DPDP Act',
      body: 'The obligations that carry the heaviest penalties are covered. What is left is evidence and upkeep — keep the record current and re-assess each quarter.',
    };
  }
  if (score >= 65) {
    return {
      key: 'substantial',
      headline: 'Substantial progress, real gaps remain',
      body: 'The foundations are in place, but specific duties are unmet. Close the critical items below and you move into the ready band.',
    };
  }
  if (score >= 40) {
    return {
      key: 'developing',
      headline: 'Developing — several statutory duties are unmet',
      body: 'Enough is in place to build on, but a data principal exercising a right, or the Board asking a question today, would find gaps you cannot evidence.',
    };
  }
  return {
    key: 'high-exposure',
    headline: 'High exposure — core duties are not yet met',
    body: 'Most of the Act’s core obligations are unmet or unevidenced. Work top-down through the critical gaps below; each one maps to a module that produces the evidence for you.',
  };
}

export type DomainResult = {
  key: string;
  name: string;
  sectionRefs: string[];
  isNotApplicable: boolean;
  percent: number | null;
  gapCount: number;
  questionCount: number;
};

export type Gap = {
  questionId: string;
  code: string;
  domainKey: string;
  domainName: string;
  weight: number;
  sectionRef: string | null;
  question: string;
  fix: string;
  module: string | null;
  severity: GapSeverity;
  answer: AnswerValue;
  isUnsure: boolean;
};

export type AssessmentReport = {
  runId: string;
  refCode: string;
  score: number;
  band: ScoreBand;
  domains: DomainResult[];
  gaps: Gap[];
  criticalCount: number;
  unsureCount: number;
  questionsInScope: number;
  notApplicableCount: number;
  entity: string;
  completedAt: string;
};

type Catalog = {
  domains: DomainRow[];
  questions: QuestionRow[];
  domainsById: Map<string, DomainRow>;
};

async function loadCatalog(questionnaireId: string, tx: WorkspaceTx): Promise<Catalog> {
  const [domains, questions] = await Promise.all([
    listDomains(questionnaireId, tx),
    listQuestions(questionnaireId, tx),
  ]);
  return { domains, questions, domainsById: new Map(domains.map((d) => [d.id, d])) };
}

type DomainScoreRow = {
  domainId: string;
  earned: number;
  possible: number;
  band: string;
  applicable: boolean;
};

type QuestionTally = {
  domainEarned: Map<string, number>;
  domainPossible: Map<string, number>;
  domainQuestionCount: Map<string, number>;
  domainGapCount: Map<string, number>;
  gaps: Gap[];
  totalWeight: number;
  totalScore: number;
  criticalCount: number;
  unsureCount: number;
};

function buildGap(
  q: QuestionRow,
  domain: DomainRow | undefined,
  severity: GapSeverity,
  answer: AnswerValue,
): Gap {
  return {
    questionId: q.id,
    code: q.code,
    domainKey: domain?.key ?? '',
    domainName: domain?.name ?? '',
    weight: q.weight,
    sectionRef: q.sectionRef,
    question: q.prompt,
    fix: q.remedy,
    module: q.moduleKey,
    severity,
    answer,
    isUnsure: answer === 'u',
  };
}

/** One question's contribution to its domain's running totals — the earned
 * vs. possible points, whether it counts as answered/unsure, and the `Gap`
 * entry it produces when its severity isn't clean. Mutates `tally` in place;
 * called once per active question by `tallyActiveQuestions`. */
function tallyQuestion(
  tally: QuestionTally,
  q: QuestionRow,
  domainsById: Map<string, DomainRow>,
  answers: ReadonlyMap<string, AnswerValue>,
): void {
  const answer = answers.get(q.id) ?? 'u';
  const value = ANSWER_POINTS[answer];
  tally.domainEarned.set(q.domainId, (tally.domainEarned.get(q.domainId) ?? 0) + q.weight * value);
  tally.domainPossible.set(
    q.domainId,
    (tally.domainPossible.get(q.domainId) ?? 0) + q.weight * 100,
  );
  tally.domainQuestionCount.set(q.domainId, (tally.domainQuestionCount.get(q.domainId) ?? 0) + 1);
  tally.totalWeight += q.weight;
  tally.totalScore += q.weight * value;
  if (answer === 'u') tally.unsureCount += 1;

  const severity = severityFor(q.weight, answer);
  if (!severity) return;
  tally.domainGapCount.set(q.domainId, (tally.domainGapCount.get(q.domainId) ?? 0) + 1);
  if (severity === 'c') tally.criticalCount += 1;
  tally.gaps.push(buildGap(q, domainsById.get(q.domainId), severity, answer));
}

function sortGaps(gaps: Gap[]): Gap[] {
  return gaps.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.code < b.code ? -1 : 1;
  });
}

/** Runs every active question through `tallyQuestion`, then sorts the
 * resulting gaps worst-first (critical > high > medium > low, heavier weight
 * first, code as the final tiebreak). */
function tallyActiveQuestions(
  activeQuestions: readonly QuestionRow[],
  domainsById: Map<string, DomainRow>,
  answers: ReadonlyMap<string, AnswerValue>,
): QuestionTally {
  const tally: QuestionTally = {
    domainEarned: new Map(),
    domainPossible: new Map(),
    domainQuestionCount: new Map(),
    domainGapCount: new Map(),
    gaps: [],
    totalWeight: 0,
    totalScore: 0,
    criticalCount: 0,
    unsureCount: 0,
  };
  for (const q of activeQuestions) tallyQuestion(tally, q, domainsById, answers);
  sortGaps(tally.gaps);
  return tally;
}

/** Per-domain results and score-snapshot rows from a question tally — a
 * domain is not-applicable when its gate profile answer is `no`, in which
 * case it contributes no percent and an `n/a` band. */
function buildDomainResults(
  catalog: Catalog,
  profile: AssessmentProfile,
  tally: QuestionTally,
): { domainResults: DomainResult[]; domainScoreRows: DomainScoreRow[] } {
  const domainResults: DomainResult[] = [];
  const domainScoreRows: DomainScoreRow[] = [];
  for (const domain of catalog.domains) {
    const isNotApplicable =
      domain.gateKey !== null && profile[domain.gateKey as keyof AssessmentProfile] === 'no';
    const possible = tally.domainPossible.get(domain.id) ?? 0;
    const earned = tally.domainEarned.get(domain.id) ?? 0;
    const percent =
      isNotApplicable || possible === 0 ? null : Math.round((earned / possible) * 100);
    domainResults.push({
      key: domain.key,
      name: domain.name,
      sectionRefs: domain.sectionRefs,
      isNotApplicable,
      percent,
      gapCount: tally.domainGapCount.get(domain.id) ?? 0,
      questionCount: tally.domainQuestionCount.get(domain.id) ?? 0,
    });
    domainScoreRows.push({
      domainId: domain.id,
      earned,
      possible,
      band: percent === null ? 'n/a' : scoreBand(percent).key,
      applicable: !isNotApplicable,
    });
  }
  return { domainResults, domainScoreRows };
}

/** Scores a run's answers against the catalog — used both to persist a
 * completed run's domain-score snapshot and to build its report. */
function computeScoring(
  catalog: Catalog,
  profile: AssessmentProfile,
  answers: ReadonlyMap<string, AnswerValue>,
): {
  score: number;
  domainResults: DomainResult[];
  domainScoreRows: DomainScoreRow[];
  gaps: Gap[];
  criticalCount: number;
  unsureCount: number;
  questionsInScope: number;
} {
  const activeQuestions = catalog.questions.filter((q) =>
    isQuestionActive(q, catalog.domainsById, profile),
  );
  const tally = tallyActiveQuestions(activeQuestions, catalog.domainsById, answers);
  const { domainResults, domainScoreRows } = buildDomainResults(catalog, profile, tally);
  const score =
    tally.totalWeight === 0 ? 0 : Math.round((tally.totalScore / (tally.totalWeight * 100)) * 100);

  return {
    score,
    domainResults,
    domainScoreRows,
    gaps: tally.gaps,
    criticalCount: tally.criticalCount,
    unsureCount: tally.unsureCount,
    questionsInScope: activeQuestions.length,
  };
}

export type ReadinessState =
  | { kind: 'empty' }
  | {
      kind: 'in-progress';
      runId: string;
      profile: AssessmentProfile;
      answers: Record<string, AnswerValue>;
      notes: Record<string, string>;
      questionsInScope: number;
      answeredCount: number;
    }
  | { kind: 'completed'; report: AssessmentReport };

export type ReadinessCatalogDomain = {
  id: string;
  key: string;
  name: string;
  sectionRefs: string[];
  gateKey: string | null;
};

export type ReadinessCatalogQuestion = {
  id: string;
  domainId: string;
  code: string;
  weight: number;
  sectionRef: string | null;
  prompt: string;
  module: string | null;
};

export type ReadinessData = {
  domains: ReadinessCatalogDomain[];
  questions: ReadinessCatalogQuestion[];
  state: ReadinessState;
};

async function buildReport(
  run: RunRow,
  catalog: Catalog,
  profile: AssessmentProfile,
  tx: WorkspaceTx,
): Promise<AssessmentReport> {
  const answerRows = await listAnswers(run.id, tx);
  const answers = new Map(answerRows.map((a) => [a.questionId, a.answer]));
  const scoring = computeScoring(catalog, profile, answers);
  const score = run.scorePct !== null ? Math.round(Number(run.scorePct)) : scoring.score;
  return {
    runId: run.id,
    refCode: run.refCode,
    score,
    band: scoreBand(score),
    domains: scoring.domainResults,
    gaps: scoring.gaps,
    criticalCount: scoring.criticalCount,
    unsureCount: scoring.unsureCount,
    questionsInScope: scoring.questionsInScope,
    notApplicableCount: scoring.domainResults.filter((d) => d.isNotApplicable).length,
    entity: profile.entity || 'Your Company Pvt Ltd',
    completedAt: (run.completedAt ?? run.startedAt).toISOString(),
  };
}

/** Current catalog + whichever state the hub should render — empty, resumable, or a completed report. */
export async function getReadiness(ctx: WorkspaceContext): Promise<ReadinessData> {
  return withWorkspace(ctx, async (tx) => {
    const questionnaireRow = await findGapQuestionnaire(tx);
    if (!questionnaireRow) {
      return { domains: [], questions: [], state: { kind: 'empty' } };
    }
    const catalog = await loadCatalog(questionnaireRow.id, tx);

    const activeRun = await findActiveRun(questionnaireRow.id, tx);
    if (activeRun) {
      const profile = parseProfile(activeRun.profile);
      const answerRows = await listAnswers(activeRun.id, tx);
      const answers: Record<string, AnswerValue> = {};
      const notes: Record<string, string> = {};
      for (const a of answerRows) {
        answers[a.questionId] = a.answer;
        if (a.note !== null && a.note !== '') notes[a.questionId] = a.note;
      }
      const activeQuestions = catalog.questions.filter((q) =>
        isQuestionActive(q, catalog.domainsById, profile),
      );
      return {
        domains: toDomainCatalog(catalog.domains),
        questions: toQuestionCatalog(catalog.questions),
        state: {
          kind: 'in-progress',
          runId: activeRun.id,
          profile,
          answers,
          notes,
          questionsInScope: activeQuestions.length,
          answeredCount: activeQuestions.filter((q) => answers[q.id] !== undefined).length,
        },
      };
    }

    const completedRun = await findLatestCompletedRun(questionnaireRow.id, tx);
    if (completedRun) {
      const report = await buildReport(
        completedRun,
        catalog,
        parseProfile(completedRun.profile),
        tx,
      );
      return {
        domains: toDomainCatalog(catalog.domains),
        questions: toQuestionCatalog(catalog.questions),
        state: { kind: 'completed', report },
      };
    }

    return {
      domains: toDomainCatalog(catalog.domains),
      questions: toQuestionCatalog(catalog.questions),
      state: { kind: 'empty' },
    };
  });
}

function toDomainCatalog(domains: readonly DomainRow[]): ReadinessCatalogDomain[] {
  return domains.map((d) => ({
    id: d.id,
    key: d.key,
    name: d.name,
    sectionRefs: d.sectionRefs,
    gateKey: d.gateKey,
  }));
}

function toQuestionCatalog(questions: readonly QuestionRow[]): ReadinessCatalogQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    domainId: q.domainId,
    code: q.code,
    weight: q.weight,
    sectionRef: q.sectionRef,
    prompt: q.prompt,
    module: q.moduleKey,
  }));
}

export type ReadinessMutationError = 'VALIDATION_FAILED' | 'NOT_FOUND' | 'CONFLICT';

/** Starts a fresh run — "Start assessment" from the empty state. Rejected if
 * one is already in progress (the client should resume it instead). */
export async function startAssessment(
  ctx: WorkspaceContext,
): Promise<Result<ReadinessData, ReadinessMutationError>> {
  return withWorkspace(ctx, async (tx): Promise<Result<ReadinessData, ReadinessMutationError>> => {
    const questionnaireRow = await findGapQuestionnaire(tx);
    if (!questionnaireRow) return err('NOT_FOUND');
    if (await findActiveRun(questionnaireRow.id, tx)) return err('CONFLICT');

    const refCode = await nextAssessmentRunCode(tx);
    await insertRun(
      {
        refCode,
        questionnaireId: questionnaireRow.id,
        questionnaireVersion: questionnaireRow.version,
        profile: EMPTY_PROFILE,
        assessorEmployeeId: null,
      },
      tx,
    );

    return ok(await getReadinessInTx(tx));
  }).then(async (result) => (result.ok ? ok(await getReadiness(ctx)) : result));
}

/** Re-reads full state inside an already-open transaction — used right after a write in the same tx. */
async function getReadinessInTx(tx: WorkspaceTx): Promise<ReadinessData> {
  const questionnaireRow = await findGapQuestionnaire(tx);
  if (!questionnaireRow) return { domains: [], questions: [], state: { kind: 'empty' } };
  const catalog = await loadCatalog(questionnaireRow.id, tx);
  const activeRun = await findActiveRun(questionnaireRow.id, tx);
  if (!activeRun)
    return {
      domains: toDomainCatalog(catalog.domains),
      questions: toQuestionCatalog(catalog.questions),
      state: { kind: 'empty' },
    };
  const profile = parseProfile(activeRun.profile);
  return {
    domains: toDomainCatalog(catalog.domains),
    questions: toQuestionCatalog(catalog.questions),
    state: {
      kind: 'in-progress',
      runId: activeRun.id,
      profile,
      answers: {},
      notes: {},
      questionsInScope: 0,
      answeredCount: 0,
    },
  };
}

export type UpdateRunInput = {
  profile?: Partial<AssessmentProfile>;
  answer?: { questionId: string; value: AnswerValue; note?: string | null | undefined };
};

/** Saves a profile patch and/or one answer to the run in progress. */
export async function updateRun(
  ctx: WorkspaceContext,
  runId: string,
  input: UpdateRunInput,
): Promise<Result<ReadinessData, ReadinessMutationError>> {
  return withWorkspace(ctx, async (tx): Promise<Result<ReadinessData, ReadinessMutationError>> => {
    const run = await findRun(runId, tx);
    if (run?.status !== 'in_progress') return err('NOT_FOUND');

    if (input.profile) {
      const current = parseProfile(run.profile);
      const next = { ...current, ...input.profile };
      if (
        next.assessorEmployeeId !== null &&
        !(await employeeExists(next.assessorEmployeeId, tx))
      ) {
        return err('VALIDATION_FAILED');
      }
      await updateRunProfile(runId, next, next.assessorEmployeeId, tx);
    }

    if (input.answer) {
      const questionnaireRow = await findGapQuestionnaire(tx);
      if (!questionnaireRow) return err('NOT_FOUND');
      const questions = await listQuestions(questionnaireRow.id, tx);
      if (!questions.some((q) => q.id === input.answer?.questionId))
        return err('VALIDATION_FAILED');
      await upsertAnswer(runId, input.answer.questionId, input.answer.value, tx, input.answer.note);
    }

    return ok(await getReadiness(ctx));
  });
}

/** Finalizes a run: computes the score/domain snapshot and marks it completed. */
export async function finishAssessment(
  ctx: WorkspaceContext,
  runId: string,
): Promise<Result<ReadinessData, ReadinessMutationError>> {
  return withWorkspace(ctx, async (tx): Promise<Result<ReadinessData, ReadinessMutationError>> => {
    const run = await findRun(runId, tx);
    if (run?.status !== 'in_progress') return err('NOT_FOUND');

    const profile = parseProfile(run.profile);
    if (!isProfileComplete(profile)) return err('VALIDATION_FAILED');

    const questionnaireRow = await findGapQuestionnaire(tx);
    if (!questionnaireRow) return err('NOT_FOUND');
    const catalog = await loadCatalog(questionnaireRow.id, tx);
    const answerRows: AnswerRow[] = await listAnswers(runId, tx);
    const answers = new Map(answerRows.map((a) => [a.questionId, a.answer]));

    const scoring = computeScoring(catalog, profile, answers);
    await replaceDomainScores(
      runId,
      scoring.domainScoreRows.map((row) => ({ ...row, runId })),
      tx,
    );
    await completeRun(
      runId,
      { scorePct: scoring.score, band: scoreBand(scoring.score).key, completedAt: new Date() },
      tx,
    );

    return ok(await getReadiness(ctx));
  });
}

/** Re-opens the profile step of the latest completed run's replacement — starts
 * a NEW run (append-only history), seeded from nothing (a clean re-assessment). */
export async function reassess(
  ctx: WorkspaceContext,
): Promise<Result<ReadinessData, ReadinessMutationError>> {
  return startAssessment(ctx);
}

// Only exported for tests / the domain-score read path other modules may want later.
export { listDomainScores };
