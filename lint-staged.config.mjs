/**
 * Context regeneration is part of the WRITE PATH, not a remembered step.
 *
 * Touching a component, a server domain, the error taxonomy or the env schema
 * regenerates every derived context file and stages it in the same commit — the
 * same way you'd regenerate a lockfile. Freshness is therefore a side effect of
 * committing. `pnpm ctx:drift` in CI catches anyone who bypasses the hook.
 *
 * TWO RULES MAKE THAT SAFE, and both are easy to undo by accident:
 *
 * 1. **Exactly one entry regenerates.** `pnpm ctx` rebuilds every derived file
 *    regardless of which path triggered it, so a second entry doing the same work
 *    is not just wasted seconds — the two `git add` calls run as separate git
 *    processes and race for `.git/index.lock`, failing the commit with
 *    "Unable to create '.git/index.lock': File exists". That only shows up when a
 *    single commit happens to touch two triggering globs (say a page and a
 *    translation), which is why it can sit dormant for a long time. Add a new
 *    trigger path to REGENERATION_TRIGGERS below — never a second `pnpm ctx` task.
 *
 * 2. **The hook runs with `--concurrent false`** (see `.husky/pre-commit`).
 *    lint-staged runs each glob's task list in parallel by default, which would
 *    let the `--check` validators below run against files regeneration has not
 *    rewritten yet. Serial execution follows this file's key order, so the entry
 *    that regenerates is declared first on purpose.
 */

/** Everything `pnpm ctx` writes, staged so it lands in the same commit. */
const REGENERATED_OUTPUT = [
  'design-system/manifest.json',
  'design-system/tokens',
  'docs/COMPONENT_CONTRACT.md',
  'docs/system',
  'src/shared/types/tokens.ts',
  'src/shared/types/locale.ts',
  'src/shared/types/messages.ts',
  'src/shared/types/catalogues.ts',
  'src/components/*/CLAUDE.md',
  'src/server/*/CLAUDE.md',
].join(' ');

/** Every source path whose change can invalidate one of those outputs. */
const REGENERATION_TRIGGERS =
  '{src/components/**/*.{ts,tsx},src/server/**/*.ts,src/app/**/*.tsx,' +
  'src/shared/config/env.ts,design-system/{contract,locales,theme}.json,public/lang/**/*.json}';

export default {
  // FIRST, and the only place `pnpm ctx` runs — see rule 1 above.
  [REGENERATION_TRIGGERS]: ['pnpm ctx', `git add ${REGENERATED_OUTPUT}`],

  '*.{ts,tsx}': ['eslint --max-warnings=0 --fix', 'prettier --write'],
  '*.{js,mjs,cjs}': ['eslint --max-warnings=0 --fix', 'prettier --write'],
  '*.{json,md,css,yml,yaml}': ['prettier --write'],
  // Hand-written CSS is where physical direction properties hide from ESLint.
  'src/**/*.css': () => 'pnpm ds:rtl',

  // Component change -> validate structure + contract + context.
  'src/components/**/*.{ts,tsx}': [
    () => 'pnpm ds:tiers',
    () => 'pnpm ds:check',
    () => 'pnpm ctx:check',
  ],

  // Server domain change -> check colocated context is complete.
  'src/server/**/*.ts': () => 'pnpm ctx:check',

  'src/shared/config/env.ts': () => 'pnpm ctx:check',
  '.env.example': () => 'pnpm ctx:check',

  // theme.json drives every visual value, so contrast is re-checked here — a
  // rebrand must not land with unreadable text.
  'design-system/theme.json': () => 'node tooling/scripts/build-tokens.mjs --check',

  // A translation edit re-runs completeness — every namespace × every locale,
  // not just the file that was touched.
  'public/lang/**/*.json': () => 'pnpm ds:i18n --check',
};
