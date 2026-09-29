# Database Design

Postgres. One database, one schema per workspace, plus `public` as the control plane.
DDL lives in [`db/schema/`](../db/schema/); this document is the reasoning.

- [`0001_platform.sql`](../db/schema/0001_platform.sql) — `public`: registry, identity,
  billing, statutory reference data, templates. **~40 tables.**
- [`0002_workspace_template.sql`](../db/schema/0002_workspace_template.sql) — applied
  verbatim into every `ws_<ulid>`. **98 tables.**

Both files load clean and every constraint below has been executed against a real
Postgres 16 with `search_path` set to the workspace schema alone.

---

## 1. What the product actually is

JethurDPDP is a compliance evidence system for the Digital Personal Data Protection
Act, 2023. Its central claim — from the CCM library — is:

> Nothing is marked compliant on a human's say-so alone: the control either has current
> evidence attached or it does not.

That sentence is a schema requirement, not a UI one. Three consequences run through
every table below:

1. **Evidence is a record, not a file.** It carries provenance (which module, which
   row), a `collected_at`, and a `stale_after`. A control whose newest evidence is
   past `stale_after` drops to PARTIAL — so freshness must be queryable, which means
   it is a column, not a convention.
2. **Ledgers are append-only.** s.6(10) puts the burden of proof on the fiduciary. A
   consent log that can be edited proves nothing, so `consent_event`, `audit_log` and
   `breach_timeline` refuse UPDATE and DELETE at the database, by trigger.
3. **`unknown` is a state.** Not a null, not a default of "compliant". `control_state`
   has five values and `unknown` is one of them; `assessment_answer.answer` allows
   `'u'` and it never scores as compliance.

## 2. Multi-tenancy: schema per workspace

Already decided in [ADR-0001](./adr/0001-schema-per-workspace.md) and specified in
[WORKSPACE_ISOLATION.md](./WORKSPACE_ISOLATION.md). What the schema design adds:

**There is no `workspace_id` column anywhere in `0002`.** If one appears, the design
has been misunderstood. Isolation is physical; a forgotten `WHERE` clause cannot leak.

**No cross-schema foreign keys.** Workspace tables reference platform reference data
(`identifier_type`, `language`, `dpdp_section`, `connector`, `control_template`) by
_text key_, validated in the domain layer — not by FK. Three reasons, in order of
weight:

|                           |                                                                                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exportability**         | s.8(7) erasure and enterprise due diligence both need `pg_dump --schema=ws_x` to restore standalone. A cross-schema FK makes that impossible.                                                                                                   |
| **`search_path` honesty** | `withWorkspace()` sets the path to the workspace schema _only_, deliberately — `public` on the path means a missing workspace table silently resolves to a shared one. An FK that needs `public` at runtime reintroduces exactly that coupling. |
| **Migration cost**        | 900 schemas × a lock on a shared parent table is a deploy outage.                                                                                                                                                                               |

The price is honest and stated: referential integrity for reference keys moves into the
domain layer and a seed-consistency test.

**Where copying beats referencing.** `dataset_identifier.is_sensitive` is denormalised
from `public.identifier_type` at write time. Not laziness — a dataset exported in 2027
must still record what was sensitive in 2026, and the red chip on the Data Map must
render from the workspace schema alone.

### Extensions and `search_path`

`pg_trgm` lives in `public`. Its operator class must be schema-qualified in DDL
(`USING gin (name public.gin_trgm_ops)`) because the index is created under one path
and used under another. Column defaults and CHECK expressions do _not_ need this —
Postgres resolves them to OIDs at DDL time. The migration runner therefore runs with
`search_path = ws_x, public`; the app role never does. This distinction is load-bearing
and is why the smoke test asserts it explicitly.

## 3. Configurable forms — the hybrid, and why

The requirement: every register can be reshaped by a workspace — relabel, translate,
reorder, make optional, add fields the Act never asked for — without losing foreign
keys, constraints, or the ability to answer _"show me every activity with no lawful
basis"_ in one indexed query.

The Configuration Studio field builder in the prototype already draws the correct line,
and the schema takes it literally. Fields are split by **who requires them**, not by
convenience:

```
form_field.storage_kind
│
├── 'column'  → a STATUTORY field. Maps to a real column on the real table.
│               `target_column` must appear in public.record_type_column — an
│               allowlist. Constraints, FKs and indexes are ordinary.
│               Relabelable, translatable, reorderable, hideable.
│               Never deletable. Never repointable at an unvouched column.
│
└── 'custom'  → a workspace-invented field. Lands in the record's `custom jsonb`,
                keyed by form_field.key. No migration, no DDL at runtime, and no
                path by which a user-supplied string reaches a SQL identifier.
```

Three CHECK constraints hold the line, and all three were verified firing:

```sql
CONSTRAINT form_field_target            CHECK (storage_kind='column' AND target_column IS NOT NULL
                                            OR storage_kind='custom' AND target_column IS NULL)
CONSTRAINT form_field_locked_is_column  CHECK (NOT is_locked OR storage_kind = 'column')
CONSTRAINT form_field_locked_required   CHECK (NOT is_locked OR is_required)
```

`is_locked` means _the Act requires this field_. Purpose (s.5(1)(a)), lawful basis
(s.4), retention rule (s.8(7)) and accountable owner cannot be made optional, hidden,
or demoted to jsonb — the database refuses, so the UI's "this one is required by the
Act" toast is backed by something.

### Rejected alternatives

| Approach                                            | Why not                                                                                                                                                                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Column-per-custom-field (runtime `ALTER TABLE`)** | Needs an app role that can ALTER. [WORKSPACE_ISOLATION.md §6](./WORKSPACE_ISOLATION.md) says the app role cannot CREATE or DROP, and that rule is worth more than the query convenience. Also 900 schemas × N ad-hoc columns is unmigrateable. |
| **Pure EAV for everything**                         | "Every activity has a lawful basis" becomes a nightly report instead of a `NOT NULL`. The Act's requirements deserve constraints.                                                                                                              |
| **Pure jsonb for everything**                       | No FKs. `owner_employee_id` stops being a reference to a real person.                                                                                                                                                                          |

### Filtering custom fields without an EAV primary store

Fields marked `is_indexed` are projected on write into `custom_value` — typed columns
(`value_text`, `value_number`, `value_date`, `value_bool`, `value_ref`), one row per
selection for multi-selects. The jsonb stays the source of truth; the projection is
derived and rebuildable. A workspace with 40 custom fields and 3 filterable ones pays
for 3.

Typed columns rather than one `text` column, because _"custom date field due in the
next 30 days"_ must be a range scan, not a cast inside the predicate.

Every record table also carries `GIN (custom jsonb_path_ops)` for containment queries.

### The snapshot rule

`form_version.snapshot` freezes the whole form — fields, options, every translation —
at publish time, and records point at the version that produced them
(`processing_activity.form_version_id`, `consent_record.form_version_id`).

A RoPA record filled in on 12 Aug 2026 must render forever with the labels and options
it was actually filled in under. Without this, evidence is a moving target: rename a
dropdown option and every historical consent artefact silently changes meaning. Same
reason `form_field_option.is_archived` exists instead of a delete.

### One grammar, three surfaces

The same field vocabulary drives the internal register form (RoPA), the outward-facing
consent form a data principal fills in at a `collection_point`, and the connector
credential form (`public.connector_field`). One renderer, one validator, one
translation table.

Because a custom field on an outward-facing form can _itself_ collect personal data,
`form_field` carries `is_pii` and `identifier_type_key` — so a workspace inventing a
field cannot accidentally create an unmapped collection point. It feeds the Data Map.

### Translations are first-class

s.5(3) and s.6(3) entitle a data principal to English or any Eighth Schedule language.
That reaches the _forms_, not just the notices — hence `form_field_i18n` and
`form_field_option_i18n` keyed on `(field_id, lang)`, and `question_i18n` for
questionnaires. Notices go further: full versioned translations with a
`translated_from_hash`, so a translation that has drifted from the base language is
detectable, which is exactly control B3's failure condition.

## 4. Questionnaires

Gap assessment (43 questions, 9 domains), the vendor security questionnaire, and DPIA
screening are the same shape: scored questions, a point-in-time run, a band.

One family — `questionnaire` → `question_domain` → `question`, answered into
`assessment_run` → `assessment_answer`. Runs are immutable-in-spirit: a completed run
is evidence, and re-assessing creates a new run rather than editing the old one, so the
trend is on record. `assessment_run.questionnaire_version` pins which question set was
answered.

`question_domain.gate_key` implements applicability: a workspace that processes no
children's data skips domain B entirely rather than scoring zero on it. The same
mechanism drives `control.is_applicable` for the conditional CCM controls (`SDF`,
`CHILD`, `CM`, `XBORDER`).

## 5. Statutory obligations expressed as constraints

Where the Act states an obligation, the schema states it too. These are the ones that
earn their keep — each was verified firing:

```sql
-- s.6(1)/s.5(1): consent recorded as "given" must resolve to the notice served with it
CONSTRAINT consent_given_requires_notice
  CHECK (status <> 'given' OR (notice_version_id IS NOT NULL AND given_at IS NOT NULL))

-- s.8(1) accountability: an approved RoPA entry carries the sign-off that makes it evidence
CONSTRAINT activity_approved_has_signoff
  CHECK (status <> 'approved' OR (approved_at IS NOT NULL AND approved_by IS NOT NULL))

-- s.10(2)(a): no DPIA completes on the assessor's word alone
CONSTRAINT dpia_approved_has_dpo
  CHECK (status <> 'approved' OR (dpo_employee_id IS NOT NULL AND approved_at IS NOT NULL))

-- s.6(7)/Rule 4: a Consent Manager must be Board-registered
CONSTRAINT vendor_cm_registered
  CHECK (party_role <> 'consent_manager' OR cm_registration_ref IS NOT NULL)

-- accepting a risk means the residual IS the inherent — no unearned reduction
CONSTRAINT dpia_risk_accept_no_reduction
  CHECK (decision <> 'accept'
      OR (residual_likelihood = likelihood AND residual_severity = severity))

-- high residual risk cannot be quietly parked without a named acceptor
CONSTRAINT risk_accepted_has_acceptor
  CHECK (status <> 'accepted' OR accepted_by IS NOT NULL)

-- an action exists to close something; orphan actions are how registers rot
CONSTRAINT action_has_parent CHECK (risk_id IS NOT NULL OR issue_id IS NOT NULL)
```

**Frozen clocks.** `dsr_request.due_at` and `breach_incident.board_due_at` are computed
at intake from the then-current setting and then never recomputed. Changing your
published response window must not retroactively move last month's deadlines — that
would be rewriting the evidence.

## 6. Personal data about data principals

`data_principal` is the most sensitive table in the product: it holds personal data
about the people the Act protects. Three decisions:

- **Lookup by HMAC.** `email_hmac` / `phone_hmac` are the unique indexes. Plaintext is
  never a lookup key.
- **Encrypted at the application layer.** `email_enc`, `phone_enc`, `display_name_enc`
  are AEAD ciphertext with the key in the vault, so a database dump is not by itself a
  reportable breach under s.8(6).
- **Erasable in place.** `erased_at` is a tombstone: identifiers are cleared, the
  consent ledger rows survive. s.12(3) requires erasure; s.6(10) requires proof. Both
  are satisfied because the ledger records _events_, not identities.

Credentials for data sources are **not in this database at all**. `data_source.config`
holds non-secret connection facts; `secret_ref` points at a vault entry the scanner
resolves. A schema-per-workspace dump should never contain a customer's production
database password.

Scan results never carry values — only `identifier_type_key`, a count, a confidence and
a `masked_sample`. That is a schema-level guarantee, matching the product promise that
raw values never leave the source.

## 7. Cross-module integrity

Three tables own all remediation state, and every module feeds them rather than
inventing its own:

- **`issue`** — a finding. Something _is_ wrong.
- **`risk`** — a consolidated exposure. Something _could_ go wrong.
- **`action`** — the work that closes either.

`issue.dedupe_key` with a partial unique index on open issues is what stops a control
that fails every night from spawning 30 identical issues:

```sql
CREATE UNIQUE INDEX issue_dedupe_idx ON issue (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status IN ('open','in_progress');
```

The nightly job upserts on `dedupe_key`; a resolved issue that recurs correctly opens a
new one, because the partial index no longer covers the resolved row.

**Fan-out is modelled, not assumed.** s.6(6) (cease on withdrawal), s.8(7) (erasure)
and s.11(b) (recipient list) all require reaching every processor. Each gets a target
table with its own per-target acknowledgement and clock — `withdrawal_propagation`,
`erasure_target`, `dsr_task`. "Done" means every target confirmed, which is a count,
not a checkbox.

**The outbox.** `outbox` is written in the _same transaction_ as the state change, so
"the consent was withdrawn but the processor was never told" is not a reachable state.

## 8. Index strategy

Indexes follow the screens and the jobs, not a guess. The pattern throughout is the
**partial index over the working set** — these registers are mostly closed rows, and
the queries are almost always about the open ones.

| Query the product actually runs                    | Index                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| DSR SLA board — open, nearest deadline first       | `dsr_request (due_at) WHERE status NOT IN ('completed','rejected','withdrawn')`   |
| Action Plan buckets (overdue / 30 / 60 / 90)       | `action (due_on) WHERE status IN ('open','in_progress')`                          |
| Control A1 — RoPA drafts past the confirmation SLA | `processing_activity (confirm_due_on) WHERE status IN ('draft','pending_review')` |
| Data Map "Unclassified" chip + the `dm_sla` job    | `dataset (classify_due_on) WHERE classification_status = 'unclassified'`          |
| Control C3 — withdrawals past SLA with no ack      | `withdrawal_propagation (due_at) WHERE status IN ('queued','sent')`               |
| Control B1 — consent with no paired notice         | `consent_record (id) WHERE notice_version_id IS NULL`                             |
| `tp_expiry` — s.8(2) contracts about to lapse      | `vendor_contract (expires_on) WHERE status = 'active'`                            |
| `ep_stale` — agents that stopped reporting         | `endpoint_device (last_report_at) WHERE agent_status IN ('active','outdated')`    |
| Control state trend / "changed" feed               | `control_run (ran_at DESC) WHERE previous_state IS DISTINCT FROM state`           |
| Scan scheduler wake-up                             | `data_source (next_scan_at) WHERE status = 'connected' AND deleted_at IS NULL`    |
| Outbox drain                                       | `outbox (available_at) WHERE processed_at IS NULL`                                |
| Register search (datasets, vendors, people)        | `GIN (… public.gin_trgm_ops)`                                                     |
| Custom-field containment                           | `GIN (custom jsonb_path_ops)` on each record table                                |
| Custom-field filter/sort                           | `custom_value (record_type_key, field_key, value_*)`, typed                       |

Two structural notes. `dashboard_snapshot` exists because the dashboard is expensive —
readiness score, 37 control states, every register's counts — and must never be
computed in the request path. And `ref_sequence` + `next_ref()` allocates human-facing
codes (`RA-001`, `DSR-0007`) inside the caller's transaction, so a rolled-back create
does not burn a number.

## 9. Migrations

The runner is specified in [WORKSPACE_ISOLATION.md §8](./WORKSPACE_ISOLATION.md). What
this schema adds:

- `public.schema_migration (schema_name, version)` — one row per schema per version.
  CI asserts `count(DISTINCT version) = 1` across all `ws_*`. Drift between tenants is
  how "works for most customers" bugs are born.
- `public.provisioning_job` — the work queue. Resumable by construction: a failure at
  workspace 400 of 900 is safe to re-run.
- Expand/contract only. Add nullable → backfill → switch reads → drop in a _later_
  deploy. Never a destructive migration alongside the code that stops using the column.
- **Every migration must be written to be re-runnable per schema.** `CREATE TABLE IF
NOT EXISTS` is not enough; the runner records versions, and the migration must not
  assume it is the first to touch a schema.

### One source of truth, one mirror

`db/schema/*.sql` is the schema. The Drizzle declarations in `src/server/db/schema/*.ts`
are a **partial mirror** — only the tables the application queries are declared, so
the mirror grows with the code, not with the schema. Partial is fine; wrong is not.
`pnpm db:check` (in `pnpm verify`) parses both sides and fails on any mirrored table
whose column set, NOT NULL, `pgEnum` values, or `CHECK (col IN (...))` allowlist
disagrees with the SQL after every migration is applied. A text column with a CHECK
allowlist must be declared `.$type<'a' | 'b'>()` in Drizzle so a service cannot compile
a value the row would reject — that is how `auth_challenge.purpose` writing
`'password_reset_verified'` (allowed by 0003, not by 0001) was caught.

### Templates diverge on purpose

Controls, questionnaires, courses, notice sections and forms are **copied** into a
workspace on provisioning, carrying `template_key` and `template_version`. A platform
update therefore says _"3 of your controls have a newer definition"_ rather than
silently overwriting a workspace's edits. Reference data (`dpdp_section`,
`penalty_head`, `identifier_type`, `restricted_country_notification`) is _not_ copied —
it is shared and versioned, because the Act is the same for everyone.

`restricted_country_notification` is an append-only event log rather than a flag on
`country`, because s.16(1) is a negative list that changes: a transfer assessed last
year must be replayable against the rules as they stood then. Hence `transfer_check` is
a time series, not a boolean.

## 10. Open questions for the team

Flagging rather than deciding — each changes work materially:

1. **Consent volume.** The ledger is the highest-cardinality table by an order of
   magnitude. At SME scale, plain tables are right. If a workspace crosses ~50M events,
   `consent_event` wants monthly range partitioning on `occurred_at`. Partitioning
   later is a migration; designing for it now is premature.
2. **`custom_value` write path.** Currently application-maintained on write. A trigger
   on each record table would be more robust but needs the form definition inside the
   trigger. Recommend: application-maintained, plus a nightly reconciliation job that
   rebuilds from jsonb and alerts on divergence.
3. **Endpoint agent volume.** 45 devices is nothing; 5,000 devices reporting daily makes
   `endpoint_finding` a hot table. The `(device_id, path)` unique key means upserts
   rather than growth, which should hold — worth measuring before assuming.
