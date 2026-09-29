---
id: ADR-0005
title: Dynamic form fields — typed columns for statutory data, jsonb for custom
status: accepted
date: 2026-09-11
affects:
  - src/server/db
tags: [database, forms, configurability, dpdp, multi-tenancy]
---

# ADR-0005: Dynamic form fields — typed columns for statutory data, jsonb for custom

- **Status:** Accepted (2026-09-11, previously Proposed since 2026-08-30)
- **Date:** 2026-08-30

## Context

Every register in the product (RoPA, Data Map, DSR, vendors, breaches, DPIAs) needs a
form a workspace can reshape: relabel, translate into Eighth Schedule languages,
reorder, make optional, and add fields the DPDP Act never asked for. The Configuration
Studio's field builder is a shipped product surface, not a maybe.

At the same time, the Act's own requirements have to be enforceable. "Every processing
activity names a lawful basis" (s.4) is the difference between a compliance product and
a spreadsheet with opinions. It needs to be a constraint and an index, not a nightly
report.

The two pressures pull in opposite directions, and the workspace isolation design
removes the usual escape hatch: the app role cannot `CREATE`, `ALTER` or `DROP`
(WORKSPACE_ISOLATION.md §6), so runtime DDL per custom field is unavailable — and with
900 workspace schemas it would be unmigrateable anyway.

## Decision

Fields are split by **who requires them**, recorded on `form_field.storage_kind`:

- `'column'` — a statutory field. It maps to a real column on the real table via
  `target_column`, which must appear in the `public.record_type_column` allowlist. It
  can be relabelled, translated, reordered and hidden; it can never be deleted, and
  never repointed at a column the registry has not vouched for. No user-supplied string
  ever reaches a SQL identifier.
- `'custom'` — a workspace-invented field. It lands in the record's `custom jsonb`
  column, keyed by `form_field.key`. No migration, no DDL.

`form_field.is_locked` means _the Act requires this field_. Three CHECK constraints
enforce it: a locked field must be column-backed, must be required, and cannot be
hidden.

Custom fields marked `is_indexed` are additionally projected on write into
`custom_value`, which has typed columns (`value_text`, `value_number`, `value_date`,
`value_bool`, `value_ref`). The jsonb remains the source of truth; the projection is
derived and rebuildable.

`form_version.snapshot` freezes fields, options and translations at publish time, and
records point at the version that produced them.

## Consequences

**Good:**

- Statutory requirements are constraints, indexes and foreign keys — `owner_employee_id`
  really references a person.
- Adding a custom field is an INSERT. No migration, no deploy, no DDL privilege.
- Filtering and sorting on custom fields is an indexed range scan, not a cast in a
  predicate.
- A record filled in on a given date renders forever with the labels and options it was
  actually filled in under — which is what makes it evidence rather than a moving target.

**Bad / accepted costs:**

- Two write paths per record: typed columns and `custom` jsonb, plus the `custom_value`
  projection for indexed fields. The repository layer has to keep all three consistent,
  and a reconciliation job is required to prove it does.
- Reading a record for display means joining the form definition. Rendering is never a
  plain `SELECT *`.
- `custom_value` is EAV-shaped, with EAV's ergonomics — mitigated only by the fact that
  it is derived and optional rather than primary.

**Now harder to change:**

- Promoting a custom field to a statutory column is a real migration: add the column,
  backfill from jsonb, add it to `record_type_column`, flip `storage_kind`, drop the
  jsonb key. That is the intended cost — statutory fields should be deliberate.
- The `record_type_column` allowlist must be updated whenever a table gains a
  form-bindable column, or the field builder cannot see it.

## Alternatives considered

| Option                                                       | Why not                                                                                                                                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Column-per-custom-field via runtime `ALTER TABLE`            | Needs an app role that can ALTER, which WORKSPACE_ISOLATION.md §6 forbids. That rule is worth more than the query convenience. Also unmigrateable across 900 schemas with divergent columns. |
| Pure EAV for every field                                     | "Every activity has a lawful basis" degrades from a `NOT NULL` to a report. The Act's requirements deserve constraints.                                                                      |
| Pure jsonb for every field                                   | No foreign keys. `owner_employee_id` stops referencing a real person, and cascade behaviour on employee exit is lost.                                                                        |
| A separate `custom_<record_type>` side table per record type | All the join cost of the projection, none of its optionality, and one more table per record type to migrate.                                                                                 |

## Revisit when

- A workspace's `custom_value` projection exceeds roughly 10 million rows, or the
  reconciliation job routinely finds divergence — at that point a trigger-maintained
  projection (or a generated column per indexed field) becomes worth its complexity.
- More than a handful of custom fields are being promoted to statutory columns, which
  would mean the statutory set was drawn too narrowly in the first place.

## Adoption note (2026-09-11)

Accepted rather than left proposed: `db/schema/0002_workspace_template.sql` §2–§3 (the
`form`/`form_field`/`custom_value` tables, ~1,400 of the file's ~1,970 lines) already
implements this design in full, and every downstream table with a `custom jsonb` column
assumes it. A foundational, already-fully-built decision sitting in `proposed` status
was flagged in the September 2026 backend audit as a documentation/reality mismatch —
this note closes that, formalizing what was already shipped rather than changing it.
