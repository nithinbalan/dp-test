-- =============================================================================
-- JETHUR DPDP · WORKSPACE · Extends lawful_basis for RoPA's two non-s.7 grounds
-- =============================================================================
-- `lawful_basis` (0002 §0) enumerates only the ten s.6/s.7 grounds. The RoPA
-- "Rules & people" step also offers two grounds the Act recognises outside
-- s.7 — verifiable parental consent (s.9, required whenever the principal is
-- a minor) and processing for security safeguards (s.8(5), e.g. backups,
-- access logs, incident response) — neither of which is a s.7 clause and so
-- has no slot in the original enum. Additive only: existing rows and values
-- are untouched. Postgres 12+ allows `ALTER TYPE ... ADD VALUE` inside the
-- transaction the migration runner already wraps every file in, as long as
-- the new value is not used by a statement in that same transaction — which
-- holds here, since nothing in this file writes a row.
-- =============================================================================

ALTER TYPE lawful_basis ADD VALUE IF NOT EXISTS 'parental_consent';   -- s.9
ALTER TYPE lawful_basis ADD VALUE IF NOT EXISTS 'security_safeguards'; -- s.8(5)
