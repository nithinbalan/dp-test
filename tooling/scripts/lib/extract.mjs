/**
 * Component extraction via the TypeScript compiler API.
 *
 * Uses real type resolution, not regex: intersections, `Omit<>`, generics and
 * imported prop types all resolve correctly. `typescript` is already a
 * dependency, so this costs no new package (vs ts-morph / react-docgen-typescript,
 * which wrap the same API).
 *
 * KEY DESIGN DECISION — own-file filtering.
 * `ButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'className'> & {...}`
 * resolves to ~250 properties, almost all inherited DOM attributes. We keep only
 * properties whose DECLARATION lives in the component's own directory. That is
 * what makes the manifest a description of our API surface rather than a dump of
 * the DOM typings.
 */
import ts from 'typescript';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const TIERS = ['atoms', 'molecules', 'organisms', 'templates'];

/** Build a Program from the repo tsconfig so path aliases resolve. */
export function createProgram(root) {
  const configPath = join(root, 'tsconfig.json');
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);

  const files = [];
  for (const tier of TIERS) {
    const dir = join(root, 'src/components', tier);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      const base = join(dir, entry);
      if (!statSync(base).isDirectory()) continue;
      for (const f of [`${entry}.types.ts`, `${entry}.tsx`]) {
        if (existsSync(join(base, f))) files.push(join(base, f));
      }
    }
  }
  return {
    program: ts.createProgram(files, { ...parsed.options, noEmit: true }),
    files,
  };
}

/** Read a JSDoc tag's text off a declaration. */
function jsDocTags(symbol, checker) {
  const out = {};
  for (const tag of symbol.getJsDocTags(checker)) {
    const text = ts.displayPartsToString(tag.text ?? []).trim();
    if (out[tag.name]) out[tag.name] = [].concat(out[tag.name], text);
    else out[tag.name] = text;
  }
  return out;
}

function docText(symbol, checker) {
  return ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
}

/**
 * Render a prop's type.
 *
 * We prefer the type EXACTLY AS WRITTEN (`decl.type.getText()`) over the checker's
 * resolved form. Resolution is correct but useless here: `ReactNode` expands to a
 * ~900-character union carrying absolute node_modules paths, which wastes prompt
 * tokens, breaks markdown tables, and tells a reader less than the alias did.
 *
 * The checker is still what discovers the property, filters inherited DOM
 * attributes, and decides optionality — we just don't render its output when the
 * author already wrote something clearer.
 */
function renderType(checker, prop, decl) {
  const written = ts.isPropertySignature(decl) && decl.type ? decl.type.getText() : null;
  if (written) return written.replace(/\s+/g, ' ');

  const resolved = checker.getTypeOfSymbolAtLocation(prop, decl);
  return checker
    .typeToString(resolved, decl, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias)
    .replace(/\s+/g, ' ');
}

/**
 * Extract the public prop surface of `<Name>Props`.
 * Only properties declared inside `componentDir` are kept — see file header.
 */
function extractProps(checker, typeSymbol, componentDir) {
  const type = checker.getDeclaredTypeOfSymbol(typeSymbol);
  const props = [];

  for (const prop of checker.getPropertiesOfType(type)) {
    const decl = prop.declarations?.[0];
    if (!decl) continue;

    // own-file filter: drop inherited DOM/React attributes
    const declDir = dirname(decl.getSourceFile().fileName);
    if (resolve(declDir) !== resolve(componentDir)) continue;

    const tags = jsDocTags(prop, checker);

    props.push({
      name: prop.getName(),
      type: renderType(checker, prop, decl),
      required: !(prop.flags & ts.SymbolFlags.Optional),
      default: typeof tags.default === 'string' ? tags.default.replace(/^'|'$/g, '') : null,
      description: docText(prop, checker),
    });
  }

  return props.sort((a, b) => a.name.localeCompare(b.name));
}

/** Walk every component folder and return its structured description. */
export function extractComponents(root) {
  const { program } = createProgram(root);
  const checker = program.getTypeChecker();
  const components = [];

  for (const tier of TIERS) {
    const tierDir = join(root, 'src/components', tier);
    if (!existsSync(tierDir)) continue;

    for (const name of readdirSync(tierDir)) {
      const dir = join(tierDir, name);
      if (!statSync(dir).isDirectory()) continue;
      if (!existsSync(join(dir, `${name}.tsx`))) continue;

      const typesPath = join(dir, `${name}.types.ts`);
      const source = program.getSourceFile(typesPath);

      let props = [];
      let description = '';
      let tags = {};

      if (source) {
        const moduleSymbol = checker.getSymbolAtLocation(source);
        const exports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];
        const propsSymbol = exports.find((s) => s.getName() === `${name}Props`);
        if (propsSymbol) {
          props = extractProps(checker, propsSymbol, dir);
          description = docText(propsSymbol, checker).split('\n')[0] ?? '';
          tags = jsDocTags(propsSymbol, checker);
        }
      }

      components.push({
        name,
        tier,
        path: `src/components/${tier}/${name}`,
        importPath: `@${tier}/${name}`,
        description: description || `${name} component.`,
        status: tags.deprecated !== undefined ? 'deprecated' : (tags.status ?? 'stable'),
        tags: [].concat(tags.tag ?? []).filter(Boolean),
        declaredTier: tags.tier ?? null,
        props,
        hasStory: existsSync(join(dir, `${name}.stories.tsx`)),
        hasTest: existsSync(join(dir, `${name}.test.tsx`)),
      });
    }
  }

  return components.sort((a, b) =>
    a.tier === b.tier
      ? a.name.localeCompare(b.name)
      : TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier),
  );
}

export { TIERS };
