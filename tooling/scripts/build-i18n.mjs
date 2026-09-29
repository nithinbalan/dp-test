#!/usr/bin/env node
/**
 * Generates locale, direction and message artifacts from `design-system/locales.json`
 * and the catalogues in `public/lang/<locale>/<namespace>.json`.
 *
 *   src/shared/types/locale.ts        Locale/Direction types + the lookup table
 *   src/shared/types/messages.ts      MessageKeys, grouped by namespace
 *   src/shared/types/catalogues.ts    the import map — one import per locale × namespace
 *   design-system/tokens/locale.css   per-language font binding
 *
 * Adding a locale is one edit to locales.json plus a new public/lang/<code>/ folder
 * with every namespace file. Nothing downstream is hand-written, so a new language
 * cannot arrive with a half-updated type union, a missing font, or — the one that
 * actually ships — a half-translated catalogue.
 *
 * TRANSLATION COMPLETENESS IS A BUILD GATE. A missing key is not a warning: it
 * renders English inside an otherwise-German page, which looks like a bug to the
 * user and like nothing at all to the developer who reads English.
 *
 *   node build-i18n.mjs           write
 *   node build-i18n.mjs --check   diff against committed; writes nothing
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import prettier from 'prettier';

const ROOT = resolve(import.meta.dirname, '../..');
const CHECK = process.argv.includes('--check');

const config = JSON.parse(await readFile(join(ROOT, 'design-system/locales.json'), 'utf8'));
const theme = JSON.parse(await readFile(join(ROOT, 'design-system/theme.json'), 'utf8'));
const entries = Object.entries(config.locales);

// --- message catalogues, one file per locale per application area --------------
//
// Layout: public/lang/<locale>/<namespace>.json = { key: value }, no locale wrapper
// — the folder already says which language it is.
//
// LOCALE-FIRST on purpose, unlike theme.json/contract.json/locales.json (which are
// one file with every value keyed inside). Those are small config read once, all
// together, at build time. Message catalogues are different: they live under
// public/ so they are directly fetchable by URL (`/lang/en/auth.json`), and a
// browser asking for one language must never receive the other two bundled
// alongside it. Under src/, everything is compiled into one JS bundle regardless
// of shape; under public/, the file boundary IS the network boundary.
const LANG_DIR = join(ROOT, 'public/lang');
const COMMON_KEY_BUDGET = 40;

if (!existsSync(LANG_DIR)) {
  throw new Error(
    'public/lang does not exist. Expected public/lang/<locale>/<namespace>.json for every locale in locales.json.',
  );
}

const defaultLangDir = join(LANG_DIR, config.defaultLocale);
if (!existsSync(defaultLangDir)) {
  throw new Error(
    `public/lang/${config.defaultLocale} does not exist — the default locale's file set defines which namespaces exist.`,
  );
}

// Namespaces are discovered from the DEFAULT locale's folder; every other locale is
// checked against that set, the same principle as the key-completeness check below.
const namespaces = readdirSync(defaultLangDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

if (namespaces.length === 0) {
  throw new Error(`public/lang/${config.defaultLocale} contains no namespace files.`);
}

/**
 * catalogues[namespace][locale] = { key: value }
 *
 * Parse and existence failures are COLLECTED, not thrown. A thrown error stops at
 * the first bad file and hides everything after it — but whoever runs this wants
 * the whole list, not to fix one file and rerun to discover the next.
 */
const catalogues = {};
const loadProblems = [];

// A folder under public/lang that is not a declared locale is translations being
// maintained for a language the app cannot resolve to — flag it before anything else.
for (const dirent of readdirSync(LANG_DIR, { withFileTypes: true })) {
  if (dirent.isDirectory() && !entries.some(([code]) => code === dirent.name)) {
    loadProblems.push(
      `public/lang/${dirent.name}: not a declared locale — see design-system/locales.json`,
    );
  }
}

for (const [code] of entries) {
  if (!existsSync(join(LANG_DIR, code))) {
    loadProblems.push(
      code === config.defaultLocale
        ? `public/lang/${code}: missing — the default locale must exist, nothing else has a fallback`
        : `public/lang/${code}: missing — every namespace renders in ${config.defaultLocale} for this locale`,
    );
  }
}

for (const ns of namespaces) {
  catalogues[ns] = {};
  for (const [code] of entries) {
    const path = join(LANG_DIR, code, `${ns}.json`);
    if (!existsSync(path)) {
      loadProblems.push(
        code === config.defaultLocale
          ? `public/lang/${code}/${ns}.json: missing the default locale's own namespace file — there is nothing for any other locale to be checked against, and every key check below is meaningless until this exists`
          : `public/lang/${code}/${ns}.json: missing — that namespace renders in ${config.defaultLocale} for ${code} users`,
      );
      catalogues[ns][code] = {};
      continue;
    }
    try {
      catalogues[ns][code] = JSON.parse(readFileSync(path, 'utf8'));
    } catch (e) {
      loadProblems.push(`public/lang/${code}/${ns}.json: invalid JSON — ${e.message}`);
      catalogues[ns][code] = {};
    }
  }
}

// A namespace file that exists for a non-default locale but not for the default one
// is invisible to namespace discovery above (which only scans the default folder) —
// catch it explicitly, or it silently vanishes from every check that follows.
for (const [code] of entries) {
  if (code === config.defaultLocale) continue;
  const localeDir = join(LANG_DIR, code);
  if (!existsSync(localeDir)) continue;
  for (const f of readdirSync(localeDir).filter((f) => f.endsWith('.json'))) {
    const ns = f.replace(/\.json$/, '');
    if (!namespaces.includes(ns)) {
      loadProblems.push(
        `public/lang/${code}/${f}: no matching public/lang/${config.defaultLocale}/${f} — a namespace must exist in the default locale first`,
      );
    }
  }
}

const defaultKeysByNs = Object.fromEntries(
  namespaces.map((ns) => [ns, Object.keys(catalogues[ns][config.defaultLocale]).sort()]),
);
const totalKeys = Object.values(defaultKeysByNs).reduce((n, keys) => n + keys.length, 0);

/** Placeholders a message uses, e.g. {name}. */
const placeholders = (value) => [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/**
 * Completeness + shape checks, per namespace per locale.
 * Reported all at once: a translator wants the whole list, not the first failure.
 */
function checkCatalogues() {
  const problems = [...loadProblems];
  const at = (code, ns) => `public/lang/${code}/${ns}.json`;

  for (const ns of namespaces) {
    if (!/^[a-z][a-z0-9-]*$/.test(ns)) {
      problems.push(
        `${ns}: namespace files are lowercase-kebab, matching the application area they serve`,
      );
    }
    const defaultKeys = defaultKeysByNs[ns];
    if (defaultKeys.length === 0) {
      problems.push(
        `${at(config.defaultLocale, ns)}: empty namespace — delete it, or it becomes a place people add strays`,
      );
    }

    for (const [code] of entries) {
      if (code === config.defaultLocale) continue;
      const keys = Object.keys(catalogues[ns][code]);

      for (const k of defaultKeys.filter((k) => !keys.includes(k))) {
        problems.push(
          `${at(code, ns)}: "${k}" missing — renders in ${config.defaultLocale} for ${code} users`,
        );
      }
      for (const k of keys.filter((k) => !defaultKeys.includes(k))) {
        problems.push(
          `${at(code, ns)}: "${k}" is not in ${at(config.defaultLocale, ns)} — a stale key no code reads`,
        );
      }
      for (const k of defaultKeys) {
        if (!keys.includes(k)) continue;
        const want = placeholders(catalogues[ns][config.defaultLocale][k]);
        const got = placeholders(catalogues[ns][code][k]);
        if (want.join(',') !== got.join(',')) {
          problems.push(
            `${at(code, ns)}: "${k}" has placeholders {${got.join('}, {')}} but the default has {${want.join('}, {')}} — the value would be dropped or render literally`,
          );
        }
      }
      for (const k of keys) {
        const v = catalogues[ns][code][k];
        if (typeof v !== 'string' || v.trim() === '')
          problems.push(`${at(code, ns)}: "${k}" is empty`);
      }
    }
  }

  // `common` is the one namespace with no natural owner, so it is where strings get
  // dumped when nobody wants to decide. Cap it before it becomes the whole catalogue.
  const commonSize = defaultKeysByNs['common']?.length ?? 0;
  if (commonSize > COMMON_KEY_BUDGET) {
    problems.push(
      `common: ${commonSize} keys exceeds the ${COMMON_KEY_BUDGET}-key budget. "common" is for app-wide chrome ` +
        `only. Anything used by one feature belongs in that feature's namespace.`,
    );
  }

  return problems;
}

const format = async (content, filepath) =>
  prettier.format(content, { ...(await prettier.resolveConfig(filepath)), filepath });

function renderTypes() {
  return [
    '/* GENERATED from design-system/locales.json by `pnpm ds:i18n`. Do not edit. */',
    '',
    '/**',
    ' * Supported locales and their writing direction.',
    ' *',
    ' * Direction is data, never a hardcoded assumption. Any code that branches on',
    " * `dir === 'rtl'` should first ask whether a CSS logical property would do the",
    ' * job instead — it almost always will, and it works without a runtime check.',
    ' */',
    '',
    "export type Direction = 'ltr' | 'rtl';",
    '',
    'export type Locale =',
    entries.map(([code]) => `  | '${code}'`).join('\n') + ';',
    '',
    `export const DEFAULT_LOCALE: Locale = '${config.defaultLocale}';`,
    '',
    'export type LocaleMeta = {',
    '  readonly name: string;',
    '  readonly nativeName: string;',
    '  readonly dir: Direction;',
    '  readonly fontFamily: string;',
    '  readonly numberingSystem: string;',
    '};',
    '',
    'export const LOCALES: Readonly<Record<Locale, LocaleMeta>> = {',
    ...entries.map(
      ([code, m]) =>
        `  ${code}: { name: '${m.name}', nativeName: '${m.nativeName}', dir: '${m.dir}', fontFamily: '${m.fontFamily}', numberingSystem: '${m.numberingSystem}' },`,
    ),
    '} as const;',
    '',
    'export const LOCALE_CODES = Object.keys(LOCALES) as readonly Locale[];',
    '',
    "/** How a request's locale is resolved. Mirrors WORKSPACE_RESOLUTION_STRATEGY. */",
    "export type LocaleResolutionStrategy = 'path' | 'cookie' | 'header';",
    '',
    'export type LocaleResolutionConfig = {',
    '  readonly strategy: LocaleResolutionStrategy;',
    '  readonly cookieName: string;',
    '  /** Request header middleware forwards the resolved locale on, for this same',
    "   * request's Server Components — reading it needs no round trip for the",
    '   * Set-Cookie below to reach the browser first. */',
    '  readonly headerName: string;',
    '  readonly prefixDefaultLocale: boolean;',
    '};',
    '',
    '/**',
    ' * Annotated with the widened type ON PURPOSE. Emitting `as const` would give',
    ' * `strategy` the literal type of whatever is configured today, making every',
    ' * other branch provably dead code — which defeats the point of the setting',
    ' * being configurable, and means switching it would not typecheck.',
    ' */',
    `export const LOCALE_RESOLUTION: LocaleResolutionConfig = {`,
    `  strategy: '${config.resolution.strategy}',`,
    `  cookieName: '${config.resolution.cookieName}',`,
    `  headerName: '${config.resolution.headerName}',`,
    `  prefixDefaultLocale: ${String(config.resolution.prefixDefaultLocale)},`,
    '};',
    '',
    '/** Narrow an untrusted string (URL segment, header) to a supported locale. */',
    'export function isLocale(value: unknown): value is Locale {',
    "  return typeof value === 'string' && value in LOCALES;",
    '}',
    '',
    '/** Writing direction for a locale. Falls back to the default rather than throwing. */',
    'export function directionOf(locale: string): Direction {',
    '  return isLocale(locale) ? LOCALES[locale].dir : LOCALES[DEFAULT_LOCALE].dir;',
    '}',
  ].join('\n');
}

function renderCss() {
  const lines = [
    '/* GENERATED from design-system/locales.json by `pnpm ds:i18n`. Do not edit. */',
    '/* Per-language typography. Bound by :lang() so it follows the `lang` attribute,',
    '   which is also what screen readers and hyphenation use. */',
    '',
    ':root {',
    `  --s-font-family: var(--p-font-family-${config.locales[config.defaultLocale].fontFamily});`,
    '}',
    '',
  ];
  for (const [code, meta] of entries) {
    if (code === config.defaultLocale) continue;
    lines.push(
      `:root:lang(${code}) {`,
      `  --s-font-family: var(--p-font-family-${meta.fontFamily});`,
      '}',
      '',
    );
  }
  const missing = entries.map(([, m]) => m.fontFamily).filter((f) => !theme.fontFamily?.[f]);
  if (missing.length) {
    throw new Error(
      `locales.json references font families not defined in theme.json: ${[...new Set(missing)].join(', ')}`,
    );
  }
  return lines.join('\n');
}

function renderMessageTypes() {
  const lines = [
    '/* GENERATED from public/lang/<locale>/<namespace>.json by `pnpm ds:i18n`. Do not edit. */',
    '',
    '/**',
    ' * Message keys, grouped by namespace.',
    ' *',
    " * A translator is scoped to ONE namespace, so `t` only accepts that namespace's",
    ' * keys — reaching into another area fails to compile rather than rendering a raw',
    ' * key, and a page bundles only the strings it uses.',
    ' */',
    '',
    'export type MessageNamespace =',
    namespaces.map((ns) => `  | '${ns}'`).join('\n') + ';',
    '',
    'export type MessageKeys = {',
    ...namespaces.flatMap((ns) =>
      defaultKeysByNs[ns].length === 0
        ? // An empty namespace is itself a reported problem; emit valid TS anyway so
          // the diagnostic is what the developer sees, not a parser stack trace.
          [`  '${ns}': never;`]
        : // Quoted, not a bare identifier: namespace names are lowercase-kebab
          // (see checkNamespaceNaming below), and `foo-bar:` is not a valid
          // unquoted property key — every consumer already reads this via
          // `MessageKeys[N]`/bracket access, never dot notation, so quoting
          // changes nothing downstream.
          [`  '${ns}':`, defaultKeysByNs[ns].map((k) => `    | '${k}'`).join('\n') + ';'],
    ),
    '};',
    '',
    '/** A complete catalogue for one namespace. Enforced by `pnpm ds:i18n --check`. */',
    'export type NamespaceMessages<N extends MessageNamespace> = Readonly<',
    '  Record<MessageKeys[N], string>',
    '>;',
    '',
  ];

  const withVars = namespaces.flatMap((ns) =>
    defaultKeysByNs[ns]
      .filter((k) => placeholders(catalogues[ns][config.defaultLocale][k]).length > 0)
      .map((k) => `${ns}.${k}`),
  );
  lines.push(
    '/** Keys that take interpolation values, as `namespace.key`. */',
    'export type ParameterisedKey =',
    (withVars.length ? withVars.map((k) => `  | '${k}'`).join('\n') : '  | never') + ';',
    '',
    `export const MESSAGE_KEY_COUNT = ${totalKeys};`,
    `export const MESSAGE_NAMESPACES = [${namespaces.map((n) => `'${n}'`).join(', ')}] as const;`,
  );
  return lines.join('\n');
}

/**
 * The import map. Generated so adding a namespace or a locale needs no hand-edit —
 * previously that was a manual step, which is exactly the kind of thing that gets
 * skipped and then fails at runtime for one language.
 */
function renderCatalogueMap() {
  const ident = (ns, code) => `${ns.replace(/-/g, '_')}_${code}`;

  return [
    '/* GENERATED from public/lang/<locale>/<namespace>.json by `pnpm ds:i18n`. Do not edit. */',
    '',
    '/**',
    ' * Statically imported so every catalogue is type-checked at build time and',
    ' * bundled deterministically. A dynamic `import(`/lang/${locale}/${ns}.json`)`',
    ' * would defer a missing-catalogue failure to runtime, in production, for one',
    ' * language.',
    ' *',
    ' * These same files also live under public/, so each one is INDEPENDENTLY',
    ' * fetchable at that exact URL (e.g. `/lang/en/auth.json`) — Next.js serves',
    ' * everything under public/ verbatim. Importing them here does not change that;',
    ' * it only means the app itself never pays a network round trip to read its own',
    ' * default-locale strings.',
    ' *',
    ' * No type assertion on the imports below: `pnpm ds:i18n --check` proves each',
    ' * file has exactly the message keys in MessageKeys before this file is ever',
    " * regenerated, so the JSON's inferred shape already satisfies NamespaceMessages.",
    ' */',
    "import type { Locale } from './locale';",
    "import type { MessageNamespace, NamespaceMessages } from './messages';",
    '',
    ...namespaces.flatMap((ns) =>
      entries.map(([code]) => `import ${ident(ns, code)} from '@public/lang/${code}/${ns}.json';`),
    ),
    '',
    'export const CATALOGUES: {',
    '  readonly [N in MessageNamespace]: Readonly<Record<Locale, NamespaceMessages<N>>>;',
    '} = {',
    ...namespaces.flatMap((ns) => [
      `  '${ns}': {`,
      ...entries.map(([code]) => `    ${code}: ${ident(ns, code)},`),
      '  },',
    ]),
    '};',
  ].join('\n');
}

const catalogueProblems = checkCatalogues();

// Report catalogue problems FIRST. Generating from a broken catalogue produces
// invalid TS (e.g. an empty union), and a formatter parse error on that output
// would hide the real cause behind a stack trace.
if (catalogueProblems.length && CHECK) {
  console.error('\nIncomplete translations:\n');
  catalogueProblems.forEach((p) => console.error(`  ${p}`));
  console.error(
    '\nA missing key renders the default language inside a translated page — invisible' +
      '\nto anyone who reads the default language. Fix the catalogues in public/lang/.\n',
  );
  process.exit(1);
}

const outputs = [
  { path: join(ROOT, 'src/shared/types/locale.ts'), content: renderTypes() },
  { path: join(ROOT, 'src/shared/types/messages.ts'), content: renderMessageTypes() },
  { path: join(ROOT, 'src/shared/types/catalogues.ts'), content: renderCatalogueMap() },
  { path: join(ROOT, 'design-system/tokens/locale.css'), content: renderCss() },
];
for (const o of outputs) o.content = await format(o.content, o.path);

if (CHECK) {
  const drifted = [];
  for (const o of outputs) {
    let committed = null;
    try {
      committed = await readFile(o.path, 'utf8');
    } catch {
      drifted.push(`${o.path.replace(ROOT + '/', '')}: missing`);
      continue;
    }
    if (committed !== o.content)
      drifted.push(`${o.path.replace(ROOT + '/', '')}: out of date with locales.json`);
  }
  if (drifted.length) {
    console.error('\nLocale files have drifted:\n');
    drifted.forEach((d) => console.error(`  ${d}`));
    console.error('\nFix: run `pnpm ds:i18n` and commit the result.\n');
    process.exit(1);
  }
  const rtl = entries.filter(([, m]) => m.dir === 'rtl').length;
  console.log(
    `ds:i18n --check passed — ${entries.length} locales (${rtl} RTL), ` +
      `${namespaces.length} namespaces, ${totalKeys} keys translated in all, ` +
      `${outputs.length} files current`,
  );
  process.exit(0);
}

for (const o of outputs) await writeFile(o.path, o.content);
console.log(
  `i18n: ${entries.length} locales (${entries.map(([c, m]) => `${c}/${m.dir}`).join(', ')}), ` +
    `${namespaces.length} namespaces [${namespaces.join(', ')}], ${totalKeys} keys -> ${outputs.length} files`,
);
if (catalogueProblems.length) {
  console.warn(
    `\n  ${catalogueProblems.length} translation problem(s) — \`pnpm ds:i18n --check\` will block:`,
  );
  catalogueProblems.forEach((p) => console.warn(`    ${p}`));
}
