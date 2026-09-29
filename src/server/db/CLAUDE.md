<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@server/db`

> Auto-loaded when you work in `src/server/db`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## ⚠ Isolation layer

This domain is part of the workspace isolation boundary. Read
[docs/WORKSPACE_ISOLATION.md](../../../docs/WORKSPACE_ISOLATION.md) **in full** before
changing anything here. `local/require-workspace-scope` restricts who may import it,
and changing that rule requires an ADR.

## Public API

| Symbol                     | Kind      | Layer  | Description                                                                                       |
| -------------------------- | --------- | ------ | ------------------------------------------------------------------------------------------------- |
| `activityCategory`         | Variable  | module | One (activity, identifier type) pair — the "What details do you handle?" tag picker.              |
| `activityOperation`        | Variable  | module | One (activity, operation) pair — the "Processing operations" tag picker (s.2).                    |
| `ActivityOperationKind`    | TypeAlias | module | Mirrors the CHECK on `activity_operation.operation`.                                              |
| `activitySafeguard`        | Variable  | module | One (activity, safeguard) pair — the "Security measures" tag picker (s.8(4)-(5)).                 |
| `ApprovalState`            | TypeAlias | module | Mirrors the `approval_state` enum (0002 §0).                                                      |
| `assessmentAnswer`         | Variable  | module | —                                                                                                 |
| `AssessmentAnswerValue`    | TypeAlias | module | One answer to one question, for one run. `'u'` (not sure) is never scored as compliant.           |
| `assessmentDomainScore`    | Variable  | module | One domain's rollup for one run — `earned`/`possible` are weighted points, not percentages.       |
| `assessmentRun`            | Variable  | module | One assessment attempt — append-only history, never overwritten. `profile`                        |
| `AssessmentRunStatus`      | TypeAlias | module | Run lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql.                        |
| `AssessmentRunSubjectType` | TypeAlias | module | Mirrors the CHECK — always a workspace-level run for the Gap Assessment.                          |
| `attachment`               | Variable  | module | One uploaded file, referenced by FK from `workspace_profile.logo_attachment_id`                   |
| `AttachmentScanStatus`     | TypeAlias | module | An attachment's virus-scan lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql. |
| `authChallenge`            | Variable  | module | Auth challenges for password recovery, OTP verification, and magic links.                         |
| `AuthChallengePurpose`     | TypeAlias | module | What an auth challenge is for. Mirrors the CHECK in db/schema (0001, widened by 0003).            |
| `bytea`                    | Variable  | module | Custom bytea column mapping for crypto hashes.                                                    |
| `course`                   | Variable  | module | s.8(4) awareness course catalog.                                                                  |
| `dataRegionEnum`           | Variable  | module | Statutory DPDP data residency regions.                                                            |
| `department`               | Variable  | module | Org units an employee can belong to. Referenced by `employee.department_id`.                      |
| `DraftedBy`                | TypeAlias | module | Mirrors the `drafted_by` CHECK on `processing_activity`.                                          |
| `employee`                 | Variable  | module | The people register. An employee exists whether or not they can sign in, which is                 |
| `EmployeeStatus`           | TypeAlias | module | Employee lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql.                   |
| `EndpointAgentStatus`      | TypeAlias | module | Agent lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql.                      |
| `endpointDevice`           | Variable  | module | One laptop/desktop enrolled for endpoint discovery. The Employees page's                          |
| `enrollment`               | Variable  | module | One employee's progress against one course. The Employees page's "Awareness"                      |
| `EnrollmentStatus`         | TypeAlias | module | Enrollment lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql.                 |
| `inet`                     | Variable  | module | Postgres `inet` — an IP address, read and written as its text form.                               |
| `LawfulBasis`              | TypeAlias | module | Mirrors the `lawful_basis` enum (0002 §0, extended by 0006).                                      |
| `membership`               | Variable  | module | Membership relation connecting global users to isolated workspaces.                               |
| `membershipRoleEnum`       | Variable  | module | Coarse membership role across the platform.                                                       |
| `MembershipStatus`         | TypeAlias | module | Membership lifecycle.                                                                             |
| `moduleCatalog`            | Variable  | module | The module catalog. "The sidebar, the role matrix and plan entitlements all                       |
| `notice`                   | Variable  | module | A privacy notice (s.5 · Rule 3) — the register `/notices` reads. `activityId` is a                |
| `noticeSection`            | Variable  | module | One row per (version, language, section) — the eight Rule 3 sections                              |
| `NoticeStatus`             | TypeAlias | module | Notice lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql.                     |
| `noticeVersion`            | Variable  | module | One immutable-once-published snapshot of a notice. `contentHash` is the sha256 over               |
| `NoticeVersionSource`      | TypeAlias | module | —                                                                                                 |
| `NoticeVersionStatus`      | TypeAlias | module | Notice version lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql.             |
| `permission`               | Variable  | module | The grantable actions, one row per (module, action) — curated in code, never                      |
| `platformDb`               | Variable  | module | Drizzle client configured for platform control-plane queries in the public schema.                |
| `PlatformExecutor`         | TypeAlias | module | Anything a platform repository can run a query on: the pool-backed client or a                    |
| `platformTransaction`      | Function  | module | Runs `fn` inside one transaction on the platform (`public`) schema. Commits when                  |
| `processingActivity`       | Variable  | module | One processing activity — the RoPA register's unit of record (s.5(1)). Every                      |
| `question`                 | Variable  | module | One question — 43 for the Gap Assessment.                                                         |
| `questionDomain`           | Variable  | module | One scoring domain within a questionnaire — 9 for the Gap Assessment (A–I).                       |
| `questionnaire`            | Variable  | module | One questionnaire this workspace can run — the Gap Assessment is `kind: 'gap'`.                   |
| `QuestionnaireKind`        | TypeAlias | module | —                                                                                                 |
| `QuestionnaireStatus`      | TypeAlias | module | —                                                                                                 |
| `role`                     | Variable  | module | Workspace-configurable roles. System roles ship on provisioning                                   |
| `rolePermission`           | Variable  | module | One row per (role, permission), individually toggleable. `permissionKey`                          |
| `session`                  | Variable  | module | Authenticated user sessions stored by hashed token in public schema.                              |
| `userAccount`              | Variable  | module | Global user account identity table in public schema.                                              |
| `UserAccountStatus`        | TypeAlias | module | User account lifecycle.                                                                           |
| `workspace`                | Variable  | module | Platform workspace registry table in public schema.                                               |
| `workspaceDomain`          | Variable  | module | Custom domains and subdomains mapping to workspaces.                                              |
| `WorkspaceDomainKind`      | TypeAlias | module | Kinds of hostname that can resolve to a workspace.                                                |
| `workspaceLanguage`        | Variable  | module | Languages this workspace publishes in — s.5(3)/s.6(3). Exactly one row carries                    |
| `workspaceProfile`         | Variable  | module | Singleton row (`id` is a boolean fixed to `true`) holding who the workspace is:                   |
| `workspaceStatusEnum`      | Variable  | module | Workspace lifecycle status enumeration.                                                           |

```ts
import {
  activityCategory,
  activityOperation,
  ActivityOperationKind,
  activitySafeguard,
} from '@server/db';
```

## Decisions that constrain this code

- [ADR-0001](../../../docs/adr/0001-schema-per-workspace.md) — Schema-per-workspace for tenant isolation `accepted`
- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0005](../../../docs/adr/0005-dynamic-fields-typed-columns-plus-jsonb.md) — Dynamic form fields — typed columns for statutory data, jsonb for custom `accepted`
- [ADR-0007](../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`
- [ADR-0009](../../../docs/adr/0009-platform-table-row-level-security.md) — Row-level security on platform tables — scoped to unused tables, not blanket `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from no other domain.

Anything under `src/server/**` is server-only — never import it from a component.

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

Owning the raw Postgres connection, and being the only place that is allowed to.

**What a newcomer gets wrong.** Importing the client "just to run one quick read".
`local/require-workspace-scope` blocks it, and the rule is not bureaucracy: a query
outside `withWorkspace()` runs on whatever `search_path` the pooled connection last had.
That is not an error — it is a successful query against the wrong tenant.

The app role is deliberately low-privilege and cannot `CREATE SCHEMA` or `DROP`.
Provisioning uses `DATABASE_MIGRATION_URL` with a different role that request-handling
code never has. If you find yourself needing more privilege in a request path, the design
is wrong, not the grant.

Migrations run per-schema through a resumable runner — never a hand-run `psql` against one
tenant, which is how schema drift between customers starts.
