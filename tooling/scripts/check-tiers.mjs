#!/usr/bin/env node
/**
 * Structural checks ESLint cannot express (they are about the filesystem, not the AST):
 *   - component lives in the folder matching its declared tier
 *   - folder name == file name == exported name
 *   - required files present (docs/DESIGN_SYSTEM.md §2)
 *   - no deep relative imports across tiers (use the alias)
 *   - no stray components outside a tier folder
 *
 * Blocking gate #2 in docs/AI_GENERATION_PROTOCOL.md §2.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const TIERS = ['atoms', 'molecules', 'organisms', 'templates'];
const REQUIRED = (n) => [`${n}.tsx`, `${n}.types.ts`, `${n}.stories.tsx`, 'index.ts'];

const errors = [];
const warnings = [];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

for (const tier of TIERS) {
  const tierDir = join(ROOT, 'src/components', tier);
  if (!(await exists(tierDir))) continue;

  for (const entry of await readdir(tierDir, { withFileTypes: true })) {
    // stray files directly in a tier folder
    if (entry.isFile()) {
      // CLAUDE.md is the generated tier index and belongs here; it auto-loads
      // when anyone works in this folder. See docs/CONTEXT_ARCHITECTURE.md.
      const ALLOWED_TIER_FILES = new Set(['index.ts', 'CLAUDE.md', '.gitkeep']);
      if (!ALLOWED_TIER_FILES.has(entry.name)) {
        errors.push(
          `${tier}/${entry.name}: components live in their own folder — ${tier}/<Name>/<Name>.tsx`,
        );
      }
      continue;
    }

    const name = entry.name;
    const dir = join(tierDir, name);

    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
      errors.push(`${tier}/${name}: folder must be PascalCase`);
      continue;
    }

    for (const file of REQUIRED(name)) {
      if (!(await exists(join(dir, file)))) {
        errors.push(
          `${tier}/${name}: missing required file ${file} — see docs/DESIGN_SYSTEM.md §2`,
        );
      }
    }
    if (!(await exists(join(dir, `${name}.test.tsx`)))) {
      warnings.push(`${tier}/${name}: no test file`);
    }

    const mainPath = join(dir, `${name}.tsx`);
    if (!(await exists(mainPath))) continue;
    const src = await readFile(mainPath, 'utf8');

    // export name must match the file name
    const exportsName =
      new RegExp(`export\\s+(?:const|function|class)\\s+${name}\\b`).test(src) ||
      new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`).test(src);
    if (!exportsName) {
      errors.push(`${tier}/${name}: must export a symbol named "${name}" from ${name}.tsx`);
    }

    // declared tier header must match the folder
    const declared = src.match(/@tier\s+(\w+)/);
    if (declared && declared[1] !== tier) {
      errors.push(`${tier}/${name}: declares @tier ${declared[1]} but lives in ${tier}/`);
    }
    if (!declared) {
      warnings.push(`${tier}/${name}: no "@tier ${tier}" header comment`);
    }

    // deep relative imports across component folders
    for (const m of src.matchAll(/from\s+'(\.\.\/[^']+)'/g)) {
      if (m[1].includes('../../')) {
        errors.push(
          `${tier}/${name}: deep relative import "${m[1]}" — use an alias (@atoms/…, @shared/…)`,
        );
      }
    }

    // barrel must re-export
    const idx = join(dir, 'index.ts');
    if (await exists(idx)) {
      const idxSrc = await readFile(idx, 'utf8');
      if (!idxSrc.includes(name)) errors.push(`${tier}/${name}/index.ts: must re-export ${name}`);
    }
  }
}

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nds:tiers failed — ${errors.length} structural violation(s).`);
  process.exit(1);
}
console.log(`ds:tiers passed (${warnings.length} warning(s))`);
