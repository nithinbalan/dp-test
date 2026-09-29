-- =============================================================================
-- JETHUR DPDP · WORKSPACE · department & question_domain gain is_active
-- =============================================================================
-- Settings → Master data lets an admin deactivate a department or a readiness
-- section without deleting it (existing employees / assessments keep their
-- reference). The Drizzle mirror already declares `is_active`; this adds the
-- column it was missing. Additive only: existing rows default to active.
-- =============================================================================

ALTER TABLE department      ADD COLUMN is_active boolean NOT NULL DEFAULT true;
ALTER TABLE question_domain ADD COLUMN is_active boolean NOT NULL DEFAULT true;
