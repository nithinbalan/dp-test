#!/usr/bin/env node
/**
 * Generates the system context surface.
 *
 * The problem this solves: as an app grows, the context needed to change one part
 * of it stops fitting in one document, and a central index goes stale the moment
 * someone adds a folder. So context is instead:
 *
 *   COLOCATED  — each domain carries its own CLAUDE.md. Claude Code loads the
 *                CLAUDE.md of the directory being worked in, so context arrives
 *                automatically rather than by someone remembering to attach it.
 *   GENERATED  — the factual half (public API, dependencies, invariants) is a
 *                projection of the code and cannot go stale.
 *   MANDATORY  — `pnpm ctx:check` fails if a unit of the system has no context.
 *                Growth therefore cannot outrun documentation.
 *
 * Each domain CLAUDE.md has two halves:
 *   <!-- GENERATED:domain --> ... <!-- /GENERATED:domain -->   machine-owned, rewritten
 *   everything after it                                        human-owned, never touched
 *
 *   node build-context.mjs           write
 *   node build-context.mjs --check   diff against committed; writes nothing
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import prettier from 'prettier';
import { extractSystem } from './lib/extract-system.mjs';
import { extractComponents } from './lib/extract.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const CHECK = process.argv.includes('--check');

const system = extractSystem(ROOT);
system.contract = JSON.parse(await readFile(join(ROOT, 'design-system/contract.json'), 'utf8'));
const components = extractComponents(ROOT);

const format = async (content, filepath) =>
  prettier.format(content, { ...(await prettier.resolveConfig(filepath)), filepath });

/**
 * ADRs whose `affects:` covers this path. Projected into the path's context file so
 * that editing constrained code surfaces the decision that constrained it — without
 * anyone remembering the ADR exists. This is the cross-cutting link: a decision
 * spanning five domains appears in all five.
 */
function adrsFor(path) {
  return system.adrs.filter((a) =>
    a.affects.some((p) => path === p || path.startsWith(p + '/') || p.startsWith(path + '/')),
  );
}

/** Render the back-link section. `depth` is how far the file sits below the repo root. */
function renderAdrSection(path, depth) {
  const hits = adrsFor(path);
  if (!hits.length) return [];
  const up = '../'.repeat(depth);
  return [
    `## Decisions that constrain this code`,
    ``,
    ...hits.map(
      (a) =>
        `- [${a.id}](${up}${a.file}) — ${a.title} \`${a.status}\`${a.status === 'superseded' ? ' ⚠️' : ''}`,
    ),
    ``,
    `Changing behaviour these decisions assume means superseding the ADR, not working around it.`,
    ``,
  ];
}

const G_START =
  '<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->';
const G_END = '<!-- /GENERATED:domain -->';

// ---------------------------------------------------------------------------
// Per-domain CLAUDE.md — loads automatically when working in that directory
// ---------------------------------------------------------------------------

/** A domain's import alias depends on where it lives — `@server/*` or `@api/*`. */
function importPathOf(name) {
  return system.domains.find((x) => x.name === name)?.importPath ?? `@server/${name}`;
}

function renderDomainBlock(d) {
  // Doc links are relative, and a domain's depth varies: src/server/<name> is three
  // levels down, src/app/api/<name> is four. Compute it rather than hardcoding.
  const depth = d.path.split('/').length;
  const up = '../'.repeat(depth);
  const lines = [
    G_START,
    ``,
    `# \`${d.importPath}\``,
    ``,
    `> Auto-loaded when you work in \`${d.path}\`. The block above the end marker is`,
    `> generated from source; edit the code, not this. Your own notes go below it.`,
    ``,
  ];

  if (d.isIsolationLayer) {
    lines.push(
      `## ⚠ Isolation layer`,
      ``,
      `This domain is part of the workspace isolation boundary. Read`,
      `[docs/WORKSPACE_ISOLATION.md](${up}docs/WORKSPACE_ISOLATION.md) **in full** before`,
      `changing anything here. \`local/require-workspace-scope\` restricts who may import it,`,
      `and changing that rule requires an ADR.`,
      ``,
    );
  }

  lines.push(`## Public API`, ``);
  if (d.api.length === 0) {
    lines.push(`_No exported symbols yet._`, ``);
  } else {
    lines.push(`| Symbol | Kind | Layer | Description |`, `|---|---|---|---|`);
    for (const a of d.api) {
      lines.push(
        `| \`${a.name}\`${a.deprecated ? ' ⚠️' : ''} | ${a.kind} | ${a.layer} | ${a.description.split('\n')[0] || '—'} |`,
      );
    }
    lines.push(
      ``,
      `\`\`\`ts`,
      `import { ${d.api
        .slice(0, 4)
        .map((a) => a.name)
        .join(', ')} } from '${d.importPath}';`,
      `\`\`\``,
      ``,
    );
  }

  lines.push(
    ...renderAdrSection(d.path, depth),
    `## Dependencies`,
    ``,
    d.dependsOn.length
      ? `Imports from: ${d.dependsOn.map((x) => `\`${importPathOf(x)}\``).join(', ')}`
      : `Imports from no other domain.`,
    ``,
    d.path.startsWith('src/app/api')
      ? `Server-only — a Route Handler module is never imported by a component. The browser reaches it over HTTP; see the route table in [system/MAP.md](${up}docs/system/MAP.md).`
      : `Anything under \`src/server/**\` is server-only — never import it from a component.`,
    ``,
    `## Rules that apply here`,
    ``,
    `- Errors: [docs/ERROR_HANDLING.md](${up}docs/ERROR_HANDLING.md) — \`AppError\` + \`Result\`, no local variants`,
    `- Data access: [docs/WORKSPACE_ISOLATION.md](${up}docs/WORKSPACE_ISOLATION.md) — every query inside \`withWorkspace()\``,
    `- On completion: [docs/SECURITY_HYGIENE.md](${up}docs/SECURITY_HYGIENE.md) checklist`,
    `- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](${up}docs/ERROR_FIXING_PROTOCOL.md) — read before editing`,
    ``,
    G_END,
  );
  return lines.join('\n');
}

const HUMAN_STUB = (name) => `

## What this domain is for

<!-- HUMAN-OWNED. Explain the WHY: the business problem, the invariants that are not
     obvious from the types, the decisions someone would otherwise re-litigate.
     Generated facts are above; this is the part only you can write.
     \`pnpm ctx:check\` fails while this still says TODO. -->

TODO: describe \`${name}\` — what problem it solves, and what a newcomer would get wrong.
`;

async function domainOutputs() {
  const outs = [];
  for (const d of system.domains) {
    const path = join(ROOT, d.path, 'CLAUDE.md');
    const block = renderDomainBlock(d);
    let content;

    if (existsSync(path)) {
      const current = await readFile(path, 'utf8');
      if (current.includes(G_END)) {
        // preserve everything the human wrote after the end marker
        content = block + current.slice(current.indexOf(G_END) + G_END.length);
      } else {
        content = block + '\n' + current;
      }
    } else {
      content = block + HUMAN_STUB(d.name);
    }
    outs.push({ path, content });
  }
  return outs;
}

// ---------------------------------------------------------------------------
// Per-tier CLAUDE.md — a compact INDEX, colocated so it auto-loads
//
// Deliberately NOT a catalog. A full prop table per component costs ~1.9KB, which is
// ~29k tokens at 60 atoms — more than anyone should pay to answer "does this exist?".
// And it duplicates `<Name>.types.ts`, which is SMALLER and already readable.
//
// So this file serves DISCOVERY only (name + purpose + tags, ~1 line each) and stays
// small as the library grows. DETAIL comes from reading the component's own source,
// which `pnpm ctx:find --prompt` pulls in for the 1-3 components that matter.
// ---------------------------------------------------------------------------

const T_START =
  '<!-- GENERATED:tier — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->';
const T_END = '<!-- /GENERATED:tier -->';

function renderTierBlock(tier) {
  const list = components.filter((c) => c.tier === tier);
  const rules = system.contract?.tierRules?.[tier] ?? '';

  const lines = [
    T_START,
    ``,
    `# ${tier}`,
    ``,
    `> Auto-loaded when you work in \`src/components/${tier}\`. Generated index — edit the`,
    `> components, not this file. Notes of your own go below the end marker.`,
    ``,
    `${rules}`,
    ``,
    `Dependency direction: \`atoms <- molecules <- organisms <- templates <- pages\``,
    ``,
    ...renderAdrSection(`src/components/${tier}`, 3),
    `## What exists (${list.length})`,
    ``,
  ];

  if (!list.length) {
    lines.push(`_None yet._`, ``);
  } else {
    // group by tag so the index stays navigable as it grows
    const groups = new Map();
    for (const c of list) {
      const key = c.tags[0] ?? 'general';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    }
    const multi = groups.size > 1;
    for (const [group, items] of [...groups].sort()) {
      if (multi) lines.push(`### ${group}`, ``);
      lines.push(`| Component | Does |`, `|---|---|`);
      for (const c of items) {
        // First sentence only: this index exists to answer "does it exist?", and a
        // truncated paragraph reads worse than a short complete one.
        const summary = (c.description.split(/(?<=\.)\s/)[0] ?? c.description).trim();
        lines.push(
          `| [\`${c.name}\`](./${c.name}/${c.name}.tsx)${c.status !== 'stable' ? ` \`${c.status}\`` : ''} | ${summary} |`,
        );
      }
      lines.push(``);
    }
    lines.push(
      `**Props are not listed here on purpose.** Read \`<Name>/<Name>.types.ts\` — it is`,
      `shorter than a generated table and cannot be out of date. \`pnpm ctx:find "<task>"\``,
      `searches every tier at once and pulls the nearest sources for you.`,
      ``,
    );
    const missing = list.filter((c) => !c.hasStory);
    if (missing.length) {
      lines.push(`⚠️ Missing stories: ${missing.map((c) => c.name).join(', ')}`, ``);
    }
  }

  lines.push(T_END);
  return lines.join('\n');
}

const TIER_STUB = (tier) => `

## Notes

<!-- HUMAN-OWNED. Conventions specific to ${tier} that the generated index cannot know:
     patterns to follow, traps people hit, components that look similar but are not. -->
`;

async function tierOutputs() {
  const outs = [];
  for (const tier of ['atoms', 'molecules', 'organisms', 'templates']) {
    const path = join(ROOT, 'src/components', tier, 'CLAUDE.md');
    const block = renderTierBlock(tier);
    let content;
    if (existsSync(path)) {
      const current = await readFile(path, 'utf8');
      content = current.includes(T_END)
        ? block + current.slice(current.indexOf(T_END) + T_END.length)
        : block + '\n' + current;
    } else {
      content = block + TIER_STUB(tier);
    }
    outs.push({ path, content });
  }
  return outs;
}

// ---------------------------------------------------------------------------
// The system map — one file, an index of indexes, kept small on purpose
// ---------------------------------------------------------------------------

function renderSystemMap() {
  const { domains, routes, errorCodes, env, aliases } = system;
  const tiers = ['atoms', 'molecules', 'organisms', 'templates'];

  return [
    `<!-- GENERATED by \`pnpm ctx\`. Do not edit — this is a projection of the code. -->`,
    ``,
    `# System map`,
    ``,
    `Everything that exists, generated from source. Use this to find where something`,
    `lives, then read that thing's own context file — not this whole page.`,
    ``,
    `## Server domains (${domains.length})`,
    ``,
    `| Domain | Purpose | Public API | Depends on | Context |`,
    `|---|---|---|---|---|`,
    ...domains.map(
      (d) =>
        `| [\`${d.importPath}\`](../../${d.path}/CLAUDE.md) | ${d.purpose || '—'} | ${d.api.length} | ${d.dependsOn.join(', ') || '—'} | ${d.hasContext ? 'yes' : '**MISSING**'} |`,
    ),
    ``,
    `Each domain's own \`CLAUDE.md\` loads automatically when you work in its folder.`,
    ``,
    `## Components (${components.length})`,
    ``,
    tiers
      .map(
        (t) =>
          `[${t}](../../src/components/${t}/CLAUDE.md) ${components.filter((c) => c.tier === t).length}`,
      )
      .join(' · '),
    ``,
    `Search across tiers: \`pnpm ctx "<what you want to build>"\``,
    ``,
    `## Decisions (${system.adrs.length})`,
    ``,
    `See [adr/index.md](../adr/index.md). Each is back-linked from the code it constrains.`,
    ``,
    `## Routes (${routes.length})`,
    ``,
    `| Path | Kind | File |`,
    `|---|---|---|`,
    ...routes.map(
      (r) => `| \`${r.path}\`${r.isDynamic ? ' (dynamic)' : ''} | ${r.kind} | \`${r.file}\` |`,
    ),
    ``,
    `## Error codes (${errorCodes.length})`,
    ``,
    `Closed union — adding one is deliberate. See [ERROR_HANDLING.md](../ERROR_HANDLING.md).`,
    ``,
    `| Code | Status | User-facing message |`,
    `|---|---|---|`,
    ...errorCodes.map((e) => `| \`${e.code}\` | ${e.status} | ${e.userMessage} |`),
    ``,
    `## Environment (${env.length})`,
    ``,
    `Validated at boot in \`@shared/config/env\`; a bad value crashes the process.`,
    ``,
    `| Variable | Required | Rule |`,
    `|---|---|---|`,
    ...env.map((e) => `| \`${e.name}\` | ${e.required ? 'yes' : 'no'} | \`${e.rule}\` |`),
    ``,
    `## Path aliases (${aliases.length})`,
    ``,
    `Reaching for shared code should be easier than writing a local copy.`,
    ``,
    aliases.map((a) => `\`${a.alias}\``).join(' · '),
    ``,
  ].join('\n');
}

/**
 * ADR index, with reverse links. Answers both directions: "what decisions exist"
 * and, from each domain's own context file, "what decisions constrain me".
 */
function renderAdrIndex() {
  const { adrs } = system;
  const byPath = new Map();
  for (const a of adrs)
    for (const p of a.affects) {
      if (!byPath.has(p)) byPath.set(p, []);
      byPath.get(p).push(a);
    }

  return [
    `<!-- GENERATED by \`pnpm ctx\`. Do not edit — edit the ADR frontmatter. -->`,
    ``,
    `# Architecture decisions`,
    ``,
    `One file per decision that is expensive to reverse. Immutable once accepted —`,
    `superseded by a new ADR rather than edited, so the reasoning history stays readable.`,
    ``,
    `| ADR | Title | Status | Affects |`,
    `|---|---|---|---|`,
    ...adrs.map(
      (a) =>
        `| [${a.id}](./${a.file.replace('docs/adr/', '')}) | ${a.title} | \`${a.status}\` | ${a.affects.map((p) => `\`${p}\``).join(', ') || '—'} |`,
    ),
    ``,
    `## By area`,
    ``,
    `Each of these paths carries a back-link in its own \`CLAUDE.md\`, so the decision`,
    `surfaces when you edit the code it constrains — you do not have to come here.`,
    ``,
    ...[...byPath]
      .sort()
      .map(
        ([p, list]) =>
          `- \`${p}\` — ${list.map((a) => `[${a.id}](./${a.file.replace('docs/adr/', '')})`).join(', ')}`,
      ),
    ``,
    `## Writing one`,
    ``,
    `Copy \`0000-template.md\`. Fill in the frontmatter — \`affects:\` is what creates the`,
    `back-links, so a decision with no \`affects\` reaches nobody. Write one when a boundary`,
    `changes, a hard-to-remove dependency is added, an invariant is amended, or someone asks`,
    `"why is it like this?" for the second time.`,
    ``,
  ].join('\n');
}

// ---------------------------------------------------------------------------

const outputs = [
  { path: join(ROOT, 'docs/system/MAP.md'), content: renderSystemMap() },
  { path: join(ROOT, 'docs/adr/index.md'), content: renderAdrIndex() },
  ...(await tierOutputs()),
  ...(await domainOutputs()),
];

for (const o of outputs) o.content = await format(o.content, o.path);

if (CHECK) {
  const drifted = [];
  for (const o of outputs) {
    let committed = null;
    try {
      committed = await readFile(o.path, 'utf8');
    } catch {
      drifted.push({
        path: o.path,
        reason: 'missing — no context has ever been generated for this unit',
      });
      continue;
    }
    if (committed !== o.content)
      drifted.push({ path: o.path, reason: 'out of date with the code' });
  }
  if (drifted.length) {
    console.error('\nContext files have drifted from the system:\n');
    for (const d of drifted) console.error(`  ${d.path.replace(ROOT + '/', '')}\n    ${d.reason}`);
    console.error('\nFix: run `pnpm ctx` and commit the result.\n');
    process.exit(1);
  }
  console.log(`ctx --check passed — ${outputs.length} context files current`);
  process.exit(0);
}

await mkdir(join(ROOT, 'docs/system'), { recursive: true });
for (const o of outputs) await writeFile(o.path, o.content);

console.log(
  `context: ${system.domains.length} domains, ${components.length} components, ${system.routes.length} routes, ` +
    `${system.errorCodes.length} error codes, ${system.env.length} env vars -> ${outputs.length} files`,
);
