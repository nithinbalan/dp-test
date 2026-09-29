-- ─────────────────────────────────────────────────────────────────────────────
-- SEED · MODULE + PERMISSION CATALOG (starter matrix)
-- ─────────────────────────────────────────────────────────────────────────────
-- Applies to `public` only. Idempotent — safe to re-run (ON CONFLICT DO NOTHING).
-- Applied by `pnpm db:seed` (tooling/scripts/db-seed.ts), which mirrors
-- tooling/scripts/migrate.ts but is deliberately unversioned: unlike
-- db/schema/*.sql, this file is meant to be extended in place, not superseded
-- by a new numbered file, whenever the catalog itself needs a new row.
--
-- This is the first seed data written for this project; no seed convention
-- existed before it (dpdp_section, connector, language, plan, control_template
-- are all still empty tables). Treat this file as the pattern to extend.
--
-- MODULE KEYS — reconciled with the Access control UI on purpose.
-- `src/shared/mock/access-control.ts` (`ModuleKey`) is the list the sidebar,
-- the role matrix and the Configuration Studio panel were all designed
-- against. This catalog now uses those exact 20 keys — dashboard/gap/
-- collection/actions did not exist in the original 17-key draft and are added
-- here — instead of a separate DB vocabulary that a service-layer table would
-- have to translate. Per the table comment on `module` ("The sidebar, the
-- role matrix and plan entitlements all read from one list"), keeping the
-- catalog and the UI's keys identical is what makes that true; a translation
-- table would just relocate the drift instead of removing it.
--
-- section_ref is left NULL throughout: mapping a module to a specific DPDP
-- section is a statutory judgment call, not a schema one. Do not guess it in
-- from here — populate it against the real dpdp_section catalog once that is
-- itself seeded and checked against the Act.
--
-- is_core is true for every module below (no module withheld from any plan),
-- the safe default. Which modules are plan-gated is a billing/product
-- decision that belongs to `plan.modules`, not something inferred here.
--
-- group_key values match `ModuleGroupKey` in access-control.ts verbatim so the
-- service layer can group rows for the UI without a second translation map.

INSERT INTO module (key, group_key, name, icon, position, is_core) VALUES
  ('dashboard',  'overview',          'Dashboard',                    'layout-dashboard', 1,  true),
  ('gap',        'overview',          'Gap Assessment',               'clipboard-check',  2,  true),
  ('sources',    'dataDiscovery',     'Data Sources',                 'plug',             3,  true),
  ('datamap',    'dataDiscovery',     'Data Map',                     'map',              4,  true),
  ('endpoints',  'dataDiscovery',     'Endpoint Discovery',           'laptop',           5,  true),
  ('collection', 'dataFoundation',    'Data Collection Hub',          'database',         6,  true),
  ('ropa',       'dataFoundation',    'Processing Activities (RoPA)', 'network',          7,  true),
  ('notices',    'privacyOperations', 'Notices',                      'file-text',        8,  true),
  ('consent',    'privacyOperations', 'Consent',                      'check-circle',     9,  true),
  ('dsr',        'privacyOperations', 'Data Principal Requests',      'inbox',            10, true),
  ('breach',     'privacyOperations', 'Breach Management',            'siren',            11, true),
  ('transfers',  'privacyOperations', 'Cross-Border Transfers',       'globe',            12, true),
  ('thirdparty', 'governance',        'Third Parties',                'handshake',        13, true),
  ('controls',   'governance',        'Controls (CCM)',               'shield-check',     14, true),
  ('dpia',       'governance',        'DPIA',                         'clipboard-list',   15, true),
  ('risks',      'governance',        'Risks',                        'shield-alert',     16, true),
  ('actions',    'governance',        'Actions / Tasks',              'list-checks',      17, true),
  ('issues',     'governance',        'Issues',                       'alert-triangle',   18, true),
  ('employees',  'peopleAwareness',   'People & Departments',         'users',            19, true),
  ('academy',    'peopleAwareness',   'Training / Academy',           'graduation-cap',   20, true),
  ('settings',   'administration',    'Workspace Settings',           'settings',         21, true)
ON CONFLICT (key) DO NOTHING;

-- Standard six-action grid, uniform across every module. A module that has no
-- real use for 'approve' or 'export' just never has that permission granted to
-- any role — the catalog row existing costs nothing, and a uniform grid beats
-- special-casing the action list per module.
INSERT INTO permission (key, module_key, action, label, position)
SELECT
  m.key || '.' || a.action,
  m.key,
  a.action,
  initcap(a.action) || ' ' || m.name,
  m.position * 10 + a.position
FROM module m
CROSS JOIN (VALUES
  ('view',    1),
  ('create',  2),
  ('edit',    3),
  ('delete',  4),
  ('approve', 5),
  ('export',  6)
) AS a(action, position)
ON CONFLICT (key) DO NOTHING;
