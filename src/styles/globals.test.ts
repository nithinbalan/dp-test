/**
 * Global element rules must live in `@layer base`.
 *
 * Tailwind v4 emits utilities inside `@layer utilities`, and unlayered CSS beats
 * every layer regardless of specificity. An unlayered `:focus-visible { outline }`
 * therefore overrode `outline-none` on every control that draws its own ring —
 * Input, Select, Textarea, Button… — and painted a second box inside the ring.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import tailwind from '@tailwindcss/postcss';
import postcss, { AtRule, type Node, type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');
const SOURCE = resolve(ROOT, 'src/styles/globals.css');

/** At-rules whose children are not competing with utilities in the cascade. */
const EXEMPT_PARENTS = new Set(['layer', 'keyframes']);

/** Theme-level declarations the generated token files set on `:root`. */
function isTokenDeclaration(prop: string): boolean {
  return prop.startsWith('--') || prop === 'color-scheme';
}

function isExemptByParent(rule: Rule): boolean {
  let node: Node | undefined = rule.parent;
  while (node) {
    if (node instanceof AtRule && EXEMPT_PARENTS.has(node.name)) return true;
    node = node.parent;
  }
  return false;
}

describe('globals.css cascade layers', () => {
  it('keeps element and pseudo-class rules out of the unlayered cascade', async () => {
    const result = await postcss([tailwind({ base: ROOT })]).process(readFileSync(SOURCE, 'utf8'), {
      from: SOURCE,
    });

    const offenders: string[] = [];
    postcss.parse(result.css).walkRules((rule) => {
      if (isExemptByParent(rule)) return;
      // Named classes (`.scrollbar-inverse`) are opt-in and cannot collide with a utility.
      if (rule.selectors.every((selector) => selector.trim().startsWith('.'))) return;
      // All-`!important` rules (reduced motion) are deliberate overrides of everything.
      const decls = rule.nodes.filter((node) => node.type === 'decl');
      if (decls.length > 0 && decls.every((decl) => decl.important)) return;
      // Token declarations (`:root { --s-…; color-scheme }`) never collide with a utility.
      if (decls.length > 0 && decls.every((decl) => isTokenDeclaration(decl.prop))) return;
      offenders.push(rule.selector);
    });

    expect(offenders).toEqual([]);
  }, 60_000);
});
