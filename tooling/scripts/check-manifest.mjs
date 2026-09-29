#!/usr/bin/env node
/**
 * Validates every component against the API contract.
 * Blocking gate #3 in docs/AI_GENERATION_PROTOCOL.md §2.
 *
 * Reads components straight from source (not from the committed manifest), so it
 * validates reality rather than a possibly-stale artifact. Drift of the generated
 * files is a SEPARATE gate — `pnpm ds:manifest --check` — because a check that can
 * rewrite what it is checking is not a check.
 *
 * This script writes nothing.
 */
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { extractComponents } from './lib/extract.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const contract = JSON.parse(await readFile(join(ROOT, 'design-system/contract.json'), 'utf8'));
const components = extractComponents(ROOT);

const errors = [];
const warnings = [];

const reserved = contract.reservedProps;
const banned = new Set(contract.bannedPropNames);
const exempt = new Set(Object.keys(contract.bannedPropNotes ?? {}));
const boolPrefixes = contract.booleanPrefixes;
const ALLOWED_NON_PREFIXED_BOOLS = new Set(['fullWidth', 'asChild']);

for (const c of components) {
  const where = `${c.tier}/${c.name}`;

  // --- required structure ---------------------------------------------------
  if (!c.hasStory) {
    errors.push(
      `${where}: missing ${c.name}.stories.tsx — a component without a story cannot be reviewed for consistency`,
    );
  }
  if (!c.hasTest) warnings.push(`${where}: missing ${c.name}.test.tsx`);

  // --- description: this is what ds:neighbors matches against ---------------
  if (!c.description || c.description.length < 10 || c.description === `${c.name} component.`) {
    errors.push(
      `${where}: needs a real TSDoc description on \`${c.name}Props\` — it is what ds:neighbors searches, so a missing one guarantees this component gets duplicated`,
    );
  }

  // --- declared tier must match location ------------------------------------
  if (c.declaredTier && c.declaredTier !== c.tier) {
    errors.push(`${where}: declares @tier ${c.declaredTier} but lives in ${c.tier}/`);
  }

  // --- prop vocabulary ------------------------------------------------------
  for (const p of c.props) {
    // `exactOptionalPropertyTypes` is on (ADR-0003), so an optional prop that does
    // not admit `undefined` cannot receive a forwarded optional value. Every
    // consumer would hit an opaque TS2375; the contract states it plainly instead.
    const bare = p.type.replace(/\s*\|\s*undefined\s*$/, '').trim();
    if (!p.required && bare === p.type && !/^Omit<|ComponentProps/.test(p.type)) {
      errors.push(
        `${where}: optional prop "${p.name}" must be declared \`?: ${p.type} | undefined\` — exactOptionalPropertyTypes is on, so without it consumers cannot forward an optional value. See docs/COMPONENT_CONTRACT.md §4.`,
      );
    }
    if (banned.has(p.name) && !exempt.has(p.name)) {
      errors.push(`${where}: banned prop "${p.name}" — see docs/COMPONENT_CONTRACT.md §1`);
      continue;
    }
    if (p.name === 'type' && !/^(string|React|'submit')/.test(p.type)) {
      warnings.push(
        `${where}: prop "type" is legal only as a native DOM passthrough; visual style is "variant"`,
      );
    }

    const spec = reserved[p.name];
    if (spec) {
      const compare = p.type.replace(/\s*\|\s*undefined\s*$/, '').trim();
      if (spec.type.includes('|') && compare === 'string') {
        errors.push(
          `${where}: "${p.name}" must be a union literal, not \`string\` (contract: ${spec.type})`,
        );
      }
      // every value a component offers must exist in the contract's vocabulary
      if (spec.type.includes('|') && compare.includes('|')) {
        const allowed = new Set(spec.type.split('|').map((s) => s.trim().replace(/['"]/g, '')));
        const offered = compare.split('|').map((s) => s.trim().replace(/['"]/g, ''));
        const invented = offered.filter((v) => v && !allowed.has(v));
        if (invented.length) {
          errors.push(
            `${where}: "${p.name}" offers ${invented.map((v) => `"${v}"`).join(', ')}, which the contract does not define. Add to design-system/contract.json or use an existing value.`,
          );
        }
      }
      if (spec.default && !p.required && p.default === null) {
        warnings.push(`${where}: "${p.name}" should document @default ${spec.default}`);
      }
    }

    if (bare === 'boolean') {
      const prefixed = boolPrefixes.some((pre) => p.name.startsWith(pre));
      if (!prefixed && !ALLOWED_NON_PREFIXED_BOOLS.has(p.name)) {
        errors.push(
          `${where}: boolean "${p.name}" must start with ${boolPrefixes.join('/')} — docs/COMPONENT_CONTRACT.md §2`,
        );
      }
      if (/^(isNot|hide|no)[A-Z]/.test(p.name)) {
        errors.push(
          `${where}: negated boolean "${p.name}" is banned — it forces double-negative reasoning at every call site`,
        );
      }
    }

    if (/\bany\b/.test(p.type)) errors.push(`${where}: prop "${p.name}" uses \`any\``);
    if (p.type.trim() === 'Function')
      errors.push(`${where}: prop "${p.name}" uses bare \`Function\``);
    if (/^on[A-Z]/.test(p.name) && !/=>|EventHandler/.test(p.type)) {
      warnings.push(`${where}: handler "${p.name}" should be a function type`);
    }
    if (!p.description) warnings.push(`${where}: prop "${p.name}" has no TSDoc`);
  }
}

// --- duplicate-concept detection ---------------------------------------------
const seen = new Map();
for (const c of components) {
  const key = c.name.toLowerCase().replace(/(button|field|input|card|list|item)$/, '');
  if (key.length < 3) continue;
  if (seen.has(key)) {
    warnings.push(
      `possible duplicate concept: "${c.name}" and "${seen.get(key)}" — run ds:neighbors before adding a sibling`,
    );
  } else seen.set(key, c.name);
}

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(
    `\nds:check failed — ${errors.length} contract violation(s). See docs/COMPONENT_CONTRACT.md`,
  );
  process.exit(1);
}
console.log(`ds:check passed — ${components.length} components, ${warnings.length} warning(s)`);
