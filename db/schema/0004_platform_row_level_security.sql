-- =============================================================================
-- JETHUR DPDP · PLATFORM · Row-level security on unused workspace_id-bearing tables
-- =============================================================================
-- docs/WORKSPACE_ISOLATION.md §6 requires RLS as belt-and-braces defense on every
-- public table carrying a workspace_id. See docs/adr/0009-platform-table-row-level-
-- security.md for the full reasoning, in particular why `membership` and `session`
-- are NOT included here (they are read by the session-resolution query itself,
-- before any actor identity is known — RLS on them today would either silently
-- break every authenticated request or be a permissive no-op, neither of which is
-- real protection).
--
-- The policy is keyed on a session GUC, `app.workspace_id`, that a platform query
-- must SET LOCAL before it can see rows — mirroring the SET LOCAL search_path
-- mechanism withWorkspace() already uses. Deliberately fails CLOSED: there is no
-- clause that permits an unset GUC, because a permissive fallback on tables nothing
-- queries yet would just be theater. The forcing function is the point — the first
-- module that reads any of these tables must set the GUC to see anything.
--
-- No FORCE ROW LEVEL SECURITY: the migration role owns these tables and legitimately
-- needs unscoped access for admin backfills and reports; the app role (a grantee,
-- never the owner) is always subject to RLS regardless of FORCE. FORCE would only
-- constrain the trusted migration role, not the actual threat this defends against.
-- =============================================================================

ALTER TABLE workspace_domain   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice            ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_domain_scoped ON workspace_domain
  USING (workspace_id = nullif(current_setting('app.workspace_id', true), '')::uuid);

CREATE POLICY subscription_scoped ON subscription
  USING (workspace_id = nullif(current_setting('app.workspace_id', true), '')::uuid);

CREATE POLICY invoice_scoped ON invoice
  USING (workspace_id = nullif(current_setting('app.workspace_id', true), '')::uuid);

-- platform_audit_log.workspace_id is nullable (some platform actions, e.g. a
-- staff-only global operation, are not workspace-scoped) — rows with no
-- workspace_id are platform-level entries, not any workspace's data, so they stay
-- visible regardless of the GUC.
CREATE POLICY platform_audit_log_scoped ON platform_audit_log
  USING (
    workspace_id IS NULL
    OR workspace_id = nullif(current_setting('app.workspace_id', true), '')::uuid
  );
