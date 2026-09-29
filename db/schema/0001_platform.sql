-- =============================================================================
-- JETHUR DPDP · PLATFORM SCHEMA (control plane)
-- =============================================================================
-- Lives in `public`. Holds exactly three things:
--   1. The workspace registry + identity/billing (cross-workspace by nature)
--   2. Immutable statutory reference data (the Act, the Rules, the control library)
--   3. Templates that seed a new workspace schema
--
-- Nothing here is workspace-scoped business data. If a table would need a
-- `workspace_id` column to be safe, it belongs in a workspace schema instead.
--
-- RLS stays ON for every table carrying a workspace_id — belt and braces for the
-- shared tables that schema separation does not cover (WORKSPACE_ISOLATION.md §6).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid, digest
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- search across registers

-- -----------------------------------------------------------------------------
-- 1 · WORKSPACE REGISTRY
-- -----------------------------------------------------------------------------
-- The slug NEVER becomes a schema name by concatenation. Two separate columns,
-- two separate branded types in TS. The registry is the only mapping.

CREATE TYPE workspace_status AS ENUM ('provisioning','trial','active','past_due','suspended','closing','closed');
CREATE TYPE data_region     AS ENUM ('ap-south-1','ap-south-2');

CREATE TABLE workspace (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  schema_name       text NOT NULL UNIQUE,
  legal_name        text NOT NULL,
  status            workspace_status NOT NULL DEFAULT 'provisioning',
  region            data_region NOT NULL DEFAULT 'ap-south-1',
  sector_key        text,                                  -- FK added after `sector` is defined
  is_significant_df boolean NOT NULL DEFAULT false,      -- s.10 notified SDF
  trial_ends_at     timestamptz,
  provisioned_at    timestamptz,
  closed_at         timestamptz,                          -- s.8(7) erasure clock starts here
  purge_after       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT workspace_slug_shape   CHECK (slug ~ '^[a-z][a-z0-9-]{2,38}$'),
  CONSTRAINT workspace_schema_shape CHECK (schema_name ~ '^ws_[0-9a-hjkmnp-tv-z]{26}$'),  -- ws_<ulid>
  CONSTRAINT workspace_closed_purge CHECK (closed_at IS NULL OR purge_after IS NOT NULL)
);
CREATE INDEX workspace_status_idx ON workspace (status) WHERE status <> 'closed';

-- Custom domains / subdomains that resolve to a workspace (Layer 1 resolution).
CREATE TABLE workspace_domain (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  hostname     citext NOT NULL UNIQUE,
  kind         text NOT NULL CHECK (kind IN ('app','notice')),  -- app.x / notices.x
  verified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2 · IDENTITY
-- -----------------------------------------------------------------------------
-- A user account is global; a person may belong to several workspaces (the
-- consultant case — "Find my workspace" in the sign-in flow depends on it).

CREATE TABLE user_account (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              citext NOT NULL UNIQUE,
  email_verified_at  timestamptz,
  phone_e164         text UNIQUE,                     -- WhatsApp OTP sign-in
  phone_verified_at  timestamptz,
  full_name          text NOT NULL,
  password_hash      text,                            -- null ⇒ passwordless only
  mfa_secret         text,
  locale             text NOT NULL DEFAULT 'en',
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked','disabled')),
  last_seen_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Coarse platform role. The FINE-GRAINED per-module role lives in the workspace
-- schema (`member.role_id` → `role_permission`), because roles are configurable
-- per workspace and permission data is tenant data.
CREATE TYPE membership_role AS ENUM ('owner','admin','member','viewer');

CREATE TABLE membership (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  role          membership_role NOT NULL DEFAULT 'member',
  status        text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','suspended','removed')),
  invited_by    uuid REFERENCES user_account(id),
  invited_at    timestamptz NOT NULL DEFAULT now(),
  joined_at     timestamptz,
  removed_at    timestamptz,
  UNIQUE (workspace_id, user_id)
);
-- Layer 2 authorization reads this on every request: user → their live workspaces.
CREATE INDEX membership_user_active_idx ON membership (user_id) WHERE status = 'active';
CREATE INDEX membership_ws_idx          ON membership (workspace_id, status);

CREATE TABLE session (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  token_hash     bytea NOT NULL UNIQUE,               -- never the token itself
  workspace_id   uuid REFERENCES workspace(id) ON DELETE CASCADE,  -- last active
  ip             inet,
  user_agent     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_used_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz
);
CREATE INDEX session_user_idx ON session (user_id) WHERE revoked_at IS NULL;
CREATE INDEX session_gc_idx   ON session (expires_at);

-- Magic links, password resets, invitations, WhatsApp/email OTP — one table,
-- one purpose column, one expiry policy. Codes are stored hashed.
CREATE TABLE auth_challenge (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES user_account(id) ON DELETE CASCADE,
  email        citext,
  phone_e164   text,
  purpose      text NOT NULL CHECK (purpose IN ('signin_link','signin_otp','password_reset','email_verify','phone_verify','invite')),
  code_hash    bytea NOT NULL,
  workspace_id uuid REFERENCES workspace(id) ON DELETE CASCADE,
  attempts     smallint NOT NULL DEFAULT 0,
  max_attempts smallint NOT NULL DEFAULT 5,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz
);
CREATE INDEX auth_challenge_lookup_idx ON auth_challenge (purpose, email, phone_e164) WHERE consumed_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3 · BILLING
-- -----------------------------------------------------------------------------

CREATE TABLE plan (
  key                text PRIMARY KEY,                 -- 'starter' | 'growth'
  name               text NOT NULL,
  monthly_paise      bigint NOT NULL,                  -- ₹2,999 → 299900. Never float.
  annual_paise       bigint NOT NULL,
  currency           char(3) NOT NULL DEFAULT 'INR',
  trial_days         smallint NOT NULL DEFAULT 14,
  limits             jsonb NOT NULL DEFAULT '{}',      -- seats, sources, endpoints, activities
  modules            text[] NOT NULL DEFAULT '{}',     -- module keys the plan unlocks
  is_public          boolean NOT NULL DEFAULT true,
  effective_from     date NOT NULL,
  effective_to       date
);

CREATE TABLE subscription (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  plan_key           text NOT NULL REFERENCES plan(key),
  status             text NOT NULL CHECK (status IN ('trialing','active','past_due','cancelled','expired')),
  billing_period     text NOT NULL CHECK (billing_period IN ('monthly','annual')),
  seats              integer NOT NULL DEFAULT 5,
  current_start      timestamptz NOT NULL,
  current_end        timestamptz NOT NULL,
  cancel_at          timestamptz,
  gateway            text,                              -- razorpay
  gateway_ref        text,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX subscription_live_idx ON subscription (workspace_id)
  WHERE status IN ('trialing','active','past_due');

CREATE TABLE invoice (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscription(id),
  number         text NOT NULL UNIQUE,
  status         text NOT NULL CHECK (status IN ('draft','issued','paid','void','refunded')),
  subtotal_paise bigint NOT NULL,
  gst_paise      bigint NOT NULL DEFAULT 0,
  total_paise    bigint NOT NULL,
  gstin          text,
  place_of_supply text,
  issued_on      date,
  paid_at        timestamptz,
  pdf_key        text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invoice_ws_idx ON invoice (workspace_id, issued_on DESC);

-- -----------------------------------------------------------------------------
-- 4 · STATUTORY REFERENCE DATA  (read-only to the app role; versioned by release)
-- -----------------------------------------------------------------------------
-- This is why a control can cite `s.6(4)` and a penalty tile can say `₹250 crore`
-- without a magic string in application code. Amending the Act is a data change.

CREATE TABLE dpdp_section (
  ref          text PRIMARY KEY,                       -- 's.6(4)', 'Rule 7(2)'
  instrument   text NOT NULL CHECK (instrument IN ('act_2023','rules_2025')),
  chapter      text,
  heading      text NOT NULL,
  summary      text NOT NULL,
  full_text    text,
  position     integer NOT NULL
);

CREATE TABLE penalty_head (
  key          text PRIMARY KEY,                       -- 'sec','breach','child','sdf','other'
  title        text NOT NULL,
  section_ref  text NOT NULL REFERENCES dpdp_section(ref),
  schedule_item smallint NOT NULL,
  max_paise    bigint NOT NULL                         -- ₹250 crore → 2500000000000
);

-- The 22 Eighth Schedule languages + English. s.5(3)/s.6(3) depend on this list.
CREATE TABLE language (
  code            text PRIMARY KEY,                    -- BCP-47: 'en','hi','ml'
  english_name    text NOT NULL,
  native_name     text NOT NULL,
  eighth_schedule boolean NOT NULL DEFAULT true,
  script          text,
  direction       text NOT NULL DEFAULT 'ltr' CHECK (direction IN ('ltr','rtl')),
  position        integer NOT NULL
);

-- Identifier taxonomy: what a scanner can find and what a RoPA can declare.
-- `is_sensitive` is what turns a Data Map chip red and forces the extra controls.
CREATE TABLE identifier_type (
  key            text PRIMARY KEY,                     -- 'aadhaar','pan','bank_account'
  label          text NOT NULL,
  category       text NOT NULL,                        -- identity|financial|contact|biometric|health|behavioural
  is_sensitive   boolean NOT NULL DEFAULT false,
  is_child_flag  boolean NOT NULL DEFAULT false,       -- presence implies s.9 duties
  detect_regex   text,                                 -- scanner hint, not validation
  mask_pattern   text NOT NULL DEFAULT '****',
  position       integer NOT NULL
);

CREATE TABLE country (
  iso2                 char(2) PRIMARY KEY,
  name                 text NOT NULL,
  is_india             boolean NOT NULL DEFAULT false
);

-- s.16(1) is a NEGATIVE list: transfers are allowed unless the country is notified.
-- Each notification is an immutable event, so a transfer assessed in the past can be
-- replayed against the rules as they stood on that date.
CREATE TABLE restricted_country_notification (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_iso2  char(2) NOT NULL REFERENCES country(iso2),
  gazette_ref   text NOT NULL,
  restriction   text NOT NULL CHECK (restriction IN ('restricted','conditional','lifted')),
  conditions    text,
  effective_from date NOT NULL,
  effective_to   date,
  published_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rcn_country_idx ON restricted_country_notification (country_iso2, effective_from DESC);

CREATE TABLE sector (
  key          text PRIMARY KEY,                       -- 'bfsi','healthcare','edtech'
  label        text NOT NULL,
  regulator    text,                                   -- RBI, IRDAI, NMC
  localisation_rule text                               -- s.16(2) stricter sectoral rule
);
ALTER TABLE workspace
  ADD CONSTRAINT workspace_sector_fk FOREIGN KEY (sector_key) REFERENCES sector(key);

-- -----------------------------------------------------------------------------
-- 5 · MODULE + PERMISSION CATALOG
-- -----------------------------------------------------------------------------
-- The sidebar, the role matrix and plan entitlements all read from one list.
-- Adding a module is a row, not a deploy across three files.

CREATE TABLE module (
  key           text PRIMARY KEY,                      -- 'ropa','consent','dsr'
  group_key     text NOT NULL,                         -- 'Data Discovery'
  name          text NOT NULL,
  icon          text NOT NULL,
  section_ref   text REFERENCES dpdp_section(ref),
  position      integer NOT NULL,
  is_core       boolean NOT NULL DEFAULT true          -- core ⇒ present in every plan
);

-- The grantable actions, one row per (module, action). Curated here, in code —
-- a workspace can grant or revoke a permission for a role, never invent a new
-- one. That keeps the per-role checkbox matrix closed and auditable: "what can
-- this role do" is answerable by reading rows, not by trusting free text.
CREATE TABLE permission (
  key         text PRIMARY KEY,                        -- 'ropa.approve', 'dsr.export'
  module_key  text NOT NULL REFERENCES module(key),
  action      text NOT NULL,                            -- 'view'|'create'|'edit'|'delete'|'approve'|'export'
  label       text NOT NULL,                             -- 'Approve RoPA entries'
  position    integer NOT NULL,
  UNIQUE (module_key, action)
);

-- -----------------------------------------------------------------------------
-- 6 · CONNECTOR CATALOG  (Data Sources)
-- -----------------------------------------------------------------------------
-- ~120 connectors in the prototype. The catalog is platform data; a workspace's
-- *connection* (and its secret ref) is workspace data.

CREATE TABLE connector (
  key            text PRIMARY KEY,                     -- 'postgres','zohobooks','darwinbox'
  name           text NOT NULL,
  category       text NOT NULL CHECK (category IN ('db','cloud','file','saas')),
  group_label    text NOT NULL,                        -- 'HR & payroll'
  source_kind    text NOT NULL CHECK (source_kind IN ('db','cloud','file','saas')),
  description    text NOT NULL,
  logo_slug      text,
  logo_hex       char(6),
  default_port   integer,
  scan_capabilities text[] NOT NULL DEFAULT '{}',      -- schema|rows|files|objects|mail
  is_read_only   boolean NOT NULL DEFAULT true,        -- scanners never hold write scopes
  status         text NOT NULL DEFAULT 'ga' CHECK (status IN ('ga','beta','planned')),
  position       integer NOT NULL
);

-- The connection form for each connector — this is the SAME field grammar the
-- workspace form engine uses (§ form_field below), so one renderer serves both.
CREATE TABLE connector_field (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_key text NOT NULL REFERENCES connector(key) ON DELETE CASCADE,
  key           text NOT NULL,
  label         text NOT NULL,
  data_type     text NOT NULL,
  is_required   boolean NOT NULL DEFAULT false,
  is_secret     boolean NOT NULL DEFAULT false,        -- ⇒ goes to the vault, never a column
  placeholder   text,
  options       text[],
  position      integer NOT NULL,
  UNIQUE (connector_key, key)
);

-- -----------------------------------------------------------------------------
-- 7 · TEMPLATES  (seed a new workspace; upgradable in place)
-- -----------------------------------------------------------------------------
-- Every workspace COPIES these on provisioning and may then diverge. `template_key`
-- on the copy is what lets a platform update say "3 of your controls have a newer
-- definition" instead of silently overwriting a customer's edits.

CREATE TABLE control_domain_template (
  key        text PRIMARY KEY,                         -- 'A'..'K'
  name       text NOT NULL,
  short_name text NOT NULL,
  blurb      text NOT NULL,
  position   integer NOT NULL
);

CREATE TABLE control_template (
  key             text PRIMARY KEY,                    -- 'A1'..'K4' (37 controls)
  domain_key      text NOT NULL REFERENCES control_domain_template(key),
  title           text NOT NULL,
  statement       text NOT NULL,
  section_refs    text[] NOT NULL,
  penalty_head_key text REFERENCES penalty_head(key),
  control_type    text NOT NULL CHECK (control_type IN ('Preventive','Detective','Corrective')),
  automation      text NOT NULL CHECK (automation IN ('auto','semi','manual','planned')),
  cadence         text NOT NULL,                       -- 'Continuous','Monthly','Event'
  applicability   text NOT NULL DEFAULT 'always'
                    CHECK (applicability IN ('always','sdf','child','consent_manager','xborder')),
  fail_condition  text NOT NULL,
  source_modules  text[] NOT NULL,
  version         integer NOT NULL DEFAULT 1,
  position        integer NOT NULL
);

CREATE TABLE control_evidence_template (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_key      text NOT NULL REFERENCES control_template(key) ON DELETE CASCADE,
  key              text NOT NULL,
  title            text NOT NULL,
  description      text NOT NULL,
  evidence_kind    text NOT NULL CHECK (evidence_kind IN ('auto','derived','attested')),
  source_module    text REFERENCES module(key),
  stale_after_days integer NOT NULL DEFAULT 90,        -- past this a PASS drops to PARTIAL
  position         integer NOT NULL,
  UNIQUE (control_key, key)
);

-- Question banks: gap assessment (43 questions, 9 domains), vendor security
-- questionnaire, DPIA screening. One shape, one renderer, one scorer.
CREATE TABLE questionnaire_template (
  key         text PRIMARY KEY,                        -- 'gap_dpdp_v1','vendor_security_v1'
  kind        text NOT NULL CHECK (kind IN ('gap','vendor_security','dpia_screening','custom')),
  name        text NOT NULL,
  description text NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  scoring     jsonb NOT NULL DEFAULT '{}'              -- answer→points, bands
);

CREATE TABLE question_domain_template (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_key text NOT NULL REFERENCES questionnaire_template(key) ON DELETE CASCADE,
  key               text NOT NULL,                     -- 'A'..'I'
  name              text NOT NULL,
  section_refs      text[] NOT NULL DEFAULT '{}',
  icon              text,
  module_key        text REFERENCES module(key),
  penalty_head_key  text REFERENCES penalty_head(key),
  gate_key          text,                              -- 'kids','proc','xbt' — skip if N/A
  position          integer NOT NULL,
  UNIQUE (questionnaire_key, key)
);

CREATE TABLE question_template (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_key text NOT NULL REFERENCES questionnaire_template(key) ON DELETE CASCADE,
  domain_key        text NOT NULL,
  code              text NOT NULL,                     -- 'A1','D3'
  weight            smallint NOT NULL CHECK (weight BETWEEN 1 AND 3),  -- 3 = statutory must-have
  section_ref       text,
  prompt            text NOT NULL,
  remedy            text NOT NULL,                     -- "what fixes it"
  module_key        text REFERENCES module(key),
  answer_set        text NOT NULL DEFAULT 'ynpu',      -- yes|no|partial|unsure
  position          integer NOT NULL,
  UNIQUE (questionnaire_key, code)
);

CREATE TABLE risk_template (
  key          text PRIMARY KEY,                       -- 'access','excess','child','reid','bias'
  title        text NOT NULL,
  description  text NOT NULL,
  likelihood   char(1) NOT NULL CHECK (likelihood IN ('l','m','h')),
  severity     char(1) NOT NULL CHECK (severity   IN ('l','m','h')),
  mitigation   text NOT NULL,
  trigger_flag text,                                   -- null ⇒ generic; else 'child','reid','bias'
  position     integer NOT NULL
);

CREATE TABLE notice_section_template (
  key          text PRIMARY KEY,                       -- 'what_we_collect','security','children'
  heading      text NOT NULL,
  body         text NOT NULL,
  note         text,                                   -- 's.8(5) safeguards'
  section_ref  text REFERENCES dpdp_section(ref),
  is_core      boolean NOT NULL DEFAULT true,          -- core ⇒ always in a notice
  rule3_element text,                                  -- which of Rule 3's six elements it satisfies
  position     integer NOT NULL
);

CREATE TABLE course_template (
  key           text PRIMARY KEY,
  title         text NOT NULL,
  description   text NOT NULL,
  duration_min  smallint NOT NULL,
  pass_mark     smallint NOT NULL DEFAULT 80,
  languages     text[] NOT NULL DEFAULT '{en}',
  section_refs  text[] NOT NULL DEFAULT '{}',
  position      integer NOT NULL
);

-- -----------------------------------------------------------------------------
-- 8 · RECORD TYPES + FORM TEMPLATES  (the configurable-forms backbone)
-- -----------------------------------------------------------------------------
-- `record_type` is the registry that makes dynamic forms safe: it declares which
-- physical table a form writes to, and therefore what a field is allowed to map
-- onto. A form_field can only target a column that this registry vouches for.

CREATE TABLE record_type (
  key             text PRIMARY KEY,                    -- 'ropa_activity','dataset','vendor'
  module_key      text NOT NULL REFERENCES module(key),
  label           text NOT NULL,
  target_table    text NOT NULL,                       -- physical table in ws_* schema
  ref_prefix      text,                                -- 'RA','DPIA','ISS'
  supports_custom boolean NOT NULL DEFAULT true,       -- has a `custom jsonb` column
  position        integer NOT NULL
);

-- The allowlist. A dynamic field may bind to a real column ONLY if the pair
-- appears here. This is what stops "configurable form" from meaning
-- "user-controlled SQL identifier".
CREATE TABLE record_type_column (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type_key text NOT NULL REFERENCES record_type(key) ON DELETE CASCADE,
  column_name     text NOT NULL,
  data_type       text NOT NULL,                       -- see form_data_type in ws schema
  is_statutory    boolean NOT NULL DEFAULT false,      -- the Act requires it ⇒ cannot be removed
  is_required_by_law boolean NOT NULL DEFAULT false,   -- ⇒ `required` cannot be turned off
  section_ref     text REFERENCES dpdp_section(ref),
  UNIQUE (record_type_key, column_name)
);

CREATE TABLE form_template (
  key             text PRIMARY KEY,                    -- 'ropa_activity_default'
  record_type_key text NOT NULL REFERENCES record_type(key),
  name            text NOT NULL,
  version         integer NOT NULL DEFAULT 1
);

CREATE TABLE form_template_field (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key        text NOT NULL REFERENCES form_template(key) ON DELETE CASCADE,
  key             text NOT NULL,
  label           text NOT NULL,
  help            text,
  data_type       text NOT NULL,
  is_required     boolean NOT NULL DEFAULT false,
  is_system       boolean NOT NULL DEFAULT true,       -- cannot be deleted, only hidden
  is_locked       boolean NOT NULL DEFAULT false,      -- required BY THE ACT — cannot be optional
  target_column   text,                                -- must exist in record_type_column
  section_ref     text,
  options         jsonb NOT NULL DEFAULT '[]',
  position        integer NOT NULL,
  UNIQUE (form_key, key)
);

-- -----------------------------------------------------------------------------
-- 9 · MIGRATION LEDGER
-- -----------------------------------------------------------------------------
-- One row per (schema, version). CI asserts zero drift: every ws_* schema must be
-- at max(version). A failure at workspace 400 of 900 is safe to re-run.

CREATE TABLE schema_migration (
  schema_name  text NOT NULL,
  version      text NOT NULL,
  checksum     bytea NOT NULL,
  applied_at   timestamptz NOT NULL DEFAULT now(),
  duration_ms  integer,
  PRIMARY KEY (schema_name, version)
);
CREATE INDEX schema_migration_version_idx ON schema_migration (version);

-- Provisioning / migration work queue — resumable by construction.
CREATE TABLE provisioning_job (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('create','migrate','seed','export','purge')),
  target_version text,
  status       text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  attempts     smallint NOT NULL DEFAULT 0,
  error        text,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX provisioning_job_pending_idx ON provisioning_job (status, created_at) WHERE status IN ('queued','running');

-- Platform-level audit: who created/suspended/exported a workspace. Workspace-level
-- audit lives inside the workspace schema so it travels with an export.
CREATE TABLE platform_audit_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at           timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES user_account(id),
  actor_ip     inet,
  action       text NOT NULL,
  workspace_id uuid REFERENCES workspace(id),
  detail       jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX platform_audit_ws_idx ON platform_audit_log (workspace_id, at DESC);
