#!/usr/bin/env node
/**
 * Universal context retrieval: `pnpm ctx:find "<what you are about to do>"`.
 *
 * `ds:neighbors` answers "does this component exist?". This answers the broader
 * question a vibe-coding session actually needs: *what already exists that is
 * relevant, and what must I read before writing?*
 *
 * Searches components, server domains and their public API, routes, error codes,
 * and the rules docs — then prints a BUDGETED reading list rather than dumping
 * everything, because a context window is finite and an over-stuffed prompt buries
 * the relevant part.
 *
 *   --prompt   emit a full envelope (nearest code + required rules) for generation
 *   --top <n>  results per category (default 3)
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { extractSystem } from './lib/extract-system.mjs';
import { extractComponents } from './lib/extract.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const argv = process.argv.slice(2);
const query = argv.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a)).join(' ');
const top = argv.includes('--top') ? Number(argv[argv.indexOf('--top') + 1]) : 3;
const wantPrompt = argv.includes('--prompt');

if (!query) {
  console.error('usage: pnpm ctx:find "<what you are about to do>" [--top 3] [--prompt]');
  process.exit(1);
}

const STOP = new Set([
  'a',
  'an',
  'the',
  'that',
  'with',
  'for',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'is',
  'it',
  'add',
  'new',
  'make',
  'create',
  'component',
  'build',
  'want',
  'need',
]);
const tokenize = (s) =>
  s
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));

/**
 * Expand the query with this codebase's own vocabulary.
 *
 * This is the single biggest retrieval win here, and it is not a ranking problem:
 * we deliberately enforce one word per concept (`workspace`, never `tenant`), so a
 * search using the natural word scores ZERO against everything and the agent
 * concludes nothing exists. Expansion is added at LOWER weight than a direct hit,
 * so exact matches still win.
 */
const lexicon = JSON.parse(
  await readFile(join(ROOT, 'design-system/lexicon.json'), 'utf8'),
).synonyms;

const direct = tokenize(query);
const expanded = new Set();
for (const t of direct)
  for (const syn of lexicon[t] ?? []) if (!direct.includes(syn)) expanded.add(syn);

const q = direct;
const qExpanded = [...expanded];
const score = (text, bonus = 0) => {
  const set = new Set(tokenize(text));
  const toks = [...set];
  let s = bonus;
  for (const t of q) {
    if (set.has(t)) s += 3;
    else if (toks.some((c) => c.startsWith(t) || t.startsWith(c))) s += 1;
  }
  for (const t of qExpanded) {
    if (set.has(t)) s += 2; // synonym hit: real, but never outranks the exact word
  }
  return s;
};

const system = extractSystem(ROOT);
const components = extractComponents(ROOT);

const rank = (items, fn) =>
  items
    .map((i) => ({ i, s: fn(i) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, top);

const hitComponents = rank(components, (c) =>
  score(
    `${c.name} ${c.description} ${c.tags.join(' ')} ${c.props.map((p) => p.name).join(' ')}`,
    score(c.name) > 0 ? 5 : 0,
  ),
);

const hitDomains = rank(system.domains, (d) =>
  score(`${d.name} ${d.purpose} ${d.api.map((a) => `${a.name} ${a.description}`).join(' ')}`),
);

const hitApi = rank(
  system.domains.flatMap((d) => d.api.map((a) => ({ ...a, domain: d.importPath }))),
  (a) => score(`${a.name} ${a.description} ${a.layer}`),
);

const hitRoutes = rank(system.routes, (r) => score(r.path + ' ' + r.file));
const hitErrors = rank(system.errorCodes, (e) => score(`${e.code} ${e.userMessage}`));

/**
 * Rules that are MANDATORY for a task shape. Not scored — matched, because
 * "did the model happen to rank the security doc highly" is not a safety model.
 */
const RULES = [
  {
    when: /\b(db|database|query|sql|schema|tenant|workspace|repository|migration|row|table)\b/i,
    read: ['docs/WORKSPACE_ISOLATION.md'],
    why: 'touches data — isolation is the invariant that cannot break',
  },
  {
    when: /\b(error|throw|catch|fail|exception|retry|bug|fix|broken|crash)\b/i,
    read: ['docs/ERROR_HANDLING.md', 'docs/ERROR_FIXING_PROTOCOL.md'],
    why: 'the error pattern is fixed, and fixing follows a protocol',
  },
  {
    when: /\b(route|api|action|endpoint|handler|form|upload|auth|login|session|permission|token)\b/i,
    read: ['docs/SECURITY_HYGIENE.md', 'docs/ERROR_HANDLING.md'],
    why: 'a request boundary — authz and input validation are mandatory',
  },
  {
    when: /\b(component|button|input|modal|card|ui|style|color|token|layout|page|design)\b/i,
    read: ['docs/COMPONENT_CONTRACT.md', 'docs/DESIGN_SYSTEM.md'],
    why: 'UI work — the prop vocabulary is closed and tokens are the only legal values',
  },
];

const required = new Set(['docs/SECURITY_HYGIENE.md']); // always: it runs at every completion
for (const r of RULES) if (r.when.test(query)) r.read.forEach((f) => required.add(f));

// ---------------------------------------------------------------------------
const section = (title, rows) => {
  if (!rows.length) return;
  console.log(`\n${title}`);
  rows.forEach((r) => console.log(r));
};

console.log(`\nContext for: "${query}"`);
console.log('='.repeat(72));

section(
  'EXISTING COMPONENTS — extend before creating',
  hitComponents.map(
    ({ i, s }) =>
      `  ${i.name.padEnd(18)} ${i.tier.padEnd(11)} (${s})\n    ${i.description}\n    import { ${i.name} } from '${i.importPath}';`,
  ),
);
section(
  'RELEVANT DOMAINS — read their CLAUDE.md (it auto-loads when you edit there)',
  hitDomains.map(
    ({ i, s }) =>
      `  ${i.importPath.padEnd(22)} (${s}) ${i.api.length} exports\n    ${i.purpose || '(no purpose written)'}\n    ${i.path}/CLAUDE.md`,
  ),
);
section(
  'EXISTING FUNCTIONS — reuse before rewriting',
  hitApi.map(
    ({ i, s }) =>
      `  ${i.name.padEnd(24)} ${i.domain.padEnd(20)} ${i.layer.padEnd(11)} (${s})\n    ${i.description.split('\n')[0]}`,
  ),
);
section(
  'RELATED ROUTES',
  hitRoutes.map(({ i }) => `  ${i.path.padEnd(24)} ${i.kind.padEnd(10)} ${i.file}`),
);
section(
  'RELEVANT ERROR CODES — use one, do not invent',
  hitErrors.map(({ i }) => `  ${i.code.padEnd(28)} ${i.status}  ${i.userMessage}`),
);

console.log(`\nMUST READ BEFORE WRITING`);
for (const f of required) {
  const r = RULES.find((x) => x.read.includes(f) && x.when.test(query));
  console.log(`  ${f}${r ? `\n    ${r.why}` : `\n    runs at every work completion`}`);
}

if (hitComponents.length === 0 && hitDomains.length === 0 && hitApi.length === 0) {
  console.log(`\nNothing existing matched. That may mean it is genuinely new — or that the`);
  console.log(`thing you want exists under a different name. Check docs/system/MAP.md before`);
  console.log(
    `creating a new domain; a duplicate domain is far more expensive than a duplicate function.`,
  );
}

console.log('');
if (!wantPrompt) process.exit(0);

// ---- full envelope --------------------------------------------------------
const read = async (p) => (existsSync(join(ROOT, p)) ? readFile(join(ROOT, p), 'utf8') : '');
const parts = ['\n' + '='.repeat(72) + '\nCONTEXT ENVELOPE\n' + '='.repeat(72) + '\n'];

parts.push('## Rules that govern this task (non-negotiable)\n');
for (const f of required) parts.push(`### ${f}\n\n${await read(f)}\n`);

if (hitDomains.length) {
  parts.push('## Context for the domains you will touch\n');
  for (const { i } of hitDomains)
    parts.push(`### ${i.path}/CLAUDE.md\n\n${await read(`${i.path}/CLAUDE.md`)}\n`);
}

if (hitComponents.length) {
  parts.push('## Nearest existing components — MIMIC THESE\n');
  for (const { i } of hitComponents) {
    const dir = join(ROOT, i.path);
    for (const f of (await readdir(dir)).filter(
      (f) => /\.(tsx|types\.ts)$/.test(f) && !f.includes('.stories') && !f.includes('.test'),
    )) {
      parts.push(`#### ${i.path}/${f}\n\n\`\`\`tsx\n${await read(`${i.path}/${f}`)}\n\`\`\`\n`);
    }
  }
}

parts.push(`## System map (what exists)\n\n${await read('docs/system/MAP.md')}\n`);
parts.push(`## Request\n\n${query}\n`);
parts.push(`## Output rules

- Reuse what is listed above before adding anything new; say explicitly what you
  considered and why it was insufficient.
- Follow the rules documents verbatim — they are not suggestions and have lint rules behind them.
- Every public export you add needs TSDoc, or \`pnpm ctx:check\` fails.
- Run \`pnpm verify\` before claiming completion, then fill in the security hygiene checklist.
`);

console.log(parts.join('\n'));
