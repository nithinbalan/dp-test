#!/usr/bin/env node
/**
 * "Does this already exist?" — Layer 1 of docs/AI_GENERATION_PROTOCOL.md.
 *
 * Run BEFORE creating any component:
 *     pnpm ds:neighbors "a button that shows a spinner while submitting"
 *
 * Scores the manifest against the request and prints the closest existing
 * components, then assembles the standard prompt envelope (§1.4) with their
 * actual source as few-shot examples. Concrete examples do more for consistency
 * than any amount of style-guide prose — models mimic code far more reliably
 * than they follow rules.
 *
 * Flags:
 *   --tier <tier>   prefer neighbours from this tier
 *   --top <n>       how many neighbours (default 3)
 *   --prompt        emit the full prompt envelope, not just the match list
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2);
const query = args.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a)).join(' ');
const tierFlag = args.includes('--tier') ? args[args.indexOf('--tier') + 1] : null;
const top = args.includes('--top') ? Number(args[args.indexOf('--top') + 1]) : 3;
const wantPrompt = args.includes('--prompt');

if (!query) {
  console.error(
    'usage: pnpm ds:neighbors "<what you want to build>" [--tier atoms] [--top 3] [--prompt]',
  );
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
  'component',
]);
const tokenize = (s) =>
  s
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));

const manifest = JSON.parse(await readFile(join(ROOT, 'design-system/manifest.json'), 'utf8'));
const qTokens = tokenize(query);

function score(c) {
  const hay = [
    c.name,
    c.description,
    ...(c.tags ?? []),
    ...c.props.map((p) => `${p.name} ${p.type}`),
  ].join(' ');
  const cTokens = new Set(tokenize(hay));
  let s = 0;
  for (const t of qTokens) {
    if (cTokens.has(t)) s += 3;
    else if ([...cTokens].some((ct) => ct.startsWith(t) || t.startsWith(ct))) s += 1;
  }
  if (tokenize(c.name).some((t) => qTokens.includes(t))) s += 5;
  if (tierFlag && c.tier === tierFlag) s += 2;
  return s;
}

const ranked = manifest.components
  .map((c) => ({ ...c, _score: score(c) }))
  .filter((c) => c._score > 0)
  .sort((a, b) => b._score - a._score)
  .slice(0, top);

if (ranked.length === 0) {
  console.log(`\nNo existing component matches "${query}".`);
  console.log(
    'Before creating one, confirm against the escalation order (AI_GENERATION_PROTOCOL §1.2):',
  );
  console.log(
    '  use as-is -> add a variant value -> extend props -> compose a molecule -> create new\n',
  );
} else {
  console.log(`\nClosest existing components for "${query}":\n`);
  for (const c of ranked) {
    console.log(`  ${c.name.padEnd(20)} ${c.tier.padEnd(11)} score ${c._score}`);
    console.log(`    ${c.description}`);
    console.log(`    import { ${c.name} } from '${c.importPath}';`);
    console.log(`    props: ${c.props.map((p) => p.name).join(', ') || '(none)'}\n`);
  }
  console.log('Extend one of these before creating something new. If you create new, the PR');
  console.log('must state why each of the above was insufficient.\n');
}

if (!wantPrompt) process.exit(0);

// ---- prompt envelope (AI_GENERATION_PROTOCOL §1.4) --------------------------
const readSafe = async (p) => {
  try {
    return await readFile(p, 'utf8');
  } catch {
    return '';
  }
};

const parts = [];
parts.push('## 1. Component manifest (the registry — check here before creating anything)\n');
parts.push(
  '```json\n' +
    JSON.stringify({ contract: manifest.contract, components: manifest.components }, null, 2) +
    '\n```\n',
);
parts.push('## 2. API contract (closed prop vocabulary — do not invent names)\n');
parts.push(await readSafe(join(ROOT, 'docs/COMPONENT_CONTRACT.md')));
parts.push('\n## 3. Nearest existing components — MIMIC THESE\n');
for (const c of ranked) {
  const dir = join(ROOT, c.path);
  let files = [];
  try {
    files = await readdir(dir);
  } catch {
    continue;
  }
  for (const f of files.filter((f) => f.endsWith('.tsx') || f.endsWith('.types.ts'))) {
    parts.push(`\n### ${c.path}/${f}\n\n\`\`\`tsx\n${await readSafe(join(dir, f))}\n\`\`\`\n`);
  }
}
parts.push('\n## 4. Legal design values (semantic tokens — nothing else is permitted)\n');
parts.push(
  '```css\n' + (await readSafe(join(ROOT, 'design-system/tokens/semantic.css'))) + '\n```\n',
);
parts.push(`\n## 5. Request\n\n${query}\n`);
parts.push(`
## 6. Output rules

- Emit the complete folder: Component.tsx, Component.types.ts, Component.stories.tsx,
  Component.test.tsx, index.ts.
- Use ONLY prop names from the contract in §2. Inventing a synonym fails ds:check.
- Use ONLY semantic tokens from §4. No hex, no rgb(), no Tailwind arbitrary values, no raw px.
- Respect tier boundaries; add an "@tier <tier>" header comment.
- Add no new dependencies.
- Before the code, state which components from §3 you considered and why each was
  insufficient. If one of them can be extended instead, say so and stop.
`);

console.log('\n' + '='.repeat(78) + '\nPROMPT ENVELOPE\n' + '='.repeat(78) + '\n');
console.log(parts.join('\n'));
