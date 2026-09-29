-- =============================================================================
-- JETHUR DPDP · WORKSPACE · employee drops handles_personal_data
-- =============================================================================
-- Added in 0002 §? ("drives mandatory training scope") but never wired to
-- anything — no create/import path exposed it in the UI, and no Academy/course
-- assignment logic ever read it. Removed rather than left as dead, silently
-- always-`false` state nobody can set or see. If per-employee "handles
-- personal data" scoping is needed later, it comes back via a new ADR-backed
-- migration, not by resurrecting this column's old meaning.
-- =============================================================================

ALTER TABLE employee DROP COLUMN handles_personal_data;
