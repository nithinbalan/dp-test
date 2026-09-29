#!/usr/bin/env node
/**
 * Generates every design token from `design-system/theme.json`.
 *
 * ONE hand-maintained file drives all of these:
 *   design-system/tokens/primitive.css        colour ramps, scales
 *   design-system/tokens/semantic.css         role tokens, light + dark
 *   design-system/tokens/tailwind-theme.css   the @theme inline mapping
 *   src/shared/types/tokens.ts                typed token names for TS
 *
 * Rebranding is therefore one number: change `palettes.brand.hue` and run `pnpm ds:tokens`.
 * Before this, the same change meant editing three files by hand and hoping the dark
 * theme was updated too — it wasn't; 16 of 29 roles kept their light value.
 *
 *   node build-tokens.mjs           write
 *   node build-tokens.mjs --check   verify committed output + WCAG contrast; writes nothing
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import prettier from 'prettier';
import { buildRamp, toCss, contrastRatio, fromHex, RAMP_STEPS } from './lib/color.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const CHECK = process.argv.includes('--check');
const theme = JSON.parse(await readFile(join(ROOT, 'design-system/theme.json'), 'utf8'));

const format = async (content, filepath) =>
  prettier.format(content, { ...(await prettier.resolveConfig(filepath)), filepath });

// --- ramps -------------------------------------------------------------------
const ramps = Object.fromEntries(
  Object.entries(theme.palettes).map(([name, seed]) => [name, buildRamp(seed)]),
);

/**
 * Resolve a semantic reference to its colour object. Usually a ramp step like
 * "brand-600"; a literal "#rrggbb" pins the role to an exact colour instead —
 * for a role like `bg-canvas` or `bg-inverse` where the product's fixed brand
 * background must render as that exact hex, not the nearest ramp step (a
 * single-hue ramp can't hit both a warm-cream light end and a forest-green
 * dark end at once). Used sparingly: most roles stay ramp-derived so a hue
 * rebrand (`palettes.*.hue`) still reaches them.
 */
function resolveRef(ref) {
  if (ref.startsWith('#')) return fromHex(ref);
  const i = ref.lastIndexOf('-');
  const palette = ref.slice(0, i);
  const step = Number(ref.slice(i + 1));
  const ramp = ramps[palette];
  if (!ramp) throw new Error(`theme.json: unknown palette "${palette}" in "${ref}"`);
  if (!ramp[step])
    throw new Error(
      `theme.json: unknown step ${step} in "${ref}" (valid: ${RAMP_STEPS.join(', ')})`,
    );
  return ramp[step];
}

/**
 * NAMING LAYERS — the prefixes exist to make collisions impossible.
 *
 *   --p-*   primitive   raw ramps and scales. Never referenced by a component.
 *   --s-*   semantic    role tokens. These are what the themes swap.
 *   (none)  Tailwind    the theme namespace: --color-*, --radius-*, --ease-* ...
 *
 * Without distinct layers, `@theme inline { --color-x: var(--color-x) }` emits a
 * SELF-REFERENCE that only resolves by source-order luck and silently breaks the
 * token when order changes. Components never see these prefixes — they use utilities.
 */
const GEN = (what) =>
  `/* GENERATED from design-system/theme.json by \`pnpm ds:tokens\`. Do not edit — edit theme.json. */\n/* ${what} */\n`;

// --- primitive.css -----------------------------------------------------------
function renderPrimitive() {
  const lines = [
    GEN('Raw ramps. Never reference these from a component — use semantic.css.'),
    ':root {',
  ];
  for (const [name, ramp] of Object.entries(ramps)) {
    const seed = theme.palettes[name];
    lines.push(
      `  /* ${name}${seed.description ? ` — ${seed.description}` : ''} (hue ${seed.hue}) */`,
    );
    for (const step of RAMP_STEPS) lines.push(`  --p-${name}-${step}: ${toCss(ramp[step])};`);
    lines.push('');
  }
  const scale = (prefix, obj) => {
    lines.push(`  /* ${prefix} */`);
    for (const [k, v] of Object.entries(obj)) lines.push(`  --p-${prefix}-${k}: ${v};`);
    lines.push('');
  };
  scale('radius', theme.radius);
  scale('space', theme.space);
  scale('font-family', theme.fontFamily);
  scale('font-size', theme.fontSize);
  scale('font-weight', theme.fontWeight);
  scale('line-height', theme.lineHeight);
  scale('shadow', theme.shadow);
  scale('duration', theme.motion.duration);
  scale('ease', theme.motion.ease);
  lines.push('}');
  return lines.join('\n');
}

// --- semantic.css ------------------------------------------------------------
const roleVars = (mode) =>
  Object.entries(theme.semantic[mode]).map(([role, ref]) =>
    ref.startsWith('#')
      ? `  --s-${role}: ${toCss(fromHex(ref))}; /* literal ${ref}, not a ramp step */`
      : `  --s-${role}: var(--p-${ref});`,
  );

function renderSemantic() {
  const roleRadius = Object.entries(theme.radiusRoles).map(
    ([role, ref]) => `  --s-radius-${role}: var(--p-radius-${ref});`,
  );

  return [
    GEN('Role tokens — the ONLY tokens a component may use. Named for role, not appearance.'),
    '',
    '/* Light is the base. Both themes define every role, so nothing can silently',
    '   keep a light value in dark mode. */',
    ':root {',
    ...roleVars('light'),
    '',
    ...roleRadius,
    '  --s-focus-ring-width: 2px;',
    '  --s-focus-ring-offset: 2px;',
    '}',
    '',
    '/* System preference, unless the user explicitly chose light. */',
    '@media (prefers-color-scheme: dark) {',
    "  :root:not([data-theme='light']) {",
    ...roleVars('dark').map((l) => '  ' + l),
    '  }',
    '}',
    '',
    '/* Explicit choice wins in both directions. Without this selector a user on a',
    '   light-preferring OS cannot switch to dark at all. */',
    ":root[data-theme='dark'] {",
    ...roleVars('dark'),
    '}',
    '',
    ":root[data-theme='light'] {",
    ...roleVars('light'),
    '}',
    '',
    '/* Let form controls, scrollbars and native UI follow the theme. */',
    ':root { color-scheme: light; }',
    "@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { color-scheme: dark; } }",
    ":root[data-theme='dark'] { color-scheme: dark; }",
    ":root[data-theme='light'] { color-scheme: light; }",
  ].join('\n');
}

// --- tailwind-theme.css ------------------------------------------------------
function renderTailwind() {
  const roles = Object.keys(theme.semantic.light);
  const lines = [
    GEN('Tailwind v4 theme, mapped onto SEMANTIC tokens only.'),
    '',
    '/* This mapping is what makes `bg-brand-solid` legal and `bg-[#3b82f6]`',
    '   unnecessary — and therefore what makes the token lint rules enforceable',
    '   rather than merely annoying. */',
    '@theme inline {',
    ...roles.map((r) => `  --color-${r}: var(--s-${r});`),
    '',
    ...Object.keys(theme.radiusRoles).map((r) => `  --radius-${r}: var(--s-radius-${r});`),
    ...Object.keys(theme.radius).map((r) => `  --radius-${r}: var(--p-radius-${r});`),
    '',
    '  /* Tailwind derives every p-N/m-N/gap-N from this base, and 0.25rem is exactly',
    '     the step our space scale uses — so the two cannot diverge. */',
    '  --spacing: 0.25rem;',
    '',
    '  /* Bound to --s-font-family, which locale.css swaps per :lang(). */',
    '  --font-sans: var(--s-font-family);',
    ...Object.keys(theme.fontFamily).map((f) => `  --font-${f}: var(--p-font-family-${f});`),
    '',
    ...Object.keys(theme.fontSize).map((s) => `  --text-${s}: var(--p-font-size-${s});`),
    ...Object.keys(theme.fontWeight).map((s) => `  --font-weight-${s}: var(--p-font-weight-${s});`),
    ...Object.keys(theme.shadow).map((s) => `  --shadow-${s}: var(--p-shadow-${s});`),
    '',
    // `--ease-*` IS a Tailwind v4 theme namespace, so these become ease-* utilities.
    ...Object.keys(theme.motion.ease).map((e) => `  --ease-${e}: var(--p-ease-${e});`),
    '}',
    '',
    '/* Tailwind v4 has no `duration` theme namespace — `duration-fast` would silently',
    '   generate nothing. Custom utilities give us named, token-backed durations without',
    '   resorting to arbitrary values, which the token lint rules ban. */',
    ...Object.keys(theme.motion.duration).flatMap((d) => [
      `@utility duration-${d} {`,
      `  transition-duration: var(--p-duration-${d});`,
      '}',
    ]),
  ];
  return lines.join('\n');
}

// --- tokens.ts ---------------------------------------------------------------
function renderTokensTs() {
  const u = (arr) => arr.map((v) => `  | '${v}'`).join('\n');
  return [
    '/* GENERATED from design-system/theme.json by `pnpm ds:tokens`. Do not edit. */',
    '',
    '/**',
    ' * Token names as types. Lets a component accept a token reference without',
    ' * accepting an arbitrary string, so a typo fails to compile instead of silently',
    ' * resolving to nothing at runtime.',
    ' */',
    '',
    'export type ColorRole =',
    u(Object.keys(theme.semantic.light)) + ';',
    '',
    'export type RadiusToken =',
    u([...Object.keys(theme.radiusRoles), ...Object.keys(theme.radius)]) + ';',
    '',
    'export type SpaceToken =',
    u(Object.keys(theme.space)) + ';',
    '',
    'export type FontSizeToken =',
    u(Object.keys(theme.fontSize)) + ';',
    '',
    '/** The two explicit themes, plus following the OS. */',
    "export const THEMES = ['light', 'dark', 'system'] as const;",
    'export type Theme = (typeof THEMES)[number];',
    '',
    '/**',
    ' * Browser chrome colour per theme (the `theme-color` meta tag).',
    ' * Generated so the address bar cannot drift from the canvas it sits above —',
    ' * and so no component file needs a literal colour, which lint forbids.',
    ' */',
    'export const THEME_COLOR = {',
    `  light: '${toCss(resolveRef(theme.semantic.light['bg-canvas']))}',`,
    `  dark: '${toCss(resolveRef(theme.semantic.dark['bg-canvas']))}',`,
    '} as const;',
    '',
    '/** Palette names, for tooling and documentation. */',
    'export const PALETTES = [',
    Object.keys(theme.palettes)
      .map((p) => `  '${p}',`)
      .join('\n'),
    '] as const;',
  ].join('\n');
}

// --- contrast ----------------------------------------------------------------
function checkContrast() {
  const { minimums, pairs } = theme.contrast;
  const failures = [];
  const report = [];

  for (const mode of ['light', 'dark']) {
    for (const [fgRole, bgRole, kind] of pairs) {
      const fgRef = theme.semantic[mode][fgRole];
      const bgRef = theme.semantic[mode][bgRole];
      if (!fgRef || !bgRef) {
        failures.push(
          `${mode}: contrast pair references unknown role "${!fgRef ? fgRole : bgRole}"`,
        );
        continue;
      }
      const ratio = contrastRatio(resolveRef(fgRef), resolveRef(bgRef));
      const min = minimums[kind];
      report.push({ mode, fgRole, bgRole, kind, ratio, min, pass: ratio >= min });
      if (ratio < min) {
        failures.push(
          `${mode}: ${fgRole} on ${bgRole} is ${ratio.toFixed(2)}:1, needs ${min}:1 (${kind}). ` +
            `Currently ${fgRef} on ${bgRef}. Adjust the mapping in theme.json — pick a lighter/darker step.`,
        );
      }
    }
  }
  return { failures, report };
}

// --- outputs -----------------------------------------------------------------
const outputs = [
  { path: join(ROOT, 'design-system/tokens/primitive.css'), content: renderPrimitive() },
  { path: join(ROOT, 'design-system/tokens/semantic.css'), content: renderSemantic() },
  { path: join(ROOT, 'design-system/tokens/tailwind-theme.css'), content: renderTailwind() },
  { path: join(ROOT, 'src/shared/types/tokens.ts'), content: renderTokensTs() },
];
for (const o of outputs) o.content = await format(o.content, o.path);

const { failures, report } = checkContrast();

if (CHECK) {
  const problems = [];
  for (const o of outputs) {
    let committed = null;
    try {
      committed = await readFile(o.path, 'utf8');
    } catch {
      problems.push(`${o.path.replace(ROOT + '/', '')}: missing — run \`pnpm ds:tokens\``);
      continue;
    }
    if (committed !== o.content) {
      problems.push(`${o.path.replace(ROOT + '/', '')}: out of date with theme.json`);
    }
  }
  if (problems.length) {
    console.error('\nToken files have drifted from theme.json:\n');
    problems.forEach((p) => console.error(`  ${p}`));
    console.error('\nFix: run `pnpm ds:tokens` and commit the result.\n');
    process.exit(1);
  }
  if (failures.length) {
    console.error('\nWCAG contrast failures:\n');
    failures.forEach((f) => console.error(`  ${f}`));
    console.error('\nThese pairs are declared in theme.json `contrast.pairs`. A theme change');
    console.error('that breaks legibility fails here rather than shipping.\n');
    process.exit(1);
  }
  const worst = report.reduce((a, b) => (a.ratio < b.ratio ? a : b));
  console.log(
    `ds:tokens --check passed — ${outputs.length} files current, ` +
      `${report.length} contrast pairs pass (tightest: ${worst.fgRole} on ${worst.bgRole} ` +
      `${worst.ratio.toFixed(2)}:1 in ${worst.mode})`,
  );
  process.exit(0);
}

for (const o of outputs) await writeFile(o.path, o.content);

const clamped = Object.values(ramps).flatMap((r) => RAMP_STEPS.filter((s) => r[s].clamped)).length;
console.log(
  `tokens: ${Object.keys(ramps).length} palettes x ${RAMP_STEPS.length} steps, ` +
    `${Object.keys(theme.semantic.light).length} roles x 2 themes -> ${outputs.length} files` +
    (clamped ? ` (${clamped} steps chroma-fitted to sRGB)` : ''),
);
if (failures.length) {
  console.warn(
    `\n  ${failures.length} contrast failure(s) — \`pnpm ds:tokens --check\` will block:`,
  );
  failures.forEach((f) => console.warn(`    ${f}`));
}
