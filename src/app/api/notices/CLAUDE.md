<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/notices`

> Auto-loaded when you work in `src/app/api/notices`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## Public API

| Symbol                      | Kind      | Layer      | Description                                                                              |
| --------------------------- | --------- | ---------- | ---------------------------------------------------------------------------------------- |
| `computeNoticeCheck`        | Function  | module     | —                                                                                        |
| `computeNoticeCheck`        | Function  | module     | —                                                                                        |
| `CreateFromActivityInput`   | TypeAlias | service    | What the client submits when the source is an approved RoPA activity.                    |
| `CreateFromScratchInput`    | TypeAlias | service    | What the client submits when there is no linked activity.                                |
| `CreateNoticeError`         | TypeAlias | service    | —                                                                                        |
| `createNoticeFromActivity`  | Function  | service    | Creates a notice drafted from an approved RoPA activity. The activity is looked up       |
| `createNoticeFromScratch`   | Function  | service    | Creates a notice drafted from a free-text description, with no linked activity.          |
| `findNoticeById`            | Function  | repository | —                                                                                        |
| `getContactBody`            | Function  | module     | —                                                                                        |
| `getNotice`                 | Function  | service    | One notice's current draft/published content, or `NOT_FOUND`.                            |
| `getNotices`                | Function  | service    | The register's KPIs and rows for the Notices page.                                       |
| `getRightsBody`             | Function  | module     | —                                                                                        |
| `insertNotice`              | Function  | repository | Inserts a new notice and returns its id.                                                 |
| `insertNoticeSections`      | Function  | repository | Writes a full set of sections for one (version, language) — insert-only, used on create. |
| `insertNoticeVersion`       | Function  | repository | Inserts a new version (draft) for a notice and returns its id.                           |
| `listNotices`               | Function  | repository | Every non-deleted notice, newest first, with its current version string.                 |
| `listVersionSections`       | Function  | repository | Every section of one version, in a given language, in display order.                     |
| `markVersionStatus`         | Function  | repository | Marks a version's status (e.g. `published`) and its matching timestamp column.           |
| `NewNoticeSectionValues`    | TypeAlias | repository | One section to write for a version.                                                      |
| `NewNoticeValues`           | TypeAlias | repository | The values needed to create one notice row.                                              |
| `NewNoticeVersionValues`    | TypeAlias | repository | The values needed to create one notice version.                                          |
| `nextNoticeRefCode`         | Function  | repository | Allocates the next human-facing notice ref via `ref_sequence`/`next_ref()`.              |
| `NoticeCheck`               | TypeAlias | module     | —                                                                                        |
| `NoticeCheck`               | TypeAlias | module     | —                                                                                        |
| `NoticeCheckItem`           | TypeAlias | module     | —                                                                                        |
| `NoticeDetail`              | TypeAlias | service    | One notice, with its current sections and completeness check.                            |
| `NoticeLanguageInfo`        | TypeAlias | module     | —                                                                                        |
| `NoticeListRow`             | TypeAlias | repository | One row of the Notices register — the list `/notices` reads.                             |
| `NoticeRow`                 | TypeAlias | repository | One notice by id (not deleted), or null.                                                 |
| `NoticeSection`             | TypeAlias | module     | —                                                                                        |
| `NoticeSection`             | TypeAlias | module     | —                                                                                        |
| `NoticeSectionKey`          | TypeAlias | module     | —                                                                                        |
| `NoticeSectionKey`          | TypeAlias | module     | —                                                                                        |
| `NoticeSectionRow`          | TypeAlias | repository | One notice section, as stored.                                                           |
| `NoticeSourceMetadata`      | TypeAlias | module     | —                                                                                        |
| `NoticeSourceMetadata`      | TypeAlias | module     | —                                                                                        |
| `NoticeSummary`             | TypeAlias | service    | One row of the Notices register.                                                         |
| `NT_DPO`                    | Variable  | module     | —                                                                                        |
| `NT_EXTRA`                  | Variable  | module     | —                                                                                        |
| `NT_FILL`                   | Variable  | module     | —                                                                                        |
| `NT_GRV`                    | Variable  | module     | —                                                                                        |
| `NT_H`                      | Variable  | module     | —                                                                                        |
| `NT_IMPROVE`                | Variable  | module     | —                                                                                        |
| `NT_L8`                     | Variable  | module     | —                                                                                        |
| `NT_ORG`                    | Variable  | module     | —                                                                                        |
| `NT_SIMPLE`                 | Variable  | module     | —                                                                                        |
| `ntEsc`                     | Function  | module     | —                                                                                        |
| `ntHtml2Txt`                | Function  | module     | —                                                                                        |
| `ntIsHtml`                  | Function  | module     | —                                                                                        |
| `ntTpl`                     | Function  | module     | —                                                                                        |
| `ntTxt2Html`                | Function  | module     | —                                                                                        |
| `OptionalSectionDefinition` | TypeAlias | module     | —                                                                                        |
| `OptionalSectionKey`        | TypeAlias | module     | —                                                                                        |
| `publishNotice`             | Function  | service    | Publishes a notice. The first publish just flips the current (draft) version and the     |
| `PublishNoticeError`        | TypeAlias | service    | —                                                                                        |
| `replaceNoticeSections`     | Function  | repository | Overwrites every section of one (version, language) with `sections` — the FULL set,      |
| `saveNotice`                | Function  | service    | Overwrites a notice's name and current-version sections — always edits the current       |
| `SaveNoticeError`           | TypeAlias | service    | —                                                                                        |
| `sectionsFromActivity`      | Function  | module     | —                                                                                        |
| `sectionsFromDescription`   | Function  | module     | —                                                                                        |
| `setNoticeCurrentVersion`   | Function  | repository | Points `notice.current_version_id` at a version (set on create and on re-publish).       |
| `STANDARD_SECTION_KEYS`     | Variable  | module     | —                                                                                        |
| `StandardSectionKey`        | TypeAlias | module     | —                                                                                        |
| `updateNoticeName`          | Function  | repository | Renames a notice (and bumps `updated_at`).                                               |
| `updateNoticeStatus`        | Function  | repository | Flips a notice's status (and bumps `updated_at`).                                        |

```ts
import {
  computeNoticeCheck,
  computeNoticeCheck,
  CreateFromActivityInput,
  CreateFromScratchInput,
} from '@api/notices';
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

Generates and manages the privacy notices s.5 and Rule 3 of the DPDP Act require —
drafting one from a linked RoPA processing activity or from free text, then tracking
draft/published versions and per-section content through to publication.

What a newcomer gets wrong: "Jethur AI drafts it" is not an LLM call — `templates.ts`
is a deterministic template fill (mirroring the prototype's own `ntFromRopa`/`ntFromText`
JS), so don't go looking for a model client or prompt here, and don't wire one in without
first checking whether the deterministic approach was a deliberate scope decision. Also,
only `notice`, `notice_version`, and `notice_section` are persisted (the "core slice");
`notice_language`, `notice_checklist`, and `notice_publication` exist in the schema but
are deliberately computed/derived rather than written to — check that decision still
holds before assuming those tables should be populated.
