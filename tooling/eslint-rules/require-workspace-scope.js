/**
 * WORKSPACE (TENANT) ISOLATION GUARD — the most load-bearing rule in this repo.
 *
 * Schema-per-tenant only holds if every query runs inside a connection whose
 * search_path was pinned for exactly one workspace. This rule makes the unsafe
 * path un-writable rather than merely discouraged:
 *
 *   1. The raw DB client (`@server/db/client`) may only be imported by the
 *      isolation layer itself (`src/server/db/**`, `src/server/workspace/**`)
 *      and by migration tooling.
 *   2. Only a file named `repository.ts` may import `@server/db` at all.
 *   3. `sql.raw()` / string-built SQL is banned outside the isolation layer.
 *
 * Rule 2 keys on the file's ROLE, not its location (ADR-0007). A module lives
 * beside its routes under `src/app/api/<module>/`, so a directory allowlist would
 * have had to admit the whole route tree — handing `route.ts` the DB access that
 * only the repository should have. Matching the filename instead is strictly
 * tighter than the old `src/server/**` check: `service.ts` and `route.ts` are
 * both refused even sitting in the same folder as the repository, so "the
 * repository is the only door to data" is now enforced rather than merely
 * intended.
 *
 * See docs/WORKSPACE_ISOLATION.md. Do not add exemptions without an ADR.
 */
'use strict';

const RAW_CLIENT = /^@server\/db\/client$|(?:^|\/)server\/db\/client$/;
const ANY_DB = /^@server\/db(?:\/|$)/;

const ISOLATION_LAYER = /src[\\/]server[\\/](db|workspace)[\\/]/;
const REPOSITORY = /(?:^|[\\/])repository\.ts$/;
const TOOLING = /tooling[\\/]/;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Force all database access through the workspace-scoped isolation layer.',
    },
    schema: [],
    messages: {
      rawClient:
        'Raw DB client may only be imported inside src/server/db/** or src/server/workspace/**. Use `withWorkspace(ctx, (tx) => ...)` from @server/workspace. See docs/WORKSPACE_ISOLATION.md.',
      dbOutsideServer:
        "Only a repository.ts may import @server/db — that is what makes the repository the single door to data. Move the query into this module's repository.ts and call it from the service. See docs/WORKSPACE_ISOLATION.md.",
      rawSql:
        'Raw/interpolated SQL is banned outside the isolation layer — it is the standard way schema pinning gets bypassed. Use parameterised Drizzle queries. See docs/WORKSPACE_ISOLATION.md.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (TOOLING.test(filename)) return {};

    const inIsolationLayer = ISOLATION_LAYER.test(filename);
    const mayQueryDb = inIsolationLayer || REPOSITORY.test(filename);

    return {
      ImportDeclaration(node) {
        const src = node.source.value;
        if (typeof src !== 'string') return;
        if (RAW_CLIENT.test(src) && !inIsolationLayer) {
          context.report({ node, messageId: 'rawClient' });
          return;
        }
        if (ANY_DB.test(src) && !mayQueryDb) {
          context.report({ node, messageId: 'dbOutsideServer' });
        }
      },
      CallExpression(node) {
        if (inIsolationLayer) return;
        const c = node.callee;
        const isRaw =
          c.type === 'MemberExpression' &&
          c.property.type === 'Identifier' &&
          (c.property.name === 'raw' || c.property.name === 'unsafe') &&
          c.object.type === 'Identifier' &&
          (c.object.name === 'sql' || c.object.name === 'db');
        if (isRaw) context.report({ node, messageId: 'rawSql' });
      },
    };
  },
};
