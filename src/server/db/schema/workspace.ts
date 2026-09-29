/**
 * Drizzle schema for the tables that live INSIDE a `ws_<ulid>` workspace schema.
 *
 * Source of truth is db/schema/0002_workspace_template.sql — this is a partial
 * mirror held to it by `pnpm db:check` (docs/DATABASE_DESIGN.md §9). Declare only
 * tables the app queries; a mirrored table must declare every one of its columns.
 *
 * Deliberately UNQUALIFIED (`pgTable('workspace_profile')`, no schema argument):
 * these resolve through the `search_path` that `withWorkspace()` pins to exactly
 * one tenant schema. That is why they must never be handed to the platform client
 * — outside a workspace transaction they would resolve to nothing, or worse, to
 * whatever the pooled connection last had on its path.
 * See docs/WORKSPACE_ISOLATION.md §5.
 */
import {
  bigint,
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { bytea } from './platform';

/** An attachment's virus-scan lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql. */
export type AttachmentScanStatus = 'pending' | 'clean' | 'infected' | 'failed';

/**
 * One uploaded file, referenced by FK from `workspace_profile.logo_attachment_id`
 * and every other `*_attachment_id`/`attachment_id` column across the schema
 * (db/schema/0002_workspace_template.sql §17). `storageKey` is the object-store
 * path, prefixed `ws:<id>/` — never trust a caller-supplied key, only one this
 * module generates. Declared here, not queried until a feature needs it — the
 * workspace logo upload is the first.
 */
export const attachment = pgTable('attachment', {
  id: uuid('id').primaryKey().defaultRandom(),
  storageKey: text('storage_key').notNull().unique(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  sha256: bytea('sha256').notNull(),
  scanStatus: text('scan_status').$type<AttachmentScanStatus>().notNull().default('pending'),
  uploadedBy: uuid('uploaded_by'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  retainUntil: date('retain_until'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

/**
 * Singleton row (`id` is a boolean fixed to `true`) holding who the workspace is:
 * the legal entity, its statutory gates, the published DPO contact and branding.
 * The Configuration Studio "Workspace" panel reads and writes this row.
 */
export const workspaceProfile = pgTable('workspace_profile', {
  id: boolean('id').primaryKey().default(true),
  legalName: text('legal_name').notNull(),
  tradeName: text('trade_name'),
  sectorKey: text('sector_key').notNull(),
  cin: text('cin'),
  gstin: text('gstin'),
  registeredAddress: jsonb('registered_address').notNull().default({}),
  logoAttachmentId: uuid('logo_attachment_id'),
  dataRegion: text('data_region').notNull().default('ap-south-1'),
  isSignificantDf: boolean('is_significant_df').notNull().default(false),
  sdfNotifiedOn: date('sdf_notified_on'),
  processesChildren: boolean('processes_children').notNull().default(false),
  usesConsentManager: boolean('uses_consent_manager').notNull().default(false),
  transfersAbroad: boolean('transfers_abroad').notNull().default(false),
  dpoEmployeeId: uuid('dpo_employee_id'),
  grievanceEmployeeId: uuid('grievance_employee_id'),
  publishDpoContact: boolean('publish_dpo_contact').notNull().default(true),
  themeMode: text('theme_mode').$type<'light' | 'dark' | 'system'>().notNull().default('system'),
  brandPrimaryColor: text('brand_primary_color'),
  brandAccentColor: text('brand_accent_color'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Languages this workspace publishes in — s.5(3)/s.6(3). Exactly one row carries
 * `is_base` (a partial unique index enforces it), and `en` is that row by default.
 */
export const workspaceLanguage = pgTable('workspace_language', {
  code: text('code').primaryKey(),
  isBase: boolean('is_base').notNull().default(false),
  enabledAt: timestamp('enabled_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Workspace-configurable roles. System roles ship on provisioning
 * (tooling/scripts/lib/access-control-seed.ts); Admin is locked so a
 * workspace can never lock itself out.
 */
export const role = pgTable('role', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
  isSystem: boolean('is_system').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per (role, permission), individually toggleable. `permissionKey`
 * points at `public.permission.key` — validated in the domain layer, since
 * there is no cross-schema FK (see docs/DATABASE_DESIGN.md §2). Default is
 * deny: an ungranted permission reads as false, not "unset".
 */
export const rolePermission = pgTable('role_permission', {
  roleId: uuid('role_id')
    .notNull()
    .references(() => role.id, { onDelete: 'cascade' }),
  permissionKey: text('permission_key').notNull(),
  isGranted: boolean('is_granted').notNull().default(false),
});

/** Employee lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql. */
export type EmployeeStatus = 'active' | 'on_leave' | 'exited';

/**
 * The people register. An employee exists whether or not they can sign in, which is
 * why the DPO contact points here and not at `member`.
 */
export const employee = pgTable('employee', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull(),
  fullName: text('full_name').notNull(),
  workEmail: text('work_email'),
  phoneE164: text('phone_e164'),
  departmentId: uuid('department_id'),
  designation: text('designation'),
  memberId: uuid('member_id'),
  joinedOn: date('joined_on'),
  exitedOn: date('exited_on'),
  status: text('status').$type<EmployeeStatus>().notNull().default('active'),
  custom: jsonb('custom').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

/** Org units an employee can belong to. Referenced by `employee.department_id`. */
export const department = pgTable('department', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  headEmployeeId: uuid('head_employee_id'),
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

/** Agent lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql. */
export type EndpointAgentStatus = 'pending' | 'active' | 'outdated' | 'paused' | 'uninstalled';

/**
 * One laptop/desktop enrolled for endpoint discovery. The Employees page's
 * "Device & agent" column and the Endpoints module both read this table.
 */
export const endpointDevice = pgTable('endpoint_device', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceCode: text('device_code').notNull().unique(),
  employeeId: uuid('employee_id'),
  os: text('os').notNull(),
  osVersion: text('os_version'),
  agentVersion: text('agent_version'),
  agentStatus: text('agent_status').$type<EndpointAgentStatus>().notNull().default('pending'),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }),
  lastReportAt: timestamp('last_report_at', { withTimezone: true }),
  scanScope: text('scan_scope').array().notNull().default([]),
  custom: jsonb('custom').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** s.8(4) awareness course catalog. */
export const course = pgTable('course', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateKey: text('template_key'),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  durationMin: smallint('duration_min').notNull(),
  passMark: smallint('pass_mark').notNull().default(80),
  languages: text('languages').array().notNull().default(['en']),
  isMandatory: boolean('is_mandatory').notNull().default(false),
  recertMonths: smallint('recert_months'),
  status: text('status').$type<'draft' | 'active' | 'retired'>().notNull().default('active'),
  position: integer('position').notNull().default(0),
});

/** Enrollment lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql. */
export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'waived';

/**
 * One employee's progress against one course. The Employees page's "Awareness"
 * column aggregates this per employee — see `service.ts` for the policy.
 */
export const enrollment = pgTable('enrollment', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull(),
  campaignId: uuid('campaign_id'),
  employeeId: uuid('employee_id').notNull(),
  status: text('status').$type<EnrollmentStatus>().notNull().default('not_started'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  dueOn: date('due_on'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  bestScore: smallint('best_score'),
  attempts: smallint('attempts').notNull().default(0),
  lastRemindedAt: timestamp('last_reminded_at', { withTimezone: true }),
});

/** Notice lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql. */
export type NoticeStatus = 'draft' | 'published' | 'superseded' | 'withdrawn';

/**
 * A privacy notice (s.5 · Rule 3) — the register `/notices` reads. `activityId` is a
 * real FK to `processing_activity`, but RoPA has no real rows yet (mock-only), so it
 * stays null for every notice today; the picked mock activity's id/name lives in
 * `custom` purely for display until RoPA is wired to real data.
 */
export const notice = pgTable('notice', {
  id: uuid('id').primaryKey().defaultRandom(),
  refCode: text('ref_code').notNull(),
  name: text('name').notNull(),
  activityId: uuid('activity_id'),
  hostedSlug: text('hosted_slug'),
  ownerEmployeeId: uuid('owner_employee_id'),
  currentVersionId: uuid('current_version_id'),
  status: text('status').$type<NoticeStatus>().notNull().default('draft'),
  custom: jsonb('custom').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

/** Notice version lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql. */
export type NoticeVersionStatus = 'draft' | 'in_review' | 'published' | 'superseded';
export type NoticeVersionSource = 'ai' | 'manual' | 'template' | 'import';

/**
 * One immutable-once-published snapshot of a notice. `contentHash` is the sha256 over
 * the rendered base-language body — s.6(10) puts the burden of proof on the fiduciary,
 * so a published version's bytes must be reproducible exactly.
 */
export const noticeVersion = pgTable('notice_version', {
  id: uuid('id').primaryKey().defaultRandom(),
  noticeId: uuid('notice_id').notNull(),
  version: text('version').notNull(),
  status: text('status').$type<NoticeVersionStatus>().notNull().default('draft'),
  source: text('source').$type<NoticeVersionSource>().notNull().default('ai'),
  contentHash: bytea('content_hash').notNull(),
  readabilityGrade: smallint('readability_grade'),
  draftedBy: uuid('drafted_by'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  supersededAt: timestamp('superseded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per (version, language, section) — the eight Rule 3 sections
 * (who/collect/why/how/share/keep/rights/contact) generated deterministically from the
 * linked activity or free text (`service.ts`'s `NOTICE_SECTION_DEFS`), edited in place
 * until the notice is published.
 */
export const noticeSection = pgTable(
  'notice_section',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    versionId: uuid('version_id').notNull(),
    lang: text('lang').notNull(),
    sectionKey: text('section_key').notNull(),
    heading: text('heading').notNull(),
    body: text('body').notNull(),
    translatedFromHash: bytea('translated_from_hash'),
    position: integer('position').notNull(),
  },
  (table) => [unique().on(table.versionId, table.lang, table.sectionKey)],
);

// ─────────────────────────────────────────────────────────────────────────
// Gap Assessment (JDP-GAP) — questionnaire catalog copied per-workspace from
// the platform's `questionnaire_template`/`question_domain_template`/
// `question_template` (see tooling/scripts/lib/gap-assessment-seed.ts), plus
// the run/answer/domain-score tables an actual assessment writes to.
// ─────────────────────────────────────────────────────────────────────────

export type QuestionnaireKind = 'gap' | 'vendor_security' | 'dpia_screening' | 'custom';
export type QuestionnaireStatus = 'draft' | 'published' | 'archived';

/** One questionnaire this workspace can run — the Gap Assessment is `kind: 'gap'`. */
export const questionnaire = pgTable('questionnaire', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  templateKey: text('template_key'),
  kind: text('kind').$type<QuestionnaireKind>().notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  version: integer('version').notNull().default(1),
  scoring: jsonb('scoring').notNull().default({}),
  status: text('status').$type<QuestionnaireStatus>().notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** One scoring domain within a questionnaire — 9 for the Gap Assessment (A–I). */
export const questionDomain = pgTable(
  'question_domain',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionnaireId: uuid('questionnaire_id').notNull(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    sectionRefs: text('section_refs').array().notNull().default([]),
    moduleKey: text('module_key'),
    penaltyHeadKey: text('penalty_head_key'),
    gateKey: text('gate_key'),
    position: integer('position').notNull(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [unique().on(table.questionnaireId, table.key)],
);

/** One question — 43 for the Gap Assessment. */
export const question = pgTable(
  'question',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionnaireId: uuid('questionnaire_id').notNull(),
    domainId: uuid('domain_id').notNull(),
    code: text('code').notNull(),
    weight: smallint('weight').notNull().default(1),
    sectionRef: text('section_ref'),
    prompt: text('prompt').notNull(),
    remedy: text('remedy').notNull().default(''),
    moduleKey: text('module_key'),
    answerSet: text('answer_set').notNull().default('ynpu'),
    requiresNoteWhen: text('requires_note_when').array().notNull().default([]),
    isCustom: boolean('is_custom').notNull().default(false),
    position: integer('position').notNull(),
  },
  (table) => [unique().on(table.questionnaireId, table.code)],
);

/** Run lifecycle. Mirrors the CHECK in db/schema/0002_workspace_template.sql. */
export type AssessmentRunStatus = 'in_progress' | 'completed' | 'abandoned';
/** Mirrors the CHECK — always a workspace-level run for the Gap Assessment. */
export type AssessmentRunSubjectType = 'workspace' | 'vendor' | 'activity';

/**
 * One assessment attempt — append-only history, never overwritten. `profile`
 * holds the step-1 scope answers (entity/sector/records-held/gate answers);
 * `score_pct`/`band` are set once, on `completed_at`.
 */
export const assessmentRun = pgTable('assessment_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  refCode: text('ref_code').notNull().unique(),
  questionnaireId: uuid('questionnaire_id').notNull(),
  questionnaireVersion: integer('questionnaire_version').notNull(),
  subjectType: text('subject_type')
    .$type<AssessmentRunSubjectType>()
    .notNull()
    .default('workspace'),
  subjectId: uuid('subject_id'),
  assessorEmployeeId: uuid('assessor_employee_id'),
  profile: jsonb('profile').notNull().default({}),
  status: text('status').$type<AssessmentRunStatus>().notNull().default('in_progress'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  scorePct: numeric('score_pct', { precision: 5, scale: 2 }),
  band: text('band'),
  nextDueOn: date('next_due_on'),
  reportAttachmentId: uuid('report_attachment_id'),
  createdBy: uuid('created_by'),
});

/** One answer to one question, for one run. `'u'` (not sure) is never scored as compliant. */
export type AssessmentAnswerValue = 'y' | 'n' | 'p' | 'u';

export const assessmentAnswer = pgTable(
  'assessment_answer',
  {
    runId: uuid('run_id').notNull(),
    questionId: uuid('question_id').notNull(),
    answer: text('answer').$type<AssessmentAnswerValue>().notNull(),
    note: text('note'),
    evidenceAttachmentId: uuid('evidence_attachment_id'),
    answeredBy: uuid('answered_by'),
    answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.runId, table.questionId] })],
);

/** One domain's rollup for one run — `earned`/`possible` are weighted points, not percentages. */
export const assessmentDomainScore = pgTable(
  'assessment_domain_score',
  {
    runId: uuid('run_id').notNull(),
    domainId: uuid('domain_id').notNull(),
    earned: numeric('earned', { precision: 6, scale: 2 }).notNull(),
    possible: numeric('possible', { precision: 6, scale: 2 }).notNull(),
    band: text('band').notNull(),
    applicable: boolean('applicable').notNull().default(true),
  },
  (table) => [primaryKey({ columns: [table.runId, table.domainId] })],
);
