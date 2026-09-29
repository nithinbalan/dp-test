/**
 * Drizzle schema for the RoPA (Record of Processing Activities) tables that
 * live INSIDE a `ws_<ulid>` workspace schema.
 *
 * Source of truth is db/schema/0002_workspace_template.sql §"processing_activity"
 * (plus the `lawful_basis` extension in 0006) — this is a partial mirror held to
 * it by `pnpm db:check`. Declare only tables the app queries; a mirrored table
 * must declare every one of its columns.
 *
 * Deliberately UNQUALIFIED, same convention as workspace.ts: these resolve
 * through the `search_path` that `withWorkspace()` pins to one tenant schema.
 *
 * Scoped down from the full 8-satellite-table design in 0002 §"processing_activity":
 * `activity_category`, `activity_operation` and `activity_safeguard` are mirrored
 * (they map directly onto the wizard's tag pickers with no other module's data
 * needed). `activity_processor`/`activity_dataset` are NOT — both require rows in
 * `vendor`/`dataset` tables no module writes yet, so "who else touches it" and
 * dataset-linking live in `processing_activity.custom` (ADR-0005: jsonb for data
 * that has no typed column) until a Vendors/Data-Map write path exists to back
 * them. `activity_version`/`activity_trigger` (full history, continuous-monitoring
 * triggers) are likewise deferred — the UI surfaces only the current `version`
 * integer today, not a version-by-version diff log.
 */
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/** Mirrors the `lawful_basis` enum (0002 §0, extended by 0006). */
export type LawfulBasis =
  | 'consent'
  | 'voluntary_provision'
  | 'state_benefit'
  | 'state_function'
  | 'legal_obligation'
  | 'court_order'
  | 'medical_emergency'
  | 'public_health'
  | 'disaster'
  | 'employment'
  | 'parental_consent'
  | 'security_safeguards';

/** Mirrors the `approval_state` enum (0002 §0). */
export type ApprovalState = 'draft' | 'pending_review' | 'approved' | 'needs_review' | 'retired';

/** Mirrors the `drafted_by` CHECK on `processing_activity`. */
export type DraftedBy = 'human' | 'ai' | 'import';

/**
 * One processing activity — the RoPA register's unit of record (s.5(1)). Every
 * statutory column here is locked once approved; editing any of them reopens
 * the record for re-approval (the app layer's job, not a DB trigger).
 */
export const processingActivity = pgTable('processing_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  refCode: text('ref_code').notNull(),

  name: text('name').notNull(),
  purpose: text('purpose').notNull(),
  principalType: text('principal_type').notNull(),
  basis: text('basis').$type<LawfulBasis>().notNull(),
  basisRef: text('basis_ref').notNull(),
  basisNote: text('basis_note'),
  retentionRule: text('retention_rule').notNull(),
  retentionPeriodDays: integer('retention_period_days'),
  retentionLawRef: text('retention_law_ref'),
  retentionSource: text('retention_source').notNull().default('owner_confirmed'),
  collectionSource: text('collection_source'),
  storageLocation: text('storage_location'),
  crossesBorder: boolean('crosses_border').notNull().default(false),
  ownerEmployeeId: uuid('owner_employee_id').notNull(),

  status: text('status').$type<ApprovalState>().notNull().default('draft'),
  version: integer('version').notNull().default(1),
  draftedBy: text('drafted_by').$type<DraftedBy>().notNull().default('human'),
  aiConfidence: smallint('ai_confidence'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by'),
  confirmDueOn: date('confirm_due_on'),
  nextReviewOn: date('next_review_on'),
  /** Which form shape produced this row — the Forms module owns writing it; unused here. */
  formVersionId: uuid('form_version_id'),

  /** Non-statutory extras with no typed column yet: processors, recipients,
   * dataset links, and the AI-generation `evidence`/`issues` trail. */
  custom: jsonb('custom').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

/** One (activity, identifier type) pair — the "What details do you handle?" tag picker. */
export const activityCategory = pgTable('activity_category', {
  activityId: uuid('activity_id').notNull(),
  identifierTypeKey: text('identifier_type_key').notNull(),
  isSensitive: boolean('is_sensitive').notNull().default(false),
});

/** Mirrors the CHECK on `activity_operation.operation`. */
export type ActivityOperationKind =
  | 'collection'
  | 'storage'
  | 'use'
  | 'sharing'
  | 'retrieval'
  | 'erasure'
  | 'profiling'
  | 'automated_decision';

/** One (activity, operation) pair — the "Processing operations" tag picker (s.2). */
export const activityOperation = pgTable('activity_operation', {
  activityId: uuid('activity_id').notNull(),
  operation: text('operation').$type<ActivityOperationKind>().notNull(),
});

/** One (activity, safeguard) pair — the "Security measures" tag picker (s.8(4)-(5)). */
export const activitySafeguard = pgTable('activity_safeguard', {
  activityId: uuid('activity_id').notNull(),
  safeguardKey: text('safeguard_key').notNull(),
});
