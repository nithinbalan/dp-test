-- =============================================================================
-- JETHUR DPDP · PLATFORM · workspace gains a logo_url display copy
-- =============================================================================
-- The Configuration Studio "Workspace" panel now uploads a real logo, stored as
-- an `attachment` row inside the tenant's own `ws_<ulid>` schema (0002 §17) and
-- referenced by `workspace_profile.logo_attachment_id`. The topbar and sidebar,
-- though, render from the SESSION/registry path (`public.workspace`, resolved by
-- `validateSession` before any tenant transaction opens) — the same reason
-- `legal_name` already has a synced copy here (see `updateRegistryLegalName` in
-- src/app/api/settings/repository.ts). `logo_url` is that same kind of display
-- convenience: a resolved, publicly-servable URL, written only after the tenant
-- write commits, never the source of truth.
-- =============================================================================

ALTER TABLE workspace ADD COLUMN logo_url text;
