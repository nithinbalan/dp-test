-- =============================================================================
-- JETHUR DPDP · WORKSPACE SCHEMA TEMPLATE
-- =============================================================================
-- Applied verbatim into every `ws_<ulid>` schema by the migration runner. There is
-- no `workspace_id` column anywhere below — that is the point of schema-per-
-- workspace. If you find yourself adding one, you are in the wrong file.
--
-- Reads of platform reference data (`public.identifier_type`, `public.language`,
-- `public.dpdp_section`, …) go through an explicitly-scoped accessor, NOT through
-- `public` on the search_path. Cross-schema FKs are therefore deliberately absent:
-- reference keys are stored as text and validated in the domain layer. A workspace
-- export must be restorable on its own.
--
-- Conventions
--   · id            uuid, gen_random_uuid()
--   · ref_code      human-facing id (RA-001, DSR-0007) from `ref_sequence`
--   · custom        jsonb — user-defined fields, see §3
--   · created_at / updated_at / created_by on every mutable table
--   · ledgers (consent_event, audit_log) are APPEND-ONLY, enforced by trigger
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- §0 · SHARED TYPES & UTILITIES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE approval_state   AS ENUM ('draft','pending_review','approved','needs_review','retired');
CREATE TYPE work_state       AS ENUM ('open','in_progress','done','cancelled');
CREATE TYPE severity_band    AS ENUM ('low','medium','high','critical');
CREATE TYPE rag_level        AS ENUM ('l','m','h');
CREATE TYPE control_state    AS ENUM ('pass','fail','partial','not_applicable','unknown');
CREATE TYPE evidence_kind    AS ENUM ('auto','derived','attested','unknown');
CREATE TYPE lawful_basis     AS ENUM (
  'consent',                      -- s.6
  'voluntary_provision',          -- s.7(a)
  'state_benefit',                -- s.7(b)
  'state_function',               -- s.7(c)
  'legal_obligation',             -- s.7(d)
  'court_order',                  -- s.7(e)
  'medical_emergency',            -- s.7(f)
  'public_health',                -- s.7(g)
  'disaster',                     -- s.7(h)
  'employment'                    -- s.7(i)
);
CREATE TYPE form_data_type   AS ENUM ('text','long_text','select','multi_select','date','number','boolean','person','reference','currency','file');
CREATE TYPE storage_kind     AS ENUM ('column','custom');

-- Human-facing reference codes. One counter per prefix, per workspace, allocated
-- inside the caller's transaction so a rolled-back create does not burn a number.
CREATE TABLE ref_sequence (
  prefix     text PRIMARY KEY,                 -- 'RA','DSR','ISS','CNS'
  next_value bigint NOT NULL DEFAULT 1,
  pad        smallint NOT NULL DEFAULT 3
);

CREATE FUNCTION next_ref(p_prefix text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE n bigint; w smallint;
BEGIN
  INSERT INTO ref_sequence(prefix) VALUES (p_prefix) ON CONFLICT DO NOTHING;
  UPDATE ref_sequence SET next_value = next_value + 1
    WHERE prefix = p_prefix RETURNING next_value - 1, pad INTO n, w;
  RETURN p_prefix || '-' || lpad(n::text, w, '0');
END $$;

CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE FUNCTION deny_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'APPEND_ONLY_LEDGER: % rows cannot be updated or deleted', TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- §1 · WORKSPACE CONFIGURATION  (Configuration Studio)
-- ─────────────────────────────────────────────────────────────────────────────

-- Singleton. Enforced by a one-row constraint rather than by convention.
CREATE TABLE workspace_profile (
  id                 boolean PRIMARY KEY DEFAULT true CHECK (id),
  legal_name         text NOT NULL,
  trade_name         text,
  sector_key         text NOT NULL,
  cin                text,
  gstin              text,
  registered_address jsonb NOT NULL DEFAULT '{}',
  logo_attachment_id uuid,
  data_region        text NOT NULL DEFAULT 'ap-south-1',
  is_significant_df  boolean NOT NULL DEFAULT false,     -- s.10 — unlocks the SDF controls
  sdf_notified_on    date,
  processes_children boolean NOT NULL DEFAULT false,     -- s.9 gate
  uses_consent_manager boolean NOT NULL DEFAULT false,   -- s.6(7) gate
  transfers_abroad   boolean NOT NULL DEFAULT false,     -- s.16 gate
  dpo_employee_id    uuid,                               -- s.8(9) published contact
  grievance_employee_id uuid,                            -- s.13 responder
  publish_dpo_contact boolean NOT NULL DEFAULT true,     -- locked on: s.8(9)

  -- ── branding ──────────────────────────────────────────────────────────────
  -- Workspace-wide, not per-user: the workspace sets it, every member sees it.
  -- Stored as data, not a design-system violation — the app resolves these to
  -- CSS custom properties at render time; no component ever hardcodes a hex.
  -- NULL primary/accent ⇒ product default theme, no override.
  theme_mode          text NOT NULL DEFAULT 'system'
                         CHECK (theme_mode IN ('light','dark','system')),
  brand_primary_color char(7) CHECK (brand_primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  brand_accent_color  char(7) CHECK (brand_accent_color ~ '^#[0-9A-Fa-f]{6}$'),

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Every Configuration Studio toggle, dropdown and number. Typed as jsonb because
-- the *catalog* of settings is code (CS_SECS) and the values are data — a new
-- setting must never require a migration.
CREATE TABLE setting (
  key         text PRIMARY KEY,                          -- 'dr_win','br_board','cc_keep'
  module_key  text NOT NULL,
  value       jsonb NOT NULL,
  is_locked   boolean NOT NULL DEFAULT false,            -- statutory — UI refuses to change it
  updated_by  uuid,                                      -- FK added after `member` is defined
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX setting_module_idx ON setting (module_key);

-- Languages this workspace publishes in. Drives notice translations AND the
-- per-language labels on every custom form field (s.5(3), s.6(3)).
CREATE TABLE workspace_language (
  code       text PRIMARY KEY,                           -- must exist in public.language
  is_base    boolean NOT NULL DEFAULT false,             -- exactly one; 'en' by default
  enabled_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX workspace_language_base_idx ON workspace_language ((true)) WHERE is_base;

-- Roles are workspace-configurable. System roles ship on provisioning; Admin is
-- locked so a workspace can never lock itself out.
CREATE TABLE role (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  is_system   boolean NOT NULL DEFAULT false,
  is_locked   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One row per (role, permission), individually toggleable — a role can have
-- 'edit' but not 'delete' on a module, 'view' but not 'export'. This IS a
-- checkbox matrix, deliberately, on top of a closed catalog: the matrix stays
-- auditable because the set of checkable things is `public.permission`, curated
-- in code, not a free-text key a workspace could invent. `permission_key` is
-- validated against that catalog in the domain layer — same allowlist pattern
-- as form_field.target_column against record_type_column, and for the same
-- reason (no cross-schema FK; see DATABASE_DESIGN.md §2).
-- Default is deny: an ungranted permission reads as false, not "unset".
CREATE TABLE role_permission (
  role_id        uuid NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  permission_key text NOT NULL,                     -- public.permission.key
  is_granted     boolean NOT NULL DEFAULT false,
  PRIMARY KEY (role_id, permission_key)
);
CREATE INDEX role_permission_granted_idx ON role_permission (role_id) WHERE is_granted;

-- Mirrors public.membership into the workspace so joins to owner/approver columns
-- stay inside one schema. Reconciled by the membership sync job, never by hand.
CREATE TABLE member (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE,                    -- public.user_account.id
  role_id       uuid NOT NULL REFERENCES role(id),
  employee_id   uuid,
  display_name  text NOT NULL,
  email         text NOT NULL,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','suspended','removed')),
  joined_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX member_role_idx ON member (role_id) WHERE status = 'active';
ALTER TABLE setting ADD CONSTRAINT setting_updated_by_fk FOREIGN KEY (updated_by) REFERENCES member(id);

CREATE TABLE department (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name     text NOT NULL UNIQUE,
  head_employee_id uuid,
  position integer NOT NULL DEFAULT 0
);

-- The people register. An employee exists whether or not they can sign in —
-- ownership, training and endpoint enrolment all hang off this, not off `member`.
CREATE TABLE employee (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE,                   -- 'JTK/010'
  full_name      text NOT NULL,
  work_email     text,
  phone_e164     text,
  department_id  uuid REFERENCES department(id),
  designation    text,
  member_id      uuid REFERENCES member(id),             -- null ⇒ no platform login
  joined_on      date,
  exited_on      date,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_leave','exited')),
  handles_personal_data boolean NOT NULL DEFAULT false,  -- drives mandatory training scope
  custom         jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
CREATE INDEX employee_dept_idx   ON employee (department_id) WHERE deleted_at IS NULL;
CREATE INDEX employee_search_idx ON employee USING gin (full_name public.gin_trgm_ops);
ALTER TABLE member     ADD CONSTRAINT member_employee_fk   FOREIGN KEY (employee_id) REFERENCES employee(id);
ALTER TABLE department ADD CONSTRAINT department_head_fk   FOREIGN KEY (head_employee_id) REFERENCES employee(id);
ALTER TABLE workspace_profile
  ADD CONSTRAINT wp_dpo_fk       FOREIGN KEY (dpo_employee_id) REFERENCES employee(id),
  ADD CONSTRAINT wp_grievance_fk FOREIGN KEY (grievance_employee_id) REFERENCES employee(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- §2 · THE FORM ENGINE  (dynamic forms → typed tables + custom fields)
-- ─────────────────────────────────────────────────────────────────────────────
-- The problem: every register in this product needs a form that a workspace can
-- reshape — rename a label, translate it, reorder, make optional, add a field the
-- Act never asked for — WITHOUT giving up foreign keys, constraints or the ability
-- to say "show me every activity with no lawful basis" in one indexed query.
--
-- The answer is a HYBRID, and the split is decided by the Act, not by taste:
--
--   storage_kind = 'column'  →  a statutory field. It maps to a REAL column on the
--                               real table (`target_column`), validated against
--                               public.record_type_column. Constraints, FKs and
--                               indexes are normal. It can be relabelled,
--                               translated, reordered, helped and (unless
--                               `is_locked`) made optional — but never deleted,
--                               and never repointed at a column the registry has
--                               not vouched for.
--
--   storage_kind = 'custom'  →  a workspace-invented field. It lands in the
--                               record's `custom jsonb` column, keyed by
--                               form_field.key. Cheap to add, no migration, no
--                               DDL at runtime — and no chance of a user-supplied
--                               string ever reaching a SQL identifier.
--
-- Custom fields that need filtering/sorting are additionally projected into
-- `custom_value` (§3) on write, which gives an indexed, typed, queryable row per
-- value without an EAV table becoming the primary store. The jsonb is the source
-- of truth; the projection is derived and rebuildable.
--
-- Why not a column-per-custom-field (runtime DDL)? Because DDL from a request
-- handler needs a role that can ALTER TABLE, and WORKSPACE_ISOLATION.md §6 says
-- the app role cannot. That rule is worth more than the query convenience.
--
-- Why not pure EAV for everything? Because "every activity has a lawful basis" is
-- a CHECK constraint in one model and a nightly report in the other.

CREATE TABLE form (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type_key text NOT NULL,                    -- public.record_type.key
  key             text NOT NULL,
  name            text NOT NULL,
  description     text NOT NULL DEFAULT '',
  template_key    text,                             -- public.form_template.key it was seeded from
  template_version integer,                         -- lets us say "a newer default exists"
  is_default      boolean NOT NULL DEFAULT false,   -- the form used when none is named
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_version integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_type_key, key)
);
-- Exactly one default form per record type.
CREATE UNIQUE INDEX form_default_idx ON form (record_type_key) WHERE is_default;

CREATE TABLE form_section (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id   uuid NOT NULL REFERENCES form(id) ON DELETE CASCADE,
  key       text NOT NULL,
  label     text NOT NULL,
  help      text,
  position  integer NOT NULL,
  UNIQUE (form_id, key)
);

CREATE TABLE form_field (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id         uuid NOT NULL REFERENCES form(id) ON DELETE CASCADE,
  section_id      uuid REFERENCES form_section(id) ON DELETE SET NULL,
  key             text NOT NULL,                    -- stable; the jsonb key for custom fields
  label           text NOT NULL,                    -- base language; translations in form_field_i18n
  help            text,
  placeholder     text,
  data_type       form_data_type NOT NULL,
  storage_kind    storage_kind NOT NULL,
  target_column   text,                             -- required iff storage_kind='column'

  is_required     boolean NOT NULL DEFAULT false,
  is_system       boolean NOT NULL DEFAULT false,   -- shipped by us; can be hidden, never deleted
  is_locked       boolean NOT NULL DEFAULT false,   -- the ACT requires it; `is_required` is frozen true
  is_hidden       boolean NOT NULL DEFAULT false,
  is_indexed      boolean NOT NULL DEFAULT false,   -- custom fields: project into custom_value
  is_pii          boolean NOT NULL DEFAULT false,   -- a custom field that itself collects personal data
  identifier_type_key text,                         -- if is_pii: which identifier (feeds the Data Map)

  section_ref     text,                             -- 's.5(1)(a)' — shown as the statutory anchor
  validation      jsonb NOT NULL DEFAULT '{}',      -- {min,max,pattern,minLen,maxLen}
  default_value   jsonb,
  visibility_rule jsonb,                            -- {field:'basis', equals:'consent'}
  reference_type  text,                             -- data_type='reference': which record_type
  position        integer NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (form_id, key),
  -- A column-backed field must name its column; a custom field must not.
  CONSTRAINT form_field_target CHECK (
    (storage_kind = 'column' AND target_column IS NOT NULL) OR
    (storage_kind = 'custom' AND target_column IS NULL)
  ),
  -- Statutory fields are always column-backed. A workspace cannot demote one to jsonb.
  CONSTRAINT form_field_locked_is_column CHECK (NOT is_locked OR storage_kind = 'column'),
  CONSTRAINT form_field_locked_required  CHECK (NOT is_locked OR is_required),
  CONSTRAINT form_field_locked_visible   CHECK (NOT is_locked OR NOT is_hidden),
  -- Only these types can carry options.
  CONSTRAINT form_field_ref_type CHECK (data_type <> 'reference' OR reference_type IS NOT NULL)
);
CREATE INDEX form_field_form_idx   ON form_field (form_id, position);
CREATE INDEX form_field_custom_idx ON form_field (form_id) WHERE storage_kind = 'custom';

CREATE TABLE form_field_option (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id    uuid NOT NULL REFERENCES form_field(id) ON DELETE CASCADE,
  value       text NOT NULL,                        -- stable machine value
  label       text NOT NULL,
  is_sensitive boolean NOT NULL DEFAULT false,      -- red chip in the picker (Aadhaar, PAN, salary)
  meta        jsonb NOT NULL DEFAULT '{}',          -- e.g. {"section_ref":"s.7(i)"} on lawful basis
  is_archived boolean NOT NULL DEFAULT false,       -- retire an option WITHOUT orphaning old records
  position    integer NOT NULL,
  UNIQUE (field_id, value)
);

-- s.5(3): a notice must be readable in English or an Eighth Schedule language.
-- The same obligation reaches the FORMS a principal fills in at a collection
-- point, so translations are first-class on the field, not an afterthought.
CREATE TABLE form_field_i18n (
  field_id    uuid NOT NULL REFERENCES form_field(id) ON DELETE CASCADE,
  lang        text NOT NULL REFERENCES workspace_language(code) ON DELETE CASCADE,
  label       text NOT NULL,
  help        text,
  placeholder text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (field_id, lang)
);

CREATE TABLE form_field_option_i18n (
  option_id uuid NOT NULL REFERENCES form_field_option(id) ON DELETE CASCADE,
  lang      text NOT NULL REFERENCES workspace_language(code) ON DELETE CASCADE,
  label     text NOT NULL,
  PRIMARY KEY (option_id, lang)
);

-- An immutable snapshot of the whole form at publish time. A record written on
-- 12 Aug 2026 must render, forever, with the labels and options it was actually
-- filled in under — this is what makes a RoPA record or a consent artefact
-- evidence rather than a moving target.
CREATE TABLE form_version (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      uuid NOT NULL REFERENCES form(id) ON DELETE CASCADE,
  version      integer NOT NULL,
  snapshot     jsonb NOT NULL,                      -- fields + options + all translations
  content_hash bytea NOT NULL,
  published_by uuid REFERENCES member(id),
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, version)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §3 · CUSTOM VALUE PROJECTION
-- ─────────────────────────────────────────────────────────────────────────────
-- Derived from each record's `custom` jsonb on write. Present only for fields
-- marked is_indexed — so a workspace with 40 custom fields and 3 filterable ones
-- pays for 3. Rebuildable from the jsonb at any time; never the source of truth.
--
-- Typed columns, not a single text column: "due in the next 30 days" on a custom
-- date field has to be a range scan, not a cast in the predicate.

CREATE TABLE custom_value (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_type_key text NOT NULL,
  record_id       uuid NOT NULL,
  field_id        uuid NOT NULL REFERENCES form_field(id) ON DELETE CASCADE,
  field_key       text NOT NULL,                    -- denormalised: survives a field rename
  position        smallint NOT NULL DEFAULT 0,      -- multi_select: one row per selection
  value_text      text,
  value_number    numeric,
  value_date      date,
  value_bool      boolean,
  value_ref       uuid,                             -- person / reference fields
  UNIQUE (record_type_key, record_id, field_id, position)
);
CREATE INDEX custom_value_lookup_idx ON custom_value (record_type_key, field_key, value_text);
CREATE INDEX custom_value_date_idx   ON custom_value (record_type_key, field_key, value_date) WHERE value_date IS NOT NULL;
CREATE INDEX custom_value_num_idx    ON custom_value (record_type_key, field_key, value_number) WHERE value_number IS NOT NULL;
CREATE INDEX custom_value_record_idx ON custom_value (record_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- §4 · QUESTIONNAIRES  (gap assessment · vendor security · DPIA screening)
-- ─────────────────────────────────────────────────────────────────────────────
-- Same configurability story as forms, different shape: questions are SCORED and
-- an answer set is a point-in-time run, not a mutable record.

CREATE TABLE questionnaire (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL UNIQUE,
  template_key text,
  kind         text NOT NULL CHECK (kind IN ('gap','vendor_security','dpia_screening','custom')),
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  version      integer NOT NULL DEFAULT 1,
  scoring      jsonb NOT NULL DEFAULT '{}',         -- {"y":1,"p":0.5,"n":0,"u":0}, band cut-offs
  status       text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE question_domain (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaire(id) ON DELETE CASCADE,
  key              text NOT NULL,
  name             text NOT NULL,
  section_refs     text[] NOT NULL DEFAULT '{}',
  module_key       text,
  penalty_head_key text,                            -- what a failure here exposes
  gate_key         text,                            -- skip the whole domain if not applicable
  position         integer NOT NULL,
  UNIQUE (questionnaire_id, key)
);

CREATE TABLE question (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaire(id) ON DELETE CASCADE,
  domain_id        uuid NOT NULL REFERENCES question_domain(id) ON DELETE CASCADE,
  code             text NOT NULL,
  weight           smallint NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 3),
  section_ref      text,
  prompt           text NOT NULL,
  remedy           text NOT NULL DEFAULT '',
  module_key       text,
  answer_set       text NOT NULL DEFAULT 'ynpu',
  requires_note_when text[] NOT NULL DEFAULT '{}',  -- e.g. '{n,u}' per the ga_notes setting
  is_custom        boolean NOT NULL DEFAULT false,
  position         integer NOT NULL,
  UNIQUE (questionnaire_id, code)
);

CREATE TABLE question_i18n (
  question_id uuid NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  lang        text NOT NULL REFERENCES workspace_language(code) ON DELETE CASCADE,
  prompt      text NOT NULL,
  remedy      text,
  PRIMARY KEY (question_id, lang)
);

CREATE TABLE assessment_run (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code         text NOT NULL UNIQUE DEFAULT next_ref('GAP'),
  questionnaire_id uuid NOT NULL REFERENCES questionnaire(id),
  questionnaire_version integer NOT NULL,
  subject_type     text NOT NULL DEFAULT 'workspace' CHECK (subject_type IN ('workspace','vendor','activity')),
  subject_id       uuid,                            -- null for a workspace-level run
  assessor_employee_id uuid REFERENCES employee(id),
  profile          jsonb NOT NULL DEFAULT '{}',     -- entity, sector, volume, kids/proc/xbt gates
  status           text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  started_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz,
  score_pct        numeric(5,2),
  band             text,                            -- 'not_started','developing','ready'
  next_due_on      date,                            -- from the ga_cad cadence setting
  report_attachment_id uuid,
  created_by       uuid REFERENCES member(id)
);
CREATE INDEX assessment_run_subject_idx ON assessment_run (subject_type, subject_id, completed_at DESC);

CREATE TABLE assessment_answer (
  run_id        uuid NOT NULL REFERENCES assessment_run(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES question(id),
  answer        text NOT NULL CHECK (answer IN ('y','n','p','u')),  -- 'u' = not sure → verify, never scored as compliant
  note          text,
  evidence_attachment_id uuid,
  answered_by   uuid REFERENCES member(id),
  answered_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, question_id)
);
CREATE INDEX assessment_answer_gap_idx ON assessment_answer (run_id) WHERE answer IN ('n','p','u');

CREATE TABLE assessment_domain_score (
  run_id     uuid NOT NULL REFERENCES assessment_run(id) ON DELETE CASCADE,
  domain_id  uuid NOT NULL REFERENCES question_domain(id),
  earned     numeric(6,2) NOT NULL,
  possible   numeric(6,2) NOT NULL,
  band       text NOT NULL,
  applicable boolean NOT NULL DEFAULT true,
  PRIMARY KEY (run_id, domain_id)
);

-- What the run says you are exposed to, as of the run. Amounts come from
-- public.penalty_head so the Schedule is data, not a hardcoded string.
CREATE TABLE assessment_exposure (
  run_id           uuid NOT NULL REFERENCES assessment_run(id) ON DELETE CASCADE,
  penalty_head_key text NOT NULL,
  is_exposed       boolean NOT NULL,
  failing_question_codes text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (run_id, penalty_head_key)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §5 · DATA DISCOVERY  (Data Sources · Data Map · Endpoints)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE data_source (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code        text NOT NULL UNIQUE DEFAULT next_ref('SRC'),
  connector_key   text NOT NULL,                    -- public.connector.key
  name            text NOT NULL,
  environment     text NOT NULL DEFAULT 'production' CHECK (environment IN ('production','staging','development')),
  -- Non-secret connection facts only. Credentials NEVER live in this database:
  -- `secret_ref` points at the KMS/vault entry, and the scanner resolves it.
  config          jsonb NOT NULL DEFAULT '{}',
  secret_ref      text,
  host_region     text,                             -- feeds the s.16 transfer check
  owner_employee_id uuid REFERENCES employee(id),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','connected','error','paused','disconnected')),
  status_detail   text,
  connected_at    timestamptz,
  last_scan_at    timestamptz,
  next_scan_at    timestamptz,
  scan_schedule   text NOT NULL DEFAULT 'nightly',  -- from the ds_sched setting; overridable per source
  sampling_pct    numeric(5,2) NOT NULL DEFAULT 2.00,
  custom          jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
CREATE INDEX data_source_due_idx    ON data_source (next_scan_at) WHERE status = 'connected' AND deleted_at IS NULL;
CREATE INDEX data_source_status_idx ON data_source (status) WHERE deleted_at IS NULL;

-- Which databases / buckets / paths / mailboxes inside a source are in scope.
CREATE TABLE data_source_scope (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id uuid NOT NULL REFERENCES data_source(id) ON DELETE CASCADE,
  scope_kind     text NOT NULL CHECK (scope_kind IN ('database','schema','bucket','path','mailbox','project')),
  name           text NOT NULL,
  is_included    boolean NOT NULL DEFAULT true,
  object_count   integer,
  UNIQUE (data_source_id, scope_kind, name)
);

CREATE TABLE scan_run (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id  uuid NOT NULL REFERENCES data_source(id) ON DELETE CASCADE,
  kind            text NOT NULL DEFAULT 'scheduled' CHECK (kind IN ('scheduled','manual','initial','rescan')),
  status          text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','partial','failed','cancelled')),
  sampling_pct    numeric(5,2),
  objects_scanned integer NOT NULL DEFAULT 0,
  datasets_found  integer NOT NULL DEFAULT 0,
  new_identifiers integer NOT NULL DEFAULT 0,
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  error           text,
  triggered_by    uuid REFERENCES member(id)
);
CREATE INDEX scan_run_source_idx ON scan_run (data_source_id, started_at DESC);

-- The Data Map. A dataset is discovered by a scan OR added by hand where a
-- scanner cannot reach (a spreadsheet, a paper register) — both are evidence,
-- with different confidence. `classification_status` is what the Unclassified
-- filter and the dm_sla setting act on.
CREATE TABLE dataset (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code            text NOT NULL UNIQUE DEFAULT next_ref('DS'),
  name                text NOT NULL,                -- 'crm.contacts', 'hr/attendance.xlsx'
  data_source_id      uuid REFERENCES data_source(id) ON DELETE SET NULL,
  source_label        text NOT NULL,                -- survives a source disconnect
  location            text,                          -- table / prefix / folder
  discovery           text NOT NULL DEFAULT 'scan' CHECK (discovery IN ('scan','manual','import','endpoint')),
  record_count_estimate bigint,
  has_sensitive       boolean NOT NULL DEFAULT false,   -- maintained by trigger from dataset_identifier
  classification_status text NOT NULL DEFAULT 'unclassified'
                        CHECK (classification_status IN ('unclassified','classified','excluded')),
  classify_due_on     date,                          -- now() + dm_sla days
  owner_employee_id   uuid REFERENCES employee(id),
  retention_override  text,
  storage_region      text,
  is_encrypted        boolean,                       -- control G1 evidence
  custom              jsonb NOT NULL DEFAULT '{}',
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);
-- "0 Data Map datasets without an activity" (control A1) is this index.
CREATE INDEX dataset_unclassified_idx ON dataset (classify_due_on)
  WHERE classification_status = 'unclassified' AND deleted_at IS NULL;
CREATE INDEX dataset_sensitive_idx    ON dataset (has_sensitive) WHERE has_sensitive AND deleted_at IS NULL;
CREATE INDEX dataset_source_idx       ON dataset (data_source_id) WHERE deleted_at IS NULL;
CREATE INDEX dataset_search_idx       ON dataset USING gin (name public.gin_trgm_ops);
CREATE INDEX dataset_custom_idx       ON dataset USING gin (custom jsonb_path_ops);

-- What the scan actually FOUND, per identifier type. Never the value — only the
-- type, a count, a confidence and a masked sample. Raw values never leave the source.
CREATE TABLE dataset_identifier (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          uuid NOT NULL REFERENCES dataset(id) ON DELETE CASCADE,
  identifier_type_key text NOT NULL,                -- public.identifier_type.key
  column_or_path      text,
  occurrence_count    bigint NOT NULL DEFAULT 0,
  confidence          numeric(4,3) NOT NULL DEFAULT 1.000,
  masked_sample       text,                          -- 'aa****@***.com' — never the value
  -- Denormalised from public.identifier_type at write time. Copied deliberately:
  -- the workspace schema must be readable with `search_path = ws_x` alone, and a
  -- dataset exported today must still know what was sensitive today.
  is_sensitive        boolean NOT NULL DEFAULT false,
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  last_scan_run_id    uuid REFERENCES scan_run(id),
  UNIQUE (dataset_id, identifier_type_key, column_or_path)
);
CREATE INDEX dataset_identifier_type_idx ON dataset_identifier (identifier_type_key);

CREATE TABLE endpoint_device (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code    text NOT NULL UNIQUE,              -- 'MAC-010'
  employee_id    uuid REFERENCES employee(id),
  os             text NOT NULL,
  os_version     text,
  agent_version  text,
  agent_status   text NOT NULL DEFAULT 'pending'
                   CHECK (agent_status IN ('pending','active','outdated','paused','uninstalled')),
  enrolled_at    timestamptz,
  last_report_at timestamptz,
  scan_scope     text[] NOT NULL DEFAULT '{}',      -- 'Desktop','Downloads','full_profile'
  custom         jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
-- The ep_stale alert reads this.
CREATE INDEX endpoint_device_stale_idx ON endpoint_device (last_report_at) WHERE agent_status IN ('active','outdated');

CREATE TABLE endpoint_scan (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id      uuid NOT NULL REFERENCES endpoint_device(id) ON DELETE CASCADE,
  scope          text NOT NULL,
  status         text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','failed')),
  findings_count integer NOT NULL DEFAULT 0,
  started_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz
);
CREATE INDEX endpoint_scan_device_idx ON endpoint_scan (device_id, started_at DESC);

CREATE TABLE endpoint_finding (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id           uuid NOT NULL REFERENCES endpoint_device(id) ON DELETE CASCADE,
  scan_id             uuid REFERENCES endpoint_scan(id) ON DELETE SET NULL,
  path                text NOT NULL,                -- 'kyc_screens/' — location only
  identifier_type_keys text[] NOT NULL DEFAULT '{}',
  item_count          integer NOT NULL DEFAULT 1,
  confidence          numeric(4,3) NOT NULL DEFAULT 1.000,
  masked_sample       text,
  status              text NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','accepted','remediated','false_positive')),
  dataset_id          uuid REFERENCES dataset(id),  -- promoted onto the Data Map
  issue_id            uuid,
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, path)
);
CREATE INDEX endpoint_finding_open_idx ON endpoint_finding (status) WHERE status = 'open';

-- ─────────────────────────────────────────────────────────────────────────────
-- §6 · DATA FOUNDATION  (Collection Hub · RoPA)
-- ─────────────────────────────────────────────────────────────────────────────

-- Every point where personal data enters the business. This is where the form
-- engine faces OUTWARD: `form_id` is the actual consent form a data principal
-- fills in, `notice_id` is the notice served with it (s.5(1) pairing), and the
-- consent ledger records both versions against every consent artefact.
CREATE TABLE collection_point (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code        text NOT NULL UNIQUE DEFAULT next_ref('CP'),
  name            text NOT NULL,
  channel         text NOT NULL CHECK (channel IN ('web_form','mobile_app','whatsapp','offline','api','call_centre','email','kiosk')),
  url             text,
  form_id         uuid REFERENCES form(id),         -- the public-facing form
  notice_id       uuid,                             -- FK added after `notice`
  activity_id     uuid,                             -- FK added after `processing_activity`
  basis           lawful_basis NOT NULL DEFAULT 'consent',
  collects_child_data boolean NOT NULL DEFAULT false,
  age_assurance_method text,                        -- s.9(1) — null is a control D1 failure
  withdrawal_url  text,                             -- s.6(4) parity check reads this
  withdrawal_steps smallint,                        -- click-count for the C2 parity test
  give_steps      smallint,
  owner_employee_id uuid REFERENCES employee(id),
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','paused','retired')),
  went_live_at    timestamptz,
  custom          jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX collection_point_live_idx ON collection_point (status) WHERE status = 'live';

-- The RoPA register. Statutory fields are real columns (so "every activity names
-- a lawful basis" is a NOT NULL, not a report); anything the workspace adds in
-- the Configuration Studio field builder lands in `custom`.
CREATE TABLE processing_activity (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code          text NOT NULL UNIQUE DEFAULT next_ref('RA'),

  -- ── statutory columns (record_type_column.is_statutory = true) ──────────────
  name              text NOT NULL,                                  -- locked
  purpose           text NOT NULL,                                  -- locked · s.5(1)(a)
  principal_type    text NOT NULL,                                  -- locked
  basis             lawful_basis NOT NULL,                          -- locked · s.4
  basis_ref         text NOT NULL,                                  -- 's.7(i)'
  basis_note        text,                                           -- why this s.7 clause applies
  retention_rule    text NOT NULL,                                  -- locked · s.8(7)
  retention_period_days integer,
  retention_law_ref text,                                           -- s.8(8) statutory override
  retention_source  text NOT NULL DEFAULT 'owner_confirmed',
  collection_source text,
  storage_location  text,
  crosses_border    boolean NOT NULL DEFAULT false,                 -- s.16
  owner_employee_id uuid NOT NULL REFERENCES employee(id),          -- locked

  -- ── lifecycle ──────────────────────────────────────────────────────────────
  status            approval_state NOT NULL DEFAULT 'draft',
  version           integer NOT NULL DEFAULT 1,
  drafted_by        text NOT NULL DEFAULT 'human' CHECK (drafted_by IN ('human','ai','import')),
  ai_confidence     smallint CHECK (ai_confidence BETWEEN 0 AND 100),
  approved_at       timestamptz,
  approved_by       uuid REFERENCES employee(id),
  confirm_due_on    date,                                           -- draft + rp_sla days
  next_review_on    date,                                           -- rp_review cycle
  form_version_id   uuid REFERENCES form_version(id),               -- which form shape produced it

  custom            jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES member(id),
  deleted_at        timestamptz,

  -- An approved activity must actually carry the sign-off that makes it evidence.
  CONSTRAINT activity_approved_has_signoff CHECK (
    status <> 'approved' OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)
  )
);
CREATE INDEX activity_status_idx  ON processing_activity (status) WHERE deleted_at IS NULL;
CREATE INDEX activity_owner_idx   ON processing_activity (owner_employee_id) WHERE deleted_at IS NULL;
-- Control A1: drafts sitting past the confirmation SLA.
CREATE INDEX activity_overdue_idx ON processing_activity (confirm_due_on)
  WHERE status IN ('draft','pending_review') AND deleted_at IS NULL;
CREATE INDEX activity_review_idx  ON processing_activity (next_review_on) WHERE status = 'approved';
CREATE INDEX activity_custom_idx  ON processing_activity USING gin (custom jsonb_path_ops);

ALTER TABLE collection_point ADD CONSTRAINT cp_activity_fk
  FOREIGN KEY (activity_id) REFERENCES processing_activity(id);

-- Full snapshot per version. `diff` is what the "v2 — +1 processor, +1 recipient"
-- line in the audit trail renders from.
CREATE TABLE activity_version (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id    uuid NOT NULL REFERENCES processing_activity(id) ON DELETE CASCADE,
  version        integer NOT NULL,
  snapshot       jsonb NOT NULL,
  diff           jsonb NOT NULL DEFAULT '{}',
  change_summary text NOT NULL DEFAULT '',
  created_by     uuid REFERENCES member(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, version)
);

-- Declared data categories. Control A2 reconciles these against what scans
-- observed in `dataset_identifier` — the variance is the finding.
CREATE TABLE activity_category (
  activity_id         uuid NOT NULL REFERENCES processing_activity(id) ON DELETE CASCADE,
  identifier_type_key text NOT NULL,
  is_sensitive        boolean NOT NULL DEFAULT false,
  PRIMARY KEY (activity_id, identifier_type_key)
);
CREATE INDEX activity_category_type_idx ON activity_category (identifier_type_key);

CREATE TABLE activity_dataset (
  activity_id uuid NOT NULL REFERENCES processing_activity(id) ON DELETE CASCADE,
  dataset_id  uuid NOT NULL REFERENCES dataset(id) ON DELETE CASCADE,
  linked_by   uuid REFERENCES member(id),
  linked_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, dataset_id)
);
CREATE INDEX activity_dataset_ds_idx ON activity_dataset (dataset_id);

CREATE TABLE activity_processor (
  activity_id uuid NOT NULL REFERENCES processing_activity(id) ON DELETE CASCADE,
  vendor_id   uuid NOT NULL,                        -- FK added after `vendor`
  party_role  text NOT NULL CHECK (party_role IN ('processor','recipient','joint_fiduciary','consent_manager')),
  PRIMARY KEY (activity_id, vendor_id, party_role)
);

CREATE TABLE activity_operation (
  activity_id uuid NOT NULL REFERENCES processing_activity(id) ON DELETE CASCADE,
  operation   text NOT NULL CHECK (operation IN ('collection','storage','use','sharing','retrieval','erasure','profiling','automated_decision')),
  PRIMARY KEY (activity_id, operation)
);

CREATE TABLE activity_safeguard (
  activity_id   uuid NOT NULL REFERENCES processing_activity(id) ON DELETE CASCADE,
  safeguard_key text NOT NULL,                      -- 'encryption_at_rest','access_control','audit_logging'
  PRIMARY KEY (activity_id, safeguard_key)
);

CREATE TABLE activity_approval (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  uuid NOT NULL REFERENCES processing_activity(id) ON DELETE CASCADE,
  version      integer NOT NULL,
  actor_employee_id uuid NOT NULL REFERENCES employee(id),
  decision     text NOT NULL CHECK (decision IN ('approved','rejected','changes_requested')),
  note         text,
  decided_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_approval_act_idx ON activity_approval (activity_id, decided_at DESC);

-- Control A3: processing must not drift silently. A trigger fires when a new
-- processor / source / field / location appears and reopens the activity.
CREATE TABLE activity_trigger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id   uuid NOT NULL REFERENCES processing_activity(id) ON DELETE CASCADE,
  trigger_kind  text NOT NULL CHECK (trigger_kind IN ('new_processor','new_source','new_identifier','location_change','volume_change')),
  is_armed      boolean NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  fired_detail  jsonb,
  review_due_on date,
  UNIQUE (activity_id, trigger_kind)
);
CREATE INDEX activity_trigger_due_idx ON activity_trigger (review_due_on) WHERE review_due_on IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- §7 · NOTICE MANAGER  (s.5 · Rule 3)
-- ─────────────────────────────────────────────────────────────────────────────
-- A notice is versioned, hashed and multilingual. The hash matters: s.6(10) puts
-- the burden of proof on the fiduciary, so a consent record must resolve to the
-- EXACT bytes served — not to "the notice", which changes.

CREATE TABLE notice (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code          text NOT NULL UNIQUE DEFAULT next_ref('NTC'),
  name              text NOT NULL,
  activity_id       uuid REFERENCES processing_activity(id),
  hosted_slug       text UNIQUE,                    -- notices.<ws>.jethurdpdp.com/<slug>
  owner_employee_id uuid REFERENCES employee(id),
  current_version_id uuid,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','superseded','withdrawn')),
  custom            jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
ALTER TABLE collection_point ADD CONSTRAINT cp_notice_fk FOREIGN KEY (notice_id) REFERENCES notice(id);

CREATE TABLE notice_version (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id     uuid NOT NULL REFERENCES notice(id) ON DELETE CASCADE,
  version       text NOT NULL,                      -- 'v3.1'
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','published','superseded')),
  source        text NOT NULL DEFAULT 'ai' CHECK (source IN ('ai','manual','template','import')),
  content_hash  bytea NOT NULL,                     -- sha256 over the rendered base-language body
  readability_grade smallint,                       -- Rule 3: understandable on its own
  drafted_by    uuid REFERENCES member(id),
  approved_by   uuid REFERENCES member(id),
  approved_at   timestamptz,
  published_at  timestamptz,
  superseded_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notice_id, version)
);
ALTER TABLE notice ADD CONSTRAINT notice_current_fk FOREIGN KEY (current_version_id) REFERENCES notice_version(id);
CREATE INDEX notice_version_published_idx ON notice_version (notice_id, published_at DESC) WHERE status = 'published';

-- One row per (version, language, section). The base language is authoritative;
-- a translation whose `translated_from_hash` no longer matches the base section's
-- hash is LAGGING — which is exactly what control B3 fails on.
CREATE TABLE notice_section (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id   uuid NOT NULL REFERENCES notice_version(id) ON DELETE CASCADE,
  lang         text NOT NULL,
  section_key  text NOT NULL,                       -- public.notice_section_template.key
  heading      text NOT NULL,
  body         text NOT NULL,
  translated_from_hash bytea,
  position     integer NOT NULL,
  UNIQUE (version_id, lang, section_key)
);

CREATE TABLE notice_language (
  version_id   uuid NOT NULL REFERENCES notice_version(id) ON DELETE CASCADE,
  lang         text NOT NULL,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','translated','published','lagging')),
  translated_at timestamptz,
  published_at timestamptz,
  PRIMARY KEY (version_id, lang)
);

-- Rule 3's six required elements, checked per version. This is the table control
-- B2 reads; "6/6 present" is a count, not a human's opinion.
CREATE TABLE notice_checklist (
  version_id   uuid NOT NULL REFERENCES notice_version(id) ON DELETE CASCADE,
  element_key  text NOT NULL,                       -- 'itemised_data','purpose','withdraw','rights','board_complaint','dpo_contact'
  is_present   boolean NOT NULL DEFAULT false,
  evidence     text,
  checked_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (version_id, element_key)
);

-- Where a version was actually served, and the proof of it.
CREATE TABLE notice_publication (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id         uuid NOT NULL REFERENCES notice_version(id) ON DELETE CASCADE,
  collection_point_id uuid REFERENCES collection_point(id),
  channel            text NOT NULL CHECK (channel IN ('hosted_page','iframe','pdf','email','whatsapp','in_app')),
  url                text,
  published_at       timestamptz NOT NULL DEFAULT now(),
  unpublished_at     timestamptz,
  screenshot_attachment_id uuid,
  delivered_count    integer,                        -- s.5(2) legacy catch-up campaigns
  bounced_count      integer
);
CREATE INDEX notice_pub_cp_idx ON notice_publication (collection_point_id) WHERE unpublished_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- §8 · DATA PRINCIPALS + CONSENT LEDGER  (s.6 · s.9)
-- ─────────────────────────────────────────────────────────────────────────────
-- The principal record is the most sensitive table in the product: it is personal
-- data ABOUT the people the Act protects. Therefore:
--   · lookup happens on HMAC hashes, never on plaintext
--   · plaintext contact details are stored encrypted (application-layer AEAD,
--     key in the vault) so a database dump is not a breach on its own
--   · the table is erasable in place — s.12(3)/s.8(7) must be executable

CREATE TABLE data_principal (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref      text,                           -- the fiduciary's own customer id
  email_hmac        bytea,                          -- lookup key
  phone_hmac        bytea,
  email_enc         bytea,                          -- AEAD ciphertext
  phone_enc         bytea,
  display_name_enc  bytea,
  is_child          boolean NOT NULL DEFAULT false, -- s.9
  date_of_birth     date,
  age_assurance_method text,
  guardian_principal_id uuid REFERENCES data_principal(id),
  guardian_verified_at timestamptz,                 -- s.9(1) verifiable parental consent
  nominee           jsonb,                          -- s.14 right to nominate
  erased_at         timestamptz,                    -- tombstone: identifiers cleared, ledger kept
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX principal_email_idx ON data_principal (email_hmac) WHERE email_hmac IS NOT NULL;
CREATE UNIQUE INDEX principal_phone_idx ON data_principal (phone_hmac) WHERE phone_hmac IS NOT NULL;
CREATE INDEX principal_external_idx     ON data_principal (external_ref);
CREATE INDEX principal_child_idx        ON data_principal (is_child) WHERE is_child;

-- The consent artefact. Mutable summary columns for querying; the TRUTH is the
-- append-only event chain below.
CREATE TABLE consent_record (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code            text NOT NULL UNIQUE DEFAULT next_ref('CNS'),
  principal_id        uuid NOT NULL REFERENCES data_principal(id),
  collection_point_id uuid REFERENCES collection_point(id),
  notice_version_id   uuid REFERENCES notice_version(id),    -- s.5(1) pairing — control B1
  notice_hash         bytea,                                  -- copy: survives a version purge
  form_version_id     uuid REFERENCES form_version(id),
  channel             text NOT NULL,
  status              text NOT NULL DEFAULT 'given'
                        CHECK (status IN ('given','refused','withdrawn','expired','superseded')),
  affirmative_action  text NOT NULL,                          -- 'explicit_checkbox','otp','signature'
  is_guardian_consent boolean NOT NULL DEFAULT false,         -- s.9(1)
  consent_manager_id  uuid,                                   -- s.6(7) — FK added after `vendor`
  cm_reference        text,
  given_at            timestamptz,
  withdrawn_at        timestamptz,
  expires_at          timestamptz,
  source_ip           inet,
  user_agent          text,
  created_at          timestamptz NOT NULL DEFAULT now(),

  -- s.6(1): consent is not consent without an affirmative act and a paired notice.
  CONSTRAINT consent_given_requires_notice CHECK (
    status <> 'given' OR (notice_version_id IS NOT NULL AND given_at IS NOT NULL)
  )
);
CREATE INDEX consent_principal_idx  ON consent_record (principal_id, given_at DESC);
CREATE INDEX consent_status_idx     ON consent_record (status);
CREATE INDEX consent_cp_idx         ON consent_record (collection_point_id, given_at DESC);
CREATE INDEX consent_notice_idx     ON consent_record (notice_version_id);
-- Control B1: any consent with no paired notice version.
CREATE INDEX consent_unpaired_idx   ON consent_record (id) WHERE notice_version_id IS NULL;

-- Purpose-level granularity. s.6(1) forbids bundling, so consent is stored PER
-- PURPOSE and each purpose resolves to a RoPA activity — a purpose that maps to
-- no activity is control C1's failure condition.
CREATE TABLE consent_purpose (
  consent_record_id uuid NOT NULL REFERENCES consent_record(id) ON DELETE CASCADE,
  purpose_key       text NOT NULL,
  purpose_label     text NOT NULL,
  activity_id       uuid REFERENCES processing_activity(id),
  is_granted        boolean NOT NULL,
  was_pre_ticked    boolean NOT NULL DEFAULT false,           -- detected ⇒ C1 fails
  PRIMARY KEY (consent_record_id, purpose_key)
);
CREATE INDEX consent_purpose_orphan_idx ON consent_purpose (consent_record_id) WHERE activity_id IS NULL;

-- ── THE LEDGER ───────────────────────────────────────────────────────────────
-- Append-only and hash-chained. s.6(10) puts the burden of proof on the
-- fiduciary; a log that can be edited proves nothing. UPDATE and DELETE are
-- refused by trigger, not by convention — and the app role has no grant either.
CREATE TABLE consent_event (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  consent_record_id uuid NOT NULL REFERENCES consent_record(id),
  seq               integer NOT NULL,
  event_type        text NOT NULL CHECK (event_type IN
                      ('notice_served','given','refused','withdrawn','renewed','expired','cm_synced')),
  payload           jsonb NOT NULL DEFAULT '{}',   -- purposes, notice hash, form version, device
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  actor             text NOT NULL DEFAULT 'principal',
  prev_hash         bytea,
  hash              bytea NOT NULL,                -- sha256(prev_hash || canonical(payload) || ts)
  UNIQUE (consent_record_id, seq)
);
CREATE INDEX consent_event_time_idx ON consent_event (occurred_at DESC);
CREATE INDEX consent_event_type_idx ON consent_event (event_type, occurred_at DESC);
CREATE TRIGGER consent_event_immutable BEFORE UPDATE OR DELETE ON consent_event
  FOR EACH ROW EXECUTE FUNCTION deny_mutation();

CREATE TABLE consent_integrity_check (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at          timestamptz NOT NULL DEFAULT now(),
  records_checked bigint NOT NULL,
  breaks_found    integer NOT NULL,
  first_break_id  bigint,
  result          text NOT NULL CHECK (result IN ('verified','broken')),
  evidence_id     uuid
);

-- s.6(6): withdrawal must reach the processors too. One row per target, each with
-- its own acknowledgement and clock — "3/3 targets acked, mean cease 53 min".
CREATE TABLE withdrawal_propagation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_event_id  bigint NOT NULL REFERENCES consent_event(id),
  consent_record_id uuid NOT NULL REFERENCES consent_record(id),
  target_kind       text NOT NULL CHECK (target_kind IN ('vendor','data_source','internal')),
  vendor_id         uuid,
  data_source_id    uuid REFERENCES data_source(id),
  target_label      text NOT NULL,
  status            text NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','sent','acknowledged','failed','not_applicable')),
  sla_hours         smallint NOT NULL DEFAULT 24,
  due_at            timestamptz NOT NULL,
  sent_at           timestamptz,
  acknowledged_at   timestamptz,
  attempts          smallint NOT NULL DEFAULT 0,
  last_error        text,
  evidence_id       uuid
);
-- Control C3: anything past its SLA without an acknowledgement.
CREATE INDEX withdrawal_breach_idx ON withdrawal_propagation (due_at)
  WHERE status IN ('queued','sent');
CREATE INDEX withdrawal_record_idx ON withdrawal_propagation (consent_record_id);

-- s.6(4) parity: giving and withdrawing must cost comparable effort. Control C2
-- runs a synthetic withdrawal monthly and records what it actually took.
CREATE TABLE consent_parity_test (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_point_id uuid NOT NULL REFERENCES collection_point(id) ON DELETE CASCADE,
  ran_at              timestamptz NOT NULL DEFAULT now(),
  give_steps          smallint NOT NULL,
  withdraw_steps      smallint NOT NULL,
  completed_seconds   integer,
  passed              boolean NOT NULL,
  detail              text,
  evidence_id         uuid
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §9 · DSR REQUESTS  (s.11 – s.14)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE dsr_request (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code          text NOT NULL UNIQUE DEFAULT next_ref('DSR'),
  principal_id      uuid REFERENCES data_principal(id),
  request_type      text NOT NULL CHECK (request_type IN ('access','correction','erasure','nomination','grievance','withdrawal')),
  section_ref       text NOT NULL,                  -- 's.11','s.12','s.13','s.14'
  channel           text NOT NULL CHECK (channel IN ('portal','email','whatsapp','phone','letter','consent_manager')),
  raw_subject       text,
  raw_body          text,
  received_at       timestamptz NOT NULL DEFAULT now(),

  -- identity verification (the dr_verify setting picks the method)
  identity_status   text NOT NULL DEFAULT 'unverified'
                      CHECK (identity_status IN ('unverified','pending','verified','failed','rejected')),
  identity_method   text,
  verified_at       timestamptz,

  -- the clock. `due_at` is set from the dr_win setting AT INTAKE and then frozen —
  -- changing the published window later must not retroactively move old deadlines.
  response_window_days smallint NOT NULL,
  due_at            timestamptz NOT NULL,
  first_response_at timestamptz,
  closed_at         timestamptz,

  status            text NOT NULL DEFAULT 'received'
                      CHECK (status IN ('received','verifying','in_progress','awaiting_principal','completed','rejected','withdrawn')),
  outcome           text,
  rejection_reason  text,                           -- s.12(3) retention required by law, s.15(d) frivolous
  owner_employee_id uuid REFERENCES employee(id),
  is_frivolous      boolean NOT NULL DEFAULT false, -- s.15(d)
  custom            jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dsr_closed_has_outcome CHECK (status NOT IN ('completed','rejected') OR closed_at IS NOT NULL)
);
-- The SLA board: everything open, nearest deadline first.
CREATE INDEX dsr_open_due_idx  ON dsr_request (due_at)
  WHERE status NOT IN ('completed','rejected','withdrawn');
CREATE INDEX dsr_owner_idx     ON dsr_request (owner_employee_id, status);
CREATE INDEX dsr_principal_idx ON dsr_request (principal_id, received_at DESC);
CREATE INDEX dsr_type_idx      ON dsr_request (request_type, received_at DESC);

-- Fan-out. An erasure request is not done when someone ticks a box — it is done
-- when every system and every processor holding that person's data has confirmed.
CREATE TABLE dsr_task (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES dsr_request(id) ON DELETE CASCADE,
  target_kind     text NOT NULL CHECK (target_kind IN ('dataset','data_source','vendor','manual')),
  dataset_id      uuid REFERENCES dataset(id),
  data_source_id  uuid REFERENCES data_source(id),
  vendor_id       uuid,
  target_label    text NOT NULL,
  action          text NOT NULL CHECK (action IN ('locate','export','correct','erase','suppress','confirm')),
  status          work_state NOT NULL DEFAULT 'open',
  assignee_employee_id uuid REFERENCES employee(id),
  due_at          timestamptz,
  completed_at    timestamptz,
  records_affected bigint,
  evidence_id     uuid,
  note            text
);
CREATE INDEX dsr_task_request_idx ON dsr_task (request_id, status);
CREATE INDEX dsr_task_open_idx    ON dsr_task (due_at) WHERE status IN ('open','in_progress');

CREATE TABLE dsr_event (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id  uuid NOT NULL REFERENCES dsr_request(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  detail      text,
  actor_member_id uuid REFERENCES member(id),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dsr_event_req_idx ON dsr_event (request_id, occurred_at);

-- What was actually handed back — s.11 summary, the export bundle, correction proof.
CREATE TABLE dsr_deliverable (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    uuid NOT NULL REFERENCES dsr_request(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('data_summary','recipient_list','export_bundle','correction_proof','erasure_certificate','grievance_response')),
  attachment_id uuid,
  delivered_at  timestamptz,
  delivery_channel text,
  expires_at    timestamptz                        -- download links do not live forever
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §10 · BREACH MANAGEMENT  (s.8(6) · Rule 7)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE breach_incident (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code           text NOT NULL UNIQUE DEFAULT next_ref('BRC'),
  title              text NOT NULL,
  description        text NOT NULL DEFAULT '',
  detected_at        timestamptz NOT NULL,
  occurred_at        timestamptz,
  contained_at       timestamptz,
  closed_at          timestamptz,
  severity           severity_band NOT NULL DEFAULT 'medium',
  nature             text NOT NULL CHECK (nature IN ('confidentiality','integrity','availability','multiple')),
  root_cause         text,
  discovered_via     text NOT NULL CHECK (discovered_via IN ('control','monitoring','vendor','employee','principal','regulator','other')),
  affected_count     bigint,
  affected_count_is_estimate boolean NOT NULL DEFAULT true,
  status             text NOT NULL DEFAULT 'triage'
                       CHECK (status IN ('triage','contained','notifying','investigating','closed','false_positive')),
  owner_employee_id  uuid REFERENCES employee(id),
  -- Rule 7 clocks, computed at detection and then frozen.
  principal_due_at   timestamptz,                  -- Rule 7(1) — without delay
  board_due_at       timestamptz,                  -- Rule 7(2) — 72 hours
  is_drill           boolean NOT NULL DEFAULT false,
  custom             jsonb NOT NULL DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX breach_open_idx  ON breach_incident (board_due_at)
  WHERE status NOT IN ('closed','false_positive') AND NOT is_drill;
CREATE INDEX breach_detected_idx ON breach_incident (detected_at DESC);

CREATE TABLE breach_scope (
  incident_id         uuid NOT NULL REFERENCES breach_incident(id) ON DELETE CASCADE,
  dataset_id          uuid REFERENCES dataset(id),
  activity_id         uuid REFERENCES processing_activity(id),
  vendor_id           uuid,
  identifier_type_keys text[] NOT NULL DEFAULT '{}',
  record_count        bigint,
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE INDEX breach_scope_incident_idx ON breach_scope (incident_id);

CREATE TABLE breach_notification (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id    uuid NOT NULL REFERENCES breach_incident(id) ON DELETE CASCADE,
  audience       text NOT NULL CHECK (audience IN ('board','principals','vendor','internal','regulator_sectoral')),
  template_key   text,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','sent','failed','acknowledged')),
  due_at         timestamptz,
  sent_at        timestamptz,
  recipients_count integer,
  delivered_count  integer,
  reference_number text,                            -- the Board's acknowledgement ref
  content_hash   bytea,
  attachment_id  uuid,
  approved_by    uuid REFERENCES member(id)
);
CREATE INDEX breach_notif_due_idx ON breach_notification (due_at) WHERE status IN ('draft','approved');

CREATE TABLE breach_timeline (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES breach_incident(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  entry       text NOT NULL,
  actor_member_id uuid REFERENCES member(id),
  evidence_id uuid
);
CREATE INDEX breach_timeline_inc_idx ON breach_timeline (incident_id, occurred_at);
CREATE TRIGGER breach_timeline_immutable BEFORE UPDATE OR DELETE ON breach_timeline
  FOR EACH ROW EXECUTE FUNCTION deny_mutation();

-- ─────────────────────────────────────────────────────────────────────────────
-- §11 · CROSS-BORDER TRANSFERS  (s.16)
-- ─────────────────────────────────────────────────────────────────────────────
-- s.16(1) is a negative list, so a transfer is lawful until a country is notified.
-- `transfer_check` is therefore a time series, not a boolean: when a notification
-- lands, every existing transfer to that country gets a NEW check row and, if it
-- flips, an issue. The history is what proves you were compliant then and acted now.

CREATE TABLE transfer (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code            text NOT NULL UNIQUE DEFAULT next_ref('XBT'),
  activity_id         uuid REFERENCES processing_activity(id),
  vendor_id           uuid,
  dataset_id          uuid REFERENCES dataset(id),
  destination_iso2    char(2) NOT NULL,
  destination_region  text,                         -- 'us-east-1', 'eu-west-1'
  transfer_reason     text NOT NULL CHECK (transfer_reason IN ('cloud_hosting','vendor_processing','group_company','support_access','backup','analytics')),
  identifier_type_keys text[] NOT NULL DEFAULT '{}',
  volume_estimate     bigint,
  is_recurring        boolean NOT NULL DEFAULT true,
  sectoral_rule_ref   text,                         -- s.16(2) stricter local law
  owner_employee_id   uuid REFERENCES employee(id),
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','ceased','planned')),
  custom              jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transfer_dest_idx   ON transfer (destination_iso2) WHERE status = 'active';
CREATE INDEX transfer_vendor_idx ON transfer (vendor_id);

CREATE TABLE transfer_check (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id     uuid NOT NULL REFERENCES transfer(id) ON DELETE CASCADE,
  checked_at      timestamptz NOT NULL DEFAULT now(),
  notification_id uuid,                             -- public.restricted_country_notification.id
  result          text NOT NULL CHECK (result IN ('permitted','restricted','conditional','unknown')),
  detail          text,
  issue_id        uuid
);
CREATE INDEX transfer_check_latest_idx ON transfer_check (transfer_id, checked_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- §12 · THIRD-PARTY RISK  (s.8(1)–(2), s.8(5)–(7), s.6(6))
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE vendor (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code          text NOT NULL UNIQUE DEFAULT next_ref('TPR'),
  name              text NOT NULL,
  legal_name        text,
  party_role        text NOT NULL DEFAULT 'processor'
                      CHECK (party_role IN ('processor','sub_processor','joint_fiduciary','consent_manager','recipient')),
  category          text,
  country_iso2      char(2),
  processing_countries char(2)[] NOT NULL DEFAULT '{}',
  website           text,
  contact           jsonb NOT NULL DEFAULT '{}',    -- {name,email,phone} for breach + cease notices
  criticality       severity_band NOT NULL DEFAULT 'medium',
  owner_employee_id uuid REFERENCES employee(id),
  status            text NOT NULL DEFAULT 'onboarding'
                      CHECK (status IN ('onboarding','active','under_review','exiting','terminated')),
  -- s.6(7)/Rule 4: a Consent Manager must be registered with the Board.
  cm_registration_ref text,
  cm_registered_until date,
  onboarded_on      date,
  exited_on         date,
  exit_evidence_id  uuid,                           -- s.8(7) proof they erased on exit
  discovered_from   text,                           -- 'ropa','scan','manual'
  custom            jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CONSTRAINT vendor_cm_registered CHECK (party_role <> 'consent_manager' OR cm_registration_ref IS NOT NULL)
);
CREATE INDEX vendor_status_idx ON vendor (status) WHERE deleted_at IS NULL;
CREATE INDEX vendor_search_idx ON vendor USING gin (name public.gin_trgm_ops);

-- Deferred FKs now that `vendor` exists.
ALTER TABLE activity_processor        ADD CONSTRAINT ap_vendor_fk  FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE;
ALTER TABLE consent_record            ADD CONSTRAINT cr_cm_fk      FOREIGN KEY (consent_manager_id) REFERENCES vendor(id);
ALTER TABLE withdrawal_propagation    ADD CONSTRAINT wp_vendor_fk  FOREIGN KEY (vendor_id) REFERENCES vendor(id);
ALTER TABLE dsr_task                  ADD CONSTRAINT dt_vendor_fk  FOREIGN KEY (vendor_id) REFERENCES vendor(id);
ALTER TABLE breach_scope              ADD CONSTRAINT bs_vendor_fk  FOREIGN KEY (vendor_id) REFERENCES vendor(id);
ALTER TABLE transfer                  ADD CONSTRAINT xb_vendor_fk  FOREIGN KEY (vendor_id) REFERENCES vendor(id);

-- s.8(2): engagement only under a valid contract. The four cascade clauses are
-- BOOLEANS, not prose, because control I1 has to test them.
CREATE TABLE vendor_contract (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  kind              text NOT NULL CHECK (kind IN ('msa','dpa','addendum','sccs','nda')),
  reference         text,
  signed_on         date,
  effective_from    date,
  expires_on        date,
  attachment_id     uuid,
  has_security_clause  boolean NOT NULL DEFAULT false,   -- s.8(5)
  has_breach_clause    boolean NOT NULL DEFAULT false,   -- s.8(6) cascade, in time for YOUR deadline
  breach_notify_hours  smallint,
  has_erasure_clause   boolean NOT NULL DEFAULT false,   -- s.8(7)
  has_cease_clause     boolean NOT NULL DEFAULT false,   -- s.6(6)
  has_subprocessor_clause boolean NOT NULL DEFAULT false,
  has_audit_clause     boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','expired','terminated')),
  created_at        timestamptz NOT NULL DEFAULT now()
);
-- The tp_expiry alert reads this.
CREATE INDEX vendor_contract_expiry_idx ON vendor_contract (expires_on) WHERE status = 'active';
CREATE INDEX vendor_contract_vendor_idx ON vendor_contract (vendor_id);

CREATE TABLE vendor_assessment (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      uuid NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  run_id         uuid REFERENCES assessment_run(id),
  cycle          text NOT NULL DEFAULT 'annual',
  due_on         date,
  completed_on   date,
  score_pct      numeric(5,2),
  band           text,
  reviewer_employee_id uuid REFERENCES employee(id),
  attachment_id  uuid
);
CREATE INDEX vendor_assessment_due_idx ON vendor_assessment (due_on) WHERE completed_on IS NULL;

CREATE TABLE vendor_subprocessor (
  vendor_id     uuid NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  sub_vendor_id uuid NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  disclosed_on  date,
  is_approved   boolean NOT NULL DEFAULT false,
  PRIMARY KEY (vendor_id, sub_vendor_id),
  CONSTRAINT no_self_subprocessing CHECK (vendor_id <> sub_vendor_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §13 · CONTROLS · CCM + EVIDENCE  (s.8(4)–(5) · Rule 6)
-- ─────────────────────────────────────────────────────────────────────────────
-- The product's central claim: "a control is never green because someone said so."
-- That claim is a schema decision. A control's state is DERIVED from its evidence
-- and its freshness, so `current_state` is a cache of the last run — never a
-- field a human sets.

CREATE TABLE control (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key      text NOT NULL UNIQUE,           -- public.control_template.key ('A1'..'K4')
  template_version  integer NOT NULL DEFAULT 1,
  domain_key        text NOT NULL,
  -- conditional controls: only test when the trigger applies (SDF / CHILD / CM / XBORDER)
  is_applicable     boolean NOT NULL DEFAULT true,
  applicability_reason text,
  automation        text NOT NULL CHECK (automation IN ('auto','semi','manual','planned')),
  owner_employee_id uuid REFERENCES employee(id),
  cadence           text NOT NULL,
  next_run_at       timestamptz,
  last_run_at       timestamptz,
  current_state     control_state NOT NULL DEFAULT 'unknown',
  state_since       timestamptz NOT NULL DEFAULT now(),
  custom            jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX control_state_idx ON control (current_state) WHERE is_applicable;
CREATE INDEX control_due_idx   ON control (next_run_at) WHERE is_applicable;
CREATE INDEX control_owner_idx ON control (owner_employee_id);

CREATE TABLE control_requirement (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id        uuid NOT NULL REFERENCES control(id) ON DELETE CASCADE,
  template_key      text NOT NULL,
  title             text NOT NULL,
  evidence_kind     evidence_kind NOT NULL,
  source_module     text,
  stale_after_days  integer NOT NULL DEFAULT 90,
  is_satisfied      boolean NOT NULL DEFAULT false,
  UNIQUE (control_id, template_key)
);

-- Evidence is a first-class record, not a file attachment. It carries WHERE it
-- came from, WHEN it was collected and WHEN it goes stale — because a control
-- whose newest evidence is past `stale_after` drops to PARTIAL, never PASS.
CREATE TABLE evidence (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code        text NOT NULL UNIQUE DEFAULT next_ref('EVD'),
  requirement_id  uuid REFERENCES control_requirement(id) ON DELETE SET NULL,
  kind            evidence_kind NOT NULL,
  title           text NOT NULL,
  summary         text,
  -- provenance: which module and which record this was derived or fetched from
  source_module   text,
  source_record_type text,
  source_record_id uuid,
  payload         jsonb NOT NULL DEFAULT '{}',      -- the actual figures for a derived check
  attachment_id   uuid,
  content_hash    bytea,
  collected_at    timestamptz NOT NULL DEFAULT now(),
  stale_after     timestamptz NOT NULL,
  collected_by    uuid REFERENCES member(id),
  attested_by     uuid REFERENCES employee(id),     -- kind='attested' ⇒ a human vouched
  attested_at     timestamptz,
  confidence      text NOT NULL DEFAULT 'high' CHECK (confidence IN ('high','medium','low')),
  superseded_by   uuid REFERENCES evidence(id),
  CONSTRAINT evidence_attested_has_attestor CHECK (kind <> 'attested' OR attested_by IS NOT NULL)
);
CREATE INDEX evidence_requirement_idx ON evidence (requirement_id, collected_at DESC);
CREATE INDEX evidence_stale_idx       ON evidence (stale_after) WHERE superseded_by IS NULL;
CREATE INDEX evidence_source_idx      ON evidence (source_record_type, source_record_id);

CREATE TABLE control_run (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id     uuid NOT NULL REFERENCES control(id) ON DELETE CASCADE,
  ran_at         timestamptz NOT NULL DEFAULT now(),
  state          control_state NOT NULL,
  previous_state control_state,
  summary        text NOT NULL DEFAULT '',
  metrics        jsonb NOT NULL DEFAULT '{}',       -- the numbers behind the verdict
  triggered_by   text NOT NULL DEFAULT 'schedule' CHECK (triggered_by IN ('schedule','change','manual','backfill')),
  duration_ms    integer,
  issue_id       uuid
);
CREATE INDEX control_run_history_idx ON control_run (control_id, ran_at DESC);
-- The trend chart and the "state changed" feed read this partial index.
CREATE INDEX control_run_flips_idx   ON control_run (ran_at DESC) WHERE previous_state IS DISTINCT FROM state;

CREATE TABLE control_run_evidence (
  run_id      uuid NOT NULL REFERENCES control_run(id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  was_stale   boolean NOT NULL DEFAULT false,
  PRIMARY KEY (run_id, evidence_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §14 · DPIA  (s.10(2)(c)(i))
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE dpia (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code          text NOT NULL UNIQUE DEFAULT next_ref('DPIA'),
  activity_id       uuid NOT NULL REFERENCES processing_activity(id),
  description       text NOT NULL,
  screening_verdict text NOT NULL CHECK (screening_verdict IN ('required','recommended','not_required')),
  screening_flags   text[] NOT NULL DEFAULT '{}',   -- 'children','large_scale','profiling','automated_decision'
  screening_reason  text NOT NULL DEFAULT '',
  screened_at       timestamptz,
  assessor_employee_id uuid REFERENCES employee(id),
  dpo_employee_id   uuid REFERENCES employee(id),
  status            text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','in_review','approved','rejected','superseded')),
  overall_residual  rag_level,
  approved_at       timestamptz,
  next_review_on    date,
  report_attachment_id uuid,
  custom            jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  -- dp_sign is a locked setting: no DPIA completes on the assessor's word alone.
  CONSTRAINT dpia_approved_has_dpo CHECK (status <> 'approved' OR (dpo_employee_id IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE UNIQUE INDEX dpia_live_per_activity_idx ON dpia (activity_id) WHERE status <> 'superseded';
CREATE INDEX dpia_status_idx ON dpia (status);
CREATE INDEX dpia_review_idx ON dpia (next_review_on) WHERE status = 'approved';

CREATE TABLE dpia_necessity (
  dpia_id      uuid NOT NULL REFERENCES dpia(id) ON DELETE CASCADE,
  question_key text NOT NULL,                       -- 'N1'..'N4'
  answer       boolean NOT NULL,
  note         text,
  PRIMARY KEY (dpia_id, question_key)
);

CREATE TABLE dpia_risk (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dpia_id        uuid NOT NULL REFERENCES dpia(id) ON DELETE CASCADE,
  template_key   text,                              -- public.risk_template.key, null if bespoke
  title          text NOT NULL,
  description    text NOT NULL DEFAULT '',
  likelihood     rag_level NOT NULL,
  severity       rag_level NOT NULL,
  decision       text NOT NULL DEFAULT 'mitigate'
                   CHECK (decision IN ('mitigate','accept','avoid','transfer','not_applicable')),
  mitigation     text,
  residual_likelihood rag_level,
  residual_severity   rag_level,
  risk_id        uuid,                              -- promoted into the Risk Register
  position       integer NOT NULL DEFAULT 0,
  -- Accepting a risk means the residual IS the inherent — you cannot claim a
  -- reduction you did not make.
  CONSTRAINT dpia_risk_accept_no_reduction CHECK (
    decision <> 'accept' OR (residual_likelihood = likelihood AND residual_severity = severity)
  )
);
CREATE INDEX dpia_risk_dpia_idx ON dpia_risk (dpia_id);

CREATE TABLE dpia_signoff (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dpia_id      uuid NOT NULL REFERENCES dpia(id) ON DELETE CASCADE,
  actor_employee_id uuid NOT NULL REFERENCES employee(id),
  role_at_signoff text NOT NULL,
  decision     text NOT NULL CHECK (decision IN ('approved','rejected','changes_requested')),
  note         text,
  decided_at   timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §15 · RISK REGISTER · ACTIONS · ISSUES
-- ─────────────────────────────────────────────────────────────────────────────
-- Three tables, one flow: an ISSUE is a finding (something is wrong), a RISK is a
-- consolidated exposure (something could go wrong), an ACTION is the work that
-- closes either. Every module feeds them; nothing else owns remediation state.

CREATE TABLE issue (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code          text NOT NULL UNIQUE DEFAULT next_ref('ISS'),
  title             text NOT NULL,
  description       text NOT NULL DEFAULT '',
  source_module     text NOT NULL,
  source_record_type text,
  source_record_id  uuid,
  origin            text NOT NULL DEFAULT 'automatic' CHECK (origin IN ('automatic','manual','assessment','control','scan')),
  severity          severity_band NOT NULL DEFAULT 'medium',
  section_ref       text,
  owner_employee_id uuid REFERENCES employee(id),
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','resolved','accepted','closed','duplicate')),
  raised_at         timestamptz NOT NULL DEFAULT now(),
  due_on            date,
  resolved_at       timestamptz,
  resolution_note   text,
  duplicate_of      uuid REFERENCES issue(id),
  -- Dedupe key: a control that keeps failing must UPDATE its issue, not spawn a
  -- new one every night. Null for manual issues.
  dedupe_key        text,
  custom            jsonb NOT NULL DEFAULT '{}',
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX issue_dedupe_idx ON issue (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status IN ('open','in_progress');
CREATE INDEX issue_open_idx  ON issue (due_on) WHERE status IN ('open','in_progress');
CREATE INDEX issue_owner_idx ON issue (owner_employee_id, status);
CREATE INDEX issue_source_idx ON issue (source_module, source_record_id);

-- Deferred issue FKs.
ALTER TABLE endpoint_finding ADD CONSTRAINT ef_issue_fk FOREIGN KEY (issue_id) REFERENCES issue(id);
ALTER TABLE transfer_check   ADD CONSTRAINT tc_issue_fk FOREIGN KEY (issue_id) REFERENCES issue(id);
ALTER TABLE control_run      ADD CONSTRAINT cr_issue_fk FOREIGN KEY (issue_id) REFERENCES issue(id);

CREATE TABLE risk (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code          text NOT NULL UNIQUE DEFAULT next_ref('RSK'),
  title             text NOT NULL,
  description       text NOT NULL DEFAULT '',
  category          text,
  source            text NOT NULL CHECK (source IN ('dpia','assessment','control','breach','manual','vendor')),
  source_record_type text,
  source_record_id  uuid,
  likelihood        rag_level NOT NULL,
  severity          rag_level NOT NULL,
  inherent_band     rag_level NOT NULL,
  treatment         text NOT NULL DEFAULT 'mitigate'
                      CHECK (treatment IN ('mitigate','accept','avoid','transfer')),
  residual_likelihood rag_level,
  residual_severity   rag_level,
  residual_band     rag_level,
  owner_employee_id uuid REFERENCES employee(id),
  status            text NOT NULL DEFAULT 'open' CHECK (status IN ('open','treated','accepted','closed')),
  accepted_by       uuid REFERENCES employee(id),
  accepted_at       timestamptz,
  review_on         date,
  custom            jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  -- rk_esc: high residual risk cannot be quietly parked without a named acceptor.
  CONSTRAINT risk_accepted_has_acceptor CHECK (status <> 'accepted' OR accepted_by IS NOT NULL)
);
CREATE INDEX risk_residual_idx ON risk (residual_band) WHERE status IN ('open','treated');
CREATE INDEX risk_owner_idx    ON risk (owner_employee_id, status);
CREATE INDEX risk_review_idx   ON risk (review_on) WHERE status <> 'closed';
ALTER TABLE dpia_risk ADD CONSTRAINT dpia_risk_register_fk FOREIGN KEY (risk_id) REFERENCES risk(id);

-- What a risk actually threatens. Kept as a link table so one risk can span an
-- activity, a vendor and three datasets without a nullable column per type.
CREATE TABLE risk_link (
  risk_id      uuid NOT NULL REFERENCES risk(id) ON DELETE CASCADE,
  subject_type text NOT NULL CHECK (subject_type IN ('activity','dataset','vendor','data_source','collection_point','transfer')),
  subject_id   uuid NOT NULL,
  PRIMARY KEY (risk_id, subject_type, subject_id)
);
CREATE INDEX risk_link_subject_idx ON risk_link (subject_type, subject_id);

CREATE TABLE action (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code          text NOT NULL UNIQUE DEFAULT next_ref('ACT'),
  title             text NOT NULL,
  description       text NOT NULL DEFAULT '',
  risk_id           uuid REFERENCES risk(id) ON DELETE CASCADE,
  issue_id          uuid REFERENCES issue(id) ON DELETE CASCADE,
  dpia_risk_id      uuid REFERENCES dpia_risk(id) ON DELETE SET NULL,
  owner_employee_id uuid NOT NULL REFERENCES employee(id),
  priority          severity_band NOT NULL DEFAULT 'medium',
  status            work_state NOT NULL DEFAULT 'open',
  due_on            date NOT NULL,
  started_at        timestamptz,
  completed_at      timestamptz,
  completion_note   text,                           -- the ap_proof setting asks for this
  evidence_id       uuid REFERENCES evidence(id),
  last_reminded_at  timestamptz,
  custom            jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  -- An action exists to close something. Orphan actions are how registers rot.
  CONSTRAINT action_has_parent CHECK (risk_id IS NOT NULL OR issue_id IS NOT NULL),
  CONSTRAINT action_done_has_date CHECK (status <> 'done' OR completed_at IS NOT NULL)
);
-- The Action Plan buckets (overdue / 30 / 60 / 90 days) are this index.
CREATE INDEX action_due_idx    ON action (due_on) WHERE status IN ('open','in_progress');
CREATE INDEX action_owner_idx  ON action (owner_employee_id, status, due_on);
CREATE INDEX action_risk_idx   ON action (risk_id);
CREATE INDEX action_issue_idx  ON action (issue_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- §16 · PEOPLE & AWARENESS  (s.8(4) organisational measures)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE course (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key  text,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  duration_min  smallint NOT NULL,
  pass_mark     smallint NOT NULL DEFAULT 80,
  languages     text[] NOT NULL DEFAULT '{en}',
  is_mandatory  boolean NOT NULL DEFAULT false,
  recert_months smallint,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','retired')),
  position      integer NOT NULL DEFAULT 0
);

CREATE TABLE campaign (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  name          text NOT NULL,
  audience_kind text NOT NULL DEFAULT 'all' CHECK (audience_kind IN ('all','department','role','custom')),
  audience_ref  text[],
  due_on        date NOT NULL,
  reminder_days smallint NOT NULL DEFAULT 3,
  channels      text[] NOT NULL DEFAULT '{email}',
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','closed')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE enrollment (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  campaign_id  uuid REFERENCES campaign(id) ON DELETE SET NULL,
  employee_id  uuid NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started','in_progress','completed','overdue','waived')),
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  due_on       date,
  started_at   timestamptz,
  completed_at timestamptz,
  best_score   smallint,
  attempts     smallint NOT NULL DEFAULT 0,
  last_reminded_at timestamptz,
  UNIQUE (course_id, employee_id, campaign_id)
);
CREATE INDEX enrollment_overdue_idx ON enrollment (due_on) WHERE status IN ('not_started','in_progress');
CREATE INDEX enrollment_employee_idx ON enrollment (employee_id, status);

-- Completion records double as s.8(4) audit evidence — hence the verifiable serial.
CREATE TABLE certificate (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL UNIQUE REFERENCES enrollment(id) ON DELETE CASCADE,
  serial        text NOT NULL UNIQUE,
  verify_token  bytea NOT NULL UNIQUE,              -- the QR payload
  score         smallint NOT NULL,
  issued_at     timestamptz NOT NULL DEFAULT now(),
  expires_on    date,
  attachment_id uuid,
  revoked_at    timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §17 · CROSS-CUTTING  (attachments · audit · notifications · jobs)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE attachment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key   text NOT NULL UNIQUE,               -- object-store path, prefixed ws:<id>/
  filename      text NOT NULL,
  mime_type     text NOT NULL,
  size_bytes    bigint NOT NULL,
  sha256        bytea NOT NULL,
  scan_status   text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','clean','infected','failed')),
  uploaded_by   uuid REFERENCES member(id),
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  retain_until  date,                               -- cc_keep evidence retention
  deleted_at    timestamptz
);
CREATE INDEX attachment_retention_idx ON attachment (retain_until) WHERE deleted_at IS NULL;

-- Deferred attachment FKs (declared late so the table order stays readable).
ALTER TABLE workspace_profile     ADD CONSTRAINT wp_logo_fk   FOREIGN KEY (logo_attachment_id)  REFERENCES attachment(id);
ALTER TABLE assessment_run        ADD CONSTRAINT ar_report_fk FOREIGN KEY (report_attachment_id) REFERENCES attachment(id);
ALTER TABLE assessment_answer     ADD CONSTRAINT aa_evid_fk   FOREIGN KEY (evidence_attachment_id) REFERENCES attachment(id);
ALTER TABLE notice_publication    ADD CONSTRAINT np_shot_fk   FOREIGN KEY (screenshot_attachment_id) REFERENCES attachment(id);
ALTER TABLE evidence              ADD CONSTRAINT ev_att_fk    FOREIGN KEY (attachment_id) REFERENCES attachment(id);
ALTER TABLE dsr_deliverable       ADD CONSTRAINT dd_att_fk    FOREIGN KEY (attachment_id) REFERENCES attachment(id);
ALTER TABLE breach_notification   ADD CONSTRAINT bn_att_fk    FOREIGN KEY (attachment_id) REFERENCES attachment(id);
ALTER TABLE vendor_contract       ADD CONSTRAINT vc_att_fk    FOREIGN KEY (attachment_id) REFERENCES attachment(id);
ALTER TABLE vendor_assessment     ADD CONSTRAINT va_att_fk    FOREIGN KEY (attachment_id) REFERENCES attachment(id);
ALTER TABLE dpia                  ADD CONSTRAINT dp_att_fk    FOREIGN KEY (report_attachment_id) REFERENCES attachment(id);
ALTER TABLE certificate           ADD CONSTRAINT ce_att_fk    FOREIGN KEY (attachment_id) REFERENCES attachment(id);
ALTER TABLE vendor                ADD CONSTRAINT vd_exit_fk   FOREIGN KEY (exit_evidence_id) REFERENCES evidence(id);
ALTER TABLE dsr_task              ADD CONSTRAINT dt_evid_fk   FOREIGN KEY (evidence_id) REFERENCES evidence(id);
ALTER TABLE breach_timeline       ADD CONSTRAINT bt_evid_fk   FOREIGN KEY (evidence_id) REFERENCES evidence(id);
ALTER TABLE withdrawal_propagation ADD CONSTRAINT wp_evid_fk  FOREIGN KEY (evidence_id) REFERENCES evidence(id);
ALTER TABLE consent_parity_test   ADD CONSTRAINT cpt_evid_fk  FOREIGN KEY (evidence_id) REFERENCES evidence(id);
ALTER TABLE consent_integrity_check ADD CONSTRAINT cic_evid_fk FOREIGN KEY (evidence_id) REFERENCES evidence(id);

-- Workspace audit trail. Lives INSIDE the workspace schema so a DPDP export or a
-- workspace deletion takes it with them. Append-only.
CREATE TABLE audit_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  actor_member_id uuid REFERENCES member(id),
  actor_label  text NOT NULL,                       -- survives a member deletion
  actor_ip     inet,
  action       text NOT NULL,                       -- 'activity.approved','setting.changed'
  record_type  text,
  record_id    uuid,
  record_ref   text,                                -- 'RA-002' — readable without a join
  before       jsonb,
  after        jsonb,
  request_id   text
);
CREATE INDEX audit_record_idx ON audit_log (record_type, record_id, occurred_at DESC);
CREATE INDEX audit_time_idx   ON audit_log (occurred_at DESC);
CREATE INDEX audit_actor_idx  ON audit_log (actor_member_id, occurred_at DESC);
CREATE TRIGGER audit_log_immutable BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION deny_mutation();

CREATE TABLE comment (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type  text NOT NULL,
  record_id    uuid NOT NULL,
  body         text NOT NULL,
  author_member_id uuid REFERENCES member(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  edited_at    timestamptz,
  deleted_at   timestamptz
);
CREATE INDEX comment_record_idx ON comment (record_type, record_id, created_at);

CREATE TABLE notification (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_employee_id uuid REFERENCES employee(id),
  recipient_member_id   uuid REFERENCES member(id),
  channel       text NOT NULL CHECK (channel IN ('email','whatsapp','in_app','digest')),
  template_key  text NOT NULL,
  record_type   text,
  record_id     uuid,
  payload       jsonb NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','suppressed','read')),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at       timestamptz,
  read_at       timestamptz,
  attempts      smallint NOT NULL DEFAULT 0,
  last_error    text
);
CREATE INDEX notification_due_idx ON notification (scheduled_for) WHERE status = 'queued';
CREATE INDEX notification_inbox_idx ON notification (recipient_member_id, status, scheduled_for DESC);

-- Transactional outbox. Withdrawal propagation, vendor notices, webhook fan-out
-- and search indexing all publish here in the SAME transaction as the state change,
-- so "the consent was withdrawn but the processor was never told" cannot happen.
CREATE TABLE outbox (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type   text NOT NULL,
  record_type  text,
  record_id    uuid,
  payload      jsonb NOT NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts     smallint NOT NULL DEFAULT 0,
  last_error   text
);
CREATE INDEX outbox_pending_idx ON outbox (available_at) WHERE processed_at IS NULL;

CREATE TABLE job_run (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_key     text NOT NULL,                        -- 'scan.nightly','control.evaluate','retention.erase'
  status      text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','failed','skipped')),
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  items_processed integer NOT NULL DEFAULT 0,
  detail      jsonb NOT NULL DEFAULT '{}',
  error       text
);
CREATE INDEX job_run_key_idx ON job_run (job_key, started_at DESC);

-- Saved filters per module — the "All / Unclassified / Sensitive" chips, plus
-- anything a workspace defines. Configurable UI without a code change.
CREATE TABLE saved_view (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key   text NOT NULL,
  name         text NOT NULL,
  filters      jsonb NOT NULL DEFAULT '{}',
  columns      text[],                              -- including custom.<key> projections
  owner_member_id uuid REFERENCES member(id),
  is_shared    boolean NOT NULL DEFAULT false,
  position     integer NOT NULL DEFAULT 0
);
CREATE INDEX saved_view_module_idx ON saved_view (module_key);

-- The dashboard is expensive to compute (readiness score, penalty exposure,
-- 37 control states, every register's counts). Snapshot it on a schedule and on
-- material change; never compute it in the request path.
CREATE TABLE dashboard_snapshot (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computed_at       timestamptz NOT NULL DEFAULT now(),
  readiness_pct     numeric(5,2),
  controls_passing  smallint,
  controls_total    smallint,
  open_issues       integer,
  overdue_actions   integer,
  dsr_breaching     integer,
  exposure          jsonb NOT NULL DEFAULT '{}',    -- per penalty head
  module_stats      jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX dashboard_snapshot_time_idx ON dashboard_snapshot (computed_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- §18 · RETENTION & ERASURE  (s.8(7)–(8) · Rule 8)
-- ─────────────────────────────────────────────────────────────────────────────
-- s.8(7) is an obligation to DELETE, so deletion needs a schedule, a 48-hour
-- pre-notice and a log — the same rigour as any other statutory duty.

CREATE TABLE retention_schedule (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id       uuid REFERENCES processing_activity(id) ON DELETE CASCADE,
  dataset_id        uuid REFERENCES dataset(id) ON DELETE CASCADE,
  rule_label        text NOT NULL,
  period_days       integer NOT NULL,
  law_ref           text,                           -- s.8(8) longer period required by law
  trigger_event     text NOT NULL DEFAULT 'purpose_served'
                      CHECK (trigger_event IN ('purpose_served','consent_withdrawn','last_contact','fixed_date')),
  next_run_on       date,
  is_active         boolean NOT NULL DEFAULT true,
  CONSTRAINT retention_has_subject CHECK (activity_id IS NOT NULL OR dataset_id IS NOT NULL)
);
CREATE INDEX retention_due_idx ON retention_schedule (next_run_on) WHERE is_active;

CREATE TABLE erasure_run (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id   uuid REFERENCES retention_schedule(id) ON DELETE SET NULL,
  dsr_request_id uuid REFERENCES dsr_request(id),   -- s.12(3) erasure on request
  planned_for   timestamptz NOT NULL,
  notice_sent_at timestamptz,                       -- Rule 8: 48 hours' notice
  status        text NOT NULL DEFAULT 'planned'
                  CHECK (status IN ('planned','notified','running','completed','failed','cancelled')),
  started_at    timestamptz,
  completed_at  timestamptz,
  records_erased bigint,
  targets_total  integer,
  targets_confirmed integer,
  evidence_id   uuid REFERENCES evidence(id),
  error         text
);
CREATE INDEX erasure_due_idx ON erasure_run (planned_for) WHERE status IN ('planned','notified');

-- One row per system/processor the erasure had to reach. s.8(7) requires causing
-- the PROCESSOR to erase too, so "done" means every target confirmed.
CREATE TABLE erasure_target (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         uuid NOT NULL REFERENCES erasure_run(id) ON DELETE CASCADE,
  target_kind    text NOT NULL CHECK (target_kind IN ('dataset','data_source','vendor','backup','manual')),
  dataset_id     uuid REFERENCES dataset(id),
  data_source_id uuid REFERENCES data_source(id),
  vendor_id      uuid REFERENCES vendor(id),
  target_label   text NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','sent','confirmed','failed','not_applicable')),
  confirmed_at   timestamptz,
  records_erased bigint,
  note           text
);
CREATE INDEX erasure_target_run_idx ON erasure_target (run_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- §19 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workspace_profile','setting','role','member','employee','form','form_field',
    'questionnaire','data_source','dataset','endpoint_device','collection_point',
    'processing_activity','notice','data_principal','dsr_request','breach_incident',
    'transfer','vendor','control','dpia','issue','risk','action'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',
      t, t);
  END LOOP;
END $$;

-- Keep `dataset.has_sensitive` true to what was actually observed. The Data Map's
-- red chip and control A2 both depend on it, so it is maintained by the database,
-- not by whichever code path last wrote an identifier.
CREATE FUNCTION sync_dataset_sensitivity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid;
BEGIN
  target := COALESCE(NEW.dataset_id, OLD.dataset_id);
  UPDATE dataset d SET has_sensitive = EXISTS (
    SELECT 1 FROM dataset_identifier di WHERE di.dataset_id = target AND di.is_sensitive
  ) WHERE d.id = target;
  RETURN NULL;
END $$;
CREATE TRIGGER dataset_identifier_sensitivity
  AFTER INSERT OR UPDATE OR DELETE ON dataset_identifier
  FOR EACH ROW EXECUTE FUNCTION sync_dataset_sensitivity();
