/**
 * Atomic-design dependency direction. A component may only import from a
 * STRICTLY LOWER tier (plus @shared/*, which is tier-neutral).
 *
 *   pages/routes -> templates -> organisms -> molecules -> atoms
 *
 * Also bans same-tier imports between siblings for atoms and molecules:
 * an atom composing another atom is a molecule by definition, and letting it
 * happen quietly is how a "design system" turns into a pile of components.
 */
'use strict';

const TIERS = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];

function tierOfPath(p) {
  const norm = p.replace(/\\/g, '/');
  if (/\/src\/app\//.test(norm) || /^src\/app\//.test(norm)) return 'pages';
  const m = norm.match(/components\/(atoms|molecules|organisms|templates)\//);
  return m ? m[1] : null;
}

function tierOfImport(src) {
  const alias = src.match(/^@(atoms|molecules|organisms|templates)\//);
  if (alias) return alias[1];
  const rel = src.match(/components\/(atoms|molecules|organisms|templates)\//);
  return rel ? rel[1] : null;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce one-way atomic-design tier dependencies.' },
    schema: [],
    messages: {
      upward:
        'Tier violation: a {{from}} component may not import from {{to}} (equal or higher tier). Dependencies flow atoms -> molecules -> organisms -> templates -> pages. See docs/DESIGN_SYSTEM.md §Tier boundaries.',
      sibling:
        'Tier violation: {{from}} composing another {{to}} makes it a {{promote}}. Move the file up a tier instead. See docs/DESIGN_SYSTEM.md §Tier boundaries.',
    },
  },
  create(context) {
    const from = tierOfPath(context.filename ?? context.getFilename());
    if (!from) return {};

    function check(node, source) {
      const to = tierOfImport(source);
      if (!to) return;
      const fromIdx = TIERS.indexOf(from);
      const toIdx = TIERS.indexOf(to);
      if (toIdx < fromIdx) return; // lower tier: allowed

      if (toIdx === fromIdx) {
        if (from === 'atoms' || from === 'molecules') {
          const promote = TIERS[fromIdx + 1];
          context.report({ node, messageId: 'sibling', data: { from, to, promote } });
        }
        return;
      }
      context.report({ node, messageId: 'upward', data: { from, to } });
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') check(node, node.source.value);
      },
    };
  },
};
