<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/readiness`

> Auto-loaded when you work in `src/app/api/readiness`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## Public API

| Symbol                     | Kind      | Layer      | Description                                                                                        |
| -------------------------- | --------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `AnswerRow`                | TypeAlias | repository | —                                                                                                  |
| `AnswerValue`              | TypeAlias | service    | —                                                                                                  |
| `AssessmentProfile`        | TypeAlias | service    | —                                                                                                  |
| `AssessmentReport`         | TypeAlias | service    | —                                                                                                  |
| `completeRun`              | Function  | repository | —                                                                                                  |
| `countAnswersForQuestion`  | Function  | repository | How many answers already recorded against this question — a non-zero                               |
| `countQuestionsInDomain`   | Function  | repository | How many questions this domain already owns — a non-zero count is why                              |
| `createDomain`             | Function  | service    | Adds a new, empty section to the workspace's Gap Assessment questionnaire —                        |
| `CreateDomainError`        | TypeAlias | service    | —                                                                                                  |
| `createQuestion`           | Function  | service    | Adds a new, admin-authored question to a section — the piece that makes a                          |
| `CreateQuestionError`      | TypeAlias | service    | —                                                                                                  |
| `deleteDomain`             | Function  | repository | —                                                                                                  |
| `DeleteDomainError`        | TypeAlias | service    | —                                                                                                  |
| `deleteQuestion`           | Function  | repository | —                                                                                                  |
| `DeleteQuestionError`      | TypeAlias | service    | —                                                                                                  |
| `DomainListRow`            | TypeAlias | repository | —                                                                                                  |
| `DomainResult`             | TypeAlias | service    | —                                                                                                  |
| `DomainRow`                | TypeAlias | repository | —                                                                                                  |
| `DomainScoreRow`           | TypeAlias | repository | —                                                                                                  |
| `DomainScoreValues`        | TypeAlias | repository | —                                                                                                  |
| `employeeExists`           | Function  | repository | Whether an employee id names a live employee in THIS workspace — same check                        |
| `findActiveRun`            | Function  | repository | —                                                                                                  |
| `findDomainById`           | Function  | repository | One domain by id, or null — used to confirm it exists before rename/delete.                        |
| `findGapQuestionnaire`     | Function  | repository | Only one questionnaire of kind `'gap'` is expected per workspace — the                             |
| `findLatestCompletedRun`   | Function  | repository | —                                                                                                  |
| `findQuestionById`         | Function  | repository | One question by id, or null — used to confirm it exists before rename/delete.                      |
| `findRun`                  | Function  | repository | —                                                                                                  |
| `finishAssessment`         | Function  | service    | Finalizes a run: computes the score/domain snapshot and marks it completed.                        |
| `Gap`                      | TypeAlias | service    | —                                                                                                  |
| `GapSeverity`              | TypeAlias | service    | —                                                                                                  |
| `GateAnswer`               | TypeAlias | service    | —                                                                                                  |
| `getDomainsForSettings`    | Function  | service    | Every section with its question count — Configuration Studio's Master                              |
| `getQuestionsForDomain`    | Function  | service    | Every question in one section, in position order — Configuration Studio's                          |
| `getReadiness`             | Function  | service    | Current catalog + whichever state the hub should render — empty, resumable, or a completed report. |
| `insertDomain`             | Function  | repository | Appends a new domain after every existing one — a freshly added section                            |
| `insertQuestion`           | Function  | repository | Appends a new, admin-authored question to a domain (`is_custom = true`,                            |
| `insertRun`                | Function  | repository | —                                                                                                  |
| `listAnswers`              | Function  | repository | —                                                                                                  |
| `listDomainKeys`           | Function  | repository | Every domain key already taken in this questionnaire — so a new one can be                         |
| `listDomains`              | Function  | repository | Active domains only — one an admin deactivates in Configuration Studio's                           |
| `listDomainScores`         | Function  | repository | —                                                                                                  |
| `listDomainScores`         | Function  | repository | —                                                                                                  |
| `listDomainsForSettings`   | Function  | repository | Every domain with how many questions it owns — Configuration Studio's                              |
| `listQuestionCodes`        | Function  | repository | Every question code already taken in this questionnaire — codes are                                |
| `listQuestions`            | Function  | repository | Questions from active domains only. `question` carries no `is_active` of                           |
| `listQuestionsForDomain`   | Function  | repository | Every question in one domain, in position order — the section's own                                |
| `MasterQuestionRow`        | TypeAlias | repository | —                                                                                                  |
| `NewRunValues`             | TypeAlias | repository | —                                                                                                  |
| `nextAssessmentRunCode`    | Function  | repository | `next_ref('GAP')` — the same per-workspace counter every other human-facing id uses.               |
| `QuestionInput`            | TypeAlias | service    | —                                                                                                  |
| `QuestionnaireRow`         | TypeAlias | repository | The one published Gap Assessment questionnaire this workspace runs.                                |
| `QuestionRow`              | TypeAlias | repository | —                                                                                                  |
| `ReadinessCatalogDomain`   | TypeAlias | service    | —                                                                                                  |
| `ReadinessCatalogQuestion` | TypeAlias | service    | —                                                                                                  |
| `ReadinessData`            | TypeAlias | service    | —                                                                                                  |
| `ReadinessMutationError`   | TypeAlias | service    | —                                                                                                  |
| `ReadinessState`           | TypeAlias | service    | —                                                                                                  |
| `reassess`                 | Function  | service    | Re-opens the profile step of the latest completed run's replacement — starts                       |
| `removeDomain`             | Function  | service    | Deletes a section. Refuses while it still owns any question — removing                             |
| `removeQuestion`           | Function  | service    | Deletes a question. Refuses once any run has answered it — that answer is                          |
| `renameDomain`             | Function  | repository | Renames a domain and sets its active flag (its display name and status                             |
| `replaceDomainScores`      | Function  | repository | —                                                                                                  |
| `RunRow`                   | TypeAlias | repository | —                                                                                                  |
| `scoreBand`                | Function  | service    | `gaBand()` — the four readiness bands, verbatim headline/body copy from the prototype.             |
| `ScoreBand`                | TypeAlias | service    | —                                                                                                  |
| `ScoreBandKey`             | TypeAlias | service    | —                                                                                                  |
| `startAssessment`          | Function  | service    | Starts a fresh run — "Start assessment" from the empty state. Rejected if                          |
| `updateDomain`             | Function  | service    | Renames a section and sets its active flag. The internal key never                                 |
| `UpdateDomainError`        | TypeAlias | service    | —                                                                                                  |
| `updateQuestion`           | Function  | repository | Updates a question's editable fields. `code`/`domainId` never change —                             |
| `updateQuestionDetails`    | Function  | service    | Updates a question's editable fields. Its code and section never move —                            |
| `UpdateQuestionError`      | TypeAlias | service    | —                                                                                                  |
| `updateRun`                | Function  | service    | Saves a profile patch and/or one answer to the run in progress.                                    |
| `UpdateRunInput`           | TypeAlias | service    | —                                                                                                  |
| `updateRunProfile`         | Function  | repository | —                                                                                                  |
| `upsertAnswer`             | Function  | repository | —                                                                                                  |

```ts
import { AnswerRow, AnswerValue, AssessmentProfile, AssessmentReport } from '@api/readiness';
```

## Decisions that constrain this code

- [ADR-0006](../../../../docs/adr/0006-spa-with-tanstack-query.md) — Client-rendered SPA on Next.js, TanStack Query as the data layer `accepted`
- [ADR-0007](../../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`
- [ADR-0008](../../../../docs/adr/0008-auth-is-infrastructure.md) — Auth is infrastructure; route handlers share one ingress wrapper `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from: `@server/auth`, `@server/db`, `@server/errors`, `@server/http`, `@server/workspace`

Server-only — a Route Handler module is never imported by a component. The browser reaches it over HTTP; see the route table in [system/MAP.md](../../../../docs/system/MAP.md).

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

<!-- HUMAN-OWNED. Explain the WHY: the business problem, the invariants that are not
     obvious from the types, the decisions someone would otherwise re-litigate.
     Generated facts are above; this is the part only you can write.
     `pnpm ctx:check` fails while this still says TODO. -->

This is the Gap Assessment module (JDP-GAP): a guided questionnaire that scores how
ready the workspace is for the DPDP Act and produces a prioritized gap report. Ported
from the prototype's `gaCompute()`/`gaWzRender()`/`gaFinish()` — the scoring rules,
severity bands, and domain gating in `service.ts` are a line-by-line port of that mock,
not a fresh design.

A run is **append-only once completed** — `completeRun` never runs twice on the same
row. "Re-assess" (`reassess()`) always starts a brand-new run; it never edits history.
That's what a newcomer would get wrong: there is no "reopen and edit a finished
assessment" path, because the point is to keep a real record of read-only past attempts,
not a single mutable draft.

A question can be **gated out of scope** by the profile's yes/no answers (e.g. "no kids'
data processed" turns off the children's-data domain). Out-of-scope questions never
count toward the score, the "in progress" counters, or the gap list — see
`isQuestionActive`/`activeQuestionsFor` in both `service.ts` and the client hooks. Any
change to scoring or progress math has to filter through that gate first, or it will
count questions that shouldn't be in scope.
