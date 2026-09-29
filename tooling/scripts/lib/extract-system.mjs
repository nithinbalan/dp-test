/**
 * System-wide context extraction.
 *
 * `extract.mjs` covers components. This covers everything else — which in a real
 * app is most of it: server domains and their public API, routes, error codes,
 * environment variables, path aliases, and the dependency edges between domains.
 *
 * Same contract as the component extractor: the code is the only source of truth,
 * this produces a projection of it, and the projection is gated for drift.
 */
import ts from 'typescript';
import { readdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Layers a server file can belong to — see docs/ARCHITECTURE.md. */
function layerOf(fileName) {
  if (/repository\.ts$/.test(fileName)) return 'repository';
  if (/service\.ts$/.test(fileName)) return 'service';
  if (/(with-workspace|context|client)\.ts$/.test(fileName)) return 'isolation';
  return 'module';
}

function docOf(symbol, checker) {
  return ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
}

function tagsOf(symbol, checker) {
  const out = {};
  for (const t of symbol.getJsDocTags(checker)) {
    const text = ts.displayPartsToString(t.text ?? []).trim();
    out[t.name] = out[t.name] ? [].concat(out[t.name], text) : text;
  }
  return out;
}

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

/**
 * Where domains live. A feature module sits beside its own routes under
 * `src/app/api/<module>/` (ADR-0007); `src/server/` keeps only the cross-cutting
 * infrastructure every module shares — db, workspace, errors.
 */
const DOMAIN_ROOTS = [
  { rel: 'src/server', importPrefix: '@server' },
  { rel: 'src/app/api', importPrefix: '@api' },
];

/** Server domains: every folder under src/server and src/app/api. */
export function extractDomains(root) {
  const roots = DOMAIN_ROOTS.map((r) => ({ ...r, dir: join(root, r.rel) })).filter((r) =>
    existsSync(r.dir),
  );
  if (roots.length === 0) return [];

  const located = roots.flatMap((r) =>
    readdirSync(r.dir)
      .filter((d) => statSync(join(r.dir, d)).isDirectory())
      .map((name) => ({ name, dir: join(r.dir, name), root: r })),
  );

  // One program over every domain file so exports resolve properly.
  const files = located.flatMap((d) =>
    walk(d.dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')),
  );
  const configPath = join(root, 'tsconfig.json');
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);
  const program = ts.createProgram(files, { ...parsed.options, noEmit: true });
  const checker = program.getTypeChecker();

  return located.map(({ name, dir, root: domainRoot }) => {
    const domainFiles = walk(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

    // ---- public API: what index.ts re-exports, else every exported symbol ----
    const api = [];
    // route.ts exports POST/GET — HTTP plumbing, never the module's public API.
    const entry = join(dir, 'index.ts');
    const entryFiles = existsSync(entry)
      ? [entry]
      : domainFiles.filter((f) => !/[\\/]route\.ts$/.test(f));

    for (const file of entryFiles) {
      const src = program.getSourceFile(file);
      if (!src) continue;
      const moduleSymbol = checker.getSymbolAtLocation(src);
      if (!moduleSymbol) continue;

      for (const exported of checker.getExportsOfModule(moduleSymbol)) {
        // A curated barrel (`export { x } from './y'`) yields an alias whose own
        // declaration is the specifier, which carries no TSDoc — follow it to the
        // declaration that does, so a named re-export documents like `export *`.
        const sym =
          exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
        const decl = sym.declarations?.[0];
        if (!decl) continue;
        const declFile = decl.getSourceFile().fileName;
        // only symbols this domain actually owns
        if (!declFile.startsWith(dir)) continue;

        const tags = tagsOf(sym, checker);
        api.push({
          name: exported.getName(),
          kind: ts.SyntaxKind[decl.kind]
            .replace(/Declaration|Statement/g, '')
            .replace('VariableDeclaration', 'const'),
          file: relative(root, declFile),
          layer: layerOf(declFile),
          description: docOf(sym, checker),
          deprecated: tags.deprecated !== undefined,
        });
      }
    }

    // ---- dependency edges to other domains ---------------------------------
    const deps = new Set();
    for (const f of domainFiles) {
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(/from\s+'@(?:server|api)\/([a-z-]+)/g)) {
        if (m[1] !== name) deps.add(m[1]);
      }
    }

    // ---- hand-written context present? -------------------------------------
    const contextFile = join(dir, 'CLAUDE.md');
    let hasContext = false;
    let purpose = '';
    if (existsSync(contextFile)) {
      const md = readFileSync(contextFile, 'utf8');
      hasContext = true;
      const m = md.match(/<!-- \/GENERATED:domain -->\s*([\s\S]*)/);
      const human = (m ? m[1] : md).trim();
      purpose =
        human
          .split('\n')
          .find((l) => l.trim() && !l.startsWith('#'))
          ?.trim() ?? '';
    }

    // README is legacy; treat as a purpose source if no CLAUDE.md yet
    if (!purpose && existsSync(join(dir, 'README.md'))) {
      const md = readFileSync(join(dir, 'README.md'), 'utf8');
      purpose =
        md
          .split('\n')
          .find((l) => l.trim() && !l.startsWith('#'))
          ?.trim() ?? '';
    }

    return {
      name,
      path: `${domainRoot.rel}/${name}`,
      importPath: `${domainRoot.importPrefix}/${name}`,
      purpose,
      hasContext,
      isIsolationLayer: domainRoot.rel === 'src/server' && (name === 'db' || name === 'workspace'),
      dependsOn: [...deps].sort(),
      api: api.sort((a, b) => a.name.localeCompare(b.name)),
      fileCount: domainFiles.length,
    };
  });
}

/** App Router routes. */
export function extractRoutes(root) {
  const appDir = join(root, 'src/app');
  return walk(appDir)
    .filter((f) => /\/(page|route|layout|error|not-found)\.tsx?$/.test(f))
    .map((f) => {
      const rel = relative(join(root, 'src/app'), f);
      const kind = rel.match(/(page|route|layout|error|not-found)\.tsx?$/)[1];
      const urlPath =
        '/' +
        rel
          .replace(/\/(page|route|layout|error|not-found)\.tsx?$/, '')
          .replace(/\([^)]+\)\/?/g, '')
          .replace(/\\/g, '/');
      return {
        kind,
        path: urlPath === '/' || urlPath === '/.' ? '/' : urlPath.replace(/\/$/, ''),
        file: relative(root, f),
        isDynamic: /\[/.test(rel),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Error taxonomy, read from the codes module so it cannot fall out of sync. */
export function extractErrorCodes(root) {
  const file = join(root, 'src/server/errors/codes.ts');
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  const out = [];
  for (const m of text.matchAll(
    /^\s{2}([A-Z_]+):\s*\{\s*status:\s*(\d+),\s*userMessage:\s*'([^']*)'/gm,
  )) {
    out.push({ code: m[1], status: Number(m[2]), userMessage: m[3] });
  }
  return out;
}

/** Environment contract, read from the Zod schema. */
export function extractEnv(root) {
  const file = join(root, 'src/shared/config/env.ts');
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  const out = [];
  // Match to end of line: a rule may contain commas, e.g. z.enum(['a', 'b']).
  for (const m of text.matchAll(/^ {2}([A-Z][A-Z0-9_]*):\s*(z\..*?),?$/gm)) {
    const rule = m[2].replace(/\s+/g, ' ');
    out.push({
      name: m[1],
      rule,
      required: !/\.optional\(\)|\.default\(/.test(rule),
      hasDefault: /\.default\(/.test(rule),
    });
  }
  return out;
}

/**
 * Variables documented in .env.example.
 *
 * env.ts and .env.example are two hand-maintained lists of the same thing, so they
 * are a genuine drift vector — a variable added to one and not the other means either
 * a boot crash nobody predicted, or an undocumented requirement. `ctx:check` compares
 * them; see docs/SECURITY_HYGIENE.md §2.
 */
export function extractEnvExample(root) {
  const file = join(root, '.env.example');
  if (!existsSync(file)) return [];
  return [...readFileSync(file, 'utf8').matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]);
}

/** Path aliases, read from tsconfig. */
export function extractAliases(root) {
  const { config } = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
  const paths = config.compilerOptions?.paths ?? {};
  return Object.entries(paths)
    .map(([alias, targets]) => ({ alias, target: targets[0] }))
    .sort((a, b) => a.alias.localeCompare(b.alias));
}

export function extractSystem(root) {
  return {
    domains: extractDomains(root),
    routes: extractRoutes(root),
    errorCodes: extractErrorCodes(root),
    env: extractEnv(root),
    envExample: extractEnvExample(root),
    aliases: extractAliases(root),
    adrs: extractAdrs(root),
  };
}

/**
 * Architecture decisions, with their `affects:` paths.
 *
 * This is what closes the cross-cutting gap: a decision is not discoverable from the
 * code it constrains unless something links them. Frontmatter here is projected into
 * each affected domain's context file, so editing that code surfaces the decision
 * without anyone remembering it exists.
 */
export function extractAdrs(root) {
  const dir = join(root, 'docs/adr');
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => /^\d{4}-.*\.md$/.test(f) && !f.startsWith('0000'))
    .map((file) => {
      const text = readFileSync(join(dir, file), 'utf8').replace(/\r\n/g, '\n');
      const fm = text.match(/^---\n([\s\S]*?)\n---/);
      const meta = { id: null, title: '', status: 'unknown', date: '', affects: [], tags: [] };
      if (fm) {
        const body = fm[1];
        const scalar = (k) =>
          body
            .match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1]
            .trim()
            .replace(/^['"]|['"]$/g, '') ?? '';
        meta.id = scalar('id');
        meta.title = scalar('title');
        meta.status = scalar('status').split('#')[0].trim();
        meta.date = scalar('date');
        const list = (k) => {
          const block = body.match(new RegExp(`^${k}:\\s*\\n((?:\\s+-\\s+.+\\n?)*)`, 'm'));
          if (block) return [...block[1].matchAll(/-\s+(.+)/g)].map((m) => m[1].trim());
          const inline = body.match(new RegExp(`^${k}:\\s*\\[(.*)\\]`, 'm'));
          return inline
            ? inline[1]
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
        };
        meta.affects = list('affects');
        meta.tags = list('tags');
      }
      // "## Context" paragraph gives retrieval something to match on
      const ctx = text.match(/##\s*Context\s*\n+([\s\S]*?)(?=\n##|$)/);
      meta.context = ctx ? ctx[1].trim().split('\n').slice(0, 3).join(' ').slice(0, 300) : '';
      meta.file = `docs/adr/${file}`;
      meta.hasFrontmatter = Boolean(fm);
      return meta;
    })
    .sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));
}
