#!/usr/bin/env node
/**
 * CONTEXT COMPLETENESS GATE.
 *
 * This is the rule that lets the app grow without losing its context: you cannot
 * add a unit of the system without adding the context that describes it. Every
 * check here answers one question — "if an agent opened this cold, would it have
 * what it needs?"
 *
 * Rationale for each rule is in docs/CONTEXT_ARCHITECTURE.md.
 * Writes nothing.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readdirSync, statSync } from 'node:fs';
import { extractSystem } from './lib/extract-system.mjs';
import { extractComponents } from './lib/extract.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const system = extractSystem(ROOT);
const components = extractComponents(ROOT);

const errors = [];
const warnings = [];

// --- 1. Every domain carries context, and a human filled in the WHY ----------
for (const d of system.domains) {
  const path = join(ROOT, d.path, 'CLAUDE.md');
  if (!existsSync(path)) {
    errors.push(
      `${d.path}: no CLAUDE.md — run \`pnpm ctx\`. A domain with no context gets misused by the next agent that opens it.`,
    );
    continue;
  }
  const md = await readFile(path, 'utf8');
  const human = md.slice(md.indexOf('<!-- /GENERATED:domain -->'));
  if (/TODO: describe/.test(human)) {
    errors.push(
      `${d.path}/CLAUDE.md: the human-owned section is still a TODO. Generated facts describe WHAT exists; only you can write WHY. This is the half that prevents wrong assumptions.`,
    );
  }
}

// --- 2. Every public export describes itself ---------------------------------
// A symbol with no TSDoc is invisible to retrieval and gets reimplemented.
for (const d of system.domains) {
  for (const a of d.api) {
    if (!a.description) {
      errors.push(
        `${a.file}: exported \`${a.name}\` has no TSDoc. Public API without a description cannot be found by \`pnpm ctx:find\`, so it gets rebuilt instead of reused.`,
      );
    }
  }
}

// --- 3. Components: description drives retrieval -----------------------------
for (const c of components) {
  if (!c.description || c.description === `${c.name} component.`) {
    errors.push(`${c.path}: \`${c.name}Props\` has no TSDoc description.`);
  }
  for (const p of c.props) {
    if (!p.description) warnings.push(`${c.path}: prop \`${p.name}\` has no TSDoc`);
  }
}

// --- 4. env.ts and .env.example must agree -----------------------------------
const validated = new Set(system.env.map((e) => e.name));
const documented = new Set(system.envExample);
for (const name of validated) {
  if (!documented.has(name)) {
    errors.push(
      `.env.example: missing \`${name}\`, which env.ts requires. A new dev cannot boot the app.`,
    );
  }
}
for (const name of documented) {
  if (!validated.has(name)) {
    errors.push(
      `src/shared/config/env.ts: \`${name}\` is documented in .env.example but not validated. Unvalidated config is a runtime landmine — see docs/SECURITY_HYGIENE.md §2.`,
    );
  }
}

// --- 5. Every relative doc link resolves ------------------------------------
// Covers ALL context files and docs, not just domains: a dead pointer is worse than
// none, because an agent follows it, finds nothing, and proceeds on assumption.
{
  const mdFiles = [];
  const collectMd = (dir) => {
    for (const e of readdirSync(dir)) {
      if (e === 'node_modules' || e === '.next' || e.startsWith('.')) continue;
      const full = join(dir, e);
      if (statSync(full).isDirectory()) collectMd(full);
      else if (e.endsWith('.md')) mdFiles.push(full);
    }
  };
  collectMd(join(ROOT, 'src'));
  collectMd(join(ROOT, 'docs'));
  collectMd(join(ROOT, 'design-system'));
  mdFiles.push(join(ROOT, 'CLAUDE.md'), join(ROOT, 'README.md'));

  for (const file of mdFiles) {
    if (!existsSync(file)) continue;
    const md = await readFile(file, 'utf8');
    const from = file.replace(ROOT + '/', '');
    for (const m of md.matchAll(/\]\((\.[^)#]+\.md)(#[^)]*)?\)/g)) {
      const target = resolve(join(file, '..'), m[1]);
      if (!existsSync(target)) {
        errors.push(
          `${from}: broken link to ${m[1]} — an agent will follow it, find nothing, and proceed on assumption.`,
        );
      }
    }
  }
}

// --- 6. Isolation layer must stay small and declared -------------------------
const isolation = system.domains.filter((d) => d.isIsolationLayer);
for (const d of isolation) {
  const md = existsSync(join(ROOT, d.path, 'CLAUDE.md'))
    ? await readFile(join(ROOT, d.path, 'CLAUDE.md'), 'utf8')
    : '';
  if (!/Isolation layer/.test(md)) {
    errors.push(`${d.path}: isolation-layer domain is not flagged as one in its context file.`);
  }
}

// --- 7. Context budget -------------------------------------------------------
// Auto-loading files are paid for on EVERY session in that directory, so their size
// is a recurring tax, not a one-off. A tier index that grows a prop table per
// component is ~29k tokens at 60 components — which is how "more documentation"
// quietly becomes worse context. Keep indexes terse; detail belongs in the source.
const BUDGET_WARN = 8 * 1024;
const BUDGET_FAIL = 24 * 1024;

const autoLoaded = [];
const collect = (dir) => {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) collect(full);
    else if (e === 'CLAUDE.md') autoLoaded.push(full);
  }
};
collect(join(ROOT, 'src'));

for (const file of autoLoaded) {
  const size = (await readFile(file, 'utf8')).length;
  const rel = file.replace(ROOT + '/', '');
  if (size > BUDGET_FAIL) {
    errors.push(
      `${rel}: ${(size / 1024).toFixed(1)}KB exceeds the ${BUDGET_FAIL / 1024}KB context budget. This file auto-loads on every session in that directory, so its size is a recurring cost. Move detail into the source it describes, or split the folder.`,
    );
  } else if (size > BUDGET_WARN) {
    warnings.push(
      `${rel}: ${(size / 1024).toFixed(1)}KB — approaching the ${BUDGET_FAIL / 1024}KB context budget. Keep it an index, not a catalog.`,
    );
  }
}

// --- 8. ADRs must be linkable -------------------------------------------------
// An ADR with no `affects:` reaches nobody: it will not back-link into any context
// file, so the code it constrains never surfaces it.
for (const a of system.adrs) {
  const rel = a.file;
  if (!a.hasFrontmatter) {
    errors.push(
      `${rel}: no frontmatter. Without \`affects:\` this decision cannot back-link into the code it constrains, so nobody editing that code will ever see it.`,
    );
    continue;
  }
  if (!a.id) errors.push(`${rel}: frontmatter is missing \`id\`.`);
  if (!a.title) errors.push(`${rel}: frontmatter is missing \`title\`.`);
  if (!a.affects.length) {
    errors.push(
      `${rel}: \`affects:\` is empty. Name the paths this decision constrains, or it reaches nobody.`,
    );
  }
  for (const path of a.affects) {
    if (!existsSync(join(ROOT, path))) {
      errors.push(
        `${rel}: \`affects: ${path}\` does not exist. A stale ADR link is worse than none.`,
      );
    }
  }
  if (!['proposed', 'accepted', 'superseded'].includes(a.status)) {
    warnings.push(`${rel}: status "${a.status}" is not proposed/accepted/superseded.`);
  }
}

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nctx:check failed — ${errors.length} unit(s) of the system lack context.`);
  console.error('See docs/CONTEXT_ARCHITECTURE.md for why each of these blocks a merge.\n');
  process.exit(1);
}
console.log(
  `ctx:check passed — ${system.domains.length} domains, ${components.length} components, ` +
    `${system.domains.reduce((n, d) => n + d.api.length, 0)} public exports documented, ` +
    `${system.adrs.length} ADRs linked, ${autoLoaded.length} auto-loading context files within budget ` +
    `(${warnings.length} warning(s))`,
);
